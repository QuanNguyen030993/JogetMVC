using DocumentFormat.OpenXml.Office2016.Drawing.ChartDrawing;
using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using SurveyReportRE.Models.Migration.Business.Form;
using SurveyReportRE.Models.Migration.Business.MasterData;
using SurveyReportRE.Models.Migration.Business.Workflow;

namespace SurveyReportRE.Pages
{
    public class SurveyMemoWorkflow_FormModel : PageModel
    {
        //private readonly ILogger<SurveyMemoWorkflow> _logger;
        public static string ModelName { get; set; } = "";
        public static int Id { get; set; } = 0;
        public static string SchemeModelName { get; set; } = "";
        public SurveyMemoWorkflow_FormModel(ILogger<SurveyMemoWorkflow> logger)
        {
            //_logger = logger;
        }

        public void OnGet(int pageNum)
        {
            ModelName = nameof(SurveyMemoWorkflow);
            ViewData[nameof(Id)] = pageNum;
            ViewData[nameof(SchemeModelName)] = nameof(Survey);
        }
    }
}
