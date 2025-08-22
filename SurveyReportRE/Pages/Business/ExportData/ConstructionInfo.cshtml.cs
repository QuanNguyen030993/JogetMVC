using Microsoft.AspNetCore.Mvc.RazorPages;
using SurveyReportRE.Models.Migration.Business.ExportData;

namespace SurveyReportRE.Pages
{
    public class ConstructionInfoModel : PageModel
    {
        //private readonly ILogger<ConstructionInfoModel> _logger;
        public static string ModelName { get; set; } = "";

        public ConstructionInfoModel(ILogger<ConstructionInfoModel> logger)
        {
            //_logger = logger;
        }

        public void OnGet()
        {
            ModelName = nameof(ConstructionInfo);
            ViewData["Model"] = nameof(ConstructionInfo);
        }
    }
}
