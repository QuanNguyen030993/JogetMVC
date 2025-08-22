using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using SurveyReportRE.Models.Migration.Base;

namespace SurveyReportRE.Models.Migration.Business.Data
{
    public class OtherExposures : BaseModel 
    {
        public string NaturalHazardPicContent { get; set; } = "";
        public string Security { get; set; } = "";
        public byte[]? AdditionalOutline { get; set; }
        public string SurroundingAreas { get; set; } = "";
    }
}
