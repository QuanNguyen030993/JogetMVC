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
                var mapRow1 = Util.BuildColIndexToTextMap(wbPart, row1); // optional
                var mapRow2 = Util.BuildColIndexToTextMap(wbPart, row2); // dùng chính

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
                //.Select(row => (row, map: Util.BuildColIndexToTextMap(wbPart, row)))
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
                    var dataMap = Util.BuildColIndexToTextMap(wbPart, dataRow);
                    if (dataMap.Count == 0) continue;

                    var dto = new Client();

                    foreach (var cp in colToProp)
                    {
                        var colIndex = cp.Key;
                        var propName = cp.Value;

                        if (!propCache.TryGetValue(propName, out var prop)) continue;
                        if (!dataMap.TryGetValue(colIndex, out var raw)) continue;

                        Util.SetPropertyValue(dto, prop, raw);
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
 

   
  



}

