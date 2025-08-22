using SurveyReportRE.Models.Migration.Business.Data;
using SurveyReportRE.Models.Migration.Business.Form;
using SurveyReportRE.Models.Migration.Business.MasterData;

namespace SurveyReportRE.Models.Request
{
    public class SurveyCustomOutline
	{
		public long? MasterId { get; set; }	
		public Survey? Survey { get; set; }
		public Outline? Outline { get; set; }	
    }
}
