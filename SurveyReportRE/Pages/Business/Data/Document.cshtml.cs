using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using ERPCore.Models.Migration.Business.Data;

namespace ERPCore.Pages
{
    public class DocumentModel : PageModel
    {
        //private readonly ILogger<DocumentModel> _logger;
        public static string ModelName { get; set; } = "";

        public DocumentModel(ILogger<DocumentModel> logger)
        {
            //_logger = logger;
        }

        public void OnGet()
        {
            ModelName = nameof(Document);
            ViewData["Model"] = nameof(Document);
        }
    }
}
