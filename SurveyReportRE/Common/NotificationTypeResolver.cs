using ERPCore.Models.Migration.Business.Workflow;
using ERPCore.Models.Migration.Config;

namespace ERPCore.Common;

public static class NotificationTypeKeys
{
    public const string Default = "Default";
    public const string Assign = "Assign";
    public const string System = "System";
    public const string PolicyIssuance = "PolicyIssuance";
    public const string Quotation = "Quotation";
    public const string Accept = "Accept";
    public const string Success = "Success";
    public const string Fail = "Fail";
    public const string Initial = "Initial";
    public const string Reminder = "Reminder";
    public const string Alert = "Alert";
    public const string Comment = "Comment";

    public static readonly IReadOnlySet<string> All = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    {
        Default,
        Assign,
        System,
        PolicyIssuance,
        Quotation,
        Accept,
        Success,
        Fail,
        Initial,
        Reminder,
        Alert,
        Comment
    };
}

public static class NotificationTypeResolver
{
    public static async Task<long?> ResolveIdAsync(
        IBaseRepository<EnumData> enumDataRepository,
        string? notificationType)
    {
        string normalizedType = NormalizeType(notificationType);
        List<EnumData> notificationTypes = await enumDataRepository.EnumData("NotificationType");

        EnumData? match = notificationTypes.FirstOrDefault(item =>
            IsMatch(item.Key, normalizedType)
            || IsMatch(item.Code, normalizedType)
            || IsMatch(item.Value, normalizedType));

        if (match == null && !string.Equals(
                normalizedType,
                NotificationTypeKeys.Default,
                StringComparison.OrdinalIgnoreCase))
        {
            match = notificationTypes.FirstOrDefault(item =>
                IsMatch(item.Key, NotificationTypeKeys.Default)
                || IsMatch(item.Code, NotificationTypeKeys.Default)
                || IsMatch(item.Value, NotificationTypeKeys.Default));
        }

        return match?.Id;
    }

    public static string ResolveWorkflowType(
        StepsWorkflow? step,
        WorkflowDefinition? workflowDefinition,
        string fallbackType = NotificationTypeKeys.Default)
    {
        string eventText = string.Join(" ", new[]
        {
            step?.ActionCode,
            step?.StatusCode,
            step?.StatusName,
            step?.DisplayStatus,
            step?.StepCode,
            step?.StepName,
            step?.Command
        }.Where(value => !string.IsNullOrWhiteSpace(value)));

        if (ContainsAny(eventText, "reminder", "remind")) return NotificationTypeKeys.Reminder;
        if (ContainsAny(eventText, "alert")) return NotificationTypeKeys.Alert;
        if (ContainsAny(eventText, "accept", "accepted")) return NotificationTypeKeys.Accept;
        if (ContainsAny(eventText, "fail", "failed", "reject", "rejected", "decline", "declined", "error"))
            return NotificationTypeKeys.Fail;
        if (ContainsAny(eventText, "success", "successful", "complete", "completed", "done", "approve", "approved", "issued"))
            return NotificationTypeKeys.Success;
        if (ContainsAny(eventText, "assign", "assigned")) return NotificationTypeKeys.Assign;
        if ((step?.IsStart ?? false) || ContainsAny(eventText, "initial", "initialize", "start"))
            return NotificationTypeKeys.Initial;
        if (step?.IsEnd ?? false) return NotificationTypeKeys.Success;

        string flowType = workflowDefinition?.FlowType ?? step?.FlowType ?? "";
        if (ContainsAny(flowType, "policyissuance", "policy issuance", "policy"))
            return NotificationTypeKeys.PolicyIssuance;
        if (ContainsAny(flowType, "quotation", "quote")) return NotificationTypeKeys.Quotation;

        return NormalizeType(fallbackType);
    }

    private static string NormalizeType(string? notificationType)
    {
        if (string.IsNullOrWhiteSpace(notificationType)) return NotificationTypeKeys.Default;

        return NotificationTypeKeys.All.FirstOrDefault(type =>
                   string.Equals(Canonicalize(type), Canonicalize(notificationType), StringComparison.OrdinalIgnoreCase))
               ?? NotificationTypeKeys.Default;
    }

    private static bool IsMatch(string? enumValue, string notificationType)
    {
        return string.Equals(Canonicalize(enumValue), Canonicalize(notificationType), StringComparison.OrdinalIgnoreCase);
    }

    private static string Canonicalize(string? value)
    {
        return new string((value ?? "")
            .Where(char.IsLetterOrDigit)
            .Select(char.ToLowerInvariant)
            .ToArray());
    }

    private static bool ContainsAny(string source, params string[] values)
    {
        return values.Any(value => source.Contains(value, StringComparison.OrdinalIgnoreCase));
    }
}
