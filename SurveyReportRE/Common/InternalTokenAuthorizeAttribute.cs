using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Configuration;

public class InternalTokenAuthorizeAttribute : Attribute, IAuthorizationFilter
{
    private readonly string _configKey;
    private readonly string _headerName;

    public InternalTokenAuthorizeAttribute(
        string configKey = "InternalAuth:Token",
        string headerName = "X-Internal-Token")
    {
        _configKey = configKey;
        _headerName = headerName;
    }

    public void OnAuthorization(AuthorizationFilterContext context)
    {
        var config = context.HttpContext.RequestServices.GetService(typeof(IConfiguration)) as IConfiguration;
        var expected = config?[_configKey];

        if (string.IsNullOrWhiteSpace(expected))
        {
            context.Result = new StatusCodeResult(500); // server misconfig
            return;
        }

        if (!context.HttpContext.Request.Headers.TryGetValue(_headerName, out var provided) ||
            string.IsNullOrWhiteSpace(provided) ||
            !string.Equals(provided.ToString(), expected, StringComparison.Ordinal))
        {
            context.Result = new UnauthorizedObjectResult(new { message = "Invalid token" });
            return;
        }
    }
}
