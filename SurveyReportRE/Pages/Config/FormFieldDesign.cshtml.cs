using Microsoft.AspNetCore.Mvc.RazorPages;
using ERPCore.Models.Models.Parsing;
using ERPCore.Models.Migration.Business.Config;

namespace ERPCore.Pages
{
    public class FormFieldDesignModel : PageModel
    {
        private readonly ILogger<FormFieldDesignModel> _logger;
        public static string ModelName { get; set; } = "";

        public FormFieldDesignModel(ILogger<FormFieldDesignModel> logger)
        {
            _logger = logger;
        }

        public void OnGet()
        {
            ModelName = nameof(EmptyClass);
            ViewData["Model"] = nameof(EmptyClass);
        }
    }
}
