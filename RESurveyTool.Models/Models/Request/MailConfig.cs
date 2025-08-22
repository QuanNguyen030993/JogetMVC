namespace SurveyReportRE.Models.Request
{
    public class MailConfig
    {
        public string FromTitle { get; set; } = "";
        public string User { get; set; } = "";
        public string Password { get; set; } = "";
        public string SmtpDomainName { get; set; } = "";
        public string SmtpIP { get; set; } = "";
        public int NonTLS { get; set; }
        public int TLS { get; set; }
        public string FollowCC { get; set; } = "";
    }
}
