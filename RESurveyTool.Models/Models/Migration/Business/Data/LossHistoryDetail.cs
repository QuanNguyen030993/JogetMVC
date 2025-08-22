using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using SurveyReportRE.Models.Migration.Base;

namespace SurveyReportRE.Models.Migration.Business.Data
{
    public class LossHistoryDetail : BaseModel
    {
        public string ClaimNo { get; set; } = "";
        public string LossDate { get; set; } = "";
        public string LossDescriptions { get; set; } = "";
        public string TotalLoss { get; set; } = "";
        public long? SurveyId { get; set; }
    }
}
