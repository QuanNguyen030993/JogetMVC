using Microsoft.AspNetCore.Mvc.RazorPages;
using ERPCore.Models.Business.Migration.Config;

namespace ERPCore.Pages
{
    public class SysTableModel : PageModel
    {
        private readonly ILogger<SysTableModel> _logger;
        public static string ModelName { get; set; } = "";

        public SysTableModel(ILogger<SysTableModel> logger)
        {
            _logger = logger;
        }

        public void OnGet()
        {
            ModelName = nameof(SysTable);
            ViewData["Model"] = nameof(SysTable);
        }
    }
}
