using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using Serilog;
using SurveyReportRE.Common;
using SurveyReportRE.Controllers.Base;
using SurveyReportRE.ControllerUtil;
using SurveyReportRE.Models.Base;
using SurveyReportRE.Models.Migration.Business.Config;
using SurveyReportRE.Models.Migration.Business.Data;
using SurveyReportRE.Models.Migration.Business.Form;
using SurveyReportRE.Models.Migration.Business.HumanResource;
using SurveyReportRE.Models.Migration.Business.MasterData;
using SurveyReportRE.Models.Migration.Business.Workflow;
using SurveyReportRE.Models.Request;
using SurveyReportRE.Repository;
using Syncfusion.Pdf.Graphics;
using System.Data;
using System.Net;

[ApiController]
[Route("api/[controller]/[action]")]
public class SurveyWorkflowController : BaseControllerApi<SurveyWorkflow>
{
    private readonly IBaseRepository<SurveyWorkflow> _BaseRepository;
    private readonly IConfiguration configuration;
    private readonly IBaseRepository<Survey> _surveyRepository;
    private readonly IBaseRepository<Attachment> _attachmentRepository;
    private readonly IBaseRepository<Employee> _employeeRepository;
    private readonly IBaseRepository<Users> _usersRepository;
    private readonly IBaseRepository<UserRoles> _userRolesRepository;
    private readonly IBaseRepository<Roles> _rolesRepository;
    private readonly IConfigurationSection path;
    public static string MANAGER_APP = "";
    public static string APPROVER_APP = "";
    public static string CHECKER_APP = "";
    public static string USER_APP = "";
    public static string SUPER_USER = "";
    public static string DOMAIN_NAME = "";
    private static string BLOB_PATH = "";
    public static string CURRENT_USER = "";
    public SurveyWorkflowController(IBaseRepository<SurveyWorkflow> BaseRepository, IConfiguration config, IHttpContextAccessor httpContextAccessor, ILogger<SurveyWorkflow> logger) : base(BaseRepository, httpContextAccessor)
    {
        configuration = config;
        _BaseRepository = BaseRepository;
        _surveyRepository = new BaseRepository<Survey>(configuration, _httpContextAccessor);
        _attachmentRepository = new BaseRepository<Attachment>(configuration, _httpContextAccessor);
        _employeeRepository = new BaseRepository<Employee>(configuration, _httpContextAccessor);
        _usersRepository = new BaseRepository<Users>(configuration, _httpContextAccessor);
        _userRolesRepository = new BaseRepository<UserRoles>(configuration, _httpContextAccessor);
        _rolesRepository = new BaseRepository<Roles>(configuration, _httpContextAccessor);
        MANAGER_APP = configuration.GetSection("BusinessConfig:ManagerAppKey").Value;
        APPROVER_APP = configuration.GetSection("BusinessConfig:ApproverAppKey").Value;
        CHECKER_APP = configuration.GetSection("BusinessConfig:CheckerAppKey").Value;
        USER_APP = configuration.GetSection("BusinessConfig:UserAppKey").Value;
        SUPER_USER = configuration.GetSection("SuperUser:SuperUser").Value;
        DOMAIN_NAME = configuration.GetSection("Domain:DCServer").Value;
        path = _BaseRepository._baseConfiguration.GetSection("BlobStorage:Path");
        BLOB_PATH = path.Value;
        CURRENT_USER = _httpContextAccessor.HttpContext.User.Identity.Name.Replace(DOMAIN_NAME, "");
    }
    [HttpPost]
    public override async Task<object> ExecuteCustomQuery([FromBody] string query)
    {
        List<Dictionary<string, object>> obj = await _BaseRepository.ExecuteCustomQuery(query);
        var Base = obj.Where(dict => dict.ContainsKey("workflowStatus") && dict["workflowStatus"] != null).ToList();

        string userName = _httpContextAccessor.HttpContext.User.Identity.Name.Replace(DOMAIN_NAME, "");
        Users user = await _usersRepository.GetSingleObject(s => s.username == userName);
        Employee employee = await _employeeRepository.GetSingleObject(s => s.AccountName == userName);

        if (user == null)
        {
            return NotFound("User not found.");
        }

        if (SUPER_USER.Contains(user.username))
        {
            return Ok(Base);
        }

        UserRoles userRole = await _userRolesRepository.GetSingleObject(s => s.UserId == user.Id);
        Roles roles = await _rolesRepository.GetSingleObject(s => s.Id == userRole.RoleId);
        List<Dictionary<string, object>> filteredBase = new List<Dictionary<string, object>>();
        filteredBase = Base;
        if (roles.RoleName == MANAGER_APP)
        {
            filteredBase = Base
                .Where(w =>
                    w.ContainsKey("areaId") &&
                    w["areaId"] != null &&
                    Convert.ToInt32(w["areaId"]) == employee.AreaId
                )
                .ToList();
        }

        return filteredBase;
    }

