using ERPCore.Models.Migration.Business.MasterData;
using ERPCore.Models.Migration.Business.Workflow;
using Microsoft.AspNetCore.Mvc.RazorPages;

public class WorkflowDefinition_FormModel : PageModel
{
    //private readonly ILogger<WorkflowDefinition_FormModel> _logger;
    public static string ModelName { get; set; } = "";
    public static string FKModelName { get; set; } = "";
    public static string SchemeModelName { get; set; } = "";
    private static int Id { get; set; }
    private static string Guid { get; set; } = "";
    private static int FKId { get; set; }
    private static string JsonConfig { get; set; } = "";

    public WorkflowDefinition_FormModel(ILogger<WorkflowDefinition_FormModel> logger)
    {
        //_logger = logger;
    }
    public void OnGet(int? pageNum, string guid)
    {
        if (pageNum != 0)
        {

        }
        ModelName = nameof(WorkflowDefinition);
        SchemeModelName = nameof(WorkflowDefinition);
        ViewData[nameof(Id)] = pageNum ?? 0;
        ViewData[nameof(Guid)] = guid ?? "";
    }
}