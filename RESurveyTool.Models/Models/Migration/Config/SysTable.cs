using Microsoft.VisualBasic;
using SurveyReportRE.Models.Migration.Base;
using System.ComponentModel.DataAnnotations;

namespace SurveyReportRE.Models.Business.Migration.Config
{
    public class SysTable : BaseModel
    {
        public string Name {get;set;} = "";
        public string GridEditorOptions { get; set; } = "";
        public string ToolbarItemsConfig { get; set; } = "";
        public string DisplayExpr { get; set; } = "";
        public string CustomQuery { get; set; } = "";
        public string Export { get; set; } = "";
    }
}
