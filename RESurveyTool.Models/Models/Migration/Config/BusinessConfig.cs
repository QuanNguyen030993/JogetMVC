using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SurveyReportRE.Models.Business.Migration.Config
{
    public class BusinessConfig
    {
        public int SurveyDueDatePeriod { get; set; } = 0;
        public string ManagerAppKey { get; set; } = "";
        public string ApproverAppKey { get; set; } = "";
        public string CheckerAppKey { get; set; } = "";
        public string UserAppKey { get; set; } = "";
        public string DefaultCurrencyEnumName { get; set; } = "";
        public string DefaultCurrencyType { get; set; } = "";
        public string ApprovedDocxFileName { get; set; } = "";
        public string SuffixApprovedDocxFileName { get; set; } = "";
        public string SurveyEvaluationStatusKeyName { get; set; } = "";
        public string SurveyEvaluationCategoryKeyName { get; set; } = "";
        public string DefaultStatusSurveyEvaluation { get; set; } = "";
        public string HCMSiteName { get; set; } = "";
        public string HNSiteName { get; set; } = "";
        public string HCMSiteEmailCCAccount { get; set; } = "";
        public string HNSiteEmailCCAccount { get; set; } = "";
    }
}
