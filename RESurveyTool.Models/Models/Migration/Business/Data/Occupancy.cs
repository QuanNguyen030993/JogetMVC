using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using SurveyReportRE.Models.Migration.Base;
using SurveyReportRE.Models.Migration.Business.MasterData;
using SurveyReportRE.Models.Migration.Config;

namespace SurveyReportRE.Models.Migration.Business.Data
{
    public class Occupancy : BaseModel 
    {
        
        public string SpecialHazardContent { get; set; } = "";
        public string ProductionProcessContent { get; set; } = "";
        public string? SubAttributes { get; set; } = "";
        public byte[]? AdditionalOutline { get; set; }
        public string StorageConditions { get; set; } = "";
        public string Utilities { get; set; } = "";
    }
}
