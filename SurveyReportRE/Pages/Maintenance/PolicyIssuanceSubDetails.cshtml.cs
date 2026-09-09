using ERPCore.Models.Migration.Business.Data;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace ERPCore.Pages;

public class PolicyIssuanceSubDetailsModel : PageModel
{
    public static string ModelName { get; private set; } = nameof(PolicyIssuanceSubDetails);

    public void OnGet()
    {
        ViewData["Model"] = ModelName;
    }
}
