using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using ERPCore.Common;
using ERPCore.Controllers.Base;
using ERPCore.ControllerUtil;
using ERPCore.Models;
using ERPCore.Models.Business.Migration.Config;
using ERPCore.Models.Migration.Business.Config;
using ERPCore.Models.Migration.Config;
using ERPCore.Models.Request;
using System.Runtime.CompilerServices;
using System.Security.Claims;
using ERPCore.Models.Migration.Business.HumanResource;
using Newtonsoft.Json.Linq;

[ApiController]
[Route("api/[controller]/[action]")]
public class MenuController : BaseControllerApi<Menu>
{
    private readonly IBaseRepository<Menu> _BaseRepository;
    private readonly IBaseRepository<Users> _usersRepository;
    private readonly IBaseRepository<UserRoles> _userRolesRepository;
    private readonly IBaseRepository<UsersSession> _userSessionRepository;
    private readonly IBaseRepository<Employee> _employeeRepository;
    private readonly IConfiguration _configuration;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public MenuController(IBaseRepository<Menu> BaseRepository, IConfiguration configuration, IHttpContextAccessor httpContextAccessor) : base(BaseRepository, httpContextAccessor)
    {
        _configuration = configuration;
        _BaseRepository = BaseRepository;
        bool isDebugMode = false;
        ControllerUtil.ContextHandle(httpContextAccessor, configuration, out isDebugMode);
        _httpContextAccessor = httpContextAccessor;
        //string checkIfLoginAsDebug = _configuration.GetSection("SuperUser:LoginAs").Value;
        //if (!string.IsNullOrEmpty(checkIfLoginAsDebug))
        //{
        //    {
        //        var newIdentity = new ClaimsIdentity();
        //        //var windowsIdentity = WindowsIdentity.GetCurrent();
        //        //var loginUser = windowsIdentity.Name.Replace(domainName, "");
        //        newIdentity.AddClaim(new System.Security.Claims.Claim(newIdentity.NameClaimType, checkIfLoginAsDebug));
        //        //if (windowsIdentity != null)
        //        //{
        //        _httpContextAccessor.HttpContext.User = new ClaimsPrincipal(newIdentity);
        //        //}
        //    }
        //}
        _userRolesRepository = new BaseRepository<UserRoles>(_configuration, _httpContextAccessor);
        _usersRepository = new BaseRepository<Users>(_configuration, _httpContextAccessor);
        _userSessionRepository = new BaseRepository<UsersSession>(_configuration, _httpContextAccessor);
        _employeeRepository = new BaseRepository<Employee>(_configuration, _httpContextAccessor);
        try
        {
        Util.GetQueryLog(_BaseRepository._connectionString);
        }
        catch
        {

        }
    }

    private static List<string> ParseAllowedRoles(string allowedRoles)
    {
        var list = new List<string>();
        if (string.IsNullOrEmpty(allowedRoles)) return list;
        
        string trimmed = allowedRoles.Trim();
        if ((trimmed.StartsWith("[") && trimmed.EndsWith("]")) || (trimmed.StartsWith("{") && trimmed.EndsWith("}")))
        {
            try
            {
                if (trimmed.StartsWith("{"))
                {
                    var dict = JsonConvert.DeserializeObject<Dictionary<string, object>>(trimmed);
                    if (dict != null && dict.TryGetValue("permission", out var permVal) && permVal != null)
                    {
                        string permStr = permVal.ToString().Trim();
                        if (permStr.StartsWith("[") && permStr.EndsWith("]"))
                        {
                            var roles = JsonConvert.DeserializeObject<List<string>>(permStr);
                            if (roles != null)
                            {
                                list.AddRange(roles.Select(r => r.Trim().ToUpper()));
                                return list;
                            }
                        }
                        else
                        {
                            list.AddRange(permStr.Split(',').Select(r => r.Trim().ToUpper()));
                            return list;
                        }
                    }
                }

                var arrayRoles = JsonConvert.DeserializeObject<List<string>>(trimmed);
                if (arrayRoles != null)
                {
                    list.AddRange(arrayRoles.Select(r => r.Trim().ToUpper()));
                    return list;
                }
            }
            catch { }
        }
        
        // Fallback to comma separation
        list.AddRange(trimmed.Split(',').Select(r => r.Trim().ToUpper()));
        return list;
    }

