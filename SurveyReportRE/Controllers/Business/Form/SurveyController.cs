using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using SurveyReportRE.Common;
using SurveyReportRE.Controllers.Base;
using SurveyReportRE.Models.Migration.Business.Data;
using SurveyReportRE.Models.Migration.Business.Form;
using SurveyReportRE.Models.Migration.Config;
using SurveyReportRE.Models.Request;
using System.Linq.Expressions;
//using DocumentFormat.OpenXml;
//using DocumentFormat.OpenXml.Packaging;
//using DocumentFormat.OpenXml.Wordprocessing;
//using DocumentFormat.OpenXml.Office2013.Word;
//using MiniExcelLibs;
//using MiniExcelLibs.OpenXml;
using MiniSoftware;
using SurveyReportRE.Models.Base;
using SurveyReportRE.Models.Migration.Business.MasterData;
using Outline = SurveyReportRE.Models.Migration.Business.MasterData.Outline;
//using Html2Markdown;
using System.Data;
//using HtmlToOpenXml;
using Util = SurveyReportRE.Common.Util;
using DataTable = System.Data.DataTable;
using SurveyReportRE.Models.Migration.Business.HumanResource;
using SurveyReportRE.ControllerUtil;
using RESurveyTool.Common.Common;
using SurveyReportRE.Models.Migration.Business.Config;
using RESurveyTool.Models.Models.Parsing;
using System.IO;
using System.Runtime.Serialization.Formatters.Binary;
using System.Text;
using SurveyReportRE.Models.Business.Migration.Config;
using System.Collections;
using Newtonsoft.Json.Linq;
using Org.BouncyCastle.Asn1;
using DocumentFormat.OpenXml.Office2010.Excel;
//using HtmlToOpenXml;
//using DocumentFormat.OpenXml.Packaging;
//using DocumentFormat.OpenXml.Wordprocessing;
using HtmlAgilityPack;
using Microsoft.VisualBasic;
using DocumentFormat.OpenXml.Packaging;
using HtmlToOpenXml;
using DocumentFormat.OpenXml.Wordprocessing;
using MailKit.Net.Imap;
using RESurveyTool.Common.Constant;
using Microsoft.CodeAnalysis.FlowAnalysis;
using SurveyReportRE.Models.Migration.Business.Workflow;
using System.Collections.Generic;
using DocumentFormat.OpenXml.Math;
using static SkiaSharp.HarfBuzz.SKShaper;
using MimeKit.Tnef;
using JetBrains.Annotations;
using Serilog;
using Microsoft.AspNetCore.SignalR;
using System.Reflection;
using BitMiracle.LibTiff.Classic;
using System.Linq;
using Microsoft.Extensions.Configuration;
using RESurveyTool.Models.Models.Config;

[ApiController]
[Route("api/[controller]/[action]")]
public class SurveyController : BaseControllerApi<Survey>
{
    private readonly IBaseRepository<Survey> _BaseRepository;
    private readonly IConfiguration configuration;
    //private readonly IBaseRepository<Survey> _surveyRepository;
    private readonly IBaseRepository<PosNegAspect> _posNegAspectRepository;
    private readonly IBaseRepository<SurveyEvaluation> _surveyEvaluationRepository;
    private readonly IBaseRepository<SurveyOutlineOptions> _surveyOutlineOptionsRepository;
    private readonly IBaseRepository<Management> _managementRepository;
    private readonly IBaseRepository<EnumData> _enumDataRepository;
    private readonly IBaseRepository<Construction> _constructionRepository;
    private readonly IBaseRepository<ConstructionBuilding> _constructionBuildingRepository;
    private readonly IBaseRepository<OccupancyDetail> _occupancyDetailRepository;
    //private readonly IBaseRepository<Chart> _chartRepository;
    private readonly IBaseRepository<Attachment> _attachmentRepository;
    private readonly IBaseRepository<Occupancy> _occupancyRepository;
    private readonly IBaseRepository<Protection> _protectionRepository;
    private readonly IBaseRepository<ProtectionDetail> _protectionDetailRepository;
    private readonly IBaseRepository<Client> _clientRepository;
    private readonly IBaseRepository<Outline> _outlineRepository;
    private readonly IBaseRepository<Summary> _summaryRepository;
    private readonly IBaseRepository<ExtFireExpExposures> _extFireExpExposuresRepository;
    private readonly IBaseRepository<OtherExposures> _otherExposuresRepository;
    private readonly IBaseRepository<LossHistory> _lossHistoryRepository;
    private readonly IBaseRepository<LossExpValueBrkdwn> _lossExpValueBrkdwnRepository;
    private readonly IBaseRepository<Appendix> _appendixRepository;
    private readonly IBaseRepository<SitePictures> _sitePicturesRepository;
    private readonly IBaseRepository<MailTemplate> _mailTemplateRepository;
    private readonly IBaseRepository<Employee> _employeeRepository;
    private readonly IBaseRepository<UrlCall> _urlCallRepository;
    private readonly IBaseRepository<Users> _usersRepository;
    private readonly IBaseRepository<UserRoles> _userRolesRepository;
    private readonly IBaseRepository<OutlineDynamic> _outlineDynamicRepository;
    private readonly IBaseRepository<LossExpValueBrkdwnDetail> _lossExpValueBrkdwnDetailRepository;
    private readonly IBaseRepository<LossHistoryDetail> _lossHistoryDetailRepository;
    private readonly IBaseRepository<ParticipantList> _participantListRepository;
    private readonly IBaseRepository<Wording> _wordingRepository;
    private readonly IBaseRepository<Roles> _rolesRepository;
    private readonly IBaseRepository<SurveyWorkflowHistory> _surveyWorkflowHistoryRepository;
    private readonly IBaseRepository<DataGridConfigDynamic> _dataGridConfigDynamicRepository;
    private readonly IBaseRepository<UserWorkflow> _userWorkFlowRepository;
    private readonly IBaseRepository<InstanceWorkflow> _instanceWorkFlowRepository;
    private readonly IBaseRepository<StepsWorkflow> _stepsWorkFlowRepository;
    private readonly IBaseRepository<FileEncrypt> _fileEncryptRepository;
    private readonly IBaseRepository<Location> _locationRepository;
    private readonly IBaseRepository<MailQueue> _mailQueueRepository;
    private readonly IBaseRepository<SurveyMemoWorkflow> _surveyMemoWorkflowRepository;
    private readonly IBaseRepository<SurveyActionConfig> _surveyActionConfigRepository;
    private readonly Microsoft.Extensions.Options.IOptionsMonitor<BlobStorageSettings> optionsMonitor;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IHubContext<FileProcessingHub> _hubContext;
    public static string PATH_TEMPLATE = "";
    public static string W_PATH_TEMPLATE = "";
    public static string NO_IMAGE = "";
    public static string ORDER_MAIL = "";
    public static string LABEL_WORD_PATH = "";
    public static string LOGO_WORD_PATH = "";
    //public static string FOLLOW_CC = "";
    public static string REDIRECT_MAIN_VIEW = "";
    public static string BLOB_PATH = "";
    public static string GRANTEDSURVEY_PATH = "";
    public static string SUPER_USER = "";
    public static string DOMAIN_NAME = "";
    public static string CURRENT_USER = "";
    public static string STATIC_PLACEHOLDER = "";
    public static string MANAGER_APP = "";
    public static string APPROVER_APP = "";
    public static string CHECKER_APP = "";
    public static string USER_APP = "";
    public static string CURRENCY_ENUMNAME = "";
    public static string CURRENCY_TYPE = "";
    public static string APPROVED_KEYWORD = "";
    public static string SUFFIX_APPROVED_KEYWORD = "";
    public static string SURVEY_EVALUATION_STATUS_KEYNAME = "";
    public static string SURVEY_EVALUATION_CATEGORY_KEYNAME = "";
    public static string DEFAULT_STATUS_SURVEY_EVALUATION = "";
    //public static string HCM_SITE_CC_EMAIL_ACCOUNT = "";
    //public static string HN_SITE_CC_EMAIL_ACCOUNT = "";
    public static int EXPIRE_DAYS;
    public static int SURVEY_DUEDATE_PERIOD;
    public static BusinessConfig BusinessConfig;

    public SurveyController(IBaseRepository<Survey> BaseRepository, IConfiguration config, Microsoft.Extensions.Options.IOptionsMonitor<BlobStorageSettings> blobStorageSettings, IHttpContextAccessor httpContextAccessor, IHubContext<FileProcessingHub> hubContext) : base(BaseRepository, httpContextAccessor)
    {
        configuration = config;
        optionsMonitor = blobStorageSettings;
        _httpContextAccessor = httpContextAccessor;
        TemplateUsing usingTemplate = configuration.GetSection("TemplateUsing").Get<TemplateUsing>();
        ORDER_MAIL = configuration.GetSection("UrlConfig:OrderMail").Value;
        //SUBMIT_HARD_NAME = configuration.GetSection("UrlConfig:SubmitHardName").Value;
        //FORWARD_HARD_NAME = configuration.GetSection("UrlConfig:ForwardHardName").Value;
        //NOTIFY_HARD_NAME = configuration.GetSection("UrlConfig:NotifyBackHardName").Value;
        EXPIRE_DAYS = int.Parse(configuration.GetSection("UrlConfig:ExpireDays").Value);
        SURVEY_DUEDATE_PERIOD = int.Parse(configuration.GetSection("BusinessConfig:SurveyDueDatePeriod").Value);
        MANAGER_APP = configuration.GetSection("BusinessConfig:ManagerAppKey").Value;
        APPROVER_APP = configuration.GetSection("BusinessConfig:ApproverAppKey").Value;
        CHECKER_APP = configuration.GetSection("BusinessConfig:CheckerAppKey").Value;
        USER_APP = configuration.GetSection("BusinessConfig:UserAppKey").Value;
        CURRENCY_ENUMNAME = configuration.GetSection("BusinessConfig:DefaultCurrencyEnumName").Value;
        CURRENCY_TYPE = configuration.GetSection("BusinessConfig:DefaultCurrencyType").Value;
        APPROVED_KEYWORD = configuration.GetSection("BusinessConfig:ApprovedDocxFileName").Value;
        SUFFIX_APPROVED_KEYWORD = configuration.GetSection("BusinessConfig:SuffixApprovedDocxFileName").Value;
        SURVEY_EVALUATION_STATUS_KEYNAME = configuration.GetSection("BusinessConfig:SurveyEvaluationStatusKeyName").Value;
        SURVEY_EVALUATION_CATEGORY_KEYNAME = configuration.GetSection("BusinessConfig:SurveyEvaluationCategoryKeyName").Value;
        DEFAULT_STATUS_SURVEY_EVALUATION = configuration.GetSection("BusinessConfig:DefaultStatusSurveyEvaluation").Value;
        //HCM_SITE_CC_EMAIL_ACCOUNT = configuration.GetSection("BusinessConfig:HCMSiteEmailCCAccount").Value;
        //HN_SITE_CC_EMAIL_ACCOUNT = configuration.GetSection("BusinessConfig:HNSiteEmailCCAccount").Value;
        REDIRECT_MAIN_VIEW = configuration.GetSection("UrlConfig:RedirectMainView").Value;
        //FOLLOW_CC = configuration.GetSection("Email:FollowCC").Value;
        SUPER_USER = configuration.GetSection("SuperUser:SuperUser").Value;
        DOMAIN_NAME = configuration.GetSection("Domain:DCServer").Value;
        STATIC_PLACEHOLDER = configuration.GetSection("CoreConfig:StaticPlaceHolderChoosing").Value;
        _BaseRepository = BaseRepository;
        BLOB_PATH = blobStorageSettings.CurrentValue.Path;
        NO_IMAGE = System.IO.Path.Combine(BLOB_PATH, configuration.GetSection("TemplateUsing:NoImage").Value);
        LABEL_WORD_PATH = System.IO.Path.Combine(BLOB_PATH, configuration.GetSection("TemplateUsing:LabelWord").Value);
        LOGO_WORD_PATH = System.IO.Path.Combine(BLOB_PATH, configuration.GetSection("TemplateUsing:LogoWord").Value);
        PATH_TEMPLATE = System.IO.Path.Combine(blobStorageSettings.CurrentValue.Path, blobStorageSettings.CurrentValue.TemplateFolder, usingTemplate.FactoryType);
        W_PATH_TEMPLATE = System.IO.Path.Combine(blobStorageSettings.CurrentValue.Path, blobStorageSettings.CurrentValue.TemplateFolder, usingTemplate.WarehouseType);
        GRANTEDSURVEY_PATH = System.IO.Path.Combine(BLOB_PATH, blobStorageSettings.CurrentValue.GrantedSurveyFolder, _httpContextAccessor.HttpContext.User.Identity.Name.Replace(DOMAIN_NAME, ""));
        //_surveyRepository = new BaseRepository<Survey>(configuration, _httpContextAccessor);
        _posNegAspectRepository = new BaseRepository<PosNegAspect>(configuration, _httpContextAccessor);
        _surveyEvaluationRepository = new BaseRepository<SurveyEvaluation>(configuration, _httpContextAccessor);
        _enumDataRepository = new BaseRepository<EnumData>(configuration, _httpContextAccessor);
        _managementRepository = new BaseRepository<Management>(configuration, _httpContextAccessor);
        _constructionRepository = new BaseRepository<Construction>(configuration, _httpContextAccessor);
        _constructionBuildingRepository = new BaseRepository<ConstructionBuilding>(configuration, _httpContextAccessor);
        _occupancyDetailRepository = new BaseRepository<OccupancyDetail>(configuration, _httpContextAccessor);
        //_chartRepository = new BaseRepository<Chart>(configuration);
        _attachmentRepository = new BaseRepository<Attachment>(configuration, _httpContextAccessor);
        _occupancyRepository = new BaseRepository<Occupancy>(configuration, _httpContextAccessor);
        _protectionRepository = new BaseRepository<Protection>(configuration, _httpContextAccessor);
        _clientRepository = new BaseRepository<Client>(configuration, _httpContextAccessor);
        _outlineRepository = new BaseRepository<Outline>(configuration, _httpContextAccessor);
        _summaryRepository = new BaseRepository<Summary>(configuration, _httpContextAccessor);
        _extFireExpExposuresRepository = new BaseRepository<ExtFireExpExposures>(configuration, _httpContextAccessor);
        _otherExposuresRepository = new BaseRepository<OtherExposures>(configuration, _httpContextAccessor);
        _lossHistoryRepository = new BaseRepository<LossHistory>(configuration, _httpContextAccessor);
        _lossExpValueBrkdwnRepository = new BaseRepository<LossExpValueBrkdwn>(configuration, _httpContextAccessor);
        _appendixRepository = new BaseRepository<Appendix>(configuration, _httpContextAccessor);
        _surveyOutlineOptionsRepository = new BaseRepository<SurveyOutlineOptions>(configuration, _httpContextAccessor);
        _sitePicturesRepository = new BaseRepository<SitePictures>(configuration, _httpContextAccessor);
        _protectionDetailRepository = new BaseRepository<ProtectionDetail>(configuration, _httpContextAccessor);
        _mailTemplateRepository = new BaseRepository<MailTemplate>(configuration, _httpContextAccessor);
        _employeeRepository = new BaseRepository<Employee>(configuration, _httpContextAccessor);
        _urlCallRepository = new BaseRepository<UrlCall>(configuration, _httpContextAccessor);
        _usersRepository = new BaseRepository<Users>(configuration, _httpContextAccessor);
        _outlineDynamicRepository = new BaseRepository<OutlineDynamic>(configuration, _httpContextAccessor);
        _lossExpValueBrkdwnDetailRepository = new BaseRepository<LossExpValueBrkdwnDetail>(configuration, _httpContextAccessor);
        _lossHistoryDetailRepository = new BaseRepository<LossHistoryDetail>(configuration, _httpContextAccessor);
        _participantListRepository = new BaseRepository<ParticipantList>(configuration, _httpContextAccessor);
        _userRolesRepository = new BaseRepository<UserRoles>(configuration, _httpContextAccessor);
        _rolesRepository = new BaseRepository<Roles>(configuration, _httpContextAccessor);
        _wordingRepository = new BaseRepository<Wording>(configuration, _httpContextAccessor);
        _surveyWorkflowHistoryRepository = new BaseRepository<SurveyWorkflowHistory>(configuration, _httpContextAccessor);
        _dataGridConfigDynamicRepository = new BaseRepository<DataGridConfigDynamic>(configuration, _httpContextAccessor);
        _userWorkFlowRepository = new BaseRepository<UserWorkflow>(configuration, _httpContextAccessor);
        _instanceWorkFlowRepository = new BaseRepository<InstanceWorkflow>(configuration, _httpContextAccessor);
        _stepsWorkFlowRepository = new BaseRepository<StepsWorkflow>(configuration, _httpContextAccessor);
        _fileEncryptRepository = new BaseRepository<FileEncrypt>(configuration, _httpContextAccessor);
        _locationRepository = new BaseRepository<Location>(configuration, _httpContextAccessor);
        _mailQueueRepository = new BaseRepository<MailQueue>(configuration, _httpContextAccessor);
        _surveyMemoWorkflowRepository = new BaseRepository<SurveyMemoWorkflow>(configuration, _httpContextAccessor);
        _surveyActionConfigRepository = new BaseRepository<SurveyActionConfig>(configuration, _httpContextAccessor);
        _hubContext = hubContext;
        CURRENT_USER = _httpContextAccessor.HttpContext.User.Identity.Name.Replace(DOMAIN_NAME, "");
        BusinessConfig = configuration.GetSection("BusinessConfig").Get<BusinessConfig>();
    }

    [HttpGet]


    //public async Task WFChangeStatus(Survey survey, int? step, long? workflowStatusId, bool isDelete = false)
    #region HttpGet
    [HttpGet("{surveyNo}")]
    public async Task<bool> IsWordRender(string surveyNo)
    {
        string docPath = System.IO.Path.Combine(optionsMonitor.CurrentValue.Path, nameof(Survey), $"{surveyNo}.docx");
        return System.IO.File.Exists(docPath);
    }

    [HttpGet("{surveyNo}")]
    public async Task<bool> IsPDFRender(string surveyNo)
    {
        string pdfPath = System.IO.Path.Combine(optionsMonitor.CurrentValue.Path, nameof(Survey), $"{surveyNo}.pdf");
        return System.IO.File.Exists(pdfPath);
    }

    [HttpGet("{surveyId}/{archivedType}")]
    public async Task<IActionResult> StoreSurvey(long surveyId, string archivedType)
    {
        Survey survey = await _BaseRepository.GetSingleObject(s => s.Id == surveyId);
        if (archivedType == "Archived")
            survey.IsArchived = true;
        if (archivedType == "Unarchived")
            survey.IsArchived = false;
        survey = await _BaseRepository.UpdateData(survey, JsonConvert.SerializeObject(survey), surveyId, "Id");
        return Ok();
    }

