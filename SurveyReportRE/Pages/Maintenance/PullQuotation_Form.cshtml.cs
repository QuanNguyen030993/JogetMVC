using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using SurveyReportRE.Pages;

namespace SurveyReportRE.Pages
{
    public class PullQuotation_FormModel : PageModel
    {
        public static string ModelName { get; set; } = ""; 
        private static string Id {get; set;}
       


        public PullQuotation_FormModel(ILogger<PullQuotation_FormModel> logger, IConfiguration configuration)
        {
        }
        public void OnGet(int? pageNum)
        {
            if (pageNum != 0)
            {
                
            }
            ModelName = "PullQuotation";
            ViewData[nameof(Id)] = pageNum ?? 0;
        }
    }
}
