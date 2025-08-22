using Microsoft.AspNetCore.Mvc.RazorPages;
using SurveyReportRE.Models.Migration.Business.Form;

namespace SurveyReportRE.Pages
{
    public class Search_FormModel : PageModel
    {
        //private readonly ILogger<Search> _logger;
        public static string ModelName { get; set; } = "";
        public static int Id { get; set; } = 0;
        public static string SchemeModelName { get; set; } = "";
        public Search_FormModel(ILogger<Search> logger)
        {
            //_logger = logger;
        }

        public void OnGet(int pageNum)
        {
            ModelName = nameof(Search);
            ViewData[nameof(Id)] = pageNum;
            ViewData[nameof(SchemeModelName)] = nameof(Survey);



        }
    }
}
