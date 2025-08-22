using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using SurveyReportRE.Models.Migration.Business.MasterData;
using SurveyReportRE.Models.Migration.Business.Workflow;

namespace SurveyReportRE.Pages
{
    public class StepsWorkflowModel : PageModel
    {
        //private readonly ILogger<StepsWorkflowModel> _logger;
        public static string ModelName { get; set; } = "";

        public StepsWorkflowModel(ILogger<StepsWorkflowModel> logger)
        {
            //_logger = logger;
        }

        public void OnGet()
        {
            ModelName = nameof(StepsWorkflow);
            ViewData["Model"] = nameof(StepsWorkflow);
        }
    }
}
