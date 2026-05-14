using Microsoft.AspNetCore.Mvc.RazorPages;
using ERPCore.Models.Request;

namespace ERPCore.Pages
{
    public class ErrorBrowserDetailsModel : PageModel
    {
        private readonly ILogger<ErrorBrowserDetailsModel> _logger;
        public static string ModelName { get; set; } = "";

        public ErrorBrowserDetailsModel(ILogger<ErrorBrowserDetailsModel> logger)
        {
            _logger = logger;
        }

        public void OnGet()
        {
            ModelName = nameof(ErrorBrowserDetails);
            ViewData["Model"] = nameof(ErrorBrowserDetails);
        }
    }
}
