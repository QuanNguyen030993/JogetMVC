using Microsoft.AspNetCore.Mvc.RazorPages;
using RESurveyTool.Models.Models.Parsing;
using SurveyReportRE.Models.Migration.Business.Config;

namespace SurveyReportRE.Pages
{
    public class EvaluationModel : PageModel
    {
        private readonly ILogger<EvaluationModel> _logger;
        public static string ModelName { get; set; } = "";

        public EvaluationModel(ILogger<EvaluationModel> logger)
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
