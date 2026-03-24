using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

using ERPCore.Models.Migration.Base;
namespace ERPCore.Models.Migration.Business.Workflow
{
    public class StepsWorkflow : BaseModel
    {
        public Guid WorkflowDefinitionId { get; set; }
        [MaxLength(100)]
        public string StepCode { get; set; } = null!;   // FO_REVIEW_AND_ROUTE

        [MaxLength(255)]
        public string StepName { get; set; } = null!;

        public long? StepType { get; set; } 

        [MaxLength(50)]
        public string? RoleCode { get; set; }           // FO / TS / UW / MKT_MGR

        [MaxLength(50)]
        public string? DepartmentCode { get; set; }

        public int? SortOrder { get; set; }

        public bool IsStart { get; set; }
        public bool IsEnd { get; set; }
        public bool IsActive { get; set; } = true;

        public bool CanEdit { get; set; }
        public bool CanComment { get; set; } = true;
        public bool CanUpload { get; set; }

        [MaxLength(255)]
        public string? DisplayStatus { get; set; }

        [MaxLength(100)]
        public string? UiMode { get; set; }            // ReadOnly / EditQuotation / Approval

        public int? LevelNo { get; set; }

        [MaxLength(100)]
        public string? FlowType { get; set; }

        public bool AllowLoop { get; set; }

        [MaxLength(100)]
        public string? LoopGroup { get; set; }

        public decimal? PosX { get; set; }
        public decimal? PosY { get; set; }

        public Guid? ParentStepId { get; set; }

    }
}