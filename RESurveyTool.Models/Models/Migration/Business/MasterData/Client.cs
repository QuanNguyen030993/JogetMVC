using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using ERPCore.Models.Migration.Base;

namespace ERPCore.Models.Migration.Business.MasterData
{
    public class Client : BaseModel 
    {
        public string ClientCode { get; set; } = "";

        public string ClientName { get; set; } = "";
        public string PolicyCode { get; set; } = "";
        public long? OldClientCodeId { get; set; }
        public string ShortName { get; set; } = "";
        public string TSCode { get; set; } = "";
        public string ClientId { get; set; } = "";
        public string Notes { get; set; } = "";
        public string Nationality { get; set; } = "";
        public string PACode { get; set; } = "";
        public DateTime? CorporateDate { get; set; } //yyyymmdd 
        public string FOCode { get; set; } = "";
        public string Salutation { get; set; } = "";
        public long? BranchId { get; set; }
        public string Type { get; set; } = "";
        public string PhoneNumber { get; set; } = "";
        public string JGCode { get; set; } = "";
        public string Segment { get; set; } = "";
        public string BusinessAddress { get; set; } = "";
        public string BusinessOccupation { get; set; } = "";
        public string StaffCode { get; set; } = "";
        public string StaffFlag { get; set; } = "";
        public string Email { get; set; } = "";
        public string PostCode { get; set; } = "";
        public bool? Active { get; set; }// (Y/N) 
        public string TaxAddress { get; set; } = "";
        public string TaxCode { get; set; } = "";
        public DateTime? DateOfBirth { get; set; }//yyyymmdd 
        public string OfficePhoneNumber { get; set; } = "";
        public string RepresentativeName { get; set; } = "";
        public DateTime? StartDate { get; set; }//yyyymmdd 
        public string SourceOfBusiness { get; set; } = "";


    }
}
