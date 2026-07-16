using ERPCore.Controllers.Base;
using ERPCore.Models.Migration.Business.MasterData;
using ERPCore.Models.Request;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]/[action]")]
public class ChecklistDefinitionController : BaseControllerApi<ChecklistDefinition>
{
    public ChecklistDefinitionController(
        IBaseRepository<ChecklistDefinition> repository,
        IHttpContextAccessor httpContextAccessor)
        : base(repository, httpContextAccessor)
    {
    }
}
