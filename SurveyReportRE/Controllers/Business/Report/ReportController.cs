using DocumentFormat.OpenXml.Office2013.Excel;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using Serilog;
using ERPCore.Common;
using ERPCore.Controllers.Base;
using ERPCore.ControllerUtil;
using ERPCore.Models.Base;
using ERPCore.Models.Migration.Business.Config;
using ERPCore.Models.Migration.Business.Data;
using ERPCore.Models.Migration.Business.Form;
using ERPCore.Models.Migration.Business.HumanResource;
using ERPCore.Models.Migration.Business.MasterData;
using ERPCore.Models.Migration.Business.Workflow;
using ERPCore.Models.Request;
using ERPCore.Repository;
using Syncfusion.Pdf.Graphics;
using System.Data;
using System.Net;
using ERPCore.Models.Models.Parsing;

[ApiController]
[Route("api/[controller]/[action]")]
public class ReportController : BaseControllerApi<EmptyClass>
{
    private readonly IBaseRepository<EmptyClass> _BaseRepository;
    private readonly IConfiguration configuration;
    private readonly IConfigurationSection path;
    private static string BLOB_PATH = "";
    public static string CURRENT_USER = "";
    public ReportController(IBaseRepository<EmptyClass> BaseRepository, IConfiguration config, IHttpContextAccessor httpContextAccessor, ILogger<EmptyClass> logger) : base(BaseRepository, httpContextAccessor)
    {
        configuration = config;
        _BaseRepository = BaseRepository;
        path = _BaseRepository._baseConfiguration.GetSection("BlobStorage:Path");
        BLOB_PATH = path.Value;
        CURRENT_USER = _httpContextAccessor.HttpContext.User.Identity.Name.Replace(DOMAIN_NAME, "");
    }
    public async Task<object> InstanceByRecord()
    {
        string baseQuery = $"EXEC usp_Instance_By_Record";

        List<Dictionary<string, object>> result =
            await _BaseRepository.ExecuteCustomQuery(baseQuery);

        return result;
    }

}