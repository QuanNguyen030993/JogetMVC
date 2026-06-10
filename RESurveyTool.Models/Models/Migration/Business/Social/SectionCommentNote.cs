using System;
using System.ComponentModel.DataAnnotations;
using ERPCore.Models.Migration.Base;
namespace ERPCore.Models.Migration.Business.Social;

public class SectionCommentNote : BaseModel
{
    public override DateTime? CreatedDate { get => base.CreatedDate; set => base.CreatedDate = value; }
    public Guid RecordGuid { get; set; }
    public string? FromDepartment { get; set; }
    public string? ToDepartment { get; set; }
    public string? Author { get; set; }
    public string? CurrentDepartment { get; set; }
    public string? Type { get; set; }   // Discussion / Request / Blocker / Internal
    [MaxLength(8000)]
    public string? Content { get; set; }
    public bool IsPrimaryNote { get; set; }
    public bool IsPinned { get; set; }
    public bool IsUrgent { get; set; }
    public bool IsRead { get; set; }
    public bool IsResolved { get; set; }
    public long? ParentCommentId { get; set; }
    public long? LinkedPrimaryNoteId { get; set; }


}