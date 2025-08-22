using SurveyReportRE.Models.Migration.Base;
using SurveyReportRE.Models.Migration.Config;

namespace SurveyReportRE.Models.Migration.Business.Data
{
    public class ParticipantList : BaseModel
    {
        public string PersonName { get; set; } = "";
        public string PersonDepartment { get; set; } = "";
        public long? SideId { get; set; }
        public EnumData? SideEnum { get; set; } 
        public long? SurveyId { get; set; }
        public string SideName { get; set; } = "";
        public long? SideOrder { get; set; }
        public bool IsClient { get; set; } = false;
    }

}
