using ERPCore.Models.Migration.Base;
using System.ComponentModel.DataAnnotations;

public class SLA : BaseModel
{
    [MaxLength(100)]
    public string? Dept { get; set; }
    [MaxLength(8000)]
    public string? Attributes { get; set; } 
    [MaxLength(50)]
    public string? Code { get; set; }
    public long? Value { get; set; }    
    public long? DecimalValue { get; set; }     
    public DateTime? FromDate { get; set; } 
    public DateTime? ToDate { get; set; } 
    public TimeSpan? Duration { get; set; }
}
