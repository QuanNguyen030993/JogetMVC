using Microsoft.AspNetCore.Mvc.RazorPages;

namespace ERPCore.Pages
{
    public class RenewQuotationModel : PageModel
    {
        public static string ModelName { get; private set; } = nameof(Quotation);
        public static string PageName { get; } = "RenewQuotation";

        public void OnGet() => ModelName = nameof(Quotation);
    }
}