    [HttpGet("{id}")]
    public override async Task<ActionResult<Survey>> GetSingleInclude(int id)
    {
        //var Base = await _BaseRepository.GetSingleObject(s => s.Id == id);
        var Base = await _BaseRepository.GetSingleObjectFullInclude(f => f.Id == id);
        if (Base != null)
        {
            if (Base.LossExpValueBrkdwnFK != null)
                if (Base.LossExpValueBrkdwnFK.CurrencyId != null && Base.LossExpValueBrkdwnFK.CurrencyId != 0)
                {
                    Base.LossExpValueBrkdwnFK.CurrencyEnum = _lossExpValueBrkdwnRepository.ObjectSpecificEnumIncludeSync(Base.LossExpValueBrkdwnFK, "Currency", f => f.CurrencyEnum);
                }

            Base = await _BaseRepository.IncludeListsOnly(Base);

            if (Base.SurveyOutlineOptions.Count > 0)
            {
                Base.SurveyOutlineOptions.ForEach(async f =>
                {
                    f = await _surveyOutlineOptionsRepository.ObjectSpecificInclude(f, f => f.OutlineFK);
                });
            }
            InstanceWorkflow instanceWorkflow = new InstanceWorkflow();
            instanceWorkflow = await _instanceWorkFlowRepository.GetSingleObject(s => s.RecordGuid == Base.Guid);
            if (instanceWorkflow != null)
            {
                instanceWorkflow = await _instanceWorkFlowRepository.GetSingleObjectFullInclude(s => s.Id == instanceWorkflow.Id);

                //instanceWorkflow.WorkflowStatusEnum = await _enumDataRepository.EnumInclude(nameof(instanceWorkflow.WorkflowStatusEnum), instanceWorkflow, "WorkflowStatus");
                Base.InstanceWorkflowFK = instanceWorkflow;
                Base.WorkflowStatusId = instanceWorkflow.WorkflowStatusId;
            }

        }
        if (Base == null)
        {
            return Ok(new Survey());
        }
        return Ok(Base);
    }
    [HttpPost("{surveyId}/{tabName}/{connectionId}")]
    public async Task RenderSurveyTabNotCompleted([FromBody] string[] checkFields, int surveyId, string tabName, string connectionId)
    {
        //Xử lý ở đây
        Survey survey = new Survey();
        bool status = true;
        survey = await _BaseRepository.GetSingleObjectFullInclude(s => s.Id == surveyId);
        survey = await _BaseRepository.IncludeListsOnly(survey);
        object attachments = new object();
        if (survey != null)
        {
            if (survey.Attachments.Count > 0) attachments = survey.Attachments;
            if (tabName.ToLower() == "reopinion")
            {
                string reOpinionString = "";
                if (Util.IsHtml(survey.REOpinion))
                {
                    HtmlDocument document = new HtmlDocument();
                    document = Util.TableHTMLRemake(survey.REOpinion);
                    reOpinionString = document.DocumentNode.InnerText;
                    status = string.IsNullOrEmpty(survey.REOpinion);

                }
            }
            else
            {
                PropertyInfo? tabProperty = typeof(Survey).GetProperty(tabName + "FK");
                if (tabProperty != null)
                {
                    object? tabValue = tabProperty.GetValue(survey);
                    if (tabValue != null)
                    {
                        // Kiểm tra nếu là danh sách
                        if (tabValue is IEnumerable<object> list)
                        {
                            //status = list.All(item => Util.IsObjectEmpty(item));
                        }
                        else // Kiểm tra nếu là một object đơn
                        {
                            status = Util.IsObjectEmpty(tabValue, (string[])checkFields);
                        }
                    }
                }
            }
            Task.Run(async () =>
            {
                await _hubContext.Clients.Client(connectionId).SendAsync("RenderSurveyTabNotCompleted", tabName, status, connectionId, attachments);
            });
        }
    }


    [HttpPost("{surveyId}/{tabName}/{connectionId}")]
    public async Task RenderSurveySubTabNotCompleted([FromBody] string[] checkFields, int surveyId, string tabName, string connectionId)
    {
        //Xử lý ở đây
        Survey survey = new Survey();
        Dictionary<string, bool> returnObject = new Dictionary<string, bool>();
        //bool status = true;
        survey = await _BaseRepository.GetSingleObjectFullInclude(s => s.Id == surveyId);
        survey = await _BaseRepository.IncludeListsOnly(survey);
        object attachments = new object();
        if (survey != null)
        {
            if (survey.Attachments.Count > 0) attachments = survey.Attachments;
            if (tabName.ToLower() == "reopinion")
            {
                string reOpinionString = "";
                if (Util.IsHtml(survey.REOpinion))
                {
                    HtmlDocument document = new HtmlDocument();
                    document = Util.TableHTMLRemake(survey.REOpinion);
                    reOpinionString = document.DocumentNode.InnerText;
                    //status = string.IsNullOrEmpty(survey.REOpinion);

                }
            }
            else
            {
                PropertyInfo? tabProperty = typeof(Survey).GetProperty(tabName + "FK");
                if (tabProperty != null)
                {
                    object? tabValue = tabProperty.GetValue(survey);
                    if (tabValue != null)
                    {
                        // Kiểm tra nếu là danh sách
                        if (tabValue is IEnumerable<object> list)
                        {
                            //status = list.All(item => Util.IsObjectEmpty(item));
                        }
                        else // Kiểm tra nếu là một object đơn
                        {
                            returnObject = Util.IsObjectProperties(tabValue, (string[])checkFields);
                            ;
                        }
                    }
                }
            }
            Task.Run(async () =>
            {
                await _hubContext.Clients.Client(connectionId).SendAsync("RenderSurveySubTabNotCompleted", new { surveyData = survey, data = returnObject, connectionId = connectionId, attachments = attachments });
            });
        }
    }

    [HttpGet("{connectionId}/{id}")]
    public async Task SubmitRecallVisible(string connectionId, long? id)
    {
        //Xử lý ở đây
        Survey survey = new Survey();
        bool visibleStatus = false;
        survey = await _BaseRepository.GetSingleObjectFullInclude(s => s.Id == id);
        if (survey != null)
        {
            bool isWordRender = await IsWordRender(survey.SurveyNo);
            bool isPDFRender = await IsPDFRender(survey.SurveyNo);
            UserInfo userInfo = await ControllerHelper.FetchUserRoles(_httpContextAccessor, configuration, DOMAIN_NAME);
            string buttonText = "Submit Survey";
            string buttonType = "Submit";
            string currentStatus = "";
            if (isWordRender && isPDFRender)
            {
                InstanceWorkflow instanceWorkflow = new InstanceWorkflow();
                instanceWorkflow = await _instanceWorkFlowRepository.GetSingleObjectFullInclude(s => s.RecordGuid == survey.Guid);
                if (instanceWorkflow != null)
                {
                    survey.InstanceWorkflowFK = instanceWorkflow;
                    //instanceWorkflow = await _instanceWorkFlowRepository.GetSingleObjectFullInclude(s => s.Id == instanceWorkflow.Id);

                    ////instanceWorkflow.WorkflowStatusEnum = await _enumDataRepository.EnumInclude(nameof(instanceWorkflow.WorkflowStatusEnum), instanceWorkflow, "WorkflowStatus");
                    //survey.InstanceWorkflowFK = instanceWorkflow;
                    //survey.WorkflowStatusId = instanceWorkflow.WorkflowStatusId;

                    currentStatus = instanceWorkflow.WorkflowStatusEnum.Key;
                    //int currentStep = survey.InstanceWorkflowFK.CurrentStep ?? 0;


                    //if (currentStep == 1)
                    //{
                    //    visibleStatus = true;
                    //}

                    //if (currentStatus == "Checking")
                    //{
                    //    buttonText = "Check Survey";
                    //    visibleStatus = true;
                    //}

                    //if (currentStatus == "Waiting")
                    //{
                    //    if (survey.InstanceWorkflowFK.RuleNo == 1 && userInfo.Roles?.RoleName == USER_APP)
                    //    {
                    //        buttonType = "Recall";
                    //        visibleStatus = true;
                    //    }

                    //}

                    //if (survey != null)
                    //{
                    //    Task.Run(async () =>
                    //    {
                    //        await _hubContext.Clients.Client(connectionId).SendAsync("SubmitRecallVisible", new { buttonType = buttonType, buttonText = buttonText, visibleStatus = visibleStatus, connectionId = connectionId });
                    //    });
                    //}
                }
                else
                {
                    //if (!string.IsNullOrEmpty(survey.OwnerReport))
                    //{
                    //    if (survey.OwnerReport == survey.CreatedBy)
                    //    {
                    //        if (survey.OwnerReport == userInfo.Users.username)
                    //        {
                    //            visibleStatus = true;
                    //        }
                    //    }
                    //    if (survey.OwnerReport != survey.CreatedBy)
                    //    {
                    //        if (survey.OwnerReport == userInfo.Users.username)
                    //        {
                    //            visibleStatus = true;
                    //        }
                    //    }
                    //}
                    //else
                    //{
                    //    if (userInfo.Users.username == survey.CreatedBy)
                    //        visibleStatus = true;
                    //}
                    //if (survey != null)
                    //{
                    //    Task.Run(async () =>
                    //    {
                    //        await _hubContext.Clients.Client(connectionId).SendAsync("SubmitRecallVisible", new { buttonType = buttonType, buttonText = buttonText, visibleStatus = visibleStatus, connectionId = connectionId });
                    //    });
                    //}
                }
                var isCreatedBy = survey.CreatedBy == userInfo.Users.username;
                var isOwner = survey.OwnerReport == userInfo.Users.username;
                var hasWorkflow = instanceWorkflow != null;
                //var currentStatus = survey.InstanceWorkflowFK?.WorkflowStatusEnum?.Key;

                List<SurveyActionConfig> configs = await _surveyActionConfigRepository.GetAll();
                SurveyActionConfig config = configs.FirstOrDefault(c =>
                      (c.RuleNo == null || c.RuleNo == survey.InstanceWorkflowFK?.RuleNo) &&
                      //(c.RequireInstanceWorkflow == null || c.RequireInstanceWorkflow == hasWorkflow) &&
                      (c.StatusKey == null || c.StatusKey == currentStatus) &&
                      (c.IsCreatedBy == null || c.IsCreatedBy == isCreatedBy) &&
                      (c.IsOwnerReport == null || c.IsOwnerReport == isOwner) &&
                      (c.MustDifferentOwner == null || c.MustDifferentOwner == (survey.CreatedBy != survey.OwnerReport))
                  );

                if (config != null && config.IsVisible)
                {
                    buttonText = config.ActionText;
                    buttonType = config.ActionType;
                    visibleStatus = config.IsVisible;
                }
                else if (!hasWorkflow)
                {
                    visibleStatus = true;
                }
                Task.Run(async () =>
                {
                    await _hubContext.Clients.Client(connectionId).SendAsync("SubmitRecallVisible", new { buttonType = buttonType, buttonText = buttonText, visibleStatus = visibleStatus, connectionId = connectionId });
                });
            }
        }
    }


    [HttpGet("{id}")]
    public async Task<ActionResult<Survey>> GetGrantSurveyList(int id)
    {
        var Base = await _BaseRepository.GetObjectByIdAsync(id);
        if (!string.IsNullOrEmpty(Base.GrantSurvey))
        {
            return Ok(Base.GrantSurvey);
        }
        else
        {
            return Ok();
        }
    }

