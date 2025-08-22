using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using SurveyReportRE.Models.Migration.Base;

namespace SurveyReportRE.Models.Migration.Business.Data
{
    public class ExtFireExpExposures : BaseModel 
    {
        public string EastArea { get; set; } = "";
        public string EastContent { get; set; } = "";
        public string FactoryName { get; set; } = "";
        public string NorthArea { get; set; } = "";
        public string NorthContent { get; set; } = "";
        public string SouthArea { get; set; } = "";
        public string SouthContent { get; set; } = "";
        public string WestArea { get; set; } = "";
        public string WestContent { get; set; } = "";
        public string FooterContent { get; set; } = "";
        public string NaturalHazardPicContent { get; set; } = "";
        public string Security { get; set; } = "";
        public byte[]? AdditionalOutline { get; set; }
        public string SurroundingAreas { get; set; } = "";
    }
}
