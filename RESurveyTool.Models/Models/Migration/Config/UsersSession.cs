using SurveyReportRE.Models.Migration.Base;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;
namespace SurveyReportRE.Models.Migration.Config
{
    public class UsersSession : BaseModel
    {
        public string UserName { get; set; } = "";
        public string IPAddress { get; set; } = "";
        public string UserAgent { get; set; } = "";
        public string DeviceInfo { get; set; } = "";
        public string Token { get; set; } = "";
        public DateTime? LoginTime { get; set; } = DateTime.Now;
        public DateTime? LogoutTime { get; set; }
        public bool IsActive { get; set; } = true;
    }
}
