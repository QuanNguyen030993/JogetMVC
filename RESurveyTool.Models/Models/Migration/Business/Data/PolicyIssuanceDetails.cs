using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ERPCore.Models.Migration.Base;

public class PolicyIssuanceDetails : BaseModel
{
    public long? PolicyIssuanceId { get; set; }
    public bool? RiScheme { get; set; } = false;
    public bool? RiClosings { get; set; } = false;
    public bool? FinalPremium { get; set; } = false;
    public bool? PremiumBreakdown { get; set; } = false;
    public bool? IsKycChecked { get; set; } = false;
    public bool? DeclarationText { get; set; } = false;
    public bool? IsBodApproved { get; set; } = false;
    public bool? URFAttachment { get; set; } = false;
    public bool? MachineryList { get; set; } = false;
    public bool? FactoryOperationYears { get; set; } = false;
    public bool? ChassisEngineNumber { get; set; } = false;
    public bool? NewReplacementValue { get; set; } = false;
    public bool? SumInsuredBreakdown { get; set; } = false;
    public bool? IsGlobalCover { get; set; } = false;
    public bool? EmailInformRi { get; set; } = false;
    public bool? ResultAttachment { get; set; } = false;
    public bool? ConfirmedQuotationFlag { get; set; } = false;
    public bool? ProposalForm { get; set; } = false;
    public bool? Ichigenka { get; set; } = false;
    public bool? PolicyNoCL { get; set; } = false;
    public bool? TheInsured { get; set; } = false;
    public bool? Occupation { get; set; } = false;
    public bool? OccupationFCICode { get; set; } = false;
    public bool? RiskGrading { get; set; } = false;
    public bool? POI { get; set; } = false;
    public bool? TSI { get; set; } = false;
    public bool? Premium { get; set; } = false;
    public bool? Deductible { get; set; } = false;
    public bool? TnCs { get; set; } = false;
    public bool? OccupationCode { get; set; } = false;
    public bool? PremiumRate { get; set; } = false;
}