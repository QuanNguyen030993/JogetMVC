using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using ERPCore.Models.Migration.Business.MasterData;

namespace ERPCore.Pages
{
    public class LocationModel : PageModel
    {
        //private readonly ILogger<LocationModel> _logger;
        public static string ModelName { get; set; } = "";

        public LocationModel(ILogger<LocationModel> logger)
        {
            //_logger = logger;
        }

        public void OnGet()
        {
            ModelName = nameof(Location);
            ViewData["Model"] = nameof(Location);
        }
    }
}
