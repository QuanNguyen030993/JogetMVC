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
using Newtonsoft.Json;
using ERPCore.Models.Migration.Config;

[ApiController]
[Route("api/[controller]/[action]")]
public class ClientController : BaseControllerApi<Client>
{
    private readonly IBaseRepository<Client> _BaseRepository;
    private readonly IBaseRepository<Utility> _utilityRepository;
    private readonly IBaseRepository<FormatCodeNo> _formatCodeNoRepository;
    private readonly IConfiguration configuration;

    public ClientController(IBaseRepository<Client> BaseRepository, IConfiguration config, IHttpContextAccessor httpContextAccessor) : base(BaseRepository, httpContextAccessor)
    {
        configuration = config;
        _BaseRepository = BaseRepository;
        _formatCodeNoRepository = new BaseRepository<FormatCodeNo>(config,httpContextAccessor);
    }

    public async Task<IActionResult> Import(int surveyId)
    {
        string folder = Request.Headers["X-Folder-Path"];
        IFormFileCollection files = ((FormCollection)(Request.Form)).Files;

        IFormFile file = files.FirstOrDefault();
        if (file != null && file.Length > 0)
        {
            using (var ms = new MemoryStream())
            {
                file.CopyTo(ms);
                ms.Position = 0;

                using var doc = Util.OpenSpreadsheetDocument(ms);
                var wbPart = doc.WorkbookPart!;
                var sheet = wbPart.Workbook.Sheets!
                    .Elements<Sheet>()
                    .FirstOrDefault(s => string.Equals(s.Name?.Value, "DataImport", StringComparison.OrdinalIgnoreCase));

                if (sheet == null)
                    return BadRequest(new { success = false, message = "Sheet 'DataImport' not found in the uploaded file." });

                var wsPart = (WorksheetPart)wbPart.GetPartById(sheet.Id!);
                var rows = wsPart.Worksheet.Descendants<Row>().ToList();

                // cần tối thiểu: row1 mapping, row2 property, row3 data
                if (rows.Count <= 2)
                    return Ok(new { success = true, message = "No data rows found to import." });

                var row1 = rows[0]; // mapping c_*
                var row2 = rows[1]; // property name (ClientId, TSCode, ...)

                var mapRow2 = Util.BuildColIndexToTextMap(wbPart, row2); // dùng chính

                var colToProp = new Dictionary<int, string>();
                foreach (var kv in mapRow2)
                {
                    var propName = (kv.Value ?? "").Trim();
                    if (!string.IsNullOrWhiteSpace(propName))
                        colToProp[kv.Key] = propName;
                }

                var propCache = typeof(Client)
                    .GetProperties(BindingFlags.Public | BindingFlags.Instance)
                    .ToDictionary(p => p.Name, p => p, StringComparer.OrdinalIgnoreCase);

                var parsedClients = new List<Client>();

                for (int r = 2; r < rows.Count; r++)
                {
                    var dataRow = rows[r];
                    var dataMap = Util.BuildColIndexToTextMap(wbPart, dataRow);
                    if (dataMap.Count == 0) continue;

                    var dto = new Client();
                    bool hasData = false;

                    foreach (var cp in colToProp)
                    {
                        var colIndex = cp.Key;
                        var propName = cp.Value;

                        if (!propCache.TryGetValue(propName, out var prop)) continue;
                        if (!dataMap.TryGetValue(colIndex, out var raw)) continue;

                        if (!string.IsNullOrWhiteSpace(raw))
                        {
                            hasData = true;
                        }

                        Util.SetPropertyValue(dto, prop, raw);
                    }

                    if (hasData)
                    {
                        parsedClients.Add(dto);
                    }
                }

                if (parsedClients.Count == 0)
                {
                    return Ok(new { success = true, message = "No valid data found to import." });
                }

                // Check Duplicate TaxCode
                var taxCodesToImport = parsedClients
                    .Where(c => !string.IsNullOrWhiteSpace(c.TaxCode))
                    .Select(c => c.TaxCode.Trim())
                    .ToList();

                // Check duplicate within the Excel file itself
                var internalDuplicates = taxCodesToImport
                    .GroupBy(x => x, StringComparer.OrdinalIgnoreCase)
                    .Where(g => g.Count() > 1)
                    .Select(g => g.Key)
                    .ToList();

                if (internalDuplicates.Any())
                {
                    return BadRequest(new { success = false, message = $"Excel file contains duplicate Tax Codes: {string.Join(", ", internalDuplicates)}" });
                }

                // Check duplicate against database
                var allClients = await _BaseRepository.GetAll();
                var existingTaxCodes = allClients
                    .Where(c => !string.IsNullOrWhiteSpace(c.TaxCode))
                    .Select(c => c.TaxCode.Trim())
                    .ToHashSet(StringComparer.OrdinalIgnoreCase);

                var dbDuplicates = taxCodesToImport
                    .Where(tc => existingTaxCodes.Contains(tc))
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToList();

                if (dbDuplicates.Any())
                {
                    return BadRequest(new { success = false, message = $"Client(s) with Tax Code already exist in the database: {string.Join(", ", dbDuplicates)}" });
                }

                // Generate missing ClientCode values
                foreach (var client in parsedClients)
                {
                    if (string.IsNullOrWhiteSpace(client.ClientCode))
                    {
                        var clientNos = await _formatCodeNoRepository.GetListObjectFullInclude(l => l.NoSeqCode == nameof(Client) + "Code");
                        string clientNo = ControllerUtil.GenerateNumberSeq(clientNos, _formatCodeNoRepository, nameof(Client));
                        client.ClientCode = clientNo;
                    }
                }

                try
                {
                    await _BaseRepository.BulkInsertAsync(parsedClients);
                }
                catch (Exception ex)
                {
                    Serilog.Log.Error(ex, "Failed to perform bulk insert for imported clients.");
                    return BadRequest(new { success = false, message = $"Database import failed: {ex.Message}" });
                }

                return Ok(new { success = true, message = $"{parsedClients.Count} clients imported successfully." });
            }
        }
        else
            return BadRequest(new { success = false, message = "No file uploaded." });
    }


    [HttpPost]
    public override async Task<IActionResult> InsertData([FromForm] InsertFormCollection form)
    {
        var entity = new Client();
        var clientNos = new List<FormatCodeNo>();
        PolicyIssuance PolicyIssuance = new PolicyIssuance();
        clientNos = await _formatCodeNoRepository.GetListObjectFullInclude(l => l.NoSeqCode == nameof(Client) + "Code");
        string clientNo = ControllerUtil.GenerateNumberSeq(clientNos, _formatCodeNoRepository, nameof(Client));
        JsonConvert.PopulateObject(form.values, entity);
        entity.ClientCode = clientNo;
        entity = await _BaseRepository.InsertData(entity);
        return Ok(entity);
    }





}

