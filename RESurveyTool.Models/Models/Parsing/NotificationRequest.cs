using ERPCore.Models.Migration.Base;

namespace RESurveyTool.Models.Models.Parsing
{
    public class NotificationRequest : BaseModel
    {
        public Notification? Notification { get; set; }
        public MKTSurveyRequest? MKTSurveyRequest { get; set; }
        public string connectionId { get; set; } = "";
    }
    public class Notification : BaseModel
    {
        public string Title { get; set; } = "";
        public string Message { get; set; } = "";
        public bool IsRead { get; set; } = false;
        public string? Url { get; set; } = "";
        public string? Resource { get; set; } = "";
        public string? System { get; set; } = "";
        public string? ReceivedBy { get; set; } = "";
    }
    public class MKTSurveyRequest : BaseModel
    {
        public string MKTPIC { get; set; } = "";
        public string MKTPICAccount { get; set; } = "";
        public string ClientCode { get; set; } = "";
        public long? ClientId { get; set; } = 0;
        public string ClientName { get; set; } = "";
        public string PolicyCode { get; set; } = "";
        public string LineName { get; set; } = "";
        public string ProductName { get; set; } = "";
        public DateTime? DueDate { get; set; }
        public Guid? RecordGuid { get; set; }
    }
}
