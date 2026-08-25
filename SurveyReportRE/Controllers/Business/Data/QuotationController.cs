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
using Newtonsoft.Json.Linq;
using ERPCore.Models.Business.Migration.Config;
using ERPCore.Models.Migration.Business.HumanResource;
using ERPCore.Models.Request;
using Microsoft.AspNetCore.SignalR;
using RESurveyTool.Models.Models.Parsing;
using ERPCore.Models.Migration.Business.Workflow;
using ERPCore.Models.Migration.Business.MasterData;
using ERPCore.Models.Migration.Business.Data;
using System.Reflection;
using System.Dynamic;
using ERPCore.Models;
using Document = ERPCore.Models.Migration.Business.Data.Document;
using ERPCore.Models.Migration.Business.Social;
using ERPCore.Models.Models.Parsing;
using static ERPCore.Models.Models.Parsing.JsonHandle;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using System.Collections.Generic;
using DocumentFormat.OpenXml.Bibliography;
using ERPCore.Pages;
using JogetMVC.Model;

[ApiController]
[Route("api/[controller]/[action]")]
public class QuotationController : BaseControllerApi<Quotation>
{
    private readonly IBaseRepository<Quotation> _BaseRepository;
    private readonly IConfiguration configuration;
    private readonly IBaseRepository<Survey> _surveyRepository;
    private readonly IBaseRepository<InstanceWorkflow> _instanceWorkflowRepository;
    private readonly IBaseRepository<WorkflowDefinition> _workflowDefinitionRepository;
    private readonly IBaseRepository<ERPCore.Models.Migration.Business.Data.Attachment> _attachmentRepository;
    private readonly IBaseRepository<FormatCodeNo> _formatCodeNoRepository;
    private readonly IBaseRepository<Users> _usersRepository;
    private readonly IBaseRepository<Constant> _constantRepository;
    private readonly IBaseRepository<Employee> _employeeRepository;
    private readonly IBaseRepository<UserRoles> _userRolesRepository;
    private readonly IBaseRepository<Roles> _rolesRepository;
    private readonly IBaseRepository<MailTemplate> _mailTemplateRepository;
    private readonly IBaseRepository<MailQueue> _mailQueueRepository;
    private readonly IBaseRepository<Res> _resRepository;
    private readonly IBaseRepository<CommentLog> _quotationCommentLogRepository;
    private readonly IBaseRepository<StepsWorkflow> _stepsWorkflowRepository;
    private readonly IBaseRepository<Document> _documentRepository;
    private readonly IBaseRepository<Notification> _notificationRepository;
    private readonly IBaseRepository<NotificationTemplate> _notificationTemplateRepository;
    private readonly IBaseRepository<EnumData> _enumDataRepository;
    private readonly IBaseRepository<Product> _productRepository;
    private readonly IBaseRepository<Line> _lineRepository;
    private readonly IBaseRepository<SLA> _slaRepository;
    private readonly IBaseRepository<UsersSession> _usersSessionRepository;
    private readonly IBaseRepository<TurnAroundTimeSession> _turnAroundTimeSessionRepository;
    private readonly IBaseRepository<TurnAroundTimeDeptProcessing> _turnAroundTimeDeptProcessingRepository;
    private readonly IHubContext<FileProcessingHub> _hubContext;
    private readonly ILogger<Quotation> _logger;
    private readonly IConfigurationSection path;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private MailConfig _emailSettings;
    private Message _messageSettings;
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
    private readonly Microsoft.Extensions.Options.IOptionsMonitor<BlobStorageSettings> _blobStorageSettings;
    private readonly Microsoft.Extensions.Options.IOptionsMonitor<BusinessConfig> _businessConfig;
    public QuotationController(IBaseRepository<Quotation> BaseRepository
        , IConfiguration config
        , IHttpContextAccessor httpContextAccessor
        , ILogger<Quotation> logger
        , Microsoft.Extensions.Options.IOptionsMonitor<BlobStorageSettings> blobStorageSettings
        , Microsoft.Extensions.Options.IOptionsMonitor<BusinessConfig> businessConfig
         , IHubContext<FileProcessingHub> hubContext
        ) : base(BaseRepository, httpContextAccessor
            )
    {
        configuration = config;
        _BaseRepository = BaseRepository;
        _httpContextAccessor = httpContextAccessor;
        _surveyRepository = new BaseRepository<Survey>(configuration, _httpContextAccessor);
        _attachmentRepository = new BaseRepository<ERPCore.Models.Migration.Business.Data.Attachment>(configuration, _httpContextAccessor);
        _formatCodeNoRepository = new BaseRepository<FormatCodeNo>(configuration, _httpContextAccessor);
        _usersRepository = new BaseRepository<Users>(configuration, _httpContextAccessor);
        _constantRepository = new BaseRepository<Constant>(configuration, _httpContextAccessor);
        _employeeRepository = new BaseRepository<Employee>(configuration, _httpContextAccessor);
        _userRolesRepository = new BaseRepository<UserRoles>(configuration, _httpContextAccessor);
        _rolesRepository = new BaseRepository<Roles>(configuration, _httpContextAccessor);
        _instanceWorkflowRepository = new BaseRepository<InstanceWorkflow>(configuration, _httpContextAccessor);
        _workflowDefinitionRepository = new BaseRepository<WorkflowDefinition>(configuration, _httpContextAccessor);
        _mailTemplateRepository = new BaseRepository<MailTemplate>(configuration, _httpContextAccessor);
        _mailQueueRepository = new BaseRepository<MailQueue>(configuration, _httpContextAccessor);
        _resRepository = new BaseRepository<Res>(configuration, _httpContextAccessor);
        _quotationCommentLogRepository = new BaseRepository<CommentLog>(configuration, _httpContextAccessor);
        _stepsWorkflowRepository = new BaseRepository<StepsWorkflow>(configuration, _httpContextAccessor);
        _documentRepository = new BaseRepository<Document>(configuration, _httpContextAccessor);
        _notificationRepository = new BaseRepository<Notification>(configuration, _httpContextAccessor);
        _notificationTemplateRepository = new BaseRepository<NotificationTemplate>(configuration, _httpContextAccessor);
        _enumDataRepository = new BaseRepository<EnumData>(configuration, _httpContextAccessor);
        _productRepository = new BaseRepository<Product>(configuration, _httpContextAccessor);
        _lineRepository = new BaseRepository<Line>(configuration, _httpContextAccessor);
        _slaRepository = new BaseRepository<SLA>(configuration, _httpContextAccessor);
        _usersSessionRepository = new BaseRepository<UsersSession>(configuration, _httpContextAccessor);
        _turnAroundTimeSessionRepository = new BaseRepository<TurnAroundTimeSession>(configuration, _httpContextAccessor);
        _turnAroundTimeDeptProcessingRepository = new BaseRepository<TurnAroundTimeDeptProcessing>(configuration, _httpContextAccessor);
        _emailSettings = configuration.GetSection("Email").Get<MailConfig>();
        _messageSettings = configuration.GetSection("Message").Get<Message>();

        _hubContext = hubContext;
        MANAGER_APP = configuration.GetSection("BusinessConfig:ManagerAppKey").Value;
        APPROVER_APP = configuration.GetSection("BusinessConfig:ApproverAppKey").Value;
        CHECKER_APP = configuration.GetSection("BusinessConfig:CheckerAppKey").Value;
        USER_APP = configuration.GetSection("BusinessConfig:UserAppKey").Value;
        SUPER_USER = configuration.GetSection("SuperUser:SuperUser").Value;
        DOMAIN_NAME = configuration.GetSection("Domain:DCServer").Value;
        path = _BaseRepository._baseConfiguration.GetSection("BlobStorage:Path");
        MAPPING_PATH = _BaseRepository._baseConfiguration.GetSection("MigrationConfig:MappingField").Value;
        BLOB_PATH = path.Value;
        CURRENT_USER = _httpContextAccessor.HttpContext.User.Identity.Name?.Replace(DOMAIN_NAME, "") ?? "Anomymous";
        spUserName = configuration.GetSection("SharePoint:Username").Value;
        spPassword = configuration.GetSection("SharePoint:Password").Value;
        _blobStorageSettings = blobStorageSettings;
        _businessConfig = businessConfig;
        _logger = logger;

    }

