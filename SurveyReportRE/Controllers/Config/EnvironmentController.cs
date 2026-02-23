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
using ERPCore.Models.Models.Parsing;
using TMIVHashing;

namespace ERPCore.Controllers.Config
{
    [Route("api/[controller]/[action]")]
    [ApiController]
    public class EnvironmentController : BaseControllerApi<EmptyClass>
    {
        private readonly IBaseRepository<EmptyClass> _BaseRepository;
        private readonly IConfiguration _configuration;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public static string DOMAIN_NAME = "";
        public static string SUPER_USER = "";
        public EnvironmentController(IBaseRepository<EmptyClass> BaseRepository, IConfiguration configuration, IHttpContextAccessor httpContextAccessor) : base(BaseRepository, httpContextAccessor)
        {
            _BaseRepository = BaseRepository;
            _configuration = configuration;
            _httpContextAccessor = httpContextAccessor;
        }
        [HttpGet]
        public IActionResult MakeEncryption(string password)
        {
            string encryptedKey = KeyVaultLocal.EncryptConnectionStringPassword(password, "ApplicationSecretKey", "ApplicationSaltKey", 10);
            return Ok(encryptedKey);
        }
        public IActionResult MakeDecryption(string variableName)
        {
            string decryptedKey = KeyVaultLocal.DecryptConnectionStringPassword(Environment.GetEnvironmentVariable(variableName, EnvironmentVariableTarget.Machine), "ApplicationSecretKey", "ApplicationSaltKey", 10);
            return Ok(decryptedKey);
        }

    }

}

