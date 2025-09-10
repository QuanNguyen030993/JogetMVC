using DocumentFormat.OpenXml.Office2016.Drawing.ChartDrawing;
using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using SurveyReportRE.Models.Migration.Business.Form;
using SurveyReportRE.Models.Migration.Business.MasterData;
using SurveyReportRE.Models.Migration.Business.Workflow;

namespace SurveyReportRE.Pages
{
    public class StepsWorkflow_FormModel : PageModel
    {
        //private readonly ILogger<StepsWorkflow> _logger;
        public static string ModelName { get; set; } = "";
        public static int Id { get; set; } = 0;
        public static string SchemeModelName { get; set; } = "";
        public StepsWorkflow_FormModel(ILogger<StepsWorkflow> logger)
        {
            //_logger = logger;
        }

        public void OnGet(int pageNum)
        {
            ModelName = nameof(StepsWorkflow);
            ViewData[nameof(Id)] = pageNum;
            //ViewData[nameof(SchemeModelName)] = nameof(Survey);
                


        }
    }
}
