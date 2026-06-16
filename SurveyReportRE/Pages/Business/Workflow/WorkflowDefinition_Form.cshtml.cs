using ERPCore.Models.Migration.Business.MasterData;
using ERPCore.Models.Migration.Business.Workflow;
using Microsoft.AspNetCore.Mvc.RazorPages;
using System.Security.Cryptography;
using System.Text;
using static WorkflowDefinition_FormModel;

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
    private static string RandomNumber { get; set; } = "";

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
        ViewData[nameof(RandomNumber)] = RandomHelper.Generate(10) ?? "";
    }
    public static class RandomHelper
    {
        private const string chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

        public static string Generate(int length = 22) // SignalR thường ~22 ký tự
        {
            if (length <= 0) throw new ArgumentException("Length must be > 0");

            var result = new StringBuilder(length);
            var buffer = new byte[length];

            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(buffer);
            }

            foreach (var b in buffer)
            {
                result.Append(chars[b % chars.Length]);
            }

            return result.ToString();
        }
    }
}