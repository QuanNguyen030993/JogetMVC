using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using SurveyReportRE.Models.Migration.Base;

public class SystemProperties : BaseModel
{
    public string processDefId { get; set; } = "";
    public string activityDefId { get; set; } = "";
    public string packageId { get; set; } = "";
    public string ouid { get; set; } = "";
    public string type { get; set; } = "";
    public string formId { get; set; } = "";
    public string formUrl { get; set; } = "";
    public string formIFrameStyle { get; set; } = "";
    public string autoContinue { get; set; } = "";
    [MaxLength(8000)]
    public string jsonProperties { get; set; } = "";
    public string tableName { get; set; } = "";
    public string formOrflowName { get; set; } = "";
    public string Id1 { get; set; } = "";
    public string Id2 { get; set; } = "";
    public string Name1 { get; set; } = "";
    public string Name2 { get; set; } = "";
    public string ouidDescription { get; set; } = "";

}
