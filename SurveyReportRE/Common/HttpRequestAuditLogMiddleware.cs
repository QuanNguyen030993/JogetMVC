using System.Data;
using System.Text;
using System.Text.Json;
using Dapper;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using RESurveyTool.Models.Models.Parsing;
using SurveyReportRE.Common;
using SurveyReportRE.Controllers.Base;
using SurveyReportRE.ControllerUtil;


//using Microsoft.IO;
//using System.Data;
//using Dapper;

using SurveyReportRE.Models.Migration.Config;

public sealed class HttpRequestAuditMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<HttpRequestAuditMiddleware> _logger;
    private static bool AUDIT_LOG = false;
    //private readonly RecyclableMemoryStreamManager _ms = new();

    // Tùy chỉnh: chỉ log api
    private const bool OnlyApi = true;

    // Tùy chỉnh: giới hạn body để tránh quá nặng DB
    private const int MaxBodyChars = 20_000;

    // nếu bạn cần log user từ context/config như code cũ
    private readonly IHttpContextAccessor _httpContextAccessor;
    public IConfiguration _baseConfiguration { get; set; }

    private readonly string _connectionString;

    public HttpRequestAuditMiddleware(RequestDelegate next, ILogger<HttpRequestAuditMiddleware> logger,
        IConfiguration config,
        IHttpContextAccessor httpContextAccessor)
    {
        _next = next;
        _logger = logger;
        _httpContextAccessor = httpContextAccessor;
        _baseConfiguration = config;
        _connectionString = _baseConfiguration.GetConnectionString("Default" + "Connection");
        List<Dictionary<string, object>> resultList = new List<Dictionary<string, object>>();
        using (SqlConnection connection = new SqlConnection(_connectionString))
        {
            connection.Open();

            using (SqlCommand command = new SqlCommand($"SELECT TOP 1 [Value] FROM Constant WHERE ParameterName = '{nameof(HttpRequestAuditLog)}'", connection))
            {
                using (var reader = command.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        var row = new Dictionary<string, object>();

                        for (int i = 0; i < reader.FieldCount; i++)
                        {
                            var columnName = Char.ToLowerInvariant(reader.GetName(i)[0]) + reader.GetName(i).Substring(1);

                            //var columnName = reader.GetName(i); // Tên cột
                            var value = reader.IsDBNull(i) ? null : reader.GetValue(i); // Giá trị cột
                            row[columnName] = value; // Thêm vào dictionary
                        }
                        resultList.Add(row);
                    }


                }
            }
            connection.Close();

            //var valueStr = ((string)resultList.First().Value);
            //Util.QUERY_LOG = bool.Parse(valueStr);
            if (resultList.Count == 0)
            {
                AUDIT_LOG = false;
            }
            else
            {

                var valueStr = ((string)resultList[0].First().Value);
                AUDIT_LOG = bool.Parse(valueStr);
            }
        }
    }

    public async Task Invoke(HttpContext ctx, IHttpRequestAuditLogWriter writer)
    {
        var req = ctx.Request;

        // Filter sớm
        if (OnlyApi && !req.Path.StartsWithSegments("/api"))
        {
            await _next(ctx);
            return;
        }

        var sw = System.Diagnostics.Stopwatch.StartNew();

        // Snapshot info từ context trước khi next()
        var log = BuildBaseLog(ctx);

        // (Optional) đọc request body (JSON/form raw) - an toàn, có giới hạn
        //log.RequestBody = await TryReadRequestBodyAsync(ctx);
        log.RequestBody = "";
        Exception? ex = null;

        // Capture response status code (và có thể capture response body nếu cần)
        try
        {
            await _next(ctx);
        }
        catch (Exception e)
        {
            ex = e;
            throw;
        }
        finally
        {
            sw.Stop();

            log.StatusCode = ctx.Response?.StatusCode ?? 0;
            log.ElapsedMilliseconds = sw.ElapsedMilliseconds;

            if (ex != null)
            {
                log.HasException = true;
                log.Exception = ex.ToString();
            }

            // Ghi DB
            await writer.WriteAsync(log, _connectionString, AUDIT_LOG);

            // Log kỹ thuật (optional)
            //_logger.LogInformation("HTTP {Method} {Path} => {Status} ({Elapsed} ms) TraceId={TraceId}",
            //    log.Method, log.Path, log.StatusCode, log.ElapsedMilliseconds, log.TraceId);
        }
    }

    private static HttpRequestAuditLog BuildBaseLog(HttpContext ctx)
    {
        var req = ctx.Request;
        var user = ctx.User;

        // Route info (có thể null nếu chưa vào endpoint)
        var routeData = ctx.GetRouteData();
        var controller = routeData?.Values.TryGetValue("controller", out var c) == true ? c?.ToString() : null;
        var action = routeData?.Values.TryGetValue("action", out var a) == true ? a?.ToString() : null;

        // Route values JSON (bỏ những key rỗng)
        string? routeValuesJson = null;
        if (routeData?.Values != null && routeData.Values.Count > 0)
            routeValuesJson = JsonSerializer.Serialize(routeData.Values);

        // Claims JSON (optional)
        string? claimsJson = null;
        if (user?.Claims != null)
        {
            claimsJson = JsonSerializer.Serialize(
                user.Claims.Select(x => new { x.Type, x.Value })
            );
        }

        // X-Requested-With giúp phân biệt Ajax cổ điển; fetch thường không set header này
        var isAjax = req.Headers.TryGetValue("X-Requested-With", out var xrw)
                     && xrw.ToString().Equals("XMLHttpRequest", StringComparison.OrdinalIgnoreCase);

        return new HttpRequestAuditLog
        {
            TraceId = ctx.TraceIdentifier,
            RequestTimeUtc = DateTimeOffset.UtcNow,

            Scheme = req.Scheme,
            Method = req.Method,
            Path = req.Path.ToString(),
            QueryString = req.QueryString.Value,
            FullUrl = $"{req.Scheme}://{req.Host}{req.Path}{req.QueryString}",

            Controller = controller,
            Action = action,
            RouteValues = routeValuesJson,

            ClientIp = ctx.Connection.RemoteIpAddress?.ToString(),
            UserAgent = req.Headers["User-Agent"].ToString(),
            Referer = req.Headers["Referer"].ToString(),
            Token = req.Headers["X-Internal-Token"].ToString(),

            UserName = user?.Identity?.Name,
            IsAuthenticated = user?.Identity?.IsAuthenticated ?? false,
            AuthenticationType = user?.Identity?.AuthenticationType,
            Claims = claimsJson,

            ContentType = req.ContentType,
            ContentLength = req.ContentLength,

            Source = isAjax ? "Ajax" : "Direct",
            CustomTags = null
        };
    }

    //private async Task<string?> TryReadRequestBodyAsync(HttpContext ctx)
    //{
    //    var req = ctx.Request;

    //    // Không có body
    //    if (req.ContentLength is null || req.ContentLength == 0)
    //        return null;

    //    // Tránh log file upload / multipart
    //    if (!string.IsNullOrWhiteSpace(req.ContentType) &&
    //        req.ContentType.StartsWith("multipart/form-data", StringComparison.OrdinalIgnoreCase))
    //        return "[multipart/form-data omitted]";

    //    // Chỉ log các method thường có body
    //    if (!HttpMethods.IsPost(req.Method) && !HttpMethods.IsPut(req.Method) && !HttpMethods.IsPatch(req.Method))
    //        return null;

    //    // Cho phép đọc lại body nhiều lần
    //    req.EnableBuffering();

    //    // Đọc stream với giới hạn
    //    using var ms = _ms.GetStream();
    //    await req.Body.CopyToAsync(ms);
    //    ms.Position = 0;

    //    using var reader = new StreamReader(ms, Encoding.UTF8, detectEncodingFromByteOrderMarks: false, leaveOpen: true);
    //    var body = await reader.ReadToEndAsync();

    //    // Reset để downstream vẫn đọc được body
    //    req.Body.Position = 0;

    //    if (string.IsNullOrWhiteSpace(body))
    //        return null;

    //    // Truncate để không nặng DB
    //    if (body.Length > MaxBodyChars)
    //        body = body.Substring(0, MaxBodyChars) + $"... [truncated {body.Length - MaxBodyChars} chars]";

    //    // (Optional) mask token/password đơn giản
    //    body = MaskSensitive(body);

    //    return body;
    //}

    private static string MaskSensitive(string body)
    {
        // Mask rất đơn giản; bạn có thể thay bằng regex/JSON parse tuỳ schema
        // Tránh lưu Bearer token, password,...
        body = body.Replace("Bearer ", "Bearer ***", StringComparison.OrdinalIgnoreCase);
        return body;
    }
}
public interface IHttpRequestAuditLogWriter
{
    Task WriteAsync(HttpRequestAuditLog log, string _connectionString, bool AUDIT_LOG);
}

