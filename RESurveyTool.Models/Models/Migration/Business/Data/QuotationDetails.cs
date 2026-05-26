using System;
using System.ComponentModel.DataAnnotations.Schema;
using ERPCore.Models.Migration.Base;
using ERPCore.Models.Migration.Business.Data;
using ERPCore.Models.Migration.Business.MasterData;
using ERPCore.Models.Migration.Config;

public class QuotationDetails : BaseModel
{
    public long? QuotationId { get; set; }
    public Quotation? QuotationFK { get; set; } 
    //public long? IncIARQuoId { get; set; }
    //public long? IncBIQuoId { get; set; }
    //public string BIQtNum { get; set; }
    //public long? InsPeriodId { get; set; }
    //public double? ActualDays { get; set; }
    //public long? CoverageId { get; set; }   
    //public DateTime? PeriodInsuranceStartDate { get; set; }    
    //public DateTime? PeriodInsuranceEndDate { get; set; }
    //public double? TmivShare { get; set; }               // c_TMIVShare
    //public long? VAT { get; set; }            // c_VAT (unknown flag/value)
    //public double? VATValue { get; set; }            // c_VAT (unknown flag/value)
    //// =========================================================
    //// Ý 4 — Location / TSI / SumInsured (rename; keep all)
    //// =========================================================
    //public int? LocationCountDeclared { get; set; }        // c_numLocation
    //public int? QuotationLocationCount { get; set; }       // c_quotationLocation
    //public int? LocationCountLegacy { get; set; }          // c_countLoca
    //public int? LocationCountAnnual { get; set; }          // c_totalLocaAnnual
    //public int? LocationCountActual { get; set; }          // c_totalLocaActual
    //public int? LocationCountActualAlt { get; set; }       // c_c_totalLocaActual

    //public string? LocationSummary { get; set; } = "";           // c_location
    //public string? LocationSituation { get; set; } = "";         // c_locationSituation

    //public string? LocationMapRef { get; set; } = "";            // c_mapLocation
    //public string? LocationAttachmentRef { get; set; } = "";     // c_attachLocation
    //public string? LocationSubAttachmentRef { get; set; } = "";  // c_attachSub



    //// =========================================================
    //// Ý 6 — Terms/Conditions/Deductible/Claim basis/Jurisdiction
    //// - Eng/Viet follow logic Ý 2 (multi-language JSON)
    //// =========================================================
    //// Default display (prefer VI -> EN -> any)
    //public string? TermsConditionsText { get; set; } = "";           // from c_termsConViet/c_termsConEng/c_termsCon
    //public string? ClaimSettlementBasisText { get; set; } = "";      // from c_claimSetBasisViet/c_claimSetBasisEng
    //public string? JurisdictionLawText { get; set; } = "";           // from c_lawJurisViet/c_lawJurisEng
    //public string? DutyOfDisclosureText { get; set; } = "";          // from c_dutyDisViet/c_dutyDisEng

    //// Multi-language payload for terms group
    //public string? TermsMultiLangJson { get; set; } = "";            // JSON (vi/en/..)

    //// Non-language fields
    //public string? ClauseName { get; set; } = "";                    // c_nameClause
    //public string? SpecialAppliedSpec { get; set; } = "";            // c_specApplied
    //public string? Deductible { get; set; } = "";                    // c_deductible
    //public string? DeductibleFire { get; set; } = "";                // c_deductibleFire
    //public string? LimitOfLiability { get; set; } = "";              // c_limitLia

    //// =========================================================
    //// Ý 7 — Workflow status/timeline/users/route (SKIPPED by user)
    //// =========================================================

    //// =========================================================
    //// Ý 8 — UW evaluation / referral / RI / loss history
    //// - Rule applied: keep singular if plural+singular exist
    //// =========================================================
    //// Referral / Risk grading
    //public string? ReferralRequiredFlag { get; set; } = "";      // c_reasonForReferralYN
    //public string? ReferralReasonsText { get; set; } = "";       // c_reasonForReferralReasons
    //public string? ReferralType { get; set; } = "";              // c_typeOfReferral