    [HttpGet]
    public override async Task<ActionResult<Survey>> GetAll()
    {
        var Base = await _BaseRepository.GetAll();
        string userName = _httpContextAccessor.HttpContext.User.Identity.Name.Replace(DOMAIN_NAME, "");
        Users user = await _usersRepository.GetSingleObject(s => s.username == userName);
        Employee employee = await _employeeRepository.GetSingleObject(s => s.AccountName == user.username);
        if (user != null)
        {
            if (SUPER_USER.Contains(user.username))
            {
                return Ok(Base);
            }
            else
            {
                UserRoles userRole = await _userRolesRepository.GetSingleObject(s => s.UserId == user.Id);
                Roles roles = await _rolesRepository.GetSingleObject(s => s.Id == userRole.RoleId);

                if (roles.RoleName == USER_APP || roles.RoleName == CHECKER_APP)
                {
                    List<Survey> grantSurveys = new List<Survey>();
                    grantSurveys.AddRange(Base.Where(w => w.GrantSurvey.Contains(user.Id.ToString())));
                    Base = Base.Where(w => w.CreatedBy == userName).ToList();
                    Base.AddRange(grantSurveys);
                }

                if (roles.RoleName == MANAGER_APP || roles.RoleName == APPROVER_APP)
                {
                    List<Survey> grantSurveys = new List<Survey>();
                    Base = Base.Where(w => w.AreaId == employee.AreaId).ToList();
                    grantSurveys.AddRange(Base.Where(w => w.GrantSurvey.Contains(user.Id.ToString())));
                    Base.AddRange(grantSurveys);
                }

                if (Base == null)
                {
                    return NotFound();
                }

                return Ok(Base);
            }
        }
        return Ok();
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> ApproveSurvey(int id)
    {
        MailConfig emailSettings = configuration.GetSection("Email").Get<MailConfig>();
        StepsWorkflow stepsWorkflow = new StepsWorkflow();
        MailTemplate flowMailTemplate = new MailTemplate();
        List<FileEncrypt> fileEncrypts = new List<FileEncrypt>();
        fileEncrypts = await _fileEncryptRepository.GetAllInclude();





        MailTemplate notifyMailTemplate = new MailTemplate();
        Survey survey = new Survey();
        survey = await _BaseRepository.GetSingleObjectFullInclude(s => s.Id == id, i => i.PDFAttachmentFK);

        //Employee CCstaff = new Employee();
        //CCstaff = await _employeeRepository.GetSingleObject(f => f.AccountName == );


        stepsWorkflow = await GetWF(survey);

        InstanceWorkflow instanceWorkflow = new InstanceWorkflow();
        if (survey.InstanceWorkflowFK != null)
            instanceWorkflow = survey.InstanceWorkflowFK;
        if (stepsWorkflow == null) return Ok();
        if (stepsWorkflow.Steps == 4 || stepsWorkflow.Steps == 1) return Ok();
        if (stepsWorkflow.Steps == 3 || instanceWorkflow.RuleNo == 1) stepsWorkflow.Steps = 4;
        flowMailTemplate = stepsWorkflow.FlowMailTemplateFK;
        notifyMailTemplate = stepsWorkflow.NotifyMailTemplateFK;
        long currentWorkflowStatusId = survey.InstanceWorkflowFK?.WorkflowStatusId ?? 0;
        var surveyWorkStatus = await _enumDataRepository.EnumData(typeof(Survey).Name);
        survey.ApprovalDate = DateTime.Now;
        FileEncrypt fileEncrypt = new FileEncrypt();
        fileEncrypt = fileEncrypts.FirstOrDefault(f => f.AttributeId == survey.AreaId);
        if (fileEncrypt != null)
        {
            if (instanceWorkflow.CurrentStep == 3 || (instanceWorkflow.CurrentStep == 2 && instanceWorkflow.RuleNo == 1))
            {
                Client client = new Client();
                //string clientCode = survey.ClientCode;
                long? clientId = survey.ClientId;
                if (clientId != 0)
                {
                    client = await _clientRepository.GetSingleObject(s => s.Id == clientId);
                    Location location = new Location();
                    long locationId = survey.LocationId ?? 0;
                    location = await _locationRepository.GetSingleObject(s => s.Id == locationId);

                    string processedPath = Util.CopyApprovedSurvey(survey, client, location, fileEncrypt, BLOB_PATH, APPROVED_KEYWORD, SUFFIX_APPROVED_KEYWORD);
                    if (!string.IsNullOrEmpty(processedPath))
                    {
                        Attachment attachment = new Attachment();
                        attachment = survey.PDFAttachmentFK;
                        attachment.SubDirectory = processedPath;
                        survey.PDFAttachmentFK = await _attachmentRepository.UpdateData(attachment, JsonConvert.SerializeObject(attachment), attachment.Id, "Id");
                    }
                    await _BaseRepository.UpdateData(survey, JsonConvert.SerializeObject(survey), id, "Id");
                    survey = await _BaseRepository.GetSingleObjectFullInclude(s => s.Id == survey.Id);
                    survey = await _BaseRepository.IncludeSpecificField(survey, "PDF", s => s.PDFAttachmentFK);
                }
            }

            await ControllerHelper.WFChangeStatus(_instanceWorkFlowRepository, survey, instanceWorkflow, stepsWorkflow.PositiveStatusId, "Up");
            stepsWorkflow = await GetWF(survey);

            if (stepsWorkflow != null)
                if (stepsWorkflow.Steps == 3 || instanceWorkflow.RuleNo == 1) stepsWorkflow.Steps = 4;

            if (instanceWorkflow.RuleNo == 2)
                await ControllerHelper.ConvertRuleSurvey(_instanceWorkFlowRepository, _userWorkFlowRepository, instanceWorkflow.UserWorkflowFK.CheckerUsersId, instanceWorkflow);


            string usersCCEmails = await ControllerHelper.GetEmailFromUserAccount(survey.CCSiteAccount, _employeeRepository);

            Employee staff = new Employee();
            staff = await _employeeRepository.GetSingleObject(f => f.AccountName == survey.CreatedBy);
            if (staff != null)
            {
                if (survey.InstanceWorkflowFK.UserWorkflowFK != null)
                {
                    Users notifyUser = new Users();
                    Users flowUser = new Users();
                    if (stepsWorkflow != null || survey.InstanceWorkflowFK.RuleNo == 1)
                    {
                        notifyUser = survey.InstanceWorkflowFK.UserWorkflowFK.UsersFK;
                        flowUser = survey.InstanceWorkflowFK.UserWorkflowFK.ApproverUsersFK;
                    }
                    else
                    {
                        notifyUser = survey.InstanceWorkflowFK.UserWorkflowFK.UsersFK;
                    }
                    if (notifyMailTemplate != null)
                    {
                        DataTable query = DataUtil.ExecuteSelectQuery(_BaseRepository._connectionString, notifyMailTemplate.MailQuery, ("@SurveyId", survey.Id));
                        if (query != null)
                        {
                            Dictionary<string, object> notifyDictionaryData = MakeQueryIntoDirectory(query.Rows[0]);
                            if (notifyUser != null && notifyMailTemplate != null)
                            {

                                //MailQueue mailQueue = Util.NotifySession(staff, notifyUser, notifyMailTemplate, emailSettings, notifyDictionaryData, FOLLOW_CC);
                                MailQueue mailQueue = Util.NotifySession(staff, notifyUser, notifyMailTemplate, emailSettings, notifyDictionaryData, Util.CCAllEmail(emailSettings.FollowCC, usersCCEmails));
                                if (mailQueue != null)
                                {
                                    _mailQueueRepository.InsertData(mailQueue);
                                }
                            }
                        }
                    }
                    if (flowMailTemplate != null)
                    {
                        DataTable query = DataUtil.ExecuteSelectQuery(_BaseRepository._connectionString, flowMailTemplate.MailQuery, ("@SurveyId", survey.Id));
                        if (query != null)
                        {
                            Dictionary<string, object> flowDictionaryData = MakeQueryIntoDirectory(query.Rows[0]);
                            if (flowUser != null && flowMailTemplate != null)
                            {
                                if (stepsWorkflow != null && stepsWorkflow.Steps < 4)
                                {
                                    UrlCall urlCall = new UrlCall();
                                    urlCall = await _urlCallRepository.GetSingleObject(s => s.RecordGuidId == survey.Guid);
                                    if (urlCall != null)
                                    {
                                        //string redirectMainView = System.IO.Path.Combine(REDIRECT_MAIN_VIEW, typeof(UrlCall).Name, "ReturnView");
                                        string redirectMainView = $"{REDIRECT_MAIN_VIEW}{typeof(UrlCall).Name}{"/ReturnView"}";
                                        redirectMainView += $"?guid={urlCall.Guid}";
                                        flowDictionaryData.Add($"@@urlCallView", redirectMainView);
                                    }

                                    MailQueue mailQueue = Util.NotifySession(staff, flowUser, flowMailTemplate, emailSettings, flowDictionaryData, Util.CCAllEmail(emailSettings.FollowCC, usersCCEmails));
                                    {
                                        _mailQueueRepository.InsertData(mailQueue);
                                    }
                                    Users owner = new Users();
                                    string surveyByName = survey.SurveyedByAccountName;
                                    owner = await _usersRepository.GetSingleObject(s => s.username == surveyByName);
                                    survey.OwnerReport = owner != null ? owner.username : "";
                                    survey = await _BaseRepository.UpdateData(survey, JsonConvert.SerializeObject(survey), survey.Id, "Id");
                                }
                                else
                                {
                                    Users endFlowUser = new Users();
                                    string staffAccount = survey.OwnerReport;
                                    endFlowUser = await _usersRepository.GetSingleObject(s => s.username == staffAccount);
                                    //flowMailTemplate.To = staff.Email;
                                    flowMailTemplate.To = endFlowUser.mail;
                                    List<string> attachments = new List<string>();
                                    attachments.Add(Path.Combine(GRANTEDSURVEY_PATH, survey.PDFAttachmentFK.SubDirectory.Replace(".pdf", $"{SUFFIX_APPROVED_KEYWORD}.pdf")));
                                    MailQueue mailQueue = new MailQueue();
                                    if (survey.InstanceWorkflowFK.RuleNo == 1)
                                        //mailQueue = Util.NotifySession(staff, notifyUser, flowMailTemplate, emailSettings, flowDictionaryData, FOLLOW_CC, attachments);
                                        mailQueue = Util.NotifySession(staff, notifyUser, flowMailTemplate, emailSettings, flowDictionaryData,Util.CCAllEmail(emailSettings.FollowCC, usersCCEmails), attachments);
                                    else
                                        //mailQueue = Util.NotifySession(staff, flowUser, flowMailTemplate, emailSettings, flowDictionaryData, FOLLOW_CC, attachments);
                                        mailQueue = Util.NotifySession(staff, flowUser, flowMailTemplate, emailSettings, flowDictionaryData,Util.CCAllEmail(emailSettings.FollowCC, usersCCEmails), attachments);
                                    if (mailQueue != null)
                                    {
                                        _mailQueueRepository.InsertData(mailQueue);
                                    }
                                }
                            }
                        }
                    }
                }
            }
            SurveyWorkflowHistory surveyWorkflowHistory = new SurveyWorkflowHistory();
            surveyWorkflowHistory = Util.LogWorkflow(survey, currentWorkflowStatusId, survey.InstanceWorkflowFK?.WorkflowStatusId ?? 0, CURRENT_USER, "");
            _surveyWorkflowHistoryRepository.InsertData(surveyWorkflowHistory);
        }
        return Ok();
    }
    [HttpGet("{id}")]
    public async Task<IActionResult> RejectSurvey(int id)
    {
        MailConfig emailSettings = configuration.GetSection("Email").Get<MailConfig>();
        StepsWorkflow stepsWorkflow = new StepsWorkflow();
        MailTemplate flowMailTemplate = new MailTemplate();

        MailTemplate notifyMailTemplate = new MailTemplate();
        Survey survey = new Survey();
        survey = await _BaseRepository.GetSingleObjectFullInclude(s => s.Id == id);
        stepsWorkflow = await GetWF(survey);

        InstanceWorkflow instanceWorkflow = new InstanceWorkflow();
        if (survey.InstanceWorkflowFK != null)
            instanceWorkflow = survey.InstanceWorkflowFK;

        if (stepsWorkflow.Steps == 4 || stepsWorkflow.Steps == 1) return Ok();
        notifyMailTemplate = await _mailTemplateRepository.GetSingleObjectFullInclude(s => s.Id == notifyMailTemplate.Id);
        notifyMailTemplate = stepsWorkflow.ReturnMailTemplateFK;
        long currentWorkflowStatusId = survey.WorkflowStatusId ?? 0;
        var surveyWorkStatus = await _enumDataRepository.EnumData(typeof(Survey).Name);
        await _BaseRepository.UpdateData(survey, JsonConvert.SerializeObject(survey), id, "Id");
        survey = await _BaseRepository.GetSingleObjectFullInclude(s => s.Id == survey.Id);
        if (instanceWorkflow.RuleNo == 2)
            await ControllerHelper.WFChangeStatus(_instanceWorkFlowRepository, survey, instanceWorkflow, stepsWorkflow.NegativeStatusId, "Down");
        if (instanceWorkflow.RuleNo == 1)
        {
            await ControllerHelper.WFChangeStatus(_instanceWorkFlowRepository, survey, instanceWorkflow, stepsWorkflow.ReturnId, "Return");
        }
        string usersCCEmails = await ControllerHelper.GetEmailFromUserAccount(survey.CCSiteAccount, _employeeRepository);

        //stepsWorkflow = await GetWF(survey);
        Employee staff = new Employee();
        staff = await _employeeRepository.GetSingleObject(f => f.AccountName == survey.CreatedBy);
        if (staff != null)
        {
            if (instanceWorkflow.UserWorkflowFK != null)
            {
                Users notifyUser = new Users();
                if (stepsWorkflow.Steps == 3)
                {
                    notifyUser = instanceWorkflow.UserWorkflowFK.CheckerUsersFK;
                }
                if (stepsWorkflow.Steps == 2)
                {
                    notifyUser = instanceWorkflow.UserWorkflowFK.UsersFK;
                }
                if (instanceWorkflow.RuleNo == 1)
                {
                    notifyUser = instanceWorkflow.UserWorkflowFK.UsersFK;
                }
                if (notifyMailTemplate != null)
                {
                    DataTable query = DataUtil.ExecuteSelectQuery(_BaseRepository._connectionString, notifyMailTemplate.MailQuery, ("@SurveyId", survey.Id));
                    if (query != null)
                    {
                        Dictionary<string, object> notifyDictionaryData = MakeQueryIntoDirectory(query.Rows[0]);
                        if (notifyUser != null && notifyMailTemplate != null)
                        {
                            //MailQueue mailQueue = Util.NotifySession(staff, notifyUser, notifyMailTemplate, emailSettings, notifyDictionaryData, FOLLOW_CC);
                            MailQueue mailQueue = Util.NotifySession(staff, notifyUser, notifyMailTemplate, emailSettings, notifyDictionaryData, Util.CCAllEmail(emailSettings.FollowCC, usersCCEmails));
                            if (mailQueue != null)
                            {
                                _mailQueueRepository.InsertData(mailQueue);
                            }
                        }
                    }
                }
            }
        }
        SurveyWorkflowHistory surveyWorkflowHistory = new SurveyWorkflowHistory();
        surveyWorkflowHistory = Util.LogWorkflow(survey, currentWorkflowStatusId, survey.WorkflowStatusId ?? 0, CURRENT_USER, "");
        _surveyWorkflowHistoryRepository.InsertData(surveyWorkflowHistory);
        return Ok();
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> DownloadPDF(int id)
    {
        var stream = new MemoryStream(); //  cứ xem là 1 đường dẫn 
        Survey survey = new Survey();
        survey = await _BaseRepository.GetObjectByIdAsync((int)id);

        string pdfPath = System.IO.Path.Combine(optionsMonitor.CurrentValue.Path, nameof(Survey), $"{survey.SurveyNo}.pdf");
        bool isExists = await _attachmentRepository.RecordExistsAsync<Attachment>("FileName", (object)$"{survey.SurveyNo}.pdf");
        if (isExists)
        {
            using (var fileStream = new FileStream(pdfPath, FileMode.Open, FileAccess.Read))
            {
                await fileStream.CopyToAsync(stream);
            }
            stream.Seek(0, SeekOrigin.Begin);
            return File(stream, "application/pdf", $"{survey.SurveyNo}.pdf");

            //using (var zipStream = new MemoryStream())
            //{
            //    // Tạo file ZIP
            //    using (var archive = new ZipArchive(zipStream, ZipArchiveMode.Create, true))
            //    {
            //        // Thêm file PDF vào ZIP
            //        var zipEntry = archive.CreateEntry($"{survey.SurveyNo}.pdf", CompressionLevel.Fastest);
            //        using (var zipEntryStream = zipEntry.Open())
            //        using (var fileStream = new FileStream(pdfPath, FileMode.Open, FileAccess.Read))
            //        {
            //            await fileStream.CopyToAsync(zipEntryStream);
            //        }
            //    }

            //    // Đặt lại vị trí của stream để bắt đầu từ đầu
            //    zipStream.Seek(0, SeekOrigin.Begin);

            //    // Trả file ZIP về trình duyệt
            //    return File(zipStream.ToArray(), "application/zip", $"{survey.SurveyNo}.zip");
            //}
        }
        return Ok();
    }

    //[HttpGet]
    //public async Task<ActionResult> GetTemplate()
    //{
    //    var stream = new MemoryStream(); //  cứ xem là 1 đường dẫn

    //    if (!System.IO.File.Exists(PATH_TEMPLATE))
    //    {
    //        return NotFound("File không tồn tại.");
    //    }

    //    // Đọc file DOCX vào MemoryStream
    //    using (var fileStream = new FileStream(PATH_TEMPLATE, FileMode.Open, FileAccess.Read))
    //    {
    //        using (var memoryStream = new MemoryStream())
    //        {
    //            // Sao chép nội dung từ FileStream vào MemoryStream
    //            await fileStream.CopyToAsync(memoryStream);

    //            // Đặt vị trí stream về đầu để gửi
    //            memoryStream.Seek(0, SeekOrigin.Begin);

    //            // Trả file .docx dưới dạng response
    //            return File(memoryStream.ToArray(), "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "template.docx");
    //        }
    //    }
    //}

    [HttpGet("{surveyId}")]
    public async Task<IActionResult> ResetWorkflow(long surveyId)
    {
        Survey survey = new Survey();
        survey = await _BaseRepository.GetSingleObjectFullInclude(s => s.Id == surveyId, i => i.PDFAttachmentFK);
        InstanceWorkflow instanceWorkflow = new InstanceWorkflow();
        instanceWorkflow = await _instanceWorkFlowRepository.GetSingleObjectFullInclude(s => s.RecordGuid == survey.Guid);
        await _instanceWorkFlowRepository.DeleteData(instanceWorkflow, instanceWorkflow.Id,"Id", true);
        Attachment attachment = new Attachment();
        attachment = survey.PDFAttachmentFK;
        attachment.SubDirectory = Path.Combine(nameof(Survey), survey.SurveyNo + ".pdf");
        survey.PDFAttachmentFK = await _attachmentRepository.UpdateData(attachment, JsonConvert.SerializeObject(attachment), attachment.Id, "Id");
        return Ok();
    }

    #endregion

    #region HttpPost

    [HttpPost]
    public override async Task<object> ExecuteCustomQuery([FromBody] string query)
    {
        var Base = await _BaseRepository.ExecuteCustomQuery(query);
        // Lấy thông tin User hiện tại
        string userName = _httpContextAccessor.HttpContext.User.Identity.Name.Replace(DOMAIN_NAME, "");
        Users user = await _usersRepository.GetSingleObject(s => s.username == userName);
        Employee employee = await _employeeRepository.GetSingleObject(s => s.AccountName == userName);

        if (user == null)
        {
            return NotFound("User not found.");
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
            var grantSurveys = Base.Where(w =>
                w.ContainsKey("grantSurvey") && w["grantSurvey"]?.ToString()?.Contains(user.Id.ToString()) == true
            ).ToList();
            //submit by another
            var checkingSurveys = Base.Where(w =>
               w.ContainsKey("workflowStatus") && w["workflowStatus"] != null
                 &&
               w.ContainsKey("areaId") && (long?)w["areaId"] == empArea &&
               w.ContainsKey("surveyedByAccountName") && w["surveyedByAccountName"]?.ToString() == surveyedByAccountName
               && w.ContainsKey("ownerReport") && w["ownerReport"]?.ToString() == userName
           ).ToList();

            filteredBase = Base
                .Where(w => w.ContainsKey("createdBy") && w["createdBy"]?.ToString() == userName)
                .ToList();


            existingIds = filteredBase
                .Where(x => x.ContainsKey("id") && x["id"] != null)
                .Select(x => x["id"])
                .ToHashSet(); // sử dụng HashSet để lookup nhanh
            var newCheckingSurveys = checkingSurveys
            .Where(x => x.ContainsKey("id") && x["id"] != null && !existingIds.Contains(x["id"]))
            .ToList();

            filteredBase.AddRange(grantSurveys);
            filteredBase.AddRange(newCheckingSurveys);
        }
        else if (roles.RoleName == MANAGER_APP)
        {
            var grantSurveys = Base.Where(w =>
                w.ContainsKey("grantSurvey") && w["grantSurvey"]?.ToString()?.Contains(user.Id.ToString()) == true
            ).ToList();

            filteredBase = Base
                .Where(w =>
                    w.ContainsKey("areaId") &&
                    w["areaId"] != null &&
                    Convert.ToInt32(w["areaId"]) == employee.AreaId
                )
                .ToList();

            filteredBase.AddRange(grantSurveys);
        }
        else if (roles.RoleName == APPROVER_APP)
        {
            filteredBase.AddRange(Base);
        }

        return filteredBase;
    }


    [HttpPost]
    public async Task<IActionResult> AddCustomOutline([FromBody] SurveyCustomOutline surveyData)
    {// Use blog settings while override this method instead
        Outline checkParentOutline = new Outline();
        DynamicOutline dynamicOutline = new DynamicOutline();
        if (surveyData.Outline.ParentId != null)
        {
            checkParentOutline = await _outlineRepository.GetObjectByIdAsync((long)surveyData.Outline.ParentId);
        }


        if (checkParentOutline != null)
        {
            OutlineDynamic outlineDynamic = new OutlineDynamic();
            outlineDynamic = JsonConvert.DeserializeObject<OutlineDynamic>(JsonConvert.SerializeObject(surveyData.Outline));

            List<OutlineDynamic> outlineDynamics = new List<OutlineDynamic>();
            string dataField = Util.GenerateDataField(surveyData.Outline.Content);

            outlineDynamics = await _outlineDynamicRepository.GetListObject(l => l.PlaceHolder.Contains(dataField));

            string outputDataField = Util.GenerateDataField(surveyData.Outline.Content, outlineDynamics);

            DataGridConfig gridConfig = new DataGridConfig();
            gridConfig.DataField = outputDataField;
            gridConfig.DataType = "string";
            gridConfig.FormDataType = "dxHtmlEditor";

            DataGridConfigDynamic dynamicConfig = new DataGridConfigDynamic();
            dynamicConfig.DataField = outputDataField;
            dynamicConfig.DataType = "string";
            dynamicConfig.FormDataType = "dxHtmlEditor";

            dynamicConfig = await _dataGridConfigDynamicRepository.InsertData(dynamicConfig);

            gridConfig = JsonConvert.DeserializeObject<DataGridConfig>(JsonConvert.SerializeObject(dynamicConfig));
            outlineDynamic.PlaceHolder = gridConfig.DataField ?? "";
            outlineDynamic = await _outlineDynamicRepository.InsertData(outlineDynamic);


            SurveyOutlineOptions surveyOutlineOptions = new SurveyOutlineOptions();
            surveyOutlineOptions.SurveyId = surveyData.Survey.Id;
            surveyOutlineOptions.OutlineId = outlineDynamic.Id;
            surveyOutlineOptions.OptionValue = 1; // -1 N/A 0 No 1 Yes
            surveyOutlineOptions.Placeholder = outputDataField;
            surveyOutlineOptions.MainEnable = false;
            await _surveyOutlineOptionsRepository.InsertData(surveyOutlineOptions);
            string checkParent = checkParentOutline.PlaceHolder.ToLower(); //checkParentOutline.Content.Replace(" ", "");
            if (checkParent == typeof(Management).Name.ToLower())
            {

                Management management = await _managementRepository.GetObjectByIdAsync((long)surveyData.MasterId);
                ControllerHelper.DynamicOutlineObjectHandle(outputDataField, dynamicOutline, surveyData, outlineDynamic, gridConfig, surveyOutlineOptions);

                List<DynamicOutline> listDynamicOutlines = new List<DynamicOutline>();
                if (management.AdditionalOutline == null)
                {
                    listDynamicOutlines.Add(dynamicOutline);
                    management.AdditionalOutline = Util.ConvertObjectToByteArray(listDynamicOutlines);
                }
                else
                {
                    listDynamicOutlines.AddRange(JsonConvert.DeserializeObject<List<DynamicOutline>>(Encoding.UTF8.GetString(management.AdditionalOutline)));
                    if (!listDynamicOutlines.Any(a => a.Content == surveyData.Outline.Content))
                        listDynamicOutlines.Add(dynamicOutline);
                    management.AdditionalOutline = Util.ConvertObjectToByteArray(listDynamicOutlines);
                }
                management = await _managementRepository.UpdateData(management, JsonConvert.SerializeObject(management), management.Id, "Id");
            }
            if (checkParent == typeof(Construction).Name.ToLower())
            {
                Construction construction = await _constructionRepository.GetObjectByIdAsync((long)surveyData.MasterId);
                ControllerHelper.DynamicOutlineObjectHandle(outputDataField, dynamicOutline, surveyData, outlineDynamic, gridConfig, surveyOutlineOptions);

                List<DynamicOutline> listDynamicOutlines = new List<DynamicOutline>();
                if (construction.AdditionalOutline == null)
                {
                    listDynamicOutlines.Add(dynamicOutline);
                    construction.AdditionalOutline = Util.ConvertObjectToByteArray(listDynamicOutlines);
                }
                else
                {
                    listDynamicOutlines.AddRange(JsonConvert.DeserializeObject<List<DynamicOutline>>(Encoding.UTF8.GetString(construction.AdditionalOutline)));
                    if (!listDynamicOutlines.Any(a => a.Content == surveyData.Outline.Content))
                        listDynamicOutlines.Add(dynamicOutline);
                    construction.AdditionalOutline = Util.ConvertObjectToByteArray(listDynamicOutlines);
                }
                construction = await _constructionRepository.UpdateData(construction, JsonConvert.SerializeObject(construction), construction.Id, "Id");
            }
            if (checkParent == typeof(OtherExposures).Name.ToLower())
            {
                OtherExposures otherExposures = await _otherExposuresRepository.GetObjectByIdAsync((long)surveyData.MasterId);
                ControllerHelper.DynamicOutlineObjectHandle(outputDataField, dynamicOutline, surveyData, outlineDynamic, gridConfig, surveyOutlineOptions);

                List<DynamicOutline> listDynamicOutlines = new List<DynamicOutline>();
                if (otherExposures.AdditionalOutline == null)
                {
                    listDynamicOutlines.Add(dynamicOutline);
                    otherExposures.AdditionalOutline = Util.ConvertObjectToByteArray(listDynamicOutlines);
                }
                else
                {
                    listDynamicOutlines.AddRange(JsonConvert.DeserializeObject<List<DynamicOutline>>(Encoding.UTF8.GetString(otherExposures.AdditionalOutline)));
                    if (!listDynamicOutlines.Any(a => a.Content == surveyData.Outline.Content))
                        listDynamicOutlines.Add(dynamicOutline);
                    otherExposures.AdditionalOutline = Util.ConvertObjectToByteArray(listDynamicOutlines);
                }
                otherExposures = await _otherExposuresRepository.UpdateData(otherExposures, JsonConvert.SerializeObject(otherExposures), otherExposures.Id, "Id");
            }
            if (checkParent == typeof(Protection).Name.ToLower())
            {
                Protection protection = await _protectionRepository.GetObjectByIdAsync((long)surveyData.MasterId);
                ControllerHelper.DynamicOutlineObjectHandle(outputDataField, dynamicOutline, surveyData, outlineDynamic, gridConfig, surveyOutlineOptions);

                List<DynamicOutline> listDynamicOutlines = new List<DynamicOutline>();
                if (protection.AdditionalOutline == null)
                {
                    listDynamicOutlines.Add(dynamicOutline);
                    protection.AdditionalOutline = Util.ConvertObjectToByteArray(listDynamicOutlines);
                }
                else
                {
                    listDynamicOutlines.AddRange(JsonConvert.DeserializeObject<List<DynamicOutline>>(Encoding.UTF8.GetString(protection.AdditionalOutline)));
                    if (!listDynamicOutlines.Any(a => a.Content == surveyData.Outline.Content))
                        listDynamicOutlines.Add(dynamicOutline);
                    protection.AdditionalOutline = Util.ConvertObjectToByteArray(listDynamicOutlines);
                }
                protection = await _protectionRepository.UpdateData(protection, JsonConvert.SerializeObject(protection), protection.Id, "Id");
            }
            if (checkParent == typeof(ExtFireExpExposures).Name.ToLower())
            {
                ExtFireExpExposures extFireExpExposures = await _extFireExpExposuresRepository.GetObjectByIdAsync((long)surveyData.MasterId);
                ControllerHelper.DynamicOutlineObjectHandle(outputDataField, dynamicOutline, surveyData, outlineDynamic, gridConfig, surveyOutlineOptions);

                List<DynamicOutline> listDynamicOutlines = new List<DynamicOutline>();
                if (extFireExpExposures.AdditionalOutline == null)
                {
                    listDynamicOutlines.Add(dynamicOutline);
                    extFireExpExposures.AdditionalOutline = Util.ConvertObjectToByteArray(listDynamicOutlines);
                }
                else
                {
                    listDynamicOutlines.AddRange(JsonConvert.DeserializeObject<List<DynamicOutline>>(Encoding.UTF8.GetString(extFireExpExposures.AdditionalOutline)));
                    if (!listDynamicOutlines.Any(a => a.Content == surveyData.Outline.Content))
                        listDynamicOutlines.Add(dynamicOutline);
                    extFireExpExposures.AdditionalOutline = Util.ConvertObjectToByteArray(listDynamicOutlines);
                }
                extFireExpExposures = await _extFireExpExposuresRepository.UpdateData(extFireExpExposures, JsonConvert.SerializeObject(extFireExpExposures), extFireExpExposures.Id, "Id");
            }
            if (checkParent == typeof(Occupancy).Name.ToLower())
            {
                Wording wording = new Wording();

                wording = await _wordingRepository.GetSingleObject(s => s.WordingName == "PowerUtilities");

                HtmlDocument htmldocument = new HtmlDocument();
                htmldocument = Util.TableHTMLRemake(wording.WordingContent);
                wording.WordingContent = htmldocument.DocumentNode.OuterHtml;
                Occupancy occupancy = await _occupancyRepository.GetObjectByIdAsync((long)surveyData.MasterId);

                ControllerHelper.DynamicOutlineObjectHandle(outputDataField, dynamicOutline, surveyData, outlineDynamic, gridConfig, surveyOutlineOptions);
                List<DynamicOutline> listDynamicOutlines = new List<DynamicOutline>();
                if (occupancy.AdditionalOutline == null)
                {
                    listDynamicOutlines.Add(dynamicOutline);
                    occupancy.AdditionalOutline = Util.ConvertObjectToByteArray(listDynamicOutlines);
                }
                else
                {
                    listDynamicOutlines.AddRange(JsonConvert.DeserializeObject<List<DynamicOutline>>(Encoding.UTF8.GetString(occupancy.AdditionalOutline)));
                    if (!listDynamicOutlines.Any(a => a.Content == surveyData.Outline.Content))
                    {
                        dynamicOutline.Content = wording.WordingContent;
                        listDynamicOutlines.Add(dynamicOutline);

                    }
                    occupancy.AdditionalOutline = Util.ConvertObjectToByteArray(listDynamicOutlines);
                }
                occupancy = await _occupancyRepository.UpdateData(occupancy, JsonConvert.SerializeObject(occupancy), occupancy.Id, "Id");

            }

        }
        return Ok();
    }


    [HttpPost]
    public async Task<IActionResult> RenameCustomOutline([FromBody] SurveyCustomOutline surveyData)
    {// Use blog settings while override this method instead
        Outline checkParentOutline = new Outline();
        DynamicOutline dynamicOutline = new DynamicOutline();
        if (surveyData.Outline.ParentId != null)
        {
            checkParentOutline = await _outlineRepository.GetObjectByIdAsync((long)surveyData.Outline.ParentId);
        }


        if (checkParentOutline != null)
        {
            OutlineDynamic outlineDynamic = new OutlineDynamic();
            string placeholder = surveyData.Outline.PlaceHolder;
            outlineDynamic = await _outlineDynamicRepository.GetSingleObject(s => s.PlaceHolder == placeholder);

            outlineDynamic.Content = surveyData.Outline.Content;
            outlineDynamic = await _outlineDynamicRepository.UpdateData(outlineDynamic, JsonConvert.SerializeObject(outlineDynamic), outlineDynamic.Id, "Id");
            string checkParent = checkParentOutline.Content.Replace(" ", "");
            if (checkParent == typeof(Management).Name.ToUpper())
            {

                Management management = await _managementRepository.GetObjectByIdAsync((long)surveyData.MasterId);

                List<DynamicOutline> listDynamicOutlines = new List<DynamicOutline>();
                listDynamicOutlines.AddRange(JsonConvert.DeserializeObject<List<DynamicOutline>>(Encoding.UTF8.GetString(management.AdditionalOutline)));
                if (listDynamicOutlines.Any(a => a.OutlineDynamic.PlaceHolder == surveyData.Outline.PlaceHolder))
                {
                    DynamicOutline dynamicOutlineCheck = new DynamicOutline();
                    dynamicOutlineCheck = listDynamicOutlines.FirstOrDefault(a => a.OutlineDynamic.PlaceHolder == surveyData.Outline.PlaceHolder);
                    listDynamicOutlines.Remove(dynamicOutlineCheck);
                    dynamicOutlineCheck.Outline.Content = surveyData.Outline.Content;
                    dynamicOutlineCheck.OutlineDynamic.Content = surveyData.Outline.Content;
                    listDynamicOutlines.Add(dynamicOutlineCheck);
                    management.AdditionalOutline = Util.ConvertObjectToByteArray(listDynamicOutlines);
                    management = await _managementRepository.UpdateData(management, JsonConvert.SerializeObject(management), management.Id, "Id");
                }
            }
            if (checkParent == typeof(Construction).Name.ToUpper())
            {
                Construction construction = await _constructionRepository.GetObjectByIdAsync((long)surveyData.MasterId);

                List<DynamicOutline> listDynamicOutlines = new List<DynamicOutline>();
                listDynamicOutlines.AddRange(JsonConvert.DeserializeObject<List<DynamicOutline>>(Encoding.UTF8.GetString(construction.AdditionalOutline)));
                if (listDynamicOutlines.Any(a => a.OutlineDynamic.PlaceHolder == surveyData.Outline.PlaceHolder))
                {
                    DynamicOutline dynamicOutlineCheck = new DynamicOutline();
                    dynamicOutlineCheck = listDynamicOutlines.FirstOrDefault(a => a.OutlineDynamic.PlaceHolder == surveyData.Outline.PlaceHolder);
                    listDynamicOutlines.Remove(dynamicOutlineCheck);
                    dynamicOutlineCheck.Outline.Content = surveyData.Outline.Content;
                    dynamicOutlineCheck.OutlineDynamic.Content = surveyData.Outline.Content;
                    listDynamicOutlines.Add(dynamicOutlineCheck);
                    construction.AdditionalOutline = Util.ConvertObjectToByteArray(listDynamicOutlines);
                    construction = await _constructionRepository.UpdateData(construction, JsonConvert.SerializeObject(construction), construction.Id, "Id");
                }
            }
            if (checkParent == typeof(OtherExposures).Name.ToUpper())
            {
                OtherExposures otherExposures = await _otherExposuresRepository.GetObjectByIdAsync((long)surveyData.MasterId);

                List<DynamicOutline> listDynamicOutlines = new List<DynamicOutline>();
                listDynamicOutlines.AddRange(JsonConvert.DeserializeObject<List<DynamicOutline>>(Encoding.UTF8.GetString(otherExposures.AdditionalOutline)));
                if (listDynamicOutlines.Any(a => a.OutlineDynamic.PlaceHolder == surveyData.Outline.PlaceHolder))
                {
                    DynamicOutline dynamicOutlineCheck = new DynamicOutline();
                    dynamicOutlineCheck = listDynamicOutlines.FirstOrDefault(a => a.OutlineDynamic.PlaceHolder == surveyData.Outline.PlaceHolder);
                    listDynamicOutlines.Remove(dynamicOutlineCheck);
                    dynamicOutlineCheck.Outline.Content = surveyData.Outline.Content;
                    dynamicOutlineCheck.OutlineDynamic.Content = surveyData.Outline.Content;
                    listDynamicOutlines.Add(dynamicOutlineCheck);
                    otherExposures.AdditionalOutline = Util.ConvertObjectToByteArray(listDynamicOutlines);
                    otherExposures = await _otherExposuresRepository.UpdateData(otherExposures, JsonConvert.SerializeObject(otherExposures), otherExposures.Id, "Id");
                }
            }
            if (checkParent == typeof(Occupancy).Name.ToUpper())
            {
                Occupancy occupancy = await _occupancyRepository.GetObjectByIdAsync((long)surveyData.MasterId);

                List<DynamicOutline> listDynamicOutlines = new List<DynamicOutline>();
                listDynamicOutlines.AddRange(JsonConvert.DeserializeObject<List<DynamicOutline>>(Encoding.UTF8.GetString(occupancy.AdditionalOutline)));
                if (listDynamicOutlines.Any(a => a.OutlineDynamic.PlaceHolder == surveyData.Outline.PlaceHolder))
                {
                    DynamicOutline dynamicOutlineCheck = new DynamicOutline();
                    dynamicOutlineCheck = listDynamicOutlines.FirstOrDefault(a => a.OutlineDynamic.PlaceHolder == surveyData.Outline.PlaceHolder);
                    listDynamicOutlines.Remove(dynamicOutlineCheck);
                    dynamicOutlineCheck.Outline.Content = surveyData.Outline.Content;
                    dynamicOutlineCheck.OutlineDynamic.Content = surveyData.Outline.Content;
                    listDynamicOutlines.Add(dynamicOutlineCheck);
                    occupancy.AdditionalOutline = Util.ConvertObjectToByteArray(listDynamicOutlines);
                    occupancy = await _occupancyRepository.UpdateData(occupancy, JsonConvert.SerializeObject(occupancy), occupancy.Id, "Id");
                }
            }
        }
        return Ok();
    }

    [HttpPost]
    public async Task<IActionResult> UpdateOverviewPicture(string folder, int surveyId, int outlineId)
    {// Use blog settings while override this method instead
        //var path = _BaseRepository._baseConfiguration.GetSection("BlobStorage:Path");
        IBaseRepository<Attachment> _attachmentRepository = new BaseRepository<Attachment>(_BaseRepository._baseConfiguration, _httpContextAccessor);
        IFormFileCollection files = null;
        files = ((FormCollection)(Request.Form)).Files;

        IFormFile file = null;
        file = files.FirstOrDefault();
        if (file != null && file.Length > 0)
        {
            using (var ms = new MemoryStream())
            {
                file.CopyTo(ms);
                var fileBytes = ms.ToArray();
                var unixMilliseconds = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
                string s = Convert.ToBase64String(fileBytes);
                if (!System.IO.Directory.Exists(BLOB_PATH))
                    Directory.CreateDirectory(BLOB_PATH);
                if (!System.IO.Directory.Exists(Path.Combine(BLOB_PATH, folder)))
                    Directory.CreateDirectory(Path.Combine(BLOB_PATH, folder));

                Attachment attachment = new Attachment();
                AttachmentRequest attachmentRequest = new AttachmentRequest();
                attachmentRequest.surveyId = surveyId;
                attachmentRequest.outlineId = outlineId;
                attachment = Util.BindingAttachment(BLOB_PATH, folder, file.FileName, fileBytes, attachmentRequest);
                attachment = await _attachmentRepository.InsertData(attachment);

                //System.IO.File.WriteAllBytes(Path.Combine(path.Value, folder, $"{unixMilliseconds}_{file.FileName}"), fileBytes);

                SitePictures sitePictures = new SitePictures();
                sitePictures.AttachmentId = attachment.Id;
                sitePictures.SurveyId = surveyId;
                sitePictures = await _sitePicturesRepository.InsertData(sitePictures);

                Survey survey = new Survey();
                survey = await _BaseRepository.GetObjectByIdAsync((int)surveyId);
                survey.OverViewAttachmentId = attachment.Id;
                _BaseRepository.UpdateData(survey, JsonConvert.SerializeObject(survey), surveyId, "Id");

                return Ok(new { success = true, message = "File uploaded successfully", attachment = attachment });
            }
        }
        else
            return Ok(new { success = false, message = "No file uploaded" });
    }




    [HttpPost]
    public async Task<ActionResult> GenerateWord([FromBody] Survey? surveyData)
    {
        var stream = new MemoryStream(); //  cứ xem là 1 đường dẫn 
        Survey survey = new Survey();
        survey = await _BaseRepository.GetSingleObject(s => s.Id == surveyData.Id);
        surveyData = await _BaseRepository.IncludeListsOnly(surveyData);
        var pathExportFile = System.IO.Path.Combine(BLOB_PATH, nameof(Survey), $"{surveyData.SurveyNo}.docx");
        string typeError = "FileNotFound";
        if (System.IO.File.Exists(pathExportFile))
        {
            // Kiểm tra dung lượng file
            if (survey.WordRendered ?? false)
            {
                // Đọc file vào stream
                using (var fileStream = System.IO.File.OpenRead(pathExportFile))
                {
                    await fileStream.CopyToAsync(stream);
                }
            }
            else
            {
                typeError = "FileNotFound";
                Response.Headers.Add("X-Error-Message", $"Please try \"Update Report\" once !");
                Response.Headers.Add("X-Error-Type", typeError);
                return StatusCode(500);
            }
        }
        else
        {
            WordHandleConfig wordHandleConfig = new WordHandleConfig();
            wordHandleConfig.BlobPath = BLOB_PATH;
            wordHandleConfig.MainProcessPathFolder = nameof(Survey);
            //wordHandleConfig.TemplatePath = PATH_TEMPLATE; /// Sửa tại đây
            wordHandleConfig.LabelWordPath = LABEL_WORD_PATH;
            wordHandleConfig.LogoWordPath = LOGO_WORD_PATH;
            wordHandleConfig.NoImagePath = NO_IMAGE;
            //stream = WordHelper.GenerateWord(surveyData, PATH_TEMPLATE, nameof(Survey), BLOB_PATH, _BaseRepository._connectionString, NO_IMAGE);
            stream = WordHelper.GenerateWord(surveyData, wordHandleConfig, _BaseRepository._connectionString);
        }
        stream.Seek(0, SeekOrigin.Begin);
        return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    }


    [HttpPost]
    public async Task<IActionResult> RecallSurvey([FromBody] Survey survey)
    {
        var surveyWorkStatus = await _enumDataRepository.EnumData(typeof(Survey).Name);
        StepsWorkflow stepsWorkflow = new StepsWorkflow();
        //stepsWorkflow = await GetWF(survey, "Down");
        stepsWorkflow = await GetWF(survey);
        long? currentWorkflowStatusId = survey.InstanceWorkflowFK?.WorkflowStatusId;
        long? toWorkflowStatusId = stepsWorkflow.NegativeStatusId;
        //int currentStep = ControllerHelper.DownStep(survey);
        //await WFChangeStatus(survey, currentStep, toWorkflowStatusId, false);
        if (survey.InstanceWorkflowFK.RuleNo == 2)
            await ControllerHelper.WFChangeStatus(_instanceWorkFlowRepository, survey, survey.InstanceWorkflowFK, stepsWorkflow.NegativeStatusId, "Down");
        if (survey.InstanceWorkflowFK.RuleNo == 1)
        {
            await ControllerHelper.WFChangeStatus(_instanceWorkFlowRepository, survey, survey.InstanceWorkflowFK, stepsWorkflow.ReturnId, "Return");
        }
        //ControllerHelper.WFChangeStatus(_instanceWorkFlowRepository, survey, survey.InstanceWorkflowFK, stepsWorkflow.NegativeStatusId, "Down", false);
        Util.LogWorkflow(survey, currentWorkflowStatusId ?? 0, toWorkflowStatusId ?? 0, CURRENT_USER, "");
        return Ok();
    }



    [HttpPost]
    public async Task<IActionResult> SubmitSurvey([FromBody] Survey surveyParams)
    {
        Survey survey = new Survey();
        survey = await _BaseRepository.GetSingleObjectFullInclude(s => s.Id == surveyParams.Id);

        List<StepsWorkflow> stepsWorkflow = new List<StepsWorkflow>();
        stepsWorkflow = await _stepsWorkFlowRepository.GetListObject(s => s.Entity == nameof(Survey));
        stepsWorkflow.ForEach(async f =>
        {
            f = await _stepsWorkFlowRepository.IncludeSpecificField(f, "Flow", i => i.FlowMailTemplateFK);
        });
        MailTemplate mailTemplate = new MailTemplate();
        mailTemplate = stepsWorkflow.FirstOrDefault(w => w.Steps == 1).FlowMailTemplateFK;
        string docPath = System.IO.Path.Combine(optionsMonitor.CurrentValue.Path, nameof(Survey), $"{survey.SurveyNo}.docx");

        var surveyWorkStatus = await _enumDataRepository.EnumData(typeof(Survey).Name);
        long currentWorkflowStatusId = survey.InstanceWorkflowFK?.WorkflowStatusId ?? 0;
        if (System.IO.File.Exists(docPath))
        {
            survey.DueDate = DateTime.Now.AddDays(SURVEY_DUEDATE_PERIOD);
            survey.SubmitDate = DateTime.Now;

            var paramsObject = new
            {
                url = $"/Business/Workflow/SurveyWorkflow_Form/{survey.Id}",
                caption = $"form_SurveyWorkflow_Form_{survey.Id}",
                name = $"SurveyWorkflow {survey.SurveyNo}",
                data = ""
            };

            UrlCall urlCall = new UrlCall();
            urlCall.Folder = "Business";
            urlCall.Module = "Workflow";
            urlCall.Controller = "SurveyWorkflow";
            urlCall.Action = "Index";
            urlCall.TypeAction = "View";
            urlCall.Token = "";
            urlCall.RecordGuidId = survey.Guid;
            urlCall.Params = JsonConvert.SerializeObject(paramsObject);
            urlCall.ExpireTime = DateTime.Now.AddDays(EXPIRE_DAYS);
            urlCall.Expired = false;

            urlCall = await _urlCallRepository.InsertData(urlCall);

            Employee staff = new Employee();
            staff = await _employeeRepository.GetSingleObjectFullInclude(f => f.AccountName == survey.CreatedBy, f => f.SystemRolesFK);

            if (staff != null)
            {
                List<UserWorkflow> userWorkflows = new List<UserWorkflow>();
                userWorkflows = await _userWorkFlowRepository.GetListObjectFullInclude(l => l.UsersId == staff.UsersId, i => i.ApproverUsersFK, i => i.CheckerUsersFK);
                string userNameSurveyedByAccountName = survey.SurveyedByAccountName;
                string surveyCreatedBy = survey.CreatedBy;
                if (userWorkflows.Count > 0)
                {
                    //userWorkflows.ForEach(async userWorkflow =>
                    //{
                    //    userWorkflow = await _userWorkFlowRepository.ObjectSpecificInclude(userWorkflow, f => f.UsersFK);
                    //    userWorkflow = await _userWorkFlowRepository.IncludeSpecificField(userWorkflow, "Checker", f => f.CheckerUsersFK);
                    //    userWorkflow = await _userWorkFlowRepository.IncludeSpecificField(userWorkflow, "Approver", f => f.ApproverUsersFK);
                    //});

                    if (!string.IsNullOrEmpty(userNameSurveyedByAccountName))
                    {

                        Employee empRole = new Employee();
                        empRole = await _employeeRepository.GetSingleObject(f => f.AccountName == surveyCreatedBy);
                        empRole = await _employeeRepository.IncludeSpecificField(empRole, "System", e => e.SystemRolesFK);
                        long checkerId = 0;

                        UserWorkflow ownerFlow = new UserWorkflow();
                        if (empRole.SystemRolesFK.RoleName == USER_APP) // Always 1 records
                        {
                            survey.OwnerReport = survey.CreatedBy;
                            ownerFlow = userWorkflows.FirstOrDefault(f => f.UsersFK.username == userNameSurveyedByAccountName);
                            if (ownerFlow == null)
                            {
                                return Accepted(new
                                {
                                    Status = "warning",
                                    Message = "Engineer workflow not found",
                                    Details = $"Engineer {userNameSurveyedByAccountName} not found in workflow. Please contact admin."
                                });
                            }
                            else
                            {
                                if (ownerFlow.CheckerUsersFK != null)
                                    checkerId = ownerFlow.CheckerUsersFK.Id;
                                else
                                {
                                    if (ownerFlow.UsersFK != null)
                                        checkerId = ownerFlow.ApproverUsersFK.Id; 
                                    else
                                        return Accepted(new
                                        {
                                            Status = "warning",
                                            Message = "Engineer workflow not found",
                                            Details = $"Engineer {userNameSurveyedByAccountName} not found in workflow. Please contact admin."
                                        });
                                }

                            }
                        }

                        if (empRole.SystemRolesFK.RoleName == MANAGER_APP) // Many records
                        {
                            survey.OwnerReport = survey.SurveyedByAccountName;
                            ownerFlow = userWorkflows.FirstOrDefault(f => f.CheckerUsersFK.username == userNameSurveyedByAccountName);
                            if (ownerFlow == null)
                            {
                                return Accepted(new
                                {
                                    Status = "warning",
                                    Message = "Engineer workflow not found",
                                    Details = $"Engineer {userNameSurveyedByAccountName} not found in workflow. Please contact admin."
                                });
                            }
                            else
                                checkerId = ownerFlow.CheckerUsersFK.Id;

                        }


                        if (checkerId != 0)
                        {
                            StepsWorkflow initialStepsWorkflow = new StepsWorkflow();
                            initialStepsWorkflow = stepsWorkflow.FirstOrDefault(f => f.Steps == 1);
                            InstanceWorkflow instanceWorkflow = new InstanceWorkflow();

                            Guid surveyGuid = survey.Guid;
                            instanceWorkflow = await _instanceWorkFlowRepository.GetSingleObject(s => s.RecordGuid == surveyGuid);

                            if (instanceWorkflow == null)
                            {
                                instanceWorkflow = new InstanceWorkflow();
                                instanceWorkflow.RecordGuid = survey.Guid;
                                instanceWorkflow.CurrentStep = 2;
                                instanceWorkflow.WorkflowStatusId = initialStepsWorkflow.PositiveStatusId;
                                instanceWorkflow.UserWorkflowId = ownerFlow.Id;
                                instanceWorkflow.RuleNo = 2;
                                if (staff.SystemRolesFK.RoleName == USER_APP)
                                {
                                    instanceWorkflow.CurrentStep = 3;
                                    initialStepsWorkflow = stepsWorkflow.FirstOrDefault(f => f.Steps == 2);
                                    instanceWorkflow.WorkflowStatusId = initialStepsWorkflow.PositiveStatusId;
                                    instanceWorkflow.RuleNo = 1;
                                    mailTemplate = stepsWorkflow.FirstOrDefault(w => w.Steps == 2).FlowMailTemplateFK;
                                }

                                instanceWorkflow = await _instanceWorkFlowRepository.InsertData(instanceWorkflow);
                            }
                            else
                            {
                                //initialStepsWorkflow = await GetWF(survey, "Up");
                                initialStepsWorkflow = await GetWF(survey);
                                if (initialStepsWorkflow != null)
                                {
                                    //Vì có khi kỹ sư submit lần 2 và flow này đã được convert nên khi ghi nhận tạo survey bởi consultant bị bỏ qua
                                    if (staff.SystemRolesFK.RoleName == USER_APP || instanceWorkflow.RuleNo == 1)
                                    {
                                        instanceWorkflow.CurrentStep = 3;
                                        initialStepsWorkflow = stepsWorkflow.FirstOrDefault(f => f.Steps == 2);
                                        instanceWorkflow.WorkflowStatusId = initialStepsWorkflow.PositiveStatusId;
                                        mailTemplate = stepsWorkflow.FirstOrDefault(w => w.Steps == 2).FlowMailTemplateFK;
                                        if (instanceWorkflow.RuleNo == 1)
                                        {
                                            checkerId = ownerFlow.ApproverUsersFK.Id;
                                        }
                                    }
                                    ControllerHelper.WFChangeStatus(_instanceWorkFlowRepository, survey, survey.InstanceWorkflowFK, initialStepsWorkflow.PositiveStatusId, "Up", false);
                                }
                            }

                            survey = await _BaseRepository.UpdateData(survey, JsonConvert.SerializeObject(survey), survey.Id, "Id");



                            DataTable query = DataUtil.ExecuteSelectQuery(_BaseRepository._connectionString, mailTemplate?.MailQuery, ("@SurveyId", survey.Id));
                            if (query?.Rows.Count > 0)
                            {
                                Dictionary<string, object> dictionary = MakeQueryIntoDirectory(query.Rows[0]);
                                //string redirectMainView = System.IO.Path.Combine(REDIRECT_MAIN_VIEW, typeof(UrlCall).Name, "ReturnView");
                                string redirectMainView = $"{REDIRECT_MAIN_VIEW}{typeof(UrlCall).Name}{"/ReturnView"}";
                                redirectMainView += $"?guid={urlCall.Guid}";
                                dictionary.Add($"@@urlCallView", redirectMainView);
                                Users notifyUser = new Users();
                                //approver = employees.FirstOrDefault(f => f.AccountName == "quan.nh");
                                notifyUser = await _usersRepository.GetSingleObject(s => s.Id == checkerId);//users.FirstOrDefault(f => f.Id == userWorkflows.ReportToUserId);

                                if (notifyUser != null && mailTemplate != null)
                                {
                                    MailConfig emailSettings = configuration.GetSection("Email").Get<MailConfig>();

                                    string usersCCEmails = await ControllerHelper.GetEmailFromUserAccount(survey.CCSiteAccount, _employeeRepository);


                                    //MailQueue mailQueue = Util.NotifySession(staff, notifyUser, mailTemplate, emailSettings, dictionary, FOLLOW_CC);
                                    MailQueue mailQueue = Util.NotifySession(staff, notifyUser, mailTemplate, emailSettings, dictionary, Util.CCAllEmail(emailSettings.FollowCC, usersCCEmails));
                                    if (mailQueue != null)
                                    {
                                        _mailQueueRepository.InsertData(mailQueue);
                                    }
                                    SurveyWorkflowHistory surveyWorkflowHistory = new SurveyWorkflowHistory();
                                    surveyWorkflowHistory = Util.LogWorkflow(survey, currentWorkflowStatusId, survey.InstanceWorkflowFK?.WorkflowStatusId ?? 0, CURRENT_USER, notifyUser.username);
                                    _surveyWorkflowHistoryRepository.InsertData(surveyWorkflowHistory);

                                    List<Outline> outlines = new List<Outline>();
                                    List<SurveyMemoWorkflow> tocParagraphs = new List<SurveyMemoWorkflow>();
                                    tocParagraphs = WordUtil.ExtractTocLines(docPath);
                                    long? surveyTypeId = survey.SurveyTypeId;
                                    //if (surveyTypeId != null)
                                    //{
                                    //    outlines = await _outlineRepository.GetListObject(l => l.SurveyTypeId == surveyTypeId);
                                    //    foreach (Outline item in outlines)
                                    //    {
                                    //        SurveyMemoWorkflow surveyMemoWorkflow = new SurveyMemoWorkflow();
                                    //        surveyMemoWorkflow.SurveyId = survey.Id;
                                    //        surveyMemoWorkflow.OutlineId = item.Id;
                                    //        surveyMemoWorkflow.OutlineName = item.Content;
                                    //        surveyMemoWorkflow.SubmitDate = survey.SubmitDate;
                                    //        await _surveyMemoWorkflowRepository.InsertData(surveyMemoWorkflow);
                                    //    }
                                    //}
                                    foreach (SurveyMemoWorkflow surveyMemoWorkflow in tocParagraphs)
                                    {
                                        surveyMemoWorkflow.SurveyId = survey.Id;
                                        surveyMemoWorkflow.SubmitDate = survey.SubmitDate;
                                        await _surveyMemoWorkflowRepository.InsertData(surveyMemoWorkflow);
                                    }

                                }
                            }

                            if (instanceWorkflow.RuleNo == 2)
                            {
                                ControllerHelper.SurveyMemoMaking(docPath,survey,_surveyMemoWorkflowRepository);
                            }
                        }
                    }
                    else
                        return Accepted(new
                        {
                            Status = "warning",
                            Message = "Survey by is empty",
                            Details = $"Survey by is empty"
                        });
                }
            }
            else return Accepted(new
            {
                Status = "warning",
                Message = "Employee not found",
                Details = $"Employee {survey.CreatedBy} not exists. Please contact admin."
            });
            return Ok();
        }
        else return BadRequest(new
        {
            Message = "File not found",
            Details = $"{docPath} not exists."
        });

    }
    [HttpPost]
    public async Task<IActionResult> CopySurvey([FromBody] SurveySubmitRequest surveyData)
    {
        try
        {
            Survey returnSurvey = new Survey();
            long cloneSurveyId = surveyData.CloneSurveyId ?? 0;
            if (cloneSurveyId > 0)
            {
                var Base = await _BaseRepository.GetSingleObjectFullInclude(s => s.Id == cloneSurveyId);
                Base = await _BaseRepository.IncludeListsOnly(Base);
                Base.CreatedBy = _httpContextAccessor.HttpContext.User.Identity.Name;
                Base.CreatedDate = DateTime.Now;
                SurveySubmitRequest surveySubmitRequest = new SurveySubmitRequest();
                surveySubmitRequest.Survey = Base;
                surveySubmitRequest.Management = Base.ManagementFK;
                surveySubmitRequest.Construction = Base.ConstructionFK;
                surveySubmitRequest.Occupancy = Base.OccupancyFK;
                surveySubmitRequest.Protection = Base.ProtectionFK;
                surveySubmitRequest.ExtFireExpExposures = Base.ExtFireExpExposuresFK;
                surveySubmitRequest.OtherExposures = Base.OtherExposuresFK;
                surveySubmitRequest.Summary = Base.SummaryFK;
                surveySubmitRequest.LossHistory = Base.LossHistoryFK;
                surveySubmitRequest.LossExpValueBrkdwn = Base.LossExpValueBrkdwnFK;
                surveySubmitRequest.Appendix = Base.AppendixFK;



                //surveySubmitRequest.AttachmentRequests = Base.Attachments.ToArray();
                surveySubmitRequest.ConstructionBuilding = Base.ConstructionBuildings.ToArray();
                surveySubmitRequest.SurveyEvaluations = Base.SurveyEvaluations.ToArray();
                //surveySubmitRequest.SitePictures = Base.SitePictures.ToArray();
                surveySubmitRequest.SurveyOutlineOptions = Base.SurveyOutlineOptions.ToArray();
                surveySubmitRequest.OccupancyDetail = Base.OccupancyDetails.ToArray();
                surveySubmitRequest.LossExpValueBrkdwnDetail = Base.LossExpValueBrkdwnDetails.ToArray();
                surveySubmitRequest.LossHistoryDetail = Base.LossHistoryDetails.ToArray();
                surveySubmitRequest.ParticipantList = Base.ParticipantLists.ToArray();
                surveySubmitRequest.ProtectionDetail = Base.ProtectionDetails.ToArray();
                surveySubmitRequest.Survey.OverViewAttachmentId = null;
                dynamic data = await CreateSurvey(surveySubmitRequest);

                List<CopyAttachment> copyAttachments = new List<CopyAttachment>();
                copyAttachments = Util.RemakeAttachment(Base, BLOB_PATH);

                if (copyAttachments.Count > 0)
                {
                    foreach (CopyAttachment item in copyAttachments)
                    {
                        item.NewAttachment = await _attachmentRepository.InsertData(item.NewAttachment);
                        if (item.OldSitePictures != null)
                        {
                            SitePictures sitePictures = item.OldSitePictures;
                            sitePictures.AttachmentId = item.NewAttachment.Id;
                            sitePictures.SurveyId = data.Value.Id;
                            item.NewSitePictures = await _sitePicturesRepository.InsertData(sitePictures);
                        }
                    }

                }



                if (surveySubmitRequest.ConstructionBuilding.Length > 0)
                {
                    foreach (ConstructionBuilding item in surveySubmitRequest.ConstructionBuilding)
                    {
                        item.SurveyId = data.Value.Id;
                        await _constructionBuildingRepository.InsertData(item);
                    }
                }
                //if (surveySubmitRequest.SitePictures.Length > 0)
                //{
                //    foreach (SitePictures item in surveySubmitRequest.SitePictures)
                //    {
                //        item.SurveyId = data.Value.Id;
                //        await _sitePicturesRepository.InsertData(item);
                //    }
                //}
                if (surveySubmitRequest.SurveyOutlineOptions.Length > 0)
                {
                    foreach (SurveyOutlineOptions item in surveySubmitRequest.SurveyOutlineOptions)
                    {
                        item.SurveyId = data.Value.Id;
                        await _surveyOutlineOptionsRepository.InsertData(item);
                    }
                }
                if (surveySubmitRequest.OccupancyDetail.Length > 0)
                {
                    foreach (OccupancyDetail item in surveySubmitRequest.OccupancyDetail)
                    {
                        item.SurveyId = data.Value.Id;
                        await _occupancyDetailRepository.InsertData(item);
                    }
                }
                if (surveySubmitRequest.LossExpValueBrkdwnDetail.Length > 0)
                {
                    foreach (LossExpValueBrkdwnDetail item in surveySubmitRequest.LossExpValueBrkdwnDetail)
                    {
                        item.SurveyId = data.Value.Id;
                        await _lossExpValueBrkdwnDetailRepository.InsertData(item);
                    }
                }
                if (surveySubmitRequest.LossHistoryDetail.Length > 0)
                {
                    foreach (LossHistoryDetail item in surveySubmitRequest.LossHistoryDetail)
                    {
                        item.SurveyId = data.Value.Id;
                        await _lossHistoryDetailRepository.InsertData(item);
                    }
                }
                if (surveySubmitRequest.ParticipantList.Length > 0)
                {
                    foreach (ParticipantList item in surveySubmitRequest.ParticipantList)
                    {
                        item.SurveyId = data.Value.Id;
                        await _participantListRepository.InsertData(item);
                    }
                }
                //if (surveySubmitRequest.ProtectionDetail.Length > 0)
                //{
                //    foreach (ProtectionDetail item in surveySubmitRequest.ProtectionDetail)
                //    {
                //        item.SurveyId = data.Value.Id;
                //        await _protectionDetailRepository.InsertData(item);
                //    }
                //}

                returnSurvey = data.Value;
            }
            return Ok(returnSurvey);
        }
        catch (Exception ex)
        {
            Log.Error(ex, ex.Message);
            return BadRequest();
        }
    }

    [HttpPost]
    public async Task<IActionResult> CreateSurvey([FromBody] SurveySubmitRequest surveyData)
    {
        try
        {
            Survey Survey = surveyData.Survey;
            //if ((surveyData.CloneSurveyId ?? 0) > 0)
            //{
            //    await CopySurvey(surveyData);
            //} 
            //else
            //{

            // 1 - 1 Survey FK - On detail form
            Management management = new Management();
            if (surveyData.Management != null)
            {
                surveyData.Management = await _managementRepository.InsertData(surveyData.Management);
                management = surveyData.Management;
            }
            else
                surveyData.Management = await _managementRepository.InsertData(management);
            Construction construction = new Construction();
            if (surveyData.Construction != null)
            {
                surveyData.Construction = await _constructionRepository.InsertData(surveyData.Construction);
                construction = surveyData.Construction;
            }
            else
                surveyData.Construction = await _constructionRepository.InsertData(construction);

            Occupancy occupancy = new Occupancy();
            if (surveyData.Occupancy != null)
            {
                surveyData.Occupancy = await _occupancyRepository.InsertData(surveyData.Occupancy);
                occupancy = surveyData.Occupancy;
            }
            else
                surveyData.Occupancy = await _occupancyRepository.InsertData(occupancy);

            Protection protection = new Protection();
            if (surveyData.Protection != null)
            {
                surveyData.Protection = await _protectionRepository.InsertData(surveyData.Protection);
                protection = surveyData.Protection;
            }
            else
                surveyData.Protection = await _protectionRepository.InsertData(protection);

            ExtFireExpExposures extFireExpExposures = new ExtFireExpExposures();
            if (surveyData.ExtFireExpExposures != null)
            {
                surveyData.ExtFireExpExposures = await _extFireExpExposuresRepository.InsertData(surveyData.ExtFireExpExposures);
                extFireExpExposures = surveyData.ExtFireExpExposures;
            }
            else
                surveyData.ExtFireExpExposures = await _extFireExpExposuresRepository.InsertData(extFireExpExposures);

            OtherExposures otherExposures = new OtherExposures();
            if (surveyData.OtherExposures != null)
            {
                surveyData.OtherExposures = await _otherExposuresRepository.InsertData(surveyData.OtherExposures);
                otherExposures = surveyData.OtherExposures;
            }
            else
                surveyData.OtherExposures = await _otherExposuresRepository.InsertData(otherExposures);



            Summary summary = new Summary();
            if (surveyData.Summary != null)
            {
                surveyData.Summary = await _summaryRepository.InsertData(surveyData.Summary);
                summary = surveyData.Summary;
            }
            else
                surveyData.Summary = await _summaryRepository.InsertData(summary);


            LossHistory lossHistory = new LossHistory();
            if (surveyData.LossHistory != null)
            {
                surveyData.LossHistory = await _lossHistoryRepository.InsertData(surveyData.LossHistory);
                lossHistory = surveyData.LossHistory;
            }
            else
                surveyData.LossHistory = await _lossHistoryRepository.InsertData(lossHistory);
            List<dynamic> currencyTypes = await _enumDataRepository.EnumLookup("Name", CURRENCY_ENUMNAME);
            dynamic currencyType = currencyTypes.FirstOrDefault(f => f.Key == CURRENCY_TYPE);
            LossExpValueBrkdwn lossExpValueBrkdwn = new LossExpValueBrkdwn();
            if (surveyData.LossExpValueBrkdwn != null)
            {
                if (surveyData.LossExpValueBrkdwn.CurrencyId == null)
                {

                    surveyData.LossExpValueBrkdwn.CurrencyId = currencyType.Id;
                }
                surveyData.LossExpValueBrkdwn = await _lossExpValueBrkdwnRepository.InsertData(surveyData.LossExpValueBrkdwn);
                lossExpValueBrkdwn = surveyData.LossExpValueBrkdwn;
            }
            else
            {
                lossExpValueBrkdwn.CurrencyId = currencyType.Id;
                surveyData.LossExpValueBrkdwn = await _lossExpValueBrkdwnRepository.InsertData(lossExpValueBrkdwn);
            }

            Appendix appendix = new Appendix();
            if (surveyData.Appendix != null)
            {
                surveyData.Appendix = await _appendixRepository.InsertData(surveyData.Appendix);
                appendix = surveyData.Appendix;
            }
            else
                surveyData.Appendix = await _appendixRepository.InsertData(appendix);

            var posNegEnums = await _enumDataRepository.EnumData(typeof(PosNegAspect).Name);
            Survey.ManagementId = management.Id;
            Survey.ConstructionId = construction.Id;
            Survey.OccupancyId = occupancy.Id;
            Survey.ProtectionId = protection.Id;
            Survey.ExtFireExpExposuresId = extFireExpExposures.Id;
            Survey.OtherExposuresId = otherExposures.Id;
            Survey.SummaryId = summary.Id;
            Survey.LossHistoryId = lossHistory.Id;
            Survey.LossExpValueBrkdwnId = lossExpValueBrkdwn.Id;
            Survey.AppendixId = appendix.Id;

            IBaseRepository<FormatCodeNo> _formatCodeNoRepository = new BaseRepository<FormatCodeNo>(configuration, _httpContextAccessor);
            List<FormatCodeNo> tableConfig = new List<FormatCodeNo>();

            tableConfig = await _formatCodeNoRepository.GetListObjectFullInclude(l => l.NoSeqCode == "SurveyCode");
            //var entityType = typeof(FormatCodeNo);
            //var properties = entityType.GetProperties();
            //foreach (FormatCodeNo tableCf in tableConfigs)
            //{
            //    foreach (var property in properties)
            //    {
            //        FormatCodeNo entity = new FormatCodeNo();
            //        entity = tableCf;
            //        if (property.Name.EndsWith("FK") &&
            //           !property.PropertyType.IsValueType &&
            //           property.PropertyType != typeof(string) &&
            //           property.PropertyType != typeof(byte[]))
            //        {
            //            var parameter = Expression.Parameter(entityType, "x");
            //            var propertyAccess = Expression.Property(parameter, property.Name);
            //            var lambda = Expression.Lambda<Func<FormatCodeNo, object>>(Expression.Convert(propertyAccess, typeof(object)), parameter);
            //            entity = await _formatCodeNoRepository.ObjectSpecificInclude(tableCf, lambda);
            //            tableConfig.Add(entity);
            //        }
            //    }
            //}


            Survey.SurveyNo = ControllerUtil.GenerateNumberSeq(tableConfig, _formatCodeNoRepository, nameof(Survey));
            Survey.WorkflowStatusId = null;

            Survey.AreaEnum = _BaseRepository.ObjectSpecificEnumIncludeSync(Survey, "Area", e => e.AreaEnum);
            if (Survey.AreaEnum.Key == BusinessConfig.HCMSiteName)
            {
                Survey.CCSiteAccount = BusinessConfig.HCMSiteEmailCCAccount;
;            }
            if (Survey.AreaEnum.Key == BusinessConfig.HNSiteName)
            {
                Survey.CCSiteAccount = BusinessConfig.HNSiteEmailCCAccount;
            }
            Survey = await _BaseRepository.InsertData(Survey);


            Employee staff = new Employee();
            staff = await _employeeRepository.GetSingleObject(f => f.AccountName == Survey.CreatedBy);
            staff = await _employeeRepository.IncludeSpecificField(staff, "System", e => e.SystemRolesFK);


            List<Employee> managerStaffs = new List<Employee>();

            managerStaffs = await _employeeRepository.GetAll();
            managerStaffs.ForEach(async f =>
            {
                f = await _employeeRepository.IncludeSpecificField(f, "System", e => e.SystemRolesFK);
            });
            if (managerStaffs.Any(w => w.SystemRolesFK != null && w.SystemRolesFK.RoleName == MANAGER_APP))
            {
                managerStaffs = managerStaffs
                    .Where(w => w.SystemRolesFK != null && w.SystemRolesFK.RoleName == MANAGER_APP)
                    .ToList();
            }
            else
            {
                managerStaffs = new List<Employee>();
            }

            //Update date: 2025-05-26 Order mail rule off 
            //if (staff != null)
            //{
            //    if (staff.SystemRolesFK != null)
            //    {
            //        if (staff.SystemRolesFK.RoleName == USER_APP)
            //            if (managerStaffs.Count > 0)
            //            {
            //                foreach (var managerStaff in managerStaffs)
            //                {
            //                    MailTemplate mailTemplate = new MailTemplate();
            //                    mailTemplate = await _mailTemplateRepository.GetSingleObject(s => s.TemplateName == "Order Mail");
            //                    if (mailTemplate.IsActive ?? false)
            //                    {
            //                        DataTable query = DataUtil.ExecuteSelectQuery(_BaseRepository._connectionString, mailTemplate.MailQuery, ("@SurveyId", Survey.Id));
            //                        Dictionary<string, object> dictionary = MakeQueryIntoDirectory(query.Rows[0]);
            //                        Users notifyUser = new Users();
            //                        //approver = employees.FirstOrDefault(f => f.AccountName == "quan.nh");
            //                        notifyUser = await _usersRepository.GetSingleObject(s => s.username == managerStaff.AccountName);//users.FirstOrDefault(f => f.Id == userWorkflows.ReportToUserId);

            //                        if (notifyUser != null && mailTemplate != null)
            //                        {
            //                            MailConfig emailSettings = configuration.GetSection("Email").Get<MailConfig>();
            //                            MailQueue mailQueue = Util.NotifySession(staff, notifyUser, mailTemplate, emailSettings, dictionary, FOLLOW_CC);
            //                            if (mailQueue != null)
            //                            {
            //                                _mailQueueRepository.InsertData(mailQueue);
            //                            }
            //                        }
            //                    }
            //                }
            //            }
            //    }

            //}

            //Many -  1 per Survey

            //List<PosNegAspect> PosNegAspects = new List<PosNegAspect>();
            //PosNegAspect posApsectContent = new PosNegAspect();
            //posApsectContent.PosNegContent = surveyData.PosNegAspectContent.PosAspecContent;
            //posApsectContent.SurveyId = Survey.Id;
            //posApsectContent.PosNegTypeId = posNegEnums.FirstOrDefault(f => f.Key == "Positive").Id;
            //PosNegAspect negApsectContent = new PosNegAspect();
            //negApsectContent.PosNegContent = surveyData.PosNegAspectContent.NegAspecContent;
            //negApsectContent.SurveyId = Survey.Id;
            //negApsectContent.PosNegTypeId = posNegEnums.FirstOrDefault(f => f.Key == "Negative").Id;
            //PosNegAspects.Add(posApsectContent);
            //PosNegAspects.Add(negApsectContent);
            //foreach (PosNegAspect item in PosNegAspects)
            //{
            //    item.SurveyId = Survey.Id;
            //    await _posNegAspectRepository.InsertData(item);
            //}
            if (surveyData.SurveyEvaluations != null)
            {
                if (surveyData.SurveyEvaluations.Length > 0)
                {
                    foreach (SurveyEvaluation item in surveyData.SurveyEvaluations)
                    {
                        item.SurveyId = Survey.Id;
                        await _surveyEvaluationRepository.InsertData(item);
                    }
                }
                else
                {
                    var surveyEvaluationTypes = await _enumDataRepository.EnumData(nameof(SurveyEvaluation));
                    var surveyStatus = surveyEvaluationTypes.Where(w => w.Name == SURVEY_EVALUATION_STATUS_KEYNAME);
                    var surveyCategory = surveyEvaluationTypes.Where(w => w.Name == SURVEY_EVALUATION_CATEGORY_KEYNAME);
                    foreach (EnumData item in surveyCategory)
                    {
                        SurveyEvaluation surveyEvaluation = new SurveyEvaluation();
                        surveyEvaluation.SurveyId = Survey.Id;
                        surveyEvaluation.SurveyCategoryTypeId = item.Id;
                        long? defaultAverageStatusId = surveyStatus.FirstOrDefault(f => f.Key == DEFAULT_STATUS_SURVEY_EVALUATION).Id;
                        surveyEvaluation.SurveyStatusId = defaultAverageStatusId;
                        await _surveyEvaluationRepository.InsertData(surveyEvaluation);
                    }

                }
            }

            if (surveyData.Protection != null)
            {
                var fireFightingEquipments = await _enumDataRepository.EnumData(typeof(ProtectionDetail).Name);
                fireFightingEquipments = fireFightingEquipments.Where(w => w.MappingField == "firefightingEquipmentId").ToList();
                foreach (var fireFightingEquipment in fireFightingEquipments)
                {
                    ProtectionDetail protectionDetail = new ProtectionDetail();
                    protectionDetail.SurveyId = Survey.Id;
                    protectionDetail.FirefightingEquipmentId = fireFightingEquipment.Id;
                    protectionDetail.Availability = true;
                    _protectionDetailRepository.InsertData(protectionDetail);
                }
            }


            if (surveyData.SurveyOutlineOptions == null || surveyData.SurveyOutlineOptions.Count() == 0)
            {
                List<Outline> outLines = await _outlineRepository.GetFKMany((int)Survey.SurveyTypeId, "SurveyTypeId");
                string[] placeholders = STATIC_PLACEHOLDER.Split(',');
                foreach (Outline item in outLines)
                {
                    SurveyOutlineOptions surveyOutlineOptions = new SurveyOutlineOptions();
                    surveyOutlineOptions.SurveyId = Survey.Id;
                    surveyOutlineOptions.OutlineId = item.Id;
                    surveyOutlineOptions.OptionValue = 1;
                    surveyOutlineOptions.MainEnable = placeholders.Contains(item.PlaceHolder) ? true : false;
                    if (surveyData.MainOutlines?.Length > 0)
                    {
                        if (surveyData.MainOutlines.Any(a => a.Id == item.Id))
                            surveyOutlineOptions.MainEnable = true;
                    }
                    await _surveyOutlineOptionsRepository.InsertData(surveyOutlineOptions);
                }
            }


            if (surveyData.DraftGuid != Guid.Empty)
            {
                //List<ParticipantList> participantLists = new List<ParticipantList>();
                //participantLists = await _participantListRepository.GetListObject(o => o.DraftGuid == surveyData.DraftGuid);
                //
                //
                //if (participantLists.Count == 0)
                //{
                //    ParticipantList participantList = new ParticipantList();
                //    participantList.PersonDepartment = "";
                //    participantList.PersonName = "";
                //    participantList.SideId = 66;
                //    participantList.SideName = Survey.ClientName;
                //    participantList.SideOrder = 1;
                //    participantList.SurveyId = Survey.Id;
                //    await _participantListRepository.InsertData(participantList);
                //
                //}
                //else
                //{
                //    foreach (ParticipantList participantList in participantLists)
                //    {
                //        await _participantListRepository.DeleteData(participantList, surveyData.DraftGuid, "DraftGuid", true);
                //        participantList.DraftGuid = Guid.Empty;
                //        participantList.SurveyId = Survey.Id;
                //        await _participantListRepository.InsertData(participantList);
                //    }
                //}

            }

            //}


            return Ok(Survey);
        }
        catch (Exception ex)
        {
            //ControllerHelper.SeriLog(_logger, ex);
            Log.Error(ex, ex.Message);
            return BadRequest(ex.Message);

        }
    }

    [HttpPost]
    public async Task<IActionResult> UpdateSurvey([FromBody] SurveyUpdateRequest surveyData)
    {
        Survey returnSurvey = new Survey();
        Survey Survey = surveyData.Survey;
        if (Survey != null)
        {
            try
            {
                returnSurvey = Survey;
                //throw new Exception(); // test error exception
                Survey = await _BaseRepository.GetSingleObjectFullInclude(s => s.Id == surveyData.Survey.Id);
                if (Survey == null) throw new Exception("Survey not found!");
                if (Survey.AreaEnum?.Key == BusinessConfig.HCMSiteName)
                {
                    Survey.CCSiteAccount = BusinessConfig.HCMSiteEmailCCAccount;
                    ;
                }
                if (Survey.AreaEnum?.Key == BusinessConfig.HNSiteName)
                {
                    Survey.CCSiteAccount = BusinessConfig.HNSiteEmailCCAccount;
                }
                var result = new
                {
                    status = "saving ...",
                    data = Survey,
                    progressvalue = 25,
                    type = "inprogress"
                };
                if (!string.IsNullOrEmpty(surveyData.connectionId))
                    await _hubContext.Clients.Client(surveyData.connectionId).SendAsync("FileProcessingCompleted", new { surveyData = result, connectionId = surveyData.connectionId });
                Survey surveyUpdateRenderStatus = new Survey();
                surveyUpdateRenderStatus = Survey;
                if (!surveyData.autoSavedFlag)
                    surveyUpdateRenderStatus.WordRendered = false;
                surveyUpdateRenderStatus.NeedPDFConvert = true;
                await _BaseRepository.UpdateData(surveyUpdateRenderStatus, JsonConvert.SerializeObject(surveyUpdateRenderStatus), surveyData.Survey.Id, "Id");


                Survey updateSurvey = new Survey();
                AttachmentRequest attachmentRequest = new AttachmentRequest();
                attachmentRequest.surveyId = Survey.Id;
                string docPath = System.IO.Path.Combine(optionsMonitor.CurrentValue.Path, nameof(Survey), $"{Survey.SurveyNo}.docx");
                string pdfPath = System.IO.Path.Combine(optionsMonitor.CurrentValue.Path, nameof(Survey), $"{Survey.SurveyNo}.pdf");

                if (System.IO.File.Exists(pdfPath) && !surveyData.autoSavedFlag)
                {
                    System.IO.File.Delete(pdfPath);
                }
                List<Task> tasks = new List<Task>();

                if (!string.IsNullOrEmpty(surveyData.surveyValues) && Util.IsCanJsonPopulate(surveyData.surveyValues))
                {
                    JObject jObject = JObject.Parse(surveyData.surveyValues);
                    if (jObject["grantSurvey"] is JArray grantSurveyArray)
                    {
                        string grantSurveyString = "[" + string.Join(", ", grantSurveyArray.ToObject<List<object>>()) + "]";
                        jObject["grantSurvey"] = grantSurveyString; // Gán chuỗi thay cho mảng
                    }
                    JsonConvert.PopulateObject(jObject.ToString(), updateSurvey);
                    //if (updateSurvey.GrantSurvey.Length > 0)
                    //{
                    //    updateSurvey.GrantSurvey = updateSurvey.GrantSurvey.Select(i => (byte)i).ToArray();
                    //}
                    await _BaseRepository.UpdateData(updateSurvey, surveyData.surveyValues, Survey.Id, "Id");
                }
                if (!string.IsNullOrEmpty(surveyData.reOpinionValues) && Util.IsCanJsonPopulate(surveyData.reOpinionValues))
                {
                    JsonConvert.PopulateObject(surveyData.reOpinionValues, updateSurvey);
                    Tuple<Attachment, SitePictures> data = Util.HtmlWriteDown<Survey>(surveyData.Survey, surveyData.reOpinionValues, System.IO.Path.Combine(nameof(Survey), surveyData.Survey.SurveyNo), surveyData.Survey.SurveyNo, BLOB_PATH, attachmentRequest);
                    Util.HTMLRemake<Survey>(updateSurvey);
                    await _BaseRepository.UpdateData(updateSurvey, surveyData.reOpinionValues, Survey.Id, "Id");
                }
                if (!string.IsNullOrEmpty(surveyData.summaryValues) && Util.IsCanJsonPopulate(surveyData.summaryValues))
                {
                    Summary summary = new Summary();
                    JsonConvert.PopulateObject(surveyData.summaryValues, summary);
                    Tuple<Attachment, SitePictures> data = Util.HtmlWriteDown<Summary>(surveyData.Summary, surveyData.summaryValues, System.IO.Path.Combine(nameof(Survey), surveyData.Survey.SurveyNo), surveyData.Survey.SurveyNo, BLOB_PATH, attachmentRequest);
                    Util.HTMLRemake<Summary>(summary);
                    surveyData.Summary = await _summaryRepository.UpdateData(summary, surveyData.summaryValues, Survey.SummaryFK.Id, "Id");
                }
                if (!string.IsNullOrEmpty(surveyData.managementValues) && Util.IsCanJsonPopulate(surveyData.managementValues))
                {
                    Management management = new Management();
                    Management checkManagement = new Management();
                    JsonConvert.PopulateObject(surveyData.managementValues, management);
                    surveyData.Management = await _managementRepository.UpdateData(management, surveyData.managementValues, Survey.ManagementFK.Id, "Id");
                    surveyData.Management = await _managementRepository.GetObjectByIdAsync(Survey.ManagementFK.Id);
                    checkManagement = await _managementRepository.GetObjectByIdAsync(Survey.ManagementFK.Id);
                    if (checkManagement.AdditionalOutline?.Length > 0)
                    {
                        checkManagement.AdditionalOutline = Util.AdditionalOutlineHandle(surveyData.managementValues, checkManagement, Survey, attachmentRequest, BLOB_PATH);
                    }
                    Tuple<Attachment, SitePictures> data = Util.HtmlWriteDown<Management>(surveyData.Management, surveyData.managementValues, System.IO.Path.Combine(nameof(Survey), surveyData.Survey.SurveyNo), surveyData.Survey.SurveyNo, BLOB_PATH, attachmentRequest);
                    Util.HTMLRemake<Management>(checkManagement);
                    await _managementRepository.UpdateData(checkManagement, JsonConvert.SerializeObject(checkManagement), Survey.ManagementFK.Id, "Id");
                }
                if (!string.IsNullOrEmpty(surveyData.constructionValues) && Util.IsCanJsonPopulate(surveyData.constructionValues))
                {
                    Construction construction = new Construction();
                    Construction checkConstruction = new Construction();
                    JsonConvert.PopulateObject(surveyData.constructionValues, construction);
                    surveyData.Construction = await _constructionRepository.UpdateData(construction, surveyData.constructionValues, Survey.ConstructionFK.Id, "Id");
                    surveyData.Construction = await _constructionRepository.GetObjectByIdAsync(Survey.ConstructionFK.Id);
                    checkConstruction = await _constructionRepository.GetObjectByIdAsync(Survey.ConstructionFK.Id);
                    if (checkConstruction.AdditionalOutline?.Length > 0)
                    {
                        checkConstruction.AdditionalOutline = Util.AdditionalOutlineHandle(surveyData.constructionValues, checkConstruction, Survey, attachmentRequest, BLOB_PATH);
                    }
                    Tuple<Attachment, SitePictures> data = Util.HtmlWriteDown<Construction>(surveyData.Construction, surveyData.constructionValues, System.IO.Path.Combine(nameof(Survey), surveyData.Survey.SurveyNo), surveyData.Survey.SurveyNo, BLOB_PATH, attachmentRequest);
                    Util.HTMLRemake<Construction>(checkConstruction);
                    await _constructionRepository.UpdateData(checkConstruction, JsonConvert.SerializeObject(checkConstruction), Survey.ConstructionFK.Id, "Id");

                }
                if (!string.IsNullOrEmpty(surveyData.occupancyValues) && Util.IsCanJsonPopulate(surveyData.occupancyValues))
                {
                    Occupancy occupancy = new Occupancy();
                    Occupancy checkOccupancy = new Occupancy();
                    JsonConvert.PopulateObject(surveyData.occupancyValues, occupancy);
                    surveyData.Occupancy = await _occupancyRepository.UpdateData(occupancy, surveyData.occupancyValues, Survey.OccupancyFK.Id, "Id");
                    surveyData.Occupancy = await _occupancyRepository.GetObjectByIdAsync(Survey.OccupancyFK.Id);
                    checkOccupancy = await _occupancyRepository.GetObjectByIdAsync(Survey.OccupancyFK.Id);
                    if (checkOccupancy.AdditionalOutline?.Length > 0)
                    {
                        checkOccupancy.AdditionalOutline = Util.AdditionalOutlineHandle(surveyData.occupancyValues, checkOccupancy, Survey, attachmentRequest, BLOB_PATH);
                    }
                    Tuple<Attachment, SitePictures> data = Util.HtmlWriteDown<Occupancy>(surveyData.Occupancy, surveyData.occupancyValues, System.IO.Path.Combine(nameof(Survey), surveyData.Survey.SurveyNo), surveyData.Survey.SurveyNo, BLOB_PATH, attachmentRequest);
                    Util.HTMLRemake<Occupancy>(checkOccupancy);
                    await _occupancyRepository.UpdateData(checkOccupancy, JsonConvert.SerializeObject(checkOccupancy), Survey.OccupancyFK.Id, "Id");
                }
                if (!string.IsNullOrEmpty(surveyData.protectionValues) && Util.IsCanJsonPopulate(surveyData.protectionValues))
                {
                    Protection protection = new Protection();
                    JsonConvert.PopulateObject(surveyData.protectionValues, protection);
                    Tuple<Attachment, SitePictures> data = Util.HtmlWriteDown<Protection>(surveyData.Protection, surveyData.protectionValues, System.IO.Path.Combine(nameof(Survey), surveyData.Survey.SurveyNo), surveyData.Survey.SurveyNo, BLOB_PATH, attachmentRequest);
                    Util.HTMLRemake<Protection>(protection);
                    surveyData.Protection = await _protectionRepository.UpdateData(protection, surveyData.protectionValues, Survey.ProtectionFK.Id, "Id");
                }


                if (!string.IsNullOrEmpty(surveyData.extFireExpExposuresValues) && Util.IsCanJsonPopulate(surveyData.extFireExpExposuresValues))
                {
                    //ExtFireExpExposures extFireExpExposures = new ExtFireExpExposures();
                    //JsonConvert.PopulateObject(surveyData.extFireExpExposuresValues, extFireExpExposures);
                    //surveyData.ExtFireExpExposures = await _extFireExpExposuresRepository.UpdateData(extFireExpExposures, surveyData.extFireExpExposuresValues, Survey.ExtFireExpExposuresFK.Id, "Id");



                    ExtFireExpExposures extFireExpExposures = new ExtFireExpExposures();
                    ExtFireExpExposures checkExtFireExpExposures = new ExtFireExpExposures();
                    JsonConvert.PopulateObject(surveyData.extFireExpExposuresValues, checkExtFireExpExposures);
                    surveyData.ExtFireExpExposures = await _extFireExpExposuresRepository.UpdateData(checkExtFireExpExposures, surveyData.extFireExpExposuresValues, Survey.ExtFireExpExposuresFK.Id, "Id");
                    surveyData.ExtFireExpExposures = await _extFireExpExposuresRepository.GetObjectByIdAsync(Survey.ExtFireExpExposuresFK.Id);
                    checkExtFireExpExposures = await _extFireExpExposuresRepository.GetObjectByIdAsync(Survey.ExtFireExpExposuresFK.Id);
                    if (checkExtFireExpExposures.AdditionalOutline?.Length > 0)
                    {
                        checkExtFireExpExposures.AdditionalOutline = Util.AdditionalOutlineHandle(surveyData.extFireExpExposuresValues, checkExtFireExpExposures, Survey, attachmentRequest, BLOB_PATH);
                    }
                    Tuple<Attachment, SitePictures> data = Util.HtmlWriteDown<ExtFireExpExposures>(surveyData.ExtFireExpExposures, surveyData.extFireExpExposuresValues, System.IO.Path.Combine(nameof(Survey), surveyData.Survey.SurveyNo), surveyData.Survey.SurveyNo, BLOB_PATH, attachmentRequest);
                    Util.HTMLRemake<ExtFireExpExposures>(checkExtFireExpExposures);
                    await _extFireExpExposuresRepository.UpdateData(checkExtFireExpExposures, JsonConvert.SerializeObject(checkExtFireExpExposures), Survey.ExtFireExpExposuresFK.Id, "Id");


                    //ExtFireExpExposures extFireExpExposures = new ExtFireExpExposures();
                    //JsonConvert.PopulateObject(surveyData.extFireExpExposuresValues, extFireExpExposures);
                    //Util.HTMLRemake<ExtFireExpExposures>(extFireExpExposures);
                    //surveyData.ExtFireExpExposures = await _extFireExpExposuresRepository.UpdateData(extFireExpExposures, JsonConvert.SerializeObject(extFireExpExposures), Survey.ExtFireExpExposuresFK.Id, "Id");
                }

                if (!string.IsNullOrEmpty(surveyData.otherExposuresValues) && Util.IsCanJsonPopulate(surveyData.otherExposuresValues))
                {
                    OtherExposures otherExposures = new OtherExposures();
                    OtherExposures checkOtherExposures = new OtherExposures();
                    JsonConvert.PopulateObject(surveyData.otherExposuresValues, otherExposures);
                    surveyData.OtherExposures = await _otherExposuresRepository.UpdateData(otherExposures, surveyData.otherExposuresValues, Survey.OtherExposuresFK.Id, "Id");
                    surveyData.OtherExposures = await _otherExposuresRepository.GetObjectByIdAsync(Survey.OtherExposuresFK.Id);
                    checkOtherExposures = await _otherExposuresRepository.GetObjectByIdAsync(Survey.OtherExposuresFK.Id);
                    if (checkOtherExposures.AdditionalOutline?.Length > 0)
                    {
                        checkOtherExposures.AdditionalOutline = Util.AdditionalOutlineHandle(surveyData.otherExposuresValues, checkOtherExposures, Survey, attachmentRequest, BLOB_PATH);
                    }
                    Tuple<Attachment, SitePictures> data = Util.HtmlWriteDown<OtherExposures>(surveyData.OtherExposures, surveyData.otherExposuresValues, System.IO.Path.Combine(nameof(Survey), surveyData.Survey.SurveyNo), surveyData.Survey.SurveyNo, BLOB_PATH, attachmentRequest);
                    Util.HTMLRemake<OtherExposures>(checkOtherExposures);
                    await _otherExposuresRepository.UpdateData(checkOtherExposures, JsonConvert.SerializeObject(checkOtherExposures), Survey.OtherExposuresFK.Id, "Id");
                }

                if (!string.IsNullOrEmpty(surveyData.lossHistoryValues) && Util.IsCanJsonPopulate(surveyData.lossHistoryValues))
                {
                    LossHistory lossHistory = new LossHistory();

                    JsonConvert.PopulateObject(surveyData.lossHistoryValues, lossHistory);
                    Util.HTMLRemake<LossHistory>(lossHistory);
                    surveyData.LossHistory = await _lossHistoryRepository.UpdateData(lossHistory, JsonConvert.SerializeObject(lossHistory), Survey.LossHistoryFK.Id, "Id");
                    //surveyData.LossHistory = await _lossHistoryRepository.GetObjectByIdAsync(Survey.LossHistoryFK.Id);
                    //Tuple<Attachment, SitePictures> data = Util.HtmlWriteDown<LossHistory>(surveyData.LossHistory, nameof(Survey), surveyData.Survey.SurveyNo, _lossHistoryRepository);
                }

                if (!string.IsNullOrEmpty(surveyData.lossExpValueBrkdwnValues) && Util.IsCanJsonPopulate(surveyData.lossExpValueBrkdwnValues))
                {
                    LossExpValueBrkdwn lossExpValueBrkdwn = new LossExpValueBrkdwn();
                    JsonConvert.PopulateObject(surveyData.lossExpValueBrkdwnValues, lossExpValueBrkdwn);
                    Tuple<Attachment, SitePictures> data = Util.HtmlWriteDown<LossExpValueBrkdwn>(surveyData.LossExpValueBrkdwn, surveyData.lossExpValueBrkdwnValues, System.IO.Path.Combine(nameof(Survey), surveyData.Survey.SurveyNo), surveyData.Survey.SurveyNo, BLOB_PATH, attachmentRequest);
                    Util.HTMLRemake<LossExpValueBrkdwn>(lossExpValueBrkdwn);
                    surveyData.LossExpValueBrkdwn = await _lossExpValueBrkdwnRepository.UpdateData(lossExpValueBrkdwn, surveyData.lossExpValueBrkdwnValues, Survey.LossExpValueBrkdwnFK.Id, "Id");
                }
                if (!string.IsNullOrEmpty(surveyData.appendixValues) && Util.IsCanJsonPopulate(surveyData.appendixValues))
                {
                    Appendix appendix = new Appendix();
                    JsonConvert.PopulateObject(surveyData.appendixValues, appendix);
                    Tuple<Attachment, SitePictures> data = Util.HtmlWriteDown<Appendix>(surveyData.Appendix, surveyData.appendixValues, System.IO.Path.Combine(nameof(Survey), surveyData.Survey.SurveyNo), surveyData.Survey.SurveyNo, BLOB_PATH, attachmentRequest);
                    Util.HTMLRemake<Appendix>(appendix);
                    surveyData.Appendix = await _appendixRepository.UpdateData(appendix, JsonConvert.SerializeObject(appendix), Survey.AppendixFK.Id, "Id");
                }
                //List<PosNegAspect> posNegAspects = await _posNegAspectRepository.GetAll();
                //posNegAspects = posNegAspects.Where(w => w.SurveyId == Survey.Id).ToList();
                //PosNegAspectContent posNegAspectContent = new PosNegAspectContent();
                //if (surveyData.posNegValues != null || !string.IsNullOrEmpty(surveyData.posNegValues) )
                //JsonConvert.PopulateObject(surveyData.posNegValues, posNegAspectContent);

                //var posNegEnums = await _enumDataRepository.EnumData(typeof(PosNegAspect).Name);

                //if (surveyData.PosNegAspectContent.PosAspecContent != null)
                //{
                //    PosNegAspect posApsectContent = new PosNegAspect();
                //    posApsectContent.SurveyId = Survey.Id;
                //    posApsectContent.PosNegContent = surveyData.PosNegAspectContent.PosAspecContent;
                //    posApsectContent.PosNegTypeId = posNegEnums.FirstOrDefault(f => f.Key == "Positive").Id;
                //    long id = posNegAspects.Where(w => w.PosNegTypeId == posNegEnums.FirstOrDefault(f => f.Key == "Positive").Id).First().Id;
                //    await _posNegAspectRepository.UpdateData(posApsectContent, JsonConvert.SerializeObject(posApsectContent), id, "Id");

                //}

                //if (surveyData.PosNegAspectContent.NegAspecContent != null)
                //{
                //    PosNegAspect negApsectContent = new PosNegAspect();
                //    negApsectContent.SurveyId = Survey.Id;
                //    negApsectContent.PosNegContent = surveyData.PosNegAspectContent.NegAspecContent ?? posNegAspects.Where(w => w.PosNegTypeId == negApsectContent.PosNegTypeId).First().PosNegContent;
                //    negApsectContent.PosNegTypeId = posNegEnums.FirstOrDefault(f => f.Key == "Negative").Id;
                //    long id = posNegAspects.Where(w => w.PosNegTypeId == posNegEnums.FirstOrDefault(f => f.Key == "Negative").Id).First().Id;
                //    await _posNegAspectRepository.UpdateData(negApsectContent, JsonConvert.SerializeObject(negApsectContent), id, "Id");
                //}
                List<SurveyEvaluation> surveyEvaluations = await _surveyEvaluationRepository.GetAll();
                surveyEvaluations = surveyEvaluations.Where(w => w.SurveyId == Survey.Id).ToList();

                if (surveyData.SurveyEvaluations != null)
                {
                    foreach (SurveyEvaluation item in surveyEvaluations)
                    {
                        item.SurveyId = Survey.Id;
                        if (surveyData.SurveyEvaluations.Any(w => w.SurveyCategoryTypeId == item.SurveyCategoryTypeId))
                        {
                            item.SurveyStatusId = surveyData.SurveyEvaluations.Where(w => w.SurveyCategoryTypeId == item.SurveyCategoryTypeId).First().SurveyStatusId;
                            await _surveyEvaluationRepository.UpdateData(item, JsonConvert.SerializeObject(item), item.Id, "Id");
                        }
                    }
                }

                if (surveyData.ConstructionBuilding?.Length > 0)
                {
                    foreach (ConstructionBuilding item in surveyData.ConstructionBuilding)
                    {
                        item.SurveyId = Survey.Id;
                        await _constructionBuildingRepository.UpdateData(item, JsonConvert.SerializeObject(item), item.Id, "Id");
                    }
                }
                if (surveyData?.OccupancyUtility?.Length > 0)
                {
                    foreach (OccupancyDetail item in surveyData?.OccupancyUtility)
                    {
                        item.SurveyId = Survey.Id;
                        await _occupancyDetailRepository.InsertData(item);
                    }
                }
                if (surveyData?.OccupancyIndGas?.Length > 0)
                {
                    foreach (OccupancyDetail item in surveyData?.OccupancyIndGas)
                    {
                        item.SurveyId = Survey.Id;
                        await _occupancyDetailRepository.InsertData(item);
                    }
                }

                if (surveyData?.AttachmentRequests?.Length > 0)
                {
                    foreach (AttachmentRequest item in surveyData?.AttachmentRequests)
                    {

                        Attachment attachment = new Attachment();
                        if (item.cacheGuid != null)
                        {
                            attachment = await _attachmentRepository.GetSingleObject(s => s.Guid == item.cacheGuid);
                            if (attachment != null)
                            {
                                attachment.SurveyId = item.surveyId == 0 ? Survey.Id : item.surveyId;
                                attachment.RecordGuid = item.outlineGuid;
                                attachment.ItemHeight = item.attachment?.height;
                                attachment.ItemWidth = item.attachment?.width;
                                attachment.Size = item.attachment?.size ?? 0;
                                await _attachmentRepository.UpdateData(attachment, JsonConvert.SerializeObject(attachment), attachment.Id, "Id");
                            }
                        }
                        else
                        {
                            attachment = await UploadAttachment(item);
                            attachment.SurveyId = item.surveyId == 0 ? Survey.Id : item.surveyId;
                            attachment.RecordGuid = item.outlineGuid;
                            await _attachmentRepository.InsertData(attachment);
                        }
                    }
                }
                if (surveyData?.SurveyOutlineOptions?.Length > 0)
                {
                    List<SurveyOutlineOptions> surveyOutlineOptionsDB = await _surveyOutlineOptionsRepository.GetFKMany((int)Survey.Id, "SurveyId");
                    foreach (SurveyOutlineOptions sOPs in surveyData?.SurveyOutlineOptions)
                    {
                        long? outlineId = sOPs.OutlineId;
                        SurveyOutlineOptions surveyOutlineOptions = surveyOutlineOptionsDB.FirstOrDefault(f => f.OutlineId == outlineId);
                        if (surveyOutlineOptions != null)
                            await _surveyOutlineOptionsRepository.UpdateData(sOPs, JsonConvert.SerializeObject(sOPs), surveyOutlineOptions.Id, "Id");
                        else
                            await _surveyOutlineOptionsRepository.InsertData(sOPs);
                    }
                }
                if (surveyData?.SitePictures?.Length > 0)
                {
                    foreach (SitePictures item in surveyData?.SitePictures)
                    {
                        //Attachment attachment = new Attachment();
                        //attachment = await UploadAttachment(item);
                        //attachment.SurveyId = item.surveyId == 0 ? Survey.Id : item.surveyId;
                        //attachment.RecordGuid = item.outlineGuid;
                        //await _attachmentRepository.InsertData(attachment);
                    }
                }


                //Survey = await _BaseRepository.GetObjectByIdAsync(Survey.Id);
                Survey = await _BaseRepository.GetSingleObjectFullInclude(s => s.Id == surveyData.Survey.Id);
                result = new
                {
                    status = "data updated",
                    data = Survey,
                    progressvalue = 50,
                    type = "inprogress"
                };
                if (!string.IsNullOrEmpty(surveyData.connectionId))
                    await _hubContext.Clients.Client(surveyData.connectionId).SendAsync("FileProcessingCompleted", new { surveyData = result, connectionId = surveyData.connectionId });

                if (surveyData.autoSavedFlag)
                {
                    DataUtil.ExecuteStoredProcedureReturn(_BaseRepository._logConnectionString, "sp_WriteLogs",
                             ("@Message", $"{docPath} auto-saved complete!")
                             , ("@TimeStamp", DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"))
                             , ("@MessageTemplate", $"{docPath} auto-saved complete!")
                             , ("@Properties", "")
                             , ("@Level", "Information")
                             , ("@User", CURRENT_USER)
                             , ("@Exception", ""));
                }

                if (!surveyData.autoSavedFlag)
                {
                    tasks.Add(Task.Run(async () =>
                    {
                        try
                        {
                            WordHandleConfig wordHandleConfig = new WordHandleConfig();
                            wordHandleConfig.BlobPath = BLOB_PATH;
                            wordHandleConfig.MainProcessPathFolder = nameof(Survey);
                            wordHandleConfig.TemplatePath = PATH_TEMPLATE;
                            if (Survey.SurveyTypeEnum != null)
                            {
                                if (Survey.SurveyTypeEnum.Key == "Factory")
                                    wordHandleConfig.TemplatePath = PATH_TEMPLATE; /// Sửa tại đây
                                if (Survey.SurveyTypeEnum.Key == "Warehouse")
                                    wordHandleConfig.TemplatePath = W_PATH_TEMPLATE; /// Sửa tại đây
                            }
                            wordHandleConfig.LabelWordPath = LABEL_WORD_PATH;
                            wordHandleConfig.LogoWordPath = LOGO_WORD_PATH;
                            wordHandleConfig.NoImagePath = NO_IMAGE;
                            var result = new
                            {
                                status = "Word generate...",
                                data = Survey,
                                progressvalue = 75,
                                type = "inprogress"
                            };
                            if (!string.IsNullOrEmpty(surveyData.connectionId))
                                await _hubContext.Clients.Client(surveyData.connectionId).SendAsync("FileProcessingCompleted", new { surveyData = result, connectionId = surveyData.connectionId });
                            //WordHelper.GenerateWord(Survey, PATH_TEMPLATE, nameof(Survey), BLOB_PATH, _BaseRepository._connectionString, NO_IMAGE);
                            WordHelper.GenerateWord(Survey, wordHandleConfig, _BaseRepository._connectionString);
                            DataUtil.ExecuteStoredProcedureReturn(_BaseRepository._logConnectionString, "sp_WriteLogs",
                              ("@Message", $"{docPath} saving complete!")
                              , ("@TimeStamp", DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"))
                              , ("@MessageTemplate", $"{docPath} saving complete!")
                              , ("@Properties", "")
                              , ("@Level", "Information")
                              , ("@User", CURRENT_USER)
                              , ("@Exception", ""));
                            surveyUpdateRenderStatus = Survey;
                            surveyUpdateRenderStatus.WordRendered = true;
                            result = new
                            {
                                status = "saved !",
                                data = Survey,
                                progressvalue = 100,
                                type = "success"
                            };
                            if (!string.IsNullOrEmpty(surveyData.connectionId))
                                await _hubContext.Clients.Client(surveyData.connectionId).SendAsync("FileProcessingCompleted", new { surveyData = result, connectionId = surveyData.connectionId });
                            //Log.Information($"Send saved back to {_httpContextAccessor?.HttpContext?.User?.Identity?.Name}");
                            DataUtil.ExecuteStoredProcedureReturn(_BaseRepository._logConnectionString, "sp_WriteLogs",
                                ("@Message", $"Update Survey trigged from {CURRENT_USER}")
                                , ("@TimeStamp", DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"))
                                , ("@MessageTemplate", $"Update Survey trigged {CURRENT_USER}")
                                , ("@Properties", "")
                                , ("@Level", "Information")
                                , ("@User", CURRENT_USER)
                                , ("@Exception", ""));
                            await _BaseRepository.UpdateData(surveyUpdateRenderStatus, JsonConvert.SerializeObject(surveyUpdateRenderStatus), surveyData.Survey.Id, "Id");

                        }
                        catch (Exception ex)
                        {
                            result = new
                            {
                                status = "save error!",
                                data = returnSurvey,
                                progressvalue = 0,
                                type = "error"
                            };
                            //ControllerHelper.SeriLog(_logger, ex);
                            if (!string.IsNullOrEmpty(surveyData.connectionId))
                                await _hubContext.Clients.Client(surveyData.connectionId).SendAsync("FileProcessingCompleted", new { surveyData = result, connectionId = surveyData.connectionId, errorMsg = ex.Message });
                            Log.Error(ex, ex.Message);
                        }
                    }));
                }
                Task.WhenAll(tasks);
            }
            catch (Exception ex)
            {
                var result = new
                {
                    status = "save error!",
                    data = returnSurvey,
                    progressvalue = 0,
                    type = "error"
                };
                //ControllerHelper.SeriLog(_logger, ex);
                if (!string.IsNullOrEmpty(surveyData.connectionId))
                    await _hubContext.Clients.Client(surveyData.connectionId).SendAsync("FileProcessingCompleted", new { surveyData = result, connectionId = surveyData.connectionId, errorMsg = ex.Message });
                Log.Error(ex, ex.Message);
            }
        }
        else
        {
            var result = new
            {
                status = "save error!",
                data = returnSurvey,
                progressvalue = 0,
                type = "error"
            };
            //ControllerHelper.SeriLog(_logger, ex);
            if (!string.IsNullOrEmpty(surveyData.connectionId))
                await _hubContext.Clients.Client(surveyData.connectionId).SendAsync("FileProcessingCompleted", new { surveyData = result, connectionId = surveyData.connectionId, errorMsg = "Null Survey" });
            Log.Error(new Exception("Null Survey"), "Null Survey");
            return Ok(surveyData.Survey);
        }
        return Ok(surveyData.Survey);
    }
    #endregion

    #region Functions
    public MiniWordPicture MakeMiniWordPicture(string subPath, Int64 width = 375, Int64 height = 257)
    {
        //var path = _BaseRepository._baseConfiguration.GetSection("BlobStorage:Path");

        MiniWordPicture miniWordPicture = new MiniWordPicture();
        miniWordPicture.Path = Path.Combine(BLOB_PATH, System.IO.File.Exists(miniWordPicture.Path) ? subPath : NO_IMAGE);
        miniWordPicture.Width = width;
        miniWordPicture.Height = height;
        return miniWordPicture;
    }

    public static MemoryStream ReadAllBytesToMemoryStream(string path)
    {
        byte[] buffer = System.IO.File.ReadAllBytes(path);
        var destStream = new MemoryStream(buffer.Length);
        destStream.Write(buffer, 0, buffer.Length);
        destStream.Seek(0, SeekOrigin.Begin);
        return destStream;
    }

    public Dictionary<string, object> MakeQueryIntoDirectory(dynamic survey)
    {
        var dictionary = new Dictionary<string, object>();
        var properties = survey.GetType().GetProperties();

        foreach (var property in properties)
        {
            var value = property.GetValue(survey)?.ToString();
            if (!string.IsNullOrWhiteSpace(value))
            {
                if (property.Name == "DueDate")
                {
                    DateTime? dueDate = DateTime.Parse(value.ToString());
                    string formattedDate = dueDate?.ToString("dd/MM/yyyy");
                    dictionary.Add($"@@{char.ToLower(property.Name[0])}{property.Name.Substring(1)}", formattedDate);
                }
                else
                    dictionary.Add($"@@{char.ToLower(property.Name[0])}{property.Name.Substring(1)}", value);
            }
        }
        return dictionary;
    }

    public Dictionary<string, object> MakeQueryIntoDirectory(DataRow row)
    {
        var dictionary = new Dictionary<string, object>();
        if (row != null)
        {
            // Lấy danh sách các cột từ DataRow
            foreach (DataColumn column in row.Table.Columns)
            {
                // Lấy giá trị và chuẩn hóa về chuỗi
                var value = row[column.ColumnName]?.ToString();

                if (!string.IsNullOrWhiteSpace(value))
                {
                    string propertyName = column.ColumnName;

                    if (propertyName == "DueDate")
                    {
                        DateTime? dueDate = DateTime.Parse(value);
                        string formattedDate = dueDate?.ToString("dd/MM/yyyy");
                        dictionary.Add($"@@{char.ToLower(propertyName[0])}{propertyName.Substring(1)}", formattedDate);
                    }
                    else
                    {
                        dictionary.Add($"@@{char.ToLower(propertyName[0])}{propertyName.Substring(1)}", value);
                    }
                }
            }
        }
        return dictionary;
    }
    public async Task<ActionResult> ConcatenateFile()
    {
        string filePath = _BaseRepository._baseConfiguration.GetSection("BlobStorage:Path").Value;
        string file1 = Path.Combine(filePath, "Survey\\SVRE.1124.122_ConstructionBuildingPivot.html");
        string file2 = Path.Combine(filePath, "Survey\\TestDoc.docx");
        string stringFile1 = System.IO.File.ReadAllText(file1);



        //    string output = Path.Combine(filePath, "Survey\\output.docx");


        //    string placeholder = "{{productionprocesscontent}}";

        //    WordUtil.InsertDocumentContentAtPlaceholder(PATH_TEMPLATE, file2, output, placeholder);

        // Tạo tài liệu đích
        //using (WordprocessingDocument outputDoc = WordprocessingDocument.Create(output, DocumentFormat.OpenXml.WordprocessingDocumentType.Document))
        using (WordprocessingDocument outputDoc = WordprocessingDocument.Create(file2, DocumentFormat.OpenXml.WordprocessingDocumentType.Document))
        {
            outputDoc.AddMainDocumentPart();
            outputDoc.MainDocumentPart.Document = new Document(new Body());
            HtmlConverter converter = new HtmlConverter(outputDoc.MainDocumentPart);
            string htmlContent = stringFile1;
            var elements = converter.Parse(htmlContent).ToArray();

            foreach (var element in elements)
            {
                //WordUtil.ReplaceImageIds(outputDoc.MainDocumentPart, null, element);
            }
            outputDoc.MainDocumentPart.Document.Body.Append(elements);
            //        // Thêm MainDocumentPart vào tài liệu đích
            //        outputDoc.AddMainDocumentPart();
            //        outputDoc.MainDocumentPart.Document = new Document(new Body());

            //        // Kết hợp tài liệu đầu tiên
            //        WordUtil.AppendDocument(outputDoc.MainDocumentPart, file1);

            //        // Thêm ngắt trang giữa hai tài liệu
            //        WordUtil.AddPageBreak(outputDoc);

            //        // Kết hợp tài liệu thứ hai
            //        WordUtil.AppendDocument(outputDoc.MainDocumentPart, file2);
            outputDoc.Save();
        }

        return Ok();
    }

    public async Task<StepsWorkflow> GetWF(Survey survey)
    {
        List<StepsWorkflow> stepsWorkflow = new List<StepsWorkflow>();
        StepsWorkflow stepWorkflow = new StepsWorkflow();
        stepsWorkflow = await _stepsWorkFlowRepository.GetListObjectFullInclude(s => s.Entity == nameof(Survey)

        , i => i.FlowMailTemplateFK, i => i.NotifyMailTemplateFK, i => i.ReturnMailTemplateFK);
        //stepsWorkflow.ForEach(async f =>
        //{
        //    f = await _stepsWorkFlowRepository.IncludeSpecificField(f, "Flow", i => i.FlowMailTemplateFK);
        //    f = await _stepsWorkFlowRepository.IncludeSpecificField(f, "Notify", i => i.NotifyMailTemplateFK);
        //    f = await _stepsWorkFlowRepository.IncludeSpecificField(f, "Return", i => i.ReturnMailTemplateFK);
        //});
        InstanceWorkflow instanceWorkflow = new InstanceWorkflow();
        instanceWorkflow = await _instanceWorkFlowRepository.GetSingleObjectFullInclude(s => s.RecordGuid == survey.Guid, f => f.UserWorkflowFK);
        if (instanceWorkflow != null)
        {
            survey.InstanceWorkflowFK = instanceWorkflow;
            //survey.InstanceWorkflowFK = await _instanceWorkFlowRepository.ObjectSpecificInclude(survey.InstanceWorkflowFK, f => f.UserWorkflowFK);
            survey.InstanceWorkflowFK.UserWorkflowFK = await _userWorkFlowRepository.ObjectSpecificInclude(survey.InstanceWorkflowFK.UserWorkflowFK, f => f.UsersFK);
            survey.InstanceWorkflowFK.UserWorkflowFK = await _userWorkFlowRepository.IncludeSpecificField(survey.InstanceWorkflowFK.UserWorkflowFK, "Checker", f => f.CheckerUsersFK);
            survey.InstanceWorkflowFK.UserWorkflowFK = await _userWorkFlowRepository.IncludeSpecificField(survey.InstanceWorkflowFK.UserWorkflowFK, "Approver", f => f.ApproverUsersFK);
            //int stepDirection = (upDownStep == "Up" ? UpStep(survey) : DownStep(survey));
            stepWorkflow = stepsWorkflow.FirstOrDefault(f => f.Steps == survey.InstanceWorkflowFK.CurrentStep);
            if (survey.InstanceWorkflowFK?.RuleNo == 1)
            {
                stepWorkflow = stepsWorkflow.FirstOrDefault(f => f.Steps == 3);
                //stepWorkflow.Steps = 4;
            }
        }
        return stepWorkflow;
    }
    public async Task<Attachment> UploadAttachment(AttachmentRequest file)
    {
        //var path = _BaseRepository._baseConfiguration.GetSection("BlobStorage:Path");
        IBaseRepository<Attachment> _attachmentRepository = new BaseRepository<Attachment>(_BaseRepository._baseConfiguration, _httpContextAccessor);
        //var storageFolder = _blobStorageSettings.CurrentValue.Path;
        if (file != null)
        {
            using (var ms = new MemoryStream())
            {
                byte[] fileBytes = Array.ConvertAll(file.fileData, b => (byte)b); ;
                string s = Convert.ToBase64String(fileBytes);
                if (!System.IO.Directory.Exists(BLOB_PATH))
                    Directory.CreateDirectory(BLOB_PATH);
                if (!System.IO.Directory.Exists(Path.Combine(BLOB_PATH, file?.modelName)))
                    Directory.CreateDirectory(Path.Combine(BLOB_PATH, file.modelName));
                //var unixMilliseconds = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
                Attachment attachment = new Attachment();
                //attachment.SubDirectory = Path.Combine(file.modelName, $"{unixMilliseconds}_{file.fileName}");
                //attachment.FileName = $"{unixMilliseconds}_{file.fileName}";
                //attachment.FileType = Path.GetExtension($"{unixMilliseconds}_{file.fileName}");
                //attachment.OutlineId = file.outlineId;
                attachment = Util.BindingAttachment(BLOB_PATH, file.modelName, file.fileName, fileBytes, file);
                attachment.ItemWidth = file.attachment.width;
                attachment.ItemHeight = file.attachment.height;
                //System.IO.File.WriteAllBytes(Path.Combine(path.Value, file.modelName, $"{unixMilliseconds}_{file.fileName}"), fileBytes);
                return attachment;
            }
        }
        else
            return new Attachment();
    }
    #endregion

    [HttpDelete]
    public override async Task<IActionResult> DeleteData([FromForm] DeleteFormCollection form)
    {
        var entity = new Survey();
        entity = await _BaseRepository.DeleteData(entity, form.key, "Id", false);
        return Ok(entity);
    }




    //tasks.Add(Task.Run(async () =>
    //{
    //    if (data != null)
    //    {
    //        //Attachment attachment = new Attachment();
    //        //attachment = await _attachmentRepository.InsertData(data.Item1);
    //        //SitePictures sitePictures = new SitePictures();
    //        //sitePictures = data.Item2;
    //        //sitePictures.AttachmentId = attachment.Id;
    //        //_sitePicturesRepository.InsertData(sitePictures);
    //    }
    //}));

}

