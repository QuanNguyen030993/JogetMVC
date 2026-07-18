using ERPCore.Controllers.Base;
using ERPCore.Models.Migration.Business.MasterData;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]/[action]")]
public class NotificationTemplateController : BaseControllerApi<NotificationTemplate>
{
    public NotificationTemplateController(
        IBaseRepository<NotificationTemplate> baseRepository,
        IHttpContextAccessor httpContextAccessor)
        : base(baseRepository, httpContextAccessor)
    {
    }
}
