using ERPCore.Models.Migration.Base;

namespace ERPCore.Models.Migration.Config
{
	public class EnumData : BaseModel
	{
		public string Name {get;set;} = "";
        public string Value { get; set; } = "";
        public string Key { get; set; } = "";
        public string Code { get; set; } = "";
        public int? SysTableId { get; set; }
        public string SysTableName { get; set; } = "";
        public string MappingField { get; set; } = "";
        public int? EnumOrder { get; set; } = 0;
    }
}
