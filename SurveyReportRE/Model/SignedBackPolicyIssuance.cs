using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ERPCore.Models.Migration.Base;

public class SignedBackPolicyIssuance : BaseModel
{
    public long PolicyIssuanceId { get; set; }

    [ForeignKey(nameof(PolicyIssuanceId))]
    public PolicyIssuance? PolicyIssuanceFK { get; set; }

    public int ReminderCount { get; set; }

    public DateTime? ReminderDate { get; set; }

    [MaxLength(4000)]
    public string? Note { get; set; } = "";
}
