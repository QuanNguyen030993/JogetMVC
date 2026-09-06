using System.ComponentModel.DataAnnotations;
using ERPCore.Models.Migration.Base;

namespace ERPCore.Models.Migration.Business.MasterData
{
    public class MailTemplate : BaseModel
    {
        public string TemplateName { get; set; } = "";
        public string TemplateContent { get; set; } = "";
        public string ClearContent { get; set; } = "";
        public string TemplateMailTitle { get; set; } = "";
        public string CC { get; set; } = "";
        public string To { get; set; } = "";// Ẩn UI 
        public string PrefixTitleMail { get; set; } = "";
        public string BCC { get; set; } = "";// Ẩn UI 
        public string MailQuery { get; set; } = "";
        public bool? IsActive { get; set; } 

    }
}


