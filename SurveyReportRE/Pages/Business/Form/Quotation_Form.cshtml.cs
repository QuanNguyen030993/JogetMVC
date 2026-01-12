using ERPCore.Models.Models.Parsing;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace ERPCore.Pages
{
    public class Quotation_FormModel : PageModel
    {
        //private readonly ILogger<Quotation_FormModel> _logger;
        public static string ModelName { get; set; } = "";
        private static string Id { get; set; }



        public Quotation_FormModel(ILogger<Quotation_FormModel> logger, IConfiguration configuration)
        {
            //_logger = logger;
        }
        public void OnGet(int? pageNum)
        {
            if (pageNum != 0)
            {

            }
            ModelName = nameof(Quotation);
            ViewData[nameof(Id)] = pageNum ?? 0;
        }
    }
}
