using Microsoft.AspNetCore.Mvc.RazorPages;

namespace ERPCore.Pages
{
    public class WorkflowDefinition_FormModel : PageModel
    {
        public static string ModelName => "WorkflowDefinition";
        public static string SchemeModelName => "WorkflowDefinition";

        public void OnGet(int? pageNum = null)
        {
        }
    }
}
