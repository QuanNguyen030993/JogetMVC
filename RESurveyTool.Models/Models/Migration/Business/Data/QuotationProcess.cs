using System;
using System.ComponentModel.DataAnnotations.Schema;
using SurveyReportRE.Models.Migration.Base;

public class QuotationProcess : BaseModel
{
    [Column("dateCreated")]
    public DateTime? dateCreated { get; set; }
    [Column("dateModified")]
    public DateTime? dateModified { get; set; }
    [Column("createdByName")]
    public string createdByName { get; set; }
    [Column("modifiedByName")]
    public string modifiedByName { get; set; }
    [Column("c_reason")]
    public string c_reason { get; set; }
    [Column("c_attachmentQT")]
    public string c_attachmentQT { get; set; }
    [Column("c_listEmail")]
    public string c_listEmail { get; set; }
    [Column("c_RIArrangementAtt")]
    public string c_RIArrangementAtt { get; set; }
    [Column("c_policyNo")]
    public string c_policyNo { get; set; }
    [Column("c_qtNum")]
    public string c_qtNum { get; set; }
    [Column("c_totalPremiumBI")]
    public string c_totalPremiumBI { get; set; }
    [Column("c_reasonForReferralReasons")]
    public string c_reasonForReferralReasons { get; set; }
    [Column("c_lawJurisEng")]
    public string c_lawJurisEng { get; set; }
    [Column("c_a1_flag")]
    public string c_a1_flag { get; set; }
    [Column("c_a5DaysOver")]
    public string c_a5DaysOver { get; set; }
    [Column("c_reqResNo")]
    public string c_reqResNo { get; set; }
    [Column("c_actualDays")]
    public string c_actualDays { get; set; }
    [Column("c_stocksEng")]
    public string c_stocksEng { get; set; }
    [Column("c_excRate")]
    public string c_excRate { get; set; }
    [Column("c_authUwForm")]
    public string c_authUwForm { get; set; }
    [Column("c_a8DaysOver")]
    public string c_a8DaysOver { get; set; }
    [Column("c_totalSumIns")]
    public string c_totalSumIns { get; set; }
    [Column("c_exposure")]
    public string c_exposure { get; set; }
    [Column("c_locationsEng")]
    public string c_locationsEng { get; set; }
    [Column("c_subformID")]
    public string c_subformID { get; set; }
    [Column("c_lossHisAccNoClaim")]
    public string c_lossHisAccNoClaim { get; set; }
    [Column("c_preDiscountCom")]
    public string c_preDiscountCom { get; set; }
    [Column("c_a1Days")]
    public string c_a1Days { get; set; }
    [Column("c_TMIVShare")]
    public string c_TMIVShare { get; set; }
    [Column("c_equivalentTo")]
    public string c_equivalentTo { get; set; }
    [Column("c_authUw")]
    public string c_authUw { get; set; }
    [Column("c_installmentGrid")]
    public string c_installmentGrid { get; set; }
    [Column("c_nonAppetiteRisk")]
    public string c_nonAppetiteRisk { get; set; }
    [Column("c_reqDate")]
    public string c_reqDate { get; set; }
    [Column("c_annualVoluntaryPremium")]
    public string c_annualVoluntaryPremium { get; set; }
    [Column("c_a8Days")]
    public string c_a8Days { get; set; }
    [Column("c_currency")]
    public string c_currency { get; set; }
    [Column("c_claimSetBasisViet")]
    public string c_claimSetBasisViet { get; set; }
    [Column("c_retention")]
    public string c_retention { get; set; }
    [Column("c_termsConEng")]
    public string c_termsConEng { get; set; }
    [Column("c_totalPremium")]
    public string c_totalPremium { get; set; }
    [Column("c_a4Days")]
    public string c_a4Days { get; set; }
    [Column("c_reqResNoSel")]
    public string c_reqResNoSel { get; set; }
    [Column("c_insNameViet")]
    public string c_insNameViet { get; set; }
    [Column("c_qtStatusLabel")]
    public string c_qtStatusLabel { get; set; }
    [Column("c_attQuo")]
    public string c_attQuo { get; set; }
    [Column("c_actualDaysBi")]
    public string c_actualDaysBi { get; set; }
    [Column("c_typeOfReferral")]
    public string c_typeOfReferral { get; set; }
    [Column("c_geoLimitEng")]
    public string c_geoLimitEng { get; set; }
    [Column("c_nameClause")]
    public string c_nameClause { get; set; }
    [Column("c_tsiFromBi")]
    public string c_tsiFromBi { get; set; }
    [Column("c_phNameEng")]
    public string c_phNameEng { get; set; }
    [Column("c_linkEmail")]
    public string c_linkEmail { get; set; }
    [Column("c_country")]
    public string c_country { get; set; }
    [Column("c_qtNumSel")]
    public string c_qtNumSel { get; set; }
    [Column("c_notes")]
    public string c_notes { get; set; }
    [Column("c_tariffCode")]
    public string c_tariffCode { get; set; }
    [Column("c_VATPerc")]
    public string c_VATPerc { get; set; }
    [Column("c_mgrTs")]
    public string c_mgrTs { get; set; }
    [Column("c_dueDate")]
    public string c_dueDate { get; set; }
    [Column("c_netRetention")]
    public string c_netRetention { get; set; }
    [Column("c_insIntSumViet")]
    public string c_insIntSumViet { get; set; }
    [Column("c_treatySurplus")]
    public string c_treatySurplus { get; set; }
    [Column("c_topRiskPd")]
    public string c_topRiskPd { get; set; }
    [Column("c_mktTsStatus")]
    public string c_mktTsStatus { get; set; }
    [Column("c_registeredAddress")]
    public string c_registeredAddress { get; set; }
    [Column("c_quoValEng")]
    public string c_quoValEng { get; set; }
    [Column("c_phNameViet")]
    public string c_phNameViet { get; set; }
    [Column("c_others")]
    public string c_others { get; set; }
    [Column("c_addExtEng")]
    public string c_addExtEng { get; set; }
    [Column("c_bIQuo")]
    public string c_bIQuo { get; set; }
    [Column("c_a6DaysOver")]
    public string c_a6DaysOver { get; set; }
    [Column("c_comPremium")]
    public string c_comPremium { get; set; }
    [Column("c_periodInsStart")]
    public string c_periodInsStart { get; set; }
    [Column("c_a3DaysOver")]
    public string c_a3DaysOver { get; set; }
    [Column("c_dutyDisViet")]
    public string c_dutyDisViet { get; set; }
    [Column("c_cloneResForm")]
    public string c_cloneResForm { get; set; }
    [Column("c_reasonForReferralYN")]
    public string c_reasonForReferralYN { get; set; }
    [Column("c_proCusViet")]
    public string c_proCusViet { get; set; }
    [Column("c_addInsEng")]
    public string c_addInsEng { get; set; }
    [Column("c_annualCFEPremium")]
    public string c_annualCFEPremium { get; set; }
    [Column("c_installment")]
    public string c_installment { get; set; }
    [Column("c_totalAnnualPremium")]
    public string c_totalAnnualPremium { get; set; }
    [Column("c_CoOut")]
    public string c_CoOut { get; set; }
    [Column("c_BIQtNum")]
    public string c_BIQtNum { get; set; }
    [Column("c_policyDecViet")]
    public string c_policyDecViet { get; set; }
    [Column("c_volPremium")]
    public string c_volPremium { get; set; }
    [Column("c_MKTFront")]
    public string c_MKTFront { get; set; }
    [Column("c_typeOfPropertyList")]
    public string c_typeOfPropertyList { get; set; }
    [Column("c_preDiscountVol")]
    public string c_preDiscountVol { get; set; }
    [Column("c_decvalue")]
    public string c_decvalue { get; set; }
    [Column("c_attachSub")]
    public string c_attachSub { get; set; }
    [Column("c_authUwCond")]
    public string c_authUwCond { get; set; }
    [Column("c_resForm")]
    public string c_resForm { get; set; }
    [Column("c_currentInsurer")]
    public string c_currentInsurer { get; set; }
    [Column("c_mktFoRemarks")]
    public string c_mktFoRemarks { get; set; }
    [Column("c_locationsViet")]
    public string c_locationsViet { get; set; }
    [Column("c_proOpenAreaViet")]
    public string c_proOpenAreaViet { get; set; }
    [Column("c_excRateTotalSumInsVND")]
    public string c_excRateTotalSumInsVND { get; set; }
    [Column("c_coverage")]
    public string c_coverage { get; set; }
    [Column("c_stocksViet")]
    public string c_stocksViet { get; set; }
    [Column("c_preDiscount")]
    public string c_preDiscount { get; set; }
    [Column("c_tsiFromBiForm")]
    public string c_tsiFromBiForm { get; set; }
    [Column("c_coverageInViet")]
    public string c_coverageInViet { get; set; }
    [Column("c_nonAppetiteRiskBool")]
    public string c_nonAppetiteRiskBool { get; set; }
    [Column("c_insIntSumEng")]
    public string c_insIntSumEng { get; set; }
    [Column("c_periodAlertFlag")]
    public string c_periodAlertFlag { get; set; }
    [Column("c_VATPercBI")]
    public string c_VATPercBI { get; set; }
    [Column("c_proOpenAreaEng")]
    public string c_proOpenAreaEng { get; set; }
    [Column("c_proCusEng")]
    public string c_proCusEng { get; set; }
    [Column("c_management")]
    public string c_management { get; set; }
    [Column("c_VATAmountBI")]
    public string c_VATAmountBI { get; set; }
    [Column("c_location")]
    public string c_location { get; set; }
    [Column("c_a5Days")]
    public string c_a5Days { get; set; }
    [Column("c_clientNameViet")]
    public string c_clientNameViet { get; set; }
    [Column("c_titleEmail")]
    public string c_titleEmail { get; set; }
    [Column("c_premiumDis")]
    public string c_premiumDis { get; set; }
    [Column("c_topRiskPdBi")]
    public string c_topRiskPdBi { get; set; }
    [Column("c_occupation")]
    public string c_occupation { get; set; }
    [Column("c_VAT")]
    public string c_VAT { get; set; }
    [Column("c_premiumRate")]
    public string c_premiumRate { get; set; }
    [Column("c_discount")]
    public string c_discount { get; set; }
    [Column("c_title2Email")]
    public string c_title2Email { get; set; }
    [Column("c_insNameEng")]
    public string c_insNameEng { get; set; }
    [Column("c_productName")]
    public string c_productName { get; set; }
    [Column("c_insRegAdd")]
    public string c_insRegAdd { get; set; }
    [Column("c_showCFE")]
    public string c_showCFE { get; set; }
    [Column("c_jogetQuoNum")]
    public string c_jogetQuoNum { get; set; }
    [Column("c_VATAmount")]
    public string c_VATAmount { get; set; }
    [Column("c_srAddNote")]
    public string c_srAddNote { get; set; }
    [Column("c_oriReqType")]
    public string c_oriReqType { get; set; }
    [Column("c_voluntary")]
    public string c_voluntary { get; set; }
    [Column("c_incBIQuo")]
    public string c_incBIQuo { get; set; }
    [Column("c_noteForBrokerViet")]
    public string c_noteForBrokerViet { get; set; }
    [Column("c_a3Days")]
    public string c_a3Days { get; set; }
    [Column("c_surveyResultAtt")]
    public string c_surveyResultAtt { get; set; }
    [Column("c_mktTsRemarks")]
    public string c_mktTsRemarks { get; set; }
    [Column("c_qtStatus")]
    public string c_qtStatus { get; set; }
    [Column("c_MKTCommentProp")]
    public string c_MKTCommentProp { get; set; }
    [Column("c_UWComments")]
    public string c_UWComments { get; set; }
    [Column("c_oriNum")]
    public string c_oriNum { get; set; }
    [Column("c_topRiskPdQt")]
    public string c_topRiskPdQt { get; set; }
    [Column("c_tmiCode")]
    public string c_tmiCode { get; set; }
    [Column("c_termsConViet")]
    public string c_termsConViet { get; set; }
    [Column("c_showBiQuotForm")]
    public string c_showBiQuotForm { get; set; }
    [Column("c_excRateTotalSumIns")]
    public string c_excRateTotalSumIns { get; set; }
    [Column("c_lawJurisViet")]
    public string c_lawJurisViet { get; set; }
    [Column("c_periodInsEnd")]
    public string c_periodInsEnd { get; set; }
    [Column("c_dutyDisEng")]
    public string c_dutyDisEng { get; set; }
    [Column("c_foUname")]
    public string c_foUname { get; set; }
    [Column("c_uwAccept")]
    public string c_uwAccept { get; set; }
    [Column("c_premiumRateBI")]
    public string c_premiumRateBI { get; set; }
    [Column("c_a1DaysOver")]
    public string c_a1DaysOver { get; set; }
    [Column("c_typeOfQT")]
    public string c_typeOfQT { get; set; }
    [Column("c_uwAcceptDate")]
    public string c_uwAcceptDate { get; set; }
    [Column("c_otherAtt")]
    public string c_otherAtt { get; set; }
    [Column("c_totalSumInsVND")]
    public string c_totalSumInsVND { get; set; }
    [Column("c_totalDue")]
    public string c_totalDue { get; set; }
    [Column("c_showQuotForm")]
    public string c_showQuotForm { get; set; }
    [Column("c_protection")]
    public string c_protection { get; set; }
    [Column("c_moreInfo")]
    public string c_moreInfo { get; set; }
    [Column("c_capacity")]
    public string c_capacity { get; set; }
    [Column("c_insuredProperty")]
    public string c_insuredProperty { get; set; }
    [Column("c_quoValViet")]
    public string c_quoValViet { get; set; }
    [Column("c_TSIPdQt")]
    public string c_TSIPdQt { get; set; }
    [Column("c_geoLimitViet")]
    public string c_geoLimitViet { get; set; }
    [Column("c_actualPremium")]
    public string c_actualPremium { get; set; }
    [Column("c_businessChannel")]
    public string c_businessChannel { get; set; }
    [Column("c_addExtViet")]
    public string c_addExtViet { get; set; }
    [Column("c_legalStatusViet")]
    public string c_legalStatusViet { get; set; }
    [Column("c_capacityBool")]
    public string c_capacityBool { get; set; }
    [Column("c_inslabel")]
    public string c_inslabel { get; set; }
    [Column("c_coverageInEng")]
    public string c_coverageInEng { get; set; }
    [Column("c_businessOccupationEng")]
    public string c_businessOccupationEng { get; set; }
    [Column("c_a4DaysOver")]
    public string c_a4DaysOver { get; set; }
    [Column("c_attachResForm")]
    public string c_attachResForm { get; set; }
    [Column("c_attachRes")]
    public string c_attachRes { get; set; }
    [Column("c_a7DaysOver")]
    public string c_a7DaysOver { get; set; }
    [Column("c_claimSetBasisEng")]
    public string c_claimSetBasisEng { get; set; }
    [Column("c_insvalue")]
    public string c_insvalue { get; set; }
    [Column("c_preMKTTS")]
    public string c_preMKTTS { get; set; }
    [Column("c_a6Days")]
    public string c_a6Days { get; set; }
    [Column("c_surveyResultBool")]
    public string c_surveyResultBool { get; set; }
    [Column("c_numLocation")]
    public string c_numLocation { get; set; }
    [Column("c_TSIPdBi")]
    public string c_TSIPdBi { get; set; }
    [Column("c_policyHolder")]
    public string c_policyHolder { get; set; }
    [Column("c_mapLocation")]
    public string c_mapLocation { get; set; }
    [Column("c_annualPremium")]
    public string c_annualPremium { get; set; }
    [Column("c_MKTAuthority")]
    public string c_MKTAuthority { get; set; }
    [Column("c_lossHisAcc")]
    public string c_lossHisAcc { get; set; }
    [Column("c_mktTs")]
    public string c_mktTs { get; set; }
    [Column("c_sourceOfBusiness")]
    public string c_sourceOfBusiness { get; set; }
    [Column("c_businessOccupation")]
    public string c_businessOccupation { get; set; }
    [Column("c_indPeriod")]
    public string c_indPeriod { get; set; }
    [Column("c_annualRate")]
    public string c_annualRate { get; set; }
    [Column("c_insRegAddViet")]
    public string c_insRegAddViet { get; set; }
    [Column("c_referUW")]
    public string c_referUW { get; set; }
    [Column("c_phRegisteredAddressEng")]
    public string c_phRegisteredAddressEng { get; set; }
    [Column("c_a2Days")]
    public string c_a2Days { get; set; }
    [Column("c_addInsViet")]
    public string c_addInsViet { get; set; }
    [Column("c_actualDaysCalcBi")]
    public string c_actualDaysCalcBi { get; set; }
    [Column("c_percentage")]
    public string c_percentage { get; set; }
    [Column("c_tariffRate")]
    public string c_tariffRate { get; set; }
    [Column("c_totalSumInsUSD")]
    public string c_totalSumInsUSD { get; set; }
    [Column("c_lossHisAccPremium")]
    public string c_lossHisAccPremium { get; set; }
    [Column("c_quarDecSumViet")]
    public string c_quarDecSumViet { get; set; }
    [Column("c_businessOccupationViet")]
    public string c_businessOccupationViet { get; set; }
    [Column("c_actualDaysCalc")]
    public string c_actualDaysCalc { get; set; }
    [Column("c_specApplied")]
    public string c_specApplied { get; set; }
    [Column("c_lossHisAccAmtLoss")]
    public string c_lossHisAccAmtLoss { get; set; }
    [Column("c_limitLia")]
    public string c_limitLia { get; set; }
    [Column("c_totalSumInsBI")]
    public string c_totalSumInsBI { get; set; }
    [Column("c_mgrUname")]
    public string c_mgrUname { get; set; }
    [Column("c_nameOfBizChannel")]
    public string c_nameOfBizChannel { get; set; }
    [Column("c_incIARQuo")]
    public string c_incIARQuo { get; set; }
    [Column("c_registeredAddressViet")]
    public string c_registeredAddressViet { get; set; }
    [Column("c_TSI")]
    public string c_TSI { get; set; }
    [Column("c_quotationBI")]
    public string c_quotationBI { get; set; }
    [Column("c_UWCommentsAtt")]
    public string c_UWCommentsAtt { get; set; }
    [Column("c_refNum")]
    public string c_refNum { get; set; }
    [Column("c_parent_id")]
    public string c_parent_id { get; set; }
    [Column("c_reqType")]
    public string c_reqType { get; set; }
    [Column("c_riskGrade")]
    public string c_riskGrade { get; set; }
    [Column("c_preDiscountTotal")]
    public string c_preDiscountTotal { get; set; }
    [Column("c_legalStatusEng")]
    public string c_legalStatusEng { get; set; }
    [Column("c_a7Days")]
    public string c_a7Days { get; set; }
    [Column("c_code")]
    public string c_code { get; set; }
    [Column("c_qrNum")]
    public string c_qrNum { get; set; }
    [Column("c_insPeriod")]
    public string c_insPeriod { get; set; }
    [Column("c_topRisk")]
    public string c_topRisk { get; set; }
    [Column("c_a5_flag")]
    public string c_a5_flag { get; set; }
    [Column("c_policyDecEng")]
    public string c_policyDecEng { get; set; }
    [Column("c_attachment")]
    public string c_attachment { get; set; }
    [Column("c_quarDecSumEng")]
    public string c_quarDecSumEng { get; set; }
    [Column("c_uwUname")]
    public string c_uwUname { get; set; }
    [Column("c_sftpStatus")]
    public string c_sftpStatus { get; set; }
    [Column("c_noteForBroker")]
    public string c_noteForBroker { get; set; }
    [Column("c_construction")]
    public string c_construction { get; set; }
    [Column("c_phRegisteredAddressViet")]
    public string c_phRegisteredAddressViet { get; set; }
    [Column("c_cloneResFlag")]
    public string c_cloneResFlag { get; set; }
    [Column("c_IARQuoNum")]
    public string c_IARQuoNum { get; set; }
    [Column("c_showGrade")]
    public string c_showGrade { get; set; }
    [Column("c_termsCon")]
    public string c_termsCon { get; set; }
    [Column("c_amount")]
    public string c_amount { get; set; }
    [Column("c_operationYearOfRisk")]
    public string c_operationYearOfRisk { get; set; }
    [Column("c_declabel")]
    public string c_declabel { get; set; }
    [Column("c_a2DaysOver")]
    public string c_a2DaysOver { get; set; }
    [Column("c_ins")]
    public string c_ins { get; set; }
    [Column("c_lossHisAccRatio")]
    public string c_lossHisAccRatio { get; set; }
    [Column("c_attachLocation")]
    public string c_attachLocation { get; set; }
    [Column("c_deductible")]
    public string c_deductible { get; set; }
    [Column("c_RIArrangement")]
    public string c_RIArrangement { get; set; }
    [Column("c_TSIPd")]
    public string c_TSIPd { get; set; }
    [Column("c_surveyResult")]
    public string c_surveyResult { get; set; }
    [Column("c_insRegAddEng")]
    public string c_insRegAddEng { get; set; }
    [Column("c_resReqDate")]
    public string c_resReqDate { get; set; }
    [Column("c_typeOfGrade")]
    public string c_typeOfGrade { get; set; }
    [Column("c_resAtt")]
    public string c_resAtt { get; set; }
    [Column("c_quotationNo")]
    public string c_quotationNo { get; set; }
    [Column("c_showBiQuot")]
    public string c_showBiQuot { get; set; }
    [Column("c_mksTsStatus")]
    public string c_mksTsStatus { get; set; }
    [Column("c_showQuot")]
    public string c_showQuot { get; set; }
    [Column("c_indPeriodAlertFlag")]
    public string c_indPeriodAlertFlag { get; set; }
    [Column("c_indPeriodAlert")]
    public string c_indPeriodAlert { get; set; }
    [Column("c_insBool")]
    public string c_insBool { get; set; }
    [Column("c_preRateAlertFlag")]
    public string c_preRateAlertFlag { get; set; }
    [Column("c_BIQtNumView")]
    public string c_BIQtNumView { get; set; }
    [Column("c_sourceOfBusinessView")]
    public string c_sourceOfBusinessView { get; set; }
    [Column("c_quoNumView")]
    public string c_quoNumView { get; set; }
    [Column("c_isCfe")]
    public string c_isCfe { get; set; }
    [Column("c_productNameView")]
    public string c_productNameView { get; set; }
    [Column("c_policyHolderView")]
    public string c_policyHolderView { get; set; }
    [Column("c_tmiCodeView")]
    public string c_tmiCodeView { get; set; }
    [Column("c_testb")]
    public string c_testb { get; set; }
    [Column("c_testa")]
    public string c_testa { get; set; }
    [Column("c_subject")]
    public string c_subject { get; set; }
    [Column("c_mktFoStatus")]
    public string c_mktFoStatus { get; set; }
    [Column("c_tempMktTs")]
    public string c_tempMktTs { get; set; }
    [Column("c_countLoca")]
    public string c_countLoca { get; set; }
    [Column("c_atLink")]
    public string c_atLink { get; set; }
    [Column("c_at")]
    public string c_at { get; set; }
    [Column("c_datetime")]
    public string c_datetime { get; set; }
    [Column("c_test11111")]
    public string c_test11111 { get; set; }
    [Column("c_emailCc")]
    public string c_emailCc { get; set; }
    [Column("c_status")]
    public string c_status { get; set; }
    [Column("c_showMGR")]
    public string c_showMGR { get; set; }
    [Column("c_preUw")]
    public string c_preUw { get; set; }
    [Column("c_field2")]
    public string c_field2 { get; set; }
    [Column("c_idVIew")]
    public string c_idVIew { get; set; }
    [Column("c_idEdit")]
    public string c_idEdit { get; set; }
    [Column("c_reqDateQT")]
    public string c_reqDateQT { get; set; }
    [Column("c_lineName")]
    public string c_lineName { get; set; }
    [Column("c_showNameBizForm")]
    public string c_showNameBizForm { get; set; }
    [Column("c_mgrUnamePast")]
    public string c_mgrUnamePast { get; set; }
    [Column("c_uwUnamePast")]
    public string c_uwUnamePast { get; set; }
    [Column("c_mktTsUnamePast")]
    public string c_mktTsUnamePast { get; set; }
    [Column("c_insBoolBi")]
    public string c_insBoolBi { get; set; }
    [Column("c_dateTS")]
    public string c_dateTS { get; set; }
    [Column("c_dateTSAccept")]
    public string c_dateTSAccept { get; set; }
    [Column("c_dateTSComplete")]
    public string c_dateTSComplete { get; set; }
    [Column("c_dateFORouteUW")]
    public string c_dateFORouteUW { get; set; }
    [Column("c_dateUWAccept")]
    public string c_dateUWAccept { get; set; }
    [Column("c_dateUWComplete")]
    public string c_dateUWComplete { get; set; }
    [Column("c_dateFORouteMNG")]
    public string c_dateFORouteMNG { get; set; }
    [Column("c_dateFORevise")]
    public string c_dateFORevise { get; set; }
    [Column("c_dateFOComplete")]
    public string c_dateFOComplete { get; set; }
    [Column("c_userTSSubmit")]
    public string c_userTSSubmit { get; set; }
    [Column("c_userUWAccept")]
    public string c_userUWAccept { get; set; }
    [Column("c_cfePremium")]
    public string c_cfePremium { get; set; }
    [Column("c_voluntaryPremium")]
    public string c_voluntaryPremium { get; set; }
    [Column("c_totalPremiumBeforeVat")]
    public string c_totalPremiumBeforeVat { get; set; }
    [Column("c_countLocaBI")]
    public string c_countLocaBI { get; set; }
    [Column("c_sumInsCurrencyBI")]
    public string c_sumInsCurrencyBI { get; set; }
    [Column("c_exRateVND")]
    public string c_exRateVND { get; set; }
    [Column("c_field27")]
    public string c_field27 { get; set; }
    [Column("c_field28")]
    public string c_field28 { get; set; }
    [Column("c_quotationLocation")]
    public string c_quotationLocation { get; set; }
    [Column("c_field166")]
    public string c_field166 { get; set; }
    [Column("c_field47")]
    public string c_field47 { get; set; }
    [Column("c_uwLeader")]
    public string c_uwLeader { get; set; }
    [Column("c_dateUWLComplete")]
    public string c_dateUWLComplete { get; set; }
    [Column("c_uwFormFlag")]
    public string c_uwFormFlag { get; set; }
    [Column("c_totalLocaActual")]
    public string c_totalLocaActual { get; set; }
    [Column("c_totalLocaAnnual")]
    public string c_totalLocaAnnual { get; set; }
    [Column("c_uwLeaderUname")]
    public string c_uwLeaderUname { get; set; }
    [Column("c_skipWf")]
    public string c_skipWf { get; set; }
    [Column("c_addiEmailCc")]
    public string c_addiEmailCc { get; set; }
    [Column("c_reqTypeForm")]
    public string c_reqTypeForm { get; set; }
    [Column("c_addiAttachments")]
    public string c_addiAttachments { get; set; }
    [Column("c_preAddiEmailCc")]
    public string c_preAddiEmailCc { get; set; }
    [Column("c_reqPerson")]
    public string c_reqPerson { get; set; }
    [Column("c_piType")]
    public string c_piType { get; set; }
    [Column("c_clientCodeJG")]
    public string c_clientCodeJG { get; set; }
    [Column("c_businessAddressViet")]
    public string c_businessAddressViet { get; set; }
    [Column("c_clientNameEng")]
    public string c_clientNameEng { get; set; }
    [Column("c_clientCodePA")]
    public string c_clientCodePA { get; set; }
    [Column("c_businessAddressEng")]
    public string c_businessAddressEng { get; set; }
    [Column("c_refId")]
    public string c_refId { get; set; }
    [Column("c_numOfQuot")]
    public string c_numOfQuot { get; set; }
    [Column("c_uwDecisions")]
    public string c_uwDecisions { get; set; }
    [Column("c_reinsurrance")]
    public string c_reinsurrance { get; set; }
    [Column("c_foReins")]
    public string c_foReins { get; set; }

}
