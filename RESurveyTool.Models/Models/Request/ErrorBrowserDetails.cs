using ERPCore.Models.Migration.Base;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ERPCore.Models.Request
{
    public class ErrorBrowserDetails : BaseModel
    {
        public int? Status { get; set; }
        public string? ResponseText { get; set; } = "";
        public string? Stack { get; set; } = "";

        // New fields for detailed error tracing
        public string? FileName { get; set; } = "";
        public int? LineNumber { get; set; }
        public int? ColumnNumber { get; set; }
        public string? FunctionName { get; set; } = "";
        public string? ErrorType { get; set; } = ""; // "uncaught", "promise", "fetch", etc.
        public string? Context { get; set; } // Page state or additional context
        public List<object>? BreadcrumbTrails { get; set; } // Recent user actions
        public string? BreadcrumbTrail { get; set; } // Recent user actions
    }
}
