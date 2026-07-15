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

[ApiController]
[Route("api/[controller]/[action]")]
public class PolicyIssuanceController : BaseControllerApi<PolicyIssuance>
{
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
    private readonly IBaseRepository<MailTemplate> _mailTemplateRepository;
    private readonly IBaseRepository<MailQueue> _mailQueueRepository;
    private readonly IBaseRepository<UsersSession> _usersSessionRepository;
    private readonly IBaseRepository<SLA> _slaRepository;

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
        _mailTemplateRepository = new BaseRepository<MailTemplate>(configuration, _httpContextAccessor);
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
            status = "saving ...",
            tabName = _messageSettings.OverviewMessageLoading.Title,
            subTabContent = _messageSettings.OverviewMessageLoading.Content,
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


            if (workflowDefinition != null) { 
                StepsWorkflow stepsWorkflow = await _stepsWorkflowRepository.GetSingleObject(s => s.WorkflowDefinitionId == workflowDefinition.Guid && s.IsStart == true);
                InstanceWorkflow instanceWorkflow = new InstanceWorkflow();
                instanceWorkflow.WorkflowDefinitionId = workflowDefinition.Guid;
                //instanceWorkflow.CurrentStep = "2";
                if (stepsWorkflow != null)

                {
                    (PICAttributes PICMain, PICSysHandleAttributes PICLeader, PICAttributes PICHOD) picS = ControllerUtil.PersonInChargeHandle(PolicyIssuance, stepsWorkflow, _businessConfig, siteEnums);
                    //quotation.LeaderPIC = JsonConvert.SerializeObject(picS.PICLeader);
                    //quotation.HODPIC = JsonConvert.SerializeObject(picS.PICHOD);
                    PolicyIssuance.StatusId = stepsWorkflow.StatusId;

                    EnumData enumData = await _enumDataRepository.GetSingleObject(s => s.Id == stepsWorkflow.StatusId);

                    PolicyIssuance.WorkflowStatus = enumData?.Value ?? "";
                    PolicyIssuance.StageDept = stepsWorkflow.ToNodeId;

                    PolicyIssuance = await _BaseRepository.InsertData(PolicyIssuance);
                    PolicyIssuanceDetails policyIssuanceDetails = new PolicyIssuanceDetails();
                    policyIssuanceDetails.PolicyIssuanceId = PolicyIssuance.Id;
                    policyIssuanceDetails = await _policyIssuanceDetailsRepository.InsertData(policyIssuanceDetails);
                    PolicyIssuanceChecklist policyIssuanceCheckList = new PolicyIssuanceChecklist();
                    policyIssuanceCheckList.PolicyIssuanceId = PolicyIssuance.Id;
                    policyIssuanceCheckList = await _policyIssuanceChecklistRepository.InsertData(policyIssuanceCheckList);

                    instanceWorkflow.RecordGuid = PolicyIssuance.Guid;
                    instanceWorkflow.CurrentStep = stepsWorkflow.TNodeId;
                    instanceWorkflow.CurrentStepId = new Guid();
                    instanceWorkflow.IsCancelled = false;
                    instanceWorkflow.IsCompleted = false;
                    instanceWorkflow = await _instanceWorkflowRepository.InsertData(instanceWorkflow);




                    SubmitRequest submitRequest = new SubmitRequest();
                    submitRequest.StepsWorkflow = stepsWorkflow;
                    submitRequest.Comment = $"{PolicyIssuance.PolicyIssuanceCode} created!";
                    submitRequest.InstanceWorkflow = instanceWorkflow;




                    await ControllerUtil.LogAction(_quotationCommentLogRepository, _httpContextAccessor, configuration, DOMAIN_NAME, PolicyIssuance, submitRequest, _blobStorageSettings);

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
                        Notification.Title = string.Format(_messageSettings.InitializeMessage.Title, PolicyIssuance.PolicyIssuanceCode);
                        Notification.Message = PolicyIssuance?.Subject ?? string.Format(_messageSettings.InitializeMessage.Content, "");
                        Notification.IsRead = false;
                        Notification.Resource = $"{memberName}_{stepsWorkflow.ToNodeId}";
                        Notification.System = "WM";
                        Notification.RecordGuid = PolicyIssuance.Guid;
                        Notification.Type = initialNotificationTypeId;

                        Notification.ReceivedBy = memberName;
                        notification.Notification = Notification;
                        notification.connectionId = memberName;
                        notification.tabPublicUrl = Util.URLObjectMaking(PolicyIssuance);
                        PropertyInfo prop = notification.tabPublicUrl.GetType().GetProperty("url");
                        string giaTri = (string)prop.GetValue(notification.tabPublicUrl, null); // Lấy giá trị
                        Notification.Url = JsonConvert.SerializeObject(Util.URLObjectMaking(PolicyIssuance));
                        await NotificationController.Notify(notification);
                    }
                }

