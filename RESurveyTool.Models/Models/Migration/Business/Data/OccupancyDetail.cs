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
    public class OccupancyDetail : BaseModel 
    {

        [MaxLength(255)]
        public string Quantity { get; set; } = "";

        [MaxLength(4000)]
        public string InstalledPosition { get; set; } = "";

        
        public string TechnicalSpec { get; set; } = "";

        public long? UtilityTypeId { get; set; }
        public EnumData? UtilityTypeFK { get; set; }    

        public long? IndGasSupTypeId { get; set; }
        public EnumData? IndGasSupTypeFK { get; set; }  
        public long? SurveyId { get; set; }
        public string Capacity { get; set; } = "";
        public long? IndGasSupCategoryTypeId { get; set; }
        public EnumData? IndGasSupCategoryTypeFK { get; set; }
    }
}
