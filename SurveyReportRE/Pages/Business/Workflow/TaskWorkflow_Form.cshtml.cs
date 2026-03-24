using Microsoft.AspNetCore.Mvc.RazorPages;

namespace ERPCore.Pages
{
    public class TaskWorkflow_FormModel : PageModel
    {
        public static string ModelName => "TaskWorkflow";
        public static string SchemeModelName => "TaskWorkflow";

        public void OnGet(int? pageNum = null)
        {
        }
    }
}
