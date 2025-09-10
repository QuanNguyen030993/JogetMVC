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
    public class CopyAttachment
    {
        public Attachment? OldAttachment { get; set; }    
        public Attachment? NewAttachment { get; set; }    

    }
}
