using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

using ERPCore.Models.Migration.Base;
namespace ERPCore.Models.Migration.Business.Workflow
{
    public class InstanceWorkflow : BaseModel
    {
        public Guid? RecordGuid {get;set;}
        public int? CurrentStep {get;set;}
        public long? WorkflowStatusId {get;set;}
        public long? UserWorkflowId {get;set;}
        public long? RuleNo {get;set;}
        public Guid WorkflowDefinitionId { get; set; }
        [MaxLength(100)]
        public string? RecordType { get; set; } = null!;     // Quotation / Policy / Survey
        public Guid? CurrentStepId { get; set; }
        [MaxLength(50)]
        public string? CurrentOwnerRoleCode { get; set; }
        public Guid? CurrentOwnerUserId { get; set; }
        [MaxLength(100)]
        public string? LastActionCode { get; set; }
        public Guid? LastFromStepId { get; set; }
        public Guid? LastToStepId { get; set; }
        public Guid? ReturnFromStepId { get; set; }
        public Guid? ResumeToStepId { get; set; }
        public DateTime? StartedDate { get; set; } = DateTime.UtcNow;
        public DateTime? CompletedDate { get; set; }
        public bool? IsCompleted { get; set; }
        public bool? IsCancelled { get; set; }
    }
}