using Microsoft.AspNetCore.Mvc.RazorPages;
using ERPCore.Models.Models.Parsing;
using ERPCore.Models.Migration.Business.Config;

namespace ERPCore.Pages
{
    public class TATReportModel : PageModel
    {
        private readonly ILogger<TATReportModel> _logger;
        public static string ModelName { get; set; } = "";

        public TATReportModel(ILogger<TATReportModel> logger)
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
