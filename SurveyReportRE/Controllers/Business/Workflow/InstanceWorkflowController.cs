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
using static ERPCore.Models.Models.Parsing.JsonHandle;
using ERPCore.Models.Business.Migration.Config;
using ERPCore.Models.Migration.Business.Workflow;
using static WorkflowDefinition_FormModel;

[ApiController]
[Route("api/[controller]/[action]")]
public class InstanceWorkflowController : BaseControllerApi<InstanceWorkflow>
{
    private readonly IBaseRepository<InstanceWorkflow> _BaseRepository;
    private readonly IBaseRepository<Quotation> _quotationRepository;
    private readonly IBaseRepository<CommentLog> _quotationCommentLogRepository;
    private readonly IConfiguration configuration;
    private readonly IConfigurationSection path;
    private readonly ILogger<CommentLog> _logger;
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
    private readonly IBaseRepository<StepsWorkflow> _stepsWorkflowRepository;
    private readonly IBaseRepository<Document> _documentRepository;
    private readonly IBaseRepository<WorkflowInstanceNode> _workflowInstanceNodeRepository;
    private readonly IHubContext<FileProcessingHub> _hubContext;
    private readonly Microsoft.Extensions.Options.IOptionsMonitor<BlobStorageSettings> _blobStorageSettings;
    private readonly Microsoft.Extensions.Options.IOptionsMonitor<BusinessConfig> _businessConfig;
    private string DOMAIN_NAME = "";
    private MailConfig _emailSettings;
    public InstanceWorkflowController(IBaseRepository<InstanceWorkflow> BaseRepository
        , IConfiguration config
        , IHttpContextAccessor httpContextAccessor
        , ILogger<CommentLog> logger
        , IOptionsMonitor<BlobStorageSettings> optionsMonitor
        , Microsoft.Extensions.Options.IOptionsMonitor<BlobStorageSettings> blobStorageSettings
        , Microsoft.Extensions.Options.IOptionsMonitor<BusinessConfig> businessConfig
        , IHubContext<FileProcessingHub> hubContext
        ) : base(BaseRepository, httpContextAccessor)
    {
        configuration = config;
        _httpContextAccessor = httpContextAccessor;
        _logger = logger;
        _optionsMonitor = optionsMonitor;
        _BaseRepository = BaseRepository;
        _quotationRepository = new BaseRepository<Quotation>(configuration, _httpContextAccessor);
        _quotationCommentLogRepository = new BaseRepository<CommentLog>(configuration, _httpContextAccessor);
        _mailQueueRepository = new BaseRepository<MailQueue>(configuration, _httpContextAccessor);
        _mailTemplateRepository = new BaseRepository<MailTemplate>(configuration, _httpContextAccessor);
        _usersRepository = new BaseRepository<Users>(configuration, _httpContextAccessor);
        _employeeRepository = new BaseRepository<Employee>(configuration, _httpContextAccessor);
        _turnAroundTimeConfigRepository = new BaseRepository<TurnAroundTimeConfig>(configuration, _httpContextAccessor);
        _turnAroundTimeDeptProcessingRepository = new BaseRepository<TurnAroundTimeDeptProcessing>(configuration, _httpContextAccessor);
        _turnAroundTimeSessionRepository = new BaseRepository<TurnAroundTimeSession>(configuration, _httpContextAccessor);
        _notificationRepository = new BaseRepository<Notification>(configuration, _httpContextAccessor);
        _urlCallRepository = new BaseRepository<UrlCall>(configuration, _httpContextAccessor);
        _stepsWorkflowRepository = new BaseRepository<StepsWorkflow>(configuration, _httpContextAccessor);
        _documentRepository = new BaseRepository<Document>(configuration, _httpContextAccessor);
        _workflowInstanceNodeRepository = new BaseRepository<WorkflowInstanceNode>(configuration, _httpContextAccessor);
        _emailSettings = configuration.GetSection("Email").Get<MailConfig>();
        _hubContext = hubContext;
        _blobStorageSettings = blobStorageSettings;
        _businessConfig = businessConfig;
        DOMAIN_NAME = configuration.GetSection("Domain:DCServer").Value;
    }

