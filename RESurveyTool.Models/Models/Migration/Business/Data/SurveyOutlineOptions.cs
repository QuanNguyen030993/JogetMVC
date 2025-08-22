using SurveyReportRE.Models.Migration.Base;
using SurveyReportRE.Models.Migration.Business.Form;
using SurveyReportRE.Models.Migration.Business.MasterData;

namespace SurveyReportRE.Models.Migration.Business.Data
{
    public class SurveyOutlineOptions : BaseModel
    {
        public long? SurveyId { get; set; }
        public Survey? SurveyFK { get; set; }    
        public long? OutlineId { get; set; }
        public Outline? OutlineFK { get; set; } 
        public int? OptionValue { get; set; } // -1 N/A 0 No 1 Yes
        public bool? MainEnable { get; set; }
        public string Placeholder { get; set; } = "";
    }

}
