using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using static ERPCore.Models.Models.Parsing.JsonHandle;

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
        public Workflow? Workflow { get; set; }
        public SLA? SLA { get; set; }
        public Dictionary<string, SiteConfig> Sites { get; set; } = new Dictionary<string, SiteConfig>();
    }
    public class SLA
    {
        public string RenewQuotation { get; set; }
    }
    public class SiteConfig
    {
        public string BranchCode { get; set; }
        public string Name { get; set; }
        public string EmailCCAccount { get; set; }

        public PICSysHandleAttributes LeaderFollowRequest { get; set; }
        public PICAttributes HODFollowRequest { get; set; }
        public string HelpingDraft { get; set; }
        public string OwnData { get; set; }
    }

    // Nếu muốn custom riêng HCM/HN thì có thể kế thừa
    public class HCMSiteConfig : SiteConfig
    {
        // thêm field riêng nếu cần
    }

    public class HNSiteConfig : SiteConfig
    {
        // thêm field riêng nếu cần
    }

    //public class LeaderFollowRequest
    //{
    //    public FO FO { get; set; }
    //    public string TS { get; set; }
    //    public string UW { get; set; }
    //    public string PM { get; set; }
    //}

    public class FO
    {
        public string CBJ { get; set; }
        public string CB { get; set; }
        public string BDP { get; set; }
        public string BR { get; set; }
    }

    public class HODFollowRequest
    {
        public string FO { get; set; }
        public string TS { get; set; }
        public string UW { get; set; }
        public string PM { get; set; }
    }
    public class Workflow
    {
        public string Quotation { get; set; } = "";
        public string PolicyIssuance { get; set; } = ""; 
    }

}
