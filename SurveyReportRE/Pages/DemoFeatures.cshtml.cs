using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace ERPCore.Pages
{
    public class DemoModel : PageModel
    {
        private readonly ILogger<DemoModel> _logger;

        public DemoModel(ILogger<DemoModel> logger)
        {
            _logger = logger;
        }

        public void OnGet()
        {

        }
    }
}
