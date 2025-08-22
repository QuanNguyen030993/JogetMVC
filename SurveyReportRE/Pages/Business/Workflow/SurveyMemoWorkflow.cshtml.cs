using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using SurveyReportRE.Models.Migration.Business.MasterData;
using SurveyReportRE.Models.Migration.Business.Workflow;

namespace SurveyReportRE.Pages
{
    public class SurveyMemoWorkflowModel : PageModel
    {
        //private readonly ILogger<SurveyMemoWorkflowModel> _logger;
        public static string ModelName { get; set; } = "";

        public SurveyMemoWorkflowModel(ILogger<SurveyMemoWorkflowModel> logger)
        {
            //_logger = logger;
        }

        public void OnGet()
        {
            ModelName = nameof(SurveyMemoWorkflow);
            ViewData["Model"] = nameof(SurveyMemoWorkflow);
        }
    }
}
