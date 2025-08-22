using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using SurveyReportRE.Models.Migration.Config;

namespace SurveyReportRE.Pages
{
    public class UsersCacheModel : PageModel
    {
        //private readonly ILogger<UsersCacheModel> _logger;
        public static string ModelName { get; set; } = "";

        public UsersCacheModel(ILogger<UsersCacheModel> logger)
        {
            //_logger = logger;
        }

        public void OnGet()
        {
            ModelName = nameof(UsersCache);
            ViewData["Model"] = nameof(UsersCache);
        }
    }
}
