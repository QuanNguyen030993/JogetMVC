using Microsoft.AspNetCore.Mvc.RazorPages;
using SurveyReportRE.Models.Migration.Business.MasterData;

namespace SurveyReportRE.Pages
{
    public class WordingModel : PageModel
    {
        //private readonly ILogger<WordingModel> _logger;
        public static string ModelName { get; set; } = "";

        public WordingModel(ILogger<WordingModel> logger)
        {
            //_logger = logger;
        }

        public void OnGet()
        {
            ModelName = nameof(Wording);
            ViewData["Model"] = nameof(Wording);
        }
    }
}
