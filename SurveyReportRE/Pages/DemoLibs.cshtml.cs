using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace SurveyReportRE.Pages
{
    public class ApprovalModel : PageModel
    {
        private readonly ILogger<ApprovalModel> _logger;

        public ApprovalModel(ILogger<ApprovalModel> logger)
        {
            _logger = logger;
        }

        public void OnGet()
        {

        }
    }
}
