using System.Globalization;
using System.Text.RegularExpressions;
using Dapper;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Spreadsheet;
using ERPCore.Models.Migration.Business.MasterData;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Newtonsoft.Json;

namespace ERPCore.Controllers.Config;

[ApiController]
[Route("api/[controller]/[action]")]
public class TemplateExcelImportController : ControllerBase
{
    private const long MaxFileSize = 20 * 1024 * 1024;
    private readonly string _connectionString;

    public TemplateExcelImportController(IBaseRepository<MailTemplate> repository)
    {
        _connectionString = repository._connectionString;
    }

    [HttpPost]
    [RequestSizeLimit(MaxFileSize)]
    public async Task<IActionResult> Preview([FromForm] IFormFile? file)
    {
        var validation = ValidateUpload(file);
        if (validation != null) return validation;

        try
        {
            var workbook = ReadWorkbook(file!);
            await using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();
            return Ok(await BuildPreviewAsync(workbook, connection));
        }
        catch (Exception exception) when (exception is InvalidDataException or FormatException)
        {
            return BadRequest(new { message = exception.Message });
        }
    }

    [HttpPost]
    [RequestSizeLimit(MaxFileSize)]
    public async Task<IActionResult> Import([FromForm] IFormFile? file, [FromForm] string? sections)
    {
        var validation = ValidateUpload(file);
        if (validation != null) return validation;

        var requestedSections = (sections ?? string.Empty)
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);
        requestedSections.IntersectWith(["mail", "notification", "status"]);
        if (requestedSections.Count == 0)
            return BadRequest(new { message = "Vui lòng chọn ít nhất một nhóm dữ liệu để import." });

