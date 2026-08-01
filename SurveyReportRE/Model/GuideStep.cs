using ERPCore.Models.Migration.Base;

namespace ERPCore.Models.Migration.Config;

public class GuideStep : BaseModel
{
    public string GuideKey { get; set; } = "";
    public string GuideTitle { get; set; } = "";
    public int GuideVersion { get; set; } = 1;
    public string Route { get; set; } = "";
    public string SourceType { get; set; } = "manual";
    public string WikiUrl { get; set; } = "";
    public decimal MaxLoginHours { get; set; } = 0;
    public bool AutoStart { get; set; }
    public int StepNumber { get; set; }
    public string StepTitle { get; set; } = "";
    public string Selector { get; set; } = "";
    public string Placement { get; set; } = "auto";
    public string Content { get; set; } = "";
    public string ContentFormat { get; set; } = "html";
    public int WaitTimeoutMs { get; set; } = 5000;
    public bool IsEnabled { get; set; } = true;
}
