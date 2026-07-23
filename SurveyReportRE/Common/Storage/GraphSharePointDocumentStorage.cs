using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Options;

namespace ERPCore.Storage;

public sealed class GraphSharePointDocumentStorage : ISharePointDocumentStorage
{
    private const string GraphBaseUrl = "https://graph.microsoft.com/v1.0";
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IOptionsMonitor<SharePointUploadOptions> _optionsMonitor;
    private readonly ILogger<GraphSharePointDocumentStorage> _logger;
    private readonly SemaphoreSlim _tokenLock = new(1, 1);
    private string? _accessToken;
    private DateTimeOffset _accessTokenExpiresAt;

    public GraphSharePointDocumentStorage(
        IHttpClientFactory httpClientFactory,
        IOptionsMonitor<SharePointUploadOptions> optionsMonitor,
        ILogger<GraphSharePointDocumentStorage> logger)
    {
        _httpClientFactory = httpClientFactory;
        _optionsMonitor = optionsMonitor;
        _logger = logger;
    }

    public bool IsEnabled => _optionsMonitor.CurrentValue.Enabled;

    public async Task<string> UploadAsync(
        Stream content,
        string fileName,
        string? folder,
        string? contentType,
        CancellationToken cancellationToken)
    {
        var options = GetValidatedOptions();
        var accessToken = await GetAccessTokenAsync(options, cancellationToken);
        var driveId = await ResolveDriveIdAsync(options, accessToken, cancellationToken);
        var parentId = await EnsureFolderPathAsync(
            driveId,
            CombineFolderSegments(options.RootFolder, folder),
            accessToken,
            cancellationToken);

        var safeFileName = SanitizePathSegment(fileName);
        var uploadUrl =
            $"{GraphBaseUrl}/drives/{Uri.EscapeDataString(driveId)}/items/" +
            $"{Uri.EscapeDataString(parentId)}:/{Uri.EscapeDataString(safeFileName)}:/content";

        using var request = new HttpRequestMessage(HttpMethod.Put, uploadUrl);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        request.Content = new StreamContent(content);
        request.Content.Headers.ContentType =
            MediaTypeHeaderValue.TryParse(contentType, out var parsedContentType)
                ? parsedContentType
                : new MediaTypeHeaderValue("application/octet-stream");

        using var response = await CreateClient().SendAsync(
            request,
            HttpCompletionOption.ResponseHeadersRead,
            cancellationToken);
        var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            throw CreateGraphException("upload file", response.StatusCode, responseBody);
        }

