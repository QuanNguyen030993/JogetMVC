using System;
using System.ComponentModel.DataAnnotations.Schema;
using ERPCore.Models.Migration.Base;

public class QuoRequest : BaseModel
{
    [Column("dateCreated")]
    public DateTime? dateCreated { get; set; }
    [Column("dateModified")]
    public DateTime? dateModified { get; set; }
    [Column("createdByName")]
    public string createdByName { get; set; }
    [Column("modifiedByName")]
    public string modifiedByName { get; set; }
    [Column("c_VAT")]
    public string c_VAT { get; set; }
    [Column("c_premiumRate")]
    public string c_premiumRate { get; set; }
    [Column("c_policyNo")]
    public string c_policyNo { get; set; }
    [Column("c_productName")]
    public string c_productName { get; set; }
    [Column("c_insViet")]
    public string c_insViet { get; set; }
    [Column("c_insRegAdd")]
    public string c_insRegAdd { get; set; }
    [Column("c_jogetQuoNum")]
    public string c_jogetQuoNum { get; set; }
    [Column("c_MKTTS")]
    public string c_MKTTS { get; set; }
    [Column("c_coverageViet")]
    public string c_coverageViet { get; set; }
    [Column("c_incBIQuo")]
    public string c_incBIQuo { get; set; }
    [Column("c_noteForBrokerViet")]
    public string c_noteForBrokerViet { get; set; }
    [Column("c_lawJurisEng")]
    public string c_lawJurisEng { get; set; }
    [Column("c_mktTsRemarks")]
    public string c_mktTsRemarks { get; set; }
    [Column("c_qtStatus")]
    public string c_qtStatus { get; set; }
    [Column("c_actualDays")]
    public string c_actualDays { get; set; }
    [Column("c_mktTsDaysOver")]
    public string c_mktTsDaysOver { get; set; }
    [Column("c_stocksEng")]
    public string c_stocksEng { get; set; }
    [Column("c_excRate")]
    public string c_excRate { get; set; }
    [Column("c_tmiCode")]
    public string c_tmiCode { get; set; }
    [Column("c_reqDays")]
    public string c_reqDays { get; set; }
    [Column("c_lawJurisViet")]
    public string c_lawJurisViet { get; set; }
    [Column("c_periodInsEnd")]
    public string c_periodInsEnd { get; set; }
    [Column("c_dutyDisEng")]
    public string c_dutyDisEng { get; set; }
    [Column("c_mktFoDaysSla")]
    public string c_mktFoDaysSla { get; set; }
    [Column("c_totalSumIns")]
    public string c_totalSumIns { get; set; }
    [Column("c_locationsEng")]
    public string c_locationsEng { get; set; }
    [Column("c_typeOfQT")]
    public string c_typeOfQT { get; set; }
    [Column("c_status")]
    public string c_status { get; set; }
    [Column("c_typeOfQR")]
    public string c_typeOfQR { get; set; }
    [Column("c_TMIVShare")]
    public string c_TMIVShare { get; set; }
    [Column("c_uwRa")]
    public string c_uwRa { get; set; }
    [Column("c_totalDue")]
    public string c_totalDue { get; set; }
    [Column("c_clientCodePA")]
    public string c_clientCodePA { get; set; }
    [Column("c_FOremarks")]
    public string c_FOremarks { get; set; }
    [Column("c_insuredProperty")]
    public string c_insuredProperty { get; set; }
    [Column("c_reqDate")]
    public string c_reqDate { get; set; }
    [Column("c_quoValViet")]
    public string c_quoValViet { get; set; }
    [Column("c_policyHolderViet")]
    public string c_policyHolderViet { get; set; }
    [Column("c_currency")]
    public string c_currency { get; set; }
    [Column("c_geoLimitViet")]
    public string c_geoLimitViet { get; set; }
    [Column("c_claimSetBasisViet")]
    public string c_claimSetBasisViet { get; set; }
    [Column("c_businessChannel")]
    public string c_businessChannel { get; set; }
    [Column("c_addExtViet")]
    public string c_addExtViet { get; set; }
    [Column("c_businessAddressEng")]
    public string c_businessAddressEng { get; set; }
    [Column("c_businessOccupationEng")]
    public string c_businessOccupationEng { get; set; }
    [Column("c_qrStatusLabel")]
    public string c_qrStatusLabel { get; set; }
    [Column("c_claimSetBasisEng")]
    public string c_claimSetBasisEng { get; set; }
    [Column("c_qrStatus")]
    public string c_qrStatus { get; set; }
    [Column("c_reqEmail")]
    public string c_reqEmail { get; set; }
    [Column("c_attQuo")]
    public string c_attQuo { get; set; }
    [Column("c_mktTsDaysSla")]
    public string c_mktTsDaysSla { get; set; }
    [Column("c_reqDaysSla")]
    public string c_reqDaysSla { get; set; }
    [Column("c_numLocation")]
    public string c_numLocation { get; set; }
    [Column("c_geoLimitEng")]
    public string c_geoLimitEng { get; set; }
    [Column("c_to")]
    public string c_to { get; set; }
    [Column("c_policyHolder")]
    public string c_policyHolder { get; set; }
    [Column("c_mapLocation")]
    public string c_mapLocation { get; set; }
    [Column("c_qtNumSel")]
    public string c_qtNumSel { get; set; }
    [Column("c_subject")]
    public string c_subject { get; set; }
    [Column("c_mktFoDaysOver")]
    public string c_mktFoDaysOver { get; set; }
    [Column("c_dueDate")]
    public string c_dueDate { get; set; }
    [Column("c_VATPerc")]
    public string c_VATPerc { get; set; }
    [Column("c_sourceOfBusiness")]
    public string c_sourceOfBusiness { get; set; }
    [Column("c_businessOccupation")]
    public string c_businessOccupation { get; set; }
    [Column("c_insIntSumViet")]
    public string c_insIntSumViet { get; set; }
    [Column("c_insRegAddViet")]
    public string c_insRegAddViet { get; set; }
    [Column("c_reqDaysOver")]
    public string c_reqDaysOver { get; set; }
    [Column("c_registeredAddress")]
    public string c_registeredAddress { get; set; }
    [Column("c_addInsViet")]
    public string c_addInsViet { get; set; }
    [Column("c_clientCodeJG")]
    public string c_clientCodeJG { get; set; }
    [Column("c_quoValEng")]
    public string c_quoValEng { get; set; }
    [Column("c_quarDecSumViet")]
    public string c_quarDecSumViet { get; set; }
    [Column("c_businessOccupationViet")]
    public string c_businessOccupationViet { get; set; }
    [Column("c_addExtEng")]
    public string c_addExtEng { get; set; }
    [Column("c_nameOfBizChannel")]
    public string c_nameOfBizChannel { get; set; }
    [Column("c_clientNameEng")]
    public string c_clientNameEng { get; set; }
    [Column("c_registeredAddressViet")]
    public string c_registeredAddressViet { get; set; }
    [Column("c_reqPerson")]
    public string c_reqPerson { get; set; }
    [Column("c_clientNameEngSel")]
    public string c_clientNameEngSel { get; set; }
    [Column("c_periodInsStart")]
    public string c_periodInsStart { get; set; }
    [Column("c_dutyDisViet")]
    public string c_dutyDisViet { get; set; }
    [Column("c_refNum")]
    public string c_refNum { get; set; }
    [Column("c_mktFoDays")]
    public string c_mktFoDays { get; set; }
    [Column("c_proCusViet")]
    public string c_proCusViet { get; set; }
    [Column("c_addInsEng")]
    public string c_addInsEng { get; set; }
    [Column("c_FOremarks1")]
    public string c_FOremarks1 { get; set; }
    [Column("c_riskGrade")]
    public string c_riskGrade { get; set; }
    [Column("c_policyDecViet")]
    public string c_policyDecViet { get; set; }
    [Column("c_qrNum")]
    public string c_qrNum { get; set; }
    [Column("c_insPeriod")]
    public string c_insPeriod { get; set; }
    [Column("c_policyDecEng")]
    public string c_policyDecEng { get; set; }
    [Column("c_quarDecSumEng")]
    public string c_quarDecSumEng { get; set; }
    [Column("c_locationsViet")]
    public string c_locationsViet { get; set; }
    [Column("c_noteForBroker")]
    public string c_noteForBroker { get; set; }
    [Column("c_proOpenAreaViet")]
    public string c_proOpenAreaViet { get; set; }
    [Column("c_qrNumSel")]
    public string c_qrNumSel { get; set; }
    [Column("c_coverage")]
    public string c_coverage { get; set; }
    [Column("c_termsCon")]
    public string c_termsCon { get; set; }
    [Column("c_stocksViet")]
    public string c_stocksViet { get; set; }
    [Column("c_insIntSumEng")]
    public string c_insIntSumEng { get; set; }
    [Column("c_proOpenAreaEng")]
    public string c_proOpenAreaEng { get; set; }
    [Column("c_ins")]
    public string c_ins { get; set; }
    [Column("c_proCusEng")]
    public string c_proCusEng { get; set; }
    [Column("c_mktTsDays")]
    public string c_mktTsDays { get; set; }
    [Column("c_attachLocation")]
    public string c_attachLocation { get; set; }
    [Column("c_deductible")]
    public string c_deductible { get; set; }
    [Column("c_location")]
    public string c_location { get; set; }
    [Column("c_remarks")]
    public string c_remarks { get; set; }
    [Column("c_businessAddressViet")]
    public string c_businessAddressViet { get; set; }
    [Column("c_test")]
    public string c_test { get; set; }
    [Column("c_draftBool")]
    public string c_draftBool { get; set; }
    [Column("c_clientNameEngSelDraft")]
    public string c_clientNameEngSelDraft { get; set; }
    [Column("c_qrNumSelDraft")]
    public string c_qrNumSelDraft { get; set; }
    [Column("c_qrNumSelFlag")]
    public string c_qrNumSelFlag { get; set; }
    [Column("c_clientNameEngSelFlag")]
    public string c_clientNameEngSelFlag { get; set; }
    [Column("c_quotationLocation")]
    public string c_quotationLocation { get; set; }
    [Column("c_addiEmailCc")]
    public string c_addiEmailCc { get; set; }
    [Column("c_addiAttachments")]
    public string c_addiAttachments { get; set; }
    [Column("c_notes")]
    public string c_notes { get; set; }

}
