using ERPCore.Models.Migration.Base;
using ERPCore.Models.Migration.Business.Social;

namespace RESurveyTool.Models.Models.Parsing
{
    public class NotificationRequest : BaseModel
    {
        public Notification? Notification { get; set; }
        public string connectionId { get; set; } = "";
        public object tabPublicUrl { get; set; }
    }
}
