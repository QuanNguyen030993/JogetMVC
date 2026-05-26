using System;
using System.ComponentModel.DataAnnotations.Schema;
using ERPCore.Models.Migration.Base;
using ERPCore.Models.Migration.Business.Data;
using ERPCore.Models.Migration.Business.MasterData;
using ERPCore.Models.Migration.Config;

public class QuotationSubDetails : BaseModel
{
    public long? CoverageId { get; set; }
    // Model plan
    public long? DeductibleId { get; set; }
    // Model plan
    public long? InstallmentId { get; set; }
    // Model plan
    public long? ClauseId { get; set; }
    // Model plan
    public long? LocationId { get; set; }
    public Location? LocationFK { get; set; }
}

