using SurveyReportRE.Models.Migration.Base;
using System.ComponentModel.DataAnnotations;

namespace SurveyReportRE.Models.Migration.Business.Data
{
    public class DataGridConfigDynamic : BaseModel
    {
        public bool AllowGrouping { get; set; } = true;
        public bool AllowHeaderFiltering { get; set; } = true;
        public string Caption { get; set; } = "";
        public string DataField { get; set; } = "";
        public string DataType { get; set; } = "";
        public string FormDataType { get; set; } = "";
        public byte[]? EditorOptions { get; set; }
        public byte[]? FormItem { get; set; }
        public string CalculateFilterExpression { get; set; } = "";
        public int? SysTableId { get; set; }
        public int? Order { get; set; }
        public string FormGroupName { get; set; } = "";
        public string GridGroupName { get; set; } = "";
        public string Note { get; set; } = "";
        public int? GridVisibleIndex { get; set; }
        public int? FormVisibleIndex { get; set; }
        public bool Visible { get; set; } = true;
        public string ValidationRules { get; set; } = "";
        public string DefaultValue { get; set; } = "";
        public bool? Fixed { get; set; } = false;
        public string FixedPosition { get; set; } = "";
        public string CSSClass { get; set; } = "";
        public string Width { get; set; } = "";
        public string Height { get; set; } = "";
        public string FormWidth { get; set; } = "";
        public string FormHeight { get; set; } = "";
        public long? MappingFieldId { get; set; }
    }
}
