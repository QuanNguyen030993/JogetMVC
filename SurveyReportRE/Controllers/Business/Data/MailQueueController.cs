using DocumentFormat.OpenXml.Office2013.Excel;
using Microsoft.AspNetCore.Authorization;
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
using System.ComponentModel.DataAnnotations;
using System.Data;
using System.Net;
using ERPCore.Models.Migration.Business.Social;

[ApiController]
[Route("api/[controller]/[action]")]
public class MailQueueController : BaseControllerApi<MailQueue>
{
    private readonly IBaseRepository<MailQueue> _BaseRepository;
    private readonly IConfiguration configuration;
    private readonly IBaseRepository<Notification> _notificationRepository;
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
    public MailQueueController(IBaseRepository<MailQueue> BaseRepository, IConfiguration config, IHttpContextAccessor httpContextAccessor, ILogger<MailQueue> logger) : base(BaseRepository, httpContextAccessor)
    {
        configuration = config;
        _BaseRepository = BaseRepository;
        _notificationRepository = new BaseRepository<Notification>(configuration, _httpContextAccessor);
        _attachmentRepository = new BaseRepository<Attachment>(configuration, _httpContextAccessor);
        _employeeRepository = new BaseRepository<Employee>(configuration, _httpContextAccessor);
        _usersRepository = new BaseRepository<Users>(configuration, _httpContextAccessor);
        _userRolesRepository = new BaseRepository<UserRoles>(configuration, _httpContextAccessor);
        _rolesRepository = new BaseRepository<Roles>(configuration, _httpContextAccessor);
        SUPER_USER = configuration.GetSection("SuperUser:SuperUser").Value;
        DOMAIN_NAME = configuration.GetSection("Domain:DCServer").Value;
        path = _BaseRepository._baseConfiguration.GetSection("BlobStorage:Path");
        BLOB_PATH = path.Value;
        CURRENT_USER = _httpContextAccessor?.HttpContext?.User?.Identity?.Name?.Replace(DOMAIN_NAME, "") ?? "Anonymous";
    }
    [HttpPost]
    public override async Task<object> ExecuteCustomQuery([FromBody] string query)
    {

        //query = "EXEC usp_rp_pending_request";
        List<Dictionary<string, object>> obj = await _BaseRepository.ExecuteCustomJogetQuery(query);

        return obj;
    }

  
    public async Task BulkInsertMailQueueAsync(List<MailQueue> data)
    {
        var dt = new DataTable();

        // Khởi tạo cột (phải khớp DB)
        foreach (var prop in typeof(MailQueue).GetProperties())
        {
            dt.Columns.Add(prop.Name, typeof(string));
        }

        // Gán dữ liệu
        foreach (var item in data)
        {
            var row = dt.NewRow();
            foreach (var prop in typeof(MailQueue).GetProperties())
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
            DestinationTableName = "dbo.MailQueue", 
            BulkCopyTimeout = 60
        };

        await bulkCopy.WriteToServerAsync(dt);
    }


    public static List<MailQueue> ConvertToMailQueueList(List<Dictionary<string, object>> rawData)
    {
        var result = new List<MailQueue>();

        foreach (var dict in rawData)
        {
            var obj = new MailQueue();
            foreach (var prop in typeof(MailQueue).GetProperties())
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
    [HttpPost]
    public async Task<IActionResult> Resend([FromBody] MailQueue mailQueue)
    {
        try
        {
            MailConfig emailSettings = configuration.GetSection("Email").Get<MailConfig>();
            List<string> attachments = null;
            //MailQueue mailQueue = new MailQueue();//await _BaseRepository.GetSingleObject(s => s.Id == key);
            MailItem mailItem = new MailItem();
            mailItem.ToName = mailQueue.ToName;
            mailItem.ToEmail = mailQueue.ToEmail;
            mailItem.Subject = mailQueue.Subject;
            mailItem.HtmlBody = mailQueue.HtmlBody;// mailQueue.HtmlBody;
            mailItem.TextBody = mailQueue.TextBody;//mailQueue.HtmlBody;
            mailItem.CC = mailQueue.CC;
            MailUtil.SendEmail(emailSettings, mailItem, attachments).Wait();
        }
        catch (Exception ex)
        {
            //throw new CustomException("Resend notify was failed.", ex);
        }
        return Ok();
    }
    
    [HttpPost]
    [AllowAnonymous]
    [InternalTokenAuthorize]
    public async Task<IActionResult> Sendmail([FromBody] MailQueue mailQueue)
    {
        try
        {
            MailConfig emailSettings = configuration.GetSection("Email").Get<MailConfig>();
            List<string> attachments = null;
            //MailQueue mailQueue = new MailQueue();//await _BaseRepository.GetSingleObject(s => s.Id == key);
            MailItem mailItem = new MailItem();
            mailItem.ToName = mailQueue.ToName;
            mailItem.ToEmail = mailQueue.ToEmail;
            mailItem.Subject = mailQueue.Subject;
            mailItem.HtmlBody = mailQueue.HtmlBody;// mailQueue.HtmlBody;
            mailItem.TextBody = mailQueue.TextBody;//mailQueue.HtmlBody;
            mailItem.CC = mailQueue.CC;
            MailUtil.SendEmail(emailSettings, mailItem, attachments).Wait();

           

}
        catch (Exception ex)
        {
            //throw new CustomException("Resend notify was failed.", ex);
        }
        return Ok();
    }
}