using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

using ERPCore.Models.Migration.Base;
namespace ERPCore.Models.Migration.Business.Workflow
{
    public class WorkflowInstanceNode : BaseModel
    {
        public string Code { get; set; } = "";
        //public Guid? InstanceWorkflowId { get; set; }
        //public InstanceWorkflow? InstanceWorkflowFK { get; set; }
        public Guid? WorkflowDefinitionId { get; set; }
        public WorkflowDefinition? WorkflowDefinitionFK { get; set; } 
        [MaxLength(50)]
        public string Data { get; set; } =""; // Pending / Active / Completed / Skipped / Returned
        public DateTime? ActivatedDate { get; set; }
        public DateTime? CompletedDate { get; set; }
        public int LoopCount { get; set; }
        [MaxLength(100)]
        public string LastActionCode { get; set; } = "";

    }
}