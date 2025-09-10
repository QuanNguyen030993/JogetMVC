using SurveyReportRE.Models.Migration.Base;
using System;
using System.ComponentModel.DataAnnotations.Schema;

public class PolicyIssuanceRequest : BaseModel
{ 
    [Column("dateCreated")]
    public DateTime? dateCreated { get; set; }
    [Column("dateModified")]
    public DateTime? dateModified { get; set; }
    [Column("createdByName")]
    public string createdByName { get; set; }
    [Column("modifiedByName")]
    public string modifiedByName { get; set; }
    [Column("c_confirmedQuotation")]
    public string c_confirmedQuotation { get; set; }
    [Column("c_reason")]
    public string c_reason { get; set; }
    [Column("c_listEmail")]
    public string c_listEmail { get; set; }
    [Column("c_policyNo")]
    public string c_policyNo { get; set; }
    [Column("c_title2Email")]
    public string c_title2Email { get; set; }
    [Column("c_productName")]
    public string c_productName { get; set; }
    [Column("c_piStatusLabel")]
    public string c_piStatusLabel { get; set; }
    [Column("c_jogetQuoNum")]
    public string c_jogetQuoNum { get; set; }
    [Column("c_TSremarks")]
    public string c_TSremarks { get; set; }
    [Column("c_piNumByPm")]
    public string c_piNumByPm { get; set; }
    [Column("c_a3Days")]
    public string c_a3Days { get; set; }
    [Column("c_a1_flag")]
    public string c_a1_flag { get; set; }
    [Column("c_a5DaysOver")]
    public string c_a5DaysOver { get; set; }
    [Column("c_typeOfPropertyListAtt")]
    public string c_typeOfPropertyListAtt { get; set; }
    [Column("c_holdCover")]
    public string c_holdCover { get; set; }
    [Column("c_BODApproved")]
    public string c_BODApproved { get; set; }
    [Column("c_FOInchargedView")]
    public string c_FOInchargedView { get; set; }
    [Column("c_FOIncharged")]
    public string c_FOIncharged { get; set; }
    [Column("c_piRemarks")]
    public string c_piRemarks { get; set; }
    [Column("c_URFAtt")]
    public string c_URFAtt { get; set; }
    [Column("c_a8DaysOver")]
    public string c_a8DaysOver { get; set; }
    [Column("c_othersAtt")]
    public string c_othersAtt { get; set; }
    [Column("c_a1DaysOver")]
    public string c_a1DaysOver { get; set; }
    [Column("c_emailMKTClient")]
    public string c_emailMKTClient { get; set; }
    [Column("c_piNumHCM1")]
    public string c_piNumHCM1 { get; set; }
    [Column("c_declarationAtt")]
    public string c_declarationAtt { get; set; }
    [Column("c_newReplacementValueAtt")]
    public string c_newReplacementValueAtt { get; set; }
    [Column("c_assignee")]
    public string c_assignee { get; set; }
    [Column("c_premiumBreakdownAtt")]
    public string c_premiumBreakdownAtt { get; set; }
    [Column("c_a1Days")]
    public string c_a1Days { get; set; }
    [Column("c_languageOfPolicy")]
    public string c_languageOfPolicy { get; set; }
    [Column("c_operationYearofFactoriesAtt")]
    public string c_operationYearofFactoriesAtt { get; set; }
    [Column("c_URF")]
    public string c_URF { get; set; }
    [Column("c_chasisEngineNumberAtt")]
    public string c_chasisEngineNumberAtt { get; set; }
    [Column("c_global")]
    public string c_global { get; set; }
    [Column("c_finalPremium")]
    public string c_finalPremium { get; set; }
    [Column("c_piNumHanoi1")]
    public string c_piNumHanoi1 { get; set; }
    [Column("c_reqDate")]
    public DateTime? c_reqDate { get; set; }
    [Column("c_a8Days")]
    public string c_a8Days { get; set; }
    [Column("c_userEmail")]
    public string c_userEmail { get; set; }
    [Column("c_premiumBreakdown")]
    public string c_premiumBreakdown { get; set; }
    [Column("c_noteForCoInsuranceOutward")]
    public string c_noteForCoInsuranceOutward { get; set; }
    [Column("c_ichigenka")]
    public string c_ichigenka { get; set; }
    [Column("c_businessChannel")]
    public string c_businessChannel { get; set; }
    [Column("c_emailMKTClientAtt")]
    public string c_emailMKTClientAtt { get; set; }
    [Column("c_emailInformRI")]
    public string c_emailInformRI { get; set; }
    [Column("c_quantityOfPolicy")]
    public string c_quantityOfPolicy { get; set; }
    [Column("c_a4DaysOver")]
    public string c_a4DaysOver { get; set; }
    [Column("c_a4Days")]
    public string c_a4Days { get; set; }
    [Column("c_a7DaysOver")]
    public string c_a7DaysOver { get; set; }
    [Column("c_declaration")]
    public string c_declaration { get; set; }
    [Column("c_piStatus")]
    public string c_piStatus { get; set; }
    [Column("c_confirmedQuotationAtt")]
    public string c_confirmedQuotationAtt { get; set; }
    [Column("c_listOfMachineriesAtt")]
    public string c_listOfMachineriesAtt { get; set; }
    [Column("c_emailInformRIAtt")]
    public string c_emailInformRIAtt { get; set; }
    [Column("c_BODApprovedAtt")]
    public string c_BODApprovedAtt { get; set; }
    [Column("c_operationYearofFactories")]
    public string c_operationYearofFactories { get; set; }
    [Column("c_a6Days")]
    public string c_a6Days { get; set; }
    [Column("c_finalPremiumAtt")]
    public string c_finalPremiumAtt { get; set; }
    [Column("c_packageOfPolicy")]
    public string c_packageOfPolicy { get; set; }
    [Column("c_coInsuranceOutward")]
    public string c_coInsuranceOutward { get; set; }
    [Column("c_policyHolder")]
    public string c_policyHolder { get; set; }
    [Column("c_linkEmail")]
    public string c_linkEmail { get; set; }
    [Column("c_TSIncharged")]
    public string c_TSIncharged { get; set; }
    [Column("c_notes")]
    public string c_notes { get; set; }
    [Column("c_subject")]
    public string c_subject { get; set; }
    [Column("c_dueDate")]
    public DateTime? c_dueDate { get; set; }
    [Column("c_sourceOfBusiness")]
    public string c_sourceOfBusiness { get; set; }
    [Column("c_a2Days")]
    public string c_a2Days { get; set; }
    [Column("c_piNum")]
    public string c_piNum { get; set; }
    [Column("c_breakdownSIAtt")]
    public string c_breakdownSIAtt { get; set; }
    [Column("c_piNumByTs")]
    public string c_piNumByTs { get; set; }
    [Column("c_others")]
    public string c_others { get; set; }
    [Column("c_assigneeForm")]
    public string c_assigneeForm { get; set; }
    [Column("c_res")]
    public string c_res { get; set; }
    [Column("c_chasisEngineNumber")]
    public string c_chasisEngineNumber { get; set; }
    [Column("c_nameOfBizChannel")]
    public string c_nameOfBizChannel { get; set; }
    [Column("c_a6DaysOver")]
    public string c_a6DaysOver { get; set; }
    [Column("c_foStatus")]
    public string c_foStatus { get; set; }
    [Column("c_holdCoverAtt")]
    public string c_holdCoverAtt { get; set; }
    [Column("c_a3DaysOver")]
    public string c_a3DaysOver { get; set; }
    [Column("c_reqPerson")]
    public string c_reqPerson { get; set; }
    [Column("c_resAtt")]
    public string c_resAtt { get; set; }
    [Column("c_listOfMachineries")]
    public string c_listOfMachineries { get; set; }
    [Column("c_RIScheme")]
    public string c_RIScheme { get; set; }
    [Column("c_refNum")]
    public string c_refNum { get; set; }
    [Column("c_parent_id")]
    public string c_parent_id { get; set; }
    [Column("c_dateInsured")]
    public DateTime? c_dateInsured { get; set; }
    [Column("c_reqType")]
    public string c_reqType { get; set; }
    [Column("c_RIClosings")]
    public string c_RIClosings { get; set; }
    [Column("c_a7Days")]
    public string c_a7Days { get; set; }
    [Column("c_TSharged")]
    public string c_TSharged { get; set; }
    [Column("c_RISchemeAtt")]
    public string c_RISchemeAtt { get; set; }
    [Column("c_noteForCoInsurance")]
    public string c_noteForCoInsurance { get; set; }
    [Column("c_typeOfPropertyList")]
    public string c_typeOfPropertyList { get; set; }
    [Column("c_fo2Status")]
    public string c_fo2Status { get; set; }
    [Column("c_piRefNum")]
    public string c_piRefNum { get; set; }
    [Column("c_attachment")]
    public string c_attachment { get; set; }
    [Column("c_piNumByFo")]
    public string c_piNumByFo { get; set; }
    [Column("c_KYCCheckedAtt")]
    public string c_KYCCheckedAtt { get; set; }
    [Column("c_proposalForm")]
    public string c_proposalForm { get; set; }
    [Column("c_piType")]
    public string c_piType { get; set; }
    [Column("c_productType")]
    public string c_productType { get; set; }
    [Column("c_proposalFormAtt")]
    public string c_proposalFormAtt { get; set; }
    [Column("c_ichigenkaAtt")]
    public string c_ichigenkaAtt { get; set; }
    [Column("c_globalAtt")]
    public string c_globalAtt { get; set; }
    [Column("c_RIClosingsAtt")]
    public string c_RIClosingsAtt { get; set; }
    [Column("c_KYCChecked")]
    public string c_KYCChecked { get; set; }
    [Column("c_a2DaysOver")]
    public string c_a2DaysOver { get; set; }
    [Column("c_newReplacementValue")]
    public string c_newReplacementValue { get; set; }
    [Column("c_breakdownSI")]
    public string c_breakdownSI { get; set; }
    [Column("c_tsStatus")]
    public string c_tsStatus { get; set; }
    [Column("c_a5Days")]
    public string c_a5Days { get; set; }
    [Column("c_titleEmail")]
    public string c_titleEmail { get; set; }
    [Column("c_remarks")]
    public string c_remarks { get; set; }
    [Column("c_tdyDate")]
    public DateTime? c_tdyDate { get; set; }
    [Column("c_preMKTTS")]
    public string c_preMKTTS { get; set; }
    [Column("c_preRemark")]
    public string c_preRemark { get; set; }
    [Column("c_prePIC")]
    public string c_prePIC { get; set; }
    [Column("c_pmRemarks")]
    public string c_pmRemarks { get; set; }
    [Column("c_dateFOTS")]
    public DateTime? c_dateFOTS { get; set; }
    [Column("c_piLocation")]
    public string c_piLocation { get; set; }
    [Column("c_SLAPolicyNo")]
    public string c_SLAPolicyNo { get; set; }
    [Column("c_SLAReqType")]
    public string c_SLAReqType { get; set; }
    [Column("c_addiEmailCc")]
    public string c_addiEmailCc { get; set; }
    [Column("c_addiAttachments")]
    public string c_addiAttachments { get; set; }
    [Column("c_preAddiEmailCc")]
    public string c_preAddiEmailCc { get; set; }
}
