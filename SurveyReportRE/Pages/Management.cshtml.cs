using DocumentFormat.OpenXml.InkML;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.Extensions.Configuration;
using System.Security.Claims;
using System.Security.Principal;
namespace ERPCore.Pages
{
    public class ManagementModel : PageModel
    {
        private readonly ILogger<ManagementModel> _logger;
        private string HostUrl { get; set; } = "";
        private bool IsSuperUser { get; set; }
        private bool IsDebugMode { get; set; }
        private bool NotifyEnv { get; set; }
        private readonly IConfiguration _configuration;

        public ManagementModel(
            ILogger<ManagementModel> logger,
            IConfiguration configuration,
            IHttpContextAccessor httpContextAccessor,
            IWebHostEnvironment hostEnvironment)
        {
            _logger = logger;
            _configuration = configuration;
            //string checkIfLoginAsDebug = configuration.GetSection("SuperUser:LoginAs").Value;
            bool isDebugMode = false;
            ControllerUtil.ControllerUtil.ContextHandle(httpContextAccessor, configuration, out isDebugMode);
            //if (!string.IsNullOrEmpty(checkIfLoginAsDebug))
            //{
            //    {
            //        var newIdentity = new ClaimsIdentity();
            //        newIdentity.AddClaim(new System.Security.Claims.Claim(newIdentity.NameClaimType, checkIfLoginAsDebug));
            //        httpContextAccessor.HttpContext.User = new ClaimsPrincipal(newIdentity);
            //    }
            //}
            //var session = httpContextAccessor.HttpContext.Session;
            //if (session != null && session.TryGetValue("ImpersonatedUser", out var userData))
            //{
            //    var impersonatedUser = System.Text.Encoding.UTF8.GetString(userData);
            //    if (!string.IsNullOrWhiteSpace(impersonatedUser))
            //    {
            //        //var newIdentity = new ClaimsIdentity(new[]
            //        //{
            //        //new Claim(ClaimTypes.Name, impersonatedUser),
            //        //new Claim(ClaimTypes.Role, "User")
            //        //}, "Impersonation");

            //        //httpContextAccessor.HttpContext.User = new ClaimsPrincipal(newIdentity);
            //        var newIdentity = new ClaimsIdentity();
            //        newIdentity.AddClaim(new System.Security.Claims.Claim(newIdentity.NameClaimType, impersonatedUser));
            //        httpContextAccessor.HttpContext.User = new ClaimsPrincipal(newIdentity);
            //   }
            //}
                IsSuperUser = ControllerUtil.ControllerUtil.IsSuperUser(
                    configuration,
                    ControllerUtil.ControllerUtil.GetCurrentContextUser(httpContextAccessor, configuration));
#if DEBUG
                var debugEnv = bool.TryParse(
                    _configuration.GetSection("SuperUser:IsDebug").Value,
                    out var configuredDebug) && configuredDebug;
                NotifyEnv = hostEnvironment.IsDevelopment() && debugEnv;
#else
                NotifyEnv = false;
#endif
                IsDebugMode = isDebugMode
                    || string.Equals(
                        httpContextAccessor.HttpContext?.User?.Identity?.AuthenticationType,
                        "Impersonation",
                        StringComparison.OrdinalIgnoreCase)
                    || httpContextAccessor.HttpContext?.Request.Cookies.ContainsKey("ImpersonatedUser") == true;
        }

        public void OnGet(string loadParams)
        {
            //var windowsIdentity = WindowsIdentity.GetCurrent();
            ViewData["IsSuperUser"] = IsSuperUser ? "true" : "false";
            ViewData["IsDebugMode"] = IsDebugMode ? "true" : "false";
            ViewData["NotifyEnv"] = NotifyEnv ? "true" : "false";
            if (!string.IsNullOrEmpty(loadParams))
                ViewData["LoadParams"] = loadParams;
            ViewData[nameof(HostUrl)] = _configuration.GetSection("UrlConfig:Host").Value;
            var selectedEnvironment = HttpContext.Session
                .GetString(ControllerUtil.ControllerUtil.ConnectionEnvironmentSessionKey) ?? "Default";
            selectedEnvironment = ControllerUtil.ControllerUtil.NormalizeConnectionEnvironment(selectedEnvironment);
            ViewData["Environment"] = selectedEnvironment;
            ViewData["JogetEnvironment"] = selectedEnvironment == "Default" ? "Joget" : "UATJoget";
        }
    }
}
