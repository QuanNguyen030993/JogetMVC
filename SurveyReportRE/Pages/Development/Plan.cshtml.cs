using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.Extensions.Configuration;
using RESurveyTool.Models.Models.Parsing;
using SurveyReportRE.Models.Migration.Business.Data;
using SurveyReportRE.Models.Migration.Business.Form;


namespace SurveyReportRE.Pages
{
    public class PlanModel : PageModel
    {
        //private readonly ILogger<LossControl_GoodPractices_FormModel> _logger;
        public static string ModelName { get; set; } = "";
        public static string FKModelName { get; set; } = "";
        public static string SchemeModelName { get; set; } = "";
        private static int Id { get; set; }
        private static int FKId { get; set; }
        private static string JsonConfig { get; set; } = "";
        public PlanModel(ILogger<PlanModel> logger, IConfiguration config)
        {
            //_logger = logger;
        }
        public async void OnGet(int? pageNum, int? refPageNum, string jsonConfig)
        {
            ViewData[nameof(JsonConfig)] = jsonConfig;
            ModelName = nameof(EmptyClass);
            FKModelName = nameof(EmptyClass);
            SchemeModelName = nameof(EmptyClass);
            ViewData[nameof(Id)] = pageNum ?? 0;
            ViewData[nameof(FKId)] = refPageNum ?? 0;
        }
    }
}
