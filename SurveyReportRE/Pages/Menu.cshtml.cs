using Microsoft.AspNetCore.Mvc.RazorPages;
using SurveyReportRE.Models;

namespace SurveyReportRE.Pages
{
    public class MenuModel : PageModel
    {
        private readonly ILogger<MenuModel> _logger;

        public static string ModelName { get; set; } = "";

        public MenuModel(ILogger<MenuModel> logger)
        {
            _logger = logger;
        }

        public void OnGet()
        {
            ModelName = nameof(Menu);
            ViewData["Model"] = nameof(Menu);
        }
    }
}
