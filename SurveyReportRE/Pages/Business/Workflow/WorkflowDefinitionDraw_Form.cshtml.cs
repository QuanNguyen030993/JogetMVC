using ERPCore.Models.Migration.Business.MasterData;
using ERPCore.Models.Migration.Business.Workflow;
using Microsoft.AspNetCore.Mvc.RazorPages;

public class WorkflowDefinitionDraw_FormModel : PageModel
{
    //private readonly ILogger<WorkflowDefinition_FormModel> _logger;
    public static string ModelName { get; set; } = "";
    public static string FKModelName { get; set; } = "";
    public static string SchemeModelName { get; set; } = "";
    private static int Id { get; set; }
    private static int FKId { get; set; }
    private static string JsonConfig { get; set; } = "";

    public WorkflowDefinitionDraw_FormModel(ILogger<WorkflowDefinitionDraw_FormModel> logger)
    {
        //_logger = logger;
    }
    public void OnGet(int? pageNum)
    {
        if (pageNum != 0)
        {

        }
        ModelName = nameof(WorkflowDefinition);
        SchemeModelName = nameof(WorkflowDefinition);
        ViewData[nameof(Id)] = pageNum ?? 0;
    }
}