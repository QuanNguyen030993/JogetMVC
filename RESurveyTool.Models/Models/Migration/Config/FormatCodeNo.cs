using ERPCore.Models.Business.Migration.Config;
using ERPCore.Models.Migration.Base;

namespace ERPCore.Models.Migration.Config
{
    public class FormatCodeNo : BaseModel
    {
        public string NoSeqCode { get; set; } = "";
        public int? Smallest { get; set; } = 0;
        public int? Largest { get; set; } = 0;
        public int? Next { get; set; } = 0;
        public string Format { get; set; } = "";
        public long? SysTableId { get; set; }
        public SysTable? SysTableFK { get; set; }
        public string DateFormat { get; set; } = "";
        public bool? IsSysNum { get; set; } = false;
        public bool? IsDefault { get; set; } = false;
    }
}