    public async Task<IActionResult> GetIdsList()
    {
        List<Quotation> quotation = await _BaseRepository.GetAll();
        if (quotation != null)
        {

            object quotationData = quotation.Select(s => s.Id).ToArray();
            return Ok(Newtonsoft.Json.JsonConvert.SerializeObject(quotationData));

            if (quotation != null)
            {
            }
        }
        return Ok();
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> MarkNotAsOption(long id)
    {
        var entity = new Quotation();
        entity = await _BaseRepository.GetSingleObject(s => s.Id == id);
        entity.IsNotMakeOption = true;
        await _BaseRepository.UpdateData(entity, JsonConvert.SerializeObject(new { IsNotMakeOption = true }), entity.Id, "Id");
        ControllerHelper.SignalRResponse(_usersSessionRepository, "R_ItemSubmitted", new { id = id, type = "Quotation" }, ControllerUtil.GetCurrentContextUser(_httpContextAccessor, configuration), DOMAIN_NAME);

        return Ok();
    }

    [HttpPost("{id}")]
    public async Task<IActionResult> UpdateWorkflowStatusSigned(long id)
    {
        if (id <= 0)
            return BadRequest(new { message = "A valid quotation id is required." });

        Quotation? quotation = await _BaseRepository.GetSingleObject(item =>
            item.Id == id && !item.Deleted);
        if (quotation == null)
            return NotFound(new { message = $"Quotation {id} was not found." });

        List<EnumData> overallStatuses = await _enumDataRepository.EnumData("OverallStatus");
        EnumData? signedStatus = overallStatuses.FirstOrDefault(item =>
            string.Equals(item.Code?.Trim(), "DGSC", StringComparison.OrdinalIgnoreCase));

        if (signedStatus == null)
            return StatusCode(StatusCodes.Status500InternalServerError, new
            {
                message = "Status code DGSC was not found in EnumData/OverallStatus."
            });

        string workflowStatus = !string.IsNullOrWhiteSpace(signedStatus.Value)
            ? signedStatus.Value.Trim()
            : signedStatus.Name.Trim();

        quotation.WorkflowStatus = workflowStatus;
        quotation.StatusId = signedStatus.Id;

        await _BaseRepository.UpdateData(
            quotation,
            JsonConvert.SerializeObject(new
            {
                quotation.WorkflowStatus,
                quotation.StatusId
            }),
            quotation.Id,
            "Id");

        await ControllerHelper.SignalRResponse(
            _usersSessionRepository,
            "R_ItemSubmitted",
            new { id = quotation.Id, type = nameof(Quotation), workflowStatus },
            ControllerUtil.GetCurrentContextUser(_httpContextAccessor, configuration),
            DOMAIN_NAME);

        return Ok(new
        {
            success = true,
            id = quotation.Id,
            workflowStatus,
            statusId = signedStatus.Id
        });
    }

    [HttpGet]
    public async Task<ActionResult<List<Quotation>>> RenewList()
    {
        var quotations = await _BaseRepository.GetAll(HttpContext.Request.Query.ToList());
        var renewSlaCode = _businessConfig.CurrentValue.SLA?.RenewQuotation;
        var sLA = await _slaRepository.GetSingleObject(s => s.Code == renewSlaCode);
        var days = Math.Max(sLA?.Value ?? 0, 0);

        var fromDate = DateTime.Now.Date;
        var toDate = fromDate.AddDays(days);

        List<Quotation> quotationResult = quotations
            .Where(q => q.InceptionDate >= fromDate && q.InceptionDate <= toDate)
            .ToList();

        return Ok(quotationResult);
    }

    [HttpGet]
    public async Task<ActionResult<List<Quotation>>> SignedBackList()
    {
        const string signReminderCode = "SIGN_REMINDER_DAY";
        const string technicalServiceDept = "TS";

        var signReminderSla = await _slaRepository.GetSingleObject(s =>
            s.Code == signReminderCode && s.Dept == technicalServiceDept);
        var reminderDays = Math.Max(signReminderSla?.Value ?? 0, 0);
        var reminderDate = DateTime.Now.Date.AddDays(-reminderDays);
        var quotations = await _BaseRepository.GetAll();

        return Ok(quotations
            .Where(q => q.ModifiedDate.HasValue && q.ModifiedDate.Value.Date <= reminderDate)
            .OrderBy(q => q.ModifiedDate)
            .ToList());
    }

    [HttpGet]
    public async Task<ActionResult<List<Quotation>>> SubmittedList()
    {
        var quotations = await _BaseRepository.GetAll();
        var workflows = await _instanceWorkflowRepository.GetAll();
        var workflowByRecord = workflows
            .Where(w => w.RecordGuid.HasValue)
            .GroupBy(w => w.RecordGuid!.Value)
            .ToDictionary(
                group => group.Key,
                group => group.OrderByDescending(w => w.ModifiedDate).First());

        var result = quotations.Where(quotation =>
        {
            if (!workflowByRecord.TryGetValue(quotation.Guid, out var workflow))
                return false;

            return !string.Equals(
                quotation.StageDept?.Trim(),
                workflow.CurrentStep?.Trim(),
                StringComparison.OrdinalIgnoreCase);
        }).ToList();

        return Ok(result);
    }


    [HttpGet]
    public override async Task<ActionResult<List<Quotation>>> GetAll()
    {
        var queryParams = HttpContext.Request.Query;
        var requestParams = NormalizeGridLoadParams(queryParams);
        var requestParamsHeader = HttpContext.Request.Headers.ToList();
        //Pending

        //requestParams.AddRange(requestParamsHeader);

        IDictionary<string, object> dynamicObj = new ExpandoObject { };
        foreach (var item in requestParams)
        {
            dynamicObj[item.Key] = item.Value;
        }
        var Base = new List<Quotation>();

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
                Base.ForEach(f =>
                            f = _BaseRepository.ObjectSpecificIncludeSync(f, f => f.ResFK)
                        );

            }
        }
        else
        {
            Base = await _BaseRepository.GetAll(requestParams);
            Base.ForEach(f =>
                        f = _BaseRepository.ObjectSpecificIncludeSync(f, f => f.ResFK)
                    );
        }

        //var Base = await _BaseRepository.GetAll();
        if (Base == null)
        {
            return NotFound();
        }

