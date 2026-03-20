using ERPCore.Models.Models.Parsing;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace ERPCore.Pages
{
    public class PolicyIssuance_Individual_FormModel : PageModel
    {
        //private readonly ILogger<PolicyIssuance_FormModel> _logger;
        public static string ModelName { get; set; } = "";
        private static string Id { get; set; }



        public PolicyIssuance_Individual_FormModel(ILogger<PolicyIssuance_Individual_FormModel> logger, IConfiguration configuration)
        {
            //_logger = logger;
        }
        public void OnGet(int? pageNum)
        {
            if (pageNum != 0)
            {

            }
            ModelName = nameof(PolicyIssuance);
            ViewData[nameof(Id)] = pageNum ?? 0;
        }
    }
}
