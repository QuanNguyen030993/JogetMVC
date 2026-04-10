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

[ApiController]
[Route("api/[controller]/[action]")]
public class QuotationTmpController : BaseControllerApi<Quotation>
{
    private readonly IBaseRepository<Quotation> _BaseRepository;
    private readonly IConfiguration configuration;
    private readonly IHubContext<FileProcessingHub> _hubContext;
    private readonly ILogger<Quotation> _logger;
    private readonly IConfigurationSection path;
    private readonly IHttpContextAccessor _httpContextAccessor; 
    private MailConfig _emailSettings;
    private readonly Microsoft.Extensions.Options.IOptionsMonitor<BlobStorageSettings> _blobStorageSettings;
    public QuotationTmpController(IBaseRepository<Quotation> BaseRepository
        , IConfiguration config
        , IHttpContextAccessor httpContextAccessor
        , ILogger<Quotation> logger
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
    }


}
