using Microsoft.AspNetCore.Mvc.RazorPages;
using ERPCore.Models.Migration.Business.Config;

namespace ERPCore.Pages
{
    public class RolesModel : PageModel
    {
        private readonly ILogger<RolesModel> _logger;
        public static string ModelName { get; set; } = "";

        public RolesModel(ILogger<RolesModel> logger)
        {
            _logger = logger;
        }

        public void OnGet()
        {
            ModelName = nameof(Roles);
            ViewData["Model"] = nameof(Roles);
        }
    }
}
