using ERPCore.Models.Migration.Business.MasterData;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace ERPCore.Pages;

public class ChecklistDefinitionModel : PageModel
{
    public static string ModelName { get; private set; } = nameof(ChecklistDefinition);

    public void OnGet()
    {
        ModelName = nameof(ChecklistDefinition);
        ViewData["Model"] = ModelName;
    }
}
