using ERPCore.Models.Migration.Base;
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class PolicyIssuanceSubDetails : BaseModel
{
    public long? PolicyIssuanceId { get; set; }
    public string TranNo { get; set; }
    public string Renew { get; set; }
    public string Endorsement { get; set; }
    public string QuotationCode { get; set; }
    public string PolicyNo { get; set; }
    public long? ClientId { get; set; }
    public string ClientName { get; set; }
}