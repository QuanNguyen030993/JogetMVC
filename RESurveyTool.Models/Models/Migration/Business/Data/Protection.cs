using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using SurveyReportRE.Models.Migration.Base;

namespace SurveyReportRE.Models.Migration.Business.Data
{
    public class Protection : BaseModel 
    {
        public string PublicFireBrigade { get; set; } = "";
        public string MaintenanceProgram { get; set; } = ""; 
        public string FireProtection { get; set; } = "";
        public string LightingProtection { get; set; } = "";
        public string SecurityControl { get; set; } = "";
        public byte[]? AdditionalOutline { get; set; }
    }
}
