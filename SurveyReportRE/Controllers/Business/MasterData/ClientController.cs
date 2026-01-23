using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using ERPCore.Controllers.Base;
using ERPCore.Models.Migration.Business.MasterData;
using ERPCore.Models.Request;
using System.Dynamic;
using ERPCore.Common;
using ERPCore.ControllerUtil;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Spreadsheet;
using ERPCore.Models.Models.Parsing;
using System.Globalization;
using System.Reflection;

[ApiController]
[Route("api/[controller]/[action]")]
public class ClientController : BaseControllerApi<Client>
{
    private readonly IBaseRepository<Client> _BaseRepository;
    private readonly IBaseRepository<Utility> _utilityRepository;
    private readonly IConfiguration configuration;

    public ClientController(IBaseRepository<Client> BaseRepository, IConfiguration config, IHttpContextAccessor httpContextAccessor) : base(BaseRepository, httpContextAccessor)
    {
        configuration = config;
        _BaseRepository = BaseRepository;
    }

    public async Task<IActionResult> Import(int surveyId)
    {// Use blog settings while override this method instead
        //var path = BLOB_PATH;
        string folder = Request.Headers["X-Folder-Path"];
        //IBaseRepository<Attachment> _attachmentRepository = new BaseRepository<Attachment>(_BaseRepository._baseConfiguration, _httpContextAccessor);
        IFormFileCollection files = null;
        files = ((FormCollection)(Request.Form)).Files;

        IFormFile file = null;
        file = files.FirstOrDefault();
        if (file != null && file.Length > 0)
        {
            using (var ms = new MemoryStream())
            {
                file.CopyTo(ms);
                var fileBytes = ms.ToArray();


                var result = new List<Client>();
                ms.Position = 0;

                using var doc = Util.OpenSpreadsheetDocument(ms);
                var wbPart = doc.WorkbookPart!;
                var sheet = wbPart.Workbook.Sheets!
                    .Elements<Sheet>()
                    .FirstOrDefault(s => string.Equals(s.Name?.Value, "DataImport", StringComparison.OrdinalIgnoreCase));

                if (sheet == null)
                    throw new Exception("Sheet DataImport not found.");

                var wsPart = (WorksheetPart)wbPart.GetPartById(sheet.Id!);
                var rows = wsPart.Worksheet.Descendants<Row>().ToList();

                // cần tối thiểu: row1 mapping, row2 property, row3 data
                if (rows.Count <= 2) return new OkObjectResult(result);

                var row1 = rows[0]; // mapping c_*
                var row2 = rows[1]; // property name (ClientId, TSCode, ...)
                                    // rows[2..] là data

                // Map theo ColumnIndex: colIndex -> header text
                var mapRow1 = BuildColIndexToTextMap(wbPart, row1); // optional
                var mapRow2 = BuildColIndexToTextMap(wbPart, row2); // dùng chính

                // property name theo cột: colIndex -> "ClientId"...
                // ưu tiên row2, nếu row2 rỗng thì có thể fallback row1 (tuỳ bạn)
                var colToProp = new Dictionary<int, string>();
                foreach (var kv in mapRow2)
                {
                    var propName = (kv.Value ?? "").Trim();
                    if (!string.IsNullOrWhiteSpace(propName))
                        colToProp[kv.Key] = propName;
                }

                // cache PropertyInfo cho nhanh
                var propCache = typeof(Client)
                    .GetProperties(BindingFlags.Public | BindingFlags.Instance)
                    .ToDictionary(p => p.Name, p => p, StringComparer.OrdinalIgnoreCase);


                //var settersByCol = new Dictionary<int, Action<Client, string>>(colToProp.Count);

                //var list = rows.Skip(2)
                //.Select(row => (row, map: BuildColIndexToTextMap(wbPart, row)))
                //.Where(x => x.map.Count > 0)
                //.Select(x =>
                //{
                //    var dto = new Client();
                //    //foreach (var (colIndex, raw) in x.map)
                //    //    if (settersByCol.TryGetValue(colIndex, out var setter))
                //    //        setter(dto, raw);
                //    //    else break;
                //    return dto;
                //})
                //.ToList();


                for (int r = 2; r < rows.Count; r++)
                {
                    var dataRow = rows[r];
                    // map colIndex -> cellValue của row hiện tại
                    var dataMap = BuildColIndexToTextMap(wbPart, dataRow);
                    if (dataMap.Count == 0) continue;

                    var dto = new Client();

                    foreach (var cp in colToProp)
                    {
                        var colIndex = cp.Key;
                        var propName = cp.Value;

                        if (!propCache.TryGetValue(propName, out var prop)) continue;
                        if (!dataMap.TryGetValue(colIndex, out var raw)) continue;

                        SetPropertyValue(dto, prop, raw);
                    }

                    // OPTIONAL: nếu bạn muốn ưu tiên JSON build từ Viet/Eng (khi file có 2 cột)
                    // dto.BusinessAddress = BuildLangJsonIfNeeded(...)
                    await _BaseRepository.InsertData(dto);
                    result.Add(dto);
                }
                //foreach (Client client in result)
                //{
                //    await _BaseRepository.InsertData(client);
                //}

                return Ok(new { success = true, message = "File uploaded successfully" });
            }
        }
        else
            return Ok(new { success = false, message = "No file uploaded" });
    }
    private static Dictionary<int, string?> BuildColIndexToTextMap(WorkbookPart wbPart, Row row)
    {
        var dict = new Dictionary<int, string?>();
        foreach (var cell in row.Elements<Cell>())
        {
            try
            {
            var colIndex = GetColumnIndexFromCellReference(cell.CellReference?.Value);
            if (colIndex < 0) continue;

            dict[colIndex] = Util.GetCellValue(wbPart, cell); // hàm bạn đã có

            }
            catch
            {

            }
        }
        return dict;
    }