        using var json = JsonDocument.Parse(responseBody);
        var webUrl = GetRequiredString(json.RootElement, "webUrl");
        _logger.LogInformation(
            "Uploaded document {FileName} to SharePoint drive {DriveId}.",
            safeFileName,
            driveId);
        return webUrl;
    }

    private SharePointUploadOptions GetValidatedOptions()
    {
        var options = _optionsMonitor.CurrentValue;
        if (!options.Enabled)
        {
            throw new InvalidOperationException("SharePoint upload is disabled.");
        }

        var missing = new List<string>();
        if (string.IsNullOrWhiteSpace(options.TenantId)) missing.Add(nameof(options.TenantId));
        if (string.IsNullOrWhiteSpace(options.ClientId)) missing.Add(nameof(options.ClientId));
        if (string.IsNullOrWhiteSpace(options.ClientSecret)) missing.Add(nameof(options.ClientSecret));
        if (string.IsNullOrWhiteSpace(options.DriveId)
            && string.IsNullOrWhiteSpace(options.SiteId))
        {
            missing.Add($"{nameof(options.DriveId)} or {nameof(options.SiteId)}");
        }

        if (missing.Count > 0)
        {
            throw new InvalidOperationException(
                $"{SharePointUploadOptions.SectionName} is enabled but missing: " +
                string.Join(", ", missing));
        }

        return options;
    }

    private async Task<string> GetAccessTokenAsync(
        SharePointUploadOptions options,
        CancellationToken cancellationToken)
    {
        if (!string.IsNullOrWhiteSpace(_accessToken)
            && _accessTokenExpiresAt > DateTimeOffset.UtcNow.AddMinutes(2))
        {
            return _accessToken;
        }

        await _tokenLock.WaitAsync(cancellationToken);
        try
        {
            if (!string.IsNullOrWhiteSpace(_accessToken)
                && _accessTokenExpiresAt > DateTimeOffset.UtcNow.AddMinutes(2))
            {
                return _accessToken;
            }

            var tokenUrl =
                $"https://login.microsoftonline.com/{Uri.EscapeDataString(options.TenantId)}" +
                "/oauth2/v2.0/token";
            using var request = new HttpRequestMessage(HttpMethod.Post, tokenUrl)
            {
                Content = new FormUrlEncodedContent(new Dictionary<string, string>
                {
                    ["client_id"] = options.ClientId,
                    ["client_secret"] = options.ClientSecret,
                    ["scope"] = "https://graph.microsoft.com/.default",
                    ["grant_type"] = "client_credentials"
                })
            };

            using var response = await CreateClient().SendAsync(request, cancellationToken);
            var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                throw CreateGraphException(
                    "acquire Microsoft Graph token",
                    response.StatusCode,
                    responseBody);
            }

            using var json = JsonDocument.Parse(responseBody);
            _accessToken = GetRequiredString(json.RootElement, "access_token");
            var expiresIn = json.RootElement.TryGetProperty("expires_in", out var expiresElement)
                && expiresElement.TryGetInt32(out var seconds)
                    ? seconds
                    : 3600;
            _accessTokenExpiresAt = DateTimeOffset.UtcNow.AddSeconds(expiresIn);
            return _accessToken;
        }
        finally
        {
            _tokenLock.Release();
        }
    }

    private async Task<string> ResolveDriveIdAsync(
        SharePointUploadOptions options,
        string accessToken,
        CancellationToken cancellationToken)
    {
        if (!string.IsNullOrWhiteSpace(options.DriveId))
        {
            return options.DriveId.Trim();
        }

        var requestUrl =
            $"{GraphBaseUrl}/sites/{Uri.EscapeDataString(options.SiteId.Trim())}/drive?$select=id";
        using var response = await SendGraphAsync(
            HttpMethod.Get,
            requestUrl,
            accessToken,
            null,
            cancellationToken);
        var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            throw CreateGraphException("resolve SharePoint drive", response.StatusCode, responseBody);
        }

        using var json = JsonDocument.Parse(responseBody);
        return GetRequiredString(json.RootElement, "id");
    }

    private async Task<string> EnsureFolderPathAsync(
        string driveId,
        IReadOnlyList<string> folderSegments,
        string accessToken,
        CancellationToken cancellationToken)
    {
        var rootUrl =
            $"{GraphBaseUrl}/drives/{Uri.EscapeDataString(driveId)}/root?$select=id";
        using var rootResponse = await SendGraphAsync(
            HttpMethod.Get,
            rootUrl,
            accessToken,
            null,
            cancellationToken);
        var rootBody = await rootResponse.Content.ReadAsStringAsync(cancellationToken);
        if (!rootResponse.IsSuccessStatusCode)
        {
            throw CreateGraphException("resolve SharePoint drive root", rootResponse.StatusCode, rootBody);
        }

        using var rootJson = JsonDocument.Parse(rootBody);
        var parentId = GetRequiredString(rootJson.RootElement, "id");

        foreach (var segment in folderSegments)
        {
            var existingId = await TryGetChildIdAsync(
                driveId,
                parentId,
                segment,
                accessToken,
                cancellationToken);
            parentId = existingId ?? await CreateFolderAsync(
                driveId,
                parentId,
                segment,
                accessToken,
                cancellationToken);
        }

        return parentId;
    }

    private async Task<string?> TryGetChildIdAsync(
        string driveId,
        string parentId,
        string segment,
        string accessToken,
        CancellationToken cancellationToken)
    {
        var requestUrl =
            $"{GraphBaseUrl}/drives/{Uri.EscapeDataString(driveId)}/items/" +
            $"{Uri.EscapeDataString(parentId)}:/{Uri.EscapeDataString(segment)}?$select=id,folder";
        using var response = await SendGraphAsync(
            HttpMethod.Get,
            requestUrl,
            accessToken,
            null,
            cancellationToken);
        if (response.StatusCode == HttpStatusCode.NotFound)
        {
            return null;
        }

        var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            throw CreateGraphException("resolve SharePoint folder", response.StatusCode, responseBody);
        }

        using var json = JsonDocument.Parse(responseBody);
        if (!json.RootElement.TryGetProperty("folder", out _))
        {
            throw new InvalidOperationException(
                $"SharePoint path segment '{segment}' exists but is not a folder.");
        }
        return GetRequiredString(json.RootElement, "id");
    }

    private async Task<string> CreateFolderAsync(
        string driveId,
        string parentId,
        string segment,
        string accessToken,
        CancellationToken cancellationToken)
    {
        var requestUrl =
            $"{GraphBaseUrl}/drives/{Uri.EscapeDataString(driveId)}/items/" +
            $"{Uri.EscapeDataString(parentId)}/children";
        var body = JsonSerializer.Serialize(new Dictionary<string, object>
        {
            ["name"] = segment,
            ["folder"] = new { },
            ["@microsoft.graph.conflictBehavior"] = "fail"
        });

        using var response = await SendGraphAsync(
            HttpMethod.Post,
            requestUrl,
            accessToken,
            new StringContent(body, Encoding.UTF8, "application/json"),
            cancellationToken);
        var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);
        if (response.StatusCode == HttpStatusCode.Conflict)
        {
            return await TryGetChildIdAsync(
                       driveId,
                       parentId,
                       segment,
                       accessToken,
                       cancellationToken)
                   ?? throw new InvalidOperationException(
                       $"SharePoint folder '{segment}' was created concurrently but could not be resolved.");
        }
        if (!response.IsSuccessStatusCode)
        {
            throw CreateGraphException("create SharePoint folder", response.StatusCode, responseBody);
        }

        using var json = JsonDocument.Parse(responseBody);
        return GetRequiredString(json.RootElement, "id");
    }

    private async Task<HttpResponseMessage> SendGraphAsync(
        HttpMethod method,
        string requestUrl,
        string accessToken,
        HttpContent? content,
        CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(method, requestUrl);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        request.Content = content;
        return await CreateClient().SendAsync(
            request,
            HttpCompletionOption.ResponseHeadersRead,
            cancellationToken);
    }

    private HttpClient CreateClient() => _httpClientFactory.CreateClient("SharePointGraph");

    private static IReadOnlyList<string> CombineFolderSegments(
        string? rootFolder,
        string? requestFolder)
    {
        return new[] { rootFolder, requestFolder }
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .SelectMany(value => value!.Split(
                new[] { '\\', '/' },
                StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            .Where(value => value is not "." and not "..")
            .Select(SanitizePathSegment)
            .Where(value => value.Length > 0)
            .ToArray();
    }

    private static string SanitizePathSegment(string value)
    {
        var invalid = new HashSet<char>("\"*:<>?/\\|");
        var sanitized = new string(value
            .Trim()
            .Select(character => invalid.Contains(character) ? '_' : character)
            .ToArray())
            .TrimEnd('.');
        if (string.IsNullOrWhiteSpace(sanitized))
        {
            throw new InvalidOperationException("SharePoint folder or file name is empty after sanitizing.");
        }
        return sanitized.Length <= 180 ? sanitized : sanitized[..180];
    }

    private static string GetRequiredString(JsonElement element, string propertyName)
    {
        if (element.TryGetProperty(propertyName, out var property)
            && property.ValueKind == JsonValueKind.String
            && !string.IsNullOrWhiteSpace(property.GetString()))
        {
            return property.GetString()!;
        }
        throw new InvalidOperationException(
            $"Microsoft Graph response does not contain '{propertyName}'.");
    }

    private static Exception CreateGraphException(
        string operation,
        HttpStatusCode statusCode,
        string responseBody)
    {
        var safeBody = responseBody.Length <= 1500
            ? responseBody
            : responseBody[..1500];
        return new HttpRequestException(
            $"Failed to {operation}. Microsoft Graph returned " +
            $"{(int)statusCode} ({statusCode}): {safeBody}",
            null,
            statusCode);
    }
}
