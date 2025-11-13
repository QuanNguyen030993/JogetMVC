using System;
using System.ComponentModel.DataAnnotations.Schema;
using SurveyReportRE.Models.Migration.Base;

public class RecordWorkflow : BaseModel
{
    public string ProcessId { get; set; } = "";
    public string ActivityId { get; set; } = "";
    public string Name { get; set; } = "";
    public string RecordGuid { get; set; } = "";
}
