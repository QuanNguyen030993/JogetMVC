using System;
using System.ComponentModel.DataAnnotations.Schema;
using ERPCore.Models.Migration.Base;

public class Quotation : BaseModel
{
    // =========================================================
    // System keys (optional) - user said exclude system keys, so not included.
    // =========================================================

    // =========================================================
    // Ý 1 — Header/Request (rename)
    // =========================================================
    public string? RequestNo { get; set; }                 // c_qrNum
    public string? RequestRefNo { get; set; }              // c_refNum
    public string? QuotationCode { get; set; }             // c_jogetQuoNum

    public DateTime? RequestedDate { get; set; }           // c_reqDate
    public DateTime? DueDate { get; set; }                 // c_dueDate

    public string? RequestType { get; set; }               // c_reqType
    public string? QuotationType { get; set; }             // c_typeOfQT

    public string? BusinessChannelName { get; set; }        // c_businessChannel
    public string? SourceOfBusinessName { get; set; }       // c_sourceOfBusiness
    public string? BusinessChannelDisplayName { get; set; } // c_nameOfBizChannel

    // =========================================================
    // Ý 2 — PolicyHolder/Insured/Client
    // - Multi-language expandable (3rd language+) via JSON
    // =========================================================
    public string? PolicyHolderId { get; set; }            // c_policyHolder
    public string? InsuredId { get; set; }                 // c_ins

    public string? ClientCodePA { get; set; }              // c_clientCodePA
    public string? ClientCodeJG { get; set; }              // c_clientCodeJG

    // Default display (prefer VI -> EN -> any)
    public string? PolicyHolderName { get; set; }          // from c_phNameViet/c_policyHolderViet/c_phNameEng
    public string? InsuredName { get; set; }               // from c_insNameViet/c_insNameEng
    public string? ClientName { get; set; }                // from c_clientNameViet/c_clientNameEng
    public string? RegisteredAddress { get; set; }         // from c_registeredAddressViet/c_registeredAddress
    public string? BusinessAddress { get; set; }           // from c_businessAddressViet/c_businessAddressEng

    // Multi-language payload for PolicyHolder/Insured/Client + addresses
    public string? PartyMultiLangJson { get; set; }        // JSON (vi/en/..)

    // =========================================================
    // Ý 3 — Product/Line/CFE (rename; TODO Master Data)
    // =========================================================
    // TODO: Move Product/Line/CFE to Master Data later.
    public string? ProductName { get; set; }               // c_productName
    public string? ProductDisplayName { get; set; }        // c_productNameView
    public string? ProductType { get; set; }               // c_productType

    public string? LineName { get; set; }                  // c_lineName
    public string? SubLineName { get; set; }               // c_lineName1

    public string? CfeCode { get; set; }                   // c_CFECode
    public string? IsCfe { get; set; }                     // c_isCfe
    public string? IsCfeForm { get; set; }                 // c_isCfeForm
    public string? ShowCfe { get; set; }                   // c_showCFE

    public string? IarQuotationNo { get; set; }            // c_IARQuoNum

    // =========================================================
    // Ý 4 — Location / TSI / SumInsured (rename; keep all)
    // =========================================================
    public int? LocationCountDeclared { get; set; }        // c_numLocation
    public int? QuotationLocationCount { get; set; }       // c_quotationLocation
    public int? LocationCountLegacy { get; set; }          // c_countLoca
    public int? LocationCountAnnual { get; set; }          // c_totalLocaAnnual
    public int? LocationCountActual { get; set; }          // c_totalLocaActual
    public int? LocationCountActualAlt { get; set; }       // c_c_totalLocaActual

    public string? LocationSummary { get; set; }           // c_location
    public string? LocationSituation { get; set; }         // c_locationSituation

    public string? LocationMapRef { get; set; }            // c_mapLocation
    public string? LocationAttachmentRef { get; set; }     // c_attachLocation
    public string? LocationSubAttachmentRef { get; set; }  // c_attachSub

    public decimal? SumInsuredTotal { get; set; }          // c_totalSumIns
    public decimal? SumInsuredTotalUsd { get; set; }       // c_totalSumInsUSD
    public decimal? SumInsuredTotalVnd { get; set; }       // c_totalSumInsVND
    public decimal? SumInsuredTotalAlt { get; set; }       // c_totalSumIns1

    public decimal? SumInsuredBI { get; set; }             // c_totalSumInsBI

