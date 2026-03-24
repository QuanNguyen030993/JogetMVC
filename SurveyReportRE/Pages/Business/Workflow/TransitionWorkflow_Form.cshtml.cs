using Microsoft.AspNetCore.Mvc.RazorPages;

namespace ERPCore.Pages
{
    public class TransitionWorkflow_FormModel : PageModel
    {
        public static string ModelName => "TransitionWorkflow";
        public static string SchemeModelName => "TransitionWorkflow";

        public void OnGet(int? pageNum = null)
        {
        }
    }
}
