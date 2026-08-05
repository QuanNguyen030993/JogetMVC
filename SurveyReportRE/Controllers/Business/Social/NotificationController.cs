using DocumentFormat.OpenXml.Math;
using ERPCore.Controllers.Base;
using ERPCore.ControllerUtil;
using ERPCore.Models.Migration.Config;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using RESurveyTool.Models.Models.Parsing;
using Serilog;
using ERPCore.Common;
using ERPCore.Controllers.Base;
using ERPCore.ControllerUtil;
using ERPCore.Models.Migration.Business.Data;
using ERPCore.Models.Migration.Config;
using System.Text.Json;
using ERPCore.Models.Migration.Business.Social;
using ERPCore.Models.Business.Migration.Config;
using ERPCore.Models.Request;
using HtmlAgilityPack;
using ERPCore.Models.Migration.Business.MasterData;


[ApiController]
[Route("api/[controller]/[action]")]
public class NotificationController : BaseControllerApi<Notification>
{
    private readonly IBaseRepository<Notification> _BaseRepository;
    private readonly IConfiguration configuration;
    private readonly IHubContext<FileProcessingHub> _hubContext;
    private readonly IBaseRepository<EnumData> _enumDataRepository;
    private readonly IBaseRepository<NotificationTemplate> _notificationTemplateRepository;
    private readonly IBaseRepository<UsersSession> _usersSessionRepository;
    private readonly IBaseRepository<Quotation> _quotationRepository;
    private readonly IBaseRepository<PolicyIssuance> _policyIssuanceRepository;

    private string DOMAIN_NAME = "";
    public NotificationController(IBaseRepository<Notification> BaseRepository
        , IConfiguration config
        , IHttpContextAccessor httpContextAccessor
        , IHubContext<FileProcessingHub> hubContext) : base(BaseRepository, httpContextAccessor)
    {
        configuration = config;
        _BaseRepository = BaseRepository;
        _hubContext = hubContext;
        _enumDataRepository = new BaseRepository<EnumData>(configuration, _httpContextAccessor);
        _usersSessionRepository = new BaseRepository<UsersSession>(configuration, _httpContextAccessor);
        _notificationTemplateRepository = new BaseRepository<NotificationTemplate>(configuration, _httpContextAccessor);
        _quotationRepository = new BaseRepository<Quotation>(configuration, _httpContextAccessor);
        _policyIssuanceRepository = new BaseRepository<PolicyIssuance>(configuration, _httpContextAccessor);
        DOMAIN_NAME = configuration.GetSection("Domain:DCServer").Value;
    }
    [HttpPost]
    public async Task<IActionResult> JiraSubmit([FromBody] JiraSubmitRequest request)
    {
        HtmlDocument document = new HtmlDocument();
        document.LoadHtml(request.Content);
        var imgs = document.DocumentNode.SelectNodes("//img");
        string contentEmail = configuration.GetSection("SupportConfig:ContentSupport").Value;
        string submitContent = string.Format(contentEmail, request.CodeNo, request.Content);
        //if (imgs != null)
        //{
        //    foreach (var img in imgs)
        //    {
        //        var src = img.GetAttributeValue("src", null);
        //        string base64Data = "";
        //        string base64Pattern = @"data:image/\w+;base64,([^""]+)";
        //        Match match = Regex.Match(img.OuterHtml, base64Pattern);
        //        if (match.Success)
        //        {
        //            base64Data = match.Groups[1].Value;
        //            byte[] byteArray = Convert.FromBase64String(base64Data);
        //        }
        //        submitContent = $@"<img data-imagetype=""AttachmentByCid"" data-custom=""{src}""";
        //    }
        //}
        string submitEmail = configuration.GetSection("SupportConfig:EmailAddress").Value;
        string title = configuration.GetSection("SupportConfig:Title").Value;
        string emailName = configuration.GetSection("SupportConfig:EmailName").Value;

        string titleContent = string.Format(title, request.ReportType);
        MailItem mailItem = new MailItem();
        mailItem.ToName = emailName;
        mailItem.ToEmail = submitEmail;
        mailItem.Subject = titleContent;
        mailItem.HtmlBody = submitContent;
        mailItem.TextBody = "";
        MailConfig emailSettings = configuration.GetSection("Email").Get<MailConfig>();
        BusinessConfig businessConfig = configuration.GetSection("BusinessConfig").Get<BusinessConfig>();
        var currentUser = ControllerUtil.GetCurrentContextUser(_BaseRepository._httpContextAccessor, configuration);
        string ccAddresses = string.Join(';', $"{currentUser}@tokiomarine.com.vn", $"{emailSettings.FollowCC}");
        mailItem.CC = ccAddresses;
        MailUtil.SendEmail(emailSettings, mailItem, null).Wait();
        return Ok();
    }

