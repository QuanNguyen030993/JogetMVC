using LdapService;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using ERPCore.Controllers.Base;
using ERPCore.Models.Base;
using ERPCore.Models.Migration.Business.Config;
using ERPCore.Models.Request;
using System.Net;
namespace ERPCore.Controllers.Config
{
    [Route("api/[controller]/[action]")]
    [ApiController]
    public class RolesController : BaseControllerApi<Roles>
    {
        private readonly IBaseRepository<Roles> _BaseRepository;
        private readonly IConfiguration _configuration;

        public RolesController(IBaseRepository<Roles> BaseRepository, IConfiguration configuration, IHttpContextAccessor httpContextAccessor) : base(BaseRepository, httpContextAccessor)
        {
            _BaseRepository = BaseRepository;
            _configuration = configuration;
        }

    }
}