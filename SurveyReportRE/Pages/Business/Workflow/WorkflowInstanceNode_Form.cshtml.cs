using Microsoft.AspNetCore.Mvc.RazorPages;

namespace ERPCore.Pages
{
    public class WorkflowInstanceNode_FormModel : PageModel
    {
        public static string ModelName => "WorkflowInstanceNode";
        public static string SchemeModelName => "WorkflowInstanceNode";

        public void OnGet(int? pageNum = null)
        {
        }
    }
}
