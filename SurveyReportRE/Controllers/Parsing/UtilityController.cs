using LdapService;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using SurveyReportRE.Controllers.Base;
using SurveyReportRE.Models.Base;
using SurveyReportRE.Models.Migration.Business.Config;
using SurveyReportRE.Models.Request;
using System.Dynamic;
using System.Net;
using System.Security.Claims;
using System.Security.Principal;
using SurveyReportRE.Models.Migration.Business.HumanResource;
using SurveyReportRE.Common;
using SurveyReportRE.Models.Migration.Business.Data;
using MimeMapping;
using Newtonsoft.Json.Linq;
using SurveyReportRE.ControllerUtil;
using SurveyReportRE.Models.Business.Migration.Config;
using SurveyReportRE.Models.Migration.Config;
using System.Reflection;
using RESurveyTool.Models.Models.Parsing;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Spreadsheet;
using System.Globalization;
namespace SurveyReportRE.Controllers.Config
{
    [Route("api/[controller]/[action]")]
    [ApiController]
    public class UtilityController : BaseControllerApi<Utility>
    {
        //private readonly IBaseRepository<Utility> _BaseRepository;
        private readonly IConfiguration _configuration;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly Microsoft.Extensions.Options.IOptionsMonitor<BlobStorageSettings> _blobStorageSettings;

        public UtilityController(IBaseRepository<Utility> BaseRepository, IConfiguration configuration, IHttpContextAccessor httpContextAccessor, Microsoft.Extensions.Options.IOptionsMonitor<BlobStorageSettings> blobStorageSettings) : base(BaseRepository, httpContextAccessor)
        {
            //_BaseRepository = BaseRepository;
            _configuration = configuration;
            _blobStorageSettings = blobStorageSettings;

        }

        #region GET API 



        public async Task<ActionResult<Utility>> GetData(string sheetName)
        {
            //dynamic Base = null;
            string excelPath =
                $@"{_blobStorageSettings.CurrentValue.Path}\StaticData\plan.xlsx";

            using var stream1 = OpenExcelReadStream(excelPath);
            var dependencies = ReadDependenciesFromStream(stream1, sheetName);
            return Ok(dependencies); // trả JSON đúng cho JS
            //return Ok(Base);
        }
        [HttpGet]

        #endregion

        #region POST API 

        [HttpPost]
        public override async Task<IActionResult> InsertData([FromForm] InsertFormCollection form)
        {
            var entity = new Utility();

            return Ok(entity);
        }

