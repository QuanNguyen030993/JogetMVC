using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

using ERPCore.Models.Migration.Base;
using ERPCore.Models.Migration.Business.MasterData;
using ERPCore.Models.Migration.Config;
namespace ERPCore.Models.Migration.Business.Workflow
{
    public class StepsWorkflow : BaseModel
    {
        public Guid WorkflowDefinitionId { get; set; }
        public string? StepCode { get; set; } = null!;   // FO_REVIEW_AND_ROUTE
        public string? StepName { get; set; } = null!;
        public long? StepType { get; set; } 
        public string? RoleCode { get; set; }           // FO / TS / UW / MKT_MGR
        public string? DepartmentCode { get; set; }

        public int? SortOrder { get; set; }

        public bool? IsStart { get; set; }
        public bool? IsEnd { get; set; }
        public bool? IsActive { get; set; } = true;
         
        public bool? CanEdit { get; set; }
        public bool? CanComment { get; set; } = true;
        public bool? CanUpload { get; set; }

        public string? DisplayStatus { get; set; }

        public string? UiMode { get; set; }            // ReadOnly / EditQuotation / Approval
        public string? Command { get; set; }            // ReadOnly / EditQuotation / Approval
        public string? CommandConfig { get; set; }            // ReadOnly / EditQuotation / Approval

        public int? LevelNo { get; set; }

        public string? FlowType { get; set; }

        public bool? AllowLoop { get; set; }

        public string? LoopGroup { get; set; }

        public decimal? PosX { get; set; }
        public decimal? PosY { get; set; }

        public Guid? ParentStepId { get; set; }

        public string? StepNo { get; set; }
        public string? JumpStepNo { get; set; }
        public string? FNodeId { get; set; } = "";
        public string? TNodeId { get; set; } = "";
        public string? FromNodeId { get; set; } = "";
        public string? ToNodeId { get; set; } = "";
        public string? ActionCode { get; set; } = "";
        public string? Data { get; set; } = "";
        public string? StatusCode { get; set; } = "";
        public string? StatusName { get; set; } = "";
        public long? StatusId { get; set; } = 0;
        public bool? IsReturn { get; set; } = false;
        public EnumData? StatusEnum { get; set; }


        public long? NotificationTemplateId { get; set; } = 0;
        public NotificationTemplate? NotificationTemplateFK { get; set; }
        public long? MailTemplateId { get; set; } = 0;
        public MailTemplate? MailTemplateFK { get; set; }

    }
}