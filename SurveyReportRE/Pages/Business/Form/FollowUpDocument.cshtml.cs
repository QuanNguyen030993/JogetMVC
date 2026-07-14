using Microsoft.AspNetCore.Mvc.RazorPages;

namespace ERPCore.Pages
{
    public class FollowUpDocumentModel : PageModel
    {
        public static string ModelName { get; private set; } = nameof(PolicyIssuance);
        public static string PageName { get; } = "FollowUpDocument";

        public void OnGet() => ModelName = nameof(PolicyIssuance);
    }
}
