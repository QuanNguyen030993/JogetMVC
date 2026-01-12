using Microsoft.AspNetCore.Mvc.RazorPages;
using ERPCore.Models.Models.Parsing;
using ERPCore.Models.Migration.Business.Config;

namespace ERPCore.Pages
{
    public class MonitoringModel : PageModel
    {
        private readonly ILogger<MonitoringModel> _logger;
        public static string ModelName { get; set; } = "";

        public MonitoringModel(ILogger<MonitoringModel> logger)
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
