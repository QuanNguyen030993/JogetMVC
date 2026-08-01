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
                signalR = settings.SignalR
            });
        }

    }
}
