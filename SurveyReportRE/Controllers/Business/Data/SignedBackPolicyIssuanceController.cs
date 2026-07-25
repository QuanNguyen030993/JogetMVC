using ERPCore.Controllers.Base;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]/[action]")]
public class SignedBackPolicyIssuanceController
    : BaseControllerApi<SignedBackPolicyIssuance>
{
    public SignedBackPolicyIssuanceController(
        IBaseRepository<SignedBackPolicyIssuance> repository,
        IHttpContextAccessor httpContextAccessor)
        : base(repository, httpContextAccessor)
    {
    }
}
