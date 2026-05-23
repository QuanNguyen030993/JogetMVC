using Microsoft.AspNetCore.Mvc.RazorPages;
using ERPCore.Models.Models.Parsing;
using ERPCore.Models.Migration.Business.Config;

namespace ERPCore.Pages
{
    public class SLA_FormModel : PageModel
    {
        private readonly ILogger<SLA_FormModel> _logger;
        public static string ModelName { get; set; } = "";
        public static string Dept { get; set; } = "";

        public SLA_FormModel(ILogger<SLA_FormModel> logger)
        {
            _logger = logger;
        }

        public void OnGet(string Dept)
        {
            ModelName = nameof(SLA);
            ViewData["Model"] = nameof(SLA);
            ViewData["Dept"] = Dept;
        }
    }
}
