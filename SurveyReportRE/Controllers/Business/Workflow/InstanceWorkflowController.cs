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
using ERPCore.Models.Migration.Business.Social;
using Microsoft.AspNetCore.SignalR;
using Microsoft.SharePoint.Client;
using iText.Kernel.Pdf.Canvas.Wmf;

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
    private readonly IBaseRepository<TurnAroundTimeConfig> _turnAroundTimeConfigRepository;
    private readonly IBaseRepository<TurnAroundTimeDeptProcessing> _turnAroundTimeDeptProcessingRepository;
    private readonly IBaseRepository<TurnAroundTimeSession> _turnAroundTimeSessionRepository;
    private readonly IBaseRepository<Notification> _notificationRepository;
    private readonly IBaseRepository<UrlCall> _urlCallRepository;
    private readonly IHubContext<FileProcessingHub> _hubContext;
    private string DOMAIN_NAME = "";
    private MailConfig _emailSettings;
    public InstanceWorkflowController(IBaseRepository<InstanceWorkflow> BaseRepository
        , IConfiguration config
        , IHttpContextAccessor httpContextAccessor
        , ILogger<QuotationCommentLog> logger
        , IOptionsMonitor<BlobStorageSettings> optionsMonitor
        , IHubContext<FileProcessingHub> hubContext
        ) : base(BaseRepository, httpContextAccessor)
    {
        configuration = config;
        _httpContextAccessor = httpContextAccessor;
        _logger = logger;
        _optionsMonitor = optionsMonitor;
        _BaseRepository = BaseRepository;
        _quotationRepository = new BaseRepository<Quotation>(configuration, _httpContextAccessor);
        _quotationCommentLogRepository = new BaseRepository<QuotationCommentLog>(configuration, _httpContextAccessor);
        _mailQueueRepository = new BaseRepository<MailQueue>(configuration, _httpContextAccessor);
        _mailTemplateRepository = new BaseRepository<MailTemplate>(configuration, _httpContextAccessor);
        _usersRepository = new BaseRepository<Users>(configuration, _httpContextAccessor);
        _employeeRepository = new BaseRepository<Employee>(configuration, _httpContextAccessor);
        _turnAroundTimeConfigRepository = new BaseRepository<TurnAroundTimeConfig>(configuration, _httpContextAccessor);
        _turnAroundTimeDeptProcessingRepository = new BaseRepository<TurnAroundTimeDeptProcessing>(configuration, _httpContextAccessor);
        _turnAroundTimeSessionRepository = new BaseRepository<TurnAroundTimeSession>(configuration, _httpContextAccessor);
        _notificationRepository = new BaseRepository<Notification>(configuration, _httpContextAccessor);
        _urlCallRepository = new BaseRepository<UrlCall>(configuration, _httpContextAccessor);
        _emailSettings = configuration.GetSection("Email").Get<MailConfig>();
        _hubContext = hubContext;
        DOMAIN_NAME = configuration.GetSection("Domain:DCServer").Value;
    }

    [HttpPost]
    public async Task<IActionResult> QuotationSubmitNextStep([FromBody] SubmitRequest submitRequest)
    {

        if (string.IsNullOrEmpty(submitRequest.StepsWorkflow.FromNodeId) || string.IsNullOrEmpty(submitRequest.StepsWorkflow.ToNodeId)) return StatusCode(500, "Submit problem, please contact IT Admin!!!!");
        //submitRequest.InstanceWorkflow.CurrentStep = ControllerHelper.UpStep(submitRequest.InstanceWorkflow).ToString();
        //submitRequest.InstanceWorkflow.CurrentStep = submitRequest.StepsWorkflow.JumpStepNo;
        submitRequest.InstanceWorkflow.CurrentStep = submitRequest.StepsWorkflow.TNodeId;
        await _BaseRepository.UpdateData(submitRequest.InstanceWorkflow, JsonConvert.SerializeObject(submitRequest.InstanceWorkflow), submitRequest.InstanceWorkflow?.Id, "Id");
        Quotation quotation = new Quotation();
        quotation = await _quotationRepository.GetSingleObject(s => s.Id == submitRequest.QuotationId);
        quotation.StageDept = submitRequest.StepsWorkflow.ToNodeId;
        TurnAroundAttributes result = JsonConvert.DeserializeObject<TurnAroundAttributes>(quotation.TurnAroundTimeAttributes);
        TurnAroundItem tatObject = submitRequest.StepsWorkflow.FromNodeId switch
        {
            "FO" => result.FO,
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

        await TATLog(quotation, tatObject, submitRequest.StepsWorkflow.FromNodeId);

        await _quotationRepository.UpdateData(quotation, JsonConvert.SerializeObject(quotation), quotation?.Id, "Id");
        var userInfo = await ControllerHelper.FetchUserRoles(_httpContextAccessor, configuration, DOMAIN_NAME);
        string logQuery = $@"INSERT INTO QuotationCommentLog (QuotationId
,DeptCode,CommentOrder,CommentBy,CommentTime,CommentText,SourceSystem)
            VALUES ({quotation.Id},'{submitRequest.StepsWorkflow.FromNodeId}'
,{0}
,'{userInfo.Users?.name ?? "Anonymous"}'
,'{DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")}'
,N'{submitRequest.Comment}'
,'WEB')
        ";


        string logFlowQuery = $@"INSERT INTO QuotationWorkflowHistory(QuotationId
,StepNo,DeptCode,ActionTime,ActionNote,FromDeptCode,ToDeptCode,ActionCode,Actor,SourceSystem)
            VALUES ({quotation.Id},'{submitRequest.InstanceWorkflow.CurrentStep}'
,'{submitRequest.StepsWorkflow.FromNodeId}'
,'{DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")}'
,'{submitRequest.StepsWorkflow.DisplayStatus}'
,'{submitRequest.StepsWorkflow.FromNodeId}'
,'{submitRequest.StepsWorkflow.ToNodeId}'
,'{submitRequest.StepsWorkflow.ActionCode}'
,'{userInfo.Users?.name ?? "Anonymous"}','WEB')
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
        ControllerHelper.SignalRResponse( "ItemSubmitted", new { type = "Quotation" }, ControllerUtil.GetCurrentContextUser(_httpContextAccessor, configuration), DOMAIN_NAME);
        Employee employee = new Employee();
        flowUser = await _usersRepository.GetSingleObject(s => s.username == accountName);
        employee = await _employeeRepository.GetSingleObject(s => s.UsersId == flowUser.Id);
            MailQueue mailQueue = new MailQueue();
        if (mailTemplate != null)
        {
            DataTable query = DataUtil.ExecuteSelectQuery(_BaseRepository._connectionString, mailTemplate.MailQuery, ("", ""));
            Dictionary<string, object> flowDictionaryData = new Dictionary<string, object>();
            if (query.Rows.Count > 0)

                flowDictionaryData = Util.MakeQueryIntoDirectory(query.Rows[0]);
            mailQueue = Util.NotifySession(employee, mailTemplate, _emailSettings, flowDictionaryData, Util.CCAllEmail(_emailSettings.FollowCC, ""), null);
            if (mailQueue != null) await _mailQueueRepository.InsertData(mailQueue);
        }

        dynamic transferObject = new
        {
            DOMAIN_NAME = DOMAIN_NAME,
            Title = "Assigning Task",
            Subject = $"You have been submitted from {employee.FullName}",
            Resource = "Assign from ",
            Guid = quotation.Guid,
            ReceivedBy = accountName,
            Id = quotation.Id,
            Code = quotation.QuotationCode
        };



        Notification notification = new Notification();
        UrlCall urlCall = new UrlCall();
        if (submitRequest.isEmail ?? false)
        {//Test cho nay
            //notification = await ControllerUtil.MakeNotificationFromEmail(notification, mailQueue, quotation, configuration,out urlCall);
            notification = await ControllerUtil.NotifySameEmail(notification, transferObject);
        }
        else
            notification = await ControllerUtil.Notify(transferObject);
        await _urlCallRepository.InsertData(urlCall);
        await _notificationRepository.InsertData(notification);

        return Ok();
    }


    public async Task<IActionResult> QuotationReturnToStep([FromBody] SubmitRequest submitRequest)
    {

        if (string.IsNullOrEmpty(submitRequest.StepsWorkflow.FromNodeId) || string.IsNullOrEmpty(submitRequest.StepsWorkflow.ToNodeId)) return StatusCode(500, "Submit problem, please contact IT Admin!!!!");
        //submitRequest.InstanceWorkflow.CurrentStep = submitRequest.StepsWorkflow.JumpStepNo;
        submitRequest.InstanceWorkflow.CurrentStep = submitRequest.StepsWorkflow.TNodeId;
        await _BaseRepository.UpdateData(submitRequest.InstanceWorkflow, JsonConvert.SerializeObject(submitRequest.InstanceWorkflow), submitRequest.InstanceWorkflow?.Id, "Id");
        Quotation quotation = new Quotation();
        quotation = await _quotationRepository.GetSingleObject(s => s.Id == submitRequest.QuotationId);
        quotation.StageDept = submitRequest.StepsWorkflow.ToNodeId;
        TurnAroundAttributes result = JsonConvert.DeserializeObject<TurnAroundAttributes>(quotation.TurnAroundTimeAttributes);
        TurnAroundItem tatObject = submitRequest.StepsWorkflow.FromNodeId switch
        {
            "FO" => result.FO,
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

        await TATLog(quotation, tatObject, submitRequest.StepsWorkflow.FromNodeId);

        await _quotationRepository.UpdateData(quotation, JsonConvert.SerializeObject(quotation), quotation?.Id, "Id");
        var userInfo = await ControllerHelper.FetchUserRoles(_httpContextAccessor, configuration, DOMAIN_NAME);
        string logQuery = $@"INSERT INTO QuotationCommentLog (QuotationId
,DeptCode,CommentOrder,CommentBy,CommentTime,CommentText,SourceSystem)
            VALUES ({quotation.Id},'{submitRequest.StepsWorkflow.FromNodeId}'
,{0}
,'{userInfo.Users?.name ?? "Anonymous"}'
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
,'{userInfo.Users?.name ?? "Anonymous"}','WEB')
        ";
        var quotationCommentLogApiController = new QuotationCommentLogController(_quotationCommentLogRepository, configuration, _httpContextAccessor, _logger, _optionsMonitor);
        await quotationCommentLogApiController.ExecuteCustomQuery(logQuery);
        await quotationCommentLogApiController.ExecuteCustomQuery(logFlowQuery);


        MailTemplate mailTemplate = new MailTemplate();
        mailTemplate = await _mailTemplateRepository.GetSingleObject(s => s.TemplateName == "Return Mail");
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
        ControllerHelper.SignalRResponse( "ItemSubmitted", new { type = "Quotation" }, ControllerUtil.GetCurrentContextUser(_httpContextAccessor, configuration), DOMAIN_NAME);
        Employee employee = new Employee();
        flowUser = await _usersRepository.GetSingleObject(s => s.username == accountName);
        employee = await _employeeRepository.GetSingleObject(s => s.UsersId == flowUser.Id);
        if (mailTemplate != null)
        {
            DataTable query = DataUtil.ExecuteSelectQuery(_BaseRepository._connectionString, mailTemplate.MailQuery, ("", ""));
            Dictionary<string, object> flowDictionaryData = new Dictionary<string, object>();
            if (query.Rows.Count > 0)

                flowDictionaryData = Util.MakeQueryIntoDirectory(query.Rows[0]);
            MailQueue mailQueue = new MailQueue();
            mailQueue = Util.NotifySession(employee, mailTemplate, _emailSettings, flowDictionaryData, Util.CCAllEmail(_emailSettings.FollowCC, ""), null);
            if (mailQueue != null) await _mailQueueRepository.InsertData(mailQueue);
        }


        dynamic transferObject = new
        {
            DOMAIN_NAME = DOMAIN_NAME,
            Title = "Assigning Task",
            Subject = $"You have been returned from {employee.FullName}",
            Resource = "Assign from ",
            Guid = quotation.Guid,
            ReceivedBy = accountName,
            Id = quotation.Id,
            Code = quotation.QuotationCode
        };

        Notification notification = await ControllerUtil.Notify(transferObject);
        await _notificationRepository.InsertData(notification);

        return Ok();
    }
    public async Task TATLog([FromBody]Quotation quotation, [FromQuery] TurnAroundItem tatObject, string department)
    {
         TurnAroundTimeSession activeSession = new TurnAroundTimeSession();
            activeSession = await _turnAroundTimeSessionRepository
            .GetSingleObject(s => s.RecordGuid == quotation.Guid);


                if (activeSession == null)
                {
                    // Đếm số phiên đã có để tính SessionNo tiếp theo
                    var allSessions = await _turnAroundTimeSessionRepository
                        .GetListObject(s => s.RecordGuid == quotation.Guid);

            int nextSessionNo = (allSessions?.Count ?? 0) + 1;

            activeSession = new TurnAroundTimeSession
                    {
                        SessionNo = nextSessionNo,
                        SessionTypeId = quotation.RequestTypeId,   // truyền từ client: New=1 / Renew=2 / Amend=3
                        SessionStartDate = tatObject.AcceptDate,
                        SessionEndDate = tatObject.CompleteDate,
                        TotalDays = 0,
                        RecordGuid = quotation.Guid
        };
        await _turnAroundTimeSessionRepository.InsertData(activeSession);
                    // Sau insert, activeSession.Id đã được gán bởi EF/repository
                }
                else
        {
            // Đếm số phiên đã có để tính SessionNo tiếp theo
            var allSessions = await _turnAroundTimeSessionRepository
                .GetListObject(s => s.RecordGuid == quotation.Guid);


            activeSession.SessionNo = activeSession.SessionNo;
            activeSession.SessionTypeId = quotation.RequestTypeId;   // truyền từ client: New=1 / Renew=2 / Amend=3
            activeSession.SessionStartDate = activeSession.SessionStartDate;
            activeSession.SessionEndDate = tatObject.CompleteDate;
            activeSession.TotalDays = 0;
            activeSession.RecordGuid = quotation.Guid;
            await _turnAroundTimeSessionRepository.UpdateData(activeSession, JsonConvert.SerializeObject(activeSession), activeSession.Id, "Id");
            // Sau insert, activeSession.Id đã được gán bởi EF/repository
        }

        // Bước 2 — Tìm hoặc tạo DeptProcessing cho phòng ban đang submit
        TurnAroundTimeDeptProcessing deptProcessing = new TurnAroundTimeDeptProcessing();

        DateTime acceptDate = tatObject.AcceptDate ?? DateTime.Now;
        DateTime completeDate = tatObject.CompleteDate ?? DateTime.Now;
        int processingDays = (completeDate.Date - acceptDate.Date).Days;  // đơn vị ngày

        // Chưa có → tạo mới
        deptProcessing = new TurnAroundTimeDeptProcessing
        {
            TurnAroundTimeSessionId = activeSession.Id,
            Department = department,
            AcceptDate = acceptDate,
            CompleteDate = completeDate,
            ProcessingDays = processingDays
        };
        await _turnAroundTimeDeptProcessingRepository.InsertData(deptProcessing);

        }
}

