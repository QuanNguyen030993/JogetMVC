using Microsoft.AspNetCore.Mvc.RazorPages;
using ERPCore.Models.Models.Parsing;
using ERPCore.Models.Migration.Business.Config;

namespace ERPCore.Pages
{
    public class UtilityModel : PageModel
    {
        private readonly ILogger<UtilityModel> _logger;
        public static string ModelName { get; set; } = "";

        public UtilityModel(ILogger<UtilityModel> logger)
        {
            _logger = logger;
        }

        public void OnGet()
        {
            ModelName = nameof(EmptyClass);
            ViewData["Model"] = nameof(EmptyClass);
        }
    }
}
