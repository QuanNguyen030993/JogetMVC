using System;
using System.ComponentModel.DataAnnotations;
using SurveyReportRE.Models.Migration.Base;
namespace SurveyReportRE.Models.Migration.Business.Workflow
{
    public class ReinsurranceQuarterly : BaseModel
    {
        [MaxLength(255)]
        public string No { get; set; } = "";
        [MaxLength(255)]
        public string CategoryOfProcess { get; set; } = "";
        [MaxLength(255)]
        public string ClientName { get; set; } = "";
        [MaxLength(255)]
        public string LineOfBusiness { get; set; } = "";
        [MaxLength(255)]
        public string PolicyNo { get; set; } = "";
        [MaxLength(255)]
        public string NBRNEN { get; set; } = "";
        [MaxLength(255)]
        public string PeriodFrom { get; set; } = "";
        [MaxLength(255)]
        public string UWPIC { get; set; } = "";
        [MaxLength(255)]
        public string Address { get; set; } = "";

    }
}