using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ERPCore.Models.Migration.Base;

namespace ERPCore.Models.Migration.Business.MasterData;

public class ChecklistDefinition : BaseModel
{
    public int SequenceNo { get; set; }
    public string? Checkpoint { get; set; } = "";
    public string? NeedToCheck { get; set; } = "";
    public long? LineId { get; set; }
    public long? ProductId { get; set; }
}
