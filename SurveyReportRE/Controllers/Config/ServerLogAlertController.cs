using ERPCore.ControllerUtil;
using ERPCore.Models.Migration.Business.HumanResource;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]/[action]")]
public sealed class ServerLogAlertController : ControllerBase
{
    private readonly IConfiguration _configuration;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IBaseRepository<Employee> _employeeRepository;

    public ServerLogAlertController(
        IConfiguration configuration,
        IHttpContextAccessor httpContextAccessor,
        IBaseRepository<Employee> employeeRepository)
    {
        _configuration = configuration;
        _httpContextAccessor = httpContextAccessor;
        _employeeRepository = employeeRepository;
    }

    [HttpGet]
    public async Task<IActionResult> Detail(string id)
    {
        string account = ControllerUtil.GetCurrentContextUser(_httpContextAccessor, _configuration);
        if (!await CanViewTechnicalErrorsAsync(account)) return Forbid();

        return RealtimeErrorLogSink.TryGetDetail(id, out RealtimeErrorLogDetail? detail)
            ? Ok(detail)
            : NotFound(new { message = "This exception detail has expired or is unavailable." });
    }

    private async Task<bool> CanViewTechnicalErrorsAsync(string account)
    {
        if (ControllerUtil.IsSuperUser(_configuration, account)) return true;

        Employee? employee = await _employeeRepository.GetSingleObjectFullInclude(
            item => item.AccountName == account,
            null,
            item => item.SystemRolesFK);
        return string.Equals(
            employee?.SystemRolesFK?.RoleName?.Trim(),
            "IT",
            StringComparison.OrdinalIgnoreCase);
    }
}
