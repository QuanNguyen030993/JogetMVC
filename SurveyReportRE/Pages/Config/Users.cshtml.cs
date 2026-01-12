using Microsoft.AspNetCore.Mvc.RazorPages;
using ERPCore.Models.Migration.Business.Config;

namespace ERPCore.Pages
{
    public class UsersModel : PageModel
    {
        private readonly ILogger<UsersModel> _logger;
        public static string ModelName { get; set; } = "";

        public UsersModel(ILogger<UsersModel> logger)
        {
            _logger = logger;
        }

        public void OnGet()
        {
            ModelName = nameof(Users);
            ViewData["Model"] = nameof(Users);
        }
    }
}
