using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using SurveyReportRE.Models.Migration.Business.MasterData;

namespace SurveyReportRE.Pages
{
    public class OutlineModel : PageModel
    {
        private readonly ILogger<OutlineModel> _logger;
        public static string ModelName { get; set; } = "";

        public OutlineModel(ILogger<OutlineModel> logger)
        {
            _logger = logger;
        }

        public void OnGet()
        {
            ModelName = nameof(Outline);
            ViewData["Model"] = nameof(Outline);
        }
    }
}
