using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using SurveyReportRE.Models.Migration.Business.MasterData;
using SurveyReportRE.Models.Migration.Business.Workflow;

namespace SurveyReportRE.Pages
{
    public class ReinsurranceQuarterlyModel : PageModel
    {
        //private readonly ILogger<ReinsurranceQuarterlyModel> _logger;
        public static string ModelName { get; set; } = "";

        public ReinsurranceQuarterlyModel(ILogger<ReinsurranceQuarterlyModel> logger)
        {
            //_logger = logger;
        }

        public void OnGet()
        {
            ModelName = nameof(ReinsurranceQuarterly);
            ViewData["Model"] = nameof(ReinsurranceQuarterly);
        }
    }
}
