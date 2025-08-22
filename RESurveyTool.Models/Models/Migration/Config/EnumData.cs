using SurveyReportRE.Models.Migration.Base;

namespace SurveyReportRE.Models.Migration.Config
{
	public class EnumData : BaseModel
	{
		public string Name {get;set;} = "";
        public long Value { get; set; } = 0;
        public string Key { get; set; } = "";
        public int? SysTableId { get; set; }
        public string SysTableName { get; set; } = "";
        public string MappingField { get; set; } = "";
        public int? EnumOrder { get; set; } = 0;
    }
}
