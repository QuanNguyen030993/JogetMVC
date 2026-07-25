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
using ERPCore.Models.Migration.Config;
using Newtonsoft.Json;
using ERPCore.Models.Business.Migration.Config;
using ERPCore.Models.Migration.Business.HumanResource;
using ERPCore.Models.Request;
using Microsoft.AspNetCore.SignalR;
using RESurveyTool.Models.Models.Parsing;
using ERPCore.Models.Migration.Business.Workflow;
using ERPCore.Models;
using System.Dynamic;
using ERPCore.Models.Models.Parsing;
using static ERPCore.Models.Models.Parsing.JsonHandle;
using ERPCore.Models.Migration.Business.Social;
using System.Reflection;
using ERPCore.Models.Migration.Business.Data;
using ERPCore.Models.Migration.Business.MasterData;
using Newtonsoft.Json.Linq;
using Org.BouncyCastle.Bcpg.Sig;
using AngleSharp.Text;

[ApiController]
[Route("api/[controller]/[action]")]
public class PolicyIssuanceController : BaseControllerApi<PolicyIssuance>
{
    private static readonly System.Text.Json.JsonSerializerOptions WebJsonOptions =
        new(System.Text.Json.JsonSerializerDefaults.Web);
    private readonly IBaseRepository<PolicyIssuance> _BaseRepository;
    private readonly IConfiguration configuration;
    private readonly IBaseRepository<Survey> _surveyRepository;
    private readonly IBaseRepository<ERPCore.Models.Migration.Business.Data.Attachment> _attachmentRepository;
    private readonly IBaseRepository<FormatCodeNo> _formatCodeNoRepository;
    private readonly IBaseRepository<Users> _usersRepository;
    private readonly IBaseRepository<Employee> _employeeRepository;
    private readonly IBaseRepository<UserRoles> _userRolesRepository;
    private readonly IBaseRepository<Roles> _rolesRepository;
    private readonly IHubContext<FileProcessingHub> _hubContext;
    private readonly IBaseRepository<InstanceWorkflow> _instanceWorkflowRepository;
    private readonly IBaseRepository<CommentLog> _quotationCommentLogRepository;
    private readonly IBaseRepository<StepsWorkflow> _stepsWorkflowRepository;
    private readonly IBaseRepository<EnumData> _enumDataRepository;
    private readonly IBaseRepository<WorkflowDefinition> _workflowDefinitionRepository;
    private readonly IBaseRepository<Notification> _notificationRepository;
    private readonly IBaseRepository<Document> _documentRepository;
    private readonly IBaseRepository<PolicyIssuanceDetails> _policyIssuanceDetailsRepository;
    private readonly IBaseRepository<PolicyIssuanceChecklist> _policyIssuanceChecklistRepository;
    private readonly IBaseRepository<ChecklistDefinition> _checklistDefinitionRepository;
    private readonly IBaseRepository<Quotation> _quotationRepository;
    private readonly IBaseRepository<MailTemplate> _mailTemplateRepository;
    private readonly IBaseRepository<NotificationTemplate> _notificationTemplateRepository;
    private readonly IBaseRepository<MailQueue> _mailQueueRepository;
    private readonly IBaseRepository<UsersSession> _usersSessionRepository;
    private readonly IBaseRepository<SLA> _slaRepository;
    private readonly ILogger<PolicyIssuance> _logger;
    private readonly IConfigurationSection path;
    public static string MANAGER_APP = "";
    public static string APPROVER_APP = "";
    public static string CHECKER_APP = "";
    public static string USER_APP = "";
    public static string SUPER_USER = "";
    public static string DOMAIN_NAME = "";
    private static string BLOB_PATH = "";
    public static string CURRENT_USER = "";
    private static string spUserName = "";
    private static string spPassword = "";
    private static string MAPPING_PATH = "";
    private MailConfig _emailSettings;
    private Message _messageSettings;
    private readonly Microsoft.Extensions.Options.IOptionsMonitor<BlobStorageSettings> _blobStorageSettings;
    private readonly Microsoft.Extensions.Options.IOptionsMonitor<BusinessConfig> _businessConfig;
    public PolicyIssuanceController(IBaseRepository<PolicyIssuance> BaseRepository
        , IConfiguration config
        , IHttpContextAccessor httpContextAccessor
        , ILogger<PolicyIssuance> logger
        , Microsoft.Extensions.Options.IOptionsMonitor<BlobStorageSettings> blobStorageSettings
         , Microsoft.Extensions.Options.IOptionsMonitor<BusinessConfig> businessConfig
         , IHubContext<FileProcessingHub> hubContext
        ) : base(BaseRepository, httpContextAccessor
            )
    {
        configuration = config;
        _BaseRepository = BaseRepository;
        _surveyRepository = new BaseRepository<Survey>(configuration, _httpContextAccessor);
        _attachmentRepository = new BaseRepository<ERPCore.Models.Migration.Business.Data.Attachment>(configuration, _httpContextAccessor);
        _formatCodeNoRepository = new BaseRepository<FormatCodeNo>(configuration, _httpContextAccessor);
        _usersRepository = new BaseRepository<Users>(configuration, _httpContextAccessor);
        _employeeRepository = new BaseRepository<Employee>(configuration, _httpContextAccessor);
        _userRolesRepository = new BaseRepository<UserRoles>(configuration, _httpContextAccessor);
        _rolesRepository = new BaseRepository<Roles>(configuration, _httpContextAccessor);
        _instanceWorkflowRepository = new BaseRepository<InstanceWorkflow>(configuration, _httpContextAccessor);
        _quotationCommentLogRepository = new BaseRepository<CommentLog>(configuration, _httpContextAccessor);
        _enumDataRepository = new BaseRepository<EnumData>(configuration, _httpContextAccessor);
        _stepsWorkflowRepository = new BaseRepository<StepsWorkflow>(configuration, _httpContextAccessor);
        _workflowDefinitionRepository = new BaseRepository<WorkflowDefinition>(configuration, _httpContextAccessor);
        _notificationRepository = new BaseRepository<Notification>(configuration, _httpContextAccessor);
        _documentRepository = new BaseRepository<Document>(configuration, _httpContextAccessor);
        _policyIssuanceDetailsRepository = new BaseRepository<PolicyIssuanceDetails>(configuration, _httpContextAccessor);
        _policyIssuanceChecklistRepository = new BaseRepository<PolicyIssuanceChecklist>(configuration, _httpContextAccessor);
        _checklistDefinitionRepository = new BaseRepository<ChecklistDefinition>(configuration, _httpContextAccessor);
        _quotationRepository = new BaseRepository<Quotation>(configuration, _httpContextAccessor);
        _mailTemplateRepository = new BaseRepository<MailTemplate>(configuration, _httpContextAccessor);
        _notificationTemplateRepository = new BaseRepository<NotificationTemplate>(configuration, _httpContextAccessor);
        _mailQueueRepository = new BaseRepository<MailQueue>(configuration, _httpContextAccessor);
        _slaRepository = new BaseRepository<SLA>(configuration, _httpContextAccessor);
        _usersSessionRepository = new BaseRepository<UsersSession>(configuration, _httpContextAccessor);
        _emailSettings = configuration.GetSection("Email").Get<MailConfig>();
        _hubContext = hubContext;
        MANAGER_APP = configuration.GetSection("BusinessConfig:ManagerAppKey").Value;
        APPROVER_APP = configuration.GetSection("BusinessConfig:ApproverAppKey").Value;
        CHECKER_APP = configuration.GetSection("BusinessConfig:CheckerAppKey").Value;
        USER_APP = configuration.GetSection("BusinessConfig:UserAppKey").Value;
        SUPER_USER = configuration.GetSection("SuperUser:SuperUser").Value;
        DOMAIN_NAME = configuration.GetSection("Domain:DCServer").Value;
        path = _BaseRepository._baseConfiguration.GetSection("BlobStorage:Path");
        _messageSettings = configuration.GetSection("Message").Get<Message>();

        MAPPING_PATH = _BaseRepository._baseConfiguration.GetSection("MigrationConfig:MappingField").Value;
        BLOB_PATH = path.Value;
        CURRENT_USER = _httpContextAccessor.HttpContext.User.Identity.Name?.Replace(DOMAIN_NAME, "") ?? "Anonymous";
        spUserName = configuration.GetSection("SharePoint:Username").Value;
        spPassword = configuration.GetSection("SharePoint:Password").Value;
        _blobStorageSettings = blobStorageSettings;
        _businessConfig = businessConfig;
        _logger = logger;
    }

