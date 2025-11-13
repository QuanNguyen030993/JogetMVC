using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using SurveyReportRE.Models.Migration.Business.MasterData;
using SurveyReportRE.Models.Migration.Business.Workflow;

namespace SurveyReportRE.Pages
{
    public class QuotationRequestModel : PageModel
    {
        //private readonly ILogger<QuotationRequest> _logger;
        public static string ModelName { get; set; } = "";

        public QuotationRequestModel(ILogger<QuotationRequestModel> logger)
        {
            //_logger = logger;
        }

        public void OnGet()
        {
            ModelName = nameof(QuotationRequest);
            ViewData["Model"] = nameof(QuotationRequest);
        }
    }
}