        try
        {
            var workbook = ReadWorkbook(file!);
            await using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();
            var preview = await BuildPreviewAsync(workbook, connection);
            var selected = preview.Sections.Where(section => requestedSections.Contains(section.Code)).ToList();
            if (selected.Any(section => !section.CanImport))
            {
                return BadRequest(new
                {
                    message = "Nhóm đã chọn không còn bản ghi hợp lệ. Vui lòng kiểm tra lại trước khi import.",
                    preview
                });
            }

            await using var transaction = await connection.BeginTransactionAsync();
            try
            {
                var result = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
                foreach (var section in selected)
                {
                    var affected = 0;
                    foreach (var row in section.Rows.Where(item => item.IsValid))
                    {
                        affected += section.Code switch
                        {
                            "mail" => await connection.ExecuteAsync(@"
                                UPDATE dbo.MailTemplate
                                SET TemplateMailTitle = @Title, TemplateContent = @Content
                                WHERE Id = @DatabaseId", row, transaction),
                            "notification" => await connection.ExecuteAsync(@"
                                UPDATE dbo.NotificationTemplate
                                SET Title = @Title, Content = @Content
                                WHERE Id = @DatabaseId", row, transaction),
                            "status" => await connection.ExecuteAsync(@"
                                UPDATE dbo.EnumData
                                SET [Value] = @Title, MappingField = @Content
                                WHERE Id = @DatabaseId AND [Name] = 'OverallStatus'", row, transaction),
                            _ => 0
                        };
                    }
                    result[section.Code] = affected;
                }

                await transaction.CommitAsync();
                return Ok(new { message = "Import dữ liệu thành công.", updated = result });
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }
        catch (Exception exception) when (exception is InvalidDataException or FormatException)
        {
            return BadRequest(new { message = exception.Message });
        }
    }

    private IActionResult? ValidateUpload(IFormFile? file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "Vui lòng chọn file Excel." });
        if (file.Length > MaxFileSize)
            return BadRequest(new { message = "File Excel không được vượt quá 20 MB." });
        if (!string.Equals(Path.GetExtension(file.FileName), ".xlsx", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { message = "Chỉ hỗ trợ file Excel định dạng .xlsx." });
        return null;
    }

    private static WorkbookData ReadWorkbook(IFormFile file)
    {
        using var stream = file.OpenReadStream();
        using var document = SpreadsheetDocument.Open(stream, false);
        var workbookPart = document.WorkbookPart
            ?? throw new InvalidDataException("Không đọc được workbook trong file Excel.");
        var sharedStrings = workbookPart.SharedStringTablePart?.SharedStringTable?
            .Elements<SharedStringItem>()
            .Select(item => item.InnerText)
            .ToList() ?? [];

        var result = new WorkbookData();
        foreach (var sheet in workbookPart.Workbook.Sheets?.Elements<Sheet>() ?? [])
        {
            if (sheet.Id?.Value == null || sheet.Name?.Value == null) continue;
            if (workbookPart.GetPartById(sheet.Id.Value) is not WorksheetPart worksheetPart) continue;

            var rows = worksheetPart.Worksheet.GetFirstChild<SheetData>()?.Elements<Row>() ?? [];
            result.Sheets[sheet.Name.Value] = rows
                .Select(row => new SheetRow(
                    Convert.ToInt32(row.RowIndex?.Value ?? 0),
                    row.Elements<Cell>().ToDictionary(
                        cell => GetColumnName(cell.CellReference?.Value),
                        cell => ReadCell(cell, sharedStrings),
                        StringComparer.OrdinalIgnoreCase)))
                .ToList();
        }

        return result;
    }

    private static async Task<ImportPreview> BuildPreviewAsync(WorkbookData workbook, SqlConnection connection)
    {
        var mailRecords = (await connection.QueryAsync<TemplateRecord>(
            "SELECT Id, TemplateName FROM dbo.MailTemplate")).ToList();
        var notificationRecords = (await connection.QueryAsync<TemplateRecord>(
            "SELECT Id, TemplateName FROM dbo.NotificationTemplate")).ToList();
        var statusRecords = (await connection.QueryAsync<StatusRecord>(
            "SELECT Id, [Value] FROM dbo.EnumData WHERE [Name] = 'OverallStatus'")).ToList();

        var mail = BuildTemplateSection(
            workbook, ["Mail", "Email"], "mail", "MailTemplate",
            ["TemplateName"], ["Title"], ["Content"], mailRecords);
        var notification = BuildTemplateSection(
            workbook, ["Notification"], "notification", "NotificationTemplate",
            ["TemplateName", "Code"], ["Title"], ["Content"], notificationRecords);
        var status = BuildStatusSection(workbook, statusRecords);
        return new ImportPreview([mail, notification, status]);
    }

    private static ImportSection BuildTemplateSection(
        WorkbookData workbook,
        string[] sheetNames,
        string code,
        string label,
        string[] keyAliases,
        string[] titleAliases,
        string[] contentAliases,
        List<TemplateRecord> databaseRecords)
    {
        var section = new ImportSection(code, label);
        var sheet = FindSheet(workbook, sheetNames);
        if (sheet == null)
        {
            section.Error = $"Không tìm thấy sheet {string.Join(" hoặc ", sheetNames)}.";
            return section;
        }

        var parsed = ParseTable(sheet.Value.Rows, keyAliases, titleAliases, contentAliases);
        section.SheetName = sheet.Value.Name;
        if (parsed.Error != null)
        {
            section.Error = parsed.Error;
            return section;
        }

        var databaseByKey = databaseRecords
            .Where(record => !string.IsNullOrWhiteSpace(record.TemplateName))
            .GroupBy(record => record.TemplateName.Trim(), StringComparer.OrdinalIgnoreCase)
            .ToDictionary(group => group.Key, group => group.First(), StringComparer.OrdinalIgnoreCase);
        var duplicateKeys = parsed.Rows
            .Where(row => !string.IsNullOrWhiteSpace(row.Key))
            .GroupBy(row => row.Key.Trim(), StringComparer.OrdinalIgnoreCase)
            .Where(group => group.Count() > 1)
            .Select(group => group.Key)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        foreach (var source in parsed.Rows)
        {
            var row = new ImportRow { ExcelRow = source.ExcelRow, Key = source.Key, Title = source.Title, Content = source.Content };
            if (string.IsNullOrWhiteSpace(row.Key))
                row.Error = $"Thiếu {string.Join("/", keyAliases)}.";
            else if (duplicateKeys.Contains(row.Key.Trim()))
                row.Error = "Key bị trùng trong file Excel.";
            else if (!databaseByKey.TryGetValue(row.Key.Trim(), out var database))
                row.Error = "Không tìm thấy key tương ứng trong database.";
            else
                row.DatabaseId = database.Id;
            section.Rows.Add(row);
        }
        return section;
    }

    private static ImportSection BuildStatusSection(WorkbookData workbook, List<StatusRecord> databaseRecords)
    {
        var section = new ImportSection("status", "EnumData / OverallStatus");
        var sheet = FindSheet(workbook, ["Status"]);
        if (sheet == null)
        {
            section.Error = "Không tìm thấy sheet Status.";
            return section;
        }

        section.SheetName = sheet.Value.Name;
        var parsed = ParseTable(
            sheet.Value.Rows,
            ["Id"],
            ["Status Name"],
            ["GeneralStatus DashBaord", "General Status Dashboard"]);
        if (parsed.Error != null)
        {
            section.Error = parsed.Error;
            return section;
        }

        var databaseById = databaseRecords.ToDictionary(record => record.Id);
        var duplicateIds = parsed.Rows
            .Select(row => long.TryParse(row.Key, out var id) ? id : 0)
            .Where(id => id > 0)
            .GroupBy(id => id)
            .Where(group => group.Count() > 1)
            .Select(group => group.Key)
            .ToHashSet();

        foreach (var source in parsed.Rows)
        {
            var row = new ImportRow
            {
                ExcelRow = source.ExcelRow,
                Key = source.Key,
                Title = source.Title,
                Content = ToJsonString(source.Content)
            };
            if (!long.TryParse(row.Key, NumberStyles.Integer, CultureInfo.InvariantCulture, out var id) || id <= 0)
                row.Error = "Id không hợp lệ.";
            else if (duplicateIds.Contains(id))
                row.Error = "Id bị trùng trong file Excel.";
            else if (!databaseById.ContainsKey(id))
                row.Error = "Không tìm thấy Id thuộc EnumData/OverallStatus.";
            else if (string.IsNullOrWhiteSpace(row.Title))
                row.Error = "Thiếu Status Name.";
            else
                row.DatabaseId = id;
            section.Rows.Add(row);
        }
        return section;
    }

    private static ParsedTable ParseTable(
        List<SheetRow> rows,
        string[] keyAliases,
        string[] titleAliases,
        string[] contentAliases)
    {
        foreach (var candidate in rows.Take(30))
        {
            var headers = candidate.Cells
                .Where(cell => !string.IsNullOrWhiteSpace(cell.Value))
                .ToDictionary(cell => Normalize(cell.Value), cell => cell.Key, StringComparer.OrdinalIgnoreCase);
            var keyColumn = FindColumn(headers, keyAliases);
            var titleColumn = FindColumn(headers, titleAliases);
            var contentColumn = FindColumn(headers, contentAliases);
            if (keyColumn == null && titleColumn == null && contentColumn == null) continue;

            var missing = new List<string>();
            if (keyColumn == null) missing.Add(string.Join("/", keyAliases));
            if (titleColumn == null) missing.Add(string.Join("/", titleAliases));
            if (contentColumn == null) missing.Add(string.Join("/", contentAliases));
            if (missing.Count > 0)
                return new ParsedTable([], $"Thiếu cột bắt buộc: {string.Join(", ", missing)}.");

            var data = rows
                .Where(row => row.Number > candidate.Number)
                .Select(row => new ParsedRow(
                    row.Number,
                    GetValue(row, keyColumn!),
                    GetValue(row, titleColumn!),
                    GetValue(row, contentColumn!)))
                .Where(row => !string.IsNullOrWhiteSpace(row.Key)
                    || !string.IsNullOrWhiteSpace(row.Title)
                    || !string.IsNullOrWhiteSpace(row.Content))
                .ToList();
            return new ParsedTable(data, null);
        }
        return new ParsedTable([], "Không tìm thấy dòng tiêu đề hợp lệ.");
    }

    private static (string Name, List<SheetRow> Rows)? FindSheet(WorkbookData workbook, string[] names)
    {
        foreach (var name in names)
        {
            var found = workbook.Sheets.FirstOrDefault(sheet =>
                string.Equals(sheet.Key.Trim(), name, StringComparison.OrdinalIgnoreCase));
            if (!string.IsNullOrEmpty(found.Key)) return (found.Key, found.Value);
        }
        return null;
    }

    private static string? FindColumn(Dictionary<string, string> headers, IEnumerable<string> aliases)
    {
        foreach (var alias in aliases)
            if (headers.TryGetValue(Normalize(alias), out var column)) return column;
        return null;
    }

    private static string GetValue(SheetRow row, string column) =>
        row.Cells.TryGetValue(column, out var value) ? value.Trim() : string.Empty;

    private static string Normalize(string value) =>
        Regex.Replace(value.Trim().ToLowerInvariant(), "[^a-z0-9]", string.Empty);

    private static string GetColumnName(string? reference) =>
        Regex.Match(reference ?? string.Empty, "^[A-Za-z]+").Value.ToUpperInvariant();

    private static string ReadCell(Cell cell, IReadOnlyList<string> sharedStrings)
    {
        if (cell.DataType?.Value == CellValues.InlineString)
            return cell.InlineString?.InnerText ?? string.Empty;
        var value = cell.CellValue?.InnerText ?? cell.InnerText ?? string.Empty;
        if (cell.DataType?.Value == CellValues.SharedString
            && int.TryParse(value, out var index)
            && index >= 0
            && index < sharedStrings.Count)
            return sharedStrings[index];
        return value;
    }

    private static string ToJsonString(string value)
    {
        if (string.IsNullOrWhiteSpace(value)) return string.Empty;
        try
        {
            var token = JsonConvert.DeserializeObject(value);
            if (token != null) return JsonConvert.SerializeObject(token, Formatting.None);
        }
        catch (JsonException)
        {
            // Plain dashboard labels are stored as valid JSON strings.
        }
        return JsonConvert.SerializeObject(value.Trim(), Formatting.None);
    }

    private sealed class WorkbookData
    {
        public Dictionary<string, List<SheetRow>> Sheets { get; } = new(StringComparer.OrdinalIgnoreCase);
    }

    private sealed record SheetRow(int Number, Dictionary<string, string> Cells);
    private sealed record ParsedRow(int ExcelRow, string Key, string Title, string Content);
    private sealed record ParsedTable(List<ParsedRow> Rows, string? Error);
    private sealed record TemplateRecord(long Id, string TemplateName);
    private sealed record StatusRecord(long Id, string Value);

    public sealed record ImportPreview(List<ImportSection> Sections)
    {
        public int ReadyCount => Sections.Sum(section => section.Rows.Count(row => row.IsValid));
        public int ErrorCount => Sections.Sum(section => section.Rows.Count(row => !row.IsValid))
            + Sections.Count(section => section.Error != null);
    }

    public sealed class ImportSection
    {
        public ImportSection(string code, string label) { Code = code; Label = label; }
        public string Code { get; }
        public string Label { get; }
        public string? SheetName { get; set; }
        public string? Error { get; set; }
        public List<ImportRow> Rows { get; } = [];
        public int ReadyCount => Rows.Count(row => row.IsValid);
        public int ErrorCount => Rows.Count(row => !row.IsValid) + (Error == null ? 0 : 1);
        public bool CanImport => ReadyCount > 0;
    }

    public sealed class ImportRow
    {
        public int ExcelRow { get; set; }
        public string Key { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public long DatabaseId { get; set; }
        public string? Error { get; set; }
        public bool IsValid => DatabaseId > 0 && Error == null;
        public string ContentPreview => Content.Length > 140 ? Content[..140] + "…" : Content;
    }
}
