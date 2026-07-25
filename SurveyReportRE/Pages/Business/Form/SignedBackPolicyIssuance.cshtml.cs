using Microsoft.AspNetCore.Mvc.RazorPages;

namespace ERPCore.Pages
{
    public class SignedBackPolicyIssuanceModel : PageModel
    {
        public static string ModelName { get; private set; } = nameof(PolicyIssuance);
        public static string PageName { get; } = "SignedBackPolicyIssuance";

        public void OnGet() => ModelName = nameof(PolicyIssuance);
    }
}
