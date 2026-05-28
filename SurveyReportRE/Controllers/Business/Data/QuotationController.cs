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
using Document = ERPCore.Models.Migration.Business.Data.Document;
using ERPCore.Models.Migration.Business.Social;
using AutoMapper.Internal;

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
    private readonly IBaseRepository<QuotationCommentLog> _quotationCommentLogRepository;
    private readonly IBaseRepository<StepsWorkflow> _stepsWorkflowRepository;
    private readonly IBaseRepository<Document> _documentRepository;
    private readonly IBaseRepository<Notification> _notificationRepository;
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
        _quotationCommentLogRepository = new BaseRepository<QuotationCommentLog>(configuration, _httpContextAccessor);
        _stepsWorkflowRepository = new BaseRepository<StepsWorkflow>(configuration, _httpContextAccessor);
        _documentRepository = new BaseRepository<Document>(configuration, _httpContextAccessor);
        _notificationRepository = new BaseRepository<Notification>(configuration, _httpContextAccessor);
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
        CURRENT_USER = _httpContextAccessor.HttpContext.User.Identity.Name.Replace(DOMAIN_NAME, "");
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

    [HttpGet]
    public override async Task<ActionResult<Quotation>> GetAll()
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
    public async Task<IActionResult> CreateQuotation([FromForm] QuotationRequest quotationData)
    {

        IFormFileCollection files = null;
        files = ((FormCollection)(Request.Form)).Files;
        quotationData.QuotationData = JsonConvert.DeserializeObject<QuotationData>(Request.Form["QuotationData"]);
        foreach (var file in files)
        {


        //Before insert quotation
        Quotation quotation = new Quotation();
        List<FormatCodeNo> tableConfig = new List<FormatCodeNo>();
        tableConfig = await _formatCodeNoRepository.GetListObjectFullInclude(l => l.NoSeqCode == nameof(Quotation) + "Code");

        Res res = new Res();
        res = await _resRepository.InsertData(res);


        JsonConvert.PopulateObject(JsonConvert.SerializeObject(quotationData.QuotationData.Quotation), quotation);
        quotation.QuotationCode = ControllerUtil.GenerateNumberSeq(tableConfig, _formatCodeNoRepository, nameof(Quotation));
        quotation.ResId = res.Id;



        


        //After insert quotation
        WorkflowDefinition workflowDefinition = new WorkflowDefinition();
        workflowDefinition = await _workflowDefinitionRepository.GetSingleObject(s => s.WorkflowCode == _businessConfig.CurrentValue.Workflow.Quotation);

        if (workflowDefinition != null)
        {
            StepsWorkflow stepsWorkflow = await _stepsWorkflowRepository.GetSingleObject(s => s.WorkflowDefinitionId == workflowDefinition.Guid && s.StepNo == "1" && s.FromNodeId == quotationData.QuotationData.StartingDept);
            InstanceWorkflow instanceWorkflow = new InstanceWorkflow();
            instanceWorkflow.WorkflowDefinitionId = workflowDefinition.Guid;
            //instanceWorkflow.CurrentStep = "2";
            if (stepsWorkflow == null) return StatusCode(500, new
            {
                message = "Workflow not build or missing from system",
                detail = "Please contact admin!"
            });
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

        }
        PICAttributes pICAttributes = new PICAttributes();
        pICAttributes = JsonConvert.DeserializeObject<PICAttributes>(quotation.PIC);
        var NotificationController = new NotificationController(_notificationRepository, configuration, _httpContextAccessor, _hubContext);
        NotificationRequest notification = new NotificationRequest();
        Notification Notification = new Notification();
        Notification.Title = _messageSettings.InitializeMessage.Title;
        Notification.Message = quotation?.Subject ?? _messageSettings.InitializeMessage.Content;
        Notification.IsRead = false;
        Notification.Resource = $"{pICAttributes.TS}_TS";
        Notification.System = "WM";
        Notification.RecordGuid = quotation.Guid;

        Notification.ReceivedBy = pICAttributes.TS;
        notification.Notification = Notification;
        notification.connectionId = pICAttributes.TS;
        //notification.tabPublicUrl = new
        //{
        //    url = $"/Business/Form/{nameof(Quotation)}_Form/{quotation.Id}",
        //    caption = $"form_{nameof(Quotation)}_Form_{quotation.Id}",
        //    name = $"{nameof(Quotation)} {quotation.QuotationCode}",
        //    data = ""
        //}; ;        
        notification.tabPublicUrl = Util.URLObjectMaking(quotation);
        PropertyInfo prop = notification.tabPublicUrl.GetType().GetProperty("url");
            string giaTri = (string)prop.GetValue(notification.tabPublicUrl, null); // Lấy giá trị
            Notification.Url = JsonConvert.SerializeObject(Util.URLObjectMaking(quotation));
            NotificationController.Notify(notification);

        }

        return Ok();
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
            StepsWorkflow stepsWorkflow = await _stepsWorkflowRepository.GetSingleObject(s => s.WorkflowDefinitionId == workflowDefinition.Guid && s.StepNo == "1" && s.FromNodeId == quotationData.QuotationData.StartingDept);
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
        pICAttributes = JsonConvert.DeserializeObject<PICAttributes> (quotation.PIC);
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
                Code = quotation.QuotationCode 
            };

            Notification notification = await ControllerUtil.Notify(transferObject);

             

            await _notificationRepository.InsertData(notification);


            return Ok();
        } 
        catch (Exception exception)
        {
            throw exception;
        }
    }

    [HttpGet("{listIds}/{jsessionId}")]
    public async Task<ActionResult<Quotation>> PullDataBySession(string listIds,string jsessionId)
    {
        string[] ids = listIds.Split(',');
        foreach (string id in ids)
        {
            await Task.Factory.StartNew(async () => {
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
                    string tempDir = System.IO.Path.Combine(_blobStorageSettings.CurrentValue.Path, _blobStorageSettings.CurrentValue.QuotationAttachmentFolder,id);
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
        ControllerHelper.SignalRResponse(_hubContext, "ItemSubmitted", new { type = "Quotation" }, ControllerUtil.GetCurrentContextUser(_httpContextAccessor, configuration), DOMAIN_NAME);
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


  

}
