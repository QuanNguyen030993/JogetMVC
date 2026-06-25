using Microsoft.AspNetCore.Mvc.RazorPages;
using ERPCore.Models.Migration.Business.Config;

namespace ERPCore.Pages
{
    public class SerilogModel : PageModel
    {
        private readonly ILogger<SerilogModel> _logger;
        public static string ModelName { get; set; } = "";

        public SerilogModel(ILogger<SerilogModel> logger)
        {
            _logger = logger;
        }

        public void OnGet()
        {
            ModelName = nameof(Serilog);
            ViewData["Model"] = nameof(Serilog);
        }
    }
}
