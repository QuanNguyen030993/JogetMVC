using Microsoft.AspNetCore.Authentication.Negotiate;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using Microsoft.Extensions.Configuration;
using SautinSoft.Document;
using Serilog;
using Serilog.Events;
using Serilog.Sinks.MSSqlServer;
using SurveyReportRE.Controllers.Base;
using SurveyReportRE.Models.Base;
using Syncfusion.Licensing;

var builder = WebApplication.CreateBuilder(args);
var logger = new LoggerConfiguration()
                    .ReadFrom.Configuration(builder.Configuration)
                    .Enrich.FromLogContext()
                    //.Filter.ByIncludingOnly(logEvent =>
                    //     logEvent.Level == LogEventLevel.Error || logEvent.Level == LogEventLevel.Warning || logEvent.Level == LogEventLevel.Information
                    //)
                    .CreateLogger();
Log.Logger = logger;

string sautinSoftLicenseKey = builder.Configuration.GetSection("SautinSoft:License").Value;
DocumentCore.SetLicense(sautinSoftLicenseKey);

string syncFusionLicenseKey = builder.Configuration.GetSection("SyncFusion:License").Value;
SyncfusionLicenseProvider.RegisterLicense(syncFusionLicenseKey);
//DocumentCore.SetLicense("02/26/25lwJXCdObHRqi528wQkazMw2HQGaaAoND29");
//SautinSoft.Document.DocumentCore.SetLicense("02/27/25KZgZQD+W+tqaOkSILtR+ZO1Ijl4CQqgI55");
// Add services to the container.
//Set default index
builder.Services.AddRazorPages(options => {
});
builder.Services.AddMvc().AddRazorRuntimeCompilation();
builder.Services.AddControllersWithViews();
builder.Services.AddSignalR(options => {
    options.KeepAliveInterval = TimeSpan.FromSeconds(28800);
    options.ClientTimeoutInterval = TimeSpan.FromSeconds(28800); // client timeout > keepalive
});
builder.Services.AddControllers();
builder.Services.AddScoped(typeof(IBaseRepository<>), typeof(BaseRepository<>));
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddSingleton(connectionString);


builder.Services.AddAuthentication(NegotiateDefaults.AuthenticationScheme)
    .AddNegotiate();
builder.Services.AddAuthorization(options =>
{
    // By default, all incoming requests will be authorized according to the default policy.
    options.FallbackPolicy = options.DefaultPolicy;
});
builder.Services.AddHttpContextAccessor();
builder.Services.AddSingleton<IHttpContextAccessor, HttpContextAccessor>();


builder.Services.Configure<BlobStorageSettings>(builder.Configuration.GetSection("BlobStorage"));
builder.Services.AddRazorPages()
    .WithRazorPagesRoot("/Pages");
builder.Services.Configure<KestrelServerOptions>(options =>
{//Request body too large. The max request body size is ... exception
    options.Limits.MaxRequestBodySize = null; // 52428800 50MB
    //options.ListenLocalhost(5000, listenOptions =>
    //{
    //    listenOptions.UseHttps();
    //    listenOptions.UseConnectionLogging();
    //});
});
builder.Services.AddSession();

builder.Host.UseSerilog(logger);

var app = builder.Build();
//app.MapGet("/", () => "Hello World!");
// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    app.UseHsts();
}
app.UseHttpsRedirection();
app.UseSerilogRequestLogging();
app.UseStaticFiles();

app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();

app.MapRazorPages();
app.MapControllers();
app.MapHub<FileProcessingHub>("/fileProcessingHub");
app.UseMiddleware<CookieImpersonationMiddleware>();
app.UseSession();
app.MapDefaultControllerRoute();
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");
//pattern: "{controller=Home}/{action=Index}/{id?}");



app.Use(async (context, next) =>
{
    if (context.Request.Path == "/")
    {
        context.Response.Redirect("/Management");
        //context.Response.Redirect("/DemoLibs");
        return;
    }
    await next();
});


app.Run();