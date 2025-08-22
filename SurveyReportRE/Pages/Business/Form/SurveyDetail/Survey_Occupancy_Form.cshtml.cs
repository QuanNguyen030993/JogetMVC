using Microsoft.AspNetCore.Mvc.RazorPages;
using SurveyReportRE.Models.Migration.Business.Data;
using SurveyReportRE.Models.Migration.Business.Form;

namespace SurveyReportRE.Pages.Business.Form.SurveyDetail
{
    public class Survey_Occupancy_FormModel : PageModel
    {
        //private readonly ILogger<Survey_Occupancy_FormModel> _logger;
        public static string ModelName { get; set; } = "";
        public static string FKModelName { get; set; } = "";
        public static string SchemeModelName { get; set; } = "";
        private static int Id {get; set;}
        private static int FKId { get; set; } private static string JsonConfig {get;set;} = "";
        

        public Survey_Occupancy_FormModel(ILogger<Survey_Occupancy_FormModel> logger)
        {
            //_logger = logger;
        }

        public async void OnGet(int? pageNum, int? refPageNum, string jsonConfig)
        {
            if (pageNum != 0)
            {

            }
            
            ModelName = nameof(Occupancy);
            FKModelName = nameof(Survey);
            SchemeModelName = nameof(Occupancy);
            ViewData[nameof(Id)] = pageNum ?? 0;
            ViewData[nameof(FKId)] = refPageNum ?? 0;
            ViewData[nameof(JsonConfig)] = jsonConfig;
        }
    }
}