        [HttpPost]
        //[RequestSizeLimit(50_000_000)] // 50MB
        public async Task<IActionResult> ImportExcel([FromForm] IFormFile file /*, [FromForm] long? projectId */)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "Empty file" });

            var ext = Path.GetExtension(file.FileName);
            if (!string.Equals(ext, ".xlsx", StringComparison.OrdinalIgnoreCase))
                return BadRequest(new { message = "Only support .xlsx" });

            // Lưu tạm (tuỳ anh)
            var tempFolder = Path.Combine(Path.GetTempPath(), "plan-import");
            Directory.CreateDirectory(tempFolder);

            var savedPath = Path.Combine(_blobStorageSettings.CurrentValue.Path, $@"StaticData\plan.xlsx");
            await using (var fs = System.IO.File.Create(savedPath))
            {
                await file.CopyToAsync(fs);
            }

            try
            {
                // TODO: parse excel -> insert/update DB
                // ví dụ: ImportPlanFromExcel(savedPath);

                return Ok(new { message = "Import OK", fileName = file.FileName });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Import error!!", detail = ex.Message });
            }
            finally
            {
                // nếu không cần giữ file:
                // System.IO.File.Delete(savedPath);
            }
        }
        #endregion

        #region DELETE API 

        [HttpDelete]
        public override async Task<IActionResult> DeleteData([FromForm] DeleteFormCollection form)
        {
            var entity = new Utility();

            return Ok(entity);
        }
        #endregion

        #region PUT API 

        [HttpPut]
        public override HttpResponseMessage UpdateData([FromForm] UpdateFormCollection form)
        {
            var entity = new Utility();
            return new HttpResponseMessage(HttpStatusCode.OK);
        }
        #endregion



        private static List<dynamic> ReadDependenciesFromStream(Stream excelStream, string sheetName)
        {
            var result = new List<dynamic>();

            using var doc = OpenSpreadsheetDocument(excelStream);
            var wbPart = doc.WorkbookPart!;

            var sheet = wbPart.Workbook.Sheets!
                .Elements<Sheet>()
                .FirstOrDefault(s => string.Equals(s.Name?.Value, sheetName, StringComparison.OrdinalIgnoreCase));

            if (sheet == null)
                throw new Exception($"Sheet '{sheetName}' not found.");

            var wsPart = (WorksheetPart)wbPart.GetPartById(sheet.Id!);
            var rows = wsPart.Worksheet.Descendants<Row>().ToList();
            if (rows.Count <= 1) return result;

            // header map
            var headerCells = rows[0].Elements<Cell>().ToList();
            var colMap = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);

            for (int i = 0; i < headerCells.Count; i++)
            {
                var colName = GetCellValue(wbPart, headerCells[i])?.Trim();
                if (!string.IsNullOrWhiteSpace(colName))
                    colMap[colName] = i;
            }

            for (int r = 1; r < rows.Count; r++)
            {
                var cells = rows[r].Elements<Cell>().ToList();
                if (cells.Count == 0) continue;

                dynamic dto;

                switch (sheetName)
                {
                    case "Dependencies":
                        dto = new
                        {
                            id = GetString(cells, colMap, "id", wbPart),
                            predecessorId = GetString(cells, colMap, "predecessorId", wbPart),
                            successorId = GetString(cells, colMap, "successorId", wbPart),
                            type = GetString(cells, colMap, "type", wbPart)
                        };
                        break;

                    case "Tasks":
                        dto = new
                        {
                            id = GetString(cells, colMap, "id", wbPart),
                            parentId = GetString(cells, colMap, "parentId", wbPart),
                            title = GetString(cells, colMap, "title", wbPart),
                            start = GetDate(cells, colMap, "start", wbPart)?.AddHours(-7).ToString("yyyy-MM-ddTHH:mm:ss.000Z"),
                            end = GetDate(cells, colMap, "end", wbPart)?.Add(new TimeSpan(16,59,59)).ToString("yyyy-MM-ddTHH:mm:ss.000Z"),
                            progress = GetInt(cells, colMap, "progress", wbPart)
                        };
                        break;

                    case "Resources":
                        dto = new
                        {
                            id = GetString(cells, colMap, "id", wbPart),
                            text = GetString(cells, colMap, "text", wbPart)
                        };
                        break;

                    case "ResourceAssignments":
                        dto = new
                        {
                            id = GetString(cells, colMap, "id", wbPart),
                            taskId = GetString(cells, colMap, "taskId", wbPart),
                            resourceId = GetString(cells, colMap, "resourceId", wbPart)
                        };
                        break;

                    default:
                        continue; // sheet không hỗ trợ → skip row
                }

                result.Add(dto);
            }


            return result;
        }

        private static string GetCellValue(WorkbookPart wbPart, Cell cell)
        {
            string value = "";
            if (cell != null)
            {
                if (cell.CellValue != null) value = cell.CellValue.InnerText;
                if (cell?.ChildElements[0] != null)
                {
                    var chillCell = cell?.ChildElements[0];
                    value = chillCell.InnerText;
                }

                
            }
            else
            {
                return "";
            }
            
            

            if (cell.DataType != null && cell.DataType == CellValues.SharedString)
            {
                return wbPart.SharedStringTablePart
                    .SharedStringTable
                    .Elements<SharedStringItem>()
                    .ElementAt(int.Parse(value))
                    .InnerText;
            }

            return value;
        }

        private static int GetInt(
            List<Cell> cells,
            Dictionary<string, int> colMap,
            string colName,
            WorkbookPart wbPart)
        {
            if (!colMap.ContainsKey(colName))
                return 0;

            int idx = colMap[colName];
            if (idx >= cells.Count)
                return 0;

            var text = GetCellValue(wbPart, cells[idx]);
            return int.TryParse(text, out int v) ? v : 0;
        }
        private static FileStream OpenExcelReadStream(string filePath)
        {
            return new FileStream(
                filePath,
                FileMode.Open,
                FileAccess.Read,
                FileShare.ReadWrite // để không bị lock nếu file đang mở ở nơi khác
            );
        }

        private static SpreadsheetDocument OpenSpreadsheetDocument(Stream stream)
        {
            var settings = new OpenSettings
            {
                AutoSave = false//,
                //LeaveOpen = true
            };
            return SpreadsheetDocument.Open(stream, false, settings);
        }
        static string GetString(
    List<Cell> cells,
    Dictionary<string, int> colMap,
    string col,
    WorkbookPart wbPart)
        {
            if (!colMap.ContainsKey(col)) return null;
            int idx = colMap[col];
            if (idx >= cells.Count) return null;
            return GetCellValue(wbPart, cells[idx]);
        }

        static int? GetNullableInt(
            List<Cell> cells,
            Dictionary<string, int> colMap,
            string col,
            WorkbookPart wbPart)
        {
            var s = GetString(cells, colMap, col, wbPart);
            return int.TryParse(s, out var v) ? v : (int?)null;
        }

        static DateTime? GetDate(
            List<Cell> cells,
            Dictionary<string, int> colMap,
            string col,
            WorkbookPart wbPart)
        {
            var raw = GetString(cells, colMap, col, wbPart);
            if (string.IsNullOrWhiteSpace(raw))
                return null;

            if (double.TryParse(raw, NumberStyles.Any, CultureInfo.InvariantCulture, out double oaDate))
            {
                try
                {
                    return DateTime.FromOADate(oaDate);
                }
                catch
                {
                    return null;
                }
            }

           
            if (DateTime.TryParse(raw, out var d))
                return d;

            return null;
        }

    }
}
