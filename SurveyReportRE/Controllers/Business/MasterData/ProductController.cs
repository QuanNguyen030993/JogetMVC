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
public class ProductController : BaseControllerApi<Product>
{
    private readonly IBaseRepository<Product> _BaseRepository;
    private readonly IBaseRepository<Utility> _utilityRepository;
    private readonly IConfiguration configuration;

    public ProductController(IBaseRepository<Product> BaseRepository, IConfiguration config, IHttpContextAccessor httpContextAccessor) : base(BaseRepository, httpContextAccessor)
    {
        configuration = config;
        _BaseRepository = BaseRepository;
    }
    [HttpPost]
    public async  Task<IActionResult> Import(string sheetName = "Product")
    {
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

                var result = new List<Product>();
                using var doc = Util.OpenSpreadsheetDocument(ms);
                var wbPart = doc.WorkbookPart!;
                var sheet = wbPart.Workbook.Sheets!
                    .Elements<Sheet>()
                    .FirstOrDefault(s => string.Equals(s.Name?.Value, sheetName, StringComparison.OrdinalIgnoreCase));

                if (sheet == null)
                    throw new Exception($"Sheet {sheetName} not found.");

                var wsPart = (WorksheetPart)wbPart.GetPartById(sheet.Id!);
                var rows = wsPart.Worksheet.Descendants<Row>().ToList();

                // row1: mapping, row2: property, row3+: data
                if (rows.Count <= 2) return Ok(result);

                var row1 = rows[0];
                var row2 = rows[1];

                var mapRow1 = Util.BuildColIndexToTextMap(wbPart, row1);
                var mapRow2 = Util.BuildColIndexToTextMap(wbPart, row2);

                // Fallback map: nếu row2 trống thì dùng row1 để suy ra property
                // (vì trong file Product hiện có nhiều cột row2 = null)
                var fallbackByRow1 = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    ["c_termsConEng"] = "TermsConEng",
                    ["c_termsConViet"] = "TermsConViet",
                    ["c_lineOfBusName"] = "LineOfBusName",
                    // bạn có thể bổ sung nếu cần:
                    // ["c_reportLink"] = "ReportLink",
                };

                // colIndex -> propName
                var colToProp = new Dictionary<int, string>();
                foreach (var kv in mapRow2)
                {
                    var propName = (kv.Value ?? "").Trim();
                    if (!string.IsNullOrWhiteSpace(propName))
                        colToProp[kv.Key] = NormalizePropName(propName); // optional normalize
                }

                // bổ sung từ row1 cho các cột row2 bị trống
                foreach (var kv in mapRow1)
                {
                    var colIndex = kv.Key;
                    if (colToProp.ContainsKey(colIndex)) continue; // đã có row2 rồi

                    var rawColName = (kv.Value ?? "").Trim();
                    if (string.IsNullOrWhiteSpace(rawColName)) continue;

                    if (fallbackByRow1.TryGetValue(rawColName, out var fallbackProp))
                        colToProp[colIndex] = fallbackProp;
                }

                var propCache = typeof(Product)
                    .GetProperties(BindingFlags.Public | BindingFlags.Instance)
                    .ToDictionary(p => p.Name, p => p, StringComparer.OrdinalIgnoreCase);

                for (int r = 2; r < rows.Count; r++)
                {
                    var dataRow = rows[r];
                    var dataMap = Util.BuildColIndexToTextMap(wbPart, dataRow);
                    if (dataMap.Count == 0) continue;

                    var dto = new Product();

                    foreach (var cp in colToProp)
                    {
                        if (!propCache.TryGetValue(cp.Value, out var prop)) continue;
                        if (!dataMap.TryGetValue(cp.Key, out var raw)) continue;

                        SetPropertyValueProduct(dto, prop, raw);
                    }
                    await _BaseRepository.InsertData(dto);
                    result.Add(dto);
                }

            }
        }
       
        return Ok();
    }
    private static void SetPropertyValueProduct(Product dto, PropertyInfo prop, string? raw)
    {
        var s = (raw ?? "").Trim();
        if (string.IsNullOrEmpty(s))
        {
            if (Nullable.GetUnderlyingType(prop.PropertyType) != null && prop.PropertyType != typeof(string))
                prop.SetValue(dto, null);
            return;
        }

        var t = Nullable.GetUnderlyingType(prop.PropertyType) ?? prop.PropertyType;

        if (t == typeof(bool))
        {
            // Yes/No, Active/Inactive, Y/N, 1/0
            bool bv =
                s.Equals("Y", StringComparison.OrdinalIgnoreCase) ||
                s.Equals("YES", StringComparison.OrdinalIgnoreCase) ||
                s.Equals("TRUE", StringComparison.OrdinalIgnoreCase) ||
                s.Equals("1", StringComparison.OrdinalIgnoreCase) ||
                s.Equals("ACTIVE", StringComparison.OrdinalIgnoreCase);

            prop.SetValue(dto, bv);
            return;
        }

        // còn lại dùng lại converter chung của bạn
        Util.SetPropertyProductValue(dto as dynamic, prop, s); // hoặc copy logic SetPropertyValue cũ sang đây
    }

    private static string NormalizePropName(string propName)
    {
        // ví dụ file có "IsActive bool" => lấy token đầu "IsActive"
        var first = propName.Split(new[] { ' ', '\t' }, StringSplitOptions.RemoveEmptyEntries).FirstOrDefault();
        return first ?? propName;
    }

}

