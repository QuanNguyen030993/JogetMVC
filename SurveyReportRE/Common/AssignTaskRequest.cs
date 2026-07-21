namespace ERPCore.Models.Request;

/// <summary>
/// Assigns the current department without moving the workflow transition.
/// The acting user is always resolved from the authenticated server context.
/// </summary>
public sealed class AssignTaskRequest
{
    public long Id { get; set; }
    public string Dept { get; set; } = "";
}
