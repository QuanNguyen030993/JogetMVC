using ERPCore.Models.Migration.Business.Data;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace ERPCore.Pages;

public class ChecklistModel : PageModel
{
    public static string ModelName { get; private set; } = nameof(PolicyIssuanceChecklist);
    public string RecordGuid { get; private set; } = "";

    public void OnGet(Guid? recordGuid)
    {
        ModelName = nameof(PolicyIssuanceChecklist);
        RecordGuid = recordGuid?.ToString() ?? "";
        ViewData["Model"] = ModelName;
        ViewData[nameof(RecordGuid)] = RecordGuid;
    }
}