    public async Task<IActionResult> GetPdfFile(long id)
    {
        string typeError = "InternalError";
        try
        {
            Survey survey = await _surveyRepository.GetObjectByIdAsync(id);

            string docPath = System.IO.Path.Combine(path.Value, nameof(Survey), $"{survey.SurveyNo}.docx");
            string pdfPath = System.IO.Path.Combine(path.Value, nameof(Survey), $"{survey.SurveyNo}.pdf");


            //if ((System.IO.File.Exists(docPath) && !System.IO.File.Exists(pdfPath)) || (survey.NeedPDFConvert ?? false))
            if ((System.IO.File.Exists(docPath) && !System.IO.File.Exists(pdfPath)))
            {
                WordUtil.ConvertPDF(docPath, pdfPath);
                DataUtil.ExecuteStoredProcedureReturn(_BaseRepository._logConnectionString, "sp_WriteLogs",
                       ("@Message", $"{pdfPath} saving complete!")
                       , ("@TimeStamp", DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"))
                       , ("@MessageTemplate", $"{pdfPath} saving complete!")
                       , ("@Properties", "")
                       , ("@Level", "Information")
                       , ("@User", CURRENT_USER)
                       , ("@Exception", ""));
                bool isExists = await _attachmentRepository.RecordExistsAsync<Attachment>("FileName", (object)$"{survey.SurveyNo}.pdf");
                Attachment attachment = new Attachment();
                if (!isExists)
                {
                    attachment.SurveyId = survey.Id;
                    attachment.FileName = $"{survey.SurveyNo}.pdf";
                    attachment.SubDirectory = System.IO.Path.Combine(nameof(Survey), $"{survey.SurveyNo}.pdf");
                    attachment.FileType = Path.GetExtension($"{survey.SurveyNo}.pdf");
                    attachment = await _attachmentRepository.InsertData(attachment);
                }
                else
                {
                    var attachments = await _attachmentRepository.GetFKMany((int)survey.Id, "SurveyId");
                    attachment = attachments.FirstOrDefault(f => f.FileType == ".pdf");
                }


                survey.PDFAttachmentId = attachment.Id;
                survey.NeedPDFConvert = false;
                survey = await _surveyRepository.UpdateData(survey, JsonConvert.SerializeObject(survey), survey.Id, "Id");
            }


            if (survey.PDFAttachmentId != null)
            {
                Attachment attachment = await _attachmentRepository.GetObjectByIdAsync((int)survey.PDFAttachmentId);
                string fullPath = System.IO.Path.Combine(path.Value, attachment.SubDirectory);
                if (System.IO.File.Exists(fullPath))
                {
                    var fileStream = System.IO.File.OpenRead(fullPath);
                    return File(fileStream, "application/pdf", Path.GetFileName(fullPath));
                }
                else
                {
                    typeError = "FileNotFound";
                    throw new Exception($"{fullPath} not found.");
                }
            }
            typeError = "UserGuide";
            Response.Headers.Add("X-Error-Message", $"Please try \"Update Report\" once !");
            Response.Headers.Add("X-Error-Type", typeError);
            return StatusCode(500);
        }
        catch (Exception ex)
        {
            Log.Error(ex, ex.Message);
            Response.Headers.Add("X-Error-Message", ex.Message);
            Response.Headers.Add("X-Error-Type", typeError);
            return StatusCode(500); // Internal Server Error
        }
    }
    public async Task<IActionResult> GetWordFile(long id)
    {
        string typeError = "InternalError";
        try
        {
            Survey survey = await _surveyRepository.GetObjectByIdAsync(id);
            string docPath = System.IO.Path.Combine(path.Value, nameof(Survey), $"{survey.SurveyNo}.docx");
            if (System.IO.File.Exists(docPath))
            {
                var fileStream = System.IO.File.OpenRead(docPath);
                return File(fileStream, "application/pdf", Path.GetFileName(docPath));
            }
            else
            {
                typeError = "FileNotFound";
                throw new Exception($"{docPath} not found.");
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
    public async Task<IActionResult> SurveyConvertPDF(long id)
    {
        try
        {
            Survey survey = await _surveyRepository.GetObjectByIdAsync(id);
            string docPath = System.IO.Path.Combine(path.Value, nameof(Survey), $"{survey.SurveyNo}.docx");
            string pdfPath = System.IO.Path.Combine(path.Value, nameof(Survey), $"{survey.SurveyNo}.pdf");
            bool checkPDF = System.IO.File.Exists(pdfPath);
            if ((survey.NeedPDFConvert ?? true) || !(checkPDF))
            {
                WordUtil.ConvertPDF(docPath, pdfPath);
                survey.NeedPDFConvert = false;
                await _surveyRepository.UpdateData(survey, JsonConvert.SerializeObject(survey), id, "Id");
                return Ok($"{pdfPath} {docPath} process!");
            }
            else
            {
                return Ok($"Already have document!");
            }
        }
        catch (Exception ex)
        {
            Log.Error(ex, ex.Message);
            return StatusCode(500, $"Internal Server Error: {ex.Message}");
        }
    }

    public override HttpResponseMessage UpdateData([FromForm] UpdateFormCollection form)
    {
        Task.Factory.StartNew(async () =>
        {
            var entity = new Attachment();
            JsonConvert.PopulateObject(form.values, entity);
            await _attachmentRepository.UpdateData(entity, form.values, form.key, "Id");
            long? attachmentId = form.key;
            Attachment attachment = new Attachment();
            attachment = await _attachmentRepository.GetSingleObject(a => a.Id == attachmentId);
            if (attachment != null && (entity.IsPrimary ?? false))
            {
                long? surveyId = attachment.SurveyId;
                Survey survey = new Survey();
                survey = await _surveyRepository.GetSingleObject(s => s.Id == surveyId);
                if (survey != null)
                {
                    survey.PDFAttachmentId = attachment.Id;
                    await _surveyRepository.UpdateData(survey, JsonConvert.SerializeObject(survey), survey.Id, "Id");
                }
            }
        });
        return new HttpResponseMessage(HttpStatusCode.OK);
}

public async Task<IActionResult> AsyncUploadPDF(int surveyId)
{// Use blog settings while override this method instead
    var path = BLOB_PATH;
    string folder = Request.Headers["X-Folder-Path"];
    IBaseRepository<Attachment> _attachmentRepository = new BaseRepository<Attachment>(_BaseRepository._baseConfiguration, _httpContextAccessor);
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
            if (!System.IO.Directory.Exists(BLOB_PATH))
                Directory.CreateDirectory(BLOB_PATH);
            if (!System.IO.Directory.Exists(Path.Combine(BLOB_PATH, folder)))
                Directory.CreateDirectory(Path.Combine(BLOB_PATH, folder));

            Attachment attachment = new Attachment();
            AttachmentRequest attachmentRequest = new AttachmentRequest();
            attachmentRequest.surveyId = surveyId;
            attachment = Util.BindingAttachment(BLOB_PATH, folder, file.FileName, fileBytes, attachmentRequest);
            attachment = await _attachmentRepository.InsertData(attachment);
            AttachmentForm attachmentForm = ControllerHelper.BindingAttachmentForm(attachment, BLOB_PATH);
            //System.IO.File.WriteAllBytes(Path.Combine(path.Value, folder, $"{unixMilliseconds}_{file.FileName}"), fileBytes);

            return Ok(new { success = true, message = "File uploaded successfully", attachment = attachmentForm });
        }
    }
    else
        return Ok(new { success = false, message = "No file uploaded" });
}
}

