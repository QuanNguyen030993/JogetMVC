using Dapper;
using MailKit.Search;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using ERPCore.Common;
using ERPCore.Controllers.Base;
using ERPCore.Models.Migration.Config;
using System.Data;

[ApiController]
[Route("api/[controller]/[action]")]
public class HttpRequestAuditLogController : BaseControllerApi<HttpRequestAuditLog>
{
    private readonly IBaseRepository<HttpRequestAuditLog> _BaseRepository;
    private readonly IConfiguration configuration;
    private readonly IHttpContextAccessor _httpContextAccessor;
    public HttpRequestAuditLogController(IBaseRepository<HttpRequestAuditLog> BaseRepository, IConfiguration config, IHttpContextAccessor httpContextAccessor) : base(BaseRepository, httpContextAccessor)
    {
        configuration = config;
        _BaseRepository = BaseRepository;
        _httpContextAccessor = httpContextAccessor;
    }

    [HttpPost]
    public object Query([FromBody] string query)
    {
        string baseQuery = "usp_Evaluation_GetData";
        DataTable dt = DataUtil.ExecuteStoredProcedureReturn(
            _BaseRepository._connectionString,
            baseQuery,
            ("Type", "httpLogChart"),
            ("Query", query)
        );
        List<Dictionary<string, object>> result = new List<Dictionary<string, object>>();

        foreach (DataRow row in dt.Rows)
        {
            Dictionary<string, object> rowData = new Dictionary<string, object>();

            foreach (DataColumn col in dt.Columns)
            {
                var value = row[col];

                // xử lý DBNull
                rowData[col.ColumnName] = value == DBNull.Value ? null : value;
            }

            result.Add(rowData);
        }

        return result;
    }


//    [HttpGet("api/audit/http-log-chart")]
//    public async Task<IActionResult> GetHttpLogChart([FromQuery] HttpLogChartQuery q)
//    {
//        // default range nếu không truyền: all-time (không filter)
//        // nhưng nên giới hạn nếu DB quá lớn (sau tối ưu index/partition)

//        string timeBucketExpr = q.Interval.ToLower() switch
//        {
//            "year" => "DATEFROMPARTS(YEAR(CreatedDate), 1, 1)",
//            "month" => "DATEFROMPARTS(YEAR(CreatedDate), MONTH(CreatedDate), 1)",
//            _ => "CAST(CreatedDate AS date)"
//        };

//        // Dimension label expr
//        string dimExpr = q.Dimension.ToLower() switch
//        {
//            "action" => "[Action]",
//            "controller" => "Controller",
//            "method" => "Method",
//            "endpoint" => "CONCAT(Controller, '.', [Action])",
//            _ => "NULL"
//        };

//        // Base WHERE
//        var where = @"
//WHERE 1=1
//  AND (@From IS NULL OR CreatedDate >= @From)
//  AND (@To   IS NULL OR CreatedDate <  @To)
//  AND (@Method IS NULL OR Method = @Method)
//  AND (@Controller IS NULL OR Controller = @Controller)
//  AND (@Action IS NULL OR [Action] = @Action)
//";

//        // 1) Total trend: bucket theo time
//        if (q.Dimension.Equals("total", StringComparison.OrdinalIgnoreCase))
//        {
//            string sql = $@"
//SELECT
//    {timeBucketExpr} AS [t],
//    COUNT(*) AS [count]
//FROM HttpRequestAuditLog WITH (NOLOCK)
//{where}
//GROUP BY {timeBucketExpr}
//ORDER BY [t];";

//            var data = await _conn.QueryAsync(sql, q);
//            return Ok(data);
//        }

//        // 2) Trend theo dimension: time + dimension (multi-series)
//        //    (phục vụ: EnumLookup tăng khi nào)
//        {
//            // Nếu muốn topN theo toàn khoảng thời gian để giảm series:
//            // - chọn top dim trước
//            // - rồi trả trend chỉ cho top dim
//            // (mình làm luôn 2-phase để chart đỡ nặng)
//            string topSql = $@"
//SELECT TOP (@TopN)
//    {dimExpr} AS [dim],
//    COUNT(*) AS [totalCount]
//FROM HttpRequestAuditLog WITH (NOLOCK)
//{where}
//GROUP BY {dimExpr}
//ORDER BY COUNT(*) DESC;";

//            var topDims = (await _conn.QueryAsync<string>(topSql, q)).ToList();
//            if (topDims.Count == 0) return Ok(Array.Empty<object>());

//            // build IN list params
//            var p = new DynamicParameters(q);
//            for (int i = 0; i < topDims.Count; i++)
//                p.Add($"Dim{i}", topDims[i]);

//            string inList = string.Join(", ", Enumerable.Range(0, topDims.Count).Select(i => $"@Dim{i}"));

//            string trendSql = $@"
//SELECT
//    {timeBucketExpr} AS [t],
//    {dimExpr} AS [dim],
//    COUNT(*) AS [count]
//FROM HttpRequestAuditLog WITH (NOLOCK)
//{where}
//  AND {dimExpr} IN ({inList})
//GROUP BY {timeBucketExpr}, {dimExpr}
//ORDER BY [t];";

//            var data = await _conn.QueryAsync(trendSql, p);
//            return Ok(data);
//        }
//    }

}

public class HttpLogChartQuery
{
    public DateTime? From { get; set; }
    public DateTime? To { get; set; }

    // "day" | "month" | "year"
    public string Interval { get; set; } = "day";

    // "total" | "action" | "controller" | "endpoint" | "method"
    public string Dimension { get; set; } = "total";

    public int TopN { get; set; } = 10;

    public string? Method { get; set; }
    public string? Controller { get; set; }
    public string? Action { get; set; }
}
