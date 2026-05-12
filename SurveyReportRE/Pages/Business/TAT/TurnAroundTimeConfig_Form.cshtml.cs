using Microsoft.AspNetCore.Mvc.RazorPages;
using ERPCore.Models.Migration.Business.Data;
using ERPCore.Models.Migration.Business.MasterData;

namespace ERPCore.Pages
{
    public class TurnAroundTimeConfig_FormModel : PageModel
    {
        //private readonly ILogger<TurnAroundTimeConfig_FormModel> _logger;
        public static string ModelName { get; set; } = "";

        public static int Id { get; set; }
        public TurnAroundTimeConfig_FormModel(ILogger<TurnAroundTimeConfig_FormModel> logger)
        {
            //_logger = logger;
        }

        public void OnGet(int? pageNum)
        {
            if (pageNum != 0)
            {
                
            }
            ModelName = nameof(TurnAroundTimeConfig);
            ViewData[nameof(Id)] = pageNum ?? 0;
        }
    }
}
