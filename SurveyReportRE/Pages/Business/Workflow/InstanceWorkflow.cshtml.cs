using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using ERPCore.Models.Migration.Business.MasterData;
using ERPCore.Models.Migration.Business.Workflow;

namespace ERPCore.Pages
{
    public class InstanceWorkflowModel : PageModel
    {
        //private readonly ILogger<InstanceWorkflowModel> _logger;
        public static string ModelName { get; set; } = "";

        public InstanceWorkflowModel(ILogger<InstanceWorkflowModel> logger)
        {
            //_logger = logger;
        }

        public void OnGet()
        {
            ModelName = nameof(InstanceWorkflow);
            ViewData["Model"] = nameof(InstanceWorkflow);
        }
    }
}