    public async Task<IActionResult> CommentNotify(string sendTo, string typeRequest, long id)
    {

        //foreach (string item in transferObject.ReceivedBy.Split(','))
        //{
            NotificationRequest notification = new NotificationRequest();
            Notification Notification = new Notification();
            long? notificationTypeId = 0;

            string eventText = NotificationTypeKeys.Comment;
            notificationTypeId = await NotificationTypeResolver.ResolveIdAsync(
               _enumDataRepository,
               eventText);



            NotificationTemplate notificationTemplate = new NotificationTemplate();
        notificationTemplate = await _notificationTemplateRepository.GetSingleObject(s => s.TemplateName == "Comment" + nameof(Notification));

        //Notification = ControllerUtil.BuildNotification(
        //    transferObject,
        //notificationTypeId,
        //    item,
        //    notificationTemplate,
        //    callerName: nameof(CommentNotify)
        //    );
        dynamic objects = null;

        if (typeRequest == nameof(Quotation))
            {
                Quotation quotation = new Quotation();
                quotation = await _quotationRepository.GetSingleObject(s => s.Id == id);
            objects = new {  Code = quotation.QuotationCode, Guid = quotation.Guid, ModuleName = quotation.GetType().Name, QuotationId = quotation.Id, CopyFromGuid = quotation.Guid };
            }
        if (typeRequest == nameof(PolicyIssuance))
        {
            PolicyIssuance policyIssuance = new PolicyIssuance();
            policyIssuance = await _policyIssuanceRepository.GetSingleObject(s => s.Id == id);
            objects = new { Code = policyIssuance.PolicyIssuanceCode, Guid = policyIssuance.Guid, ModuleName = policyIssuance.GetType().Name, QuotationId = policyIssuance.QuotationId, CopyFromGuid = policyIssuance.CopyFromGuid };
        }
        Notification.Title = notificationTemplate.Title;
            Notification.Message = string.Format(notificationTemplate.Content, ControllerUtil.GetCurrentContextUser(_httpContextAccessor,configuration), typeRequest, objects != null ? objects.Code : "");
            Notification.Resource = $"{ControllerUtil.GetCurrentContextUser(_httpContextAccessor, configuration)}_{typeRequest}_{nameof(CommentNotify)}";
            Notification.System = "WorkflowManagement";
            Notification.ReceivedBy = sendTo;
            Notification.Type = notificationTypeId;
            Notification.Url = Newtonsoft.Json.JsonConvert.SerializeObject(ControllerUtil.NotificationURLObjectMaking(objects));

        //notification.connectionId = item;
        //notification.tabPublicUrl = ControllerUtil.NotificationURLObjectMaking(transferObject);

        await _BaseRepository.InsertData(Notification);
            await ControllerHelper.SignalRResponse(_usersSessionRepository, "R_NotificationReceive",
            new
            {
                title = Notification.Title,
                message = Notification.Message
            }
            , sendTo, DOMAIN_NAME);
        //}
        return Ok(Notification);
    }

    [AllowAnonymous]
    [InternalTokenAuthorize]
    [HttpPost]
    public async Task<IActionResult> Notify([FromBody] NotificationRequest notification)
    {
        if (notification?.Notification == null)
        {
            return BadRequest("Notification payload is required.");
        }

        if (!notification.Notification.Type.HasValue)
        {
            string notificationText = $"{notification.Notification.Title} {notification.Notification.Message}";
            string fallbackType = notificationText.Contains("assign", StringComparison.OrdinalIgnoreCase)
                ? NotificationTypeKeys.Assign
                : NotificationTypeKeys.Default;
            notification.Notification.Type = await NotificationTypeResolver.ResolveIdAsync(
                _enumDataRepository,
                fallbackType);
        }

        IReadOnlyList<OnlineUserDto> onlineUsers = FileProcessingHub._store.GetOnlineUsers();

        OnlineUserDto onlineUser = onlineUsers.FirstOrDefault(f => f.User.Replace(DOMAIN_NAME, "") == notification.connectionId);

        IBaseRepository<FormatCodeNo> _formatCodeNoRepository = new BaseRepository<FormatCodeNo>(configuration, _httpContextAccessor);
        List<FormatCodeNo> tableConfig = new List<FormatCodeNo>();

        //tableConfig = await _formatCodeNoRepository.GetListObjectFullInclude(l => l.NoSeqCode == nameof(MKTSurveyRequest) + "Code");
        //if (notification?.MKTSurveyRequest != null)
        //{
        //    string code = ControllerUtil.GenerateNumberSeq(tableConfig, _formatCodeNoRepository, nameof(MKTSurveyRequest));
        //    MKTSurveyRequest mKTSurveyRequest = new MKTSurveyRequest();
        //    mKTSurveyRequest = notification?.MKTSurveyRequest;
        //    mKTSurveyRequest.TicketNo = code;
        //    mKTSurveyRequest = await _mKTSurveyRequestRepository.InsertData(mKTSurveyRequest);
        //    notification.Notification.RecordGuid = mKTSurveyRequest.Guid;

  

            //notification.Notification.Url = $"/Business/Request/${nameof(MKTSurveyRequest)}_Form/{mKTSurveyRequest.Id}";
            notification.Notification.Url = JsonSerializer.Serialize(notification.tabPublicUrl);
           await _BaseRepository.InsertData(notification.Notification);

        //}
        if (onlineUser?.ConnectionId != null)
        {
            await _hubContext.Clients.Client(onlineUser?.ConnectionId).SendAsync("R_NotificationReceive",
                      new
                      {
                          title = notification?.Notification?.Title ?? "",
                          message = notification?.Notification?.Message ?? ""
                      });
        }

        return Ok();
    }

  

}

