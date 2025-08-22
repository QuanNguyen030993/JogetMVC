using System.ComponentModel.DataAnnotations;
using SurveyReportRE.Models.Migration.Base;

namespace SurveyReportRE.Models.Migration.Business.Data
{
    public class Summary : BaseModel
    {
        public string CompanyIntroduction { get; set; } = "";
        public string OperationsDetail { get; set; } = "";
        public string RecentModifications { get; set; } = "";
        public string ExpansionPlan { get; set; } = "";
    }
}
