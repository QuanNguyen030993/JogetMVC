using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using SurveyReportRE.Models.Migration.Base;

namespace SurveyReportRE.Models.Migration.Business.Data
{
    public class SitePictures : BaseModel
    {
        public long? AttachmentId { get; set; }
        public Attachment? AttachmentFK { get; set; }   
        public string AttachmentNote { get; set; } = "";
        public long? SurveyId { get; set; }

    }
}
