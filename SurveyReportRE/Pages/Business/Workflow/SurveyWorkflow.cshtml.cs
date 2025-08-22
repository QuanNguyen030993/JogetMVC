using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using SurveyReportRE.Models.Migration.Business.MasterData;
using SurveyReportRE.Models.Migration.Business.Workflow;

namespace SurveyReportRE.Pages
{
    public class SurveyWorkflowModel : PageModel
    {
        //private readonly ILogger<SurveyWorkflowModel> _logger;
        public static string ModelName { get; set; } = "";

        public SurveyWorkflowModel(ILogger<SurveyWorkflowModel> logger)
        {
            //_logger = logger;
        }

        public void OnGet()
        {
            ModelName = nameof(SurveyWorkflow);
            ViewData["Model"] = nameof(SurveyWorkflow);
        }
    }
}
