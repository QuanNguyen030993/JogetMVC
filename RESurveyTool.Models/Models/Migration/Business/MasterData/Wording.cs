using SurveyReportRE.Models.Business.Migration.Config;
using SurveyReportRE.Models.Migration.Base;
using System.ComponentModel.DataAnnotations;

namespace SurveyReportRE.Models.Migration.Business.MasterData
{
    public class Wording : BaseModel
    {
        [MaxLength(4000)]
        public string WordingName { get; set; } = "";
        
        public string WordingContent { get; set; } = "";
        [MaxLength(4000)]
        public string DefaultField { get; set; } = "";
        public long? DefaultFieldId { get; set; }
        public DataGridConfig? DefaultFieldFK { get; set; } 
    }
}
