using System;
using System.ComponentModel.DataAnnotations;
using SurveyReportRE.Models.Migration.Base;
using SurveyReportRE.Models.Migration.Config;
namespace SurveyReportRE.Models.Migration.Business.Workflow
{
    public class InstanceWorkflow : BaseModel
    {
        public Guid? RecordGuid {get;set;}
        public int? CurrentStep {get;set;}
        public long? WorkflowStatusId {get;set;}
        public EnumData? WorkflowStatusEnum { get;set;}       
        public long? UserWorkflowId {get;set;}
        public UserWorkflow? UserWorkflowFK {get;set;}
        public long? RuleNo { get; set; }
    }
}