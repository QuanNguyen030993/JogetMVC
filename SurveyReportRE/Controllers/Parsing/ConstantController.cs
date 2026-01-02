using LdapService;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using SurveyReportRE.Controllers.Base;
using SurveyReportRE.Models.Base;
using SurveyReportRE.Models.Migration.Business.Config;
using SurveyReportRE.Models.Request;
using System.Dynamic;
using System.Net;
using System.Security.Claims;
using System.Security.Principal;
using SurveyReportRE.Models.Migration.Business.HumanResource;
using SurveyReportRE.Common;
using SurveyReportRE.Models.Migration.Business.Data;
using MimeMapping;
using Newtonsoft.Json.Linq;
using SurveyReportRE.ControllerUtil;
using SurveyReportRE.Models.Business.Migration.Config;
using SurveyReportRE.Models.Migration.Config;
using System.Reflection;
using RESurveyTool.Models.Models.Parsing;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Spreadsheet;
using System.Globalization;
namespace SurveyReportRE.Controllers.Config
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

    }
}
