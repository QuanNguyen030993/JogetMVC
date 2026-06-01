
using ERPCore.Models.Migration.Base;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RESurveyTool.Models.Models.Parsing
{
    public class JiraSubmitRequest : BaseModel
    {
        public long? IssueId { get; set; }
        public string? ReportType { get; set; } 
        public string? Content { get; set; } = "";
        public string? CodeNo { get; set; } = "";
    }
}
