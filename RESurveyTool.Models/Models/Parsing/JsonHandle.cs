using ERPCore.Models.Business.Migration.Config;
using ERPCore.Models.Migration.Business.Data;
using ERPCore.Models.Migration.Business.MasterData;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ERPCore.Models.Models.Parsing
{
    public class JsonHandle : EmptyClass
    {
        public class TurnAroundAttributes
        {
            //{    "FO": { "acceptDate": "2026-03-16 09:15:00", "completeDate": "2026-03-16 10:30:00" },    "TS": { "acceptDate": "2026-03-16 09:15:00", "completeDate": "2026-03-16 09:15:00" },    "UW": { "acceptDate": "2026-03-16 09:15:00", "completeDate": "2026-03-16 09:15:00" },    "LMKT": { "acceptDate": "2026-03-16 09:15:00", "completeDate": "2026-03-16 09:15:00" },    "PM": { "acceptDate": "2026-03-16 09:15:00", "completeDate": "2026-03-16 09:15:00" }  }
            public TurnAroundItem? FO { get; set; }
            public TurnAroundItem? TS { get; set; }
            public TurnAroundItem? UW { get; set; }
            public TurnAroundItem? LMKT { get; set; }
            public TurnAroundItem? PM { get; set; }
        }
        public class PICAttributes
        {
            //{    "FO": { "acceptDate": "2026-03-16 09:15:00", "completeDate": "2026-03-16 10:30:00" },    "TS": { "acceptDate": "2026-03-16 09:15:00", "completeDate": "2026-03-16 09:15:00" },    "UW": { "acceptDate": "2026-03-16 09:15:00", "completeDate": "2026-03-16 09:15:00" },    "LMKT": { "acceptDate": "2026-03-16 09:15:00", "completeDate": "2026-03-16 09:15:00" },    "PM": { "acceptDate": "2026-03-16 09:15:00", "completeDate": "2026-03-16 09:15:00" }  }
            public string? FO { get; set; }
            public string? TS { get; set; }
            public string? UW { get; set; }
            public string? LMKT { get; set; }
            public string? PM { get; set; }
        }

        public class PICSysHandleAttributes
        {
            //{    "FO": { "acceptDate": "2026-03-16 09:15:00", "completeDate": "2026-03-16 10:30:00" },    "TS": { "acceptDate": "2026-03-16 09:15:00", "completeDate": "2026-03-16 09:15:00" },    "UW": { "acceptDate": "2026-03-16 09:15:00", "completeDate": "2026-03-16 09:15:00" },    "LMKT": { "acceptDate": "2026-03-16 09:15:00", "completeDate": "2026-03-16 09:15:00" },    "PM": { "acceptDate": "2026-03-16 09:15:00", "completeDate": "2026-03-16 09:15:00" }  }
            public FO? FO { get; set; }
            public string? TS { get; set; }
            public string? UW { get; set; }
            public string? LMKT { get; set; }
            public string? PM { get; set; }
        }


        public class TurnAroundItem
        {
            public DateTime? ReceiveDate { get; set; }
            public DateTime? AcceptDate { get; set; }
            public DateTime? CompleteDate { get; set; }
        }


        
    }
}
