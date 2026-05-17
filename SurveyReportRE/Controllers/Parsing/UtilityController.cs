using LdapService;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using ERPCore.Controllers.Base;
using ERPCore.Models.Base;
using ERPCore.Models.Migration.Business.Config;
using ERPCore.Models.Request;
using System.Net;
using ERPCore.Models.Models.Parsing;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Spreadsheet;
using System.Globalization;
using ERPCore.ControllerUtil;
using ERPCore.Common;
using System.Text;
using System.Net.Http.Headers;
using RESurveyTool.Models.Models.Parsing;
using ERPCore.Models.Config;
using System.Text.RegularExpressions;
using System.Text.Json;
using DocumentFormat.OpenXml.Wordprocessing;




namespace ERPCore.Controllers.Config
{
    [Route("api/[controller]/[action]")]
    [ApiController]
    public class UtilityController : BaseControllerApi<Utility>
    {
        //private readonly IBaseRepository<Utility> _BaseRepository;
        private readonly IConfiguration _configuration;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly Microsoft.Extensions.Options.IOptionsMonitor<BlobStorageSettings> _blobStorageSettings;
        private readonly URLConfig _urlConfig;
        private readonly InternalAuth _internalAuth;

        public UtilityController(IBaseRepository<Utility> BaseRepository, IConfiguration configuration, IHttpContextAccessor httpContextAccessor, Microsoft.Extensions.Options.IOptionsMonitor<BlobStorageSettings> blobStorageSettings) : base(BaseRepository, httpContextAccessor)
        {
            //_BaseRepository = BaseRepository;
            _configuration = configuration;
            _blobStorageSettings = blobStorageSettings;
            _urlConfig = configuration.GetSection("URLConfig").Get<URLConfig>();
            _internalAuth = configuration.GetSection("InternalAuth").Get<InternalAuth>();
        }

        #region GET API 

        [HttpGet("{module}/{view}")]
        public IActionResult GetViewContent(string module, string view)
        {
            var root = @"D:\Source\MySource\JogetMVC\SurveyReportRE";

            var path = Path.Combine(
                root,
                "Pages",
                "Business",
                "Form",
                $"{module}",
                $"{view}.cshtml"
            );

            if (!System.IO.File.Exists(path))
            {
                return Ok(new
                {
                    success = false,
                    message = "View not found"
                });
            }

            var content = System.IO.File.ReadAllText(path);

            return Ok(new
            {
                success = true,
                content = content
            });
        }

