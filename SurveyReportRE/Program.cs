using Microsoft.AspNetCore.Authentication.Negotiate;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using Microsoft.Extensions.Configuration;
using ERPCore.Models.Config;
using SautinSoft.Document;
using Serilog;
using Serilog.Events;
using Serilog.Sinks.MSSqlServer;
using ERPCore.Controllers.Base;
using ERPCore.Models.Base;
using ERPCore.Models.Business.Migration.Config;
using Syncfusion.Licensing;
using TMIVHashing;
using Microsoft.Data.SqlClient;

//Generate once
string projectId = "9A19103F16F74668BE549A1E7A4F75";
string randomKey = TMIVHashing.SaltKey.GenerateSalt32_Hex();
var enc = SaltKey.EncryptECB(randomKey, projectId);
string encryptKey = KeyVaultLocal.EncryptKey("password@123", System.Environment.GetEnvironmentVariable("ApplicationSecretKey", EnvironmentVariableTarget.Machine), randomKey); ;
//




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
    options.KeepAliveInterval = TimeSpan.FromSeconds(double.Parse(builder.Configuration.GetSection("SignalRConfig:KeepAliveInterval").Value));
    options.ClientTimeoutInterval = TimeSpan.FromSeconds(double.Parse(builder.Configuration.GetSection("SignalRConfig:ClientTimeoutInterval").Value)); // client timeout > keepalive
});
builder.Services.AddControllers();
builder.Services.AddScoped(typeof(IBaseRepository<>), typeof(BaseRepository<>));
builder.Services.AddScoped(typeof(IHttpRequestAuditLogWriter), typeof(HttpRequestAuditLogWriter));
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddSingleton(connectionString);

//-------------------------------------------
//Comment out if Allow anomymous for debugging 
builder.Services.AddAuthentication(NegotiateDefaults.AuthenticationScheme)
    .AddNegotiate();
builder.Services.AddAuthorization(options =>
{
    // By default, all incoming requests will be authorized according to the default policy.
    options.FallbackPolicy = options.DefaultPolicy;
});

//-------------------------------------------


builder.Services.AddHttpContextAccessor();
builder.Services.AddSingleton<IHttpContextAccessor, HttpContextAccessor>();


builder.Services.Configure<BlobStorageSettings>(builder.Configuration.GetSection("BlobStorage"));
builder.Services.Configure<BusinessConfig>(builder.Configuration.GetSection("BusinessConfig"));
builder.Services.Configure<TemplateUsing>(builder.Configuration.GetSection("TemplateUsing"));
builder.Services.AddRazorPages()
    .WithRazorPagesRoot("/Pages");
builder.Services.Configure<KestrelServerOptions>(options =>
{//Request body too large. The max request body size is ... exception
    options.Limits.MaxRequestBodySize = null; // 52428800 50MB
    //options.ListenAnyIP(5000); // HTTP
    //options.ListenLocalhost(5001, listenOptions =>
    //{// 
    //    listenOptions.UseHttps(https =>
    //    {
    //        https.ServerCertificate = new System.Security.Cryptography.X509Certificates.X509Certificate2(
    //            builder.Configuration["Kestrel:Certificates:Default:Path"],
    //            builder.Configuration["Kestrel:Certificates:Default:Password"]);

    //        https.SslProtocols = SslProtocols.Tls12 | SslProtocols.Tls13;

    //    });

    //    listenOptions.UseConnectionLogging();
    //});
});
builder.Services.AddSession();
builder.Services.AddDataProtection()
    .PersistKeysToFileSystem(new DirectoryInfo(@"C:\AppKeys\MyApp"))
    .SetApplicationName("TMIV.MyApp");
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



//-------------------------------------------
//Comment out if Allow anomymous for debugging 
app.UseAuthentication();
app.UseAuthorization();
//-------------------------------------------



app.MapRazorPages();
app.MapControllers();
app.MapHub<FileProcessingHub>("/fileProcessingHub");
app.UseMiddleware<CookieImpersonationMiddleware>();
app.UseMiddleware<HttpRequestAuditMiddleware>();
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
    context.Items["RequestSource"] =
     context.Request.Headers["X-Request-Source"].FirstOrDefault() ?? "unknown";
    await next();
});


app.Run();