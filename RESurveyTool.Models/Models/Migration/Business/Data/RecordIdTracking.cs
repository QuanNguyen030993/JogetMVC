using System;
using System.ComponentModel.DataAnnotations.Schema;
using SurveyReportRE.Models.Migration.Base;

public class RecordIdTracking : BaseModel
{
    public string record_guid { get; set; } = "";
    public string id_1 { get; set; } = "";
    public string id_2 { get; set; } = "";
    public string id_3 { get; set; } = "";
    public string id_4 { get; set; } = "";
    public string id_5 { get; set; } = "";
    public string id_6 { get; set; } = "";
    public string id_7 { get; set; } = "";
    public string id_8 { get; set; } = "";
    public string id_9 { get; set; } = "";
    public string id_10 { get; set; } = "";
    public string code_list { get; set; } = "";
    public string record_type { get; set; } = "";
    public int last_change_no { get; set; } = 0;
    public DateTime? updated_at { get; set; }
}
