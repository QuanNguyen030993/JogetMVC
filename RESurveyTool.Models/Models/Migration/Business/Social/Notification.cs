using System;
using System.ComponentModel.DataAnnotations;
using ERPCore.Models.Migration.Base;
namespace ERPCore.Models.Migration.Business.Social;

public class Notification : BaseModel
{
    public override DateTime? CreatedDate { get => base.CreatedDate; set => base.CreatedDate = value; }
    public override string? CreatedBy{ get => base.CreatedBy; set => base.CreatedBy = value; }
    public string Title { get; set; } = "";
    [MaxLength(8000)]
    public string Message { get; set; } = "";
    public bool IsRead { get; set; } = false;
    [MaxLength(8000)] 
    public string? Url { get; set; } = "";
    [MaxLength(255)]
    public string? Resource { get; set; } = "";
    [MaxLength(255)]
    public string? System { get; set; } = "";
    [MaxLength(255)]
    public string? ReceivedBy { get; set; } = "";
    public Guid? RecordGuid { get; set; }
    public long? Type { get; set; }
    public EnumDataTypeAttribute? TypeEnum { get; set; }

}