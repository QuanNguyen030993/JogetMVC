using System.ComponentModel.DataAnnotations;
using ERPCore.Models.Migration.Base;
using ERPCore.Models.Migration.Config;

namespace ERPCore.Models.Migration.Business.MasterData
{
    public class NotificationTemplate : BaseModel
    {
        public string TemplateName { get; set; } = "";

        public string Title { get; set; } = "";

        public string Content { get; set; } = "";

        public long? TypeId { get; set; }
        public EnumData? TypeEnum { get; set; }

        public bool? IsActive { get; set; }
    }
}
