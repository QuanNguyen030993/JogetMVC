using Microsoft.AspNetCore.Mvc.RazorPages;

namespace ERPCore.Pages
{
    public class PolicyIssuance_Endorse_Request_FormModel : PageModel
    {
        public void OnGet(int? pageNum)
        {
            ViewData["Id"] = pageNum ?? 0;
        }
    }
}
