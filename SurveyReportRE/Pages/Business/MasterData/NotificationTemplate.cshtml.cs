using ERPCore.Models.Migration.Business.MasterData;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace ERPCore.Pages
{
    public class NotificationTemplateModel : PageModel
    {
        public static string ModelName { get; set; } = "";

        public void OnGet()
        {
            ModelName = nameof(NotificationTemplate);
            ViewData["Model"] = ModelName;
        }
    }
}
