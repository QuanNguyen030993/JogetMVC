using System;
using System.ComponentModel.DataAnnotations.Schema;
using ERPCore.Models.Migration.Base;

public class PolicyIssuanceProcess : BaseModel
{
    [Column("dateCreated")]
    public DateTime? dateCreated { get; set; }
    [Column("dateModified")]
    public DateTime? dateModified { get; set; }
    [Column("createdByName")]
    public string createdByName { get; set; }
    [Column("modifiedByName")]
    public string modifiedByName { get; set; }
    [Column("c_PMPIC")]
    public string c_PMPIC { get; set; }
    [Column("c_listEmail")]
    public string c_listEmail { get; set; }
    [Column("c_noteForCoInsurance")]
    public string c_noteForCoInsurance { get; set; }
    [Column("c_title2Email")]
    public string c_title2Email { get; set; }
    [Column("c_policyNo")]
    public string c_policyNo { get; set; }
    [Column("c_userAccept")]
    public string c_userAccept { get; set; }
    [Column("c_acceptedDate")]
    public string c_acceptedDate { get; set; }
    [Column("c_piStatusLabel")]
    public string c_piStatusLabel { get; set; }
    [Column("c_piRefNum")]
    public string c_piRefNum { get; set; }
    [Column("c_jogetQuoNum")]
    public string c_jogetQuoNum { get; set; }
    [Column("c_MKTTS")]
    public string c_MKTTS { get; set; }
    [Column("c_piNumByPm")]
    public string c_piNumByPm { get; set; }
    [Column("c_userEmail")]
    public string c_userEmail { get; set; }
    [Column("c_piType")]
    public string c_piType { get; set; }
    [Column("c_productType")]
    public string c_productType { get; set; }
    [Column("c_a1_flag")]
    public string c_a1_flag { get; set; }
    [Column("c_foStatus")]
    public string c_foStatus { get; set; }
    [Column("c_completedDate")]
    public string c_completedDate { get; set; }
    [Column("c_piStatus")]
    public string c_piStatus { get; set; }
    [Column("c_foUname")]
    public string c_foUname { get; set; }
    [Column("c_pmStatus")]
    public string c_pmStatus { get; set; }
    [Column("c_refNum")]
    public string c_refNum { get; set; }
    [Column("c_a1DaysOver")]
    public string c_a1DaysOver { get; set; }
    [Column("c_parent_id")]
    public string c_parent_id { get; set; }
    [Column("c_tsStatus")]
    public string c_tsStatus { get; set; }
    [Column("c_reqType")]
    public string c_reqType { get; set; }
    [Column("c_assignee")]
    public string c_assignee { get; set; }
    [Column("c_PM")]
    public string c_PM { get; set; }
    [Column("c_titleEmail")]
    public string c_titleEmail { get; set; }
    [Column("c_coInsuranceOutward")]
    public string c_coInsuranceOutward { get; set; }
    [Column("c_remarks")]
    public string c_remarks { get; set; }
    [Column("c_linkEmail")]
    public string c_linkEmail { get; set; }
    [Column("c_policyHolder")]
    public string c_policyHolder { get; set; }
    [Column("c_FOIncharged")]
    public string c_FOIncharged { get; set; }
    [Column("c_pmRemarks")]
    public string c_pmRemarks { get; set; }
    [Column("c_TSIncharged")]
    public string c_TSIncharged { get; set; }
    [Column("c_policyType")]
    public string c_policyType { get; set; }
    [Column("c_piAttach")]
    public string c_piAttach { get; set; }
    [Column("c_quoNumFlag")]
    public string c_quoNumFlag { get; set; }
    [Column("c_dueDate")]
    public string c_dueDate { get; set; }
    [Column("c_businessChannel")]
    public string c_businessChannel { get; set; }
    [Column("c_nameOfBizChannel")]
    public string c_nameOfBizChannel { get; set; }
    [Column("c_periodInsStart")]
    public string c_periodInsStart { get; set; }
    [Column("c_jogetQuoNum1")]
    public string c_jogetQuoNum1 { get; set; }
    [Column("c_preRemark")]
    public string c_preRemark { get; set; }
    [Column("c_piRefNumTs")]
    public string c_piRefNumTs { get; set; }
    [Column("c_status")]
    public string c_status { get; set; }
    [Column("c_ts")]
    public string c_ts { get; set; }
    [Column("c_qwq")]
    public string c_qwq { get; set; }
    [Column("c_a2Days")]
    public string c_a2Days { get; set; }
    [Column("c_a3Days")]
    public string c_a3Days { get; set; }
    [Column("c_a5DaysOver")]
    public string c_a5DaysOver { get; set; }
    [Column("c_a6DaysOver")]
    public string c_a6DaysOver { get; set; }
    [Column("c_a3DaysOver")]
    public string c_a3DaysOver { get; set; }
    [Column("c_a8DaysOver")]
    public string c_a8DaysOver { get; set; }
    [Column("c_a1Days")]
    public string c_a1Days { get; set; }
    [Column("c_a7Days")]
    public string c_a7Days { get; set; }
    [Column("c_a8Days")]
    public string c_a8Days { get; set; }
    [Column("c_a4DaysOver")]
    public string c_a4DaysOver { get; set; }
    [Column("c_a4Days")]
    public string c_a4Days { get; set; }
    [Column("c_a7DaysOver")]
    public string c_a7DaysOver { get; set; }
    [Column("c_a2DaysOver")]
    public string c_a2DaysOver { get; set; }
    [Column("c_a6Days")]
    public string c_a6Days { get; set; }
    [Column("c_a5Days")]
    public string c_a5Days { get; set; }
    [Column("c_prePIC")]
    public string c_prePIC { get; set; }
    [Column("c_prePm")]
    public string c_prePm { get; set; }
    [Column("c_productName")]
    public string c_productName { get; set; }
    [Column("c_showNameBizForm")]
    public string c_showNameBizForm { get; set; }
    [Column("c_dateFOTS")]
    public string c_dateFOTS { get; set; }
    [Column("c_preRemarks")]
    public string c_preRemarks { get; set; }
    [Column("c_emailCC")]
    public string c_emailCC { get; set; }
    [Column("c_piNumByTs")]
    public string c_piNumByTs { get; set; }
    [Column("c_piNumByFo")]
    public string c_piNumByFo { get; set; }
    [Column("c_piLocation")]
    public string c_piLocation { get; set; }
    [Column("c_addiAttachments")]
    public string c_addiAttachments { get; set; }
    [Column("c_addiEmailCc")]
    public string c_addiEmailCc { get; set; }
    [Column("c_preAddiEmailCc")]
    public string c_preAddiEmailCc { get; set; }
    [Column("c_followUp")]
    public string c_followUp { get; set; }
    [Column("c_preMKTTS")]
    public string c_preMKTTS { get; set; }
    [Column("c_numOfPolicy")]
    public string c_numOfPolicy { get; set; }
    [Column("c_field69")]
    public string c_field69 { get; set; }
    [Column("c_TS_remarks")]
    public string c_TS_remarks { get; set; }
    [Column("c_hardSoftCopy")]
    public string c_hardSoftCopy { get; set; }
}
