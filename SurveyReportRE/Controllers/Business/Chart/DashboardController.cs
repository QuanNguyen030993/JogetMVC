using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json.Linq;

[ApiController]
[Route("api/[controller]/[action]")]
public class DashboardController : ControllerBase
{
    private readonly IBaseRepository<Quotation> _quotationRepository;

    public DashboardController(IBaseRepository<Quotation> quotationRepository)
    {
        _quotationRepository = quotationRepository;
    }

    [HttpGet]
    public async Task<IActionResult> Workload()
    {
        const string query = """
            SELECT CreatedDate,PIC, StageAccount,'Quotation' AS 'type', StageDept,CASE WHEN WorkflowStatus LIKE '% Pending' THEN 'Pending' 
                     																		 WHEN WorkflowStatus = 'Quotation confirmed' THEN 'Completed'
                     																		 ELSE 'InProgress' END
            AS 'OverallStatus'  
            FROM Quotation
            WHERE StageDept IN ('FO','TS','LMKT','PM','UW')
            UNION 
            SELECT CreatedDate,PIC, StageAccount,'Policy Issuance' AS 'type', StageDept, CASE WHEN WorkflowStatus LIKE '% Pending' THEN 'Pending' 
                     																		 WHEN WorkflowStatus = 'Quotation confirmed' THEN 'Completed'
                     																		 ELSE 'InProgress' END
            AS 'OverallStatus'  FROM
            PolicyIssuance
             WHERE StageDept IN ('FO','TS','LMKT','PM','UW')
            """;

        var rows = await _quotationRepository.ExecuteCustomQuery(query);
        var result = new Dictionary<string, DashboardWorkloadItem>(StringComparer.OrdinalIgnoreCase);

        foreach (var row in rows)
        {
            var picJson = GetRowValue(row, "pIC")?.ToString();
            var type = GetRowValue(row, "type")?.ToString()?.Trim() ?? "Unknown";
            var createdDate = ParseDate(GetRowValue(row, "createdDate"));
            var stageDept = GetRowValue(row, "stageDept")?.ToString();
            var stageAccount = GetRowValue(row, "stageAccount")?.ToString();
            var date = createdDate?.ToString("yyyy-MM-dd") ?? "";
            var status = GetRowValue(row, "overallStatus")?.ToString()?.Trim();
            if (string.IsNullOrWhiteSpace(status))
                status = GetRowValue(row, "workflowStatus")?.ToString()?.Trim();
            status = string.IsNullOrWhiteSpace(status) ? "Unknown" : status;

            foreach (var assignment in ParseAssignments(picJson))
            {
                var key = string.Join("\u001f", assignment.Department, assignment.Member, type, status, date);
                if (!result.TryGetValue(key, out var item))
                {
                    item = new DashboardWorkloadItem
                    {
                        Department = stageDept ?? "",
                        Member = stageAccount ?? "",
                        Type = type,
                        Status = status,
                        Date = date,
                        Year = createdDate?.Year,
                        Month = createdDate?.Month,
                        Quarter = createdDate.HasValue ? ((createdDate.Value.Month - 1) / 3) + 1 : null
                    };
                    result[key] = item;
                }

                item.Count++;
            }
        }

        return Ok(result.Values
            .OrderBy(item => item.Department)
            .ThenBy(item => item.Member)
            .ThenBy(item => item.Type)
            .ThenBy(item => item.Status)
            .ToList());
    }

    private static object? GetRowValue(Dictionary<string, object> row, string fieldName)
    {
        return row.FirstOrDefault(item =>
            string.Equals(item.Key, fieldName, StringComparison.OrdinalIgnoreCase)).Value;
    }

    private static DateTime? ParseDate(object? value)
    {
        if (value is DateTime dateTime)
            return dateTime;
        if (value is DateTimeOffset dateTimeOffset)
            return dateTimeOffset.DateTime;

        return DateTime.TryParse(value?.ToString(), out var parsedDate)
            ? parsedDate
            : null;
    }

    private static IEnumerable<(string Department, string Member)> ParseAssignments(string? picJson)
    {
        if (string.IsNullOrWhiteSpace(picJson))
            yield break;

        JToken token;
        try
        {
            token = JToken.Parse(picJson);
            if (token.Type == JTokenType.String)
                token = JToken.Parse(token.Value<string>() ?? "{}");
        }
        catch
        {
            yield break;
        }

        if (token is not JObject picObject)
            yield break;

        foreach (var property in picObject.Properties())
        {
            var department = property.Name.Trim().ToUpperInvariant();
            var rawMembers = property.Value.Type == JTokenType.Array
                ? property.Value.Values<string>()
                : new[] { property.Value.ToString() };

            foreach (var member in rawMembers
                .SelectMany(value => (value ?? "").Split(',', ';'))
                .Select(value => value.Trim())
                .Where(value => !string.IsNullOrWhiteSpace(value))
                .Distinct(StringComparer.OrdinalIgnoreCase))
            {
                yield return (department, member);
            }
        }
    }

    private sealed class DashboardWorkloadItem
    {
        public string Department { get; set; } = "";
        public string Member { get; set; } = "";
        public string Type { get; set; } = "";
        public string Status { get; set; } = "";
        public int Count { get; set; }
        public string Date { get; set; } = "";
        public int? Year { get; set; }
        public int? Month { get; set; }
        public int? Quarter { get; set; }
        public string Region { get; set; } = "N/A";
    }
}
