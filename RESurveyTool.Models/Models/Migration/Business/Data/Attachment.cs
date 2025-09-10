using SurveyReportRE.Models.Migration.Base;
using SurveyReportRE.Models.Migration.Business.Form;
using SurveyReportRE.Models.Migration.Business.MasterData;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SurveyReportRE.Models.Migration.Business.Data
{
    public class Attachment : BaseModel
    {
        
        public string FileName { get; set; } = "";
        [MaxLength(4000)]
        public string FileType { get; set; } = "";
        
        public string SubDirectory { get; set; } = "";
        public Guid? RecordGuid { get; set; }
        public string OutlinePlaceholder { get; set; } = "";
        public bool? IsDynamicOutline { get; set; }
        public long? Size { get; set; }
        public int? ItemWidth { get; set; } 
        public int? ItemHeight { get; set; }
        public string AttachmentNote { get; set; } = "";
        public string SubThumbnailDirectory { get; set; } = "";
        public string SubOverviewDirectory { get; set; } = "";
        public string SubSitePictureDirectory { get; set; } = "";
        public bool? IsPrimary { get; set; } = false;
    }

}