                //quotationComplete = quotationCount ?? 0 / i; //Pending at ajax
                result = new SignalRResult
            {
                status = "saving ...",
                data = PolicyIssuanceData,
                tabName = _messageSettings.OverviewMessageLoading.Title,
                subTabContent = _messageSettings.OverviewMessageLoading.Content,
                progressvalue = 75,//quotationComplete,
                type = "inprogress"
            };
            ControllerHelper.SignalRResponse(_usersSessionRepository, "R_OverviewLoading", new { payload = result, connectionId = onlineUser.ConnectionId }, ControllerUtil.GetCurrentContextUser(_httpContextAccessor, configuration), DOMAIN_NAME);
            startCount++;
            }
            else
            {
                result = new SignalRResult
                {
                    status = "saving ...",
                    data = PolicyIssuanceData,
                    tabName = _messageSettings.OverviewMessageLoading.Title,
                    subTabContent = _messageSettings.OverviewMessageLoading.Content,
                    progressvalue = 100,//quotationComplete,
                    type = "error"
                };
                ControllerHelper.SignalRResponse(_usersSessionRepository, "R_OverviewLoading", new { payload = result, connectionId = onlineUser.ConnectionId }, ControllerUtil.GetCurrentContextUser(_httpContextAccessor, configuration), DOMAIN_NAME);
                return BadRequest(new { detail = "Initial Quotation Error", message = "Flow not found!" });
            }




        }
        result = new SignalRResult
        {
            status = "",
            data = PolicyIssuanceData,
            tabName = _messageSettings.OverviewMessageLoading.Title,
            subTabContent = _messageSettings.OverviewMessageLoading.Content,
            progressvalue = 100,
            type = "complete"
        };
        ControllerHelper.SignalRResponse(_usersSessionRepository, "R_OverviewLoading", new { payload = result, connectionId = onlineUser.ConnectionId }, ControllerUtil.GetCurrentContextUser(_httpContextAccessor, configuration), DOMAIN_NAME);
        return Ok();
    }

    [HttpGet("{id}/{toDept}/{loginUser}")]
    public async Task<IActionResult> AssignTask(long id, string toDept, string loginUser)
    {
        MailTemplate mailTemplate = new MailTemplate();
        mailTemplate = await _mailTemplateRepository.GetSingleObject(s => s.TemplateName == "Assign Mail");
        PolicyIssuance quotation = new PolicyIssuance();
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
                Code = quotation.PolicyIssuanceCode,
                ModuleName = nameof(PolicyIssuance)
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



    [HttpPost]
    public override async Task<object> ExecuteCustomQuery([FromBody] string query)
    {

        ////query = "EXEC usp_fd_policy_issuance_request";
        //List<Dictionary<string, object>> obj = await _BaseRepository.ExecuteCustomQuery(query);
        var Base = await _BaseRepository.ExecuteCustomQuery(query);
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

        var entity = new PolicyIssuance();
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
        ControllerHelper.SignalRResponse(_usersSessionRepository, "R_ItemSubmitted", new { id = form.key, type = nameof(PolicyIssuance) }, ControllerUtil.GetCurrentContextUser(_httpContextAccessor, configuration), DOMAIN_NAME);

        return new HttpResponseMessage(HttpStatusCode.OK);
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

        return Ok(Base);
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
