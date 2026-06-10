using Microsoft.AspNetCore.Mvc.RazorPages;

namespace ERPCore.Pages
{
    public class HistoryWorkflow_FormModel : PageModel
    {
        public static string ModelName => "HistoryWorkflow";
        public static string SchemeModelName => "HistoryWorkflow";

        public void OnGet(int? pageNum = null)
        {
        }
    }
}