    public decimal? TsiTotal { get; set; }                 // c_TSI
    public decimal? TsiBI { get; set; }                    // c_TSIBi
    public string? TsiFromBi { get; set; }                 // c_tsiFromBi
    public string? TsiFromBiForm { get; set; }             // c_tsiFromBiForm

    public string? TopRisk { get; set; }                   // c_topRisk
    public string? TopRiskPd { get; set; }                 // c_topRiskPd
    public string? TopRiskPdQuotation { get; set; }        // c_topRiskPdQt
    public string? TopRiskPdBI { get; set; }               // c_topRiskPdBI

    public decimal? TsiPd { get; set; }                    // c_TSIPd
    public decimal? TsiPdQuotation { get; set; }           // c_TSIPdQT
    public decimal? TsiPdBI { get; set; }                  // c_TSIPdBI

    public string? Exposure { get; set; }                  // c_exposure

    public string? GeoLimitEng { get; set; }               // c_geoLimitEng
    public string? GeoLimitViet { get; set; }              // c_geoLimitViet

    // =========================================================
    // Ý 5 — Premium / Rate / VAT / Discount / Currency (refactor + keep all)
    // =========================================================
    public decimal? PremiumTotal { get; set; }             // c_totalPremium
    public decimal? PremiumTotalBeforeVat { get; set; }    // c_totalPremiumBeforeVat
    public decimal? TotalDue { get; set; }                 // c_totalDue

    public decimal? PremiumAnnual { get; set; }            // c_annualPremium
    public decimal? PremiumAnnualTotal { get; set; }       // c_totalAnnualPremium

    public decimal? PremiumActual { get; set; }            // c_actualPremium
    public decimal? PremiumTotalBI { get; set; }           // c_totalPremiumBI

    public decimal? PremiumVoluntary { get; set; }         // c_volPremium
    public decimal? PremiumVoluntaryValue { get; set; }    // c_voluntaryPremium
    public decimal? PremiumVoluntaryAnnual { get; set; }   // c_annualVoluntaryPremium

    public decimal? PremiumCfe { get; set; }               // c_cfePremium
    public decimal? PremiumCfeAnnual { get; set; }         // c_annualCFEPremium

    public decimal? PremiumCommission { get; set; }        // c_comPremium

    public decimal? PremiumRate { get; set; }              // c_premiumRate
    public decimal? PremiumRateAlt { get; set; }           // c_premiumRate1
    public decimal? PremiumRateBI { get; set; }            // c_premiumRateBI
    public decimal? AnnualRate { get; set; }               // c_annualRate

    public string? DiscountPercentOrValue { get; set; }    // c_discount (unknown % or amount)
    public decimal? PremiumDiscount { get; set; }          // c_premiumDis

    public decimal? PreDiscount { get; set; }              // c_preDiscount
    public decimal? PreDiscountTotal { get; set; }         // c_preDiscountTotal
    public decimal? PreDiscountVoluntary { get; set; }     // c_preDiscountVol
    public decimal? PreDiscountCommission { get; set; }    // c_preDiscountCom

    public string? VatFlagOrValue { get; set; }            // c_VAT (unknown flag/value)
    public decimal? VatPercent { get; set; }               // c_VATPerc
    public decimal? VatAmount { get; set; }                // c_VATAmount
    public decimal? VatPercentBI { get; set; }             // c_VATPercBI
    public decimal? VatAmountBI { get; set; }              // c_VATAmountBI

    public string? CurrencyCode { get; set; }              // c_currency
    public decimal? ExchangeRate { get; set; }             // c_excRate
    public string? EquivalentToCurrency { get; set; }      // c_equivalentTo
    public decimal? ExchangeRateTotalSumIns { get; set; }  // c_excRateTotalSumIns
    public decimal? ExchangeRateTotalSumInsVnd { get; set; }// c_excRateTotalSumInsVND

    // =========================================================
    // Ý 6 — Terms/Conditions/Deductible/Claim basis/Jurisdiction
    // - Eng/Viet follow logic Ý 2 (multi-language JSON)
    // =========================================================
    // Default display (prefer VI -> EN -> any)
    public string? TermsConditionsText { get; set; }           // from c_termsConViet/c_termsConEng/c_termsCon
    public string? ClaimSettlementBasisText { get; set; }      // from c_claimSetBasisViet/c_claimSetBasisEng
    public string? JurisdictionLawText { get; set; }           // from c_lawJurisViet/c_lawJurisEng
    public string? DutyOfDisclosureText { get; set; }          // from c_dutyDisViet/c_dutyDisEng

