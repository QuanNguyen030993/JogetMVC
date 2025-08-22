using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using SurveyReportRE.Models.Migration.Business.Data;

namespace SurveyReportRE.Pages
{
    public class AttachmentModel : PageModel
    {
        //private readonly ILogger<AttachmentModel> _logger;
        public static string ModelName { get; set; } = "";

        public AttachmentModel(ILogger<AttachmentModel> logger)
        {
            //_logger = logger;
        }

        public void OnGet()
        {
            ModelName = nameof(Attachment);
            ViewData["Model"] = nameof(Attachment);
        }
    }
}
