using ERPCore.Models.Migration.Base;
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class PolicyIssuanceSubDetails : BaseModel
{
    public long? PolicyIssuanceId { get; set; } 
    public string TranNo { get; set; }
    public string Renew { get; set; }
    public string Endorsment { get; set; }  
}