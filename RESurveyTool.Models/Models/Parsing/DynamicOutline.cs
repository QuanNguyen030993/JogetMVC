using SurveyReportRE.Models.Business.Migration.Config;
using SurveyReportRE.Models.Migration.Business.Data;
using SurveyReportRE.Models.Migration.Business.MasterData;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RESurveyTool.Models.Models.Parsing
{
    public class DynamicOutline
    {
        public Outline? Outline {  get; set; }
        public List<dynamic> Images { get; set; } = new List<dynamic>();
        public OutlineDynamic? OutlineDynamic { get; set; }  
        public DataGridConfig? DataGridConfig { get; set; }
        public SurveyOutlineOptions? SurveyOutlineOptions { get; set; }
		public string Content { get; set; } = "";
        public string Params { get; set; } = "";
    }
}
