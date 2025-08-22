
using System;
using System.Collections.Generic;
using System.Diagnostics.Contracts;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RESurveyTool.Models.Models.Base
{
    public class SeriLogs
    {
        public string Message { get; set; } = "";
        public string MessageTemplate { get; set; } = "";
        public string Level { get; set; } = "";
        public DateTime? TimeStamp { get; set; }   = DateTime.Now;
        public Exception? Exception { get; set; }
        public string Properties { get; set; } = "";
    }
}
