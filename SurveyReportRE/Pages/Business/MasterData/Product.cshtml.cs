using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using ERPCore.Models.Migration.Business.MasterData;

namespace ERPCore.Pages
{
    public class ProductModel : PageModel
    {
        //private readonly ILogger<ProductModel> _logger;
        public static string ModelName { get; set; } = "";

        public ProductModel(ILogger<ProductModel> logger)
        {
            //_logger = logger;
        }

        public void OnGet()
        {
            ModelName = nameof(Product);
            ViewData["Model"] = nameof(Product);
        }
    }
}