public sealed class HttpRequestAuditLogWriter : IHttpRequestAuditLogWriter
{

    public Task WriteAsync(HttpRequestAuditLog log, string _connectionString, bool AUDIT_LOG)
    {
        if (AUDIT_LOG)
        {
            using (var connection = new SqlConnection(_connectionString))
            {
                connection.Open();
                string insertQuery = @"
            INSERT INTO HttpRequestAuditLog
            (TraceId, RequestTimeUtc, Scheme, Method, Path, QueryString, FullUrl,
             Controller, Action, RouteValues,
             ClientIp, UserAgent, Referer,
             UserName, IsAuthenticated, AuthenticationType, Claims,
             ContentType, ContentLength, RequestBody,
             StatusCode, ElapsedMilliseconds,
             HasException, Exception,
             Source, CustomTags, Token, EncryptMethod)
            VALUES
            (@TraceId, @RequestTimeUtc, @Scheme, @Method, @Path, @QueryString, @FullUrl,
             @Controller, @Action, @RouteValues,
             @ClientIp, @UserAgent, @Referer,
             @UserName, @IsAuthenticated, @AuthenticationType, @Claims,
             @ContentType, @ContentLength, @RequestBody,
             @StatusCode, @ElapsedMilliseconds,
             @HasException, @Exception,
             @Source, @CustomTags, @Token, @EncryptMethod);";
                dynamic? inserted = null;
                try
                {
                    connection.Execute(insertQuery, log);

                }
                catch (Exception ex)
                {

                }
                connection.Close();
            }
        }
        return Task.CompletedTask;
    }
}
