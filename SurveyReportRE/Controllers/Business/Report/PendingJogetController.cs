using DocumentFormat.OpenXml.Office2013.Excel;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using Serilog;
using SurveyReportRE.Common;
using SurveyReportRE.Controllers.Base;
using SurveyReportRE.ControllerUtil;
using SurveyReportRE.Models.Base;
using SurveyReportRE.Models.Migration.Business.Config;
using SurveyReportRE.Models.Migration.Business.Data;
using SurveyReportRE.Models.Migration.Business.Form;
using SurveyReportRE.Models.Migration.Business.HumanResource;
using SurveyReportRE.Models.Migration.Business.MasterData;
using SurveyReportRE.Models.Migration.Business.Workflow;
using SurveyReportRE.Models.Request;
using SurveyReportRE.Repository;
using Syncfusion.Pdf.Graphics;
using System.Data;
using System.Net;

[ApiController]
[Route("api/[controller]/[action]")]
public class PendingJogetController : BaseControllerApi<PendingJoget>
{
    private readonly IBaseRepository<PendingJoget> _BaseRepository;
    private readonly IConfiguration configuration;
    private readonly IBaseRepository<Survey> _surveyRepository;
    private readonly IBaseRepository<Attachment> _attachmentRepository;
    private readonly IBaseRepository<Employee> _employeeRepository;
    private readonly IBaseRepository<Users> _usersRepository;
    private readonly IBaseRepository<UserRoles> _userRolesRepository;
    private readonly IBaseRepository<Roles> _rolesRepository;
    private readonly IConfigurationSection path;
    public static string MANAGER_APP = "";
    public static string APPROVER_APP = "";
    public static string CHECKER_APP = "";
    public static string USER_APP = "";
    public static string SUPER_USER = "";
    public static string DOMAIN_NAME = "";
    private static string BLOB_PATH = "";
    public static string CURRENT_USER = "";
    public PendingJogetController(IBaseRepository<PendingJoget> BaseRepository, IConfiguration config, IHttpContextAccessor httpContextAccessor, ILogger<PendingJoget> logger) : base(BaseRepository, httpContextAccessor)
    {
        configuration = config;
        _BaseRepository = BaseRepository;
        _surveyRepository = new BaseRepository<Survey>(configuration, _httpContextAccessor);
        _attachmentRepository = new BaseRepository<Attachment>(configuration, _httpContextAccessor);
        _employeeRepository = new BaseRepository<Employee>(configuration, _httpContextAccessor);
        _usersRepository = new BaseRepository<Users>(configuration, _httpContextAccessor);
        _userRolesRepository = new BaseRepository<UserRoles>(configuration, _httpContextAccessor);
        _rolesRepository = new BaseRepository<Roles>(configuration, _httpContextAccessor);
        MANAGER_APP = configuration.GetSection("BusinessConfig:ManagerAppKey").Value;
        APPROVER_APP = configuration.GetSection("BusinessConfig:ApproverAppKey").Value;
        CHECKER_APP = configuration.GetSection("BusinessConfig:CheckerAppKey").Value;
        USER_APP = configuration.GetSection("BusinessConfig:UserAppKey").Value;
        SUPER_USER = configuration.GetSection("SuperUser:SuperUser").Value;
        DOMAIN_NAME = configuration.GetSection("Domain:DCServer").Value;
        path = _BaseRepository._baseConfiguration.GetSection("BlobStorage:Path");
        BLOB_PATH = path.Value;
        CURRENT_USER = _httpContextAccessor.HttpContext.User.Identity.Name.Replace(DOMAIN_NAME, "");
    }
    [HttpPost]
    public override async Task<object> ExecuteCustomQuery([FromBody] string query)
    {

        query = "EXEC usp_rp_pending_request";
        List<Dictionary<string, object>> obj = await _BaseRepository.ExecuteCustomJogetQuery(query);
         
        return obj;
    }

    [HttpGet]
    public async Task PullData()
    {
        //string query = "EXEC usp_rp_pending_request";
        //List<Dictionary<string, object>> obj = await _BaseRepository.ExecuteCustomJogetQuery(query);

        //var list = ConvertToPendingJogetList(obj);
        //await BulkInsertPendingJogetAsync(list);
    }
    public async Task BulkInsertPendingJogetAsync(List<PendingJoget> data)
    {
        var dt = new DataTable();

        // Khởi tạo cột (phải khớp DB)
        foreach (var prop in typeof(PendingJoget).GetProperties())
        {
            dt.Columns.Add(prop.Name, typeof(string));
        }

        // Gán dữ liệu
        foreach (var item in data)
        {
            var row = dt.NewRow();
            foreach (var prop in typeof(PendingJoget).GetProperties())
            {
                row[prop.Name] = prop.GetValue(item) ?? DBNull.Value;
            }
            dt.Rows.Add(row);
        }

        // Bulk insert
        using var connection = new SqlConnection(_BaseRepository._connectionString);
        await connection.OpenAsync();
        using var bulkCopy = new SqlBulkCopy(connection)
        {
            DestinationTableName = "dbo.PendingJoget", // Đảm bảo đúng tên bảng
            BulkCopyTimeout = 60
        };

        await bulkCopy.WriteToServerAsync(dt);
    }


    public static List<PendingJoget> ConvertToPendingJogetList(List<Dictionary<string, object>> rawData)
    {
        var result = new List<PendingJoget>();

        foreach (var dict in rawData)
        {
            var obj = new PendingJoget();
            foreach (var prop in typeof(PendingJoget).GetProperties())
            {
                var key = prop.Name;
                if (key == "Id") continue;
                if (key == "Guid") continue;
                if (key == "CreatedBy") continue;
                if (key == "CreatedDate") continue;
                if (key == "ModifiedBy") continue;
                if (key == "ModifiedDate") continue;
                if (key == "Deleted") continue;
                if (key == "DeletedBy") continue;
                if (key == "DeletedDate") continue;
                if (key == "RowOrder") continue;
                if (key == "CopyFromGuid") continue;
                if (key == "DraftGuid") continue;

                if (dict.TryGetValue(key, out var value) && value != null)
                {
                    prop.SetValue(obj, value.ToString());
                }
            }
            result.Add(obj);
        }

        return result;
    }

}