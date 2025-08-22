using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using SurveyReportRE.Models.Migration.Business.MasterData;

namespace SurveyReportRE.Pages
{
    public class CacheModel : PageModel
    {
        //private readonly ILogger<CacheModel> _logger;
        public static string ModelName { get; set; } = "";

        public CacheModel(ILogger<CacheModel> logger)
        {
            //_logger = logger;
        }

        public void OnGet()
        {
            ModelName = "Cache";
        }
    }
}
