using Microsoft.AspNetCore.Mvc.RazorPages;
using SurveyReportRE.Models.Migration.Business.Form;

namespace SurveyReportRE.Pages
{
    public class SurveyArchivedModel : PageModel
    {
        //private readonly ILogger<SurveyArchivedModel> _logger;
        public static string ModelName { get; set; } = ""; private static string Id {get; set;}
        

        public SurveyArchivedModel(ILogger<SurveyArchivedModel> logger)
        {
            //_logger = logger;
        }
        public void OnGet()
        {
            ModelName = nameof(Survey);
        }
    }
}
