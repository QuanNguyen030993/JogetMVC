using DocumentFormat.OpenXml.InkML;
using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.Extensions.Configuration;
using System.Security.Claims;
using System.Security.Principal;
namespace SurveyReportRE.Pages
{
    public class ManagementModel : PageModel
    {
        private readonly ILogger<ManagementModel> _logger;
        private static string HostUrl { get; set; } = "";
        private static bool IsSuperUser { get; set; } = false;
        private static bool IsDebugMode { get; set; } = false;
        IConfiguration _configuration;

        public ManagementModel(ILogger<ManagementModel> logger, IConfiguration configuration, IHttpContextAccessor httpContextAccessor)
        {
            _logger = logger;
            _configuration = configuration;
            //string checkIfLoginAsDebug = configuration.GetSection("SuperUser:LoginAs").Value;
            bool isDebugMode = false;
            string superUsers = _configuration.GetSection("SuperUser:SuperUser").Value;
            ControllerUtil.ControllerUtil.ContextHandle(httpContextAccessor, configuration,out isDebugMode);
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
            //    }
            //}
            IsSuperUser = superUsers.Contains(httpContextAccessor.HttpContext.User.Identity.Name.Replace(@"TOKIOMARINE\", @""));
            var DebugEnv = bool.Parse(_configuration.GetSection("SuperUser:IsDebug").Value);
            if (DebugEnv)
            {
                IsSuperUser = true;
                IsDebugMode = isDebugMode;
            }
        }

        public void OnGet(string loadParams)
        {
            //var windowsIdentity = WindowsIdentity.GetCurrent();
            var loginUser = User.Identity.Name.Replace(@"\", @"\\");
            ViewData["LoginUser"] = loginUser;
            ViewData["IsSuperUser"] = IsSuperUser ? "true" : "false";
            ViewData["IsDebugMode"] = IsDebugMode ? "true" : "false";
            if (!string.IsNullOrEmpty(loadParams))
            ViewData["LoadParams"] = loadParams;
            ViewData[nameof(HostUrl)] = _configuration.GetSection("UrlConfig:Host").Value;
        }
    }
}
