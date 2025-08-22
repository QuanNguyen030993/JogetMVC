using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SurveyReportRE.Models.Request
{
    public class ErrorBrowserDetails
    {
        public int? Status { get; set; }
        public string? ResponseText { get; set; } = "";
        public string? Stack { get; set; } = "";
    }
}
