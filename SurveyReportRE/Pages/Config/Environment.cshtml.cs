using Microsoft.AspNetCore.Mvc.RazorPages;
using ERPCore.Models.Migration.Business.Config;
using ConnectionEnvironmentUtil = ERPCore.ControllerUtil.ControllerUtil;

namespace ERPCore.Pages
{
    public class EnvironmentModel : PageModel
    {
        private readonly ILogger<EnvironmentModel> _logger;
        public static string ModelName { get; set; } = "";
        public string CurrentConnectionEnvironment { get; private set; } = "Default";

        public EnvironmentModel(ILogger<EnvironmentModel> logger)
        {
            _logger = logger;
        }

        public void OnGet()
        {
            ModelName = nameof(Environment);
            ViewData["Model"] = nameof(Environment);
            var selectedEnvironment = HttpContext.Session.GetString(ConnectionEnvironmentUtil.ConnectionEnvironmentSessionKey);
            try
            {
                CurrentConnectionEnvironment = ConnectionEnvironmentUtil.NormalizeConnectionEnvironment(selectedEnvironment ?? "Default");
            }
            catch (ArgumentException)
            {
                CurrentConnectionEnvironment = "Default";
            }
        }
    }
}
