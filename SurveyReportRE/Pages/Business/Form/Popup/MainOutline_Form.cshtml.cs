using Microsoft.AspNetCore.Mvc.RazorPages;
using SurveyReportRE.Models.Migration.Business.Data;

namespace SurveyReportRE.Pages
{
    public class MainOutline_FormModel : PageModel
    {
        //private readonly ILogger<MainOutline_FormModel> _logger;
        public static string ModelName { get; set; } = "";

        public static int Id { get; set; }
        public MainOutline_FormModel(ILogger<MainOutline_FormModel> logger)
        {
            //_logger = logger;
        }

        public void OnGet(int? pageNum)
        {
            if (pageNum != 0)
            {
                
            }
            ModelName = nameof(SurveyOutlineOptions);
            ViewData[nameof(Id)] = pageNum ?? 0;
        }
    }
}
