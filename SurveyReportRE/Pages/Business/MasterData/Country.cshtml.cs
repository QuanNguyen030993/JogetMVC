using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using ERPCore.Models.Migration.Business.MasterData;

namespace ERPCore.Pages
{
    public class CountryModel : PageModel
    {
        //private readonly ILogger<CountryModel> _logger;
        public static string ModelName { get; set; } = "";

        public CountryModel(ILogger<CountryModel> logger)
        {
            //_logger = logger;
        }

        public void OnGet()
        {
            ModelName = nameof(Country);
            ViewData["Model"] = nameof(Country);
        }
    }
}
