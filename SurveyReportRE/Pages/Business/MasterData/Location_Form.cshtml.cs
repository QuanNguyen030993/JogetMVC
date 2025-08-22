using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using SurveyReportRE.Models.Migration.Business.MasterData;

namespace SurveyReportRE.Pages
{
    public class Location_FormModel : PageModel
    {
        //private readonly ILogger<Location_FormModel> _logger;
        public static string ModelName { get; set; } = "";

        public Location_FormModel(ILogger<Location_FormModel> logger)
        {
            //_logger = logger;
        }

        public void OnGet()
        {
            ModelName = nameof(Location);
            ViewData["Model"] = nameof(Location);
        }
    }
}
