using Microsoft.AspNetCore.Mvc.RazorPages;
using ERPCore.Models.Migration.Business.HumanResource;

namespace ERPCore.Pages
{
    public class Employee_FormModel : PageModel
    {
        //private readonly ILogger<Employee_FormModel> _logger;
        public static string ModelName { get; set; } = "";

        public Employee_FormModel(ILogger<Employee_FormModel> logger)
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
