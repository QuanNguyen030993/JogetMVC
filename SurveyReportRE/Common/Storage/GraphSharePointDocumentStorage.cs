using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using ERPCore.Common;
using ERPCore.Models.Migration.Business.Data;
using Microsoft.Extensions.Options;
using Microsoft.Office.Server.Search.Administration;
using Microsoft.SharePoint.Client;

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

        var safeFileName = Util.SanitizePathSegment(fileName);
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
        request.Headers.Add(
"Prefer",
"HonorNonIndexedQueriesWarningMayFailRandomly");
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
            .Select(Util.SanitizePathSegment)
            .Where(value => value.Length > 0)
            .ToArray();
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


    public async Task<Stream> DownloadAsync(
    string fileName,
    string? folder,
    string? mimeFileType,
    CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(fileName))
            throw new ArgumentException(
                "File name is required.",
                nameof(fileName)
            );
        var options = GetValidatedOptions();
        var accessToken = await GetAccessTokenAsync(
            options,
            cancellationToken
        );
        var driveId = await ResolveDriveIdAsync(
            options,
            accessToken,
            cancellationToken
        );
        /*
         * UploadAsync hiện tại lưu file theo:
         *
         * RootFolder + folder + fileName
         *
         * Vì vậy download cũng phải build path giống hệt.
         */
        var folderSegments = CombineFolderSegments(
            options.RootFolder,
            folder
        );
        var safeFileName = Util.SanitizePathSegment(
            fileName
        );
        var pathSegments = folderSegments
            .Concat(new[] { safeFileName })
            .ToArray();
        /*
         * Graph path:
         *
         * /drives/{driveId}/root:/Folder/SubFolder/File.docx:/content
         */
        var itemPath = string.Join(
            "/",
            pathSegments.Select(Uri.EscapeDataString)
        );
        var requestUrl =
            $"{GraphBaseUrl}/drives/{Uri.EscapeDataString(driveId)}" +
            $"/root:/{itemPath}:/content";
        using var request = new HttpRequestMessage(
            HttpMethod.Get,
            requestUrl
        );

        request.Headers.Authorization =
            new AuthenticationHeaderValue(
                "Bearer",
                accessToken
            );
        
        request.Content.Headers.ContentType = new MediaTypeHeaderValue (Util.GetMimeType(fileName));

        using var response = await CreateClient().SendAsync(
            request,
            HttpCompletionOption.ResponseHeadersRead,
            cancellationToken);
        var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);


        if (!response.IsSuccessStatusCode)
        {
          
            throw CreateGraphException(
                $"download file '{safeFileName}'",
                response.StatusCode,
                responseBody
            );
        }

       


        /*
         * Không return response.Content.ReadAsStreamAsync() trực tiếp,
         * vì response đang được dispose bởi using.
         *
         * Copy sang MemoryStream để stream trả về sống độc lập.
         */
        var output = new MemoryStream();
        await response.Content.CopyToAsync(
            output,
            cancellationToken
        );
        output.Position = 0;
        _logger.LogInformation(
            "Downloaded document {FileName} from SharePoint drive {DriveId}.",
            safeFileName,
            driveId
        );
        return output;
    }

    public async Task<Stream> DownloadFromDocumentUrlAsync(
    string documentUrl,
    CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(documentUrl))
        {
            throw new ArgumentException(
                "SharePoint document URL is required.",
                nameof(documentUrl)
            );
        }
        if (!Uri.TryCreate(
            documentUrl,
            UriKind.Absolute,
            out var uri))
        {
            throw new ArgumentException(
                $"Invalid SharePoint URL: {documentUrl}",
                nameof(documentUrl)
            );
        }
        // =====================================================
        // 1. Parse sourcedoc từ Doc.aspx URL
        // =====================================================
        var query = Util.ParseQueryString(uri.Query);
        query.TryGetValue(
            "sourcedoc",
            out var sourceDoc
        );
        query.TryGetValue(
            "file",
            out var fileName
        );
        var sourceDocGuid =
            Util.NormalizeGuid(sourceDoc);
        if (string.IsNullOrWhiteSpace(sourceDocGuid))
        {
            throw new InvalidOperationException(
                "SharePoint URL does not contain valid 'sourcedoc'."
            );
        }

        // =====================================================
        // 2. Authentication
        // =====================================================
        var options =
            GetValidatedOptions();
        var accessToken =
            await GetAccessTokenAsync(
                options,
                cancellationToken
            );
        var driveId =
            await ResolveDriveIdAsync(
                options,
                accessToken,
                cancellationToken
            );

        // =====================================================
        // 3. Resolve LIST ID của document library
        //
        // Nếu options có ListId thì dùng trực tiếp.
        //
        // Nếu chưa có ListId, drive có thể lấy list relationship.
        // =====================================================
        string listId;
        if (!string.IsNullOrWhiteSpace(options.ListId))
        {
            listId = options.ListId.Trim();
        }
        else
        {
            var listRequestUrl =
                $"{GraphBaseUrl}/drives/{Uri.EscapeDataString(driveId)}/list" +
                "?$select=id";
            using var listResponse =
                await SendGraphAsync(
                    HttpMethod.Get,
                    listRequestUrl,
                    accessToken,
                    null,
                    cancellationToken
                );
            var listBody =
                await listResponse.Content.ReadAsStringAsync(
                    cancellationToken
                );
            if (!listResponse.IsSuccessStatusCode)
            {
                throw CreateGraphException(
                    "resolve SharePoint document library list",
                    listResponse.StatusCode,
                    listBody
                );
            }
            using var listJson =
                JsonDocument.Parse(listBody);
            listId =
                GetRequiredString(
                    listJson.RootElement,
                    "id"
                );
        }

        // =====================================================
        // 4. Tìm ListItem theo UniqueId = sourcedoc
        //
        // sourcedoc:
        // {B6FA395E-0B85-4CF0-A028-584643DF1113}
        //
        // SharePoint field:
        // UniqueId
        // =====================================================
        var filterGuid =
            sourceDocGuid.Replace("'", "''");
        var listItemRequestUrl =
            $"{GraphBaseUrl}/sites/{Uri.EscapeDataString(options.SiteId.Trim())}" +
            $"/lists/{Uri.EscapeDataString(listId)}/items" +
            "?$expand=fields" +
            $"&$filter=fields/FileLeafRef eq '{fileName}'";
        using var listItemResponse =
            await SendGraphAsync(
                HttpMethod.Get,
                listItemRequestUrl,
                accessToken,
                null,
                cancellationToken
            );
        var listItemBody =
            await listItemResponse.Content.ReadAsStringAsync(
                cancellationToken
            );
        if (!listItemResponse.IsSuccessStatusCode)
        {
            throw CreateGraphException(
                $"find SharePoint list item '{sourceDocGuid}'",
                listItemResponse.StatusCode,
                listItemBody
            );
        }
        using var listItemJson =
            JsonDocument.Parse(
                listItemBody
            );
        if (!listItemJson.RootElement.TryGetProperty(
            "value",
            out var listItems)
            ||
            listItems.ValueKind != JsonValueKind.Array)
        {
            throw new FileNotFoundException(
                $"Cannot find SharePoint ListItem sourcedoc={sourceDocGuid}"
            );
        }
        var listItem =
            listItems
                .EnumerateArray()
                .FirstOrDefault();
        if (listItem.ValueKind ==
            JsonValueKind.Undefined)
        {
            throw new FileNotFoundException(
                $"Cannot find SharePoint ListItem sourcedoc={sourceDocGuid}"
            );
        }
        var listItemId =
            GetRequiredString(
                listItem,
                "id"
            );

        // =====================================================
        // 5. LIST ITEM -> DRIVE ITEM
        //
        // GET
        // /sites/{siteId}/lists/{listId}/items/{listItemId}/driveItem
        // =====================================================
        var driveItemRequestUrl =
            $"{GraphBaseUrl}/sites/{Uri.EscapeDataString(options.SiteId.Trim())}" +
            $"/lists/{Uri.EscapeDataString(listId)}" +
            $"/items/{Uri.EscapeDataString(listItemId)}" +
            "/driveItem" +
            "?$select=id,name,file,parentReference";
        using var driveItemResponse =
            await SendGraphAsync(
                HttpMethod.Get,
                driveItemRequestUrl,
                accessToken,
                null,
                cancellationToken
            );
        var driveItemBody =
            await driveItemResponse.Content.ReadAsStringAsync(
                cancellationToken
            );
        if (!driveItemResponse.IsSuccessStatusCode)
        {
            throw CreateGraphException(
                $"resolve driveItem from listItem '{listItemId}'",
                driveItemResponse.StatusCode,
                driveItemBody
            );
        }
        using var driveItemJson =
            JsonDocument.Parse(
                driveItemBody
            );
        var driveItemId =
            GetRequiredString(
                driveItemJson.RootElement,
                "id"
            );

        // =====================================================
        // 6. DRIVE ITEM -> CONTENT
        // =====================================================
        var downloadUrl =
            $"{GraphBaseUrl}/drives/{Uri.EscapeDataString(driveId)}" +
            $"/items/{Uri.EscapeDataString(driveItemId)}" +
            "/content";
        using var request =
            new HttpRequestMessage(
                HttpMethod.Get,
                downloadUrl
            );
        request.Headers.Authorization =
            new AuthenticationHeaderValue(
                "Bearer",
                accessToken
            );
        using var response =
            await CreateClient().SendAsync(
                request,
                HttpCompletionOption.ResponseHeadersRead,
                cancellationToken
            );
        if (!response.IsSuccessStatusCode)
        {
            var responseBody =
                await response.Content.ReadAsStringAsync(
                    cancellationToken
                );
            throw CreateGraphException(
                $"download SharePoint file '{fileName ?? driveItemId}'",
                response.StatusCode,
                responseBody
            );
        }

        // =====================================================
        // 7. COPY -> MEMORY STREAM
        // =====================================================
        var result =
            new MemoryStream();
        await response.Content.CopyToAsync(
            result,
            cancellationToken
        );
        result.Position = 0;
        return result;
    }
   // private async Task<string?> FindDriveItemIdAsync(
   //string driveId,
   //string folder,
   //string fileName,
   //string? sourceDocGuid,
   //string accessToken,
   //CancellationToken cancellationToken)
   // {
   //     /*
   //      * 1. Resolve folder ID.
   //      *
   //      * UploadAsync của bạn đang dùng:
   //      *
   //      * RootFolder + folder
   //      *
   //      * nên download cũng resolve đúng cấu trúc đó.
   //      */
   //     var folderSegments = CombineFolderSegments(
   //         _optionsMonitor.CurrentValue.RootFolder,
   //         folder
   //     );
   //     var parentId = await ResolveFolderPathAsync(
   //         driveId,
   //         folderSegments,
   //         accessToken,
   //         cancellationToken
   //     );
   //     /*
   //      * 2. List trực tiếp children trong folder.
   //      *
   //      * GET:
   //      * /drives/{driveId}/items/{folderId}/children
   //      */
   //     string? nextUrl =
   //         $"{GraphBaseUrl}/drives/{Uri.EscapeDataString(driveId)}" +
   //         $"/items/{Uri.EscapeDataString(parentId)}/children" +
   //         "?$select=id,name,file,folder,sharepointIds";
   //     while (!string.IsNullOrWhiteSpace(nextUrl))
   //     {
   //         using var response =
   //             await SendGraphAsync(
   //                 HttpMethod.Get,
   //                 nextUrl,
   //                 accessToken,
   //                 null,
   //                 cancellationToken
   //             );
   //         var responseBody =
   //             await response.Content.ReadAsStringAsync(
   //                 cancellationToken
   //             );
   //         if (!response.IsSuccessStatusCode)
   //         {
   //             throw CreateGraphException(
   //                 $"list files in SharePoint folder '{folder}'",
   //                 response.StatusCode,
   //                 responseBody
   //             );
   //         }
   //         using var json =
   //             JsonDocument.Parse(responseBody);
   //         if (json.RootElement.TryGetProperty(
   //             "value",
   //             out var values)
   //  &&
   //             values.ValueKind == JsonValueKind.Array)
   //         {
   //             foreach (var item in values.EnumerateArray())
   //             {
   //                 /*
   //                  * Folder thì bỏ qua.
   //                  */
   //                 if (item.TryGetProperty("folder", out _))
   //                     continue;
   //                 var itemName =
   //                     item.TryGetProperty(
   //                         "name",
   //                         out var nameElement)
   //                         ? nameElement.GetString()
   //                         : null;
   //                 if (!string.Equals(
   //                     itemName,
   //                     fileName,
   //                     StringComparison.OrdinalIgnoreCase))
   //                 {
   //                     continue;
   //                 }
   //                 /*
   //                  * Nếu có sourcedoc thì kiểm tra thêm GUID.
   //                  */
   //                 if (!string.IsNullOrWhiteSpace(sourceDocGuid)
   //  &&
   //                     item.TryGetProperty(
   //                         "sharepointIds",
   //                         out var sharePointIds)
   //  &&
   //                     sharePointIds.ValueKind
   //                         == JsonValueKind.Object
   //  &&
   //                     sharePointIds.TryGetProperty(
   //                         "listItemUniqueId",
   //                         out var uniqueIdElement))
   //                 {
   //                     var graphGuid =
   //                         Util.NormalizeGuid(
   //                             uniqueIdElement.GetString()
   //                         );
   //                     if (!string.Equals(
   //                         graphGuid,
   //                         sourceDocGuid,
   //                         StringComparison.OrdinalIgnoreCase))
   //                     {
   //                         continue;
   //                     }
   //                 }
   //                 return GetRequiredString(
   //                     item,
   //                     "id"
   //                 );
   //             }
   //         }
   //         /*
   //          * Graph paging.
   //          */
   //         nextUrl =
   //             json.RootElement.TryGetProperty(
   //                 "@odata.nextLink",
   //                 out var nextLink)
   //                 ? nextLink.GetString()
   //                 : null;
   //     }
   //     return null;
   // }

    private async Task<string> ResolveFolderPathAsync(

    string driveId,

    IReadOnlyList<string> folderSegments,

    string accessToken,

    CancellationToken cancellationToken)

    {

        /*

         * Bắt đầu từ root

         */

        var rootUrl =

            $"{GraphBaseUrl}/drives/{Uri.EscapeDataString(driveId)}" +

            "/root?$select=id";

        using var rootResponse =

            await SendGraphAsync(

                HttpMethod.Get,

                rootUrl,

                accessToken,

                null,

                cancellationToken

            );

        var rootBody =

            await rootResponse.Content.ReadAsStringAsync(

                cancellationToken

            );

        if (!rootResponse.IsSuccessStatusCode)

        {

            throw CreateGraphException(

                "resolve SharePoint drive root",

                rootResponse.StatusCode,

                rootBody

            );

        }

        using var rootJson =

            JsonDocument.Parse(rootBody);

        var parentId =

            GetRequiredString(

                rootJson.RootElement,

                "id"

            );

        /*

         * Đi lần lượt từng folder.

         */

        foreach (var segment in folderSegments)

        {

            var requestUrl =

                $"{GraphBaseUrl}/drives/{Uri.EscapeDataString(driveId)}" +

                $"/items/{Uri.EscapeDataString(parentId)}:/" +

                $"{Uri.EscapeDataString(segment)}" +

                "?$select=id,name,folder";

            using var response =

                await SendGraphAsync(

                    HttpMethod.Get,

                    requestUrl,

                    accessToken,

                    null,

                    cancellationToken

                );

            var responseBody =

                await response.Content.ReadAsStringAsync(

                    cancellationToken

                );

            if (response.StatusCode ==

                HttpStatusCode.NotFound)

            {

                throw new DirectoryNotFoundException(

                    $"SharePoint folder '{segment}' not found."

                );

            }

            if (!response.IsSuccessStatusCode)

            {

                throw CreateGraphException(

                    $"resolve SharePoint folder '{segment}'",

                    response.StatusCode,

                    responseBody

                );

            }

            using var json =

                JsonDocument.Parse(responseBody);

            if (!json.RootElement.TryGetProperty(

                "folder",

                out _))

            {

                throw new InvalidOperationException(

                    $"SharePoint item '{segment}' is not a folder."

                );

            }

            parentId =

                GetRequiredString(

                    json.RootElement,

                    "id"

                );

        }

        return parentId;

    }

}
