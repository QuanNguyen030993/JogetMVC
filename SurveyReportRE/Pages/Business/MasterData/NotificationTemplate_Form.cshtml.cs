using ERPCore.Models.Migration.Business.MasterData;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace ERPCore.Pages
{
    public class NotificationTemplate_FormModel : PageModel
    {
        public static string ModelName { get; set; } = "";
        public static string SchemeModelName { get; set; } = "";

        public void OnGet(int? pageNum)
        {
            ModelName = nameof(NotificationTemplate);
            SchemeModelName = nameof(NotificationTemplate);
            ViewData["Id"] = pageNum ?? 0;
        }
    }
}
