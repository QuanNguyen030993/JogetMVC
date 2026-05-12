using System;
using System.ComponentModel.DataAnnotations;
using ERPCore.Models.Migration.Base;
    public class TurnAroundTimeConfig : BaseModel
{
        [MaxLength(100)]
        public string? Department { get; set; }

        /// <summary>TAT Gap (days) — biz rule: Due date >= TAT gap + TAT_TS</summary>
        public int TATGapDays { get; set; }

        /// <summary>TAT_TS (days)</summary>
        public int TATTSDays { get; set; }

        /// <summary>Số ngày thông báo trước (Renew: 90 ngày)</summary>
        public int NotifyBeforeDays { get; set; } = 0;

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }
    }

  
