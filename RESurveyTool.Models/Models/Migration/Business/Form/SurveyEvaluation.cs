using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using SurveyReportRE.Models.Migration.Base;
using SurveyReportRE.Models.Migration.Config;

namespace SurveyReportRE.Models.Migration.Business.Data
{
    public class SurveyEvaluation : BaseModel 
    {
        public long? SurveyCategoryTypeId { get; set; }
        public EnumData? SurveyCategoryTypeEnum { get; set; }
        public long? SurveyStatusId { get; set; }
        public EnumData? SurveyStatusEnum { get; set; }
        public long? SurveyId { get; set; }
    }
}
