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

namespace SurveyReportRE.Controllers.Config
{
    [Route("api/[controller]/[action]")]
    [ApiController]
    public class EnvironmentController : BaseControllerApi<Users>
    {
        private readonly IBaseRepository<Users> _BaseRepository;
        private readonly IConfiguration _configuration;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public static string DOMAIN_NAME = "";
        public static string SUPER_USER = "";
        public EnvironmentController(IBaseRepository<Users> BaseRepository, IConfiguration configuration, IHttpContextAccessor httpContextAccessor) : base(BaseRepository, httpContextAccessor)
        {
            _BaseRepository = BaseRepository;
            _configuration = configuration;
            _httpContextAccessor = httpContextAccessor;
        }



    }

}

