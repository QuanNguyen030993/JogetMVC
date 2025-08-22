using Microsoft.AspNetCore.Mvc.RazorPages;
using SurveyReportRE.Models.Migration.Business.ExportData;
using SurveyReportRE.Models.Migration.Business.Form;

namespace SurveyReportRE.Pages.Business.ExportData
{
    public class ConstructionInfo_FormModel : PageModel
    {
        //private readonly ILogger<ConstructionInfo> _logger;
        public static string ModelName { get; set; } = "";
        public static int Id { get; set; } = 0;
        public static string SchemeModelName { get; set; } = "";
        public ConstructionInfo_FormModel(ILogger<ConstructionInfo> logger)
        {
            //_logger = logger;
        }

        public void OnGet(int pageNum)
        {
            ModelName = nameof(ConstructionInfo);
            ViewData[nameof(Id)] = pageNum;
            ViewData[nameof(SchemeModelName)] = nameof(Survey);

        }
    }
}
