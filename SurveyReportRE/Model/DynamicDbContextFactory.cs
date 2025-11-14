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
        string profile = _httpContextAccessor.HttpContext?.Session.GetString("CurrentDbProfile") ?? "Default";
        var connectionString = _config.GetConnectionString(profile);

        var optionsBuilder = new DbContextOptionsBuilder<DbContext>();
        //optionsBuilder.UseSqlServer(connectionString);

        return new DbContext(optionsBuilder.Options);
    }
}
