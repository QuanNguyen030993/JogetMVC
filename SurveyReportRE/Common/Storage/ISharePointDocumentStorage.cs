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
    Task<Stream> DownloadAsync(
        string fileName,
        string? folder,
        string? mimeFileType,
        CancellationToken cancellationToken
    );
    Task<Stream> DownloadFromDocumentUrlAsync(string documentUrl,
   CancellationToken cancellationToken = default);
}
