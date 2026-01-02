using Microsoft.AspNetCore.Mvc.RazorPages;
using RESurveyTool.Models.Models.Parsing;
using SurveyReportRE.Models.Migration.Business.Config;

namespace SurveyReportRE.Pages
{
    public class ConstantModel : PageModel
    {
        private readonly ILogger<ConstantModel> _logger;
        public static string ModelName { get; set; } = "";

        public ConstantModel(ILogger<ConstantModel> logger)
        {
            _logger = logger;
        }

        public void OnGet()
        {
            ModelName = nameof(Constant);
            ViewData["Model"] = nameof(Constant);
        }
    }
}
