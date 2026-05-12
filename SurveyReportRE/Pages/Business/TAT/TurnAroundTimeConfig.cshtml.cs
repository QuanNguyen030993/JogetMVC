using Microsoft.AspNetCore.Mvc.RazorPages;
using ERPCore.Models.Migration.Business.MasterData;

namespace ERPCore.Pages
{
    public class TurnAroundTimeConfigModel : PageModel
    {
        //private readonly ILogger<TurnAroundTimeConfigModel> _logger;
        public static string ModelName { get; set; } = "";

        public TurnAroundTimeConfigModel(ILogger<TurnAroundTimeConfigModel> logger)
        {
            //_logger = logger;
        }

        public void OnGet()
        {
            ModelName = nameof(TurnAroundTimeConfig);
            ViewData["Model"] = nameof(TurnAroundTimeConfig);
        }
    }
}
