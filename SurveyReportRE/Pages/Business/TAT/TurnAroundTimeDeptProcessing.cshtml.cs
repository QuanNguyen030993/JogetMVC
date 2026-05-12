using Microsoft.AspNetCore.Mvc.RazorPages;
using ERPCore.Models.Migration.Business.MasterData;

namespace ERPCore.Pages
{
    public class TurnAroundTimeDeptProcessingModel : PageModel
    {
        //private readonly ILogger<TurnAroundTimeDeptProcessingModel> _logger;
        public static string ModelName { get; set; } = "";

        public TurnAroundTimeDeptProcessingModel(ILogger<TurnAroundTimeDeptProcessingModel> logger)
        {
            //_logger = logger;
        }

        public void OnGet()
        {
            ModelName = nameof(TurnAroundTimeDeptProcessing);
            ViewData["Model"] = nameof(TurnAroundTimeDeptProcessing);
        }
    }
}
