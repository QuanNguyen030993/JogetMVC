using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using SurveyReportRE.Models.Migration.Base;

namespace SurveyReportRE.Models.Migration.Business.Data
{
    public class OtherExposuresImg : BaseModel 
    {
        
        public string URL { get; set; } = "";

        public long?  AttachmentId { get; set; } = 0;

        [MaxLength(255)]
        public string Size { get; set; } = "";

        [MaxLength(255)]
        public string Scale { get; set; } = "";
    }
}
