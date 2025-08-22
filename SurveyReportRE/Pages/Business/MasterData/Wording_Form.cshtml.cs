using Microsoft.AspNetCore.Mvc.RazorPages;
using SurveyReportRE.Models.Migration.Business.Data;
using SurveyReportRE.Models.Migration.Business.MasterData;

namespace SurveyReportRE.Pages
{
    public class Wording_FormModel : PageModel
    {
        //private readonly ILogger<Wording_FormModel> _logger;
        public static string ModelName { get; set; } = "";

        public static int Id { get; set; }
        public Wording_FormModel(ILogger<Wording_FormModel> logger)
        {
            //_logger = logger;
        }

        public void OnGet(int? pageNum)
        {
            if (pageNum != 0)
            {
                
            }
            ModelName = nameof(Wording);
            ViewData[nameof(Id)] = pageNum ?? 0;
        }
    }
}
