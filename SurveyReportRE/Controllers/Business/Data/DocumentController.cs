using Microsoft.AspNetCore.Mvc;
using ERPCore.Controllers.Base;
using ERPCore.Models.Migration.Business.Data;
using ERPCore.Common;
using Serilog;
using Microsoft.Data.SqlClient;
using System.Data;
using System.Net.Http.Headers;
using ERPCore.Models.Models.Parsing;
using Microsoft.AspNetCore.Authorization;
using System.Text;
using Microsoft.SharePoint.WebControls;

[ApiController]
[Route("api/[controller]/[action]")]
public class DocumentController : BaseControllerApi<Document>
{
    private readonly IBaseRepository<Document> _BaseRepository;
    private readonly IConfiguration configuration;
    private readonly IConfigurationSection path;
    private static string Query;
    public DocumentController(IBaseRepository<Document> BaseRepository
        , IConfiguration config
        , IHttpContextAccessor httpContextAccessor) : base(BaseRepository, httpContextAccessor)
    {
        configuration = config;
        _BaseRepository = BaseRepository;
        path = _BaseRepository._baseConfiguration.GetSection("BlobStorage:Path");
        //_httpClientFactory = httpClientFactory;
    }



    public async Task<IActionResult> StreamDocument(long id)
    {
        string typeError = "InternalError";
        try
        {
            Document Document = await _BaseRepository.GetObjectByIdAsync(id);
            string fullPath = System.IO.Path.Combine(path.Value, Document.SubDirectory, Document.Guid.ToString()+ Document.FileType);
            var mimeTypes = Util.GetMimeType(Document.FileName);
            if (System.IO.File.Exists(fullPath))
            {
                var fileStream = System.IO.File.OpenRead(fullPath);
                return File(fileStream, mimeTypes, Path.GetFileName(Document.FileName));
            }
            else
            {
                typeError = "FileNotFound";
                throw new Exception($"{fullPath} not found.");
            }
        }
        catch (Exception ex)
        {
            Log.Error(ex, ex.Message);
            Response.Headers.Add("X-Error-Message", ex.Message);
            Response.Headers.Add("X-Error-Type", typeError);
            return StatusCode(500); // Internal Server Error
        }
    }


    [HttpPost]
    [AllowAnonymous]
    //public async Task<IActionResult> TestCallBackUrl([FromBody] ConvertResult convertResult)
    public async Task<IActionResult> CallbackFileHandle([FromBody] ConvertResult convertResult)
    {
        try
        {
            if (!Directory.Exists(path.Value + "\\CallBack"))
            {
                Directory.CreateDirectory(path.Value + "\\CallBack");
            }
            System.IO.File.WriteAllBytes(path.Value + "\\CallBack\\" + convertResult.FileName, Convert.FromBase64String(convertResult.FileBase64));
            return Ok();

        }
        catch (Exception ex)
        {
            Log.Error(ex, ex.Message);
            return StatusCode(500, ex.Message);
        }
    }


