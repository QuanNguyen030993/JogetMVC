using System;
using System.ComponentModel.DataAnnotations;

using ERPCore.Models.Migration.Base;
namespace ERPCore.Models.Migration.Business.Workflow
{
    public class WorkflowDefinition : BaseModel
    {
        public string WorkflowCode { get; set; } = ""!;

        public string WorkflowName { get; set; } = ""!;

        public string? FlowType { get; set; }   // Quotation / PolicyIssuance / Both

        public int VersionNo { get; set; } = 1;

        public bool IsActive { get; set; } = true;
        public string WorkflowNodes { get; set; } = "";
    }
}