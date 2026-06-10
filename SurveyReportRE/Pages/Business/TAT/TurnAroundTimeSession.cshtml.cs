using Microsoft.AspNetCore.Mvc.RazorPages;
using ERPCore.Models.Migration.Business.MasterData;

namespace ERPCore.Pages
{
    public class TurnAroundTimeSessionModel : PageModel
    {
        //private readonly ILogger<TurnAroundTimeSessionModel> _logger;
        public static string ModelName { get; set; } = "";

        public TurnAroundTimeSessionModel(ILogger<TurnAroundTimeSessionModel> logger)
        {
            //_logger = logger;
        }

        public void OnGet()
        {
            ModelName = nameof(TurnAroundTimeSession);
            ViewData["Model"] = nameof(TurnAroundTimeSession);
        }
    }
}
