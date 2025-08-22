using Microsoft.AspNetCore.Mvc.RazorPages;
using SurveyReportRE.Models.Migration.Business.LCForm;

namespace SurveyReportRE.Pages
{
    public class LossControl_FormModel : PageModel
    {
        //private readonly ILogger<LossControl_FormModel> _logger;
        public static string ModelName { get; set; } = "";

        public static int Id { get; set; }
        public LossControl_FormModel(ILogger<LossControl_FormModel> logger)
        {
            //_logger = logger;
        }

        public void OnGet(int? pageNum)
        {
            if (pageNum != 0)
            {
                
            }
            ModelName = nameof(LossControl);
            ViewData[nameof(Id)] = pageNum ?? 0;
        }
    }
}
