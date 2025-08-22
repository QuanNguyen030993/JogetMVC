using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using SurveyReportRE.Models.Migration.Business.Form;
using SurveyReportRE.Models.Migration.Business.MasterData;

namespace SurveyReportRE.Pages
{
    public class Survey_FormModel : PageModel
    {
        //private readonly ILogger<Survey_FormModel> _logger;
        public static string ModelName { get; set; } = ""; 
        private static string Id {get; set;}
       


        public Survey_FormModel(ILogger<Survey_FormModel> logger, IConfiguration configuration)
        {
            //_logger = logger;
        }
        public void OnGet(int? pageNum)
        {
            if (pageNum != 0)
            {
                
            }
            ModelName = nameof(Survey);
            ViewData[nameof(Id)] = pageNum ?? 0;
        }
    }
}
