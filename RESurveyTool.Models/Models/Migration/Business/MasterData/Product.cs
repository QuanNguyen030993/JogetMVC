using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using ERPCore.Models.Migration.Base;

namespace ERPCore.Models.Migration.Business.MasterData
{
    public class Product : BaseModel
    {

        [MaxLength(255)]
        public string ProductCode { get; set; } = "";
        [MaxLength(4000)]
        public string ProductName { get; set; } = "";
        public long? LineId { get; set; }               // FK -> Line.LineId (nullable for missing)

        public bool IsCfe { get; set; }
        public bool IsOthers { get; set; }
        public bool IsActive { get; set; }
        public bool ShowQuot { get; set; } // Not important refer later
        public bool ShowBiQuot { get; set; } // Not important refer later
        public string? ReportLink { get; set; }
        public string? ReportLink2 { get; set; }
        // public string? LineOfBusinessName { get; set; }

        // public string? TermsConEng { get; set; }
        // public string? TermsConViet { get; set; }

    }
}
