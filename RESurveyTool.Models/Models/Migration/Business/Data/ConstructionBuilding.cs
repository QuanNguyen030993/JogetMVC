using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using SurveyReportRE.Models.Migration.Base;

namespace SurveyReportRE.Models.Migration.Business.Data
{
    public class ConstructionBuilding : BaseModel 
    {
        public string Area { get; set; } = "";
        public string ColumnBeam { get; set; } = "";
        public string ConstructionBuildingNo { get; set; } = "";
        public string Roof { get; set; } = "";
        public string Wall { get; set; } = "";
        public long? SurveyId { get; set; }
        public string YearBuilt { get; set; } = "";
        public string Height { get; set; } = "";
        public string Pillars { get; set; } = "";
        public string Occupancy { get; set; } = "";
        public string NumberOfStories { get; set; } = "";
        public string NameOfBuilding { get; set; } = "";
        public string NumberOfFloors { get; set; } = "";

    }
}