    // Multi-language payload for terms group
    public string? TermsMultiLangJson { get; set; }            // JSON (vi/en/..)

    // Non-language fields
    public string? ClauseName { get; set; }                    // c_nameClause
    public string? SpecialAppliedSpec { get; set; }            // c_specApplied
    public string? Deductible { get; set; }                    // c_deductible
    public string? DeductibleFire { get; set; }                // c_deductibleFire
    public string? LimitOfLiability { get; set; }              // c_limitLia

    // =========================================================
    // Ý 7 — Workflow status/timeline/users/route (SKIPPED by user)
    // =========================================================

    // =========================================================
    // Ý 8 — UW evaluation / referral / RI / loss history
    // - Rule applied: keep singular if plural+singular exist
    // =========================================================
    // Referral / Risk grading
    public string? ReferralRequiredFlag { get; set; }      // c_reasonForReferralYN
    public string? ReferralReasonsText { get; set; }       // c_reasonForReferralReasons
    public string? ReferralType { get; set; }              // c_typeOfReferral

    public string? RiskGrade { get; set; }                 // c_riskGrade
    public string? RiskGradingText { get; set; }           // c_riskGrading
    public string? RiskGradeTableJson { get; set; }        // c_riskGradeTable
    public string? RiskGradeType { get; set; }             // c_typeOfGrade

    // UW comment / accept / attachments (singular kept)
    public string? UwCommentText { get; set; }             // c_uwComment   (c_UWComments dropped)
    public string? UwCommentsAttachmentRef { get; set; }   // c_UWCommentsAtt
    public string? UwAttachmentRef { get; set; }           // c_uwAtt
    public string? UwAcceptedFlag { get; set; }            // c_uwAccept
    public DateTime? UwAcceptedDate { get; set; }          // c_uwAcceptDate

    // UW profile / referral details
    public string? UwAssessorName { get; set; }            // c_uwName
    public string? UwPortfolioName { get; set; }           // c_uwPortfolio
    public string? UwJapaneseNonJapaneseCode { get; set; } // c_uwJNonJ
    public string? UwSourceName { get; set; }              // c_uwSource
    public string? UwBusinessStartedYearOrDate { get; set; } // c_uwBusinessStarted

    public string? UwOccupationText { get; set; }          // c_uwOccupation
    public string? UwPolicyHolderText { get; set; }        // c_uwPolicyHolder
    public string? UwLineOfBusinessText { get; set; }      // c_uwLineOfBusiness
    public string? UwReferralType { get; set; }            // c_uwRefType
    public string? UwReferralReasonText { get; set; }      // c_uwReasonOfReferral
    public string? UwRelatedFilesRef { get; set; }         // c_uwRelFiles
    public string? UwMktCommentText { get; set; }          // c_uwMKTComment

    // RI arrangement / retention / treaty
    public string? RiArrangementText { get; set; }         // c_RIArrangement
    public string? RiArrangementAttachmentRef { get; set; }// c_RIArrangementAtt
    public string? RetentionValue { get; set; }            // c_retention
    public string? NetRetentionValue { get; set; }         // c_netRetention
    public string? TreatySurplusValue { get; set; }        // c_treatySurplus
    public string? CoInsuranceShareValue { get; set; }     // c_share
    public string? CoInsuranceOutValue { get; set; }       // c_CoOut
    public string? CoInsurerName { get; set; }             // c_NameCoInsurer

    // Loss history (singular kept: NoClaim)
    public string? LossHistoryNoClaimText { get; set; }    // c_lossHisNoClaim (c_lossHisNoClaims dropped)
    public string? LossHistoryAccNoClaimText { get; set; } // c_lossHisAccNoClaim
    public decimal? LossHistoryLossAmount { get; set; }    // c_lossHisAmtLoss
    public decimal? LossHistoryAccLossAmount { get; set; } // c_lossHisAccAmtLoss
    public decimal? LossHistoryLossRatio { get; set; }     // c_lossHisLossRatio
    public decimal? LossHistoryAccRatio { get; set; }      // c_lossHisAccRatio
    public decimal? LossHistoryPremium { get; set; }       // c_lossHisPremium
    public decimal? LossHistoryAccPremium { get; set; }    // c_lossHisAccPremium
    public string? LossHistoryAccText { get; set; }        // c_lossHisAcc

