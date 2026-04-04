using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using ERPCore.Common;
using ERPCore.Controllers.Base;
using ERPCore.Models.Base;
using ERPCore.Models.Migration.Business.Data;
using ERPCore.Models.Migration.Business.Form;
using ERPCore.Models.Migration.Business.Workflow;
using Syncfusion.Pdf.Graphics;
using System.Data;
using ERPCore.Models.Request;
using Microsoft.SharePoint.WebControls;
using ERPCore.Models;
using ERPCore.ControllerUtil;
using ERPCore.Models.Migration.Business.HumanResource;
using ERPCore.Models.Migration.Business.MasterData;
using ERPCore.Repository;
using ERPCore.Models.Migration.Business.Config;

[ApiController]
[Route("api/[controller]/[action]")]
public class InstanceWorkflowController : BaseControllerApi<InstanceWorkflow>
{
    private readonly IBaseRepository<InstanceWorkflow> _BaseRepository;
    private readonly IBaseRepository<Quotation> _quotationRepository;
    private readonly IBaseRepository<QuotationCommentLog> _quotationCommentLogRepository;
    private readonly IConfiguration configuration;
    private readonly IConfigurationSection path;
    private readonly ILogger<QuotationCommentLog> _logger;
    private readonly IOptionsMonitor<BlobStorageSettings> _optionsMonitor;
    private readonly IBaseRepository<MailTemplate> _mailTemplateRepository;
    private readonly IBaseRepository<MailQueue> _mailQueueRepository;
    private readonly IBaseRepository<Users> _usersRepository;
    private readonly IBaseRepository<Employee> _employeeRepository;
    private string DOMAIN_NAME = "";
    private MailConfig _emailSettings;
    public InstanceWorkflowController(IBaseRepository<InstanceWorkflow> BaseRepository, IConfiguration config, IHttpContextAccessor httpContextAccessor, ILogger<QuotationCommentLog> logger, IOptionsMonitor<BlobStorageSettings> optionsMonitor) : base(BaseRepository, httpContextAccessor)
    {
        configuration = config;
        _httpContextAccessor = httpContextAccessor;
        _logger = logger;
        _optionsMonitor = optionsMonitor;
        _BaseRepository = BaseRepository;
        _quotationRepository = new BaseRepository<Quotation>(configuration, _httpContextAccessor);
        _quotationCommentLogRepository = new BaseRepository<QuotationCommentLog>(configuration, _httpContextAccessor);
        _mailQueueRepository = new BaseRepository<MailQueue>(configuration, _httpContextAccessor);
        _emailSettings = configuration.GetSection("Email").Get<MailConfig>();
        DOMAIN_NAME = configuration.GetSection("Domain:DCServer").Value;
    }

    [HttpPost]
    public async Task<IActionResult> SubmitNextStep([FromBody] SubmitRequest submitRequest)
    {

        if (string.IsNullOrEmpty(submitRequest.StepsWorkflow.FromNodeId) || string.IsNullOrEmpty(submitRequest.StepsWorkflow.ToNodeId)) return StatusCode(500, "Submit problem, please contact IT Admin!!!!");
        submitRequest.InstanceWorkflow.CurrentStep = UpStep(submitRequest.InstanceWorkflow);
        await _BaseRepository.UpdateData(submitRequest.InstanceWorkflow, JsonConvert.SerializeObject(submitRequest.InstanceWorkflow), submitRequest.InstanceWorkflow?.Id, "Id");
        Quotation quotation = new Quotation();
        quotation = await _quotationRepository.GetSingleObject(s => s.Id == submitRequest.QuotationId);
        quotation.StageDept = submitRequest.StepsWorkflow.ToNodeId;
        TurnAroundAttributes result = JsonConvert.DeserializeObject<TurnAroundAttributes>(quotation.TurnAroundTimeAttributes);
        TurnAroundItem tatObject = submitRequest.StepsWorkflow.FromNodeId switch
        {
            "FO" =>  result.FO,
            "TS" => result.TS,
            "UW" => result.UW,
            "LMKT" => result.LMKT,
            "PM" => result.PM,
            _ => null
        };
        tatObject.CompleteDate = DateTime.Now;
        switch (submitRequest.StepsWorkflow.FromNodeId)
        {
            case "FO":
                result.FO = tatObject;
                break;
            case "TS":
                result.TS = tatObject;
                break;
            case "UW":
                result.UW = tatObject;
                break;
            case "LMKT":
                result.LMKT = tatObject;
                break;
            case "PM":
                result.PM = tatObject;
                break;
        }
        quotation.TurnAroundTimeAttributes = JsonConvert.SerializeObject(result);
        
         await _quotationRepository.UpdateData(quotation, JsonConvert.SerializeObject(quotation), quotation?.Id, "Id");
        var userInfo = await ControllerHelper.FetchUserRoles(_httpContextAccessor,configuration, DOMAIN_NAME);
        string logQuery = $@"INSERT INTO QuotationCommentLog (QuotationId
,DeptCode,CommentOrder,CommentBy,CommentTime,CommentText,SourceSystem)
            VALUES ({quotation.Id},'{submitRequest.StepsWorkflow.FromNodeId}'
,{0}
,'{userInfo.Users.name}'
,'{DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")}'
,N'{submitRequest.Comment}'
,'WEB')
        ";


