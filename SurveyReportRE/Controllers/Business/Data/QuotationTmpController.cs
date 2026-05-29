using DocumentFormat.OpenXml.Office2013.Excel;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using ERPCore.Controllers.Base;
using ERPCore.Models.Migration.Business.Config;
using System.Data;
using ERPCore.ControllerUtil;
using ERPCore.Common;
using System.Net;
using ERPCore.Models.Base;
using DocumentFormat.OpenXml.Wordprocessing;
using System.Text.RegularExpressions;
using MimeKit;
using DocumentFormat.OpenXml.Bibliography;
using Microsoft.SharePoint.Taxonomy.WebServices;
using ERPCore.Models.Migration.Config;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json;
using ERPCore.Models.Business.Migration.Config;
using ERPCore.Models.Migration.Business.HumanResource;
using ERPCore.Repository;
using ERPCore.Models.Request;
using Microsoft.AspNetCore.SignalR;
using Microsoft.SharePoint.WebControls;
using RESurveyTool.Models.Models.Parsing;
using Microsoft.AspNetCore.Http;
using ERPCore.Models.Migration.Business.Workflow;
using ERPCore.Models.Migration.Business.MasterData;
using ERPCore.Models.Migration.Business.Data;
using System.Reflection;
using System.Dynamic;
using ERPCore.Models;
using static ERPCore.Models.Models.Parsing.JsonHandle;

[ApiController]
[Route("api/[controller]/[action]")]
public class QuotationTmpController : BaseControllerApi<QuotationTmp>
{
    private readonly IBaseRepository<QuotationTmp> _BaseRepository;
    private readonly IBaseRepository<FormatCodeNo> _formatCodeNoRepository;
    private readonly IConfiguration configuration;
    private readonly IHubContext<FileProcessingHub> _hubContext;
    private readonly ILogger<QuotationTmp> _logger;
    private readonly IConfigurationSection path;
    private readonly IHttpContextAccessor _httpContextAccessor; 
    private MailConfig _emailSettings;
    private readonly Microsoft.Extensions.Options.IOptionsMonitor<BlobStorageSettings> _blobStorageSettings;
    public QuotationTmpController(IBaseRepository<QuotationTmp> BaseRepository
        , IConfiguration config
        , IHttpContextAccessor httpContextAccessor
        , ILogger<QuotationTmp> logger
        , Microsoft.Extensions.Options.IOptionsMonitor<BlobStorageSettings> blobStorageSettings
         , IHubContext<FileProcessingHub> hubContext
        ) : base(BaseRepository, httpContextAccessor
            )
    {
        configuration = config;
        _BaseRepository = BaseRepository;
        _httpContextAccessor = httpContextAccessor;
        _emailSettings = configuration.GetSection("Email").Get<MailConfig>();
        _hubContext = hubContext;
        _blobStorageSettings = blobStorageSettings;
        _logger = logger;
        _formatCodeNoRepository = new BaseRepository<FormatCodeNo>(configuration, httpContextAccessor);
    }


    [HttpPost]
    public override async Task<IActionResult> InsertData([FromForm] InsertFormCollection form)
    {
        var entity = new QuotationTmp();
        JsonConvert.PopulateObject(form.values, entity);
        PICAttributes pICAttributes = new PICAttributes();
        pICAttributes = JsonConvert.DeserializeObject<PICAttributes>(entity.PIC);
        List<FormatCodeNo> tableConfig = new List<FormatCodeNo>();
        tableConfig = await _formatCodeNoRepository.GetListObjectFullInclude(l => l.NoSeqCode == nameof(Quotation) + "Code");
        entity.OldQuotationCode = entity.QuotationCode;
        entity.OldQuotationId = entity.Id;
        entity.QuotationCode = ControllerUtil.GenerateNumberSeq(tableConfig, _formatCodeNoRepository, nameof(Quotation));
        entity.PICFO   = pICAttributes?.FO  ?? ""  ;
        entity.PICTS   = pICAttributes?.TS ?? "";
        entity.PICUW   = pICAttributes?.UW ?? "";
        entity.PICLMKT = pICAttributes?.LMKT ?? "";
        entity.PICPM = pICAttributes?.PM ?? "";
        entity = await _BaseRepository.InsertData(entity);
        return Ok(entity);
    }
}
