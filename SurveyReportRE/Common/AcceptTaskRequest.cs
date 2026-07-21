namespace ERPCore.Models.Request;

/// <summary>
/// A stationary workflow action. AcceptTask updates the current department
/// state but does not move InstanceWorkflow to another transition/node.
/// </summary>
public sealed class AcceptTaskRequest
{
    public long Id { get; set; }
    public string Dept { get; set; } = "";
    public string? Comment { get; set; }
}
