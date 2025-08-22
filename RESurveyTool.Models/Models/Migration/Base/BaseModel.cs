using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace SurveyReportRE.Models.Migration.Base
{
    public class BaseModel
    {
        public BaseModel() { 
            Guid = Guid.NewGuid();
        }  
        public long Id { get; set; }
        public virtual Guid Guid { get; set; }
        [JsonIgnore]
        public virtual string CreatedBy { get; set; } = "";
        [JsonIgnore]
        public virtual DateTime? CreatedDate { get; set; } = DateTime.Now;
        [JsonIgnore]
        public virtual string ModifiedBy { get; set; } = "";
        [JsonIgnore]
        public virtual DateTime? ModifiedDate { get; set; } = DateTime.Now;
        [JsonIgnore]
        public bool Deleted { get; set; } = false;
        [JsonIgnore]
        public string DeletedBy { get; set; } = "";
        [JsonIgnore]
        public DateTime? DeletedDate { get; set;} = DateTime.Now;   
        public long? RowOrder { get; set; }
        [JsonIgnore]
        public Guid? CopyFromGuid { get; set; }
        [JsonIgnore]
        public Guid? DraftGuid { get;set; } 
    }
}
