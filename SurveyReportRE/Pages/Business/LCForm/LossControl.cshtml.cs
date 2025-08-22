using Microsoft.AspNetCore.Mvc.RazorPages;
using SurveyReportRE.Models.Migration.Business.LCForm;
using SurveyReportRE.Models.Migration.Business.MasterData;

namespace SurveyReportRE.Pages
{
    public class LossControlModel : PageModel
    {
        //private readonly ILogger<LossControlModel> _logger;
        public static string ModelName { get; set; } = "";

        public LossControlModel(ILogger<LossControlModel> logger)
        {
            //_logger = logger;
        }

        public void OnGet()
        {
            ModelName = nameof(LossControl);
            ViewData["Model"] = nameof(LossControl);
        }
    }
}
