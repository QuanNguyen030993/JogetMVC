using Microsoft.AspNetCore.Mvc.RazorPages;

namespace ERPCore.Pages
{
    public class SignedBackQuotationModel : PageModel
    {
        public static string ModelName { get; private set; } = nameof(Quotation);
        public static string PageName { get; } = "SignedBackQuotation";

        public void OnGet() => ModelName = nameof(Quotation);
    }
}
