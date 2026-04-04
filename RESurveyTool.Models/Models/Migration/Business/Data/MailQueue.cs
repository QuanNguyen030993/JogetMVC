using System;
using System.ComponentModel.DataAnnotations;
using ERPCore.Models.Migration.Base;
namespace ERPCore.Models.Migration.Business.Data
{
    public class MailQueue : BaseModel
    {
        public string to_name { get; set; } = "";
        public string to_email { get; set; } = "";
        public string subject { get; set; } = "";
        [MaxLength(8000)]
        public string text_body { get; set; } = "";
        [MaxLength(8000)]
        public string html_body { get; set; } = "";
        public string cc { get; set; } = "";
        public string bcc { get; set; } = "";
        public string from_account { get; set; } = "";
        public string type { get; set; } = "";
        [MaxLength(8000)]
        public string attachments { get; set; } = "";
        public string is_send { get; set; } = "";
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