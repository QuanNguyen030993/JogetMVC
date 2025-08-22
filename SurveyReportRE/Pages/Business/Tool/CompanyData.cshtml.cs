using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using SurveyReportRE.Models.Migration.Business.MasterData;

namespace SurveyReportRE.Pages
{
    public class CompanyDataModel : PageModel
    {
        //private readonly ILogger<CompanyDataModel> _logger;
        public static string ModelName { get; set; } = "";

        public CompanyDataModel(ILogger<CompanyDataModel> logger)
        {
            //_logger = logger;
        }

        public void OnGet()
        {
            ModelName = "CompanyData";
        }
    }
}
