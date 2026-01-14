using ERPCore.Models.Migration.Base;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ERPCore.Models
{
    public class QuotationWorkflowHistory
    {
        public long HistoryId { get; set; }

        public long QuotationId { get; set; }

        public string QuotationCode { get; set; } = default!; // denormalize (optional)

        public int? StepNo { get; set; }                      // thứ tự nếu có

        public string DeptCode { get; set; } = default!;      // x.dept

        public DateTime? ActionTime { get; set; }             // x.time (parsed)

        public string? ActionNote { get; set; }               // x.note

        public string? FromDeptCode { get; set; }             // optional

        public string? ToDeptCode { get; set; }               // optional

        public string? ActionCode { get; set; }               // Approved/Returned/Submitted...

        public string? Actor { get; set; }                    // người thực hiện (nếu có)

        public string? SourceSystem { get; set; }

        public string? SourceRef { get; set; }

        public string? RawJson { get; set; }

        public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

        public virtual Quotation? Quotation { get; set; }
    }
}
