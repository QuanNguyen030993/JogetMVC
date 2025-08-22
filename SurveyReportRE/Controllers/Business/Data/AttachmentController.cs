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
[ApiController]
[Route("api/[controller]/[action]")]
public class AttachmentController : BaseControllerApi<Attachment>
{
    private readonly IBaseRepository<Attachment> _BaseRepository;
    private readonly IConfiguration configuration;
    private readonly IConfigurationSection path;

    public AttachmentController(IBaseRepository<Attachment> BaseRepository, IConfiguration config, IHttpContextAccessor httpContextAccessor) : base(BaseRepository, httpContextAccessor)
    {
        configuration = config;
        _BaseRepository = BaseRepository;
        path = _BaseRepository._baseConfiguration.GetSection("BlobStorage:Path");
    }

    public override async Task<ActionResult<Attachment>> GetSingle(int id)
    {
        var Base = await _BaseRepository.GetObjectByIdAsync(id);
        if (Base == null)
        {
            return Ok(new Attachment());
        }
        AttachmentForm attachmentForm = null;
        if (System.IO.File.Exists(Path.Combine(path.Value, Base.SubDirectory)))
        {
            attachmentForm = new AttachmentForm();
            attachmentForm.name = Base.FileName;
            string mimeType = MimeUtility.GetMimeMapping(Base.FileName);
            attachmentForm.type = mimeType;
            byte[] byteArray = System.IO.File.ReadAllBytes(Path.Combine(path.Value, Base.SubDirectory));
            //string s = Convert.ToBase64String(byteArray);
            attachmentForm.baseString = Convert.ToBase64String(byteArray);
            attachmentForm.fileData = Array.ConvertAll(byteArray, b => (int)b);
            attachmentForm.byteArray = byteArray;
            attachmentForm.size = attachmentForm.fileData.Length;
            attachmentForm.surveyId = Base.SurveyId;
            attachmentForm.attachmentId = Base.Id;
            attachmentForm.outlinePlaceholder = Base.OutlinePlaceholder;
            attachmentForm.outlineId = Base.OutlineId;
            //attachmentRequests.Add(attachmentForm);
            return Ok(attachmentForm);
        }
        else
            return Ok(attachmentForm);
    }
    [HttpGet("{id}")]
    public async Task<ActionResult<Attachment>> GetOverviewAttachment(int id)
    {
        var Base = await _BaseRepository.GetObjectByIdAsync(id);
        if (Base == null)
        {
            return Ok(new Attachment());
        }
        AttachmentForm attachmentForm = null;
        if (System.IO.File.Exists(Path.Combine(path.Value, Base.SubOverviewDirectory)))
        {
            attachmentForm = new AttachmentForm();
            attachmentForm.name = Base.FileName;
            string mimeType = MimeUtility.GetMimeMapping(Base.FileName);
            attachmentForm.type = mimeType;
            byte[] byteArray = System.IO.File.ReadAllBytes(Path.Combine(path.Value, Base.SubOverviewDirectory));
            //string s = Convert.ToBase64String(byteArray);
            attachmentForm.baseString = Convert.ToBase64String(byteArray);
            attachmentForm.fileData = Array.ConvertAll(byteArray, b => (int)b);
            attachmentForm.byteArray = byteArray;
            attachmentForm.size = attachmentForm.fileData.Length;
            attachmentForm.surveyId = Base.SurveyId;
            attachmentForm.attachmentId = Base.Id;
            attachmentForm.outlinePlaceholder = Base.OutlinePlaceholder;
            attachmentForm.outlineId = Base.OutlineId;
            attachmentForm.attachmentGuid = Base.Guid.ToString();
            //attachmentRequests.Add(attachmentForm);
            return Ok(attachmentForm);
        }
        else
            return Ok(attachmentForm);
    }

