using System;
using System.ComponentModel.DataAnnotations;
using SurveyReportRE.Models.Migration.Base;
namespace SurveyReportRE.Models.Migration.Business.Data
{
    public class SurveyWorkflowHistory : BaseModel
    {
        public long? SurveyId { get; set; }
        public string SurveyNo { get; set; } = "";
        public string SurveyedBy { get; set; } = "";
        public string SubmitBy { get; set; } = "";
        public string ApprovalBy { get; set; } = "";
        public DateTime? ApprovalDate { get; set; }
        public string Comment { get; set; } = "";
        public DateTime? DueDate { get; set; }
        public string RecallReason { get; set; } = "";
        public string GrantSurvey { get; set; } = "";
        public long? FromWorkflowStatus { get; set; }
        public long? ToWorkflowStatus { get; set; }
        public string FromAccount { get; set; } = "";
        public string ToAccount { get; set; } = "";

    }
}