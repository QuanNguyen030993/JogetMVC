using Microsoft.AspNetCore.Mvc.RazorPages;
using SurveyReportRE.Models.Migration.Business.HumanResource;

namespace SurveyReportRE.Pages
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
