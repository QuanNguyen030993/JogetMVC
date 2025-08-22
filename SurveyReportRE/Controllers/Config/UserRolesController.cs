using LdapService;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using SurveyReportRE.Controllers.Base;
using SurveyReportRE.Models.Base;
using SurveyReportRE.Models.Migration.Business.Config;
using SurveyReportRE.Models.Request;
using System.Net;
namespace SurveyReportRE.Controllers.Config
{
    [Route("api/[controller]/[action]")]
    [ApiController]
    public class UserRolesController : BaseControllerApi<UserRoles>
    {
        private readonly IBaseRepository<UserRoles> _BaseRepository;
        private readonly IConfiguration _configuration;

        public UserRolesController(IBaseRepository<UserRoles> BaseRepository, IConfiguration configuration, IHttpContextAccessor httpContextAccessor) : base(BaseRepository, httpContextAccessor)
        {
            _BaseRepository = BaseRepository;
            _configuration = configuration;
        }

      
    }

}