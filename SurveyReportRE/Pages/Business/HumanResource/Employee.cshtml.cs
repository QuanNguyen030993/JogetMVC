using Microsoft.AspNetCore.Mvc.RazorPages;
using ERPCore.Models.Migration.Business.HumanResource;

namespace ERPCore.Pages
{
    public class EmployeeModel : PageModel
    {
        //private readonly ILogger<EmployeeModel> _logger;
        public static string ModelName { get; set; } = "";

        public EmployeeModel(ILogger<EmployeeModel> logger)
        {
            //_logger = logger;
        }

        public void OnGet()
        {
            ModelName = nameof(Employee);
            ViewData["Model"] = nameof(Employee);
        }
    }
}
