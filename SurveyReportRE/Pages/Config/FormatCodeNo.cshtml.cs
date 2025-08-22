using Microsoft.AspNetCore.Mvc.RazorPages;
using SurveyReportRE.Models.Migration.Config;

namespace SurveyReportRE.Pages
{
    public class FormatCodeNoModel : PageModel
    {
        private readonly ILogger<FormatCodeNoModel> _logger;
        public static string ModelName { get; set; } = "";

        public FormatCodeNoModel(ILogger<FormatCodeNoModel> logger)
        {
            _logger = logger;
        }

        public void OnGet()
        {
            ModelName = nameof(FormatCodeNo);
            ViewData["Model"] = nameof(FormatCodeNo);
        }
    }
}
