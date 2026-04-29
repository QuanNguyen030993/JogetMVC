using ERPCore.Models.Migration.Business.Workflow;
using System.ComponentModel.DataAnnotations;

namespace ERPCore.Models.Request
{
    public class WorkflowSavePayload
    {
        public Guid? WorkflowDefinitionId { get; set; }
        public List<WorkflowNodeDto> Nodes { get; set; } = new();
        public List<StepsWorkflow> Steps { get; set; } = new();
    }

    public class WorkflowNodeDto
    {
        public Guid? WorkflowDefinitionId { get; set; }
        public string? NodeId { get; set; }
        public string? ParentNodeId { get; set; }
        public string? NodeName { get; set; }
        public string? NodeType { get; set; }
        public string? FlowType { get; set; }
        public bool AllowLoop { get; set; }
        public string? LoopGroup { get; set; }
        public string? NodeCode { get; set; }
        public string? StepRole { get; set; }
        public string? DepartmentCode { get; set; }
        public int? LevelNo { get; set; }
        public decimal? PosX { get; set; }
        public decimal? PosY { get; set; }
        public int SortOrder { get; set; }
        public bool IsActive { get; set; }
        public string? Data { get; set; }
    }
}
