using Microsoft.AspNetCore.Mvc.RazorPages;
using RESurveyTool.Models.Models.Parsing;
using SurveyReportRE.Models.Migration.Business.Config;

namespace SurveyReportRE.Pages
{
    public class UserSessionModel : PageModel
    {
        private readonly ILogger<UserSessionModel> _logger;
        public static string ModelName { get; set; } = "";

        public UserSessionModel(ILogger<UserSessionModel> logger)
        {
            _logger = logger;
        }

        public void OnGet()
        {
            ModelName = nameof(EmptyClass);
            ViewData["Model"] = nameof(EmptyClass);
        }
    }
}