    //public string? RiskGrade { get; set; } = "";                 // c_riskGrade
    //public string? RiskGradingText { get; set; } = "";           // c_riskGrading
    //public string? RiskGradeTableJson { get; set; } = "";        // c_riskGradeTable
    //public string? RiskGradeType { get; set; } = "";             // c_typeOfGrade

    //// UW comment / accept / attachments (singular kept)
    //public string? UwCommentText { get; set; } = "";             // c_uwComment   (c_UWComments dropped)
    //public string? UwCommentsAttachmentRef { get; set; } = "";   // c_UWCommentsAtt
    //public string? UwAttachmentRef { get; set; } = "";           // c_uwAtt
    //public string? UwAcceptedFlag { get; set; } = "";            // c_uwAccept
    //public DateTime? UwAcceptedDate { get; set; }          // c_uwAcceptDate

    //// UW profile / referral details
    //public string? UwAssessorName { get; set; } = "";            // c_uwName
    //public string? UwPortfolioName { get; set; } = "";           // c_uwPortfolio
    //public string? UwJapaneseNonJapaneseCode { get; set; } = ""; // c_uwJNonJ
    //public string? UwSourceName { get; set; } = "";              // c_uwSource
    //public string? UwBusinessStartedYearOrDate { get; set; } = ""; // c_uwBusinessStarted

    //public string? UwOccupationText { get; set; } = "";          // c_uwOccupation
    //public string? UwPolicyHolderText { get; set; } = "";        // c_uwPolicyHolder
    //public string? UwLineOfBusinessText { get; set; } = "";      // c_uwLineOfBusiness
    //public string? UwReferralType { get; set; } = "";            // c_uwRefType
    //public string? UwReferralReasonText { get; set; } = "";      // c_uwReasonOfReferral
    //public string? UwRelatedFilesRef { get; set; } = "";         // c_uwRelFiles
    //public string? UwMktCommentText { get; set; } = "";          // c_uwMKTComment

    //// RI arrangement / retention / treaty
    //public string? RiArrangementText { get; set; } = "";         // c_RIArrangement
    //public string? RiArrangementAttachmentRef { get; set; } = "";// c_RIArrangementAtt
    //public string? RetentionValue { get; set; } = "";            // c_retention
    //public string? NetRetentionValue { get; set; } = "";         // c_netRetention
    //public string? TreatySurplusValue { get; set; } = "";        // c_treatySurplus
    //public string? CoInsuranceShareValue { get; set; } = "";     // c_share
    //public string? CoInsuranceOutValue { get; set; } = "";       // c_CoOut
    //public string? CoInsurerName { get; set; } = "";             // c_NameCoInsurer

    //// Loss history (singular kept: NoClaim)
    //public string? LossHistoryNoClaimText { get; set; } = "";    // c_lossHisNoClaim (c_lossHisNoClaims dropped)
    //public string? LossHistoryAccNoClaimText { get; set; } = ""; // c_lossHisAccNoClaim
    //public decimal? LossHistoryLossAmount { get; set; }    // c_lossHisAmtLoss
    //public decimal? LossHistoryAccLossAmount { get; set; } // c_lossHisAccAmtLoss
    //public decimal? LossHistoryLossRatio { get; set; }     // c_lossHisLossRatio
    //public decimal? LossHistoryAccRatio { get; set; }      // c_lossHisAccRatio
    //public decimal? LossHistoryPremium { get; set; }       // c_lossHisPremium
    //public decimal? LossHistoryAccPremium { get; set; }    // c_lossHisAccPremium
    //public string? LossHistoryAccText { get; set; } = "";        // c_lossHisAcc

    //// Evaluation scoring / pictures
    //public decimal? EvaluationTotalScore { get; set; }     // c_totalEvaluation
    //public string? EvaluationDetailText { get; set; } = "";      // c_detail
    //public string? EvaluationDetailPictureRef { get; set; } = "";// c_detailPicture

