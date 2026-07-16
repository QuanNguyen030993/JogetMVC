using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ERPCore.Models.Migration.Base;

namespace ERPCore.Models.Migration.Business.Data;

public class Checklist : BaseModel
{
    public Guid RecordGuid { get; set; }
    public int SequenceNo { get; set; }
    public bool PMCheck { get; set; }

    [MaxLength(100)]
    public string Checkpoint { get; set; } = "";

    [Column(TypeName = "nvarchar(max)")]
    public string NeedToCheck { get; set; } = "";

    public bool Result { get; set; }
    public long LineId { get; set; }
    public long ProductId { get; set; }
}
