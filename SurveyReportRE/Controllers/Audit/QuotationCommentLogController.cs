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
        path = _BaseRepository._baseConfiguration.GetSection("BlobStorage:Path");
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



}
