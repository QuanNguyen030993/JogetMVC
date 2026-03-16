using ERPCore.Models.Migration.Base;
using ERPCore.Models.Migration.Business.Data;
public class Res : BaseModel
{
    // =========================
    // I — Header / Request / Linkage
    // =========================
    public string? ResRequestNo { get; set; }        // c_reqResNo
    public string? QuotationId { get; set; }         // c_jogetQuoNum
    public Quotation? QuotationFK { get; set; }
    public string? DocumentId { get; set; }          // from c_atId
    public Document? DocumentFK { get; set; }   
    public string? AttachmentId { get; set; }        // from c_atId
    public Attachment? AttachmentFK { get; set; }   

    // TODO
    // public string? QuotationCodeView { get; set; } // c_quoNumView

    // =========================
    // II — Business Identity
    // =========================
    public string? TmiCode { get; set; }             // c_tmiCode

    // =========================
    // III — Workflow / Assignee
    // =========================
    // REMOVED BY DESIGN

    // =========================
    // IV — Referral / UW / Authority / Grading
    // =========================
    public string? Reason { get; set; }                  // c_reason
    public string? IsReferralRequired { get; set; }      // c_reasonForReferralYN
    public string? ReferralReason { get; set; }          // c_reasonForReferralReasons
    public string? UwAuthorityCondition { get; set; }    // c_authUwCond
    public string? UwAuthorityForm { get; set; }         // c_authUwForm
    public string? RiskGrade { get; set; }               // c_riskGrade
    public string? ShowRiskGrade { get; set; }           // c_showGrade
    public string? MktProposalComment { get; set; }      // c_MKTCommentProp
    public string? UwComment { get; set; }               // c_UWComments
    public string? UwCommentAttachment { get; set; }     // c_UWCommentsAtt

    // =========================
    // V — Exposure / TSI / Retention / Share
    // =========================
    public string? TotalSumInsured { get; set; }         // c_TSI
    public string? IsTsiCalculated { get; set; }         // c_TSIFlag
    public string? TsiPropertyDamage { get; set; }       // c_TSIPd

    public string? TopRiskAmount { get; set; }           // c_topRisk
    public string? TopRiskPropertyDamage { get; set; }   // c_topRiskPd
    public string? IsTopRiskCalculated { get; set; }     // c_topRiskFlag

    public string? Exposure { get; set; }                // c_exposure

    public string? Deductible { get; set; }              // c_deductible
    public string? VoluntaryDeductible { get; set; }     // c_voluntary

    public string? TmivShare { get; set; }               // c_TMIVShare

    public string? Retention { get; set; }               // c_retention
    public string? NetRetention { get; set; }            // c_netRetention
    public string? NetRetentionType { get; set; }        // c_netRetentionForm
    public string? NetRetentionValue { get; set; }       // c_netRetentionVal

    public string? TreatySurplus { get; set; }           // c_treatySurplus
    public string? CoInsuranceOutward { get; set; }      // c_CoOut

    public string? SumAssuredType { get; set; }          // c_sumAssuredForm
    public string? SumAssuredValue { get; set; }         // c_sumAssuredVal

    // =========================
    // VI — Risk Profile / Survey / Property
    // =========================
    public string? PropertyTypeList { get; set; }        // c_typeOfPropertyList
    public string? Protection { get; set; }              // c_protection
    public string? MoreInfo { get; set; }                // c_moreInfo

    public string? NonAppetiteRisk { get; set; }         // c_nonAppetiteRisk
    public string? IsNonAppetiteRisk { get; set; }       // c_nonAppetiteRiskBool

    public string? Capacity { get; set; }                // c_capacity
    public string? HasCapacity { get; set; }             // c_capacityBool

    public string? Construction { get; set; }            // c_construction
    public string? Management { get; set; }              // c_management
    public string? OperationYearOfRisk { get; set; }     // c_operationYearOfRisk
    public string? CurrentInsurer { get; set; }          // c_currentInsurer

    public string? SurveyResult { get; set; }            // c_surveyResult
    public string? HasSurveyResult { get; set; }         // c_surveyResultBool
    public string? SurveyResultAttachment { get; set; }  // c_surveyResultAtt

    // =========================
    // VII — Loss History / RI Arrangement
    // =========================
    public string? LossHistoryAcc { get; set; }          // c_lossHisAcc
    public string? LossHistoryAccNoClaim { get; set; }   // c_lossHisAccNoClaim
    public string? LossHistoryAccPremium { get; set; }   // c_lossHisAccPremium
    public string? LossHistoryAccLossAmount { get; set; }// c_lossHisAccAmtLoss
    public string? LossHistoryAccRatio { get; set; }     // c_lossHisAccRatio

    public string? RiArrangement { get; set; }           // c_RIArrangement
    public string? RiArrangementAttachment { get; set; } // c_RIArrangementAtt

    // =========================
    // VIII — Flags / UI Helper / Derived
    // =========================
    public string? IsOthers { get; set; }                // c_isOthers
    public string? IsOthersForm { get; set; }            // c_isOthersForm
    public string? ShowNameBizForm { get; set; }         // c_showNameBizForm
    public string? BiQuotation { get; set; }             // c_bIQuo
    public string? TsiFromBiForm { get; set; }           // c_tsiFromBiForm

    // IX — Audit / System
    // REMOVED BY DESIGN
}