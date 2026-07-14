using Microsoft.AspNetCore.Mvc.RazorPages;

namespace ERPCore.Pages
{
    public class PolicyIssuanceSubmittedRequestModel : PageModel
    {
        public static string ModelName { get; private set; } = nameof(PolicyIssuance);
        public static string PageName { get; } = "PolicyIssuanceSubmittedRequest";

        public void OnGet() => ModelName = nameof(PolicyIssuance);
    }
}
