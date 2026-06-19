using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ERPCore.Models.Migration.Base;

public class PolicyIssuanceDetails : BaseModel
{
    public long? PolicyIssuanceId { get; set; }
    public PolicyIssuance? PolicyIssuanceFK { get; set; }
    //public DateTime? PeriodInsuranceStartDate { get; set; }
    //public DateTime? PeriodInsuranceEndDate { get; set; }
    public bool? PolicyPackage { get; set; } = false;
    public bool? LanguageOfPolicy { get; set; } = false;
    public bool? HardSoftCopy { get; set; } = false;

    public bool? ConfirmedQuotationFlag { get; set; } = false;
    public bool? EmailMktClient { get; set; } = false;
    public bool? RiClosings { get; set; } = false;
    public bool? NewReplacementValue { get; set; } = false;
    public bool? HoldCoverType { get; set; } = false;
    public bool? ResultAttachment { get; set; } = false;
    public bool? DeclarationText { get; set; } = false;
    public bool? MachineryList { get; set; } = false;
    public bool? IsBodApproved { get; set; } = false;
    public bool? URFAttachment { get; set; } = false;
    public bool? EmailInformRi { get; set; } = false;
    public bool? ProposalForm { get; set; } = false;
    public bool? SumInsuredBreakdown { get; set; } = false;
    public bool? PremiumBreakdown { get; set; } = false;
    public bool? ChassisEngineNumber { get; set; } = false;
    public bool? FinalPremium { get; set; } = false;
    public bool? IsKycChecked { get; set; } = false;
    public bool? Others { get; set; } = false;
    public bool? IsGlobalCover { get; set; } = false;
    public bool? Ichigenka { get; set; } = false;
    public bool? RiScheme { get; set; } = false;
    public string? FactoryOperationYears { get; set; } = "";
    public string? PropertyType { get; set; } = "";
    [MaxLength(8000)]
    public string? Reason { get; set; } = "";
}