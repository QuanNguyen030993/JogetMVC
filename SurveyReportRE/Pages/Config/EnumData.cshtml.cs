using Microsoft.AspNetCore.Mvc.RazorPages;
using ERPCore.Models.Migration.Config;
using ERPCore.Models.Models.Parsing;

namespace ERPCore.Pages
{
    public class EnumDataModel : PageModel
    {
        private readonly ILogger<EnumDataModel> _logger;
        public static string ModelName { get; set; } = "";

        public EnumDataModel(ILogger<EnumDataModel> logger)
        {
            _logger = logger;
        }

        public void OnGet()
        {
            ModelName = nameof(EnumData);
            ViewData["Model"] = nameof(EnumData);
        }
    }
}
