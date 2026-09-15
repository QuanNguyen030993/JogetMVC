using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using ERPCore.Controllers.Base;
using ERPCore.Models.Migration.Business.Data;
using ERPCore.Models.Request;
using ERPCore.Models.Models.Parsing;

[ApiController]
[Route("api/[controller]/[action]")]
public class PolicyIssuanceSubDetailsController : BaseControllerApi<PolicyIssuanceSubDetails>
{
    private readonly IBaseRepository<PolicyIssuanceSubDetails> _BaseRepository;
	private readonly IBaseRepository<PolicyIssuance> _policyIssuanceRepository;
	private readonly IConfiguration configuration;

	public PolicyIssuanceSubDetailsController(
        IBaseRepository<PolicyIssuanceSubDetails> BaseRepository,
        IBaseRepository<PolicyIssuance> policyIssuanceRepository,
        IConfiguration config,
        IHttpContextAccessor httpContextAccessor) : base(BaseRepository,httpContextAccessor)
    {
        configuration = config;
        _BaseRepository = BaseRepository;
        _policyIssuanceRepository = policyIssuanceRepository;
    }

    [HttpGet("{sourceType}/{sourceId:long}")]
    public async Task<ActionResult<List<PolicyIssuanceSubDetails>>> GetPaProcess(
        string sourceType,
        long sourceId)
    {
        if (sourceId <= 0)
        {
            return BadRequest(new { message = "PA Process source id must be greater than zero." });
        }

        long? policyIssuanceId = null;
        if (string.Equals(sourceType, "Quotation", StringComparison.OrdinalIgnoreCase))
        {
            // A Quotation can be viewed before its Policy Issuance section is opened.
            // Resolve the attached Policy Issuance first, then use its id to filter PA rows.
            var linkedPolicyIssuances = await _policyIssuanceRepository.GetListObject(item =>
                item.QuotationId == sourceId &&
                item.Deleted == false);

            policyIssuanceId = linkedPolicyIssuances
                .OrderByDescending(item => item.Id)
                .Select(item => (long?)item.Id)
                .FirstOrDefault();
        }
        else if (string.Equals(sourceType, "PolicyIssuance", StringComparison.OrdinalIgnoreCase))
        {
            policyIssuanceId = sourceId;
        }
        else
        {
            return BadRequest(new
            {
                message = "PA Process source type must be Quotation or PolicyIssuance."
            });
        }

        if (!policyIssuanceId.HasValue)
        {
            return Ok(new List<PolicyIssuanceSubDetails>());
        }

        // Preserve DevExtreme load options (filter, sort, skip, take...) and add the
        // resolved relationship through the repository interface's dynamic filter.
        var requestParams = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        foreach (var item in HttpContext.Request.Query)
        {
            if (!string.Equals(item.Key, "_", StringComparison.OrdinalIgnoreCase))
            {
                requestParams[item.Key] = item.Value.ToString();
            }
        }

        requestParams["refField"] = nameof(PolicyIssuanceSubDetails.PolicyIssuanceId);
        requestParams["refKey"] = policyIssuanceId.Value.ToString();
        requestParams["refOperator"] = "=";

        var rows = await _BaseRepository.GetByDynamicField(
            new List<DynamicFieldFilter>(),
            requestParams);

        return Ok(rows ?? new List<PolicyIssuanceSubDetails>());
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

