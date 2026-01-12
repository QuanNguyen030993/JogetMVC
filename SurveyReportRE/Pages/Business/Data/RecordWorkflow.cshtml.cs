using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using ERPCore.Models.Migration.Business.MasterData;
using ERPCore.Models.Migration.Business.Workflow;

namespace ERPCore.Pages
{
    public class RecordWorkflowModel : PageModel
    {
        //private readonly ILogger<RecordWorkflow> _logger;
        public static string ModelName { get; set; } = "";

        public RecordWorkflowModel(ILogger<RecordWorkflowModel> logger)
        {
            //_logger = logger;
        }

        public void OnGet()
        {
            ModelName = nameof(RecordWorkflow);
            ViewData["Model"] = nameof(RecordWorkflow);
        }
    }
}
