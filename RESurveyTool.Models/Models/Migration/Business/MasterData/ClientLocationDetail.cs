using SurveyReportRE.Models.Migration.Base;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SurveyReportRE.Models.Migration.Business.MasterData
{
    public class ClientLocationDetail : BaseModel
    {
        public int? LocationId { get; set; }
        public int? ClientId { get; set; }

    }
}
