using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using ERPCore.Models.Migration.Base;
using ERPCore.Models.Migration.Config;

namespace ERPCore.Models.Migration.Business.MasterData
{
    public class Client : BaseModel 
    {
        
        //public long? SourceOfBusinessId { get; set; }
        //public EnumData? SourceOfBusinessEnum { get; set; } 
        public long? BusinessOccupationId { get; set; }
        public string? BusinessOccupation { get; set; }
        public EnumData? BusinessOccupationEnum { get; set; }
        public string ClientCode { get; set; } = "";
        public string ClientName { get; set; } = "";
        //public string PolicyCode { get; set; } = "";
        public long? OldClientCodeId { get; set; }
        public string ShortName { get; set; } = "";
        public string ClientId { get; set; } = "";
        public string Notes { get; set; } = "";
        public long? NationalityId { get; set; } = 0;
        public Country? NationalityFK { get; set; }
        public long? CountryId { get; set; } = 0;
        public Country? CountryFK { get; set; }
        public string PACode { get; set; } = "";
        public DateTime? CorporateDate { get; set; } //yyyymmdd 
        public string Salutation { get; set; } = "";
        public long? BranchId { get; set; } = 0;
        public string Type { get; set; } = "";
        public string PhoneNumber { get; set; } = "";
        public string JGCode { get; set; } = "";
        public string Segment { get; set; } = "";
        public long? SegmentId { get; set; } = 0;
        public EnumData? SegmentEnum { get; set; }
        public string BusinessAddress { get; set; } = "";
        public string StaffCode { get; set; } = "";
        public string StaffFlag { get; set; } = "";
        public long? StaffFlagId { get; set; } = 0;
        public EnumData? StaffFlagEnum { get; set; }
        public string Email { get; set; } = "";
        public string PostCode { get; set; } = "";
        public bool? Active { get; set; }          // (Y/N) 
        public string TaxAddress { get; set; } = "";
        public string TaxCode { get; set; } = "";
        public DateTime? DateOfBirth { get; set; }//yyyymmdd 
        public string OfficePhoneNumber { get; set; } = "";
        public string RepresentativeName { get; set; } = "";
        public string DisplayName { get; set; } = "";
        public DateTime? StartDate { get; set; }//yyyymmdd 
        public long? ClientTypeId { get; set; } = 0;
        public EnumData? ClientTypeEnum { get; set; }
        public long? TypeId { get; set; } = 0;
        public EnumData? TypeEnum { get; set; }
    }
}
