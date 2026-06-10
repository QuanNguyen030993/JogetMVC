using Microsoft.AspNetCore.Mvc.RazorPages;
using ERPCore.Models.Models.Parsing;
using ERPCore.Models.Migration.Business.Config;

namespace ERPCore.Pages
{
    public class RevenueReportModel : PageModel
    {
        private readonly ILogger<RevenueReportModel> _logger;
        public static string ModelName { get; set; } = "";

        public RevenueReportModel(ILogger<RevenueReportModel> logger)
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
