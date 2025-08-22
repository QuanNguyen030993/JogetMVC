using SurveyReportRE.Models.Migration.Base;
using SurveyReportRE.Models.Migration.Business.Config;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;
namespace SurveyReportRE.Models.Migration.Config
{
    public class UsersCache : BaseModel
    {
        public long? UsersId { get; set; }
        public Users? UsersFK { get; set; } 
        public string AccountName { get; set; } = "";
        public string UsersCachePayLoad { get; set; } = "";
        public bool? ForceReloadCache { get; set; } = false;
        public bool? ForceReloadPage { get; set; } = false;
        public DateTime? ReloadCacheTime { get; set; }
        public DateTime? ReloadPageTime { get; set; }
    }
}
