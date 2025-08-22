using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using SurveyReportRE.Models.Migration.Base;

namespace SurveyReportRE.Models.Migration.Business.Data
{
    public class Construction : BaseModel 
    {
        
        public string ConstructionContent { get; set; } = "";
        
        public string LayoutContent { get; set; } = "";
        public string ConstructionBuildingPivot { get; set; } = "";
        public string FireSpreadRisk { get; set; } = "";
        public byte[]? AdditionalOutline { get; set; }
        public string BuildingConditions { get; set; } = "";
    }
}
