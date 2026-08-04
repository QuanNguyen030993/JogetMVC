using LdapService;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using ERPCore.Controllers.Base;
using ERPCore.Models.Base;
using ERPCore.Models.Migration.Business.Config;
using ERPCore.Models.Request;
using System.Dynamic;
using System.Net;
using System.Security.Claims;
using System.Security.Principal;
using ERPCore.Models.Migration.Business.HumanResource;
using ERPCore.Common;
using ERPCore.Models.Migration.Business.Data;
using MimeMapping;
using Newtonsoft.Json.Linq;
using ERPCore.ControllerUtil;
using ERPCore.Models.Business.Migration.Config;
using ERPCore.Models.Migration.Config;
using System.Reflection;
using ERPCore.Models.Models.Parsing;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Spreadsheet;
using System.Globalization;
namespace ERPCore.Controllers.Config
{
    public sealed class AttachmentStorageSettingRequest
    {
        public string Value { get; set; } = "Local";
    }

    [Route("api/[controller]/[action]")]
    [ApiController]
    public class ConstantController : BaseControllerApi<Constant>
    {
        private readonly IBaseRepository<Constant> _BaseRepository;
        private readonly IConfiguration _configuration;

        public ConstantController(IBaseRepository<Constant> BaseRepository, IConfiguration configuration, IHttpContextAccessor httpContextAccessor) : base(BaseRepository, httpContextAccessor)
        {
            _BaseRepository = BaseRepository;
            _configuration = configuration;

        }

        [HttpGet]
        public async Task<IActionResult> GetSystemWriteControls()
        {
            var settings = await SystemWriteControl.GetAsync(_BaseRepository._connectionString);
            return Ok(new
            {
                httpAuditRequest = settings.HttpAuditRequest,
                errorClientLog = settings.ErrorClientLog,
                signalR = settings.SignalR,
                attachmentStorage = settings.AttachmentStorage
            });
        }

        [HttpPost]
        public async Task<IActionResult> SetAttachmentStorage([FromBody] AttachmentStorageSettingRequest request)
        {
            var storage = string.Equals(request?.Value?.Trim(), "SharePoint", StringComparison.OrdinalIgnoreCase)
                ? "SharePoint"
                : string.Equals(request?.Value?.Trim(), "Local", StringComparison.OrdinalIgnoreCase)
                    ? "Local"
                    : null;
            if (storage == null)
            {
                return BadRequest(new { message = "AttachmentStorage must be Local or SharePoint." });
            }

            var setting = await _BaseRepository.GetSingleObject(item =>
                item.ParameterName == SystemWriteControl.AttachmentStorageKey && !item.Deleted);
            if (setting == null)
            {
                setting = await _BaseRepository.InsertData(new Constant
                {
                    ParameterName = SystemWriteControl.AttachmentStorageKey,
                    Value = storage
                });
            }
            else
            {
                setting.Value = storage;
                await _BaseRepository.UpdateData(
                    setting,
                    JsonConvert.SerializeObject(new { Value = storage }),
                    setting.Id,
                    nameof(Constant.Id));
            }

            SystemWriteControl.Invalidate();
            return Ok(new { attachmentStorage = storage });
        }

    }
}
