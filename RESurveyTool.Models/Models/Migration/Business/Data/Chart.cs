using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Net.Mail;
using System.Text;
using System.Threading.Tasks;
using SurveyReportRE.Models.Migration.Base;

namespace SurveyReportRE.Models.Migration.Business.Data
{
    public class Chart : BaseModel
    {
        
        public string XMLCode { get; set; } = "";

        public long? SurveyId { get; set; }
        public long? AttachmentId { get; set; }
        public Attachment? AttachmentFK { get; set; }
    }
}
