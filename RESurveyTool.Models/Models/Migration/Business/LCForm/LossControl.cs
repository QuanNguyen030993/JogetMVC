using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Reflection.Metadata;
using System.Text;
using System.Threading.Tasks;
using SurveyReportRE.Models.Migration.Base;
using SurveyReportRE.Models.Migration.Business.Form;

namespace SurveyReportRE.Models.Migration.Business.LCForm
{
    public class LossControl : BaseModel
    {
        [MaxLength(4000)]
        public string CompanyName { get; set; } = "";
        public DateTime? DateOfVisit { get; set; }
        [MaxLength(4000)]
        public string LatitudeLongitude { get; set; } = "";
        [MaxLength(8000)]
        public string LocationAddress { get; set; } = "";
        [MaxLength(4000)]
        public string SurveyedBy { get; set; } = "";
        [MaxLength(100)]
        public string SurveyedByAccountName { get; set; } = "";
        [MaxLength(4000)]
        public string LossControlNo { get; set; } = "";
        public string SurveyedPremises { get; set; } = "";
        public string Ownership { get; set; } = "";
        public string Department { get; set; } = "";
        [MaxLength(100)]
        public string ApprovalBy { get; set; } = "";
        public DateTime? ApprovalDate { get; set; }
        [MaxLength(8000)]
        public string Comment { get; set; } = "";
        public DateTime? DueDate { get; set; }
        [MaxLength(8000)]
        public string RecallReason { get; set; } = "";
        [MaxLength(100)]
        public string GrantSurvey { get; set; } = "";
        [MaxLength(4000)]
        public string ClientName { get; set; } = "";
        public DateTime? SubmitDate { get; set; }
        public bool? WordRendered { get; set; }
        public bool? PowerPointRendered { get; set; }
        public bool? NeedPDFConvert { get; set; }
        public bool? IsArchived { get; set; }
        [MaxLength(4000)]
        public string ClientCode { get; set; } = "";
        [MaxLength(100)]
        public string OwnerReport { get; set; } = "";
        public long? SurveyId { get; set; }
        public Survey? SurveyFK { get; set; }
    }
}
