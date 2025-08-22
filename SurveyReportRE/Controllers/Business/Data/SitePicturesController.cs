using DocumentFormat.OpenXml.Math;
using Microsoft.AspNetCore.Mvc;
using MimeMapping;
using Newtonsoft.Json;
using SurveyReportRE.Common;
using SurveyReportRE.Controllers.Base;
using SurveyReportRE.Models.Migration.Business.Data;
using SurveyReportRE.Models.Migration.Business.MasterData;
using SurveyReportRE.Models.Request;
using System.Net;

[ApiController]
[Route("api/[controller]/[action]")]
public class SitePicturesController : BaseControllerApi<SitePictures>
{
    private readonly IBaseRepository<SitePictures> _BaseRepository;
    private readonly IBaseRepository<Attachment> _attachmentRepository;
    private readonly IConfiguration configuration;
    private readonly IConfigurationSection path;
    public SitePicturesController(IBaseRepository<SitePictures> BaseRepository, IConfiguration config, IHttpContextAccessor httpContextAccessor) : base(BaseRepository, httpContextAccessor)
    {
        configuration = config;
        _BaseRepository = BaseRepository;
        _attachmentRepository = new BaseRepository<Attachment>(configuration, _httpContextAccessor);
        path = _BaseRepository._baseConfiguration.GetSection("BlobStorage:Path");
    }


    [HttpGet]
    public override async Task<ActionResult<SitePictures>> GetAll()
    {
        var Base = await _BaseRepository.GetAllInclude();
        if (Base == null)
        {
            return NotFound();
        }
        else
        {
            foreach (SitePictures f in Base)
            {
                f.AttachmentFK = await _attachmentRepository.ObjectSpecificInclude(f.AttachmentFK, a => a.OutlineFK);
            }
            Base = Base.Where(w => w.AttachmentFK?.OutlineFK?.PlaceHolder == "SitePictures").ToList();
            return Ok(Base);
        }
    }


    [HttpDelete]
    public override async Task<IActionResult> DeleteData([FromForm] DeleteFormCollection form)
    {
        var entity = new SitePictures();
        SitePictures sitePictures = new SitePictures();
        sitePictures = await _BaseRepository.GetSingleObject(s => s.Id == form.key);
        entity = await _BaseRepository.DeleteData(entity, form.key, "Id", false);

        Attachment attachment = new Attachment();
        if (sitePictures.AttachmentId != null)
        {
            attachment = await _attachmentRepository.GetSingleObject(s => s.Id == (int)sitePictures.AttachmentId);
            if (attachment.SubDirectory != null)
                if (System.IO.File.Exists(Path.Combine(path.Value, attachment.SubDirectory)))
                    System.IO.File.Delete(Path.Combine(path.Value, attachment.SubDirectory));

            attachment = await _attachmentRepository.DeleteData(attachment, (int)attachment.Id, "Id", false);
        }
        return Ok(entity);
    }

    [HttpPut]
    public override HttpResponseMessage UpdateNote([FromForm] UpdateFormCollection form)
    {
        var entity = new SitePictures();
        JsonConvert.PopulateObject(form.values, entity);
        _BaseRepository.UpdateData(entity, form.values, form.key, "Id");
        return new HttpResponseMessage(HttpStatusCode.OK);
    }






    [HttpPost]
    public override async Task<IActionResult> AsyncUploadPicture(int surveyId, int outlineId, string outlinePlaceHolder = "")
    {// Use blog settings while override this method instead
        //var path = _BaseRepository._baseConfiguration.GetSection("BlobStorage:Path");
        string folder = nameof(SitePictures);
        IBaseRepository<Attachment> _attachmentRepository = new BaseRepository<Attachment>(_BaseRepository._baseConfiguration, _httpContextAccessor);
        //var storageFolder = _blobStorageSettings.CurrentValue.Path;
        IFormFileCollection files = null;
        files = ((FormCollection)(Request.Form)).Files;

        IFormFile file = null;
        file = files.FirstOrDefault();
        if (file != null && file.Length > 0)
        {
            using (var ms = new MemoryStream())
            {
                file.CopyTo(ms);
                var fileBytes = ms.ToArray();
                var unixMilliseconds = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
                string s = Convert.ToBase64String(fileBytes);
                if (!System.IO.Directory.Exists(path.Value))
                    Directory.CreateDirectory(path.Value);
                if (!System.IO.Directory.Exists(Path.Combine(path.Value, folder)))
                    Directory.CreateDirectory(Path.Combine(path.Value, folder));

                Attachment attachment = new Attachment();
                AttachmentRequest attachmentRequest = new AttachmentRequest();
                attachmentRequest.surveyId = surveyId;
                attachmentRequest.outlineId = outlineId;
                attachmentRequest.outlinePlaceholder = outlinePlaceHolder;
                attachment = Util.BindingAttachment(path.Value, folder, file.FileName, fileBytes, attachmentRequest);
                attachment = await _attachmentRepository.InsertData(attachment);

                //System.IO.File.WriteAllBytes(Path.Combine(path.Value, folder, $"{unixMilliseconds}_{file.FileName}"), fileBytes);

                SitePictures sitePictures = new SitePictures();
                sitePictures.AttachmentId = attachment.Id;
                sitePictures.SurveyId = surveyId;
                await _BaseRepository.InsertData(sitePictures);


                return Ok(new { success = true, message = "File uploaded successfully", attachment = attachment, sitePictures = sitePictures });
            }
        }
        else
            return Ok(new { success = false, message = "No file uploaded" });
    }
}

