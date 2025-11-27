using Microsoft.AspNetCore.Mvc.RazorPages;
using SurveyReportRE.Models.Migration.Business.Config;

namespace SurveyReportRE.Pages
{
    public class EnvironmentModel : PageModel
    {
        private readonly ILogger<EnvironmentModel> _logger;
        public static string ModelName { get; set; } = "";

        public EnvironmentModel(ILogger<EnvironmentModel> logger)
        {
            _logger = logger;
        }

        public void OnGet()
        {
            ModelName = nameof(Environment);
            ViewData["Model"] = nameof(Environment);
        }
    }
}
