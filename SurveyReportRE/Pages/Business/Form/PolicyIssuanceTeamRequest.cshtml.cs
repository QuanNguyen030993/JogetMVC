using Microsoft.AspNetCore.Mvc.RazorPages;

namespace ERPCore.Pages
{
    public class PolicyIssuanceTeamRequestModel : PageModel
    {
        public static string ModelName { get; private set; } = nameof(PolicyIssuance);
        public static string PageName { get; } = "PolicyIssuanceTeamRequest";

        public void OnGet() => ModelName = nameof(PolicyIssuance);
    }
}
