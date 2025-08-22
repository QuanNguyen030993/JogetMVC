using Microsoft.AspNetCore.Mvc.RazorPages;
using SurveyReportRE.Models.Business.Migration.Config;

namespace SurveyReportRE.Pages
{
    public class DataGridConfigModel : PageModel
    {
        private readonly ILogger<DataGridConfigModel> _logger;
        public static string ModelName { get; set; } = "";

        public DataGridConfigModel(ILogger<DataGridConfigModel> logger)
        {
            _logger = logger;
        }

        public void OnGet()
        {
            ModelName = nameof(DataGridConfig);
            ViewData["Model"] = nameof(DataGridConfig);
        }
    }
}