    [HttpGet("{id}")]
    public async Task<IActionResult> LibreConvert(long? id)
    {
        string URL = _BaseRepository._baseConfiguration.GetSection("UrlConfig:LibreOfficeHost").Value;

        //Change lại thành hàm của chính link host cho source này từ 
        //TestCallBackUrl  -> CallbackFileHandle
        string callURL = _BaseRepository._baseConfiguration.GetSection("UrlConfig:CallbackHost").Value;
        string endpoint = $"{URL}/api/convert";
        string keyApi = _BaseRepository._baseConfiguration.GetSection("LibreServer:Key").Value;
        try
        {
            if (string.IsNullOrWhiteSpace(endpoint))
                return BadRequest("Config UrlConfig:LibreOfficeHost is empty.");

            // Ví dụ: lấy thông tin file theo id từ DB
            // Bạn thay Attachment bằng model thực tế của bạn
            var attachment = await _BaseRepository.GetObjectByIdAsync(id ?? 0);
            if (attachment == null)
                return NotFound($"Attachment id={id} not found.");

            // Ví dụ: đường dẫn vật lý file
            // Bạn sửa lại theo cấu trúc thật của hệ thống
            string filePath = Path.Combine(
                path.Value,
                attachment.SubDirectory ?? ""
            );

            if (!System.IO.File.Exists(filePath))
                return NotFound($"File not found: {filePath}");

            await using var fileStream = System.IO.File.OpenRead(filePath);

            using var multipart = new MultipartFormDataContent();

            var fileContent = new StreamContent(fileStream);
            fileContent.Headers.ContentType = new MediaTypeHeaderValue(Util.GetMimeType(filePath));

            // "file" phải đúng tên field mà API bên convert yêu cầu
            multipart.Add(fileContent, "file", Path.GetFileName(filePath));

            // Các field form-data khác
            multipart.Add(new StringContent("pdf"), "outputFormat");
            multipart.Add(new StringContent(callURL), "callbackUrl");
            multipart.Add(new StringContent("{}"), "metadata");

            var client =  new HttpClient();
            client.Timeout = TimeSpan.FromMinutes(10);
            client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("*/*"));
            client.DefaultRequestHeaders.Add("X-API-KEY", keyApi);


            var response = await client.PostAsync(endpoint, multipart);
            var responseBytes = await response.Content.ReadAsByteArrayAsync();
            var responseText = await response.Content.ReadAsStringAsync();
            
            if (!response.IsSuccessStatusCode)
            {
                return StatusCode((int)response.StatusCode, new
                {
                    message = "Convert server returned error.",
                    detail = responseText
                });
            }
            
            // Nếu server convert trả thẳng file đã convert về
            var outputFileName = Path.GetFileNameWithoutExtension(filePath) + ".pdf";

            string getStreamHost = _BaseRepository._baseConfiguration.GetSection("UrlConfig:GetStreamHost").Value + $"?fileName={outputFileName}";
            var responseGet = await client.GetAsync(getStreamHost);
            var responseBytesGet = await responseGet.Content.ReadAsByteArrayAsync();
            var responseTextGet = await responseGet.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                return StatusCode((int)response.StatusCode, new
                {
                    message = "Convert server returned error.",
                    detail = responseText
                });
            }


            return File(responseBytesGet, "application/pdf", outputFileName);

            // Nếu bạn chỉ muốn lưu xuống disk rồi return ok thì dùng đoạn này thay thế:
            // var outputPath = Path.Combine(Path.GetDirectoryName(filePath)!, outputFileName);
            // await System.IO.File.WriteAllBytesAsync(outputPath, responseBytes);
            // return Ok(new { message = "Convert success", outputPath });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                message = "Convert failed",