        string logFlowQuery = $@"INSERT INTO QuotationWorkflowHistory(QuotationId
,StepNo,DeptCode,ActionTime,ActionNote,FromDeptCode,ToDeptCode,ActionCode,Actor,SourceSystem)
            VALUES ({quotation.Id},{submitRequest.InstanceWorkflow.CurrentStep}
,'{submitRequest.StepsWorkflow.FromNodeId}'
,'{DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")}'
,'{submitRequest.StepsWorkflow.DisplayStatus}'
,'{submitRequest.StepsWorkflow.FromNodeId}'
,'{submitRequest.StepsWorkflow.ToNodeId}'
,'{submitRequest.StepsWorkflow.ActionCode}'
,'{userInfo.Users.name}','WEB')
        ";
        var quotationCommentLogApiController = new QuotationCommentLogController(_quotationCommentLogRepository, configuration, _httpContextAccessor, _logger, _optionsMonitor);
        await quotationCommentLogApiController.ExecuteCustomQuery(logQuery);
        await quotationCommentLogApiController.ExecuteCustomQuery(logFlowQuery);


        MailTemplate mailTemplate = new MailTemplate();
        mailTemplate = await _mailTemplateRepository.GetSingleObject(s => s.TemplateName == "Submit Mail");
        Users flowUser = new Users();
        PICAttributes pICAttributes = new PICAttributes();
        pICAttributes = JsonConvert.DeserializeObject<PICAttributes>(quotation.PIC);
        string accountName = submitRequest.StepsWorkflow.ToNodeId switch
        {
            "FO" => pICAttributes.FO,
            "TS" => pICAttributes.TS,
            "UW" => pICAttributes.UW,
            "LMKT" => pICAttributes.LMKT,
            "PM" => pICAttributes.PM,
            _ => null
        };
        Employee employee = new Employee();
        flowUser = await _usersRepository.GetSingleObject(s => s.username == accountName);
        employee = await _employeeRepository.GetSingleObject(s => s.UsersId == flowUser.Id);
        DataTable query = DataUtil.ExecuteSelectQuery(_BaseRepository._connectionString, mailTemplate.MailQuery, ("", ""));
        Dictionary<string, object> flowDictionaryData = new Dictionary<string, object>();
        if (query.Rows.Count > 0)

            flowDictionaryData = Util.MakeQueryIntoDirectory(query.Rows[0]);
        MailQueue mailQueue = new MailQueue();
        //mailQueue = Util.NotifySession(employee, mailTemplate, _emailSettings, flowDictionaryData, Util.CCAllEmail(_emailSettings.FollowCC, ""), null);
        await _mailQueueRepository.InsertData(mailQueue);

        return Ok();
    }
    public static int UpStep(InstanceWorkflow instanceWorkflow)
    {
        if (instanceWorkflow != null)
            return (instanceWorkflow?.CurrentStep ?? 0) + 1;
        else return 1;
    }
    public static int DownStep(InstanceWorkflow instanceWorkflow)
    {
        if (instanceWorkflow != null)
            return ((instanceWorkflow?.CurrentStep ?? 0) - 1) < 1 ? 1 : (instanceWorkflow?.CurrentStep ?? 0) - 1;
        else return 1;
    }
}

