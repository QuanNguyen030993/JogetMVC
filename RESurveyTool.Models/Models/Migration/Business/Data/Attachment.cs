using SurveyReportRE.Models.Migration.Base;
using SurveyReportRE.Models.Migration.Business.Form;
using SurveyReportRE.Models.Migration.Business.MasterData;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SurveyReportRE.Models.Migration.Business.Data
{
    public class Attachment : BaseModel
    {
        [Column("record_guid")]
        public string record_guid { get; set; }
        [Column("table_name")]
        public string table_name { get; set; }
        [Column("table_record_id")]
        public string table_record_id { get; set; }
        [Column("file_name")]
        public string file_name { get; set; }
        [Column("file_folder")]
        public string file_folder { get; set; }
        [Column("file_size")]
        public string file_size { get; set; }
        [Column("uploaded_by")]
        public string uploaded_by { get; set; }
        [Column("uploaded_at")]
        public string uploaded_at { get; set; }
        [Column("source_action")]
        public string source_action { get; set; }
        [Column("is_deleted")]
        public string is_deleted { get; set; }
        [Column("label_attachment")]
        public string label_attachment { get; set; }
        [Column("action_label")]
        public string action_label { get; set; }
    }

}
