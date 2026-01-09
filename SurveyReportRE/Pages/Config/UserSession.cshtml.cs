using Microsoft.AspNetCore.Mvc.RazorPages;
using ERPCore.Models.Models.Parsing;
using ERPCore.Models.Migration.Business.Config;

namespace ERPCore.Pages
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