    public async Task<IActionResult> StreamAttachment(long id)
    {
        string typeError = "InternalError";
        try
        {
            Attachment attachment = await _BaseRepository.GetObjectByIdAsync(id);
            string fullPath = System.IO.Path.Combine(path.Value, attachment.SubDirectory);
            var mimeTypes = Util.GetMimeType(attachment.FileName);
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

    [HttpGet("{id}")]
    public async Task<ActionResult<Attachment>> GetSitePictureAttachment(int id)
    {
        var Base = await _BaseRepository.GetObjectByIdAsync(id);
        if (Base == null)
        {
            return Ok(new Attachment());
        }
        AttachmentForm attachmentForm = null;
        if (System.IO.File.Exists(Path.Combine(path.Value, Base.SubSitePictureDirectory)))
        {
            attachmentForm = new AttachmentForm();
            attachmentForm.name = Base.FileName;
            string mimeType = MimeUtility.GetMimeMapping(Base.FileName);
            attachmentForm.type = mimeType;
            byte[] byteArray = System.IO.File.ReadAllBytes(Path.Combine(path.Value, Base.SubSitePictureDirectory));
            //string s = Convert.ToBase64String(byteArray);
            attachmentForm.baseString = Convert.ToBase64String(byteArray);
            attachmentForm.fileData = Array.ConvertAll(byteArray, b => (int)b);
            attachmentForm.byteArray = byteArray;
            attachmentForm.size = attachmentForm.fileData.Length;
            attachmentForm.surveyId = Base.SurveyId;
            attachmentForm.attachmentId = Base.Id;
            attachmentForm.outlinePlaceholder = Base.OutlinePlaceholder;
            attachmentForm.outlineId = Base.OutlineId;
            attachmentForm.attachmentGuid = Base.Guid.ToString();
            //attachmentRequests.Add(attachmentForm);
            return Ok(attachmentForm);
        }
        else
            return Ok(attachmentForm);
    }


    [HttpGet]
    public override async Task<ActionResult<Attachment>> GetFKMany(int fkId, string fkField)
    {
        List<Attachment> Base = await _BaseRepository.GetFKMany(fkId, fkField);
        List<AttachmentForm> attachmentRequests = new List<AttachmentForm>();

        IBaseRepository<Attachment> _attachmentRepository = new BaseRepository<Attachment>(_BaseRepository._baseConfiguration, _httpContextAccessor);
        foreach (var BaseItem in Base)
        {
            AttachmentForm attachmentForm = new AttachmentForm();
            attachmentForm.name = BaseItem.FileName;
            string mimeType = MimeUtility.GetMimeMapping(BaseItem.FileName);
            attachmentForm.type = mimeType;
            if (!System.IO.File.Exists(Path.Combine(path.Value, BaseItem.SubDirectory))) continue;
            byte[] byteArray = System.IO.File.ReadAllBytes(Path.Combine(path.Value, BaseItem.SubDirectory));
            //string s = Convert.ToBase64String(byteArray);
            attachmentForm.baseString = Convert.ToBase64String(byteArray);
            attachmentForm.fileData = Array.ConvertAll(byteArray, b => (int)b);
            attachmentForm.byteArray = byteArray;
            attachmentForm.size = attachmentForm.fileData.Length;
            attachmentForm.surveyId = BaseItem.SurveyId;
            attachmentForm.attachmentId = BaseItem.Id;
            attachmentForm.outlineId = BaseItem.OutlineId;
            attachmentForm.outlinePlaceholder = BaseItem.OutlinePlaceholder;
            attachmentRequests.Add(attachmentForm);
        }
        return Ok(attachmentRequests);
    }




    [HttpGet("{guid}")]
    public async Task<IActionResult> Browse(Guid guid, string? thumb)
    {
        AttachmentForm attachmentForm = new AttachmentForm();
        Attachment BaseItem = new Attachment();
        BaseItem = await _BaseRepository.GetSingleObject(s => s.Guid == guid);
        attachmentForm.name = BaseItem.FileName;
        string mimeType = MimeUtility.GetMimeMapping(BaseItem.FileName);
        attachmentForm.type = mimeType;
        if (!System.IO.File.Exists(Path.Combine(path.Value, BaseItem.SubThumbnailDirectory))) return null;
        byte[] byteArray = System.IO.File.ReadAllBytes(Path.Combine(path.Value, BaseItem.SubThumbnailDirectory));
        attachmentForm.baseString = Convert.ToBase64String(byteArray);
        attachmentForm.fileData = Array.ConvertAll(byteArray, b => (int)b);
        attachmentForm.byteArray = byteArray;
        attachmentForm.size = attachmentForm.fileData.Length;
        attachmentForm.surveyId = BaseItem.SurveyId;
        attachmentForm.attachmentId = BaseItem.Id;
        attachmentForm.outlineId = BaseItem.OutlineId;
        attachmentForm.outlinePlaceholder = BaseItem.OutlinePlaceholder;
        attachmentForm.sitePictureId = 0;
        attachmentForm.sitePictureDescription = BaseItem.AttachmentNote;

        string normal = "";
        if (path != null)
        {
            normal = BaseItem.SubDirectory.Replace("/", "\\");
        }
        else
        {
            normal = string.Empty;
        }
        if (normal.StartsWith("\\"))
        {
            normal = normal.Remove(0, 1);
        }

        string filePath = Path.Combine(path.Value, normal);
        IActionResult rs = null;

        if (normal != null && normal != string.Empty)
        {
            if (System.IO.File.Exists(filePath) == true)
            {
                //FileInfo info = new FileInfo(filePath);

                //var memory = new MemoryStream();
                //using (var stream = new FileStream(info.FullName, FileMode.Open))
                //{
                //    await stream.CopyToAsync(memory);
                //}
                //memory.Position = 0;

                var cd = new System.Net.Mime.ContentDisposition
                {
                    FileName = System.Net.WebUtility.UrlEncode(Path.GetFileName(filePath)),
                    Inline = true,
                };

                Response.Headers["Content-Disposition"] = cd.ToString();

                //rs = File(memory, Core.Common.FileHelper.GetContentType(info.FullName));
                string mimeString = "";
                var types = Util.GetMimeTypes();
                var ext = Path.GetExtension(filePath).ToLowerInvariant();
                string unknowType = "application/octet-stream";

                if (types.ContainsKey(ext))
                {
                    mimeString = types[ext];
                }
                else
                {
                    mimeString = unknowType;
                }

                rs = PhysicalFile(filePath, mimeString);
            }
            else
            {
            }
        }
        else
        {
        }
        return rs;

    }
    //api/Attachment/MakeThumbFiles
    [HttpGet]
    public async Task<IActionResult> MakeThumbFiles()
    {
        List<Attachment> attachments = new List<Attachment>();
        attachments = await _BaseRepository.GetAll();

        attachments.ForEach(async f =>
        {
            if (string.IsNullOrEmpty(f.SubThumbnailDirectory) || string.IsNullOrEmpty(f.SubOverviewDirectory) || string.IsNullOrEmpty(f.SubSitePictureDirectory))
            {
                Dictionary<string, string> refFiles = new Dictionary<string, string>();
                if (!string.IsNullOrEmpty(f.SubDirectory))
                {
                    string outputFiles = System.IO.Path.Combine(path.Value, f.SubDirectory);
                    string folder = f.SubDirectory.Split("\\").FirstOrDefault();
                    string saveThumbPart = System.IO.Path.Combine(path.Value, folder);
                    string mimeType = Util.GetMimeType(outputFiles);

                    if (mimeType.Contains("image/"))
                    {
                        Util.createThumb(outputFiles, saveThumbPart, folder, ref refFiles);
                        f.SubThumbnailDirectory = refFiles.FirstOrDefault(f => f.Key == "thumbnail").Value;
                        f.SubOverviewDirectory = refFiles.FirstOrDefault(f => f.Key == "overview").Value;
                        f.SubSitePictureDirectory = refFiles.FirstOrDefault(f => f.Key == "sitepicture").Value;
                        f = await _BaseRepository.UpdateData(f, JsonConvert.SerializeObject(f), f.Id, "Id");
                    }
                    else
                    {

                    }
                }
                
            }

        });

        return Ok();
    }

    [HttpGet]
    public async Task<IActionResult> DeleteAttachmentData(long id)
    {
        Attachment attachment = new Attachment();
        attachment = await _BaseRepository.GetSingleObject(s => s.Id == id);
        if (attachment != null)
        {
            if (attachment.SubDirectory != null)
                if (System.IO.File.Exists(Path.Combine(path.Value, attachment.SubDirectory)))
                    System.IO.File.Delete(Path.Combine(path.Value, attachment.SubDirectory));

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
}

