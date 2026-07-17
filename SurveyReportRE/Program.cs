using Microsoft.AspNetCore.Authentication.Negotiate;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using Microsoft.AspNetCore.StaticFiles;
using ERPCore.Models.Config;
using SautinSoft.Document;
using Serilog;
using ERPCore.Models.Base;
using ERPCore.Models.Business.Migration.Config;
using Syncfusion.Licensing;
using TMIVHashing;
using ERPCore.ControllerUtil;
using Serilog.Events;
using Microsoft.AspNetCore.SignalR;

//Generate once
//string projectId = "9A19103F16F74668BE549A1E7A4F75";
//string randomKey = TMIVHashing.SaltKey.GenerateSalt32_Hex();
//var enc = SaltKey.EncryptECB(randomKey, projectId);
//string encryptKey = KeyVaultLocal.EncryptKey("password@123", System.Environment.GetEnvironmentVariable("ApplicationSecretKey", EnvironmentVariableTarget.Machine), randomKey); ;

//string encryptedKey = KeyVaultLocal.EncryptConnectionStringPassword("", "ApplicationSecretKey", "ApplicationSaltKey", 10);
//////string passwordSimpleFail = KeyVaultLocal.DecryptKey(encryptedKey, localKey, saltKey);
//string password = KeyVaultLocal.DecryptConnectionStringPassword(encryptedKey, "ApplicationSecretKey", "ApplicationSaltKey", 10);




var builder = WebApplication.CreateBuilder(args);
string connectionLogString = "";
try
{
    var rawConnectionString = builder.Configuration.GetConnectionString("LogConnection");
    if (!string.IsNullOrEmpty(rawConnectionString))
    {
        connectionLogString = ControllerUtil.ParseConnectionString(rawConnectionString, builder.Configuration);
    }
}
catch (Exception ex)
{
    Console.WriteLine($"Error parsing connection string for LogConnection: {ex.Message}");
}

var config = builder.Configuration.GetFileProvider();
var loggerConfiguration = new LoggerConfiguration()
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
    .MinimumLevel.Override("System", LogEventLevel.Warning)
                    .Enrich.FromLogContext()
                    .WriteTo.Console()
    .WriteTo.File(
        path: Path.Combine(builder.Environment.ContentRootPath, "Logs", "app-log-.txt"),
        restrictedToMinimumLevel: LogEventLevel.Information,
        rollingInterval: RollingInterval.Day
    );

if (!string.IsNullOrEmpty(connectionLogString))
{
    loggerConfiguration.WriteTo.Logger(lc => lc
        .Filter.ByIncludingOnly(logEvent =>
             logEvent.Level == LogEventLevel.Warning || 
             logEvent.Level == LogEventLevel.Error || 
             logEvent.Level == LogEventLevel.Fatal
        )
                    .WriteTo.MSSqlServer(
            connectionString: connectionLogString,
                            sinkOptions: new Serilog.Sinks.MSSqlServer.MSSqlServerSinkOptions
                            {
                                TableName = "Logs",
                                AutoCreateSqlTable = true
                            }
                        )
    );
}

Log.Logger = loggerConfiguration.CreateLogger();
builder.Host.UseSerilog(Log.Logger);


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
builder.Services.AddSingleton<MemoryPresenceStore>();
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
builder.Services.AddCors(options => // React debug
{
    options.AddPolicy("AllowFrontend",
        policy =>
        {
            policy.WithOrigins("http://localhost:5173", "http://localhost:5174", "http://localhost:5175")
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        });
});
var app = builder.Build();
FileProcessingHub.Configure(
    app.Services.GetRequiredService<MemoryPresenceStore>(),
    app.Services.GetRequiredService<IHubContext<FileProcessingHub>>());
//app.MapGet("/", () => "Hello World!");
// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    app.UseHsts();
}
app.UseCors("AllowFrontend");
app.UseHttpsRedirection();
app.UseSerilogRequestLogging();
var contentTypeProvider = new FileExtensionContentTypeProvider();
contentTypeProvider.Mappings[".doc"] = "application/msword";
contentTypeProvider.Mappings[".docx"] = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
contentTypeProvider.Mappings[".xls"] = "application/vnd.ms-excel";
contentTypeProvider.Mappings[".xlsx"] = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
contentTypeProvider.Mappings[".ppt"] = "application/vnd.ms-powerpoint";
contentTypeProvider.Mappings[".pptx"] = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
app.UseStaticFiles(new StaticFileOptions
{
    ContentTypeProvider = contentTypeProvider
});

app.UseRouting();
app.UseSession();

//app.UseCors(); // not debug React

//-------------------------------------------
//Comment out if Allow anomymous for debugging 
app.UseAuthentication();
if (app.Environment.IsDevelopment()
    && builder.Configuration.GetValue<bool>("SuperUser:IsDebug"))
{
    app.Use(async (context, next) =>
    {
        const string developmentUser = "quan.nh";
        var identity = new System.Security.Claims.ClaimsIdentity(
            new[]
            {
                new System.Security.Claims.Claim(
                    System.Security.Claims.ClaimTypes.Name,
                    developmentUser)
            },
            authenticationType: "DevelopmentUser",
            nameType: System.Security.Claims.ClaimTypes.Name,
            roleType: System.Security.Claims.ClaimTypes.Role);

        context.User = new System.Security.Claims.ClaimsPrincipal(identity);
        await next();
    });
}
app.UseMiddleware<CookieImpersonationMiddleware>();
app.UseAuthorization();
app.UseMiddleware<HttpRequestAuditMiddleware>();
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