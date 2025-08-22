using Microsoft.AspNetCore.Mvc.RazorPages;
using SurveyReportRE.Models.Migration.Business.HumanResource;

namespace SurveyReportRE.Pages
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
