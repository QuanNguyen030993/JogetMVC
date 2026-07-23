namespace ERPCore.Storage;

public sealed class SharePointUploadOptions
{
    public const string SectionName = "SharePointUpload";

    public bool Enabled { get; set; }
    public string TenantId { get; set; } = string.Empty;
    public string ClientId { get; set; } = string.Empty;
    public string ClientSecret { get; set; } = string.Empty;
    public string SiteId { get; set; } = string.Empty;
    public string DriveId { get; set; } = string.Empty;
    public string RootFolder { get; set; } = "WorkflowManagement";
}
