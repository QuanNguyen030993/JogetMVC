using SurveyReportRE.Models.Migration.Business.Config;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RESurveyTool.Models.Models.Parsing
{
    public class GrantSurvey
    {
        public List<Users> GrantUsers { get; set; } = new List<Users>();
    }
}
