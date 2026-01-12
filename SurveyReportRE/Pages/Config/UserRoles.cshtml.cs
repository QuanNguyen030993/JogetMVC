using Microsoft.AspNetCore.Mvc.RazorPages;
using ERPCore.Models.Migration.Business.Config;

namespace ERPCore.Pages
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
