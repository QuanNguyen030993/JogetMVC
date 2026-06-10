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

namespace ERPCore.Controllers.Config
{
    [Route("api/[controller]/[action]")]
    [ApiController]
    public class EmployeeWorkloadController : BaseControllerApi<Utility>
    {
        private readonly IBaseRepository<Utility> _BaseRepository;
        private readonly IConfiguration _configuration;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly Microsoft.Extensions.Options.IOptionsMonitor<BlobStorageSettings> _blobStorageSettings;

        public EmployeeWorkloadController(IBaseRepository<Utility> BaseRepository, IConfiguration configuration, IHttpContextAccessor httpContextAccessor, Microsoft.Extensions.Options.IOptionsMonitor<BlobStorageSettings> blobStorageSettings) : base(BaseRepository, httpContextAccessor)
        {
            _BaseRepository = BaseRepository;
            _configuration = configuration;
            _blobStorageSettings = blobStorageSettings;

        }


        public override async Task<object> ExecuteCustomQuery([FromBody] string query)
        {
            string baseQuery = $"EXEC usp_EmployeeWorkload_GetData '{query}'";
            List<Dictionary<string, object>> obj = await _BaseRepository.ExecuteCustomQuery(baseQuery);
            return (obj);
        }


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
                            end = GetDate(cells, colMap, "end", wbPart)?.Add(new TimeSpan(16, 59, 59)).ToString("yyyy-MM-ddTHH:mm:ss.000Z"),
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
