using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

using ERPCore.Models.Migration.Base;
namespace ERPCore.Models.Migration.Business.Workflow
{
    public class TransitionWorkflow : BaseModel
    {
        public Guid WorkflowDefinitionId { get; set; }
        public Guid FromStepId { get; set; }
        public Guid ToStepId { get; set; }
        public Guid? ActionWorkflowId { get; set; }

        [StringLength(100)]
        public string ActionCode { get; set; } = null!;

        [StringLength(255)]
        public string? ActionName { get; set; }

        public bool RequireComment { get; set; }
        public bool RequireAttachment { get; set; }
        public bool RequireAssignee { get; set; }

        [MaxLength(8000)]
        public string? ConditionJson { get; set; }

        public int Priority { get; set; } = 1;

        [MaxLength(100)]
        public string? SetStatusCode { get; set; }

        [MaxLength(50)]
        public string? SetOwnerRoleCode { get; set; }

        public bool IsReturn { get; set; }
        public bool IsLoop { get; set; }

        [MaxLength(100)]
        public string? LoopGroup { get; set; }

        [MaxLength(50)]
        public string? LoopExitMode { get; set; }

        public int? MaxLoopCount { get; set; }
        public bool IsExitTransition { get; set; }

        [MaxLength(255)]
        public string? UserDecisionLabel { get; set; }

        public bool IsActive { get; set; } = true;

    }
}