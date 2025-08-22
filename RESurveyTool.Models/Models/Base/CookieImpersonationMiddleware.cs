using Microsoft.AspNetCore.Http;
using Serilog.Context;
using SurveyReportRE.Models.Migration.Business.Config;
using System.Security.Claims;

public class CookieImpersonationMiddleware
{
    private readonly RequestDelegate _next;

    public CookieImpersonationMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task Invoke(HttpContext context)
    {
        LogContext.PushProperty("User", context.User.Identity.Name);

        if (context.Request.Cookies.TryGetValue("ImpersonatedUser", out var impersonatedUser) &&
            !string.IsNullOrWhiteSpace(impersonatedUser))
        {
            var newIdentity = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.Name, impersonatedUser),
                new Claim(ClaimTypes.Role, "User")
            }, "Impersonation");

            context.User = new ClaimsPrincipal(newIdentity);
        }

        await _next(context);
    }
}