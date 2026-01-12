using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using ERPCore.Models.Migration.Business.Data;

namespace ERPCore.Pages
{
    public class MailQueueModel : PageModel
    {
        //private readonly ILogger<MailQueueModel> _logger;
        public static string ModelName { get; set; } = "";

        public MailQueueModel(ILogger<MailQueueModel> logger)
        {
            //_logger = logger;
        }

        public void OnGet()
        {
            ModelName = nameof(MailQueue);
            ViewData["Model"] = nameof(MailQueue);
        }
    }
}