    [HttpPost]
    public async Task<IActionResult> QuotationSubmitNextStep([FromBody] SubmitRequest submitRequest)
    {

        if (string.IsNullOrEmpty(submitRequest.StepsWorkflow.FromNodeId) || string.IsNullOrEmpty(submitRequest.StepsWorkflow.ToNodeId)) return StatusCode(500, "Submit problem, please contact IT Admin!!!!");
        submitRequest.InstanceWorkflow.CurrentStep = submitRequest.StepsWorkflow.TNodeId;
        await _BaseRepository.UpdateData(submitRequest.InstanceWorkflow, JsonConvert.SerializeObject(submitRequest.InstanceWorkflow), submitRequest.InstanceWorkflow?.Id, "Id");
        Quotation quotation = new Quotation();
        quotation = await _quotationRepository.GetSingleObject(s => s.Id == submitRequest.QuotationId);
        quotation.StageDept = submitRequest.StepsWorkflow.ToNodeId;
        quotation.WorkflowStatus = submitRequest.StepsWorkflow.StatusName;
        quotation.StatusId = submitRequest.StepsWorkflow.StatusId;
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

        WorkflowInstanceNode workflowInstanceNode = new WorkflowInstanceNode();
        workflowInstanceNode = await _workflowInstanceNodeRepository.GetSingleObject(s => s.Code == submitRequest.InstanceWorkflow.CurrentStep);

        if (workflowInstanceNode == null) return StatusCode(500, "Cannot find node in workflow!");
        if (workflowInstanceNode.NodeStatus == "End")
        {
            quotation.StageDept = "";
            quotation.StageAccount = "";
        }    

        await _quotationRepository.UpdateData(quotation, JsonConvert.SerializeObject(quotation), quotation?.Id, "Id");

        if (submitRequest.StepsWorkflow.Command != null)
        {
            WorkflowCommand commandEnum = WorkflowCommand.None;

            if (!string.IsNullOrEmpty(submitRequest.StepsWorkflow.Command))
            {
                Enum.TryParse(
                    submitRequest.StepsWorkflow.Command,
                    true, // ignore case
                    out commandEnum
                );
            }
            switch (commandEnum)
            {
                case WorkflowCommand.TransferFile:

                    var config = JsonConvert.DeserializeObject<TransferFileConfig>(
                        submitRequest.StepsWorkflow.CommandConfig ?? "{}"
                    );

                    await HandleTransferFile(config, quotation);
                    break;

                case WorkflowCommand.CopyFile:

                    //await HandleCopyFile();
                    break;

                case WorkflowCommand.LockFileLocal:

                    //await HandleLockFile();
                    break;

                default:
                    // do nothing
                    break;
            }
        }






        var userInfo = await ControllerHelper.FetchUserRoles(_httpContextAccessor, configuration, DOMAIN_NAME);
        await ControllerUtil.LogAction(_quotationCommentLogRepository, _httpContextAccessor, configuration, DOMAIN_NAME, quotation, submitRequest, _blobStorageSettings);



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
        ControllerHelper.SignalRResponse("R_ItemSubmitted", new { type = "Quotation" }, ControllerUtil.GetCurrentContextUser(_httpContextAccessor, configuration), DOMAIN_NAME);
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
            Subject = $"{quotation.QuotationCode} have been submitted from {userInfo.Employee?.FullName ?? "anonymous" }",
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

    private async Task HandleTransferFile(TransferFileConfig config, dynamic ObjectIn)
    {//{   "sourceDepartment": "FO",   "strategy": "Latest",   "fileSelector": "First",   "allowOverride": false }
        if (config == null)
            throw new Exception("Invalid TransferFile config");
        Guid guid = (Guid)ObjectIn.Guid;
        List<Document> files = new List<Document>();
        files = await _documentRepository.GetListObject(l => l.RecordGuid == guid);
        List<Document> result = new List<Document>();
        if (config.FileSelector == "First")
            result.Add(files.OrderByDescending(x => x.CreatedDate).FirstOrDefault(x => x.Attributes.Contains(config.SourceDepartment)));


        if (result == null)
            throw new Exception($"No file found in department {config.SourceDepartment}");
        foreach (Document item in result)
        {
            if (item == null || item.Attributes == null) continue;
            Document newDocument = new Document();
            newDocument.Attributes = item.Attributes.Replace(config.SourceDepartment, config.TargetDepartment);
            await _documentRepository.UpdateData(newDocument, item, ["Attributes"], "Id");
        }
        
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
        quotation.WorkflowStatus = submitRequest.StepsWorkflow.StatusName;
        quotation.StatusId = submitRequest.StepsWorkflow.StatusId;
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
        await ControllerUtil.LogAction(_quotationCommentLogRepository, _httpContextAccessor, configuration, DOMAIN_NAME, quotation, submitRequest, _blobStorageSettings);


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
        ControllerHelper.SignalRResponse( "R_ItemSubmitted", new { type = "Quotation" }, ControllerUtil.GetCurrentContextUser(_httpContextAccessor, configuration), DOMAIN_NAME);
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
            Subject = $"{quotation.QuotationCode} have been returned from {employee.FullName}",
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

    [HttpPost]
    public async Task<IActionResult> RecoverWorkflow([FromBody] WorkflowRecoverRequest request)
    {
        if (request == null) return BadRequest("Recover payload is required.");

        InstanceWorkflow instanceWorkflow = await _BaseRepository.GetSingleObject(s => s.Id == request.InstanceWorkflowId);
        if (instanceWorkflow == null) return NotFound("InstanceWorkflow not found.");

        StepsWorkflow selectedStep = await _stepsWorkflowRepository.GetSingleObject(s => s.Id == request.StepsWorkflowId);
        if (selectedStep == null) return NotFound("StepsWorkflow not found.");

        StepsWorkflow targetStep = selectedStep;
        bool isRevise = string.Equals(request.Mode, "Revise", StringComparison.OrdinalIgnoreCase);
        if (isRevise)
        {
            targetStep = await _stepsWorkflowRepository.GetSingleObject(s => s.WorkflowDefinitionId == instanceWorkflow.WorkflowDefinitionId && (s.IsStart ?? false))
                ?? selectedStep;
        }

        string nextCurrentStep = isRevise
            ? (!string.IsNullOrEmpty(targetStep.TNodeId) ? targetStep.TNodeId : targetStep.FNodeId)
            : (!string.IsNullOrEmpty(targetStep.FNodeId) ? targetStep.FNodeId : targetStep.TNodeId);

        if (string.IsNullOrEmpty(nextCurrentStep)) return BadRequest("Target step does not have a valid workflow node id.");

        instanceWorkflow.CurrentStep = nextCurrentStep;
        await _BaseRepository.UpdateData(instanceWorkflow, JsonConvert.SerializeObject(instanceWorkflow), instanceWorkflow.Id, "Id");

        Quotation quotation = await _quotationRepository.GetSingleObject(s => s.Guid == instanceWorkflow.RecordGuid);
        if (quotation != null)
        {
            quotation.StageDept = isRevise ? targetStep.ToNodeId : targetStep.FromNodeId;
            quotation.WorkflowStatus = targetStep.StatusName ?? quotation.WorkflowStatus;
            quotation.StatusId = targetStep.StatusId;
            await _quotationRepository.UpdateData(quotation, JsonConvert.SerializeObject(quotation), quotation.Id, "Id");
        }

        return Ok(new
        {
            instanceWorkflow.Id,
            instanceWorkflow.RecordGuid,
            instanceWorkflow.WorkflowDefinitionId,
            CurrentStep = instanceWorkflow.CurrentStep,
            QuotationStageDept = quotation?.StageDept,
            QuotationWorkflowStatus = quotation?.WorkflowStatus,
            QuotationStatusId = quotation?.StatusId,
            Mode = isRevise ? "Revise" : "Recover",
            TargetStepId = targetStep.Id,
            TargetFromNodeId = targetStep.FromNodeId,
            TargetToNodeId = targetStep.ToNodeId,
            request.Note
        });
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
    public class TransferFileConfig
    {
        public string SourceDepartment { get; set; }
        public string TargetDepartment { get; set; }
        public string Strategy { get; set; } // Latest
        public string FileSelector { get; set; } // First
    }

    public class WorkflowRecoverRequest
    {
        public long InstanceWorkflowId { get; set; }
        public long StepsWorkflowId { get; set; }
        public string Mode { get; set; }
        public string Note { get; set; }
    }
}

