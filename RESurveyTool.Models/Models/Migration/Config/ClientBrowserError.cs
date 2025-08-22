using SurveyReportRE.Models.Migration.Base;
using SurveyReportRE.Models.Request;

namespace SurveyReportRE.Models.Business.Migration.Config
{
    public class ClientBrowserError : BaseModel
    {
        public string Message { get; set; }         = "";
        public string Url { get; set; }             = "";
        public string UserAgent { get; set; }       = "";
        public string ErrorDetails { get; set; }    = "";
        public string Time { get; set; } = "";
        public ErrorBrowserDetails? ErrorBrowserDetails { get; set; }     
    }
}