    private static bool TryParsePermissionGroups(string pageSystem, out HashSet<string> permissionGroups)
    {
        permissionGroups = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        if (string.IsNullOrWhiteSpace(pageSystem)) return false;

        try
        {
            var pageSystemObject = JObject.Parse(pageSystem);
            var permissionProperty = pageSystemObject.Properties().FirstOrDefault(property =>
                string.Equals(property.Name, "permission", StringComparison.OrdinalIgnoreCase));

            if (permissionProperty == null) return false;

            var permissionToken = permissionProperty.Value;
            if (permissionToken.Type == JTokenType.Array)
            {
                foreach (var group in permissionToken.Values<string>())
                {
                    AddPermissionGroups(permissionGroups, group);
                }
            }
            else
            {
                AddPermissionGroups(permissionGroups, permissionToken.ToString());
            }

            return true;
        }
        catch (JsonException)
        {
            return false;
        }
    }

    private static void AddPermissionGroups(HashSet<string> permissionGroups, string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return;

        var trimmedValue = value.Trim();
        if (trimmedValue.StartsWith("[") && trimmedValue.EndsWith("]"))
        {
            try
            {
                var groups = JsonConvert.DeserializeObject<List<string>>(trimmedValue);
                if (groups != null)
                {
                    foreach (var group in groups)
                    {
                        AddPermissionGroups(permissionGroups, group);
                    }

                    return;
                }
            }
            catch (JsonException)
            {
                // Continue with the delimited-string parser below.
            }
        }

        foreach (var group in trimmedValue.Split(
                     new[] { ',', ';', '|' },
                     StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            permissionGroups.Add(group);
        }
    }

    private static bool IsSlaMenu(Menu menu)
    {
        return string.Equals(menu.Name?.Trim(), "SLA", StringComparison.OrdinalIgnoreCase)
               || (!string.IsNullOrWhiteSpace(menu.ActionUri)
                   && menu.ActionUri.Contains("/Config/SLA", StringComparison.OrdinalIgnoreCase));
    }

    private static bool CanViewSlaMenu(Menu menu, Employee? employee)
    {
        if (!IsSlaMenu(menu) || !TryParsePermissionGroups(menu.PageSystem, out var permissionGroups))
        {
            return true;
        }

        var employeeRole = employee?.SystemRolesFK?.RoleName?.Trim();
        if (string.Equals(employeeRole, "IT", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        var employeeGroup = employee?.Department?.Trim();
        return !string.IsNullOrWhiteSpace(employeeGroup) && permissionGroups.Contains(employeeGroup);
    }

    [HttpGet]
    public async Task<ActionResult<Menu>> GetHierarchyMenu(string pageSystem)
    {
        var result = new List<MenuHierarchy>();
        string loginAccount = ControllerUtil.GetCurrentContextUser(_httpContextAccessor, _configuration);
        bool isSuperUser = ControllerUtil.IsSuperUser(_configuration, loginAccount);
        var roles = await _BaseRepository.GetUserRoles(loginAccount, isSuperUser);
        if (isSuperUser && roles == null)
        {
            roles = new
            {
                RoleName = "SuperUser",
                Department = "",
                DisplayName = loginAccount,
                LoginName = loginAccount,
                Branch = "",
                RoleAppName = "SuperUser"
            };
        }

        // Get user's role name
        string userRole = "";
        if (roles != null)
        {
            try
            {
                var prop = roles.GetType().GetProperty("RoleName");
                if (prop != null)
                {
                    userRole = prop.GetValue(roles)?.ToString() ?? "";
                }
                else
                {
                    dynamic dynamicRoles = roles;
                    userRole = dynamicRoles.RoleName?.ToString() ?? "";
                }
            }
            catch { }
        }

        if (isSuperUser)
        {
            List<Menu> menus = new List<Menu>();
            IBaseRepository<Menu> _menuRepository = new BaseRepository<Menu>(_configuration, _httpContextAccessor);
            menus = await _menuRepository.GetAllActive();
            result = menus.OrderBy(x => x.ParentId).Select(x => new MenuHierarchy
            {
                Id = x.Id,
                Name = x.Name,
                Caption = x.Caption,
                Action = $"{x.ActionUri}{x.Parameter}",
                ParentId = x.ParentId,
                HasItems = menus.Any(y => y.ParentId == x.Id),
                HasPermission = true,
                SortOrder = x.SortOrder.GetValueOrDefault(),
                Icon = x.Icon,
                PageSystem = x.PageSystem
            }).ToList();
        }
        else
        {
            List<Users> users = await _usersRepository.GetAll();
            if (users.Any(a => a.username == loginAccount))
            {
                Users user = users.First(a => a.username == loginAccount);
                Employee? employee = await _employeeRepository.GetSingleObjectFullInclude(
                    e => e.AccountName == loginAccount,
                    null,
                    e => e.SystemRolesFK);
                List<UserRoles> userRoles = new List<UserRoles>();  
                userRoles = await _userRolesRepository.GetAll();
                userRoles = userRoles.Where(w => w.UserId == user.Id).ToList();
                
                List<Menu> menus = new List<Menu>();
                IBaseRepository<Menu> _menuRepository = new BaseRepository<Menu>(_configuration, _httpContextAccessor);
                menus = await _menuRepository.GetAllActive();
                
                var permittedMenuIds = userRoles.Select(userRoleItem => userRoleItem.MenuId).ToHashSet();
                menus = menus.Where(menu =>
                {
                    bool hasSlaPermission = IsSlaMenu(menu)
                                            && TryParsePermissionGroups(menu.PageSystem, out _);
                    bool hasConfiguredPermission = permittedMenuIds.Contains(menu.Id)
                                                   || (hasSlaPermission
                                                       ? CanViewSlaMenu(menu, employee)
                                                       : (!string.IsNullOrEmpty(menu.PageSystem)
                                                          && ParseAllowedRoles(menu.PageSystem)
                                                              .Contains(userRole.Trim().ToUpper())));

                    return hasConfiguredPermission && CanViewSlaMenu(menu, employee);
                }).ToList();

                result = menus.OrderBy(x => x.ParentId).Select(x => new MenuHierarchy
                {
                    Id = x.Id,
                    Name = x.Name,
                    Caption = x.Caption,
                    Action = $"{x.ActionUri}{x.Parameter}",
                    ParentId = x.ParentId,
                    HasItems = menus.Any(y => y.ParentId == x.Id),
                    HasPermission = true,
                    SortOrder = x.SortOrder.GetValueOrDefault(),
                    Icon = x.Icon,
                    PageSystem = x.PageSystem
                }).ToList();
            }
        }

        var selectedEnvironment = HttpContext.Session
            .GetString(ERPCore.ControllerUtil.ControllerUtil.ConnectionEnvironmentSessionKey) ?? "Default";
        selectedEnvironment = ERPCore.ControllerUtil.ControllerUtil
            .NormalizeConnectionEnvironment(selectedEnvironment);
        var jogetEnvironment = selectedEnvironment == "Default" ? "Joget" : "UATJoget";

        if (roles != null)
            return Ok(new
            {
                Menu = result,
                UserRoles = roles,
                Environment = selectedEnvironment,
                JogetEnvironment = jogetEnvironment
            });
        else
        {
            return Ok(new
            {
                UserRoles = roles,
                Environment = selectedEnvironment,
                JogetEnvironment = jogetEnvironment
            });
        }
    }

    public override async Task<ActionResult<List<dynamic>>> GetSystemScheme()
    {
        var entity = new Menu();
        dynamic Base = await _BaseRepository.GetSystemScheme(entity);
        List<DataGridConfig> dataGridConfigs = new List<DataGridConfig>();
        dataGridConfigs.AddRange(JsonConvert.DeserializeObject<List<DataGridConfig>>(JsonConvert.SerializeObject(Base)));
        dataGridConfigs.ForEach(f =>
        {
            if (f.DataField == "name" || f.DataField == "caption")
            {
                f.Fixed = true;
                f.FixedPosition = "left";
            }
        });
        dataGridConfigs = dataGridConfigs.Select(s => { if (s.DataField == "sysTableId") { s.DataType = "table"; }; return s; }).ToList();
        return Ok(dataGridConfigs);
    }

}

