using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using SurveyReportRE.Models.Migration.Base;
using SurveyReportRE.Models.Migration.Config;

namespace SurveyReportRE.Models.Migration.Business.Data
{
    public class PosNegAspect : BaseModel
    {
        public long? PosNegTypeId { get; set; }
        public EnumData? PosNegTypeEnum { get; set; }   

        
        public string PosNegContent { get; set; } = "";
        public long? SurveyId { get; set; }
    }
}
