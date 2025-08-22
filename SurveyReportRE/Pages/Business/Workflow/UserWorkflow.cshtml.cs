using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using SurveyReportRE.Models.Migration.Business.MasterData;
using SurveyReportRE.Models.Migration.Business.Workflow;

namespace SurveyReportRE.Pages
{
    public class UserWorkflowModel : PageModel
    {
        private readonly ILogger<UserWorkflowModel> _logger;
        public static string ModelName { get; set; } = "";

        public UserWorkflowModel(ILogger<UserWorkflowModel> logger)
        {
            _logger = logger;
        }

        public void OnGet()
        {
            ModelName = nameof(UserWorkflow);
            ViewData["Model"] = nameof(UserWorkflow);
        }
    }
}
