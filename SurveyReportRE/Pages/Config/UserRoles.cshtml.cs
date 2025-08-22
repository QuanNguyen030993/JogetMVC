using Microsoft.AspNetCore.Mvc.RazorPages;
using SurveyReportRE.Models.Migration.Business.Config;

namespace SurveyReportRE.Pages
{
    public class UserRolesModel : PageModel
    {
        private readonly ILogger<UserRolesModel> _logger;
        public static string ModelName { get; set; } = "";

        public UserRolesModel(ILogger<UserRolesModel> logger)
        {
            _logger = logger;
        }

        public void OnGet()
        {
            ModelName = nameof(UserRoles);
            ViewData["Model"] = nameof(UserRoles);
        }
    }
}
