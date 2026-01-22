using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using ERPCore.Controllers.Base;
using ERPCore.Models.Migration.Business.MasterData;
using ERPCore.Models.Request;
using System.Dynamic;
using ERPCore.Common;
using ERPCore.ControllerUtil;

[ApiController]
[Route("api/[controller]/[action]")]
public class ClientController : BaseControllerApi<Client>
{
    private readonly IBaseRepository<Client> _BaseRepository;
	private readonly IConfiguration configuration;

    public ClientController(IBaseRepository<Client> BaseRepository, IConfiguration config, IHttpContextAccessor httpContextAccessor) : base(BaseRepository, httpContextAccessor)
    {
        configuration = config;
        _BaseRepository = BaseRepository;
    }

    public async Task<IActionResult> Import(int surveyId)
    {// Use blog settings while override this method instead
        //var path = BLOB_PATH;
        string folder = Request.Headers["X-Folder-Path"];
        //IBaseRepository<Attachment> _attachmentRepository = new BaseRepository<Attachment>(_BaseRepository._baseConfiguration, _httpContextAccessor);
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
                //var unixMilliseconds = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
                //string s = Convert.ToBase64String(fileBytes);
                //if (!System.IO.Directory.Exists(BLOB_PATH))
                //    Directory.CreateDirectory(BLOB_PATH);
                //if (!System.IO.Directory.Exists(Path.Combine(BLOB_PATH, folder)))
                //    Directory.CreateDirectory(Path.Combine(BLOB_PATH, folder));

                //Attachment attachment = new Attachment();
                //AttachmentRequest attachmentRequest = new AttachmentRequest();
                //attachmentRequest.surveyId = surveyId;
                //attachment = Util.BindingAttachment(BLOB_PATH, folder, file.FileName, fileBytes, attachmentRequest);
                //attachment = await _attachmentRepository.InsertData(attachment);
                //AttachmentForm attachmentForm = ControllerHelper.BindingAttachmentForm(attachment, BLOB_PATH);
                //System.IO.File.WriteAllBytes(Path.Combine(path.Value, folder, $"{unixMilliseconds}_{file.FileName}"), fileBytes);

                return Ok(new { success = true, message = "File uploaded successfully" });
            }
        }
        else
            return Ok(new { success = false, message = "No file uploaded" });
    }

}