    //public decimal? UwEvaluationTotalScore { get; set; }   // c_uwTotalEvaluation
    //public string? UwEvaluationDetailText { get; set; } = "";    // c_uwDetail
    //public string? UwEvaluationDetailPictureRef { get; set; } = "";// c_uwDetailPicture

    //public string? UwPricingText { get; set; } = "";             // c_uwPricing
    //public string? UwPricingPictureRef { get; set; } = "";       // c_uwPricingPicture

    //public string? UwSumInsLimitText { get; set; } = "";         // c_uwSumInsLimit
    //public string? UwSumInsPictureRef { get; set; } = "";        // c_uwSumInsPicture

    //public string? UwAnnualMetric { get; set; } = "";            // c_uwAnnual
    //public string? UwAccumulatedMetric { get; set; } = "";       // c_uwAccumulated
    //public string? UwEilrAtExpiryMetric { get; set; } = "";      // c_uwEilrAtExpiry
    //public string? UwLossRatioAccumulatedMetric { get; set; } = "";// c_uwLrAccumulated

    //// UW leader / authority / form flags
    //public string? UwLeaderUsername { get; set; } = "";          // c_uwLeaderUname
    //public string? UwLeaderName { get; set; } = "";              // c_uwLeader
    //public string? UwFormFlag { get; set; } = "";                // c_uwFormFlag

    //public string? UwAuthorityText { get; set; } = "";           // c_authUw
    //public string? UwAuthorityConditionsText { get; set; } = ""; // c_authUwCond
    //public string? UwAuthorityFormRef { get; set; } = "";        // c_authUwForm

    //public string? MktAuthorityText { get; set; } = "";          // c_MKTAuthority
    //public string? MktAuthorityFormRef { get; set; } = "";       // c_MKTAuthorityForm

    //// =========================================================
    //// Ý 4 — Location / TSI / SumInsured (rename; keep all)
    //// =========================================================


    //public decimal? SumInsuredTotal { get; set; }          // c_totalSumIns
    //public decimal? SumInsuredTotalUsd { get; set; }       // c_totalSumInsUSD
    //public decimal? SumInsuredTotalVnd { get; set; }       // c_totalSumInsVND
    //public decimal? SumInsuredTotalAlt { get; set; }       // c_totalSumIns1

    //public decimal? SumInsuredBI { get; set; }             // c_totalSumInsBI

    //public decimal? TsiTotal { get; set; }                 // c_TSI
    //public decimal? TsiBI { get; set; }                    // c_TSIBi
    //public string? TsiFromBi { get; set; } = "";                 // c_tsiFromBi
    //public string? TsiFromBiForm { get; set; } = "";             // c_tsiFromBiForm

    //public string? TopRisk { get; set; } = "";                   // c_topRisk
    //public string? TopRiskPd { get; set; } = "";                 // c_topRiskPd
    //public string? TopRiskPdQuotation { get; set; } = "";        // c_topRiskPdQt
    //public string? TopRiskPdBI { get; set; } = "";               // c_topRiskPdBI

    //public decimal? TsiPd { get; set; }                    // c_TSIPd
    //public decimal? TsiPdQuotation { get; set; }           // c_TSIPdQT
    //public decimal? TsiPdBI { get; set; }                  // c_TSIPdBI

    //public string? Exposure { get; set; } = "";                  // c_exposure

    //public string? GeoLimitEng { get; set; } = "";               // c_geoLimitEng
    //public string? GeoLimitViet { get; set; } = "";              // c_geoLimitViet


    //// =========================================================
    //// Ý 5 — Premium / Rate / VAT / Discount / Currency (refactor + keep all)
    //// =========================================================
    //public double? PremiumTotal { get; set; }             // c_totalPremium
    //public double? PremiumTotalBeforeVat { get; set; }    // c_totalPremiumBeforeVat
    //public double? TotalDue { get; set; }                 // c_totalDue

    //public decimal? PremiumAnnual { get; set; }            // c_annualPremium
    //public decimal? PremiumAnnualTotal { get; set; }       // c_totalAnnualPremium

