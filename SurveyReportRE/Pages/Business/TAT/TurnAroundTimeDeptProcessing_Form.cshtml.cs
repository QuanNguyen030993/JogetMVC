using Microsoft.AspNetCore.Mvc.RazorPages;
using ERPCore.Models.Migration.Business.Data;
using ERPCore.Models.Migration.Business.MasterData;

namespace ERPCore.Pages
{
    public class TurnAroundTimeDeptProcessing_FormModel : PageModel
    {
        //private readonly ILogger<TurnAroundTimeDeptProcessing_FormModel> _logger;
        public static string ModelName { get; set; } = "";

        public static int Id { get; set; }
        public TurnAroundTimeDeptProcessing_FormModel(ILogger<TurnAroundTimeDeptProcessing_FormModel> logger)
        {
            //_logger = logger;
        }

        public void OnGet(int? pageNum)
        {
            if (pageNum != 0)
            {
                
            }
            ModelName = nameof(TurnAroundTimeDeptProcessing);
            ViewData[nameof(Id)] = pageNum ?? 0;
        }
    }
}