    public async Task<IActionResult> GetIdsList()
    {
        List<PolicyIssuance> PolicyIssuance = await _BaseRepository.GetAll();
        if (PolicyIssuance != null)
        {

            object PolicyIssuanceData = PolicyIssuance.Select(s => s.Id).ToArray();
            return Ok(Newtonsoft.Json.JsonConvert.SerializeObject(PolicyIssuanceData));

            if (PolicyIssuance != null)
            {
            }
        }
        return Ok();
    }

    [HttpGet]
    public async Task<ActionResult<List<PolicyIssuance>>> FollowUpDocumentList()
    {
        const string signReminderCode = "SIGN_REMINDER_DAY";
        const string technicalServiceDept = "TS";

        var signReminderSla = await _slaRepository.GetSingleObject(s =>
            s.Code == signReminderCode && s.Dept == technicalServiceDept);
        var reminderDays = Math.Max(signReminderSla?.Value ?? 0, 0);
        var reminderDate = DateTime.Now.Date.AddDays(-reminderDays);
        var policyIssuances = await _BaseRepository.GetAll();

        return Ok(policyIssuances
            .Where(item => item.ModifiedDate.HasValue && item.ModifiedDate.Value.Date <= reminderDate)
            .OrderBy(item => item.ModifiedDate)
            .ToList());
    }

    [HttpGet]
    public async Task<ActionResult<List<PolicyIssuance>>> SubmittedList()
    {
        var policyIssuances = await _BaseRepository.GetAll();
        var workflows = await _instanceWorkflowRepository.GetAll();
        var workflowByRecord = workflows
            .Where(workflow => workflow.RecordGuid.HasValue)
            .GroupBy(workflow => workflow.RecordGuid!.Value)
            .ToDictionary(
                group => group.Key,
                group => group.OrderByDescending(workflow => workflow.ModifiedDate).First());

        var result = policyIssuances.Where(item =>
        {
            if (!workflowByRecord.TryGetValue(item.Guid, out var workflow))
                return false;

            return !string.Equals(
                item.StageDept?.Trim(),
                workflow.CurrentStep?.Trim(),
                StringComparison.OrdinalIgnoreCase);
        }).ToList();

        return Ok(result);
    }

    [HttpGet("{guid}")]
    public async Task<IActionResult> GetPolicyIssuanceWorkflow(Guid guid)
    {
        InstanceWorkflow instanceWorkflow = new InstanceWorkflow();
        instanceWorkflow = await _instanceWorkflowRepository.GetSingleObject(s => s.RecordGuid == guid);
        if (instanceWorkflow != null)
        {
            return Ok(instanceWorkflow);
        }
        return Ok(null);
    }

    [HttpPost]
    public async Task<IActionResult> CreatePolicyIssuance([FromForm] List<PolicyIssuance> PolicyIssuanceData)
    {
        IReadOnlyList<OnlineUserDto> onlineUsers = FileProcessingHub._store.GetOnlineUsers();
        OnlineUserDto onlineUser = onlineUsers.FirstOrDefault(f => f.User.Replace(DOMAIN_NAME, "") == ControllerUtil.GetCurrentContextUser(_httpContextAccessor, configuration));
        PolicyIssuanceData = JsonConvert.DeserializeObject<List<PolicyIssuance>>(Request.Form["PolicyIssuanceData"]);
        long? piCount = PolicyIssuanceData.Count;
        SignalRResult result = new SignalRResult
        {
            status = "Preparing policy issuance creation...",
            tabName = "Policy Issuance Creation",
            subTabContent = "Preparing policy issuance data...",
            data = PolicyIssuanceData,
            progressvalue = 0,
            type = "inprogress"
        };
        int startCount = 1;
        List<FormatCodeNo> tableRQConfig = new List<FormatCodeNo>();
        PolicyIssuance PolicyIssuance = new PolicyIssuance();
        tableRQConfig = await _formatCodeNoRepository.GetListObjectFullInclude(l => l.NoSeqCode == nameof(PolicyIssuance) + "RequestCode");
        string requestNo = ControllerUtil.GenerateNumberSeq(tableRQConfig, _formatCodeNoRepository, nameof(PolicyIssuance));
   
        foreach (PolicyIssuance item in PolicyIssuanceData)
        {

            PolicyIssuance = new PolicyIssuance();

            JsonConvert.PopulateObject(JsonConvert.SerializeObject(item), PolicyIssuance);
            PolicyIssuance.PolicyIssuanceRequest = requestNo;
            List<FormatCodeNo> tableConfig = new List<FormatCodeNo>();
            tableConfig = await _formatCodeNoRepository.GetListObjectFullInclude(l => l.NoSeqCode == nameof(PolicyIssuance) + "Code");
            PolicyIssuance.PolicyIssuanceCode = await ControllerUtil.GenerateNumberSeqAsync(tableConfig, _formatCodeNoRepository, nameof(PolicyIssuance));
           
            

            //Pending at ajax 
            List<EnumData> siteEnums = new List<EnumData>();
            siteEnums = await _enumDataRepository.EnumData("BranchOffice");
            //After insert quotation
            WorkflowDefinition workflowDefinition = new WorkflowDefinition();
            workflowDefinition = await _workflowDefinitionRepository.GetSingleObject(s => s.WorkflowCode == _businessConfig.CurrentValue.Workflow.PolicyIssuance);


            //if (workflowDefinition != null) { 
            //    StepsWorkflow stepsWorkflow = await _stepsWorkflowRepository.GetSingleObject(s => s.WorkflowDefinitionId == workflowDefinition.Guid && s.IsStart == true);
            //    InstanceWorkflow instanceWorkflow = new InstanceWorkflow();
            //    instanceWorkflow.WorkflowDefinitionId = workflowDefinition.Guid;
            //    //instanceWorkflow.CurrentStep = "2";
            //    if (stepsWorkflow != null)

            //    {
            //        (PICAttributes PICMain, PICSysHandleAttributes PICLeader, PICAttributes PICHOD) picS = ControllerUtil.PersonInChargeHandle(PolicyIssuance, stepsWorkflow, _businessConfig, siteEnums);
            //        //quotation.LeaderPIC = JsonConvert.SerializeObject(picS.PICLeader);
            //        //quotation.HODPIC = JsonConvert.SerializeObject(picS.PICHOD);
  
            //        instanceWorkflow.RecordGuid = PolicyIssuance.Guid;
            //        instanceWorkflow.CurrentStep = stepsWorkflow.TNodeId;
            //        instanceWorkflow.CurrentStepId = new Guid();
            //        instanceWorkflow.IsCancelled = false;
            //        instanceWorkflow.IsCompleted = false;
            //        instanceWorkflow = await _instanceWorkflowRepository.InsertData(instanceWorkflow);




            //        SubmitRequest submitRequest = new SubmitRequest();
            //        submitRequest.StepsWorkflow = stepsWorkflow;
            //        submitRequest.Comment = $"{PolicyIssuance.PolicyIssuanceCode} created!";
            //        submitRequest.InstanceWorkflow = instanceWorkflow;




            //        await ControllerUtil.LogAction(_quotationCommentLogRepository, _httpContextAccessor, configuration, DOMAIN_NAME, PolicyIssuance, submitRequest, _blobStorageSettings);

            //        //loop multiple account tai day
            //        var NotificationController = new NotificationController(_notificationRepository, configuration, _httpContextAccessor, _hubContext);
            //        long? initialNotificationTypeId = await NotificationTypeResolver.ResolveIdAsync(
            //            _enumDataRepository,
            //            NotificationTypeKeys.Initial);
            //        string picsStr = picS.PICMain.GetType().GetProperty(stepsWorkflow?.ToNodeId ?? "")?.GetValue(picS.PICMain ?? new PICAttributes()).ToString() ?? "";
            //        foreach (var memberName in picsStr.Split(","))
            //        {
            //            NotificationRequest notification = new NotificationRequest();
            //            Notification Notification = new Notification();
            //            Notification.Title = string.Format(_messageSettings.InitializeMessage.Title, PolicyIssuance.PolicyIssuanceCode);
            //            Notification.Message = PolicyIssuance?.Subject ?? string.Format(_messageSettings.InitializeMessage.Content, "");
            //            Notification.IsRead = false;
            //            Notification.Resource = $"{memberName}_{stepsWorkflow.ToNodeId}";
            //            Notification.System = "WM";
            //            Notification.RecordGuid = PolicyIssuance.Guid;
            //            Notification.Type = initialNotificationTypeId;

            //            Notification.ReceivedBy = memberName;
            //            notification.Notification = Notification;
            //            notification.connectionId = memberName;
            //            notification.tabPublicUrl = Util.URLObjectMaking(PolicyIssuance);
            //            PropertyInfo prop = notification.tabPublicUrl.GetType().GetProperty("url");
            //            string giaTri = (string)prop.GetValue(notification.tabPublicUrl, null); // Lấy giá trị
            //            Notification.Url = JsonConvert.SerializeObject(Util.URLObjectMaking(PolicyIssuance));
            //            await NotificationController.Notify(notification);
            //        }
            //    }

            //}
            if (workflowDefinition != null)
            {
                await NotificationHandle(
                workflowDefinition,
                JsonConvert.DeserializeObject<dynamic>(JsonConvert.SerializeObject(PolicyIssuance)),
                JsonConvert.DeserializeObject<dynamic>(JsonConvert.SerializeObject(PolicyIssuanceData)),
                siteEnums,
                 null
                );

                result = new SignalRResult
                {
                    status = "Creating quotations...",
                    data = PolicyIssuanceData,
                    tabName = "Quotation Creation",
                    subTabContent = "Creating the requested quotation records...",
                    progressvalue = 75,//quotationComplete,
                    type = "inprogress"
                };
                ControllerHelper.SignalRResponse(_usersSessionRepository, "R_OverviewLoading", new { payload = result, connectionId = onlineUser.ConnectionId }, ControllerUtil.GetCurrentContextUser(_httpContextAccessor, configuration), DOMAIN_NAME);
            }
            else
            {
                result = new SignalRResult
                {
                    status = "Policy issuance creation failed.",
                    data = PolicyIssuanceData,
                    tabName = "Policy Issuance Creation",
                    subTabContent = "Unable to create policy issuances because the policy issuance workflow was not found.",
                    progressvalue = 100,//quotationComplete,
                    type = "error"
                };
                ControllerHelper.SignalRResponse(_usersSessionRepository, "R_OverviewLoading", new { payload = result, connectionId = onlineUser.ConnectionId }, ControllerUtil.GetCurrentContextUser(_httpContextAccessor, configuration), DOMAIN_NAME);
                return BadRequest(new { detail = "Initial Quotation Error", message = "Flow not found!" });
            }


        }
        result = new SignalRResult
        {
            status = "Policy issuance creation completed.",
            data = PolicyIssuanceData,
            tabName = "Policy Issuance Creation",
            subTabContent = "The policy issuance records were created successfully.",
            progressvalue = 100,
            type = "complete"
        };
        ControllerHelper.SignalRResponse(_usersSessionRepository, "R_OverviewLoading", new { payload = result, connectionId = onlineUser.ConnectionId }, ControllerUtil.GetCurrentContextUser(_httpContextAccessor, configuration), DOMAIN_NAME);
        return Ok();
    }

