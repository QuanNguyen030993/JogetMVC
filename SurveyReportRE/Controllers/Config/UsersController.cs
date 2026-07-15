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
using ERPCore.Models.Migration.Business.MasterData;
using ERPCore.Models.Models.Parsing;
using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;
using ERPCore.ControllerUtil;

namespace ERPCore.Controllers.Config
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

        public sealed class LoginAsRequest
        {
            public string UserName { get; set; } = "";
        }

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
        public override async Task<ActionResult<List<Users>>> GetAll()
        {
            var queryParams = HttpContext.Request.Query;



            // ===== PAGING =====
            //int skip = 0;
            //int take = 50;

            //if (queryParams.ContainsKey("skip"))
            //    int.TryParse(queryParams["skip"], out skip);

            //if (queryParams.ContainsKey("take"))
            //    int.TryParse(queryParams["take"], out take);

            //take = Math.Clamp(take, 1, 200);

            var requestParams = HttpContext.Request.Query.ToList();
            IDictionary<string, object> dynamicObj = new ExpandoObject { };
            foreach (var item in requestParams)
            {
                dynamicObj[item.Key] = item.Value;
            }
            var Base = new List<Users>();

            if (requestParams.Count > 1)
            {

            }

            if (dynamicObj.ContainsKey("key"))
            {
                var obj = dynamicObj["key"];
                int result = 0;
                int.TryParse(obj.ToString(), out result);
                if (result != 0)
                    Base = await _BaseRepository.GetManyObjectByIdAsync(int.Parse(obj.ToString()));
            }
            else
            {
                Base = await _BaseRepository.GetAll(requestParams);
            }
            string userName = ControllerUtil.ControllerUtil.GetCurrentContextUser(_httpContextAccessor, _configuration);
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
            string userName = ControllerUtil.ControllerUtil.GetCurrentContextUser(_httpContextAccessor, _configuration);
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

        [HttpPost]
        public IActionResult ReturnToAccount()
        {
            HttpContext.Session.Remove("ImpersonatedUser");
            Response.Cookies.Delete("ImpersonatedUser");

            return Ok(new
            {
                success = true,
                message = "Returned to the original account.",
                redirectUrl = "/Management"
            });
        }

        [HttpPost]
        public async Task<IActionResult> LoginAs([FromBody] LoginAsRequest request)
        {
            var currentUser = ControllerUtil.ControllerUtil
                .GetCurrentContextUser(_httpContextAccessor, _configuration)
                .Trim();
            if (!IsSuperUser(currentUser))
            {
                return StatusCode(StatusCodes.Status403Forbidden, new
                {
                    success = false,
                    message = "Only a super user can use Login as."
                });
            }

            var userName = request?.UserName?.Trim() ?? "";
            if (string.IsNullOrWhiteSpace(userName))
                return BadRequest(new { success = false, message = "Please select a user." });

            var targetUser = await _BaseRepository.GetSingleObject(user => user.username == userName);
            if (targetUser == null)
                return NotFound(new { success = false, message = $"User '{userName}' was not found." });

            if (string.Equals(currentUser, targetUser.username, StringComparison.OrdinalIgnoreCase))
                return BadRequest(new { success = false, message = "You are already using this account." });

            HttpContext.Session.SetString("ImpersonatedUser", targetUser.username);
            Response.Cookies.Append(
                "ImpersonatedUser",
                targetUser.username,
                new CookieOptions
                {
                    HttpOnly = true,
                    IsEssential = true,
                    SameSite = SameSiteMode.Lax,
                    Secure = Request.IsHttps,
                    MaxAge = TimeSpan.FromHours(8)
                });

            return Ok(new
            {
                success = true,
                message = $"Switching to {targetUser.username}...",
                data = new { userName = targetUser.username },
                redirectUrl = "/Management"
            });
        }

        private static bool IsSuperUser(string userName)
        {
            return (SUPER_USER ?? "")
                .Split(new[] { ',', ';', '|', ' ' }, StringSplitOptions.RemoveEmptyEntries)
                .Any(item => string.Equals(item.Trim(), userName, StringComparison.OrdinalIgnoreCase));
        }

        [HttpGet]
        public async Task<IActionResult> EmployeeUpdate(string? adminUser, string? passWord, string? connectionId)
        {
            var initiatorUserName = ERPCore.ControllerUtil.ControllerUtil.GetCurrentContextUser(_httpContextAccessor, _configuration);

            _ = Task.Run(async () =>
            {
                try
                {
                    await SendProgress(connectionId, 5, "Connecting to LDAP/Active Directory...", "User Update");

                    LDAPInfo ldapSetting = _configuration.GetSection("LDAP").Get<LDAPInfo>();
                    if (ldapSetting == null)
                    {
                        ldapSetting = new LDAPInfo();
                    }
                    ldapSetting.LdapUser = adminUser;
                    ldapSetting.LdapPassword = passWord;
                    LDConnect.LDConnectInitialize(ldapSetting.Domain, ldapSetting.LdapUser, ldapSetting.LdapPassword);

                    await SendProgress(connectionId, 15, "Retrieving Active Directory users...", "User Update");
                    List<ADUser> aDUsers = LDConnect.GetAllUsers(false, true);

                    if (aDUsers == null || aDUsers.Count == 0)
                    {
                        await SendProgress(connectionId, 100, "No Active Directory users found.", "User Update", isComplete: true);
                        return;
                    }

                    int totalUsers = aDUsers.Count;
                    await SendProgress(connectionId, 30, $"Found {totalUsers} users. Preparing DB sync...", "User Update");

                    var claims = new List<System.Security.Claims.Claim>();
                    claims.Add(new System.Security.Claims.Claim("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name", initiatorUserName));
                    var identity = new System.Security.Claims.ClaimsIdentity(claims, "mock");
                    var principal = new System.Security.Claims.ClaimsPrincipal(identity);
                    var mockContext = new DefaultHttpContext { User = principal };
                    var mockAccessor = new MockHttpContextAccessor { HttpContext = mockContext };

                    var bgUsersRepo = new BaseRepository<Users>(_configuration, mockAccessor);

                    int batchSize = 100;
                    int processedCount = 0;
                    for (int i = 0; i < totalUsers; i += batchSize)
                    {
                        var batch = aDUsers.Skip(i).Take(batchSize).ToList();
                        foreach (var user in batch)
                        {
                            try
                            {
                                await bgUsersRepo.InsertData(JsonConvert.DeserializeObject<Users>(JsonConvert.SerializeObject(user)));
                            }
                            catch (Exception ex)
                            {
                                Serilog.Log.Warning(ex, $"Failed to insert AD user {user.username}");
                            }
                        }
                        processedCount += batch.Count;

                        int progress = 30 + (int)(processedCount * 70.0 / totalUsers);
                        await SendProgress(connectionId, progress, $"Syncing users: {processedCount}/{totalUsers}...", "User Update");
                    }

                    await SendProgress(connectionId, 100, $"Completed! {totalUsers} users processed.", "User Update", isComplete: true);
                }
                catch (Exception ex)
                {
                    Serilog.Log.Error(ex, "User update background execution failed.");
                    await SendProgress(connectionId, 100, $"Error: {ex.Message}", "User Update", isError: true);
                }
            });

            return Ok(new { success = true, message = "User update initiated..." });
        }

        private async Task SendProgress(string? connectionId, int progressvalue, string subTabContent, string tabName, bool isComplete = false, bool isError = false)
        {
            if (string.IsNullOrEmpty(connectionId)) return;

            var result = new SignalRResult
            {
                status = isComplete ? "complete" : (isError ? "error" : "saving ..."),
                tabName = tabName,
                subTabContent = subTabContent,
                progressvalue = progressvalue,
                type = isComplete ? "complete" : (isError ? "error" : "inprogress")
            };

            try
            {
                if (FileProcessingHub._hubContext != null)
                {
                    await FileProcessingHub._hubContext.Clients.Client(connectionId).SendAsync("R_OverviewLoading", new { payload = result, connectionId = connectionId });
                }
            }
            catch (Exception ex)
            {
                Serilog.Log.Error(ex, "Failed to send SignalR progress update.");
            }
        }

        public class MockHttpContextAccessor : IHttpContextAccessor
        {
            public HttpContext? HttpContext { get; set; }
        }


        [HttpGet("{userName}")]
        public async Task<IActionResult> RoleAddUser(string userName)
        {
            Employee employee = new Employee();
            employee = await _employeeRepository.GetSingleObjectFullInclude(s => s.AccountName == userName,null, i => i.SystemRolesFK);
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
            employee = await _employeeRepository.GetSingleObjectFullInclude(s => s.AccountName == userName, null,i => i.SystemRolesFK);
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
