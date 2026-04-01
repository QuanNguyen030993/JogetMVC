using System.ComponentModel.DataAnnotations;

namespace ERPCore.Models.Request
{
    public class WorkflowSavePayload
    {
        public Guid WorkflowDefinitionId { get; set; }
        public List<WorkflowNodeDto> Nodes { get; set; } = new();
        public List<StepsWorkflowDto> Steps { get; set; } = new();
    }

    public class WorkflowNodeDto
    {
        public Guid WorkflowDefinitionId { get; set; }
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

    public class StepsWorkflowDto
    {
        public Guid WorkflowDefinitionId { get; set; }
        public int SortOrder { get; set; }
        public int StepNo { get; set; }
        public int StepType { get; set; }
        public bool AllowLoop { get; set; }
        public bool CanComment { get; set; }
        public bool CanEdit { get; set; }
        public bool CanUpload { get; set; }
        public string? DepartmentCode { get; set; }
        public string? DisplayStatus { get; set; }
        public string? FlowType { get; set; }
        public bool IsActive { get; set; }
        public bool IsEnd { get; set; }
        public bool IsStart { get; set; }
        public int? LevelNo { get; set; }
        public string? LoopGroup { get; set; }
        public string? RoleCode { get; set; }
        public string? StepCode { get; set; }
        public string? StepName { get; set; }
        public string? UiMode { get; set; }
        public string? ActionCode { get; set; }
        public string? Data { get; set; }
        public string? FromNodeId { get; set; }
        public string? NodeId { get; set; }
        public string? ToNodeId { get; set; }
    }
}
