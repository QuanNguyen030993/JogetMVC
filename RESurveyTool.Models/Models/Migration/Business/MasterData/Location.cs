using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using SurveyReportRE.Models.Migration.Base;

namespace SurveyReportRE.Models.Migration.Business.MasterData
{
    public class Location : BaseModel 
    {
        public long? BranchId { get; set; } 

        [MaxLength(4000)]
        public string LocationAddress { get; set; } = "";

        [MaxLength(4000)]
        public string LocationName { get; set; } = "";
        public long? ClientId { get; set; }
        public string ShortLocationName { get; set; } = "";
        public string ProvinceId { get; set; } = "";
        public string DistrictId { get; set; } = "";
        public string WardId { get; set; } = "";
        public string StreetName { get; set; } = "";
        public string StreetNumber { get; set; } = "";
        public string BuildingName { get; set; } = "";
        public string Floor { get; set; } = "";
        public string RoomNumber { get; set; } = "";
        public string Hamlet { get; set; } = "";
        public string AreaName { get; set; } = "";
        public string PostalCode { get; set; } = "";
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
    }
}
