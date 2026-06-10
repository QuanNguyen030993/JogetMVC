using Microsoft.AspNetCore.Mvc.RazorPages;
using ERPCore.Models.Models.Parsing;
using ERPCore.Models.Migration.Business.Config;

namespace ERPCore.Pages
{
    public class SLAModel : PageModel
    {
        private readonly ILogger<SLAModel> _logger;
        public static string ModelName { get; set; } = "";

        public SLAModel(ILogger<SLAModel> logger)
        {
            _logger = logger;
        }

        public void OnGet()
        {
            ModelName = nameof(SLA);
            ViewData["Model"] = nameof(SLA);
        }
    }
}
