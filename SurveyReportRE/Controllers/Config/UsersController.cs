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
    public class UsersController : BaseControllerApi<Users>
    {
        private readonly IBaseRepository<Users> _BaseRepository;
        private readonly IConfiguration _configuration;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IBaseRepository<Employee> _employeeRepository;

        public static string DOMAIN_NAME = "";
        public static string SUPER_USER = "";
        public UsersController(IBaseRepository<Users> BaseRepository, IConfiguration configuration, IHttpContextAccessor httpContextAccessor) : base(BaseRepository, httpContextAccessor)
        {
            _BaseRepository = BaseRepository;
            _configuration = configuration;
            _httpContextAccessor = httpContextAccessor;
            _employeeRepository = new BaseRepository<Employee>(configuration, _httpContextAccessor);
            DOMAIN_NAME = configuration.GetSection("Domain:DCServer").Value;
            SUPER_USER = configuration.GetSection("SuperUser:SuperUser").Value;
        }



        [HttpGet]
        public override async Task<ActionResult<Users>> GetAll()
        {
            var Base = await _BaseRepository.GetAll();
            string userName = _httpContextAccessor.HttpContext.User.Identity.Name.Replace(DOMAIN_NAME, "");
            if (SUPER_USER.Contains(userName))
                return Ok(Base);
            else
            {
                Users currentUser = new Users();
                currentUser = await _BaseRepository.GetSingleObject(s => s.username == userName);
                Base = Base.Where(w => w.department == currentUser.department).ToList();
                //Base = Base.Where(w => w.department == currentUser.department && w.username != userName).ToList();
            }
            if (Base == null)
            {
                return NotFound();
            }

            return Ok(Base);
        }

        [HttpGet]
        public override async Task<ActionResult<Users>> DropDownLookup()
        {//work on form
            var requestParams = HttpContext.Request.Query.ToList();
            IDictionary<string, object> dynamicObj = new ExpandoObject { };
            foreach (var item in requestParams)
            {
                dynamicObj[item.Key] = item.Value;
            }
            var Base = await _BaseRepository.GetAll();
            string userName = _httpContextAccessor.HttpContext.User.Identity.Name.Replace(DOMAIN_NAME, "");
            Base = Base.Where(w => w.department == "RE" && w.username != userName).ToList();
            if (dynamicObj.ContainsKey("key"))
            {
                var obj = dynamicObj["key"];
                int result = 0;
                int.TryParse(obj.ToString(), out result);
                if (result != 0)
                    Base = await _BaseRepository.GetManyObjectByIdAsync(int.Parse(obj.ToString()));
            }
            if (Base == null)
            {
                return NotFound();
            }

            return Ok(Base);
        }

        [HttpGet]
        public async Task<IActionResult> ReturnToAccount()
        {
            HttpContext.Session.Remove("ImpersonatedUser");
            var windowsIdentity = WindowsIdentity.GetCurrent();
            if (windowsIdentity != null)
            {
                var windowsPrincipal = new WindowsPrincipal(windowsIdentity);
                HttpContext.User = windowsPrincipal;
            }
            return Redirect("/Management");
        }

        [HttpGet("{userName}")]
        public async Task<IActionResult> LoginAs(string userName)
        {
            HttpContext.Session.SetString("ImpersonatedUser", userName);
            return Redirect("/Management");
        }

        [HttpGet]
        public async Task<IActionResult> EmployeeUpdate(string? adminUser, string? passWord)
        {
            LDAPInfo ldapSetting = _configuration.GetSection("LDAP").Get<LDAPInfo>();
            ldapSetting.LdapUser = adminUser;
            ldapSetting.LdapPassword = passWord;
            LDConnect.LDConnectInitialize(ldapSetting.Domain, ldapSetting.LdapUser, ldapSetting.LdapPassword);
            List<ADUser> aDUsers = LDConnect.GetAllUsers(false, true);
            foreach (var user in aDUsers)
            {
               await _BaseRepository.InsertData(JsonConvert.DeserializeObject<Users>(JsonConvert.SerializeObject(user)));
            }
            //LdapHelper.LdapInitialize(ldapSetting.LdapServer,ldapSetting.LdapUser,ldapSetting.LdapPassword);
            //List<string> ldapUser = LdapHelper.GetAllUsers();

            return Ok();
        }


        [HttpGet("{userName}")]
        public async Task<IActionResult> RoleAddUser(string userName)
        {
            Employee employee = new Employee();
            employee = await _employeeRepository.GetSingleObjectFullInclude(s => s.AccountName == userName, i => i.SystemRolesFK);
            if (employee != null)
            {
                var Base = await _BaseRepository.ExecuteStoredProcedureReturn("usp_Role_AddUser",
                ("@RoleName", employee.SystemRolesFK.RoleName), ("@UserName", userName), ("@IsClear", 0));
                return Ok();
            }
            return BadRequest();
        }

        [HttpGet("{userName}")]
        public async Task<IActionResult> ClearRoleUser(string userName)
        {
            Employee employee = new Employee();
            employee = await _employeeRepository.GetSingleObjectFullInclude(s => s.AccountName == userName, i => i.SystemRolesFK);
            if (employee != null)
            {
                var Base = await _BaseRepository.ExecuteStoredProcedureReturn("usp_Role_AddUser",
                ("@RoleName", employee.SystemRolesFK.RoleName), ("@UserName", userName), ("@IsClear", 1));
                return Ok();
            }
            return BadRequest();
        }
        [HttpGet]
        public async Task<ActionResult<object>> GetUserRoleStatus()
        {
            var Base = await _BaseRepository.ExecuteStoredProcedureReturn("usp_UserRole_GetStatus");
            if (Base == null)
            {
                return NotFound();
            }

            var ReturnDictionary = Util.ConvertDataTableToDictionaryList(Base);

            return Ok(ReturnDictionary);
        }


        [HttpPost]
        public async Task<IActionResult> GetUsersByIds([FromBody] List<long> userIds)
        {
            List<Users> users = new List<Users>();
            users = await _BaseRepository.GetListObject(s => userIds.Contains(s.Id));

            return Ok(users);
        }



    }

}

public class LDAPInfo
{
    public string Domain { get; set; } = "";
    public string LdapServer { get; set; } = "";
    public string LdapUser { get; set; } = "";
    public string LdapPassword { get; set; } = "";
}