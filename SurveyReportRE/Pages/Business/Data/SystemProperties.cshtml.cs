using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using ERPCore.Models.Migration.Business.MasterData;
using ERPCore.Models.Migration.Business.Workflow;

namespace ERPCore.Pages
{
    public class SystemPropertiesModel : PageModel
    {
        //private readonly ILogger<SystemProperties> _logger;
        public static string ModelName { get; set; } = "";

        public SystemPropertiesModel(ILogger<SystemPropertiesModel> logger)
        {
            //_logger = logger;
        }

        public void OnGet()
        {
            ModelName = nameof(SystemProperties);
            ViewData["Model"] = nameof(SystemProperties);
        }
    }
}
