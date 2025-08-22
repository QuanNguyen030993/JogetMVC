using Microsoft.VisualBasic;
using SurveyReportRE.Models.Migration.Base;
using System.ComponentModel.DataAnnotations;

namespace SurveyReportRE.Models.Business.Migration.Config
{
    public class DataGridConfig : BaseModel
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
        public SysTable? SysTableFK { get; set; }
        public int? Order { get; set; } //Common Order
        public string FormGroupName { get; set; } = "";
        public string GridGroupName { get; set; } = "";
        public string Note { get; set; } = "";
        public int? GridVisibleIndex { get; set; } // Override Grid Order
        public int? FormVisibleIndex { get; set; } // Override Form Order
        public bool Visible { get; set; } = true; //Is Visible on Grid
        public string ValidationRules { get; set; } = ""; //Validation Rules Fields Form
        public string DefaultValue { get; set; } = ""; //Default fill in data string, date, number
        public bool? Fixed { get; set; } = false; // Is Freezing column 
        public string FixedPosition { get; set; } = ""; // Freezing left right 
        public string Width { get; set; } = ""; //Column Width
        public string Height { get; set; } = "";//Column Height
        public string FormWidth { get; set; } = "";//Form Item Width
        public string FormHeight { get; set; } = "";//Form Item Height
        public long? MappingFieldId { get; set; }
        public SysTable? MappingFieldFK { get; set; }   
    }
}