    [HttpPost]
    public async Task<IActionResult> AssignTask([FromBody] AssignTaskRequest request)
    {
        string dept = (request.Dept ?? "").Trim().ToUpperInvariant();
        if (request.Id <= 0 || !new[] { "FO", "TS", "UW", "LMKT", "PM" }.Contains(dept))
            return BadRequest(new { message = "A valid record id and department are required." });

        PolicyIssuance? policyIssuance = await _BaseRepository.GetSingleObject(item =>
            item.Id == request.Id && !item.Deleted);
        if (policyIssuance == null)
            return NotFound(new { message = $"Policy Issuance {request.Id} was not found." });

        PICAttributes pic;
        try { pic = JsonConvert.DeserializeObject<PICAttributes>(policyIssuance.PIC ?? "{}") ?? new PICAttributes(); }
        catch { pic = new PICAttributes(); }

        string? assignedValue = Util.PICPicker(pic, dept);  
        //dept switch
        //{
        //    "FO" => pic.FO,
        //    "TS" => pic.TS,
        //    "UW" => pic.UW,
        //    "LMKT" => pic.LMKT,
        //    "PM" => pic.PM,
        //    _ => string.Join(",",
        //                            new[]
        //                            {
        //                                pic.FO,
        //                                pic.TS,
        //                                pic.UW,
        //                                pic.LMKT,
        //                                pic.PM
        //                            }.Where(x => !string.IsNullOrEmpty(x)))
        //};
        string[] recipients = (assignedValue ?? "")
            .Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(account => account.Split('\\').Last())
            .Where(account => !string.IsNullOrWhiteSpace(account))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();
        if (recipients.Length == 0)
            return BadRequest(new { message = $"No PIC is assigned to department {dept}." });

        string actor = ControllerUtil.GetCurrentContextUser(_httpContextAccessor, configuration);
        string title = _messageSettings.Assign?.Title ?? "Assign Task";
        string message = string.Format(
            _messageSettings.Assign?.Content ?? "You have been assigned from {0}",
            actor);
        long? assignTypeId = await NotificationTypeResolver.ResolveIdAsync(
            _enumDataRepository,
            NotificationTypeKeys.Assign);
        policyIssuance.QuotationId = await ControllerUtil.ResolvePolicyIssuanceCloneIdAsync(
            _quotationRepository,
            policyIssuance);

        foreach (string recipient in recipients)
        {
            var notification = new Notification
            {
                Title = title,
                Message = message,
                IsRead = false,
                Resource = $"{recipient}_{dept}",
                System = "WM",
                RecordGuid = policyIssuance.Guid,
                Type = assignTypeId,
                ReceivedBy = recipient,
                Url = JsonConvert.SerializeObject(ControllerUtil.NotificationURLObjectMaking(policyIssuance))
            };
            await _notificationRepository.InsertData(notification);
            await ControllerHelper.SignalRResponse(
                _usersSessionRepository,
                "R_NotificationReceive",
                new { title = notification.Title, message = notification.Message },
                recipient,
                DOMAIN_NAME);
        }

        // Email is optional and must not prevent the in-app notification from succeeding.
        try
        {
            MailTemplate? mailTemplate = await _mailTemplateRepository.GetSingleObject(
                item => item.TemplateName == "Assign Mail");
            if (mailTemplate != null)
            {
                DataTable query = DataUtil.ExecuteSelectQuery(
                    _BaseRepository._connectionString,
                    mailTemplate.MailQuery,
                    ("", ""));
                Dictionary<string, object> mailData = query.Rows.Count > 0
                    ? Util.MakeQueryIntoDirectory(query.Rows[0])
                    : new Dictionary<string, object>();

                foreach (string recipient in recipients)
                {
                    Users? user = await _usersRepository.GetSingleObject(item => item.username == recipient);
                    if (user == null) continue;
                    Employee? employee = await _employeeRepository.GetSingleObject(item => item.UsersId == user.Id);
                    if (employee == null) continue;
                    MailQueue mailQueue = Util.NotifySession(
                        employee,
                        mailTemplate,
                        _emailSettings,
                        mailData,
                        Util.CCAllEmail(_emailSettings.FollowCC, ""),
                        null);
                    await _mailQueueRepository.InsertData(mailQueue);
                }
            }
        }
        catch (Exception exception)
        {
            _logger.LogWarning(
                exception,
                "Assign email could not be queued for PolicyIssuance {PolicyIssuanceId}.",
                policyIssuance.Id);
        }

        return Ok(new { success = true, id = policyIssuance.Id, dept, recipients });
    }

