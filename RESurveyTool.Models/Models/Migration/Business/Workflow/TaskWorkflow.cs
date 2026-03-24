using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ERPCore.Models.Migration.Base;
using ERPCore.Models.Migration.Business.Workflow;

namespace ERPCore.Models.Migration.Workflow
{
    public class TaskWorkflow : BaseModel
    {
        public Guid InstanceWorkflowId { get; set; }
        public Guid StepWorkflowId { get; set; }
        public int TaskNo { get; set; } = 1;

        [MaxLength(50)]
        public string? AssignedRoleCode { get; set; }

        public Guid? AssignedUserId { get; set; }

        public bool IsCurrent { get; set; } = true;

        public Guid? ParentTaskId { get; set; }
        public Guid? SourceHistoryId { get; set; }

        public DateTime CreatedDateTask { get; set; } = DateTime.UtcNow;
        public DateTime? ClaimedDate { get; set; }
        public DateTime? CompletedDate { get; set; }
        public DateTime? DueDate { get; set; }
    }
}