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
    public class CommentLog
    {
        public long CommentId { get; set; }

        //public long QuotationId { get; set; }
        public Guid RecordGuid { get; set; }    

        public string QuotationCode { get; set; } = default!; // denormalize (optional)
        public string? DeptCode { get; set; }                 // MKT/TS/UW/...

        public int? CommentOrder { get; set; }                // c.order

        public string? CommentBy { get; set; }                // c.user

        public DateTime? CommentTime { get; set; }            // c.time (parsed)

        public string? CommentText { get; set; }              // c.comment

        public string? SourceSystem { get; set; }             // Joget/Portal/API...

        public string? SourceRef { get; set; }                // id bên hệ nguồn

        public string? RawJson { get; set; }                  // lưu raw item nếu cần

        public DateTime CreatedAtUtc { get; set; } = DateTime.Now;
        public virtual Quotation? Quotation { get; set; }
    }
}
