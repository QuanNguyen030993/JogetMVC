using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using SurveyReportRE.Pages;

namespace SurveyReportRE.Pages
{
    public class Quotation_FormModel : PageModel
    {
        //private readonly ILogger<Quotation_FormModel> _logger;
        public static string ModelName { get; set; } = ""; 
        private static string Id {get; set;}
       


        public Quotation_FormModel(ILogger<Quotation_FormModel> logger, IConfiguration configuration)
        {
            //_logger = logger;
        }
        public void OnGet(int? pageNum)
        {
            if (pageNum != 0)
            {
                
            }
            ModelName = "Quotation";
            ViewData[nameof(Id)] = pageNum ?? 0;
        }
    }
}
