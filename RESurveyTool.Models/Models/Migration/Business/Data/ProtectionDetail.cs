using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using SurveyReportRE.Models.Migration.Base;

namespace SurveyReportRE.Models.Migration.Business.Data
{
    public class ProtectionDetail : BaseModel 
    {
        
        public string Equipment { get; set; } = "";

        
        public string Details { get; set; } = "";

        
        public string InstalledArea { get; set; } = "";

        public string OccupiedPercent { get; set; } = "";

        [MaxLength(4000)]
        public string Type { get; set; } = "";

        public string Capacity { get; set; } = "";

        public string Amount { get; set; } = "";
        public long? SurveyId { get; set; }
        public long? FirefightingEquipmentId { get; set; }
        public bool? Availability { get; set; }
        public string CoverAreasRemarks { get; set; } = "";
    }
}
