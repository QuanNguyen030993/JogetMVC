using System;
using System.ComponentModel.DataAnnotations;
using ERPCore.Models.Migration.Base;
    
    public class TurnAroundTimeDeptProcessing : BaseModel
{
        public long TurnAroundTimeSessionId { get; set; }
    [MaxLength(100)]
    /// <summary>FO | TS | UW | LMKT | PM</summary>
    public string Department { get; set; } = string.Empty;

        public DateTime? AcceptDate { get; set; }
        public DateTime? CompleteDate { get; set; }

        /// <summary>DATEDIFF(day, AcceptDate, CompleteDate) — tính khi Complete</summary>
        public int ProcessingDays { get; set; } = 0;
    }

  

  