    [HttpPost]
    public async Task<IActionResult> AcceptTask([FromBody] AcceptTaskRequest request)
    {
        string dept = (request.Dept ?? "").Trim().ToUpperInvariant();
        if (request.Id <= 0 || !new[] { "FO", "TS", "UW", "LMKT", "PM" }.Contains(dept))
            return BadRequest(new { message = "A valid record id and department are required." });

        PolicyIssuance? policyIssuance = await _BaseRepository.GetSingleObject(item =>
            item.Id == request.Id && !item.Deleted);
        if (policyIssuance == null)
            return NotFound(new { message = $"Policy Issuance {request.Id} was not found." });

        List<EnumData> overallStatuses = await _enumDataRepository.EnumData("OverallStatus");
        EnumData? acceptedStatus = overallStatuses.FirstOrDefault(item =>
            string.Equals(item.Value, $"{dept} Process", StringComparison.OrdinalIgnoreCase));

        JObject tat;
        try { tat = JObject.Parse(policyIssuance.TurnAroundTimeAttributes ?? "{}"); }
        catch { tat = new JObject(); }
        DateTime acceptedAt = DateTime.Now;
        JObject deptTat = tat[dept] as JObject ?? new JObject();
        deptTat["AcceptDate"] = acceptedAt;
        deptTat["CompleteDate"] = acceptedAt;
        tat[dept] = deptTat;

        policyIssuance.TurnAroundTimeAttributes = tat.ToString(Formatting.None);
        if (acceptedStatus != null)
        {
            policyIssuance.StatusId = acceptedStatus.Id;
            policyIssuance.WorkflowStatus = acceptedStatus.Value;
        }
        await _BaseRepository.UpdateData(
            policyIssuance,
            JsonConvert.SerializeObject(new
            {
                policyIssuance.TurnAroundTimeAttributes,
                policyIssuance.StatusId,
                policyIssuance.WorkflowStatus
            }),
            policyIssuance.Id,
            "Id");

        string actor = ControllerUtil.GetCurrentContextUser(_httpContextAccessor, configuration);
        string moduleName = nameof(PolicyIssuance);
        string code = policyIssuance.PolicyIssuanceCode ?? policyIssuance.Id.ToString();
        string acceptMessage = string.Format(
            _messageSettings.Accept?.Content ?? "{0} {1} accepted by {2}!",
            moduleName,
            code,
            actor);
        var submitRequest = new SubmitRequest
        {
            Comment = string.IsNullOrWhiteSpace(request.Comment)
                ? acceptMessage
                : request.Comment,
            StepsWorkflow = new StepsWorkflow { FromNodeId = dept, StepName = "Internal Workflow" },
            isFullDetail = false
        };
        await ControllerUtil.LogAction(
            _quotationCommentLogRepository,
            _httpContextAccessor,
            configuration,
            DOMAIN_NAME,
            policyIssuance,
            submitRequest,
            _blobStorageSettings);

        long? acceptTypeId = await NotificationTypeResolver.ResolveIdAsync(
            _enumDataRepository,
            NotificationTypeKeys.Accept);
        string title = string.Format(
            _messageSettings.Accept?.Title ?? "Accept {0} {1}",
            moduleName,
            code,
            actor);
        string message = acceptMessage;
        PICAttributes pic = JsonConvert.DeserializeObject<PICAttributes>(policyIssuance.PIC ?? "{}") ?? new PICAttributes();
        string[] recipients = typeof(PICAttributes).GetProperties()
            .Select(property => property.GetValue(pic)?.ToString())
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .SelectMany(value => value!.Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();
        policyIssuance.QuotationId = await ControllerUtil.ResolvePolicyIssuanceCloneIdAsync(
            _quotationRepository,
            policyIssuance);

        foreach (string recipient in recipients)
        {
            var notification = new Notification
            {
                Title = title,
                Message = message,
                IsRead = false,
                Resource = $"{recipient}_{dept}",
                System = "WM",
                RecordGuid = policyIssuance.Guid,
                Type = acceptTypeId,
                ReceivedBy = recipient,
                Url = JsonConvert.SerializeObject(ControllerUtil.NotificationURLObjectMaking(policyIssuance))
            };
            await _notificationRepository.InsertData(notification);
            await ControllerHelper.SignalRResponse(
                _usersSessionRepository,
                "R_NotificationReceive",
                new { title = notification.Title, message = notification.Message },
                recipient,
                DOMAIN_NAME);
        }

        return Ok(new { success = true, id = policyIssuance.Id, dept, acceptedAt });
    }
    [HttpGet("{listIds}/{jsessionId}")]
    public async Task<ActionResult<PolicyIssuance>> PullDataBySession(string listIds,string jsessionId)
    {
        string[] ids = listIds.Split(',');
        foreach (string id in ids)
        {
            await Task.Factory.StartNew(async () => {
                Thread.Sleep(5000);

        string excelPath = Path.Combine(BLOB_PATH, MAPPING_PATH);
        PolicyIssuance checkPolicyIssuance = new PolicyIssuance();
        bool isExist = await _BaseRepository.RecordExistsAsync<PolicyIssuance>("PolicyIssuanceCode", id);

        if (isExist)
        {
            checkPolicyIssuance = await _BaseRepository.GetSingleObject(s => s.PolicyIssuanceCode == id);
            await _BaseRepository.DeleteData(checkPolicyIssuance, checkPolicyIssuance.Id, "Id", true);
            //return Ok();
        }
        DataSet ds = Util.ReadExcelFiles(excelPath);
        DataTable? dtMigration = Util.GetTableBySheetName(ds,"Migration");
        if (dtMigration != null)
        {
        // Ensure there are at least 2 columns

        var col1Name = dtMigration.Columns[0].ColumnName;
        var col2Name = dtMigration.Columns[1].ColumnName;

        bool IsTrueLike(object? v)
        {
            if (v == null || v == DBNull.Value) return false;

            // ExcelReader có thể trả bool, double, string...
            if (v is bool b) return b;
            if (v is double d) return Math.Abs(d - 1d) < 0.0000001; // 1 = TRUE
            var s = v.ToString()?.Trim();
            if (string.IsNullOrEmpty(s)) return false;

            return s.Equals("true", StringComparison.OrdinalIgnoreCase)
                || s.Equals("yes", StringComparison.OrdinalIgnoreCase)
                || s.Equals("y", StringComparison.OrdinalIgnoreCase)
                || s.Equals("1");
        }

        // Tạo table output chỉ gồm 2 cột
        DataTable output = new DataTable($"{dtMigration.TableName}_Filtered");
        output.Columns.Add(col1Name, typeof(string));
        output.Columns.Add(col2Name, typeof(string));

        foreach (DataRow r in dtMigration.Rows)
            { 
                if (!IsTrueLike(r["Query"])) continue;

                output.Rows.Add(
                    r[col1Name]?.ToString(),
                    r[col2Name]?.ToString()
                );

            }
            string query = Util.MakingSelectSql(
               output,                         // DataTable đã filter Query = TRUE
               "app_fd_tmiv_qp_m_qt",
               "",
               id
            );

            string pullingQuery = $"EXEC [usp_fd_PolicyIssuance_process_pull] '{id}' , '{query}'";
            string queryInsert = Util.MakingInsertSql(
               output,                         // DataTable đã filter Query = TRUE
               "",
               "PolicyIssuance"
            );
            List<Dictionary<string, object>> obj = await _BaseRepository.ExecuteCustomJogetQuery(pullingQuery);
            var built = Util.BuildInsertValuesSql(
                targetTable: "PolicyIssuance",
                mapping: output,         // cột1: sourceKey, cột2: targetCol
                rows: obj,
                ignoreCaseKeys: true,
                skipRowsMissingAnyMappedField: false
            );

                // không có row hợp lệ

            using var conn = new SqlConnection(_BaseRepository._connectionString);
            await conn.OpenAsync();

            using var cmd = new SqlCommand(built.Sql, conn);
            cmd.Parameters.AddRange(built.Parameters.ToArray());

            int affected = await cmd.ExecuteNonQueryAsync();

            /// Attachment handle if in need
            string pullingQueryAttachment = $"EXEC [usp_fd_PolicyIssuance_process_attachment_pull] '{id}'";
            List<Dictionary<string, object>> objAtt = await _BaseRepository.ExecuteCustomJogetQuery(pullingQueryAttachment);
            if (objAtt != null)
            foreach (var objAt in objAtt)
            {
                string attachmentId = objAt["id"]?.ToString() ?? "";
                string attachmentName = objAt["c_attachQT"]?.ToString() ?? ""   ;
                //Selen.IJavaScriptExecutor js = (Selen.IJavaScriptExecutor)driver;
                //js.ExecuteScript($"arguments[0].scrollTop = arguments[0].scrollTop - {initialScrollHeight.ToString()};", messagePane);
                if (!string.IsNullOrEmpty(attachmentId) && !string.IsNullOrEmpty(attachmentName))
                {

                    string URL = $@"https://wf.tokiomarine.com.vn/jw/web/client/app/TMIV_qp/23/form/download/tmiv_qp_grid_attach/{attachmentId}/{Uri.EscapeUriString(attachmentName)}";

                    using var client = new HttpClient();
                    ///window.getCookie = function(name) {
                    ///var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
                    ///if (match) return match[2];
                    ///}

                // ===== Headers tối thiểu =====
                client.DefaultRequestHeaders.Add(
                        "Cookie",
                        $"JSESSIONID={jsessionId}"
                    );

                    client.DefaultRequestHeaders.Referrer =
                        new Uri("https://wf.tokiomarine.com.vn/jw/web/userview/TMIV_qp/tmiv_qp_userview/_/completedQT");

                    client.DefaultRequestHeaders.UserAgent.ParseAdd(
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
                    );

                    // ===== GET =====
                    var response = await client.GetAsync(URL);
                    response.EnsureSuccessStatusCode();

                    // ===== Read file =====
                    var bytes = await response.Content.ReadAsByteArrayAsync();
                    string tempDir = System.IO.Path.Combine(_blobStorageSettings.CurrentValue.Path, _blobStorageSettings.CurrentValue.PolicyIssuanceAttachmentFolder,id);
                    //string tempDir = "D:\\Source\\MySource\\ERPCore\\ERPCore\\ERPCore\\bin\\Debug\\Attachment\\PolicyIssuance";
                    if (!Directory.Exists(tempDir))
                    {
                        Directory.CreateDirectory(tempDir);
                    }
                    System.IO.File.WriteAllBytes(System.IO.Path.Combine(tempDir, attachmentName), bytes);

                    ///Remove attachment after process 
                    //System.IO.File.Delete(System.IO.Path.Combine(tempDir, attachmentName));
                }
            }
        }


        //SecureString theSecureString = new NetworkCredential(spUserName, spPassword).SecurePassword;

        //SharePointOnlineCredentials onlineCredentials = new SharePointOnlineCredentials(spUserName, theSecureString);
        //string myWebsiteUrl = "https://tokiomarinevn.sharepoint.com/:x:/r/sites/Jogettechnicaldocuments/_layouts/15/Doc.aspx?dtMigrationdoc=%7Bfc836aef-8fbf-4b7d-8118-6db3d8e1d45d%7D&action=edit&wdenableroaming=1&wdlcid=en-US&wdorigin=ItemsView&wdhostclicktime=1767835335974&wdredirectionreason=Force_SingleStepBoot&wdinitialsession=68cb23ed-0a45-e1b5-3d08-429011b3e4cd&wdrldsc=2&wdrldc=1&wdrldr=ContinueInExcel";
        ////var authManager = new OfficeDevPnP.Core.AuthenticationManager();
        //var authManager = new AuthenticationManager().GetACSAppOnlyContext(myWebsiteUrl, clientId, clientSecret));
        //{
        //    ClientContext ctx = authManager.GetWebLoginClientContext(myWebsiteUrl);
        //    //ClientContext ctx = new ClientContext(myWebsiteUrl);
        //    ctx.Credentials = onlineCredentials;
        //    Web web = ctx.Web;
        //    ctx.Load(web);
        //    ctx.ExecuteQuery();
        //    ctx.Load(ctx.Web, p => p.Title);
        //    ctx.ExecuteQuery();
        //}

        //string siteUrl = "https://tenant.sharepoint.com/";
        //using (var ctx = new OfficeDevPnP.Core.AuthenticationManager().GetWebLoginClientContext(myWebsiteUrl))
        //{
        //    ctx.Load(ctx.Web, p => p.Title);
        //    ctx.ExecuteQuery();
        //    Microsoft.SharePoint.Client.File file = ctx.Web.GetFileByUrl(myWebsiteUrl);
        //    ctx.Load(file);
        //    ctx.ExecuteQuery();
        //    //string filepath = @"C:\temp\" + file.Name;
        //    //Microsoft.SharePoint.Client.ClientResult<Stream> mstream = file.OpenBinaryStream();
        //    //ctx.ExecuteQuery();

        //};

        // This method calls a pop up window with the login page and it also prompts 
        // for the multi factor authentication code. 

        //

                await base.PullData(id);
            });
                }
        return Ok();
    }

    [NonAction]
    public async Task NotificationHandle(
         WorkflowDefinition workflowDefinition,
         dynamic quotation,
            dynamic quotationData,
         List<EnumData> siteEnums,
        IFormFile file = null
        )
    {
        StepsWorkflow stepsWorkflow = await _stepsWorkflowRepository.GetSingleObject(s => s.WorkflowDefinitionId == workflowDefinition.Guid && s.IsStart == true);
        InstanceWorkflow instanceWorkflow = new InstanceWorkflow();
        instanceWorkflow.WorkflowDefinitionId = workflowDefinition.Guid;
        //instanceWorkflow.CurrentStep = "2";
        if (stepsWorkflow != null)

        {
            var (resolvedNodeId, resolvedDeptCode) = Util.ResolveWorkflowJumps(
                workflowDefinition.WorkflowNodes,
                stepsWorkflow.TNodeId ?? "",
                Newtonsoft.Json.Linq.JObject.FromObject((object)quotation)
            );
            if (!string.IsNullOrWhiteSpace(resolvedNodeId))
            {
                stepsWorkflow.TNodeId = resolvedNodeId;
                stepsWorkflow.ToNodeId = resolvedDeptCode;
            }

            string destinationDepartment = stepsWorkflow.ToNodeId?.Trim() ?? "";
            if (string.IsNullOrWhiteSpace(destinationDepartment))
            {
                throw new InvalidOperationException(
                    $"Policy issuance workflow '{workflowDefinition.WorkflowCode}' has no destination department on its start step.");
            }
            quotation.StageDept = destinationDepartment;

            (PICAttributes PICMain, PICSysHandleAttributes PICLeader, PICAttributes PICHOD) picS = ControllerUtil.PersonInChargeHandle(quotation, stepsWorkflow, _businessConfig, siteEnums);
            quotation.LeaderPIC = JsonConvert.SerializeObject(picS.PICLeader);
            quotation.HODPIC = JsonConvert.SerializeObject(picS.PICHOD);
            quotation.StatusId = stepsWorkflow.StatusId;

            EnumData enumData = await _enumDataRepository.GetSingleObject(s => s.Id == stepsWorkflow.StatusId);

            quotation.WorkflowStatus = enumData?.Value ?? "";
            quotation = await _BaseRepository.InsertData(JsonConvert.DeserializeObject<PolicyIssuance>(JsonConvert.SerializeObject(quotation)));
            quotation.QuotationId = await ControllerUtil.ResolvePolicyIssuanceCloneIdAsync(
                _quotationRepository,
                JsonConvert.DeserializeObject<PolicyIssuance>(JsonConvert.SerializeObject(quotation)));
            PolicyIssuanceDetails policyIssuanceDetails = new PolicyIssuanceDetails();
            policyIssuanceDetails.PolicyIssuanceId = quotation.Id;
            policyIssuanceDetails = await _policyIssuanceDetailsRepository.InsertData(policyIssuanceDetails);
            //if (file != null)
            //{
            //    Request.Headers["Folder"] = $@"{nameof(Quotation)}\{quotation.PolicyIssuanceCode}";
            //    Request.Headers["RecordGuid"] = quotation.Guid.ToString();
            //    Request.Headers["SectionName"] = $@"{quotationData.QuotationData.Attributes.SectionName}_{quotation.Id.ToString()}";
            //    await AsyncUploadSingleFile(file);
            //}
                        instanceWorkflow.RecordGuid = quotation.Guid;

            instanceWorkflow.CurrentStep = stepsWorkflow.TNodeId;
            instanceWorkflow.CurrentStepId = new Guid();
            instanceWorkflow.IsCancelled = false;
            instanceWorkflow.IsCompleted = false;
            instanceWorkflow = await _instanceWorkflowRepository.InsertData(instanceWorkflow);




            SubmitRequest submitRequest = new SubmitRequest();
            submitRequest.StepsWorkflow = stepsWorkflow;
            submitRequest.Comment = $"{quotation.PolicyIssuanceCode} created!";
            submitRequest.InstanceWorkflow = instanceWorkflow;




            await ControllerUtil.LogAction(_quotationCommentLogRepository, _httpContextAccessor, configuration, DOMAIN_NAME, quotation, submitRequest, _blobStorageSettings);

            //loop multiple account tai day
            var NotificationController = new NotificationController(_notificationRepository, configuration, _httpContextAccessor, _hubContext);
            long? initialNotificationTypeId = await NotificationTypeResolver.ResolveIdAsync(
                _enumDataRepository,
                NotificationTypeKeys.Initial);
            NotificationTemplate notificationTitle = await ResolveRouteTransitionNotificationTitleAsyncV2(
                workflowDefinition,
                stepsWorkflow,
                JsonConvert.DeserializeObject<PolicyIssuance>(JsonConvert.SerializeObject(quotation)));
            string picsStr = picS.PICMain.GetType().GetProperty(stepsWorkflow?.ToNodeId ?? "")?.GetValue(picS.PICMain ?? new PICAttributes()).ToString() ?? "";
            //foreach (var memberName in picsStr.Split(","))
            //{
            //    NotificationRequest notification = new NotificationRequest();
            //    Notification Notification = new Notification();
            //    Notification.Title = notificationTitle.Title;
            //    Notification.Message = notificationTitle.Content;
            //    Notification.IsRead = false;
            //    Notification.Resource = $"{memberName}_{stepsWorkflow.ToNodeId}";
            //    Notification.System = "WM";
            //    Notification.RecordGuid = quotation.Guid;
            //    Notification.Type = notificationTitle.TypeId;

            //    Notification.ReceivedBy = memberName;
            //    notification.Notification = Notification;
            //    notification.connectionId = memberName;
            //    notification.tabPublicUrl = Util.URLObjectMaking(quotation);
            //    PropertyInfo prop = notification.tabPublicUrl.GetType().GetProperty("url");
            //    string giaTri = (string)prop.GetValue(notification.tabPublicUrl, null); // Lấy giá trị
            //    Notification.Url = JsonConvert.SerializeObject(Util.URLObjectMaking(quotation));
            //    await NotificationController.Notify(notification);
            //}
            if (!string.IsNullOrEmpty(notificationTitle.Title))
            {
                foreach (string memberName in picsStr.Split(","))
                {

                    NotificationRequest notification = new NotificationRequest();
                    Notification Notification = new Notification();
                    Notification.Title = notificationTitle.Title;
                    Notification.Message = notificationTitle.Content;
                    Notification.IsRead = false;
                    Notification.Resource = $"{memberName}_{stepsWorkflow.ToNodeId}";
                    Notification.System = "WM";
                    Notification.RecordGuid = quotation.Guid;
                    Notification.Type = notificationTitle.TypeId;

                    Notification.ReceivedBy = memberName;
                    notification.Notification = Notification;
                    notification.connectionId = memberName;
                    notification.tabPublicUrl = ControllerUtil.NotificationURLObjectMaking(quotation);
                    PropertyInfo prop = notification.tabPublicUrl.GetType().GetProperty("url");
                    string giaTri = (string)prop.GetValue(notification.tabPublicUrl, null); // Lấy giá trị
                    Notification.Url = JsonConvert.SerializeObject(ControllerUtil.NotificationURLObjectMaking(quotation));

                    await _notificationRepository.InsertData(Notification);
                    await ControllerHelper.SignalRResponse(_usersSessionRepository, "R_NotificationReceive",
                    new
                    {
                        title = Notification.Title,
                        message = Notification.Message
                    }
                    , memberName, DOMAIN_NAME);

                }
            }
        }
    }

    private async Task<NotificationTemplate> ResolveRouteTransitionNotificationTitleAsyncV2(
        WorkflowDefinition workflowDefinition,
        StepsWorkflow stepsWorkflow,
        PolicyIssuance quotation)
    {
        string fallbackTitle = $"Policy Issuance {quotation.PolicyIssuanceCode} created";
        NotificationTemplate notificationTemplate = new NotificationTemplate();
        notificationTemplate = await _notificationTemplateRepository.GetSingleObject(s => s.Id == stepsWorkflow.NotificationTemplateId);
        if (notificationTemplate != null)
        {
            JObject? workflowPayload = Util.TryReadWorkflowPayload(workflowDefinition.WorkflowNodes);
            JArray? transitions = workflowPayload?
                .GetValue("workflowTransitions", StringComparison.OrdinalIgnoreCase) as JArray;
            JObject? routeTransition = transitions?
                .OfType<JObject>()
                .FirstOrDefault(transition =>
                    string.Equals(
                        transition.GetValue("fromNodeId", StringComparison.OrdinalIgnoreCase)?.ToString(),
                        stepsWorkflow.FromNodeId,
                        StringComparison.OrdinalIgnoreCase)
                    && string.Equals(
                        transition.GetValue("toNodeId", StringComparison.OrdinalIgnoreCase)?.ToString(),
                        stepsWorkflow.ToNodeId,
                        StringComparison.OrdinalIgnoreCase)
                    && (string.IsNullOrWhiteSpace(stepsWorkflow.ActionCode)
                        || string.Equals(
                            transition.GetValue("actionCode", StringComparison.OrdinalIgnoreCase)?.ToString(),
                            stepsWorkflow.ActionCode,
                            StringComparison.OrdinalIgnoreCase)));


            string templateName = notificationTemplate.TemplateName;
            if (string.IsNullOrWhiteSpace(templateName))
            {
                _logger.LogWarning(
                    "No notification template is configured for quotation route transition {FromNodeId} -> {ToNodeId} ({ActionCode}).",
                    stepsWorkflow.FromNodeId,
                    stepsWorkflow.ToNodeId,
                    stepsWorkflow.ActionCode);
                return new NotificationTemplate();
            }

            if (notificationTemplate == null || !(notificationTemplate.IsActive ?? false))
            {
                _logger.LogWarning(
                    "Notification template {TemplateName} for quotation route transition was not found or is inactive.",
                    templateName);
                return new NotificationTemplate();
            }

            Dictionary<string, object> templateData = new()
            {
                ["RecordId"] = quotation.Id,
                ["RecordCode"] = quotation.PolicyIssuanceCode ?? "",
                ["QuotationId"] = quotation.Id,
                ["PolicyIssuanceCode"] = quotation.PolicyIssuanceCode ?? "",
                ["WorkflowStatus"] = quotation.WorkflowStatus ?? "",
                ["FromNodeId"] = stepsWorkflow.FromNodeId ?? "",
                ["ToNodeId"] = stepsWorkflow.ToNodeId ?? "",
                ["ActionCode"] = stepsWorkflow.ActionCode ?? ""
            };

            notificationTemplate.Title = MailUtil.TitleContentHandle(notificationTemplate.Title, templateData).Trim();
            notificationTemplate.Content = MailUtil.TitleContentHandle(notificationTemplate.Content, templateData).Trim();
            return notificationTemplate;
        }
        else
        {
            return new NotificationTemplate();
        }
    }

    [HttpPost]
    public override async Task<object> ExecuteCustomQuery([FromBody] string query)
    {

        ////query = "EXEC usp_fd_policy_issuance_request";
        //List<Dictionary<string, object>> obj = await _BaseRepository.ExecuteCustomQuery(query);
        var Base = await _BaseRepository.ExecuteCustomQuery(query);
        //return obj;
        string userName = ControllerUtil.GetCurrentContextUser(_httpContextAccessor, configuration);
        if (ControllerUtil.IsSuperUser(configuration, userName))
        {
            return Ok(Base);
        }

        Users user = await _usersRepository.GetSingleObject(s => s.username == userName);
        Employee employee = await _employeeRepository.GetSingleObject(s => s.AccountName == userName);

        if (user == null)
        {
            return BadRequest("User not found.");
        }

        // Nếu là SUPER_USER, trả về tất cả dữ liệu
        UserRoles userRole = await _userRolesRepository.GetSingleObject(s => s.UserId == user.Id);
        Roles roles = await _rolesRepository.GetSingleObject(s => s.Id == userRole.RoleId);

        List<Dictionary<string, object>> filteredBase = new List<Dictionary<string, object>>();

        if (roles.RoleName == USER_APP || roles.RoleName == CHECKER_APP)// CheckerApp no case
        {
            var existingIds = new HashSet<object>();
            if (employee.AreaId == null) return filteredBase;
            long? empArea = employee.AreaId;
            if (string.IsNullOrEmpty(employee.AccountName)) return filteredBase;
            string surveyedByAccountName = employee.AccountName;
            
  
            filteredBase = Base
                .Where(w => w.ContainsKey("stageAccount") && w["stageAccount"]?.ToString() == userName)
                .ToList();


        }
        else if (roles.RoleName == MANAGER_APP)
        {
            //var grantSurveys = Base.Where(w =>
            //    w.ContainsKey("grantSurvey") && w["grantSurvey"]?.ToString()?.Contains(user.Id.ToString()) == true
            //).ToList();
            //var sitesByOwner = BusinessConfig.Sites
            //.Where(x => x.Value.OwnData == userName)
            //.Select(x => new
            //{
            //    SiteKey = x.Key,
            //    SiteName = x.Value.Name,
            //    BranchCode = x.Value.BranchCode
            //})
            //.ToList();

            //var allowedBranchCodes = sitesByOwner
            //.Select(x => x.BranchCode)
            //.Where(x => x != null)
            //.Distinct()
            //.ToHashSet();

            ////Comment quan.tm will be own all sites data
            ////filteredBase = Base
            ////    .Where(w =>
            ////        w.ContainsKey("areaId") &&
            ////        w["areaId"] != null &&
            ////        Convert.ToInt32(w["areaId"]) == employee.AreaId
            ////    )
            ////    .ToList(); 

            //filteredBase = Base
            //    .Where(w =>
            //        w.ContainsKey("areaId") &&
            //        w["areaId"] != null &&
            //        allowedBranchCodes.Contains(Convert.ToInt32(w["areaId"]))
            //    )
            //    .ToList();


            //filteredBase.AddRange(grantSurveys);
        }
        else if (roles.RoleName == APPROVER_APP)
        {
            //filteredBase.AddRange(Base);
        }

        return filteredBase;
    }
    [HttpPut]
    public override HttpResponseMessage UpdateData([FromForm] UpdateFormCollection form)
    {
        var entity = new PolicyIssuance();
        JsonConvert.PopulateObject(form.values, entity);
        _BaseRepository.UpdateData(entity, form.values, form.key, "Id").GetAwaiter().GetResult();

        // PM Accept is persisted through this shared UpdateData endpoint. Once the
        // PM acceptance timestamp is present, materialize the matching checklist
        // definition set for this Policy Issuance. The copy is idempotent so later
        // saves/retries cannot duplicate checklist rows.
        if (IsDepartmentAccepted(form.values, "PM"))
        {
            EnsurePolicyIssuanceChecklistAsync(form.key).GetAwaiter().GetResult();
        }

        Task.Run(async () =>
        {
            string connectionId = "";
            IReadOnlyList<OnlineUserDto> onlineUsers = FileProcessingHub._store.GetOnlineUsers();
            OnlineUserDto onlineUser = onlineUsers.FirstOrDefault(f => f.User.Replace(DOMAIN_NAME, "") == CURRENT_USER);
            if (onlineUser != null)
            {
                connectionId = onlineUser.ConnectionId;
                if (!string.IsNullOrEmpty(connectionId))
                    await _hubContext.Clients.Client(connectionId).SendAsync($"sectionRender_{connectionId}", new
                    {
                        data = entity,
                        connectionId = connectionId
                    });

            }
        });
        ControllerHelper.SignalRResponse(_usersSessionRepository, "R_ItemSubmitted", new { id = form.key, type = nameof(PolicyIssuance) }, ControllerUtil.GetCurrentContextUser(_httpContextAccessor, configuration), DOMAIN_NAME);

        return new HttpResponseMessage(HttpStatusCode.OK);
    }

    private static bool IsDepartmentAccepted(string values, string department)
    {
        if (string.IsNullOrWhiteSpace(values)) return false;

        try
        {
            var payload = JObject.Parse(values);
            var tatToken = payload.GetValue("turnAroundTimeAttributes", StringComparison.OrdinalIgnoreCase);
            if (tatToken == null || tatToken.Type == JTokenType.Null) return false;

            var tat = tatToken.Type == JTokenType.String
                ? JObject.Parse(tatToken.Value<string>() ?? "{}")
                : tatToken as JObject;
            var departmentToken = tat?.GetValue(department, StringComparison.OrdinalIgnoreCase) as JObject;
            var acceptDate = departmentToken?.GetValue("AcceptDate", StringComparison.OrdinalIgnoreCase);

            return acceptDate != null
                && acceptDate.Type != JTokenType.Null
                && !string.IsNullOrWhiteSpace(acceptDate.ToString());
        }
        catch (JsonException ex)
        {
            Serilog.Log.Warning(ex, "Cannot inspect Policy Issuance PM acceptance payload.");
            return false;
        }
    }

    private async Task<int> EnsurePolicyIssuanceChecklistAsync(long policyIssuanceId)
    {
        var policyIssuance = await _BaseRepository.GetSingleObject(item =>
            item.Id == policyIssuanceId && !item.Deleted);
        if (policyIssuance == null)
        {
            throw new InvalidOperationException(
                $"Policy Issuance {policyIssuanceId} was not found.");
        }

        Quotation? quotation = null;
        if (policyIssuance.QuotationId.HasValue)
        {
            var quotationId = policyIssuance.QuotationId.Value;
            quotation = await _quotationRepository.GetSingleObject(item =>
                item.Id == quotationId);
        }
        else if (policyIssuance.CopyFromGuid.HasValue)
        {
            var quotationGuid = policyIssuance.CopyFromGuid.Value;
            quotation = await _quotationRepository.GetSingleObject(item =>
                item.Guid == quotationGuid);
        }

        if (quotation?.LineId == null || quotation.ProductId == null)
        {
            throw new InvalidOperationException(
                $"Cannot create Policy Issuance checklist: Quotation LineId/ProductId was not found for PolicyIssuanceId {policyIssuanceId}.");
        }

        var lineId = quotation.LineId.Value;
        var productId = quotation.ProductId.Value;
        var definitions = await _checklistDefinitionRepository.GetListObject(definition =>
            definition.LineId == lineId
            && definition.ProductId == productId
            && !definition.Deleted);

        var existingRows = await _policyIssuanceChecklistRepository.GetListObject(item =>
            item.PolicyIssuanceId == policyIssuanceId);

        if (existingRows.Count > 0)
        {
            await _policyIssuanceChecklistRepository.BulkDeleteAsync(
                existingRows.Select(item => (object)item.Id),
                "Id",
                true);
        }

        if (definitions.Count == 0)
        {
            return 0;
        }

        var rowsToInsert = definitions
            .Select(definition => new PolicyIssuanceChecklist
            {
                PolicyIssuanceId = policyIssuanceId,
                RecordGuid = policyIssuance.Guid,
                SequenceNo = definition.SequenceNo,
                Checkpoint = definition.Checkpoint ?? "",
                NeedToCheck = definition.NeedToCheck ?? "",
                Result = "review",
                LineId = lineId,
                ProductId = productId,
                RowOrder = definition.RowOrder,
                CopyFromGuid = definition.Guid
            })
            .ToList();

        if (rowsToInsert.Count == 0)
        {
            return 0;
        }

        await _policyIssuanceChecklistRepository.BulkInsertAsync(rowsToInsert);
        return rowsToInsert.Count;
    }
    public async Task BulkInsertPolicyIssuanceAsync(List<PolicyIssuance> data)
    {
        var dt = new DataTable();

        // Khởi tạo cột (phải khớp DB)
        foreach (var prop in typeof(PolicyIssuance).GetProperties())
        {
            dt.Columns.Add(prop.Name, typeof(string));
        }

        // Gán dữ liệu
        foreach (var item in data)
        {
            var row = dt.NewRow();
            foreach (var prop in typeof(PolicyIssuance).GetProperties())
            {
                row[prop.Name] = prop.GetValue(item) ?? DBNull.Value;
            }
            dt.Rows.Add(row);
        }

        // Bulk insert
        using var connection = new SqlConnection(_BaseRepository._connectionString);
        await connection.OpenAsync();
        using var bulkCopy = new SqlBulkCopy(connection)
        {
            DestinationTableName = "dbo.PolicyIssuance", // Đảm bảo đúng tên bảng
            BulkCopyTimeout = 60
        };

        await bulkCopy.WriteToServerAsync(dt);
    }

    [HttpPost]
    public async Task<IActionResult> LogAction([FromForm] PolicyIssuanceRequest quotationData)
    {
        quotationData.PolicyIssuanceData = JsonConvert.DeserializeObject<PolicyIssuanceData>(Request.Form[nameof(PolicyIssuance) + "Data"]);
        quotationData.PolicyIssuanceData.SubmitRequest = JsonConvert.DeserializeObject<SubmitRequest>(Request.Form["SubmitRequest"]);
        SubmitRequest submitRequest = new SubmitRequest();
        submitRequest.Comment = quotationData?.PolicyIssuanceData?.SubmitRequest?.Comment;
        submitRequest.StepsWorkflow = new StepsWorkflow();
        submitRequest.StepsWorkflow.FromNodeId = quotationData?.PolicyIssuanceData?.SubmitRequest?.StepsWorkflow?.FromNodeId;
        submitRequest.isFullDetail = quotationData?.PolicyIssuanceData?.SubmitRequest?.isFullDetail;
        await ControllerUtil.LogAction(_quotationCommentLogRepository, _httpContextAccessor, configuration, DOMAIN_NAME, quotationData.PolicyIssuanceData.PolicyIssuance, submitRequest, _blobStorageSettings);
        return Ok();
    }

    [HttpGet]
    public override async Task<ActionResult<List<PolicyIssuance>>> GetAll()
    {
        var queryParams = HttpContext.Request.Query;

        // ===== PAGING =====
        int skip = 0;
        int take = 50;

        if (queryParams.ContainsKey("skip"))
            int.TryParse(queryParams["skip"], out skip);

        if (queryParams.ContainsKey("take"))
            int.TryParse(queryParams["take"], out take);

        take = Math.Clamp(take, 1, 200);

        var requestParams = HttpContext.Request.Query.ToList();
        var requestParamsHeader = HttpContext.Request.Headers.ToList();
        //Pending

        //requestParams.AddRange(requestParamsHeader);

        IDictionary<string, object> dynamicObj = new ExpandoObject { };
        foreach (var item in requestParams)
        {
            dynamicObj[item.Key] = item.Value;
        }
        var Base = new List<PolicyIssuance>();

        if (requestParams.Count > 1)
        {

        }

        if (dynamicObj.ContainsKey("key"))
        {
            var obj = dynamicObj["key"];
            int result = 0;
            int.TryParse(obj.ToString(), out result);
            if (result != 0)
            {

                Base = await _BaseRepository.GetManyObjectByIdAsync(int.Parse(obj.ToString()));
                //Base.ForEach(f =>
                //            f = _BaseRepository.ObjectSpecificIncludeSync(f, f => f.ResFK)
                //        );

            }
        }
        else
        {
            Base = await _BaseRepository.GetAll(requestParams);
            //Base.ForEach(f =>
            //            f = _BaseRepository.ObjectSpecificIncludeSync(f, f => f.ResFK)
            //        );
        }

        //var Base = await _BaseRepository.GetAll();
        if (Base == null)
        {
            return NotFound();
        }

        var quotationFields = await GetQuotationFieldsAsync(Base);
        var response = Base
            .Select(item => AddQuotationFields(item, quotationFields))
            .ToList();

        return Content(JsonConvert.SerializeObject(response), "application/json");
    }

    [HttpGet("{id}")]
    public override async Task<ActionResult<PolicyIssuance>> GetSingle(int id)
    {
        var policyIssuance = await _BaseRepository.GetObjectByIdAsync(id)
            ?? new PolicyIssuance();
        var quotationFields = await GetQuotationFieldsAsync(new[] { policyIssuance });
        var response = AddQuotationFields(
            policyIssuance,
            quotationFields);

        return Content(JsonConvert.SerializeObject(response), "application/json");
    }

    private async Task<IReadOnlyDictionary<long, PolicyIssuanceQuotationFields>> GetQuotationFieldsAsync(
        IEnumerable<PolicyIssuance> policyIssuances)
    {
        var items = policyIssuances.Where(item => item.Id > 0).ToList();
        if (items.Count == 0)
        {
            return new Dictionary<long, PolicyIssuanceQuotationFields>();
        }

        var quotationIds = items
            .Where(item => item.QuotationId.HasValue)
            .Select(item => item.QuotationId!.Value)
            .Distinct()
            .ToArray();
        var quotationGuids = items
            .Where(item => !item.QuotationId.HasValue && item.CopyFromGuid.HasValue)
            .Select(item => item.CopyFromGuid!.Value)
            .Distinct()
            .ToArray();

        List<Quotation> quotations;
        if (quotationIds.Length > 0 && quotationGuids.Length > 0)
        {
            quotations = await _quotationRepository.GetListObject(item =>
                !item.Deleted
                && (quotationIds.Contains(item.Id) || quotationGuids.Contains(item.Guid)));
        }
        else if (quotationIds.Length > 0)
        {
            quotations = await _quotationRepository.GetListObject(item =>
                !item.Deleted && quotationIds.Contains(item.Id));
        }
        else if (quotationGuids.Length > 0)
        {
            quotations = await _quotationRepository.GetListObject(item =>
                !item.Deleted && quotationGuids.Contains(item.Guid));
        }
        else
        {
            quotations = new List<Quotation>();
        }

        var quotationById = quotations.ToDictionary(item => item.Id);
        var quotationByGuid = quotations
            .GroupBy(item => item.Guid)
            .ToDictionary(group => group.Key, group => group.OrderByDescending(item => item.Id).First());
        var result = new Dictionary<long, PolicyIssuanceQuotationFields>();

        foreach (var policyIssuance in items)
        {
            Quotation? quotation = null;
            if (policyIssuance.QuotationId.HasValue)
            {
                quotationById.TryGetValue(policyIssuance.QuotationId.Value, out quotation);
            }
            else if (policyIssuance.CopyFromGuid.HasValue)
            {
                quotationByGuid.TryGetValue(policyIssuance.CopyFromGuid.Value, out quotation);
            }

            result[policyIssuance.Id] = new PolicyIssuanceQuotationFields
            {
                PolicyIssuanceId = policyIssuance.Id,
                LineName = quotation?.LineName,
                ProductName = quotation?.ProductName
            };
        }

        return result;
    }

    private static JObject AddQuotationFields(
        PolicyIssuance policyIssuance,
        IReadOnlyDictionary<long, PolicyIssuanceQuotationFields> quotationFields)
    {
        var response = JObject.Parse(System.Text.Json.JsonSerializer.Serialize(
            policyIssuance,
            WebJsonOptions));
        quotationFields.TryGetValue(policyIssuance.Id, out var quotation);
        response["lineName"] = quotation?.LineName ?? "";
        response["productName"] = quotation?.ProductName ?? "";
        return response;
    }

    private sealed class PolicyIssuanceQuotationFields
    {
        public long PolicyIssuanceId { get; init; }
        public string? LineName { get; init; }
        public string? ProductName { get; init; }
    }

    [HttpDelete]
    public override async Task<IActionResult> DeleteData([FromForm] DeleteFormCollection form)
    {
        try
        {
            // 1. Lấy quotation full data
            var quotation = await _BaseRepository
                .GetSingleObjectFullInclude(x => x.Id == form.key);

            if (quotation == null)
                return NotFound("PolicyIssuance not found");

            Guid recordGuid = quotation.Guid;

            // ===== 2. Xóa Workflow =====
            var instance = await _instanceWorkflowRepository
                .GetSingleObject(x => x.RecordGuid == recordGuid);

            if (instance != null)
            {
                await _instanceWorkflowRepository
                    .DeleteData(instance, instance.Id, "Id", true);
            }

            //// ===== 3. Xóa Log =====
            string logQuery = $@"DELETE FROM CommentLog WHERE [RecordGuid] = {quotation.Guid}";
            string logFlowQuery = $@"DELETE FROM WorkflowHistory WHERE [RecordGuid] = {quotation.Guid}";
            using var loggerFactory = LoggerFactory.Create(loggingBuilder => loggingBuilder
        .SetMinimumLevel(LogLevel.Trace)
        .AddConsole());
            var logger = loggerFactory.CreateLogger<CommentLog>();
            var quotationCommentLogApiController = new CommentLogController(_quotationCommentLogRepository, configuration, _httpContextAccessor, logger, _blobStorageSettings);
            await quotationCommentLogApiController.ExecuteCustomQuery(logQuery);
            await quotationCommentLogApiController.ExecuteCustomQuery(logFlowQuery);
            ///
            //var logs = await _quotationCommentLogRepository
            //    .GetAll(x => x.RecordGuid == recordGuid);

            //foreach (var log in logs)
            //{
            //    await _quotationCommentLogRepository
            //        .DeleteData(log, log.Id, "Id", true);
            //}

            // ===== 4. Xóa Notification =====
            var notifications = await _notificationRepository
                .GetListObject(x => x.RecordGuid == recordGuid);

            foreach (var noti in notifications)
            {
                await _notificationRepository
                    .DeleteData(noti, noti.Id, "Id", true);
            }

            // ===== 5. Xóa Documents + File =====
            var documents = await _documentRepository
                .GetListObject(x => x.RecordGuid == recordGuid);

            foreach (var doc in documents)
            {
                // delete file vật lý
                var filePath = Path.Combine(
                    _blobStorageSettings.CurrentValue.Path,
                    doc.SubDirectory ?? "",
                    doc.Guid.ToString() + doc.FileType ?? ""
                );

                if (System.IO.File.Exists(filePath))
                {
                    System.IO.File.Delete(filePath);
                }

                await _documentRepository.DeleteData(doc, doc.Id, "Id", true);
            }

            // ===== 6. Xóa Attachment =====
            //var attachments = await _documentRepository
            //    .GetListObject(x => x.RecordGuid == recordGuid);

            //foreach (var att in attachments)
            //{
            //    await _documentRepository.DeleteData(att, att.Id, "Id", true);
            //}

            // ===== 7. Xóa Folder (optional) =====
            //var folderPath = Path.Combine(
            //    _blobStorageSettings.CurrentValue.Path,
            //    _blobStorageSettings.CurrentValue.PolicyIssuanceAttachmentFolder,
            //    quotation.PolicyIssuanceCode
            //);

            //if (Directory.Exists(folderPath))
            //{
            //    Directory.Delete(folderPath, true);
            //}

            // ===== 8. Xóa Res =====
            //if (quotation.ResId != null)
            //{
            //    var res = await _resRepository
            //        .GetSingleObject(x => x.Id == quotation.ResId);

            //    if (res != null)
            //    {
            //        // check nếu res còn được dùng không
            //        await _resRepository.DeleteData(res, res.Id, "Id", true);
            //    }
            //}

            // ===== 9. Xóa PolicyIssuance =====
            await _BaseRepository.DeleteData(quotation, quotation.Id, "Id", true);

            return Ok(new { message = "Deleted successfully" });
        }
        catch (Exception ex)
        {
            return BadRequest(new
            {
                message = "Delete failed",
                detail = ex.Message
            });
        }
    }
}
