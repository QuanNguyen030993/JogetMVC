using Microsoft.AspNetCore.Mvc.RazorPages;

namespace ERPCore.Pages
{
    public class ActionWorkflow_FormModel : PageModel
    {
        public static string ModelName => "ActionWorkflow";
        public static string SchemeModelName => "ActionWorkflow";

        public void OnGet(int? pageNum = null)
        {
        }
    }
}
