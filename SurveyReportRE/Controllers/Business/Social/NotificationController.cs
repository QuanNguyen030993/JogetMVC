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

[ApiController]
[Route("api/[controller]/[action]")]
public class NotificationController : BaseControllerApi<Notification>
{
    private readonly IBaseRepository<Notification> _BaseRepository;
    private readonly IConfiguration configuration;
    private readonly IHubContext<FileProcessingHub> _hubContext;
    private string DOMAIN_NAME = "";
    public NotificationController(IBaseRepository<Notification> BaseRepository
        , IConfiguration config
        , IHttpContextAccessor httpContextAccessor
        , IHubContext<FileProcessingHub> hubContext) : base(BaseRepository, httpContextAccessor)
    {
        configuration = config;
        _BaseRepository = BaseRepository;
        _hubContext = hubContext;
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



    [AllowAnonymous]
    [InternalTokenAuthorize]
    [HttpPost]
    public async Task<IActionResult> Notify([FromBody] NotificationRequest notification)
    {

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
            await _hubContext.Clients.Client(onlineUser?.ConnectionId).SendAsync("NotificationReceive",
                      new
                      {
                          title = notification?.Notification?.Title ?? "",
                          message = notification?.Notification?.Message ?? ""
                      });
        }

        return Ok();
    }

  

}

