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
using Microsoft.SharePoint.Taxonomy.WebServices;
using System.Collections.Generic;

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
    private readonly IBaseRepository<EnumData> _enumDataRepository;
    private readonly IBaseRepository<Product> _productRepository;
    private readonly IBaseRepository<Line> _lineRepository;
    private readonly IBaseRepository<SLA> _slaRepository;
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
        _enumDataRepository = new BaseRepository<EnumData>(configuration, _httpContextAccessor);
        _productRepository = new BaseRepository<Product>(configuration, _httpContextAccessor);
        _lineRepository = new BaseRepository<Line>(configuration, _httpContextAccessor);
        _slaRepository = new BaseRepository<SLA>(configuration, _httpContextAccessor);
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
        ControllerHelper.SignalRResponse("R_ItemSubmitted", new { type = "Quotation" }, ControllerUtil.GetCurrentContextUser(_httpContextAccessor, configuration), DOMAIN_NAME);

        return Ok();
    }
    [HttpGet]
    public  async Task<ActionResult<List<Quotation>>> RenewList()
    {
        var quotations = await GetAll(); 
        SLA sLA = new SLA();
        sLA = await _slaRepository.GetSingleObject(s => s.Code == _businessConfig.CurrentValue.SLA.RenewQuotation);
        var days = sLA?.Value ?? 0;

        var fromDate = DateTime.Now.Date;
        var toDate = fromDate.AddDays(days);

        var model = (OkObjectResult)quotations?.Result;

        quotations = ((List<Quotation>)model?.Value).Where(q => q.InceptionDate >= fromDate &&
                    q.InceptionDate <= toDate)
        .ToList();

        List<Quotation> quotationResult = ((List<Quotation>)model?.Value).Where(q => q.InceptionDate >= fromDate &&
                    q.InceptionDate <= toDate)
        .ToList();

        return Ok(quotationResult);
    }


        [HttpGet]
    public override async Task<ActionResult<List<Quotation>>> GetAll()
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

                    string contentHandle = MailUtil.BodyContentHandle(mailTemplate.TemplateContent, new Dictionary<string, object> ());
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
        string logQuery = $"SELECT * FROM CommentLog WHERE {nameof(Quotation)}Id = {quotation.Id}";
        string logHistoryQuery = $"SELECT * FROM QuotationWorkflowHistory WHERE {nameof(Quotation)}Id = {quotation.Id}";
        var quotationCommentLogs =  await quotationCommentLogApiController.ExecuteCustomQuery(logQuery);
        var quotaionWorkflowHistory = await quotationCommentLogApiController.ExecuteCustomQuery(logHistoryQuery);


        Quotation quotationNew = new Quotation();
        quotationNew.IsView = false;
        await _BaseRepository.UpdateData(quotationNew, quotation, ["IsView"],"Id"); 
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
            await _documentRepository.UpdateData(documentNew, document, ["RecordGuid", "Attributes"],"Id");


            InstanceWorkflow instanceWorkflowNew = new InstanceWorkflow();
            JsonConvert.PopulateObject(JsonConvert.SerializeObject(instanceWorkflow),instanceWorkflowNew);
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

            SignalRResult result = new SignalRResult
            {
                status = "saving ...",
                tabName = _messageSettings.OverviewMessageLoading.Title,
                subTabContent = _messageSettings.OverviewMessageLoading.Content,
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
                         quotation,
                         quotationData,
                        siteEnums,
                         file
                        );

                        i++;
                        fileComplete = filesCount / i; // Pending at ajax
                        result = new SignalRResult
                        {
                            status = "saving ...",
                            tabName = _messageSettings.OverviewMessageLoading.Title,
                            subTabContent = _messageSettings.OverviewMessageLoading.Content,
                            data = quotationData,
                            progressvalue = 75,//fileComplete,
                            type = "inprogress"
                        };
                        ControllerHelper.SignalRResponse("R_OverviewLoading", new { payload = result, connectionId = onlineUser.ConnectionId }, ControllerUtil.GetCurrentContextUser(_httpContextAccessor, configuration), DOMAIN_NAME);

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
                        quotation,
                        quotationData,
                        siteEnums,
                         null
                        );
                        quotationComplete = quotationCount ?? 0 / i; //Pending at ajax
                        result = new SignalRResult
                        {
                            status = "saving ...",
                            data = quotationData,
                            tabName = _messageSettings.OverviewMessageLoading.Title,
                            subTabContent = _messageSettings.OverviewMessageLoading.Content,
                            progressvalue = 75,//quotationComplete,
                            type = "inprogress"
                        };
                        ControllerHelper.SignalRResponse("R_OverviewLoading", new { payload = result, connectionId = onlineUser.ConnectionId }, ControllerUtil.GetCurrentContextUser(_httpContextAccessor, configuration), DOMAIN_NAME);
                    }
                    else
                    {
                        result = new SignalRResult
                        {
                            status = "saving ...",
                            data = quotationData,
                            tabName = _messageSettings.OverviewMessageLoading.Title,
                            subTabContent = _messageSettings.OverviewMessageLoading.Content,
                            progressvalue = 100,//quotationComplete,
                            type = "error"
                        };
                        ControllerHelper.SignalRResponse("R_OverviewLoading", new { payload = result, connectionId = onlineUser.ConnectionId }, ControllerUtil.GetCurrentContextUser(_httpContextAccessor, configuration), DOMAIN_NAME);
                        return BadRequest(new {detail = "Initial Quotation Error", message = "Flow not found!" });
                    }
                }
            }
            result = new SignalRResult
            {
                status = "",
                data = quotationData,
                tabName = _messageSettings.OverviewMessageLoading.Title,
                subTabContent = _messageSettings.OverviewMessageLoading.Content,
                progressvalue = 100,
                type = "complete"
            };
            ControllerHelper.SignalRResponse("R_OverviewLoading", new { payload = result, connectionId = onlineUser.ConnectionId }, ControllerUtil.GetCurrentContextUser(_httpContextAccessor, configuration), DOMAIN_NAME);
            return Ok();
        }
        catch (Exception ex)
        {
            Serilog.Log.Error(ex, "QuotationController.OverviewLoading failed.");
            SignalRResult result = new SignalRResult();
            result = new SignalRResult
            {
                status = "",
                data = null,
                tabName = _messageSettings.OverviewMessageLoading.Title,
                subTabContent = _messageSettings.OverviewMessageLoading.Content,
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

    [HttpGet("{id}/{toDept}/{loginUser}")]
    public async Task<IActionResult> AssignTask(long id, string toDept, string loginUser)
    {
        MailTemplate mailTemplate = new MailTemplate();
        mailTemplate = await _mailTemplateRepository.GetSingleObject(s => s.TemplateName == "Assign Mail");
        Quotation quotation = new Quotation();
        quotation = await _BaseRepository.GetSingleObject(s => s.Id == id);
        Users flowUser = new Users();
        PICAttributes pICAttributes = new PICAttributes();
        pICAttributes = JsonConvert.DeserializeObject<PICAttributes>(quotation.PIC);
        string accountName = toDept switch
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
        try
        {
            if (mailTemplate != null)
            {
                DataTable query = DataUtil.ExecuteSelectQuery(_BaseRepository._connectionString, mailTemplate.MailQuery, ("", ""));
                Dictionary<string, object> flowDictionaryData = new Dictionary<string, object>();
                if (query.Rows.Count > 0)

                    flowDictionaryData = Util.MakeQueryIntoDirectory(query.Rows[0]);
                MailQueue mailQueue = new MailQueue();
                mailQueue = Util.NotifySession(employee, mailTemplate, _emailSettings, flowDictionaryData, Util.CCAllEmail(_emailSettings.FollowCC, ""), null);
                await _mailQueueRepository.InsertData(mailQueue);

            }



            dynamic transferObject = new
            {
                DOMAIN_NAME = DOMAIN_NAME,
                Title = "Assigning Task",
                Subject = $"You have been assigned from {loginUser}",
                Resource = "Assign from ",
                Guid = quotation.Guid,
                ReceivedBy = accountName,
                Id = quotation.Id,
                Code = quotation.QuotationCode,
                ModuleName = nameof(Quotation)
            };

            long? assignNotificationTypeId = await NotificationTypeResolver.ResolveIdAsync(
                _enumDataRepository,
                NotificationTypeKeys.Assign);
            Notification notification = await ControllerUtil.Notify(transferObject, assignNotificationTypeId);



            await _notificationRepository.InsertData(notification);


            return Ok();
        }
        catch (Exception exception)
        {
            throw exception;
        }
    }
    [NonAction]
    public async Task NotificationHandle(
         WorkflowDefinition workflowDefinition,
         Quotation quotation,
        QuotationRequest quotationData,
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
            (PICAttributes PICMain, PICSysHandleAttributes PICLeader, PICAttributes PICHOD) picS = ControllerUtil.PersonInChargeHandle(quotation, stepsWorkflow, _businessConfig, siteEnums);
            quotation.LeaderPIC = JsonConvert.SerializeObject(picS.PICLeader);
            quotation.HODPIC = JsonConvert.SerializeObject(picS.PICHOD);
            quotation.StatusId = stepsWorkflow.StatusId;

            EnumData enumData = await _enumDataRepository.GetSingleObject(s => s.Id == stepsWorkflow.StatusId);

            quotation.WorkflowStatus = enumData?.Value ?? "";
            quotation = await _BaseRepository.InsertData(quotation);
            if (file != null)
            {
                Request.Headers["Folder"] = $@"{nameof(Quotation)}\{quotation.QuotationCode}";
                Request.Headers["RecordGuid"] = quotation.Guid.ToString();
                Request.Headers["SectionName"] = $@"{quotationData.QuotationData.Attributes.SectionName}_{quotation.Id.ToString()}";
                await AsyncUploadSingleFile(file);
            }
            instanceWorkflow.RecordGuid = quotation.Guid;

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

            //loop multiple account tai day
            var NotificationController = new NotificationController(_notificationRepository, configuration, _httpContextAccessor, _hubContext);
            long? initialNotificationTypeId = await NotificationTypeResolver.ResolveIdAsync(
                _enumDataRepository,
                NotificationTypeKeys.Initial);
            string picsStr = picS.PICMain.GetType().GetProperty(stepsWorkflow?.ToNodeId ?? "")?.GetValue(picS.PICMain ?? new PICAttributes()).ToString() ?? "";
            foreach (var memberName in picsStr.Split(","))
            {
                NotificationRequest notification = new NotificationRequest();
                Notification Notification = new Notification();
                Notification.Title = string.Format(_messageSettings.InitializeMessage.Title, quotation.QuotationCode);
                Notification.Message = quotation?.Subject ?? string.Format(_messageSettings.InitializeMessage.Content, "");
                Notification.IsRead = false;
                Notification.Resource = $"{memberName}_{stepsWorkflow.ToNodeId}";
                Notification.System = "WM";
                Notification.RecordGuid = quotation.Guid;
                Notification.Type = initialNotificationTypeId;

                Notification.ReceivedBy = memberName;
                notification.Notification = Notification;
                notification.connectionId = memberName;
                notification.tabPublicUrl = Util.URLObjectMaking(quotation);
                PropertyInfo prop = notification.tabPublicUrl.GetType().GetProperty("url");
                string giaTri = (string)prop.GetValue(notification.tabPublicUrl, null); // Lấy giá trị
                Notification.Url = JsonConvert.SerializeObject(Util.URLObjectMaking(quotation));
                await NotificationController.Notify(notification);
            }
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
        Users user = await _usersRepository.GetSingleObject(s => s.username == userName);
        Employee employee = await _employeeRepository.GetSingleObject(s => s.AccountName == userName);

        if (user == null)
        {
            return BadRequest("User not found.");
        }

        // Nếu là SUPER_USER, trả về tất cả dữ liệu
        if (SUPER_USER.Contains(user.username))
        {
            return Ok(Base);
        }

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
        _BaseRepository.UpdateData(entity, form.values, form.key, "Id"); 



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
        ControllerHelper.SignalRResponse("R_ItemSubmitted", new { type = nameof(Quotation) }, ControllerUtil.GetCurrentContextUser(_httpContextAccessor, configuration), DOMAIN_NAME);
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
