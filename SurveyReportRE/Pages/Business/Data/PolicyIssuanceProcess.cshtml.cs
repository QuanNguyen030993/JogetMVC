using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using ERPCore.Models.Migration.Business.MasterData;
using ERPCore.Models.Migration.Business.Workflow;

namespace ERPCore.Pages
{
    public class PolicyIssuanceProcessModel : PageModel
    {
        //private readonly ILogger<PolicyIssuanceProcess> _logger;
        public static string ModelName { get; set; } = "";

        public PolicyIssuanceProcessModel(ILogger<PolicyIssuanceProcessModel> logger)
        {
            //_logger = logger;
        }

        public void OnGet()
        {
            ModelName = nameof(PolicyIssuanceProcess);
            ViewData["Model"] = nameof(PolicyIssuanceProcess);
        }
    }
}
