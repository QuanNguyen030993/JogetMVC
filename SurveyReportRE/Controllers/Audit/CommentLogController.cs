using DocumentFormat.OpenXml.Office2013.Excel;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using ERPCore.Controllers.Base;
using ERPCore.Models.Migration.Business.Config;
using System.Data;
using ERPCore.ControllerUtil;
using ERPCore.Common;
using System.Net;
using ERPCore.Models.Base;
using DocumentFormat.OpenXml.Wordprocessing;
using System.Text.RegularExpressions;
using MimeKit;
using DocumentFormat.OpenXml.Bibliography;
using Microsoft.SharePoint.Taxonomy.WebServices;
using ERPCore.Models;
using ERPCore.Models.Business.Migration.Config;
using System.Dynamic;

[ApiController]
[Route("api/[controller]/[action]")]
public class CommentLogController : BaseControllerApi<CommentLog>
{
    private readonly IBaseRepository<CommentLog> _BaseRepository;
    private readonly IConfiguration configuration;
    private readonly IBaseRepository<Survey> _surveyRepository;
    private readonly IBaseRepository<ERPCore.Models.Migration.Business.Data.Attachment> _attachmentRepository;
    private readonly IBaseRepository<Users> _usersRepository;
    private readonly IConfigurationSection path;
    private readonly Microsoft.Extensions.Options.IOptionsMonitor<BlobStorageSettings> _blobStorageSettings;
    private static string Query;
    public CommentLogController(IBaseRepository<CommentLog> BaseRepository
        , IConfiguration config
        , IHttpContextAccessor httpContextAccessor
        , ILogger<CommentLog> logger
        , Microsoft.Extensions.Options.IOptionsMonitor<BlobStorageSettings> blobStorageSettings
        ) : base(BaseRepository, httpContextAccessor
            )
    {
        configuration = config;
        _BaseRepository = BaseRepository;
        _attachmentRepository = new BaseRepository<ERPCore.Models.Migration.Business.Data.Attachment>(configuration, _httpContextAccessor);
        _usersRepository = new BaseRepository<Users>(configuration, _httpContextAccessor);
        path = _BaseRepository._baseConfiguration.GetSection("BlobStorage:Path");
        _blobStorageSettings = blobStorageSettings;
    }

    //[HttpPost]
    //public override async Task<object> ExecuteCustomQuery([FromBody] string query)
    //{
    //    List<Dictionary<string, object>> obj = new List<Dictionary<string, object>>();
    //    if (Query != query && !query.Contains("@"))
    //    {
    //        Query = query;
    //    }

    //    var controllerName = ControllerContext.RouteData.Values["controller"]?.ToString();
    //    BaseRepository<SysTable> sysTableRepo = new BaseRepository<SysTable>(_BaseRepository._baseConfiguration, _httpContextAccessor);
    //    SysTable sysTable = await sysTableRepo.GetSingleObject(s => s.Name == controllerName);

    //    var requestParams = HttpContext.Request.Query.ToList();
    //    IDictionary<string, object> dynamicObj = new ExpandoObject { };
    //    foreach (var item in requestParams)
    //    {
    //        dynamicObj[item.Key] = item.Value;
    //    }
    //    var Base = new List<CommentLog>();
    //    if (requestParams != null && requestParams.Count > 0)
    //    {
    //        if (dynamicObj.ContainsKey("key"))
    //        {
    //            var built = Util.LoadParamsBuildCustomQuery<object>(
    //                baseQuery: sysTable.CustomQuery,
    //                loadParams: requestParams,
    //                defaultOrderBy: "CommentId",
    //                defaultOrderDir: "DESC",
    //                pkTieBreaker: "CommentId",
    //                mainTableAlias: null,
    //                allowedColumns: new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    //                {
    //                            "Id",
    //                            "Guid",
    //                            "CreatedBy",
    //                            "CreatedDate",
    //                            "Deleted"
    //                }
    //            );
    //            sysTable.CustomQuery = built.Sql;
    //            return obj = await _BaseRepository.ExecuteCustomLogQuery(sysTable.CustomQuery, built.Parameters);
    //        }
    //    }
    //    obj = await _BaseRepository.ExecuteCustomLogQuery(sysTable.CustomQuery);

    //    return obj;
    //}


    [HttpGet]
    public async Task<IActionResult> GetSeriLog()
    {
        string query = "SELECT TOP 1000 * FROM Logs ORDER BY Id DESC";
        var obj = await _BaseRepository.ExecuteCustomLogQuery(query);
        return Ok(obj);
    }

    [HttpGet]
    public async Task<IActionResult> GetSerilogHourlyToday()
    {
        string query = @"
WITH Hours AS
(
    SELECT 0 AS [hour]
    UNION ALL
    SELECT [hour] + 1 FROM Hours WHERE [hour] < 23
), LogCounts AS
(
    SELECT DATEPART(hour, [TimeStamp]) AS [hour], COUNT_BIG(1) AS [count]
    FROM Logs WITH (NOLOCK)
    WHERE [TimeStamp] >= CAST(GETDATE() AS date)
      AND [TimeStamp] < DATEADD(day, 1, CAST(GETDATE() AS date))
    GROUP BY DATEPART(hour, [TimeStamp])
)
SELECT h.[hour], ISNULL(l.[count], 0) AS [count]
FROM Hours h
LEFT JOIN LogCounts l ON l.[hour] = h.[hour]
ORDER BY h.[hour]
OPTION (MAXRECURSION 24);";
        var result = await _BaseRepository.ExecuteCustomLogQuery(query);
        return Ok(result);
    }

