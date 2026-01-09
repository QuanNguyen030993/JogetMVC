using Microsoft.AspNetCore.Mvc.RazorPages;
using ERPCore.Models.Models.Parsing;
using ERPCore.Models.Migration.Business.Config;

namespace ERPCore.Pages
{
    public class ConstantModel : PageModel
    {
        private readonly ILogger<ConstantModel> _logger;
        public static string ModelName { get; set; } = "";

        public ConstantModel(ILogger<ConstantModel> logger)
        {
            _logger = logger;
        }

        public void OnGet()
        {
            ModelName = nameof(Constant);
            ViewData["Model"] = nameof(Constant);
        }
    }
}
