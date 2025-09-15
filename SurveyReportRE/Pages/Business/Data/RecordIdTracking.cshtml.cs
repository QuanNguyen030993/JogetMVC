using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using SurveyReportRE.Models.Migration.Business.MasterData;
using SurveyReportRE.Models.Migration.Business.Workflow;

namespace SurveyReportRE.Pages
{
    public class RecordIdTrackingModel : PageModel
    {
        //private readonly ILogger<RecordIdTracking> _logger;
        public static string ModelName { get; set; } = "";

        public RecordIdTrackingModel(ILogger<RecordIdTrackingModel> logger)
        {
            //_logger = logger;
        }

        public void OnGet()
        {
            ModelName = nameof(RecordIdTracking);
            ViewData["Model"] = nameof(RecordIdTracking);
        }
    }
}
