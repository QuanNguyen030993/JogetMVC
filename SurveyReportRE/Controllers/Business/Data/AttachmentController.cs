using Microsoft.AspNetCore.Mvc;
using SurveyReportRE.Controllers.Base;
using SurveyReportRE.Models.Migration.Business.Data;
using SurveyReportRE.Models.Request;
using MimeMapping;
using Microsoft.AspNetCore.Authorization;
using DocumentFormat.OpenXml.Wordprocessing;
using SurveyReportRE.Common;
using Newtonsoft.Json;
using Serilog;
using Microsoft.Data.SqlClient;
using System.Data;

[ApiController]
[Route("api/[controller]/[action]")]
public class AttachmentController : BaseControllerApi<Attachment>
{
    private readonly IBaseRepository<Attachment> _BaseRepository;
    private readonly IConfiguration configuration;
    private readonly IConfigurationSection path;
    private static string Query;

    public AttachmentController(IBaseRepository<Attachment> BaseRepository, IConfiguration config, IHttpContextAccessor httpContextAccessor) : base(BaseRepository, httpContextAccessor)
    {
        configuration = config;
        _BaseRepository = BaseRepository;
        path = _BaseRepository._baseConfiguration.GetSection("BlobStorage:Path");
    }

   
   
    public async Task<IActionResult> StreamAttachment(long id)
    {
        string typeError = "InternalError";
        try
        {
            Attachment attachment = await _BaseRepository.GetObjectByIdAsync(id);
            string fullPath = System.IO.Path.Combine(path.Value, attachment.file_folder);
            var mimeTypes = Util.GetMimeType(attachment.file_name);
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

  

    ////api/Attachment/MakeThumbFiles
    //[HttpGet]
    //public async Task<IActionResult> MakeThumbFiles()
    //{
    //    List<Attachment> attachments = new List<Attachment>();
    //    attachments = await _BaseRepository.GetAll();

    //    attachments.ForEach(async f =>
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
    public async Task<IActionResult> DeleteAttachmentData(long id)
    {
        Attachment attachment = new Attachment();
        attachment = await _BaseRepository.GetSingleObject(s => s.Id == id);
        if (attachment != null)
        {
            if (attachment.file_folder != null)
                if (System.IO.File.Exists(Path.Combine(path.Value, attachment.file_folder)))
                    System.IO.File.Delete(Path.Combine(path.Value, attachment.file_folder));

            attachment = await _BaseRepository.DeleteData(attachment, (int)attachment.Id, "Id", true);
        }
        return Ok(attachment);
    }

    //[HttpGet]
    //public JsonResult GetUploadedFiles()
    //{
    //    var path = _BaseRepository._baseConfiguration.GetSection("BlobStorage:Path");
    //    IBaseRepository<Attachment> _attachmentRepository = new BaseRepository<Attachment>(_BaseRepository._baseConfiguration);

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

    [HttpGet]
    public async Task PullData()
    {
        //string query = "EXEC usp_rp_pending_request";
        //List<Dictionary<string, object>> obj = await _BaseRepository.ExecuteCustomJogetQuery(query);

        //var list = ConvertToSystemPropertiesList(obj);
        //await BulkInsertSystemPropertiesAsync(list);
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

