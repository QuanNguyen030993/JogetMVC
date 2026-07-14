using Microsoft.AspNetCore.Mvc.RazorPages;

namespace ERPCore.Pages
{
    public class QuotationSubmittedRequestModel : PageModel
    {
        public static string ModelName { get; private set; } = nameof(Quotation);
        public static string PageName { get; } = "QuotationSubmittedRequest";

        public void OnGet() => ModelName = nameof(Quotation);
    }
}
