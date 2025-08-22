using System;
using System.ComponentModel.DataAnnotations;
using SurveyReportRE.Models.Migration.Base;
using SurveyReportRE.Models.Migration.Business.MasterData;
using SurveyReportRE.Models.Migration.Config;
namespace SurveyReportRE.Models.Migration.Business.Workflow
{
    public class StepsWorkflow : BaseModel
    {
        public long? NotifyMailTemplateId { get;set;}
        public MailTemplate? NotifyMailTemplateFK {get;set;}   
        public int? Steps {get;set;}
        public long? FlowMailTemplateId { get; set; }
        public MailTemplate? FlowMailTemplateFK {get;set;}
        public long? ReturnMailTemplateId { get; set; }
        public MailTemplate? ReturnMailTemplateFK { get;set;}
        public long? ReturnId { get; set; }
        public EnumData? ReturnEnum { get; set; }
        public long? PositiveStatusId { get; set; }
        public EnumData? PositiveStatusEnum { get; set; }
        public long? NegativeStatusId { get; set; }
        public EnumData? NegativeStatusEnum { get; set; }
        public string Entity { get; set; } = "";
    }
}