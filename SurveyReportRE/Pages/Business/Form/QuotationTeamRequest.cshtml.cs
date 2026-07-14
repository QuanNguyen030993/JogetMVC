using Microsoft.AspNetCore.Mvc.RazorPages;

namespace ERPCore.Pages
{
    public class QuotationTeamRequestModel : PageModel
    {
        public static string ModelName { get; private set; } = nameof(Quotation);
        public static string PageName { get; } = "QuotationTeamRequest";

        public void OnGet() => ModelName = nameof(Quotation);
    }
}
