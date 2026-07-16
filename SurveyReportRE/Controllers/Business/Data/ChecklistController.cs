using ERPCore.Controllers.Base;
using ERPCore.Models.Migration.Business.Data;
using ERPCore.Models.Request;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]/[action]")]
public class ChecklistController : BaseControllerApi<Checklist>
{
    public ChecklistController(
        IBaseRepository<Checklist> repository,
        IHttpContextAccessor httpContextAccessor)
        : base(repository, httpContextAccessor)
    {
    }
}
