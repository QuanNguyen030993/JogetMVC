namespace ERPCore.Storage;

public interface ISharePointDocumentStorage
{
    bool IsEnabled { get; }

    Task<string> UploadAsync(
        Stream content,
        string fileName,
        string? folder,
        string? contentType,
        CancellationToken cancellationToken);
}
