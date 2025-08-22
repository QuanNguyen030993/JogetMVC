using System;
using System.ComponentModel.DataAnnotations;
using SurveyReportRE.Models.Migration.Base;
using SurveyReportRE.Models.Migration.Config;
namespace SurveyReportRE.Models.Migration.Business.Workflow
{
    public class SurveyActionConfig : BaseModel
    {
        public int? RuleNo { get; set; }
        public bool? RequireInstanceWorkflow { get; set; }
        public string StatusKey { get; set; } = "";
        public bool? IsOwnerReport { get; set; }
        public bool? IsCreatedBy { get; set; }
        public bool? MustDifferentOwner { get; set; }
        public string ActionType { get; set; } = "";
        public string ActionText { get; set; } = "";
        public bool IsVisible { get; set; }
        public int Priority { get; set; } = 0;
    }
}