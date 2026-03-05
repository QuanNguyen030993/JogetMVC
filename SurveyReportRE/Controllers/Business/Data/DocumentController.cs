using Microsoft.AspNetCore.Mvc;
using ERPCore.Controllers.Base;
using ERPCore.Models.Migration.Business.Data;
using ERPCore.Common;
using Serilog;
using Microsoft.Data.SqlClient;
using System.Data;

[ApiController]
[Route("api/[controller]/[action]")]
public class DocumentController : BaseControllerApi<Document>
{
    private readonly IBaseRepository<Document> _BaseRepository;
    private readonly IConfiguration configuration;
    private readonly IConfigurationSection path;
    private static string Query;

    public DocumentController(IBaseRepository<Document> BaseRepository, IConfiguration config, IHttpContextAccessor httpContextAccessor) : base(BaseRepository, httpContextAccessor)
    {
        configuration = config;
        _BaseRepository = BaseRepository;
        path = _BaseRepository._baseConfiguration.GetSection("BlobStorage:Path");
    }



    public async Task<IActionResult> StreamDocument(long id)
    {
        string typeError = "InternalError";
        try
        {
            Document Document = await _BaseRepository.GetObjectByIdAsync(id);
            string fullPath = System.IO.Path.Combine(path.Value, Document.SubDirectory);
            var mimeTypes = Util.GetMimeType(Document.FileName);
            if (System.IO.File.Exists(fullPath))
            {
                var fileStream = System.IO.File.OpenRead(fullPath);
                return File(fileStream, mimeTypes, Path.GetFileName(fullPath));
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



    ////api/Document/MakeThumbFiles
    //[HttpGet]
    //public async Task<IActionResult> MakeThumbFiles()
    //{
    //    List<Document> Documents = new List<Document>();
    //    Documents = await _BaseRepository.GetAll();

    //    Documents.ForEach(async f =>
    //    {
    //        if (string.IsNullOrEmpty(f.SubThumbnailDirectory) || string.IsNullOrEmpty(f.SubOverviewDirectory) || string.IsNullOrEmpty(f.SubSitePictureDirectory))
    //        {
    //            Dictionary<string, string> refFiles = new Dictionary<string, string>();
    //            if (!string.IsNullOrEmpty(f.SubDirectory))
    //            {
    //                string outputFiles = System.IO.Path.Combine(path.Value, f.SubDirectory);
    //                string folder = f.SubDirectory.Split("\\").FirstOrDefault();
    //                string saveThumbPart = System.IO.Path.Combine(path.Value, folder);
    //                string mimeType = Util.GetMimeType(outputFiles);

    //                if (mimeType.Contains("image/"))
    //                {
    //                    Util.createThumb(outputFiles, saveThumbPart, folder, ref refFiles);
    //                    f.SubThumbnailDirectory = refFiles.FirstOrDefault(f => f.Key == "thumbnail").Value;
    //                    f.SubOverviewDirectory = refFiles.FirstOrDefault(f => f.Key == "overview").Value;
    //                    f.SubSitePictureDirectory = refFiles.FirstOrDefault(f => f.Key == "sitepicture").Value;
    //                    f = await _BaseRepository.UpdateData(f, JsonConvert.SerializeObject(f), f.Id, "Id");
    //                }
    //                else
    //                {

    //                }
    //            }

    //        }

    //    });

    //    return Ok();
    //}

    [HttpGet]
    public async Task<IActionResult> DeleteDocumentData(long id)
    {
        Document Document = new Document();
        Document = await _BaseRepository.GetSingleObject(s => s.Id == id);
        if (Document != null)
        {
            if (Document.SubDirectory != null)
                if (System.IO.File.Exists(Path.Combine(path.Value, Document.SubDirectory)))
                    System.IO.File.Delete(Path.Combine(path.Value, Document.SubDirectory));

            Document = await _BaseRepository.DeleteData(Document, (int)Document.Id, "Id", true);
        }
        return Ok(Document);
    }


    [HttpGet]
    public async Task<IActionResult> GetByKey(Guid recordGuid, string? folder = null)
    {
        // folder: "MKT" => filter SubDirectory start with "MKT\"
        folder = string.IsNullOrWhiteSpace(folder) ? null : folder.Trim();

        // Lấy toàn bộ rồi filter (vì repo bạn đang có GetAll)
        // Nếu repo có method GetListObject(predicate) thì thay bằng query trực tiếp sẽ nhanh hơn
        var all = await _BaseRepository.GetAll();

        var docs = all
            .Where(d => (d.Deleted == null || d.Deleted == false)
                        && d.RecordGuid.HasValue
                        && d.RecordGuid.Value == recordGuid)
            .ToList();

        if (!string.IsNullOrEmpty(folder))
        {
            var prefix = (folder.EndsWith("\\") ? folder : folder + "\\");
            docs = docs.Where(d =>
                    !string.IsNullOrEmpty(d.SubDirectory) &&
                    d.SubDirectory.Replace("/", "\\")
                        .StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
                .ToList();
        }

        var result = docs
            .OrderByDescending(d => d.CreatedDate)
            .Select(d =>
            {
                var fileName = !string.IsNullOrEmpty(d.FileName)
                    ? d.FileName
                    : Path.GetFileName(d.SubDirectory ?? "");

                var ext = Path.GetExtension(fileName ?? "")
                    .TrimStart('.')
                    .ToLowerInvariant();

                return new
                {
                    id = d.Id,
                    recordGuid = d.RecordGuid,
                    fileName = fileName,
                    fileType = d.FileType,
                    extension = ext,
                    size = d.Size,
                    subDirectory = d.SubDirectory,
                    downloadUrl = Url.Action(nameof(StreamDocument), new { id = d.Id })
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