    //public decimal? PremiumActual { get; set; }            // c_actualPremium
    //public decimal? PremiumTotalBI { get; set; }           // c_totalPremiumBI

    //public decimal? PremiumVoluntary { get; set; }         // c_volPremium
    //public decimal? PremiumVoluntaryValue { get; set; }    // c_voluntaryPremium
    //public decimal? PremiumVoluntaryAnnual { get; set; }   // c_annualVoluntaryPremium

    //public decimal? PremiumCfe { get; set; }               // c_cfePremium
    //public decimal? PremiumCfeAnnual { get; set; }         // c_annualCFEPremium

    //public decimal? PremiumCommission { get; set; }        // c_comPremium

    //public decimal? PremiumRate { get; set; }              // c_premiumRate
    //public decimal? PremiumRateAlt { get; set; }           // c_premiumRate1
    //public decimal? PremiumRateBI { get; set; }            // c_premiumRateBI
    //public decimal? AnnualRate { get; set; }               // c_annualRate

    //public string? DiscountPercentOrValue { get; set; } = "";    // c_discount (unknown % or amount)
    //public decimal? PremiumDiscount { get; set; }          // c_premiumDis

    //public decimal? PreDiscount { get; set; }              // c_preDiscount
    //public decimal? PreDiscountTotal { get; set; }         // c_preDiscountTotal
    //public decimal? PreDiscountVoluntary { get; set; }     // c_preDiscountVol
    //public decimal? PreDiscountCommission { get; set; }    // c_preDiscountCom


    //public decimal? VatPercent { get; set; }               // c_VATPerc
    //public decimal? VatAmount { get; set; }                // c_VATAmount
    //public decimal? VatPercentBI { get; set; }             // c_VATPercBI
    //public decimal? VatAmountBI { get; set; }              // c_VATAmountBI

    //public long? CurrencyId { get; set; }              // c_currency
    //public decimal? ExchangeRate { get; set; }             // c_excRate
    //public string? EquivalentToCurrency { get; set; } = "";      // c_equivalentTo
    //public decimal? ExchangeRateTotalSumIns { get; set; }  // c_excRateTotalSumIns
    //public decimal? ExchangeRateTotalSumInsVnd { get; set; }// c_excRateTotalSumInsVND



    public long? IncBIQuoId { get; set; }
    public long? IncIARQuoId { get; set; }
    public long? CurrencyId { get; set; }
    public EnumData? CurrencyEnum { get; set; }
    public long? InsPeriodId { get; set; }
    public double? PremiumRate { get; set; } = 0;
    public double? PremiumCfe { get; set; }             =0;
    public double? PremiumVoluntary { get; set; }       =0;
    public double? PremiumTotalBeforeVat { get; set; }  =0;
    public double? PremiumTotal { get; set; }           =0;
    public double? TmivShare { get; set; }              =0;
    public double? TopRiskPd { get; set; }              =0;
    public double? TopRiskPdQuotation { get; set; }     =0;
    public double? SumInsuredTotal { get; set; }        =0;
    public double? SumInsuredTotalUsd { get; set; }     =0;
    public double? ExchangeRate { get; set; }           =0;
    public double? Vat { get; set; }                    =0;
    public double? VatValue { get; set; }               =0;
    public double? TotalDue { get; set; } = 0;

    public string TermsConditionsText { get; set; }     ="";
    public string RiskGrade { get; set; }               ="";
    public string TmiCode { get; set; }                 ="";
    public string BiQtNum { get; set; }                 ="";
    public string IarQuotationNo { get; set; }          ="";
    public long? ActualDays { get; set; } = 0;
    public DateTime? PeriodInsuranceStartDate { get; set; }
    public DateTime? PeriodInsuranceEndDate { get; set; }
    public bool? IsCfe { get; set; } = false;                     // c_isCfe
    public string? CfeCode { get; set; } = "";                   // c_CFECode
    //public string? IsCfeForm { get; set; } = "";                 // c_isCfeForm
    public bool? ShowCfe { get; set; } = false;                   // c_showCFE

}
