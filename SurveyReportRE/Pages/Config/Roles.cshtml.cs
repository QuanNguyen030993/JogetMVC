using Microsoft.AspNetCore.Mvc.RazorPages;
using SurveyReportRE.Models.Migration.Business.Config;

namespace SurveyReportRE.Pages
{
    public class RolesModel : PageModel
    {
        private readonly ILogger<RolesModel> _logger;
        public static string ModelName { get; set; } = "";

        public RolesModel(ILogger<RolesModel> logger)
        {
            _logger = logger;
        }

        public void OnGet()
        {
            ModelName = nameof(Roles);
            ViewData["Model"] = nameof(Roles);
        }
    }
}
