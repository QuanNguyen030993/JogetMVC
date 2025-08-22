using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using SurveyReportRE.Models.Migration.Base;
using SurveyReportRE.Models.Migration.Config;

namespace SurveyReportRE.Models.Migration.Business.Data
{
    public class LossExpValueBrkdwn : BaseModel
    {
        public string PMLContent { get; set; } = "";
        public string ValueBrkdwnContent { get; set; } = "";
        public long? CurrencyId { get; set; }
        public EnumData? CurrencyEnum { get; set; }
     }
}
