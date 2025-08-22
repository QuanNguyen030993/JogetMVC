using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using SurveyReportRE.Models.Migration.Business.MasterData;
using SurveyReportRE.Models.Migration.Business.Workflow;

namespace SurveyReportRE.Pages
{
    public class SurveyActionConfigModel : PageModel
    {
        //private readonly ILogger<SurveyActionConfigModel> _logger;
        public static string ModelName { get; set; } = "";

        public SurveyActionConfigModel(ILogger<SurveyActionConfigModel> logger)
        {
            //_logger = logger;
        }

        public void OnGet()
        {
            ModelName = nameof(SurveyActionConfig);
            ViewData["Model"] = nameof(SurveyActionConfig);
        }
    }
}
