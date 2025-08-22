using System;
using System.ComponentModel.DataAnnotations;
using SurveyReportRE.Models.Migration.Base;

namespace SurveyReportRE.Models.Migration.Business.Data
{
    public class UrlCall : BaseModel
    {
        public string Folder { get; set; } = "";
        public string Module { get; set; } = "";
        public string Controller { get; set; } = "";
        public string Action { get; set; } = "";
        public string TypeAction { get; set; } = "";
        public string Token { get; set; } = "";
        public Guid RecordGuidId { get; set; }
        public string Params { get; set; } = "";
        public DateTime? ExpireTime { get; set; }
        public bool? Expired { get; set; } = false;
    }
}
