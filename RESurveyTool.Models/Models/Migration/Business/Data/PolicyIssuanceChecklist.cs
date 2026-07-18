using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ERPCore.Models.Migration.Base;
using ERPCore.Models.Migration.Business.MasterData;
public class PolicyIssuanceChecklist : BaseModel
{
    public long? PolicyIssuanceId { get; set; }
    public PolicyIssuance? PolicyIssuanceFK { get; set; }
    public Guid RecordGuid { get; set; }
    public int SequenceNo { get; set; }
    public bool PMCheck { get; set; }
    public string Checkpoint { get; set; } = "";
    public string NeedToCheck { get; set; } = "";
    public string Result { get; set; } = "";
    public long LineId { get; set; }
    public Line? LineFK { get; set; }    
    public long ProductId { get; set; }
    public Product? ProductFK { get; set; }
    //public bool? PolicyNoCL { get; set; } = false;
    //public bool? TheInsured { get; set; } = false;
    //public bool? Occupation { get; set; } = false;
    //public bool? OccupationFCICode { get; set; } = false;
    //public bool? RiskGrading { get; set; } = false;
    //public bool? POI { get; set; } = false;
    //public bool? TSI { get; set; } = false;
    //public bool? Premium { get; set; } = false;
    //public bool? Deductible { get; set; } = false;
    //public bool? TnCs { get; set; } = false;
    //public bool? OccupationCode { get; set; } = false;
    //public bool? PremiumRate { get; set; } = false;
}
