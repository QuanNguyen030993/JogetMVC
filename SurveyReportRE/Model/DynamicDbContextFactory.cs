using Microsoft.EntityFrameworkCore;
using System;

public class DynamicDbContextFactory
{
    private readonly IConfiguration _config;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public DynamicDbContextFactory(IConfiguration config, IHttpContextAccessor httpContextAccessor)
    {
        _config = config;
        _httpContextAccessor = httpContextAccessor;
    }

    public DbContext CreateDbContext()
    {
        var selectedEnvironment = _httpContextAccessor.HttpContext?.Session
            .GetString(ERPCore.ControllerUtil.ControllerUtil.ConnectionEnvironmentSessionKey) ?? "Default";
        var defaultProfile = ERPCore.ControllerUtil.ControllerUtil.GetApplicationConnectionName(selectedEnvironment);
        string profile = _httpContextAccessor.HttpContext?.Session
            .GetString(ERPCore.ControllerUtil.ControllerUtil.DatabaseProfileSessionKey) ?? defaultProfile;
        var connectionString = _config.GetConnectionString(profile);

        var optionsBuilder = new DbContextOptionsBuilder<DbContext>();
        //optionsBuilder.UseSqlServer(connectionString);

        return new DbContext(optionsBuilder.Options);
    }
}
