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

        //    var urlObj = new
        //    {
        //        url = $"/Business/Request/{nameof(MKTSurveyRequest)}_Form/{mKTSurveyRequest.Id}",
        //        caption = $"form_{nameof(MKTSurveyRequest)}_Form_{mKTSurveyRequest.Id}",
        //        name = $"{nameof(MKTSurveyRequest)} {mKTSurveyRequest.TicketNo}",
        //        data = ""
        //    };

        //    //notification.Notification.Url = $"/Business/Request/${nameof(MKTSurveyRequest)}_Form/{mKTSurveyRequest.Id}";
        //    notification.Notification.Url = JsonSerializer.Serialize(urlObj);
        //    await _BaseRepository.InsertData(notification.Notification);

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

