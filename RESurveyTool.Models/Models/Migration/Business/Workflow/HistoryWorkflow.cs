using System;
using System.ComponentModel.DataAnnotations;
using ERPCore.Models.Migration.Base;
namespace ERPCore.Models.Migration.Business.Workflow
{
    public class HistoryWorkflow : BaseModel
    {
        public Guid InstanceWorkflowId { get; set; }
        public Guid? FromStepId { get; set; }
        public Guid ToStepId { get; set; }

        [StringLength(100)]
        public string ActionCode { get; set; } = null!;

        [StringLength(255)]
        public string? ActionName { get; set; }
        public Guid? ActionByUserId { get; set; }
        [StringLength(50)]
        public string? ActionByRoleCode { get; set; }

        [StringLength(8000)]
        public string? Comment { get; set; }

        [StringLength(100)]
        public string? ReasonCode { get; set; }

        public Guid? ReturnFromStepId { get; set; }
        public Guid? ResumeToStepId { get; set; }

        [StringLength(8000)]
        public string? SnapshotJson { get; set; }
        public bool IsReturn { get; set; }
        public bool IsLoop { get; set; }

        [StringLength(100)]
        public string? LoopGroup { get; set; }

        public DateTime ActionDate { get; set; } = DateTime.UtcNow;
    }
}