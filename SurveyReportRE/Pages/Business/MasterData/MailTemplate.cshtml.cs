using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using ERPCore.Models.Migration.Business.MasterData;

namespace ERPCore.Pages
{
    public class MailTemplateModel : PageModel
    {
        //private readonly ILogger<MailTemplateModel> _logger;
        public static string ModelName { get; set; } = "";

        public MailTemplateModel(ILogger<MailTemplateModel> logger)
        {
            //_logger = logger;
        }

        public void OnGet()
        {
            ModelName = nameof(MailTemplate);
            ViewData["Model"] = nameof(MailTemplate);
        }
    }
}
