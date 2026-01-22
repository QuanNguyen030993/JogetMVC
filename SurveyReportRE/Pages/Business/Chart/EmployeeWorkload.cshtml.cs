using Microsoft.AspNetCore.Mvc.RazorPages;
using ERPCore.Models.Models.Parsing;
using ERPCore.Models.Migration.Business.Config;

namespace ERPCore.Pages
{
    public class EmployeeWorkloadModel : PageModel
    {
        private readonly ILogger<EmployeeWorkloadModel> _logger;
        public static string ModelName { get; set; } = "";

        public EmployeeWorkloadModel(ILogger<EmployeeWorkloadModel> logger)
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
