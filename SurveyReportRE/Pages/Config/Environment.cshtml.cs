using Microsoft.AspNetCore.Mvc.RazorPages;
using ERPCore.Models.Migration.Business.Config;

namespace ERPCore.Pages
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
