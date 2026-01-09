using Microsoft.AspNetCore.Mvc.RazorPages;
using ERPCore.Models.Models.Parsing;
using ERPCore.Models.Migration.Business.Config;

namespace ERPCore.Pages
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
