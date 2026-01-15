using DocumentFormat.OpenXml.Office2013.Excel;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using ERPCore.Controllers.Base;
using ERPCore.Models.Migration.Business.Config;
using System.Data;
using ERPCore.ControllerUtil;
using ERPCore.Common;
using System.Net;
using ERPCore.Models.Base;
using DocumentFormat.OpenXml.Wordprocessing;
using System.Text.RegularExpressions;
using MimeKit;
using DocumentFormat.OpenXml.Bibliography;
using Microsoft.SharePoint.Taxonomy.WebServices;
using ERPCore.Models;

[ApiController]
[Route("api/[controller]/[action]")]
public class QuotationCommentLogController : BaseControllerApi<QuotationCommentLog>
{
    private readonly IBaseRepository<QuotationCommentLog> _BaseRepository;
    private readonly IConfiguration configuration;
    private readonly IBaseRepository<Survey> _surveyRepository;
    private readonly IBaseRepository<ERPCore.Models.Migration.Business.Data.Attachment> _attachmentRepository;
    private readonly IBaseRepository<Users> _usersRepository;
    private readonly IConfigurationSection path;
    public static string MANAGER_APP = "";
    public static string APPROVER_APP = "";
    public static string CHECKER_APP = "";
    public static string USER_APP = "";
    public static string SUPER_USER = "";
    public static string DOMAIN_NAME = "";
    private static string BLOB_PATH = "";
    public static string CURRENT_USER = "";
    private static string spUserName = "";
    private static string spPassword = "";
    private static string MAPPING_PATH = "";
    private readonly Microsoft.Extensions.Options.IOptionsMonitor<BlobStorageSettings> _blobStorageSettings;
    private static string Query;
    public QuotationCommentLogController(IBaseRepository<QuotationCommentLog> BaseRepository
        , IConfiguration config
        , IHttpContextAccessor httpContextAccessor
        , ILogger<QuotationCommentLog> logger
        , Microsoft.Extensions.Options.IOptionsMonitor<BlobStorageSettings> blobStorageSettings
        ) : base(BaseRepository, httpContextAccessor
            )
    {
        configuration = config;
        _BaseRepository = BaseRepository;
        _attachmentRepository = new BaseRepository<ERPCore.Models.Migration.Business.Data.Attachment>(configuration, _httpContextAccessor);
        _usersRepository = new BaseRepository<Users>(configuration, _httpContextAccessor);
        MANAGER_APP = configuration.GetSection("BusinessConfig:ManagerAppKey").Value;
        APPROVER_APP = configuration.GetSection("BusinessConfig:ApproverAppKey").Value;
        CHECKER_APP = configuration.GetSection("BusinessConfig:CheckerAppKey").Value;
        USER_APP = configuration.GetSection("BusinessConfig:UserAppKey").Value;
        SUPER_USER = configuration.GetSection("SuperUser:SuperUser").Value;
        DOMAIN_NAME = configuration.GetSection("Domain:DCServer").Value;
        path = _BaseRepository._baseConfiguration.GetSection("BlobStorage:Path");
        MAPPING_PATH = _BaseRepository._baseConfiguration.GetSection("MigrationConfig:MappingField").Value;
        BLOB_PATH = path.Value;
        CURRENT_USER = _httpContextAccessor.HttpContext.User.Identity.Name.Replace(DOMAIN_NAME, "");
        spUserName = configuration.GetSection("SharePoint:Username").Value;
        spPassword = configuration.GetSection("SharePoint:Password").Value;
        _blobStorageSettings = blobStorageSettings;
    }

    [HttpPost]
    public override async Task<object> ExecuteCustomQuery([FromBody] string query)
    {
        List<Dictionary<string, object>> obj = new List<Dictionary<string, object>>();
        if (Query != query && !query.Contains("@"))
        {
            Query = query;
        }
        obj = await _BaseRepository.ExecuteCustomLogQuery(Query);
        return obj;
    }





    public async Task BulkInsertQuotationCommentLogAsync(List<QuotationCommentLog> data)
    {
        var dt = new DataTable();

        // Khởi tạo cột (phải khớp DB)
        foreach (var prop in typeof(QuotationCommentLog).GetProperties())
        {
            dt.Columns.Add(prop.Name, typeof(string));
        }

        // Gán dữ liệu
        foreach (var item in data)
        {
            var row = dt.NewRow();
            foreach (var prop in typeof(QuotationCommentLog).GetProperties())
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
            DestinationTableName = "dbo.QuotationCommentLog", // Đảm bảo đúng tên bảng
            BulkCopyTimeout = 60
        };

        await bulkCopy.WriteToServerAsync(dt);
    }


    //public static List<QuotationCommentLog> ConvertToQuotationCommentLogList(List<Dictionary<string, object>> rawData)
    //{
    //    var result = new List<QuotationCommentLog>();

    //    foreach (var dict in rawData)
    //    {
    //        var obj = new QuotationCommentLog();
    //        foreach (var prop in typeof(QuotationCommentLog).GetProperties())
    //        {
    //            var key = prop.Name;
    //            if (key == "Id") continue;
    //            if (key == "Guid") continue;
    //            if (key == "CreatedBy") continue;
    //            if (key == "CreatedDate") continue;
    //            if (key == "ModifiedBy") continue;
    //            if (key == "ModifiedDate") continue;
    //            if (key == "Deleted") continue;
    //            if (key == "DeletedBy") continue;
    //            if (key == "DeletedDate") continue;
    //            if (key == "RowOrder") continue;
    //            if (key == "CopyFromGuid") continue;
    //            if (key == "DraftGuid") continue;

    //            if (dict.TryGetValue(key, out var value) && value != null)
    //            {
    //                prop.SetValue(obj, value.ToString());
    //            }
    //        }
    //        result.Add(obj);
    //    }

    //    return result;
    //}

}
