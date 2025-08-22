using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using SurveyReportRE.Models.Migration.Business.Form;

namespace SurveyReportRE.Pages.Business.Form.SurveyDetail
{
    public class Survey_Overview_FormModel : PageModel
    {
        //private readonly ILogger<Survey_Overview_FormModel> _logger;
        public static string ModelName { get; set; } = ""; 
        private static int Id {get; set;}
        private static string JsonConfig { get; set; } = "";

        public Survey_Overview_FormModel(ILogger<Survey_Overview_FormModel> logger)
        {
            //_logger = logger;
        }
        public void OnGet(int? pageNum, string? jsonConfig)
        {
            if (pageNum != 0)
            {
                
            }
            ModelName = nameof(Survey);
            ViewData[nameof(Id)] = pageNum ?? 0;
            ViewData[nameof(JsonConfig)] = jsonConfig ?? "";
        }
    }
}
