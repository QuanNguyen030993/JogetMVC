using Microsoft.AspNetCore.Mvc.RazorPages;
using SurveyReportRE.Models.Migration.Business.Data;
using SurveyReportRE.Models.Migration.Business.Form;

namespace SurveyReportRE.Pages.Business.Form.SurveyDetail
{
    public class Survey_ParticipantList_FormModel : PageModel
    {
        //private readonly ILogger<Survey_ParticipantList_FormModel> _logger;
        public static string ModelName { get; set; } = "";
        public static string FKModelName { get; set; } = "";
        public static string SchemeModelName { get; set; } = "";
        private static int Id {get; set;}
        private static int FKId { get; set; } private static string JsonConfig {get;set;} = "";
        

        public Survey_ParticipantList_FormModel(ILogger<Survey_ParticipantList_FormModel> logger)
        {
            //_logger = logger;
        }

        public void OnGet(int? pageNum, string jsonConfig)
        {
            if (pageNum != 0)
            {

            }
            ModelName = nameof(ParticipantList);
            FKModelName = nameof(Survey);
            ViewData[nameof(Id)] = pageNum ?? 0;
            ViewData[nameof(FKId)] = pageNum ?? 0;
            ViewData[nameof(JsonConfig)] = jsonConfig;
        }
    }
}
