using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using ERPCore.Models.Migration.Business.MasterData;

namespace ERPCore.Pages
{
    public class LineModel : PageModel
    {
        //private readonly ILogger<LineModel> _logger;
        public static string ModelName { get; set; } = "";

        public LineModel(ILogger<LineModel> logger)
        {
            //_logger = logger;
        }

        public void OnGet()
        {
            ModelName = nameof(Line);
            ViewData["Model"] = nameof(Line);
        }
    }
}
