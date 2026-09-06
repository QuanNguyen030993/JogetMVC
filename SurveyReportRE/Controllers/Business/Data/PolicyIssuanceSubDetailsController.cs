using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using ERPCore.Controllers.Base;
using ERPCore.Models.Migration.Business.Data;
using ERPCore.Models.Request;

[ApiController]
[Route("api/[controller]/[action]")]
public class PolicyIssuanceSubDetailsController : BaseControllerApi<PolicyIssuanceSubDetails>
{
    private readonly IBaseRepository<PolicyIssuanceSubDetails> _BaseRepository;
	private readonly IConfiguration configuration;

	public PolicyIssuanceSubDetailsController(IBaseRepository<PolicyIssuanceSubDetails> BaseRepository, IConfiguration config,IHttpContextAccessor httpContextAccessor) : base(BaseRepository,httpContextAccessor)
    {
        configuration = config;
        _BaseRepository = BaseRepository;
    }

    [HttpGet]
    public async Task<IActionResult> GetPolicyNumbers(long? clientId, string? clientName)
    {
        string normalizedClientName = clientName?.Trim() ?? string.Empty;
        if (!clientId.HasValue && string.IsNullOrWhiteSpace(normalizedClientName))
        {
            return Ok(Array.Empty<object>());
        }

        List<PolicyIssuanceSubDetails> rows = new();

        // ClientId is the stable lookup key. ClientName is retained as a fallback
        // for legacy rows whose ClientId was not populated.
        if (clientId.HasValue)
        {
            rows = await _BaseRepository.GetListObject(item =>
                item.ClientId == clientId.Value &&
                item.Deleted == false);
        }

        var policyNumbers = rows
            .Select(item => item.PolicyNo?.Trim())
            .Where(policyNo => !string.IsNullOrWhiteSpace(policyNo))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (policyNumbers.Count == 0 && !string.IsNullOrWhiteSpace(normalizedClientName))
        {
            rows = await _BaseRepository.GetListObject(item =>
                item.ClientName == normalizedClientName &&
                item.Deleted == false);

            policyNumbers = rows
                .Select(item => item.PolicyNo?.Trim())
                .Where(policyNo => !string.IsNullOrWhiteSpace(policyNo))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();
        }

        var result = policyNumbers
            .OrderBy(policyNo => policyNo, StringComparer.OrdinalIgnoreCase)
            .Select(policyNo => new { policyNo })
            .ToList();

        return Ok(result);
    }

}

