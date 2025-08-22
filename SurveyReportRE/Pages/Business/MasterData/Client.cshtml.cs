using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using SurveyReportRE.Models.Migration.Business.MasterData;

namespace SurveyReportRE.Pages
{
    public class ClientModel : PageModel
    {
        //private readonly ILogger<ClientModel> _logger;
        public static string ModelName { get; set; } = "";

        public ClientModel(ILogger<ClientModel> logger)
        {
            //_logger = logger;
        }

        public void OnGet()
        {
            ModelName = nameof(Client);
            ViewData["Model"] = nameof(Client);
        }
    }
}
