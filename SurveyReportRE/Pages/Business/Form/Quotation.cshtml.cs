using Microsoft.AspNetCore.Mvc.RazorPages;

namespace ERPCore.Pages
{
    public class QuotationModel : PageModel
    {
        //private readonly ILogger<QuotationModel> _logger;
        public static string ModelName { get; set; } = ""; private static string Id { get; set; }


        public QuotationModel(ILogger<QuotationModel> logger)
        {
            //_logger = logger;
        }
        public void OnGet()
        {
            ModelName = nameof(Quotation);
        }
    }
}
