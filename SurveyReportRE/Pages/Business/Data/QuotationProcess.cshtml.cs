using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using ERPCore.Models.Migration.Business.MasterData;
using ERPCore.Models.Migration.Business.Workflow;

namespace ERPCore.Pages
{
    public class QuotationProcessModel : PageModel
    {
        //private readonly ILogger<QuotationProcess> _logger;
        public static string ModelName { get; set; } = "";

        public QuotationProcessModel(ILogger<QuotationProcessModel> logger)
        {
            //_logger = logger;
        }

        public void OnGet()
        {
            ModelName = nameof(QuotationProcess);
            ViewData["Model"] = nameof(QuotationProcess);
        }
    }
}
