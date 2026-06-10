using Microsoft.AspNetCore.Mvc.RazorPages;

namespace ERPCore.Pages
{
    public class PrepareListModel : PageModel
    {
        //private readonly ILogger<PrepareListModel> _logger;
        public static string ModelName { get; set; } = ""; private static string Id { get; set; }


        public PrepareListModel(ILogger<PrepareListModel> logger)
        {
            //_logger = logger;
        }
        public void OnGet()
        {
            ModelName = nameof(QuotationTmp);
        }
    }
}
