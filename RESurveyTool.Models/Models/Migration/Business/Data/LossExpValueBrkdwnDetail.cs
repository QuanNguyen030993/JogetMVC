using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using SurveyReportRE.Models.Migration.Base;

namespace SurveyReportRE.Models.Migration.Business.Data
{
    public class LossExpValueBrkdwnDetail : BaseModel 
    {
        public string PMLPercent { get; set; } = "";

        public decimal PML { get; set; }

        public string ValueBrkdwnInterest { get; set; } = "";

        public decimal ValueBrkdwnSum  { get; set; }

        public long? SurveyId { get; set; }

    }
}
