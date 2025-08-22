using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.Extensions.Configuration;
using SurveyReportRE.Models.Migration.Business.Data;
using SurveyReportRE.Models.Migration.Business.Form;

namespace SurveyReportRE.Pages.Business.Form.SurveyDetail
{
    public class Survey_SitePictures_FormModel : PageModel
    {
        //private readonly ILogger<Survey_SitePictures_FormModel> _logger;
        public static string ModelName { get; set; } = "";
        public static string FKModelName { get; set; } = "";
        public static string SchemeModelName { get; set; } = "";
        private static int Id { get; set; }
        private static int FKId { get; set; } private static string JsonConfig {get;set;} = "";
        public Survey_SitePictures_FormModel(ILogger<Survey_SitePictures_FormModel> logger, IConfiguration config)
        {
            //_logger = logger;
        }
        public async void OnGet(int? pageNum, int? refPageNum,string jsonConfig) { ViewData[nameof(JsonConfig)] = jsonConfig;

            ModelName = nameof(SitePictures);
            FKModelName = nameof(Survey);
            SchemeModelName = nameof(SitePictures);
            ViewData[nameof(Id)] = pageNum ?? 0;
            ViewData[nameof(FKId)] = refPageNum ?? 0;
        }
    }
}