        public async Task<ActionResult<Utility>> GetData(string sheetName)
        {
            //dynamic Base = null;
            string excelPath =
                $@"{_blobStorageSettings.CurrentValue.Path}\StaticData\plan.xlsx";

            using var stream1 = Util.OpenExcelReadStream(excelPath);
            var dependencies = ReadDependenciesFromStream(stream1, sheetName);
            return Ok(dependencies); // trả JSON đúng cho JS
            //return Ok(Base);
        }
        [HttpPost]
        public IActionResult SaveViewSchema([FromBody]JsonElement body)
        {
            var raw = body.ToString();

            var view = body.GetProperty("view")
            .GetString();

            var itemsText = body.GetProperty("itemsText")
                                .GetString();

            //var root = @"D:\Source\MySource\JogetMVC\SurveyReportRE";
            //var path = Path.Combine(
            //    root,
            //    "Views",
            //    "QuotationDetail",
            //    req + ".cshtml"
            //);

            //var content = System.IO.File.ReadAllText(path);

            //content = Regex.Replace(

            //    content,

            //    @"items\s*:\s*\[[\s\S]*?\]\s*\}\s*\);",

            //    $"items: {itemsText}" + Environment.NewLine + "});"

            //);

            //System.IO.File.WriteAllText(path, content);

            return Ok(new
            {
                success = true
            });
        }
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
        [HttpPost]
        public async Task<IActionResult> NotifyAnother([FromBody]NotificationRequest notificationRequest)
        {
            var handler = new HttpClientHandler();
            handler.UseCookies = false;
            handler.UseDefaultCredentials = true;
            handler.PreAuthenticate = true;

            using (var httpClient = new HttpClient(handler))
            {
                using (var request = new HttpRequestMessage(new HttpMethod("POST"), $"{_urlConfig.REHost}/api/Notification/Notify"))
                {
                    request.Headers.TryAddWithoutValidation("Accept", "*/*");
                    request.Headers.TryAddWithoutValidation("Accept-Language", "en-US,en;q=0.9,vi;q=0.8");
                    request.Headers.TryAddWithoutValidation("Access-Control-Request-Headers", "content-type");
                    request.Headers.TryAddWithoutValidation("Access-Control-Request-Method", "POST");
                    request.Headers.TryAddWithoutValidation("Cache-Control", "no-cache");
                    request.Headers.TryAddWithoutValidation("Connection", "keep-alive");
                    request.Headers.TryAddWithoutValidation("Origin", $"{_urlConfig.Host}");
                    request.Headers.TryAddWithoutValidation("Pragma", "no-cache");
                    request.Headers.TryAddWithoutValidation("Referer", $"{_urlConfig.Host}/");
                    request.Headers.TryAddWithoutValidation("Sec-Fetch-Dest", "empty");
                    request.Headers.TryAddWithoutValidation("Sec-Fetch-Mode", "cors");
                    request.Headers.TryAddWithoutValidation("Sec-Fetch-Site", "cross-site");
                    request.Headers.TryAddWithoutValidation("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36");
                    request.Headers.TryAddWithoutValidation("Access-Control-Request-Origin", $"{_urlConfig.Host}");
                    request.Headers.TryAddWithoutValidation("X-Internal-Token", _internalAuth.Token);
                    //request.Headers.TryAddWithoutValidation("Cookie", "visid_incap_2798233=O7uM8s8YQ4Wt9z+ilLnLVUTi9WcAAAAAQUIPAAAAAABN6GD7Jnn01N8ILccHyjDS");

                    //var base64authorization = Convert.ToBase64String(Encoding.ASCII.GetBytes("quan.nh:8iqvxbcvyF!@#$%"));
                    //request.Headers.TryAddWithoutValidation("Authorization", $"Basic {base64authorization}");

                    //request.Content = new StringContent("{\n  \"Notification\": {\n    \"Title\": \"Test Title\",\n    \"Message\": \"Test HTML Message\",\n    \"IsRead\": false,\n    \"Url\": \"Link URL\",\n    \"Resource\": \"IT_quannh\",\n    \"System\": \"Quotation Management\"\n  },\n  \"MKTSurveyRequest\": {\n    \"ClientName\": \"Client A\"\n  },\n  \"connectionId\": \"\"\n}");
                    request.Content = new StringContent(JsonConvert.SerializeObject(notificationRequest));
                    request.Content.Headers.ContentType = MediaTypeHeaderValue.Parse("application/json");

                    var responsse = await httpClient.SendAsync(request);
                }
            }
            return Ok();
        }

        private static List<dynamic> ReadDependenciesFromStream(Stream excelStream, string sheetName)
        {
            var result = new List<dynamic>();

            using var doc = Util.OpenSpreadsheetDocument(excelStream);
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
                var colName = Util.GetCellValue(wbPart, headerCells[i])?.Trim();
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
                            id = Util.GetString(cells, colMap, "id", wbPart),
                            predecessorId = Util.GetString(cells, colMap, "predecessorId", wbPart),
                            successorId = Util.GetString(cells, colMap, "successorId", wbPart),
                            type = Util.GetString(cells, colMap, "type", wbPart)
                        };
                        break;

                    case "Tasks":
                        dto = new
                        {
                            id = Util.GetString(cells, colMap, "id", wbPart),
                            parentId = Util.GetString(cells, colMap, "parentId", wbPart),
                            title = Util.GetString(cells, colMap, "title", wbPart),
                            start = Util.GetDate(cells, colMap, "start", wbPart)?.AddHours(-7).ToString("yyyy-MM-ddTHH:mm:ss.000Z"),
                            end = Util.GetDate(cells, colMap, "end", wbPart)?.Add(new TimeSpan(16,59,59)).ToString("yyyy-MM-ddTHH:mm:ss.000Z"),
                            progress = Util.GetInt(cells, colMap, "progress", wbPart)
                        };
                        break;

                    case "Resources":
                        dto = new
                        {
                            id = Util.GetString(cells, colMap, "id", wbPart),
                            text = Util.GetString(cells, colMap, "text", wbPart)
                        };
                        break;

                    case "ResourceAssignments":
                        dto = new
                        {
                            id = Util.GetString(cells, colMap, "id", wbPart),
                            taskId = Util.GetString(cells, colMap, "taskId", wbPart),
                            resourceId = Util.GetString(cells, colMap, "resourceId", wbPart)
                        };
                        break;

                    default:
                        continue; // sheet không hỗ trợ → skip row
                }

                result.Add(dto);
            }


            return result;
        }




        

    }
}
