using Microsoft.AspNetCore.Mvc.RazorPages;
using ERPCore.Models.Migration.Business.Data;
using ERPCore.Models.Migration.Business.MasterData;

namespace ERPCore.Pages
{
    public class TurnAroundTimeSession_FormModel : PageModel
    {
        //private readonly ILogger<TurnAroundTimeSession_FormModel> _logger;
        public static string ModelName { get; set; } = "";

        public static int Id { get; set; }
        public TurnAroundTimeSession_FormModel(ILogger<TurnAroundTimeSession_FormModel> logger)
        {
            //_logger = logger;
        }

        public void OnGet(int? pageNum)
        {
            if (pageNum != 0)
            {
                
            }
            ModelName = nameof(TurnAroundTimeSession);
            ViewData[nameof(Id)] = pageNum ?? 0;
        }
    }
}
