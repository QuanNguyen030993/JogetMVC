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

[ApiController]
[Route("api/[controller]/[action]")]
public class MenuController : BaseControllerApi<Menu>
{
    private readonly IBaseRepository<Menu> _BaseRepository;
    private readonly IBaseRepository<Users> _usersRepository;
    private readonly IBaseRepository<UserRoles> _userRolesRepository;
    private readonly IBaseRepository<UsersSession> _userSessionRepository;
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
        if (trimmed.StartsWith("[") && trimmed.EndsWith("]"))
        {
            try
            {
                var roles = JsonConvert.DeserializeObject<List<string>>(trimmed);
                if (roles != null)
                {
                    list.AddRange(roles.Select(r => r.Trim().ToUpper()));
                    return list;
                }
            }
            catch { }
        }
        
        // Fallback to comma separation
        list.AddRange(trimmed.Split(',').Select(r => r.Trim().ToUpper()));
        return list;
    }

    [HttpGet]
    public async Task<ActionResult<Menu>> GetHierarchyMenu(string pageSystem)
    {
        var result = new List<MenuHierarchy>();
        string superUsers = _configuration.GetSection("SuperUser:SuperUser").Value;
        string loginAccount = ControllerUtil.GetCurrentContextUser(_httpContextAccessor, _configuration);
        bool isSuperUser = superUsers.Contains(loginAccount);
        var roles = await _BaseRepository.GetUserRoles(loginAccount, isSuperUser);

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
                List<UserRoles> userRoles = new List<UserRoles>();  
                userRoles = await _userRolesRepository.GetAll();
                userRoles = userRoles.Where(w => w.UserId == user.Id).ToList();
                
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
                }).Where(w => 
                    // 1. Explicitly configured in UserRoles table
                    (userRoles.Count > 0 && userRoles.Select(s => s.MenuId).Contains(w.Id)) ||
                    // 2. Or user's role is in AllowedRoles list stored in PageSystem JSON
                    (!string.IsNullOrEmpty(w.PageSystem) && 
                     ParseAllowedRoles(w.PageSystem).Contains(userRole.Trim().ToUpper()))
                ).ToList();
            }
        }

        if (roles != null)
            return Ok(new { Menu = result, UserRoles = roles });
        else
        {
            return Ok(new { UserRoles = roles });
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

