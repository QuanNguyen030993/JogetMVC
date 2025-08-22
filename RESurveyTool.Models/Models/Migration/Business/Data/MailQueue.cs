using System;
using System.ComponentModel.DataAnnotations;
using SurveyReportRE.Models.Migration.Base;
namespace SurveyReportRE.Models.Migration.Business.Data
{
    public class MailQueue : BaseModel
    {
        public string ToName { get; set; } = "";
        public string ToEmail { get; set; } = "";
        public string Subject { get; set; } = "";
        public string TextBody { get; set; } = "";
        public string HtmlBody { get; set; } = "";
        public string CC { get; set; } = "";
        public string BCC { get; set; } = "";
        public string FromAccount { get; set; } = "";
        public string Type { get; set; } = "";
        public string Attachments { get; set; } = "";
        public bool? IsSend { get; set; } = false;
    }
}