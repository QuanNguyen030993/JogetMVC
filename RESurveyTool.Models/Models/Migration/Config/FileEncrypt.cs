using SurveyReportRE.Models.Migration.Base;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;

namespace SurveyReportRE.Models.Migration.Config
{
    public class FileEncrypt : BaseModel
    {
        public long? AttributeId { get; set; }
        public EnumData? AttributeEnum { get; set; }
        [MaxLength(8000)]
        public string PassWordHash { get; set; } = "";
    }
}