                detail = ex.Message
            });
        }
    }


        [HttpGet]
    public async Task<IActionResult> DeleteDocumentData(long id)
    {
        Document Document = new Document();
        Document = await _BaseRepository.GetSingleObject(s => s.Id == id);
        if (Document != null)
        {
            if (Document.SubDirectory != null)
                if (System.IO.File.Exists(Path.Combine(path.Value, Document.SubDirectory, Document.Guid.ToString()+ Document.FileType)))
                    System.IO.File.Delete(Path.Combine(path.Value, Document.SubDirectory, Document.Guid.ToString()+ Document.FileType));

            Document = await _BaseRepository.DeleteData(Document, (int)Document.Id, "Id", true);
        }
        return Ok(Document);
    }
    [HttpGet("{recordGuid}/{folder}")]
    public async Task<IActionResult> AttachmentSummary(Guid recordGuid, string folder)
    {
        var count = await _BaseRepository.GetListObject(x =>
            x.RecordGuid == recordGuid &&
            x.Attributes.Contains($"\"SectionName\":\"{folder}\""));

        return Ok(new
        {
            hasAttachment = count.Count > 0,
            attachmentCount = count
        });
    }

    [HttpGet]
    public async Task<IActionResult> GetByKey(Guid recordGuid, string? folder = null)
    {
        // folder: "FO" => filter SubDirectory start with "MKT\"
        folder = string.IsNullOrWhiteSpace(folder) ? null : folder.Trim();

        // Lấy toàn bộ rồi filter (vì repo bạn đang có GetAll)
        // Nếu repo có method GetListObject(predicate) thì thay bằng query trực tiếp sẽ nhanh hơn
        var all = await _BaseRepository.GetListObject(l => l.RecordGuid == recordGuid && l.Attributes.Contains($"\"SectionName\":\"{folder}\""));

        if (string.IsNullOrWhiteSpace(folder))
            all = await _BaseRepository.GetListObject(l => l.RecordGuid == recordGuid);
        var docs = all
            .Where(d => (d.Deleted == null || d.Deleted == false)
                        && d.RecordGuid.HasValue
                        && d.RecordGuid.Value == recordGuid)
            .ToList();

        //if (!string.IsNullOrEmpty(folder))
        //{
        //    var prefix = (folder.EndsWith("\\") ? folder : folder + "\\");
        //    docs = docs.Where(d =>
        //            !string.IsNullOrEmpty(d.SubDirectory) &&
        //            d.SubDirectory.Replace("/", "\\")
        //                .StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
        //        .ToList();
        //}

        var result = docs
            .OrderByDescending(d => d.CreatedDate)
            .Select(d =>
            {
                var fileName = !string.IsNullOrEmpty(d.FileName)
                    ? d.FileName
                    : Path.GetFileName(d.SubDirectory ?? "");

                var ext = d.FileType;
                if (!System.IO.File.Exists(Path.Combine(path.Value,d.SubDirectory,d.Guid.ToString()+d.FileType))) ext = "Not Found On Server";
                return new
                {
                    id = d.Id,
                    recordGuid = d.RecordGuid,
                    fileName = fileName,
                    fileType = d.FileType,
                    extension = ext.Replace(".",""),
                    size = d.Size,
                    subDirectory = d.SubDirectory,
                    downloadUrl = Url.Action(nameof(StreamDocument), new { id = d.Id }),
                    author = d.CreatedBy,
                    date = d.CreatedDate
                };
            })
            .ToList();

        return Ok(result);
    }

    //[HttpGet]
    //public JsonResult GetUploadedFiles()
    //{
    //    var path = _BaseRepository._baseConfiguration.GetSection("BlobStorage:Path");
    //    IBaseRepository<Document> _DocumentRepository = new BaseRepository<Document>(_BaseRepository._baseConfiguration);

    //    // Lấy danh sách file từ thư mục
    //    var files = Directory.GetFiles(uploadFolder)
    //        .Select(file => new
    //        {
    //            Name = Path.GetFileName(file),
    //            Url = Url.Content($"~/Uploads/{Path.GetFileName(file)}")
    //        })
    //        .ToList();

    //    return Json(files, JsonRequestBehavior.AllowGet);
    //}

    [HttpPost]
    public override async Task<object> ExecuteCustomQuery([FromBody] string query)
    {

        //query = "EXEC usp_fd_policy_issuance_request";
        List<Dictionary<string, object>> obj = new List<Dictionary<string, object>>();
        if (Query != query && !query.Contains("@"))
        {
            Query = query;
        }
        obj = await _BaseRepository.ExecuteCustomJogetQuery(Query);
        return obj;
    }


    public async Task BulkInsertSystemPropertiesAsync(List<SystemProperties> data)
    {
        var dt = new DataTable();

        // Khởi tạo cột (phải khớp DB)
        foreach (var prop in typeof(SystemProperties).GetProperties())
        {
            dt.Columns.Add(prop.Name, typeof(string));
        }

        // Gán dữ liệu
        foreach (var item in data)
        {
            var row = dt.NewRow();
            foreach (var prop in typeof(SystemProperties).GetProperties())
            {
                row[prop.Name] = prop.GetValue(item) ?? DBNull.Value;
            }
            dt.Rows.Add(row);
        }

        // Bulk insert
        using var connection = new SqlConnection(_BaseRepository._connectionString);
        await connection.OpenAsync();
        using var bulkCopy = new SqlBulkCopy(connection)
        {
            DestinationTableName = "dbo.SystemProperties", // Đảm bảo đúng tên bảng
            BulkCopyTimeout = 60
        };

        await bulkCopy.WriteToServerAsync(dt);
    }


    public static List<SystemProperties> ConvertToSystemPropertiesList(List<Dictionary<string, object>> rawData)
    {
        var result = new List<SystemProperties>();

        foreach (var dict in rawData)
        {
            var obj = new SystemProperties();
            foreach (var prop in typeof(SystemProperties).GetProperties())
            {
                var key = prop.Name;
                if (key == "Id") continue;
                if (key == "Guid") continue;
                if (key == "CreatedBy") continue;
                if (key == "CreatedDate") continue;
                if (key == "ModifiedBy") continue;
                if (key == "ModifiedDate") continue;
                if (key == "Deleted") continue;
                if (key == "DeletedBy") continue;
                if (key == "DeletedDate") continue;
                if (key == "RowOrder") continue;
                if (key == "CopyFromGuid") continue;
                if (key == "DraftGuid") continue;

                if (dict.TryGetValue(key, out var value) && value != null)
                {
                    prop.SetValue(obj, value.ToString());
                }
            }
            result.Add(obj);
        }

        return result;
    }
}

