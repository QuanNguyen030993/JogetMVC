namespace SurveyReportRE.Models.Request
{
    public class MailItem
    {
        public string ToName { get; set; } = "";
        public string ToEmail { get; set; } = "";
        public string Subject { get; set; } = "";
        public string TextBody { get; set; } = "";
        public string HtmlBody { get; set; } = "";
        public string CC { get; set; } = "";
        public string BCC { get; set; } = "";

    }
}