    // Evaluation scoring / pictures
    public decimal? EvaluationTotalScore { get; set; }     // c_totalEvaluation
    public string? EvaluationDetailText { get; set; }      // c_detail
    public string? EvaluationDetailPictureRef { get; set; }// c_detailPicture

    public decimal? UwEvaluationTotalScore { get; set; }   // c_uwTotalEvaluation
    public string? UwEvaluationDetailText { get; set; }    // c_uwDetail
    public string? UwEvaluationDetailPictureRef { get; set; }// c_uwDetailPicture

    public string? UwPricingText { get; set; }             // c_uwPricing
    public string? UwPricingPictureRef { get; set; }       // c_uwPricingPicture

    public string? UwSumInsLimitText { get; set; }         // c_uwSumInsLimit
    public string? UwSumInsPictureRef { get; set; }        // c_uwSumInsPicture

    public string? UwAnnualMetric { get; set; }            // c_uwAnnual
    public string? UwAccumulatedMetric { get; set; }       // c_uwAccumulated
    public string? UwEilrAtExpiryMetric { get; set; }      // c_uwEilrAtExpiry
    public string? UwLossRatioAccumulatedMetric { get; set; }// c_uwLrAccumulated

    // UW leader / authority / form flags
    public string? UwLeaderUsername { get; set; }          // c_uwLeaderUname
    public string? UwLeaderName { get; set; }              // c_uwLeader
    public string? UwFormFlag { get; set; }                // c_uwFormFlag

    public string? UwAuthorityText { get; set; }           // c_authUw
    public string? UwAuthorityConditionsText { get; set; } // c_authUwCond
    public string? UwAuthorityFormRef { get; set; }        // c_authUwForm

    public string? MktAuthorityText { get; set; }          // c_MKTAuthority
    public string? MktAuthorityFormRef { get; set; }       // c_MKTAuthorityForm
    public string? StageDept { get; set; }

    // =========================================================
    // Ý 9 — Attachment/email fields (commented-out + TODO)
    // =========================================================

    // TODO: Email fields – move to Email / Notification module
    // public string? EmailTitle { get; set; }                  // c_titleEmail
    // public string? EmailSecondaryTitle { get; set; }         // c_title2Email
    // public string? EmailContentHtml { get; set; }            // c_listEmail
    // public string? EmailLinkUrl { get; set; }                // c_linkEmail
    // public string? EmailTo { get; set; }                     // c_to
    // public string? EmailCc { get; set; }                     // c_emailCc
    // public string? AdditionalEmailCc { get; set; }           // c_addiEmailCc
    // public string? AdditionalEmailCcWorkflow { get; set; }   // c_addiEmailCcWf
    // public string? PreAdditionalEmailCc { get; set; }        // c_preAddiEmailCc
    // public string? MktTsEmailCc { get; set; }                // c_mktTsEmailCc
    // public string? MktFoEmailCc { get; set; }                // c_mktFoEmailCc
    // public string? ManagerEmailCc { get; set; }              // c_mgrEmailCc
    // public string? UwEmailCc { get; set; }                   // c_uwEmailCc

    // TODO: Attachment fields – move to Attachment / File module
    // public string? MainAttachmentRef { get; set; }           // c_attachment
    // public string? QuotationAttachmentRef { get; set; }      // c_attachmentQT / c_attachQT
    // public string? ResultAttachmentRef { get; set; }         // c_resAttachment / c_resAtt
    // public string? ResultFormAttachmentRef { get; set; }     // c_attachResForm
    // public string? ResultAttachmentAltRef { get; set; }      // c_attachRes
    // public string? OtherAttachmentRef { get; set; }          // c_otherAtt
    // public string? AdditionalAttachmentsRef { get; set; }    // c_addiAttachments
    // public string? SurveyResultAttachmentRef { get; set; }   // c_surveyResultAtt
    // public string? RiArrangementAttachmentRef { get; set; }  // c_RIArrangementAtt
    // public string? UwAttachmentRef2 { get; set; }            // c_uwAtt
    // public string? UwCommentAttachmentRef { get; set; }      // c_UWCommentsAtt

    // TODO: UI display flags – move to UI/Form config
    // public string? ShowQuotationForm { get; set; }           // c_showQuotForm
    // public string? ShowBiQuotationForm { get; set; }         // c_showBiQuotForm
    // public string? ShowQuotation { get; set; }               // c_showQuot
    // public string? ShowBiQuotation { get; set; }             // c_showBiQuot
}
