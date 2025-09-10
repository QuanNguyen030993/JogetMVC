using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using SurveyReportRE.Models.Migration.Business.MasterData;
using SurveyReportRE.Models.Migration.Business.Workflow;

namespace SurveyReportRE.Pages
{
    public class PolicyIssuanceRequestModel : PageModel
    {
        //private readonly ILogger<PolicyIssuanceRequest> _logger;
        public static string ModelName { get; set; } = "";

        public PolicyIssuanceRequestModel(ILogger<PolicyIssuanceRequestModel> logger)
        {
            //_logger = logger;
        }

        public void OnGet()
        {
            ModelName = nameof(PolicyIssuanceRequest);
            ViewData["Model"] = nameof(PolicyIssuanceRequest);
        }
    }
}
