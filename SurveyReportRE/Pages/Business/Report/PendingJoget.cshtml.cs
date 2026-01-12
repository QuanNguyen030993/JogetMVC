using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using ERPCore.Models.Migration.Business.MasterData;
using ERPCore.Models.Migration.Business.Workflow;

namespace ERPCore.Pages
{
    public class PendingJogetModel : PageModel
    {
        //private readonly ILogger<PendingJogetModel> _logger;
        public static string ModelName { get; set; } = "";

        public PendingJogetModel(ILogger<PendingJogetModel> logger)
        {
            //_logger = logger;
        }

        public void OnGet()
        {
            ModelName = nameof(PendingJoget);
            ViewData["Model"] = nameof(PendingJoget);
        }
    }
}
