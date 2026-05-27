using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ERPCore.Models.Business.Migration.Config
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
        public string DefaultStatusSurveyEvaluation { get; set; } = "";
        public string HCMSiteName { get; set; } = "";
        public string HNSiteName { get; set; } = "";
        public string HCMSiteEmailCCAccount { get; set; } = "";
        public string HNSiteEmailCCAccount { get; set; } = "";
        public Workflow? Workflow { get; set; }
        public Dictionary<string, SiteConfig> Sites { get; set; } = new Dictionary<string, SiteConfig>();
    }

    public class SiteConfig
    {
        public int? BranchCode { get; set; } = 0;
        public string Name { get; set; } = "";
        public string EmailCCAccount { get; set; } = "";
        public string OwnData { get; set; } = "";   
    }

    public class Workflow
    {
        public string Quotation { get; set; } = "";
        public string PolicyIssuance { get; set; } = ""; 
    }

}