    // A=0, B=1, Z=25, AA=26...
    private static int GetColumnIndexFromCellReference(string? cellRef)
    {
        if (string.IsNullOrWhiteSpace(cellRef)) return -1;

        // lấy phần chữ đầu: "AB12" -> "AB"
        int i = 0;
        while (i < cellRef.Length && char.IsLetter(cellRef[i])) i++;
        if (i == 0) return -1;

        var colLetters = cellRef.Substring(0, i).ToUpperInvariant();

        int index = 0;
        foreach (var ch in colLetters)
        {
            index = index * 26 + (ch - 'A' + 1);
        }
        return index - 1; // 0-based
    }

    private static void SetPropertyValue(Client dto, PropertyInfo prop, string? raw)
    {
        var s = (raw ?? "").Trim();
        if (string.IsNullOrEmpty(s))
        {
            // null cho nullable, hoặc giữ default string=""
            if (IsNullable(prop.PropertyType) && prop.PropertyType != typeof(string))
                prop.SetValue(dto, null);
            return;
        }

        var t = Nullable.GetUnderlyingType(prop.PropertyType) ?? prop.PropertyType;

        try
        {
            if (t == typeof(string))
            {
                prop.SetValue(dto, s);
                return;
            }

            if (t == typeof(long))
            {
                if (long.TryParse(s, NumberStyles.Any, CultureInfo.InvariantCulture, out var lv))
                    prop.SetValue(dto, lv);
                return;
            }

            if (t == typeof(int))
            {
                if (int.TryParse(s, NumberStyles.Any, CultureInfo.InvariantCulture, out var iv))
                    prop.SetValue(dto, iv);
                return;
            }

            if (t == typeof(bool))
            {
                // hỗ trợ Y/N, True/False, 1/0, "Active"
                var bv =
                    s.Equals("Y", StringComparison.OrdinalIgnoreCase) ||
                    s.Equals("YES", StringComparison.OrdinalIgnoreCase) ||
                    s.Equals("TRUE", StringComparison.OrdinalIgnoreCase) ||
                    s.Equals("1", StringComparison.OrdinalIgnoreCase) ||
                    s.Equals("ACTIVE", StringComparison.OrdinalIgnoreCase);

                prop.SetValue(dto, bv);
                return;
            }

            if (t == typeof(DateTime))
            {
                // hỗ trợ: yyyyMMdd, yyyy-MM-dd, yyyy-MM-dd HH:mm:ss.fff
                if (TryParseDate(s, out var dt))
                    prop.SetValue(dto, dt);
                return;
            }

            // fallback convert
            var converted = Convert.ChangeType(s, t, CultureInfo.InvariantCulture);
            prop.SetValue(dto, converted);
        }
        catch
        {
            // tuỳ bạn: log lỗi theo col/row/prop để debug
        }
    }

    private static bool IsNullable(Type t) =>
        !t.IsValueType || Nullable.GetUnderlyingType(t) != null;

    private static bool TryParseDate(string s, out DateTime dt)
    {
        // yyyymmdd
        if (s.Length == 8 && DateTime.TryParseExact(s, "yyyyMMdd", CultureInfo.InvariantCulture,
                DateTimeStyles.None, out dt))
            return true;

        // yyyy-MM-dd
        if (DateTime.TryParseExact(s, "yyyy-MM-dd", CultureInfo.InvariantCulture,
                DateTimeStyles.None, out dt))
            return true;

        // full datetime
        if (DateTime.TryParse(s, CultureInfo.InvariantCulture, DateTimeStyles.AllowWhiteSpaces, out dt))
            return true;

        dt = default;
        return false;
    }
}