    [HttpPost]
    public override async Task<object> ExecuteCustomQuery([FromBody] string query)
    {
        List<Dictionary<string, object>> obj = new List<Dictionary<string, object>>();
        if (Query != query && !string.IsNullOrWhiteSpace(query) && !query.Contains("@"))
        {
            Query = query;
        }
        var controllerName = ControllerContext.RouteData?.Values["controller"]?.ToString() ?? "CommentLog";
        BaseRepository<SysTable> sysTableRepo = new BaseRepository<SysTable>(_BaseRepository._baseConfiguration, _httpContextAccessor);
        SysTable sysTable = await sysTableRepo.GetSingleObject(s => s.Name == controllerName);
      

        var rawRequestParams = _httpContextAccessor.HttpContext.Request.Query.ToList();
        // Chuẩn hóa:
        // - cặp đầu tiên refField/refKey => refField/refKey
        // - các cặp sau => điều kiện AND
        IDictionary<string, object> dynamicObj = new ExpandoObject();
        foreach (var item in rawRequestParams)
        {
            dynamicObj[item.Key] = item.Value;
        }
        if (rawRequestParams != null && rawRequestParams.Count > 0)
        {
            if (dynamicObj.ContainsKey("refKey") || dynamicObj.ContainsKey("key"))
            {
                var normalizedParams = Util.NormalizeRefParams(rawRequestParams);

                // RecordGuid is a uniqueidentifier in the log database. Do not let
                // JavaScript values such as "null"/"undefined", or malformed GUIDs,
                // reach SQL Server as strings because SQL would try (and fail) to
                // convert them to uniqueidentifier.
                if (normalizedParams.TryGetValue("RecordGuid", out var recordGuidFilter))
                {
                    var recordGuidOperator = recordGuidFilter.operators?.Trim().ToLowerInvariant() ?? "=";

                    if (recordGuidOperator == "in")
                    {
                        var validRecordGuids = recordGuidFilter.value
                            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                            .Select(value => Guid.TryParse(value, out var guid) ? guid : (Guid?)null)
                            .Where(guid => guid.HasValue)
                            .Select(guid => guid!.Value.ToString())
                            .Distinct(StringComparer.OrdinalIgnoreCase)
                            .ToArray();

                        if (validRecordGuids.Length == 0)
                            return new List<Dictionary<string, object>>();

                        normalizedParams["RecordGuid"] = (
                            string.Join(',', validRecordGuids),
                            recordGuidOperator
                        );
                    }
                    else
                    {
                        if (recordGuidOperator is not ("=" or "<>"))
                            return new List<Dictionary<string, object>>();

                        if (!Guid.TryParse(recordGuidFilter.value, out var recordGuid))
                            return new List<Dictionary<string, object>>();

                        normalizedParams["RecordGuid"] = (
                            recordGuid.ToString(),
                            recordGuidOperator
                        );
                    }
                }

                var built = Util.LoadParamsBuildCustomQuery<object>(
                    baseQuery: query == "OnSystem" ? sysTable?.CustomQuery : Query,
                    loadParams: normalizedParams,
                    defaultOrderBy: "CommentId",
                    defaultOrderDir: "DESC",
                    pkTieBreaker: "CommentId",
                    mainTableAlias: null,
                    allowedColumns: new HashSet<string>(StringComparer.OrdinalIgnoreCase)
                    {
                   "Id",
                   "Guid",
                   "CreatedBy",
                   "CreatedDate",
                   "Deleted",
                   "FromDepartment",
                   "ToDepartment",
                   "CommentType",
                   "CommentBy",
                   "CommentText",
                   "RecordGuid",
                   "CommentId"
                    }
                );

              

                sysTable.CustomQuery = built.Sql;
                return await _BaseRepository.ExecuteCustomLogQuery(built.Sql, built.Parameters);
            }
        }
        obj = await _BaseRepository.ExecuteCustomLogQuery(query == "OnSystem" ? sysTable.CustomQuery : Query);
        return obj;
    }


    public async Task BulkInsertCommentLogAsync(List<CommentLog> data)
    {
        var dt = new DataTable();

        // Khởi tạo cột (phải khớp DB)
        foreach (var prop in typeof(CommentLog).GetProperties())
        {
            dt.Columns.Add(prop.Name, typeof(string));
        }

        // Gán dữ liệu
        foreach (var item in data)
        {
            var row = dt.NewRow();
            foreach (var prop in typeof(CommentLog).GetProperties())
            {
                row[prop.Name] = prop.GetValue(item) ?? DBNull.Value;
            }
            dt.Rows.Add(row);
        }

        // Bulk insert
        using var connection = new SqlConnection(_BaseRepository._connectionString);
        await connection.OpenAsync();
        using var bulkCopy = new SqlBulkCopy(connection)
        {
            DestinationTableName = "dbo.CommentLog", // Đảm bảo đúng tên bảng
            BulkCopyTimeout = 60
        };

        await bulkCopy.WriteToServerAsync(dt);
    }



}
