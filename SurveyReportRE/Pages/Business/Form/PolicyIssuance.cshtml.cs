using Microsoft.AspNetCore.Mvc.RazorPages;

namespace ERPCore.Pages
{
    public class PolicyIssuanceModel : PageModel
    {
        //private readonly ILogger<PolicyIssuanceModel> _logger;
        public static string ModelName { get; set; } = ""; private static string Id { get; set; }


        public PolicyIssuanceModel(ILogger<PolicyIssuanceModel> logger)
        {
            //_logger = logger;
        }
        public void OnGet()
        {
            ModelName = nameof(PolicyIssuance);
        }
    }
}