        return Ok(Base);
    }

    [HttpPost]
    public async Task<IActionResult> UWReferal([FromBody] UWActionRequest uwAction)
    {
        MailTemplate mailTemplate = new MailTemplate();
        mailTemplate = await _mailTemplateRepository.GetSingleObject(s => s.TemplateName == uwAction.TemplateMailName);
        Quotation quotation = new Quotation();
        quotation = await _BaseRepository.GetSingleObject(s => s.Id == uwAction.QuotationId);
        List<EnumData> siteEnums = new List<EnumData>();
        siteEnums = await _enumDataRepository.EnumData("BranchOffice");

        StepsWorkflow stepsWorkflow = null;
        if (!string.IsNullOrEmpty(uwAction.RouteAction))
            stepsWorkflow = await _stepsWorkflowRepository.GetSingleObject(s => s.ActionCode == uwAction.RouteAction);

        (PICAttributes PICMain, PICSysHandleAttributes PICLeader, PICAttributes PICHOD) picS = ControllerUtil.PersonInChargeHandle(quotation, null, _businessConfig, siteEnums);
        var NotificationController = new NotificationController(_notificationRepository, configuration, _httpContextAccessor, _hubContext);
        long? quotationNotificationTypeId = await NotificationTypeResolver.ResolveIdAsync(
            _enumDataRepository,
            NotificationTypeKeys.Quotation);
        string requestPIC = picS.PICMain.GetType().GetProperty("FO")?.GetValue(picS.PICMain ?? new PICAttributes()).ToString() ?? "";
        Employee rqEmployee = new Employee();
        Users rqFlowUser = await _usersRepository.GetSingleObject(s => s.username == requestPIC);
        rqEmployee = await _employeeRepository.GetSingleObject(s => s.UsersId == rqFlowUser.Id);

        var result = picS.PICMain
            .GetType()
            .GetProperties()
            .Select(p => p.GetValue(picS.PICMain)?.ToString())
            .Where(v => !string.IsNullOrEmpty(v)) // bỏ null
            .Distinct() // lọc trùng
            .ToList();

        string ccMails = "";


        if (mailTemplate != null)
        {
            DataTable query = DataUtil.ExecuteSelectQuery(_BaseRepository._connectionString, mailTemplate.MailQuery, ("", ""));
            Dictionary<string, object> flowDictionaryData = new Dictionary<string, object>();
            if (query.Rows.Count > 0)
            {
                flowDictionaryData = Util.MakeQueryIntoDirectory(query.Rows[0]);
                MailQueue mailQueue = new MailQueue();

                string contentHandle = MailUtil.BodyContentHandle(mailTemplate.TemplateContent, new Dictionary<string, object>());
                mailTemplate.TemplateMailTitle = MailUtil.TitleContentHandle(mailTemplate.TemplateMailTitle, new Dictionary<string, object>());
                mailTemplate.PrefixTitleMail = MailUtil.TitleContentHandle(mailTemplate.PrefixTitleMail, new Dictionary<string, object>());
                if (mailTemplate != null && rqEmployee != null)
                {
                    if (mailTemplate.IsActive ?? false)
                    {
                        MailItem mailItem = new MailItem();
                        mailItem.ToName = !string.IsNullOrEmpty(rqEmployee.FullName) ? rqEmployee.FullName : mailTemplate.To;
                        mailItem.ToEmail = !string.IsNullOrEmpty(rqEmployee.Email) ? rqEmployee.Email : mailTemplate.To;
                        mailItem.Subject = $"{mailTemplate.PrefixTitleMail} {mailTemplate.TemplateMailTitle}";
                        mailItem.HtmlBody = contentHandle;
                        mailItem.TextBody = "";

                        string ccAddresses = string.Join(';', mailTemplate.CC.Split(';').Concat(Util.CCAllEmail(_emailSettings.FollowCC, "").Split(';')).Where(w => !string.IsNullOrEmpty(w)));
                        mailItem.CC = ccAddresses;
                        //MailUtil.SendEmail(_emailSettings, mailItem, null).Wait();
                        foreach (var memberName in result)
                        {
                            Employee employee = new Employee();
                            Users flowUser = await _usersRepository.GetSingleObject(s => s.username == memberName);
                            employee = await _employeeRepository.GetSingleObject(s => s.UsersId == flowUser.Id);
                            ccMails += employee.Email + ";";


                            NotificationRequest notification = new NotificationRequest();
                            Notification Notification = new Notification();
                            Notification.Title = mailItem.Subject;
                            Notification.Message = contentHandle;
                            Notification.IsRead = false;
                            Notification.Resource = $"{memberName}_{stepsWorkflow?.ToNodeId}";
                            Notification.System = "WM";
                            Notification.RecordGuid = quotation.Guid;
                            Notification.Type = quotationNotificationTypeId;

                            Notification.ReceivedBy = memberName;
                            notification.Notification = Notification;
                            notification.connectionId = memberName;
                            notification.tabPublicUrl = Util.URLObjectMaking(quotation);
                            PropertyInfo prop = notification.tabPublicUrl.GetType().GetProperty("url");
                            string giaTri = (string)prop.GetValue(notification.tabPublicUrl, null); // Lấy giá trị
                            Notification.Url = JsonConvert.SerializeObject(Util.URLObjectMaking(quotation));
                            await NotificationController.Notify(notification);

                        }

                        mailQueue = Util.NotifySession(rqEmployee, mailTemplate, _emailSettings, flowDictionaryData, ccMails, null);
                        await _mailQueueRepository.InsertData(mailQueue);
                    }
                }

            }
        }
        return Ok();
    }


    [HttpPost]
    public async Task<IActionResult> CreateOption([FromBody] QuotationOptionRequest quotationData)
    {
        Quotation quotation = new Quotation();
        quotation = await _BaseRepository.GetSingleObject(s => s.Id == quotationData.QuotationId);
        InstanceWorkflow instanceWorkflow = new InstanceWorkflow();
        instanceWorkflow = await _instanceWorkflowRepository.GetSingleObject(s => s.RecordGuid == quotation.Guid);
        using var loggerFactory = LoggerFactory.Create(loggingBuilder => loggingBuilder
         .SetMinimumLevel(LogLevel.Trace)
         .AddConsole());

        var logger = loggerFactory.CreateLogger<CommentLog>();
        var quotationCommentLogApiController = new CommentLogController(_quotationCommentLogRepository, configuration, _httpContextAccessor, logger, _blobStorageSettings);
        string logQuery = $"SELECT * FROM CommentLog WHERE RecordGuid = {quotation.Guid}";
        string logHistoryQuery = $"SELECT * FROM WorkflowHistory WHERE RecordGuid = {quotation.Guid}";
        var quotationCommentLogs = await quotationCommentLogApiController.ExecuteCustomQuery(logQuery);
        var quotaionWorkflowHistory = await quotationCommentLogApiController.ExecuteCustomQuery(logHistoryQuery);


        Quotation quotationNew = new Quotation();
        quotationNew.IsView = false;
        await _BaseRepository.UpdateData(quotationNew, quotation, ["IsView"], "Id");
        int numberOfOptions = quotationData.QuotationData.Count;
        int startNoOption = 1;
        foreach (var item in quotationData.QuotationData)
        {
            Quotation quotationOp = new Quotation();
            quotation.Id = 0;
            JsonConvert.PopulateObject(JsonConvert.SerializeObject(quotation), quotationOp);
            quotationOp.OptionParentCode = quotation.QuotationCode;
            Product product = new Product();
            product = await _productRepository.GetSingleObject(s => s.Id == item.ProductId);
            Line line = new Line();
            line = await _lineRepository.GetSingleObject(s => s.Id == item.LineId);
            quotationOp.LineId = item.LineId;
            quotationOp.LineCode = line.LineCode;
            quotationOp.LineName = line.LineName;
            quotationOp.ProductId = item.ProductId;
            quotationOp.ProductCode = product.ProductCode;
            quotationOp.ProductName = product.ProductName;
            quotationOp.QuotationCode = $"{quotationOp.QuotationCode}-{startNoOption.ToString()}";
            startNoOption++;
            quotationOp.CreatedDate = DateTime.Now;
            quotationOp.ModifiedDate = DateTime.Now;
            quotationOp = await _BaseRepository.InsertData(quotationOp);

            Document document = new Document();
            document = await _documentRepository.GetSingleObject(s => s.Id == item.DocumentId);
            Document documentNew = new Document();
            documentNew.RecordGuid = quotationOp.Guid;
            documentNew.Attributes = document.Attributes.Replace(quotationData.QuotationId.ToString(), quotationOp.Id.ToString());
            await _documentRepository.UpdateData(documentNew, document, ["RecordGuid", "Attributes"], "Id");


            InstanceWorkflow instanceWorkflowNew = new InstanceWorkflow();
            JsonConvert.PopulateObject(JsonConvert.SerializeObject(instanceWorkflow), instanceWorkflowNew);
            instanceWorkflowNew.Id = 0;
            instanceWorkflowNew.RecordGuid = quotationOp.Guid;

            instanceWorkflowNew.CurrentStepId = new Guid();
            instanceWorkflowNew.IsCancelled = false;
            instanceWorkflowNew.IsCompleted = false;
            instanceWorkflowNew = await _instanceWorkflowRepository.InsertData(instanceWorkflowNew);

            await ControllerUtil.CloneAction(
                _quotationCommentLogRepository,
                JsonConvert.DeserializeObject<List<Dictionary<string, object>>>(JsonConvert.SerializeObject(quotationCommentLogs)),
                JsonConvert.DeserializeObject<List<Dictionary<string, object>>>(JsonConvert.SerializeObject(quotaionWorkflowHistory)),
                quotationOp.Id
            );
            //StepsWorkflow

            //SubmitRequest submitRequest = new SubmitRequest();
            //submitRequest.StepsWorkflow = stepsWorkflow;
            //submitRequest.Comment = $"{quotation.QuotationCode} created!";
            //submitRequest.InstanceWorkflow = instanceWorkflow;




            //await ControllerUtil.LogAction(_quotationCommentLogRepository, _httpContextAccessor, configuration, DOMAIN_NAME, quotation, submitRequest, _blobStorageSettings);

        }

        return Ok();
    }

    [HttpPost]
    public async Task<IActionResult> CreateQuotation([FromForm] QuotationRequest quotationData)
    {
        try
        {
            bool useAllRegionsForInitialNotification = await ControllerUtil.ShouldUseAllRegionsForInitialNotificationAsync(
                _employeeRepository,
                _constantRepository,
                _httpContextAccessor,
                configuration);

            SignalRResult result = new SignalRResult
            {
                status = "Preparing quotation creation...",
                tabName = "Quotation Creation",
                subTabContent = "Preparing quotation data...",
                data = quotationData,
                progressvalue = 0,
                type = "inprogress"
            };
            IReadOnlyList<OnlineUserDto> onlineUsers = FileProcessingHub._store.GetOnlineUsers();
            OnlineUserDto onlineUser = onlineUsers.FirstOrDefault(f => f.User.Replace(DOMAIN_NAME, "") == ControllerUtil.GetCurrentContextUser(_httpContextAccessor, configuration));
            //Pending at ajax 
            //ControllerHelper.SignalRResponse("R_InitializeLoading", new { payload = result, connectionId = onlineUser.ConnectionId}, ControllerUtil.GetCurrentContextUser(_httpContextAccessor, configuration), DOMAIN_NAME);
            List<EnumData> siteEnums = new List<EnumData>();
            siteEnums = await _enumDataRepository.EnumData("BranchOffice");

            IFormFileCollection files = null;
            files = ((FormCollection)(Request.Form)).Files;
            Quotation quotation = new Quotation();
            List<FormatCodeNo> tableRQConfig = new List<FormatCodeNo>();
            tableRQConfig = await _formatCodeNoRepository.GetListObjectFullInclude(l => l.NoSeqCode == nameof(Quotation) + "RequestCode");
            string requestNo = ControllerUtil.GenerateNumberSeq(tableRQConfig, _formatCodeNoRepository, nameof(Quotation));
            quotationData.QuotationData = JsonConvert.DeserializeObject<QuotationData>(Request.Form["QuotationData"]);
            if (quotationData.QuotationData?.Quotation == null)
            {
                return BadRequest(new { message = "Quotation payload is required." });
            }

            // Routing rule is enforced by the API. A client-provided StageDept
            // must not move a Skip TS quotation away from the FO start node.
            if (IsSkipTsEnabled(quotationData.QuotationData.Quotation.QuotationType))
            {



            }

            if (files.Count > 0)
            {
                int filesCount = files.Count;
                double fileComplete = 0;
                int i = 0;
                foreach (var file in files)
                {
                    //Before insert quotation
                    quotation = new Quotation();
                    List<FormatCodeNo> tableConfig = new List<FormatCodeNo>();
                    tableConfig = await _formatCodeNoRepository.GetListObjectFullInclude(l => l.NoSeqCode == nameof(Quotation) + "Code");

                    Res res = new Res();
                    res = await _resRepository.InsertData(res);


                    JsonConvert.PopulateObject(JsonConvert.SerializeObject(quotationData.QuotationData.Quotation), quotation);
                    quotation.RequestNo = requestNo;
                    quotation.QuotationCode = ControllerUtil.GenerateNumberSeq(tableConfig, _formatCodeNoRepository, nameof(Quotation));
                    quotation.ResId = res.Id;


                    //After insert quotation
                    WorkflowDefinition workflowDefinition = new WorkflowDefinition();
                    workflowDefinition = await _workflowDefinitionRepository.GetSingleObject(s => s.WorkflowCode == _businessConfig.CurrentValue.Workflow.Quotation);

                    if (workflowDefinition != null)
                    {
                        await NotificationHandle(
                         workflowDefinition,
                         JsonConvert.DeserializeObject<dynamic>(JsonConvert.SerializeObject(quotation)),
                         JsonConvert.DeserializeObject<dynamic>(JsonConvert.SerializeObject(quotationData)),
                        siteEnums,
                        _businessConfig,
                         file,
                         useAllRegionsForInitialNotification
                        );

                        i++;
                        fileComplete = filesCount / i; // Pending at ajax
                        result = new SignalRResult
                        {
                            status = "Creating quotations...",
                            tabName = "Quotation Creation",
                            subTabContent = "Creating quotation records from the uploaded files...",
                            data = quotationData,
                            progressvalue = 75,//fileComplete,
                            type = "inprogress"
                        };
                        ControllerHelper.SignalRResponse(_usersSessionRepository, "R_OverviewLoading", new { payload = result, connectionId = onlineUser.ConnectionId }, ControllerUtil.GetCurrentContextUser(_httpContextAccessor, configuration), DOMAIN_NAME);

                    }

                }
            }
            if (quotationData.QuotationData.Quotation.QuotationQuantity > 0 && files.Count == 0)
            {
                long? quotationCount = quotationData.QuotationData.Quotation.QuotationQuantity ?? 0;
                double quotationComplete = 0;
                for (int i = 0; i < quotationData.QuotationData.Quotation.QuotationQuantity; i++)
                {

                    //Before insert quotation
                    quotation = new Quotation();
                    List<FormatCodeNo> tableConfig = new List<FormatCodeNo>();
                    tableConfig = await _formatCodeNoRepository.GetListObjectFullInclude(l => l.NoSeqCode == nameof(Quotation) + "Code");

                    Res res = new Res();
                    res = await _resRepository.InsertData(res);


                    JsonConvert.PopulateObject(JsonConvert.SerializeObject(quotationData.QuotationData.Quotation), quotation);
                    quotation.RequestNo = requestNo;
                    quotation.QuotationCode = ControllerUtil.GenerateNumberSeq(tableConfig, _formatCodeNoRepository, nameof(Quotation));
                    quotation.ResId = res.Id;

                    (PICAttributes PICMain, PICSysHandleAttributes PICLeader) picS;




                    //After insert quotation
                    WorkflowDefinition workflowDefinition = new WorkflowDefinition();
                    workflowDefinition = await _workflowDefinitionRepository.GetSingleObject(s => s.WorkflowCode == _businessConfig.CurrentValue.Workflow.Quotation);

                    if (workflowDefinition != null)
                    {
                        await NotificationHandle(
                        workflowDefinition,
                        JsonConvert.DeserializeObject<dynamic>(JsonConvert.SerializeObject(quotation)),
                        JsonConvert.DeserializeObject<dynamic>(JsonConvert.SerializeObject(quotationData)), 
                        siteEnums,
                        _businessConfig,
                         null,
                         useAllRegionsForInitialNotification
                        );
                        quotationComplete = quotationCount ?? 0 / i; //Pending at ajax
                        result = new SignalRResult
                        {
                            status = "Creating quotations...",
                            data = quotationData,
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
                            status = "Quotation creation failed.",
                            data = quotationData,
                            tabName = "Quotation Creation",
                            subTabContent = "Unable to create quotations because the quotation workflow was not found.",
                            progressvalue = 100,//quotationComplete,
                            type = "error"
                        };
                        ControllerHelper.SignalRResponse(_usersSessionRepository, "R_OverviewLoading", new { payload = result, connectionId = onlineUser.ConnectionId }, ControllerUtil.GetCurrentContextUser(_httpContextAccessor, configuration), DOMAIN_NAME);
                        return BadRequest(new { detail = "Initial Quotation Error", message = "Flow not found!" });
                    }
                }
            }
            result = new SignalRResult
            {
                status = "Quotation creation completed.",
                data = quotationData,
                tabName = "Quotation Creation",
                subTabContent = "The quotation records were created successfully.",
                progressvalue = 100,
                type = "complete"
            };
            ControllerHelper.SignalRResponse(_usersSessionRepository, "R_OverviewLoading", new { payload = result, connectionId = onlineUser.ConnectionId }, ControllerUtil.GetCurrentContextUser(_httpContextAccessor, configuration), DOMAIN_NAME);
            return Ok();
        }
        catch (Exception ex)
        {
            Serilog.Log.Error(ex, "QuotationController.OverviewLoading failed.");
            SignalRResult result = new SignalRResult();
            result = new SignalRResult
            {
                status = "Quotation creation failed.",
                data = null,
                tabName = "Quotation Creation",
                subTabContent = "An unexpected error occurred while creating the quotation records.",
                progressvalue = 100,
                type = "error"
            };
            return BadRequest(ex.Message);

        }
    }
    [HttpPost]
    public async Task<IActionResult> CloneQuotation([FromForm] QuotationRequest quotationData)
    {

        quotationData.QuotationData = JsonConvert.DeserializeObject<QuotationData>(Request.Form["QuotationData"]);

        QuotationTmp quotationTmp = new QuotationTmp();
        quotationTmp = quotationData.QuotationData.QuotationTmp;
        if (quotationData.QuotationData.QuotationTmp != null)
        {
            //Before insert quotation
            Quotation quotation = new Quotation();
            long? oldQuotationId = quotationData.QuotationData.QuotationTmp.OldQuotationId;
            quotation = await _BaseRepository.GetSingleObjectFullInclude(s => s.Id == oldQuotationId);
            quotation = await _BaseRepository.IncludeListsOnly(quotation);
            Res res = new Res();
            res = await _resRepository.InsertData(quotation?.ResFK);

            quotation.PIC = quotationData.QuotationData.QuotationTmp.PIC;
            quotation.QuotationCode = quotationData.QuotationData.QuotationTmp.QuotationCode;
            quotation.Id = 0;

            //Backup case for update header quotation -> consider
            //JsonConvert.PopulateObject(JsonConvert.SerializeObject(quotationData.QuotationData.QuotationTmp), quotation);
            quotation.ResId = res.Id;

            quotation = await _BaseRepository.InsertData(quotation);

            foreach (Document document in quotation.Documents)
            {
                Document doc = new Document();
                JsonConvert.PopulateObject(JsonConvert.SerializeObject(document), doc);

                doc.RecordGuid = quotation.Guid;
                doc.Guid = new Guid();
                doc.SubDirectory = $"Quotation\\{quotation.QuotationCode}";

                await CloneFileAndData(doc, $"Quotation\\{quotationTmp.OldQuotationCode}", document.Guid.ToString(), document.FileType);

            }




            //After insert quotation
            WorkflowDefinition workflowDefinition = new WorkflowDefinition();
            workflowDefinition = await _workflowDefinitionRepository.GetSingleObject(s => s.Id == quotationData.QuotationData.WorkflowDefinitionId); //!!!!!

            if (workflowDefinition != null)
            {
                StepsWorkflow stepsWorkflow = await _stepsWorkflowRepository.GetSingleObject(s => s.WorkflowDefinitionId == workflowDefinition.Guid && (s.IsStart ?? false));
                InstanceWorkflow instanceWorkflow = new InstanceWorkflow();
                instanceWorkflow.RecordGuid = quotation.Guid;
                instanceWorkflow.WorkflowDefinitionId = workflowDefinition.Guid;
                //instanceWorkflow.CurrentStep = "2";
                instanceWorkflow.CurrentStep = stepsWorkflow.TNodeId;
                instanceWorkflow.CurrentStepId = new Guid();
                instanceWorkflow.IsCancelled = false;
                instanceWorkflow.IsCompleted = false;
                instanceWorkflow = await _instanceWorkflowRepository.InsertData(instanceWorkflow);




                SubmitRequest submitRequest = new SubmitRequest();
                submitRequest.StepsWorkflow = stepsWorkflow;
                submitRequest.Comment = $"{quotation.QuotationCode} created!";
                submitRequest.InstanceWorkflow = instanceWorkflow;
                await ControllerUtil.LogAction(_quotationCommentLogRepository, _httpContextAccessor, configuration, DOMAIN_NAME, quotation, submitRequest, _blobStorageSettings);
            }


            return Ok();
        }

        return Ok();
    }

    [HttpGet("{guid}")]
    public async Task<IActionResult> GetQuotationWorkflowDefinition(Guid guid)
    {
        InstanceWorkflow instanceWorkflow = new InstanceWorkflow();
        instanceWorkflow = await _instanceWorkflowRepository.GetSingleObject(s => s.RecordGuid == guid);
        if (instanceWorkflow != null)
        {
            WorkflowDefinition workflowDefinition = new WorkflowDefinition();
            Guid workflowDef = instanceWorkflow.WorkflowDefinitionId;
            workflowDefinition = await _workflowDefinitionRepository.GetSingleObject(s => s.Guid == workflowDef);
            if (workflowDefinition != null)
                return Ok(workflowDefinition);
            else
                return Ok(0);
        }
        return Ok(0);
    }
    [HttpGet("{guid}")]
    public async Task<IActionResult> GetQuotationWorkflow(Guid guid)
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
    public async Task<IActionResult> AssignTask([FromBody] AssignTaskRequest request)
    {
        string dept = (request.Dept ?? "").Trim().ToUpperInvariant();
        if (request.Id <= 0 || !new[] { "FO", "TS", "UW", "LMKT", "PM" }.Contains(dept))
            return BadRequest(new { message = "A valid record id and department are required." });

        Quotation? quotation = await _BaseRepository.GetSingleObject(item =>
            item.Id == request.Id && !item.Deleted);
        if (quotation == null)
            return NotFound(new { message = $"Quotation {request.Id} was not found." });

        PICAttributes pic;
        try { pic = JsonConvert.DeserializeObject<PICAttributes>(quotation.PIC ?? "{}") ?? new PICAttributes(); }
        catch { pic = new PICAttributes(); }

        string? assignedValue = Util.PICPicker(pic, dept);
        //    dept switch
        //{
        //    "FO" => pic.FO,
        //    "TS" => pic.TS,
        //    "UW" => pic.UW,
        //    "LMKT" => pic.LMKT,
        //    "PM" => pic.PM,
        //    _ => string.Join(",",
        //                            new[]
        //                            {
        //                               pic.FO,
        //                               pic.TS,
        //                               pic.UW,
        //                               pic.LMKT,
        //                               pic.PM
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

        foreach (string recipient in recipients)
        {
            NotificationTemplate notificationTemplate = new NotificationTemplate();
            notificationTemplate.Title = title;
            notificationTemplate.Content = message;
            //var notification = new Notification
            //{
            //    Title = title,
            //    Message = message,
            //    IsRead = false,
            //    Resource = $"{recipient}_{dept}",
            //    System = "WM",
            //    RecordGuid = quotation.Guid,
            //    Type = assignTypeId,
            //    ReceivedBy = recipient,
            //    Url = JsonConvert.SerializeObject(Util.URLObjectMaking(quotation))
            //};


            Notification notification = new Notification();
            notification = ControllerUtil.BuildNotification(quotation
                , assignTypeId
                , recipient
                , notificationTemplate
                , nameof(AssignTask)
                );


            // The receiver reloads immediately when SignalR arrives, so persist first.
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
            _logger.LogWarning(exception, "Assign email could not be queued for Quotation {QuotationId}.", quotation.Id);
        }

        var assignLogRequest = new SubmitRequest
        {
            Comment = $"{title} [{dept}] to {string.Join(", ", recipients)} by {actor}.",
            StepsWorkflow = new StepsWorkflow { FromNodeId = dept, StepName = "Internal Workflow" },
            isFullDetail = false
        };
        await ControllerUtil.LogAction(
            _quotationCommentLogRepository,
            _httpContextAccessor,
            configuration,
            DOMAIN_NAME,
            quotation,
            assignLogRequest,
            _blobStorageSettings);

        return Ok(new { success = true, id = quotation.Id, dept, recipients });
    }

    [HttpPost]
    public async Task<IActionResult> AcceptTask([FromBody] AcceptTaskRequest request)
    {
        string dept = (request.Dept ?? "").Trim().ToUpperInvariant();
        if (request.Id <= 0 || !new[] { "FO", "TS", "UW", "LMKT", "PM" }.Contains(dept))
            return BadRequest(new { message = "A valid record id and department are required." });

        Quotation? quotation = await _BaseRepository.GetSingleObject(item =>
            item.Id == request.Id && !item.Deleted);
        if (quotation == null) return NotFound(new { message = $"Quotation {request.Id} was not found." });

        List<EnumData> overallStatuses = await _enumDataRepository.EnumData("OverallStatus");
        EnumData? acceptedStatus = overallStatuses.FirstOrDefault(item =>
            string.Equals(item.Value, $"{dept} Process", StringComparison.OrdinalIgnoreCase));

        JObject tat;
        try { tat = JObject.Parse(quotation.TurnAroundTimeAttributes ?? "{}"); }
        catch { tat = new JObject(); }
        DateTime acceptedAt = DateTime.Now;
        JObject deptTat = tat[dept] as JObject ?? new JObject();
        deptTat["AcceptDate"] = acceptedAt;
        deptTat["CompleteDate"] = acceptedAt;
        tat[dept] = deptTat;

        quotation.TurnAroundTimeAttributes = tat.ToString(Formatting.None);
        if (acceptedStatus != null)
        {
            quotation.StatusId = acceptedStatus.Id;
            quotation.WorkflowStatus = acceptedStatus.Value;
        }
        await _BaseRepository.UpdateData(
            quotation,
            JsonConvert.SerializeObject(new
            {
                quotation.TurnAroundTimeAttributes,
                quotation.StatusId,
                quotation.WorkflowStatus
            }),
            quotation.Id,
            "Id");

        string actor = ControllerUtil.GetCurrentContextUser(_httpContextAccessor, configuration);
        string moduleName = nameof(Quotation);
        string code = quotation.QuotationCode ?? quotation.Id.ToString();
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
            quotation,
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
        PICAttributes pic = JsonConvert.DeserializeObject<PICAttributes>(quotation.PIC ?? "{}") ?? new PICAttributes();
        string[] recipients = typeof(PICAttributes).GetProperties()
            .Select(property => property.GetValue(pic)?.ToString())
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .SelectMany(value => value!.Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        foreach (string recipient in recipients)
        {
            //var notification = new Notification
            //{
            //    Title = title,
            //    Message = message,
            //    IsRead = false,
            //    Resource = $"{recipient}_{dept}",
            //    System = "WM",
            //    RecordGuid = quotation.Guid,
            //    Type = acceptTypeId,
            //    ReceivedBy = recipient,
            //    Url = JsonConvert.SerializeObject(Util.URLObjectMaking(quotation))
            //};
            NotificationTemplate notificationTemplate = new NotificationTemplate();
            notificationTemplate.Title = title;
            notificationTemplate.Content = message;

            Notification notification = new Notification();
            notification = ControllerUtil.BuildNotification(quotation
                , acceptTypeId
                , recipient
                , notificationTemplate
                , nameof(AcceptTask)
                );
            await _notificationRepository.InsertData(notification);
            await ControllerHelper.SignalRResponse(
                _usersSessionRepository,
                "R_NotificationReceive",
                new { title = notification.Title, message = notification.Message },
                recipient,
                DOMAIN_NAME);
        }

        return Ok(new
        {
            success = true,
            id = quotation.Id,
            dept,
            acceptedAt,
            workflowStatus = quotation.WorkflowStatus
        });
    }

    private static bool IsSkipTsEnabled(string? quotationType)
    {
        if (string.IsNullOrWhiteSpace(quotationType)) return false;

        try
        {
            JObject metadata = JObject.Parse(quotationType);
            JToken? skipToken = metadata.GetValue("SkipTS", StringComparison.OrdinalIgnoreCase);
            return skipToken?.Type == JTokenType.Boolean
                ? skipToken.Value<bool>()
                : bool.TryParse(skipToken?.ToString(), out bool parsed) && parsed;
        }
        catch (JsonException)
        {
            return false;
        }
    }

    private async Task<(StepsWorkflow? Step, bool IsAuto)> ResolveActiveInitialJumpAsync(
        WorkflowDefinition workflowDefinition,
        StepsWorkflow initialStep,
        JObject quotationData)
    {
        string sourceNodeId = initialStep.FNodeId?.Trim() ?? "";
        if (string.IsNullOrWhiteSpace(sourceNodeId)) return (null, false);

        List<StepsWorkflow> workflowSteps = await _stepsWorkflowRepository.GetListObject(step =>
            step.WorkflowDefinitionId == workflowDefinition.Guid);

        foreach (StepsWorkflow jumpStep in workflowSteps
                     .Where(step => step.IsActive != false
                                    && string.Equals(step.FNodeId?.Trim(), sourceNodeId, StringComparison.OrdinalIgnoreCase)
                                    && (string.Equals(step.FlowType?.Trim(), "Jump", StringComparison.OrdinalIgnoreCase)
                                        || step.StepType == 4))
                     .OrderBy(step => step.SortOrder ?? int.MaxValue))
        {
            JObject stepData;
            try
            {
                stepData = JObject.Parse(jumpStep.Data ?? "{}");
            }
            catch (JsonException)
            {
                continue;
            }

            JObject? nodeJump = stepData.GetValue("nodeJump", StringComparison.OrdinalIgnoreCase) as JObject;
            if (nodeJump == null) continue;

            List<string> conditionNames = (nodeJump.GetValue("conditionNames", StringComparison.OrdinalIgnoreCase) as JArray)?
                .Values<string>()
                .Where(value => !string.IsNullOrWhiteSpace(value))
                .Select(value => value.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList() ?? new List<string>();

            if (conditionNames.Count == 0)
            {
                string transitionId = nodeJump.GetValue("transitionId", StringComparison.OrdinalIgnoreCase)?.ToString() ?? "";
                JObject? transitionMap = nodeJump.GetValue("transitionMap", StringComparison.OrdinalIgnoreCase) as JObject;
                if (transitionMap != null)
                {
                    conditionNames.AddRange(transitionMap.Properties()
                        .Where(property => string.Equals(property.Value?.ToString(), transitionId, StringComparison.OrdinalIgnoreCase))
                        .Select(property => property.Name));
                }
            }

            if (!conditionNames.Any(condition => IsWorkflowJumpConditionEnabled(condition, quotationData)))
                continue;

            string jumpMode = nodeJump.GetValue("mode", StringComparison.OrdinalIgnoreCase)?.ToString()?.Trim() ?? "";
            bool requiresUserAction = nodeJump.GetValue("requiresUserAction", StringComparison.OrdinalIgnoreCase)?.Value<bool?>() == true;
            bool isAuto = !requiresUserAction
                          && !string.Equals(jumpMode, "manual", StringComparison.OrdinalIgnoreCase)
                          && nodeJump.GetValue("autoJump", StringComparison.OrdinalIgnoreCase)?.Value<bool?>() != false;

            return (jumpStep, isAuto);
        }

        return (null, false);
    }

    private static bool IsWorkflowJumpConditionEnabled(string propertyKey, JObject quotationData)
    {
        string normalizedKey = (propertyKey ?? "").Trim();
        if (string.IsNullOrWhiteSpace(normalizedKey)) return false;

        if (string.Equals(normalizedKey, "SkipTS", StringComparison.OrdinalIgnoreCase))
        {
            string? quotationType = quotationData
                .GetValue("QuotationType", StringComparison.OrdinalIgnoreCase)?
                .ToString();
            return IsSkipTsEnabled(quotationType);
        }

        string[] pathParts = normalizedKey
            .Split('.', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(part => !string.Equals(part, "formData", StringComparison.OrdinalIgnoreCase)
                           && !string.Equals(part, "payload", StringComparison.OrdinalIgnoreCase))
            .ToArray();
        JToken? value = FindWorkflowProperty(quotationData, pathParts, 0);
        return IsTruthyWorkflowValue(value);
    }

    private static JToken? FindWorkflowProperty(JToken token, string[] pathParts, int pathIndex)
    {
        if (pathParts.Length == 0) return null;

        if (token is JObject obj)
        {
            JProperty? matchingProperty = obj.Properties().FirstOrDefault(property =>
                string.Equals(property.Name, pathParts[pathIndex], StringComparison.OrdinalIgnoreCase));
            if (matchingProperty != null)
            {
                if (pathIndex == pathParts.Length - 1) return matchingProperty.Value;
                JToken? nestedMatch = FindWorkflowProperty(matchingProperty.Value, pathParts, pathIndex + 1);
                if (nestedMatch != null) return nestedMatch;
            }

            foreach (JProperty property in obj.Properties())
            {
                JToken? nestedMatch = FindWorkflowProperty(property.Value, pathParts, pathIndex);
                if (nestedMatch != null) return nestedMatch;
            }
        }
        else if (token is JArray array)
        {
            foreach (JToken item in array)
            {
                JToken? nestedMatch = FindWorkflowProperty(item, pathParts, pathIndex);
                if (nestedMatch != null) return nestedMatch;
            }
        }
        else if (token.Type == JTokenType.String)
        {
            string rawValue = token.ToString().Trim();
            if (rawValue.StartsWith('{') || rawValue.StartsWith('['))
            {
                try
                {
                    return FindWorkflowProperty(JToken.Parse(rawValue), pathParts, pathIndex);
                }
                catch (JsonException)
                {
                    return null;
                }
            }
        }

        return null;
    }

    private static bool IsTruthyWorkflowValue(JToken? value)
    {
        if (value == null || value.Type is JTokenType.Null or JTokenType.Undefined) return false;
        if (value.Type == JTokenType.Boolean) return value.Value<bool>();
        if (value.Type is JTokenType.Integer or JTokenType.Float) return value.Value<decimal>() != 0;
        if (value.Type == JTokenType.String)
        {
            string normalized = value.ToString().Trim();
            return !string.IsNullOrWhiteSpace(normalized)
                   && !new[] { "false", "0", "null", "undefined", "no", "off" }
                       .Contains(normalized, StringComparer.OrdinalIgnoreCase);
        }

        return value.HasValues;
    }

    [NonAction]
    public async Task NotificationHandle(
         WorkflowDefinition workflowDefinition,
         dynamic quotation,
         dynamic quotationData,
         List<EnumData> siteEnums,
         IOptionsMonitor<BusinessConfig> businessConfig,
         IFormFile file = null,
         bool useAllRegions = false
        )
    {
    List<StepsWorkflow> startSteps = await _stepsWorkflowRepository.GetListObject(step =>
       step.WorkflowDefinitionId == workflowDefinition.Guid && step.IsStart == true);
    StepsWorkflow? stepsWorkflow = startSteps
        .Where(step => !string.Equals(step.FlowType?.Trim(), "Jump", StringComparison.OrdinalIgnoreCase)
                       && step.StepType != 4)
        .OrderBy(step => step.SortOrder ?? int.MaxValue)
        .FirstOrDefault()
        ?? startSteps.OrderBy(step => step.SortOrder ?? int.MaxValue).FirstOrDefault();
    InstanceWorkflow instanceWorkflow = new InstanceWorkflow();
        instanceWorkflow.WorkflowDefinitionId = workflowDefinition.Guid;
        //instanceWorkflow.CurrentStep = "2";
        if (stepsWorkflow != null)

        {
            JObject quotationObject = JObject.FromObject((object)quotation);
            bool skipTsEnabled = IsSkipTsEnabled(Convert.ToString(quotation.QuotationType));
            var activeJump = await ResolveActiveInitialJumpAsync(workflowDefinition, stepsWorkflow, quotationObject);
            bool autoJump = activeJump.Step != null && activeJump.IsAuto;
            StepsWorkflow routingStep = autoJump ? activeJump.Step! : stepsWorkflow;
            (PICAttributes PICMain, PICSysHandleAttributes PICLeader, PICAttributes PICHOD) picS = ControllerUtil.PersonInChargeHandle(quotation, stepsWorkflow, _businessConfig, siteEnums);
            quotation.LeaderPIC = JsonConvert.SerializeObject(picS.PICLeader);
            quotation.HODPIC = JsonConvert.SerializeObject(picS.PICHOD);
            quotation.StatusId = routingStep.StatusId;
            picS.PICMain.LMKT = picS.PICHOD.FO;
            quotation.PIC = JsonConvert.SerializeObject(picS.PICMain);
            if(IsSkipTsEnabled(quotation["QuotationType"].ToString()))
            {
                quotation.StageDept = "FO";
                quotation.WorkflowStatus = _businessConfig.CurrentValue.Status.QuotationInitializeSkipTS;
            }
            else
            {
                EnumData enumData = await _enumDataRepository.GetSingleObject(s => s.Id == routingStep.StatusId);
                quotation.WorkflowStatus = enumData?.Value ?? "";
            }
            string initialStageDept = skipTsEnabled && !autoJump
      ? "FO"
      : routingStep.ToNodeId?.Trim() ?? "";
            if (string.IsNullOrWhiteSpace(initialStageDept))
            {
                throw new InvalidOperationException(
                    $"Quotation workflow '{workflowDefinition.WorkflowCode}' has no initial department.");
            }
            quotation.StageDept = initialStageDept;
            quotation = await _BaseRepository.InsertData(JsonConvert.DeserializeObject<Quotation>(JsonConvert.SerializeObject(quotation)));


            TurnAroundAttributes result = JsonConvert.DeserializeObject<TurnAroundAttributes>(quotation.TurnAroundTimeAttributes);
            TurnAroundItem tatObject = Util.TurnAroundTimePicker(result, routingStep.FromNodeId);

            if (file != null)
            {
                Request.Headers["Folder"] = $@"{nameof(Quotation)}\{quotation.QuotationCode}";
                Request.Headers["RecordGuid"] = quotation.Guid.ToString();
                Request.Headers["SectionName"] = QTViewIdHelper.AttachmentAttributes("body", QTViewIdHelper.Prefix, "FO", "default", quotation.Id);//$@"{quotationData.QuotationData.Attributes.SectionName}_{quotation.Id.ToString()}";
                Request.Headers["ModuleName"] = nameof(Quotation);

                await AsyncUploadSingleFile(file);
            }
                        instanceWorkflow.RecordGuid = quotation.Guid;

            //Problem
            //var (resolvedNodeId, resolvedDeptCode) = Util.ResolveWorkflowJumps(
            //    workflowDefinition.WorkflowNodes,
            //    stepsWorkflow.TNodeId ?? "",
            //    Newtonsoft.Json.Linq.JObject.FromObject((object)quotation)
            //);
            //if (!string.IsNullOrEmpty(resolvedNodeId))
            //{
            //    stepsWorkflow.TNodeId = resolvedNodeId;
            //    stepsWorkflow.ToNodeId = resolvedDeptCode;
            //}

            instanceWorkflow.CurrentStep = skipTsEnabled && !autoJump
                ? stepsWorkflow.FNodeId
                : routingStep.TNodeId;
            if (string.IsNullOrWhiteSpace(instanceWorkflow.CurrentStep))
            {
                throw new InvalidOperationException(
                    $"Quotation workflow '{workflowDefinition.WorkflowCode}' has no initial workflow node.");
            }
            instanceWorkflow.CurrentStepId = new Guid();
            instanceWorkflow.IsCancelled = false;
            instanceWorkflow.IsCompleted = false;
            instanceWorkflow = await _instanceWorkflowRepository.InsertData(instanceWorkflow);




            SubmitRequest submitRequest = new SubmitRequest();
            submitRequest.StepsWorkflow = routingStep;
            submitRequest.Comment = $"{quotation.QuotationCode} created!";
            submitRequest.InstanceWorkflow = instanceWorkflow;




            await ControllerUtil.LogAction(_quotationCommentLogRepository, _httpContextAccessor, configuration, DOMAIN_NAME, quotation, submitRequest, _blobStorageSettings);
            TurnAroundTimeSession activeSession = new TurnAroundTimeSession();
            activeSession = await _turnAroundTimeSessionRepository
            .GetSingleObject(s => s.RecordGuid == instanceWorkflow.RecordGuid);


            if (activeSession == null)
            {
                // Đếm số phiên đã có để tính SessionNo tiếp theo
                var allSessions = await _turnAroundTimeSessionRepository
                    .GetListObject(s => s.RecordGuid == instanceWorkflow.RecordGuid);

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
                    .GetListObject(s => s.RecordGuid == instanceWorkflow.RecordGuid);


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
                Department = routingStep?.FromNodeId,
                AcceptDate = acceptDate,
                CompleteDate = completeDate,
                ProcessingDays = processingDays
            };
            await _turnAroundTimeDeptProcessingRepository.InsertData(deptProcessing);

            //loop multiple account tai day
            var NotificationController = new NotificationController(_notificationRepository, configuration, _httpContextAccessor, _hubContext);
            long? initialNotificationTypeId = await NotificationTypeResolver.ResolveIdAsync(
                _enumDataRepository,
                NotificationTypeKeys.Initial);
            NotificationTemplate notificationTitle = await ResolveRouteTransitionNotificationTitleAsyncV2(
                workflowDefinition,
                routingStep,
                JsonConvert.DeserializeObject<Quotation>(JsonConvert.SerializeObject(quotation)));
            string foRoutingCode = Convert.ToString(quotation.LineCode)
                ?? Convert.ToString(quotation.ProductCode)
                ?? string.Empty;
            IEnumerable<SiteConfig> notificationSites = useAllRegions
                ? _businessConfig.CurrentValue.Sites.Values
                : Enumerable.Empty<SiteConfig>();
            IEnumerable<PICSysHandleAttributes> leaderPics = useAllRegions
                ? notificationSites.Select(site => site.LeaderFollowRequest)
                : new[] { picS.PICLeader };
            IEnumerable<PICAttributes> hodPics = useAllRegions
                ? notificationSites.Select(site => site.HODFollowRequest)
                : new[] { picS.PICHOD };
            string[] notificationRecipients = await ControllerUtil.ResolveInitialNotificationRecipientsAsync(
                _usersRepository,
                picS.PICMain,
                leaderPics,
                hodPics,
                initialStageDept,
                foRoutingCode);
            if (notificationRecipients.Length == 0)
            {
                //_logger.LogWarning(
                //    "No PIC, valid Leader PIC, or valid HOD PIC was found for new Quotation {QuotationId}, department {Department}.",
                //    quotation.Id,
                //    stepsWorkflow.ToNodeId);
            }

            foreach (string memberName in notificationRecipients)
            {

                //dynamic transferObject = new
                //{
                //    DOMAIN_NAME,
                //    Title = Util.ReplaceDynamicProperties(notificationTitle.Title, quotation),
                //    Subject = Util.ReplaceDynamicProperties(notificationTitle.Content, quotation),
                //    Guid = quotation.Guid,
                //    ReceivedBy = memberName,
                //    Id = quotation.Id,
                //    Code = quotation.QuotationCode,
                //    ModuleName = nameof(Quotation),
                //    QuotationId = quotation.Id,
                //    CopyFromGuid = quotation.Guid
                //};


                NotificationRequest notification = new NotificationRequest();
                Notification Notification = new Notification();
                Notification = ControllerUtil.BuildNotification(
                    quotation,
                    notificationTitle.TypeId,
                    memberName,
                    notificationTitle,
                    nameof(NotificationHandle)
                    );


                notification.Notification = Notification;
                notification.connectionId = memberName;
                notification.tabPublicUrl = Util.URLObjectMaking(quotation);
                PropertyInfo prop = notification.tabPublicUrl.GetType().GetProperty("url");
                string giaTri = (string)prop.GetValue(notification.tabPublicUrl, null); // Lấy giá trị
                Notification.Url = JsonConvert.SerializeObject(Util.URLObjectMaking(quotation));

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

    private async Task<string> ResolveRouteTransitionNotificationTitleAsync(
        WorkflowDefinition workflowDefinition,
        StepsWorkflow stepsWorkflow,
        Quotation quotation)
    {
        string fallbackTitle = $"Quotation {quotation.QuotationCode} created";

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

        string templateName = routeTransition?
            .GetValue("notificationTemplateName", StringComparison.OrdinalIgnoreCase)?
            .ToString()
            .Trim() ?? "";
        if (string.IsNullOrWhiteSpace(templateName))
        {
            _logger.LogWarning(
                "No notification template is configured for quotation route transition {FromNodeId} -> {ToNodeId} ({ActionCode}).",
                stepsWorkflow.FromNodeId,
                stepsWorkflow.ToNodeId,
                stepsWorkflow.ActionCode);
            return fallbackTitle;
        }

        NotificationTemplate? notificationTemplate = await _notificationTemplateRepository.GetSingleObject(
            template => template.TemplateName == templateName);
        if (notificationTemplate == null || !(notificationTemplate.IsActive ?? false))
        {
            _logger.LogWarning(
                "Notification template {TemplateName} for quotation route transition was not found or is inactive.",
                templateName);
            return fallbackTitle;
        }

        Dictionary<string, object> templateData = new()
        {
            ["RecordId"] = quotation.Id,
            ["RecordCode"] = quotation.QuotationCode ?? "",
            ["QuotationId"] = quotation.Id,
            ["QuotationCode"] = quotation.QuotationCode ?? "",
            ["WorkflowStatus"] = quotation.WorkflowStatus ?? "",
            ["FromNodeId"] = stepsWorkflow.FromNodeId ?? "",
            ["ToNodeId"] = stepsWorkflow.ToNodeId ?? "",
            ["ActionCode"] = stepsWorkflow.ActionCode ?? ""
        };

        string title = MailUtil.TitleContentHandle(notificationTemplate.Title, templateData).Trim();
        return string.IsNullOrWhiteSpace(title) ? fallbackTitle : title;
    }
    private async Task<NotificationTemplate> ResolveRouteTransitionNotificationTitleAsyncV2(
        WorkflowDefinition workflowDefinition,
        StepsWorkflow stepsWorkflow,
        Quotation quotation)
    {
        string fallbackTitle = $"Quotation {quotation.QuotationCode} created";
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
            ["RecordCode"] = quotation.QuotationCode ?? "",
            ["QuotationId"] = quotation.Id,
            ["QuotationCode"] = quotation.QuotationCode ?? "",
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
    public async Task<IActionResult> LogAction([FromForm] QuotationRequest quotationData)
    {
        quotationData.QuotationData = JsonConvert.DeserializeObject<QuotationData>(Request.Form[nameof(Quotation) + "Data"]);
        quotationData.QuotationData.SubmitRequest = JsonConvert.DeserializeObject<SubmitRequest>(Request.Form["SubmitRequest"]);
        SubmitRequest submitRequest = new SubmitRequest();
        submitRequest.Comment = quotationData?.QuotationData?.SubmitRequest?.Comment;
        submitRequest.StepsWorkflow = new StepsWorkflow();
        submitRequest.StepsWorkflow.FromNodeId = quotationData?.QuotationData?.SubmitRequest?.StepsWorkflow?.FromNodeId;
        submitRequest.StepsWorkflow.StepName = quotationData?.QuotationData?.SubmitRequest?.StepsWorkflow?.StepName;
        submitRequest.isFullDetail = quotationData?.QuotationData?.SubmitRequest?.isFullDetail;
        await ControllerUtil.LogAction(_quotationCommentLogRepository, _httpContextAccessor, configuration, DOMAIN_NAME, quotationData.QuotationData.Quotation, submitRequest, _blobStorageSettings);
        return Ok();
    }

    [HttpGet("{listIds}/{jsessionId}")]
    public async Task<ActionResult<Quotation>> PullDataBySession(string listIds, string jsessionId)
    {
        string[] ids = listIds.Split(',');
        foreach (string id in ids)
        {
            await Task.Factory.StartNew(async () =>
            {
                Thread.Sleep(5000);

                string excelPath = Path.Combine(BLOB_PATH, MAPPING_PATH);
                Quotation checkQuotation = new Quotation();
                bool isExist = await _BaseRepository.RecordExistsAsync<Quotation>("QuotationCode", id);

                if (isExist)
                {
                    checkQuotation = await _BaseRepository.GetSingleObject(s => s.QuotationCode == id);
                    await _BaseRepository.DeleteData(checkQuotation, checkQuotation.Id, "Id", true);
                    //return Ok();
                }
                DataSet ds = Util.ReadExcelFiles(excelPath);
                DataTable? dtMigration = Util.GetTableBySheetName(ds, "Migration");
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

                    string pullingQuery = $"EXEC [usp_fd_quotation_process_pull] '{id}' , '{query}'";
                    string queryInsert = Util.MakingInsertSql(
                       output,                         // DataTable đã filter Query = TRUE
                       "",
                       "Quotation"
                    );
                    List<Dictionary<string, object>> obj = await _BaseRepository.ExecuteCustomJogetQuery(pullingQuery);
                    var built = Util.BuildInsertValuesSql(
                        targetTable: "Quotation",
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
                    string pullingQueryAttachment = $"EXEC [usp_fd_quotation_process_attachment_pull] '{id}'";
                    List<Dictionary<string, object>> objAtt = await _BaseRepository.ExecuteCustomJogetQuery(pullingQueryAttachment);
                    if (objAtt != null)
                        foreach (var objAt in objAtt)
                        {
                            string attachmentId = objAt["id"]?.ToString() ?? "";
                            string attachmentName = objAt["c_attachQT"]?.ToString() ?? "";
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
                                string tempDir = System.IO.Path.Combine(_blobStorageSettings.CurrentValue.Path, _blobStorageSettings.CurrentValue.QuotationAttachmentFolder, id);
                                //string tempDir = "D:\\Source\\MySource\\ERPCore\\ERPCore\\ERPCore\\bin\\Debug\\Attachment\\Quotation";
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



    [HttpPost]
    public override async Task<object> ExecuteCustomQuery([FromBody] string query)
    {

        ////query = "EXEC usp_fd_policy_issuance_request";
        //List<Dictionary<string, object>> obj = await _BaseRepository.ExecuteCustomQuery(query);
        var controllerName = ControllerContext.RouteData.Values["controller"]?.ToString();
        BaseRepository<SysTable> sysTableRepo = new BaseRepository<SysTable>(_BaseRepository._baseConfiguration, _httpContextAccessor);
        SysTable sysTable = await sysTableRepo.GetSingleObject(s => s.Name == controllerName);
        var Base = await _BaseRepository.ExecuteCustomQuery(sysTable.CustomQuery);
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
        var entity = new Quotation();
        JsonConvert.PopulateObject(form.values, entity);
        _BaseRepository.UpdateData(entity, form.values, form.key, "Id").GetAwaiter().GetResult();



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
        ControllerHelper.SignalRResponse(_usersSessionRepository, "R_ItemSubmitted", new { id = form.key, type = nameof(Quotation) }, ControllerUtil.GetCurrentContextUser(_httpContextAccessor, configuration), DOMAIN_NAME);
        return new HttpResponseMessage(HttpStatusCode.OK);
    }

    [HttpPut]
    public  HttpResponseMessage UpdateDataAutoSaved([FromForm] UpdateFormCollection form)
    {
        var entity = new Quotation();
        JsonConvert.PopulateObject(form.values, entity);
        _BaseRepository.UpdateData(entity, form.values, form.key, "Id").GetAwaiter().GetResult();



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
        return new HttpResponseMessage(HttpStatusCode.OK);
    }
    public async Task BulkInsertQuotationAsync(List<Quotation> data)
    {
        var dt = new DataTable();

        // Khởi tạo cột (phải khớp DB)
        foreach (var prop in typeof(Quotation).GetProperties())
        {
            dt.Columns.Add(prop.Name, typeof(string));
        }

        // Gán dữ liệu
        foreach (var item in data)
        {
            var row = dt.NewRow();
            foreach (var prop in typeof(Quotation).GetProperties())
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
            DestinationTableName = "dbo.Quotation", // Đảm bảo đúng tên bảng
            BulkCopyTimeout = 60
        };

        await bulkCopy.WriteToServerAsync(dt);
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
                return NotFound("Quotation not found");

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
            //    _blobStorageSettings.CurrentValue.QuotationAttachmentFolder,
            //    quotation.QuotationCode
            //);

            //if (Directory.Exists(folderPath))
            //{
            //    Directory.Delete(folderPath, true);
            //}

            // ===== 8. Xóa Res =====
            if (quotation.ResId != null)
            {
                var res = await _resRepository
                    .GetSingleObject(x => x.Id == quotation.ResId);

                if (res != null)
                {
                    // check nếu res còn được dùng không
                    await _resRepository.DeleteData(res, res.Id, "Id", true);
                }
            }

            // ===== 9. Xóa Quotation =====
            await _BaseRepository.DeleteData(quotation, quotation.Id, "Id", true);

            return Ok(new { message = "Deleted successfully" });
        }
        catch (Exception ex)
        {
            Serilog.Log.Error(ex, "QuotationController.DeleteQuotation failed.");
            return BadRequest(new
            {
                message = "Delete failed",
                detail = ex.Message
            });
        }
    }
    //[HttpDelete]
    //public override async Task<IActionResult> DeleteData([FromForm] DeleteFormCollection form)
    //{
    //    var entity = new Quotation();
    //    entity = await _BaseRepository.GetSingleObjectFullInclude(s => s.Id == form.key);
    //    //await _resRepository.DeleteData(entity?.ResFK, entity?.ResId, "Id", true);
    //    //await _instanceWorkflowRepository.DeleteData(entity?.InstanceWorkflowFK, entity?.InstanceWorkflowFK.Id, "Id", true);
    //    ////await _mailQueueRepository.DeleteData(entity, form.key, "Id", true);
    //    ////await _notificationRepository.DeleteData(entity, form.key, "Id", true);
    //    //entity = await _BaseRepository.DeleteData(entity, form.key, "Id", true);
    //    return Ok(entity);
    //}

}
