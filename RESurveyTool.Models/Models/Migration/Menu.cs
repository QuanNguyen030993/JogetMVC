using SurveyReportRE.Models.Migration.Base;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SurveyReportRE.Models
{
	public class Menu : BaseModel
	{
        public string Name {get;set;} = "";
        public string Caption { get; set; } = "";
        public string Area { get; set; } = "";
        public string Controller { get; set; } = "";
        public string Action { get; set; } = "";
        public string ActionUri { get; set; } = "";
        public string Parameter { get; set; } = "";
        public int? ParentId { get; set; }
        public int? SortOrder { get; set; }
        public bool? Active { get; set; } = false;
        public bool? IsMobile { get; set; }
        public string Icon { get; set; } = "";
        public string PageSystem { get; set; } = "";
    }
}
