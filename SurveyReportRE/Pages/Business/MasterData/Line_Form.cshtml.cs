using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using ERPCore.Models.Migration.Business.Data;
using ERPCore.Models.Migration.Business.Form;
using ERPCore.Models.Migration.Business.MasterData;

namespace ERPCore.Pages
{
    public class Line_FormModel : PageModel
    {
        //private readonly ILogger<Line_FormModel> _logger;
        public static string ModelName { get; set; } = "";
        public static string FKModelName { get; set; } = "";
        public static string SchemeModelName { get; set; } = "";
        private static int Id { get; set; }
        private static int FKId { get; set; } private static string JsonConfig {get;set;} = "";

        public Line_FormModel(ILogger<Line_FormModel> logger)
        {
            //_logger = logger;
        }
        public void OnGet(int? pageNum)
        {
            if (pageNum != 0)
            {
                
            }
            ModelName = nameof(Line);
            SchemeModelName = nameof(Line);
            ViewData[nameof(Id)] = pageNum ?? 0;
        }
    }
}
