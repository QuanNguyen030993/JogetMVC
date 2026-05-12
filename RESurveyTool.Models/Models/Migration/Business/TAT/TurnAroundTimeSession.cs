using System;
using ERPCore.Models.Migration.Base;

    
    public class TurnAroundTimeSession : BaseModel
    {
        /// <summary>Số thứ tự phiên: 1, 2, 3 ...</summary>
        public int SessionNo { get; set; }

        /// <summary>New | Renew | Amend</summary>
        public long? SessionTypeId { get; set; } 

        public DateTime? SessionStartDate { get; set; }

        public DateTime? SessionEndDate { get; set; }

    /// <summary>Tổng ngày = SUM(DeptProcessing.ProcessingDays) trong phiên này</summary>
    public int TotalDays { get; set; } = 0;

        /// <summary>InProgress | Completed | Cancelled</summary>
        public Guid RecordGuid { get; set; } = Guid.Empty;
        // Navigation
    }
