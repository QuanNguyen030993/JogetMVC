using SurveyReportRE.Models.Migration.Business.Data;
using SurveyReportRE.Models.Migration.Business.Form;
using SurveyReportRE.Models.Migration.Business.MasterData;

namespace SurveyReportRE.Models.Request
{
    public class SurveyMainOutline
	{
		public long? SurveyId { get; set; }	
		public Outline[]? MainOutlines { get; set; }
    }
}
