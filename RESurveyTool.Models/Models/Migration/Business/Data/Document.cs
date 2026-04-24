using ERPCore.Models.Migration.Base;
using ERPCore.Models.Migration.Business.Form;
using ERPCore.Models.Migration.Business.MasterData;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ERPCore.Models.Migration.Business.Data
{
    public class Document: BaseModel
    {
        public string FileName { get; set; } = "";
        public string FileType { get; set; } = "";
        public string SubDirectory { get; set; } = "";
        public Guid? RecordGuid { get; set; }
        public long? Size { get; set; }
        public int? ItemWidth { get; set; }
        public int? ItemHeight { get; set; }
        public string SubThumbnailDirectory { get; set; } = "";
        public string AttachmentNote { get; set; } = "";
        public bool? IsPrimary { get; set; } = false;
        public string Attributes { get; set; } = "";
    }

}
