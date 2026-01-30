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
using ERPCore.Models.Migration.Config;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json;
using ERPCore.Models.Business.Migration.Config;
using ERPCore.Models.Migration.Business.HumanResource;
using ERPCore.Repository;

[ApiController]
[Route("api/[controller]/[action]")]
public class QuotationController : BaseControllerApi<Quotation>
{
    private readonly IBaseRepository<Quotation> _BaseRepository;
    private readonly IConfiguration configuration;
    private readonly IBaseRepository<Survey> _surveyRepository;
    private readonly IBaseRepository<ERPCore.Models.Migration.Business.Data.Attachment> _attachmentRepository;
    private readonly IBaseRepository<FormatCodeNo> _formatCodeNoRepository;
    private readonly IBaseRepository<Users> _usersRepository;
    private readonly IBaseRepository<Employee> _employeeRepository;
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
    private static string spUserName = "";
    private static string spPassword = "";
    private static string MAPPING_PATH = "";
    private readonly Microsoft.Extensions.Options.IOptionsMonitor<BlobStorageSettings> _blobStorageSettings;
    public QuotationController(IBaseRepository<Quotation> BaseRepository
        , IConfiguration config
        , IHttpContextAccessor httpContextAccessor
        , ILogger<Quotation> logger
        , Microsoft.Extensions.Options.IOptionsMonitor<BlobStorageSettings> blobStorageSettings
        ) : base(BaseRepository, httpContextAccessor
            )
    {
        configuration = config;
        _BaseRepository = BaseRepository;
        _surveyRepository = new BaseRepository<Survey>(configuration, _httpContextAccessor);
        _attachmentRepository = new BaseRepository<ERPCore.Models.Migration.Business.Data.Attachment>(configuration, _httpContextAccessor);
        _formatCodeNoRepository = new BaseRepository<FormatCodeNo>(configuration, _httpContextAccessor);
        _usersRepository = new BaseRepository<Users>(configuration, _httpContextAccessor);
        _employeeRepository = new BaseRepository<Employee>(configuration, _httpContextAccessor);
        _userRolesRepository = new BaseRepository<UserRoles>(configuration, _httpContextAccessor);
        _rolesRepository = new BaseRepository<Roles>(configuration, _httpContextAccessor);
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

    public async Task<IActionResult> GetIdsList()
    {
        List<Quotation> quotation = await _BaseRepository.GetAll();
        if (quotation != null)
        {

            object quotationData = quotation.Select(s => s.Id).ToArray();
            return Ok(Newtonsoft.Json.JsonConvert.SerializeObject(quotationData));

            if (quotation != null)
            {
            }
        }
        return Ok();
    }


    [HttpPost]
    public async Task<IActionResult> CreateQuotation([FromBody] Quotation quotationData)
    {
        Quotation quotation = new Quotation();
        List<FormatCodeNo> tableConfig = new List<FormatCodeNo>();
        tableConfig = await _formatCodeNoRepository.GetListObjectFullInclude(l => l.NoSeqCode == nameof(Quotation)+"Code");
        JsonConvert.PopulateObject(JsonConvert.SerializeObject(quotationData), quotation);
        quotation.QuotationCode = ControllerUtil.GenerateNumberSeq(tableConfig, _formatCodeNoRepository, nameof(Quotation));
        quotation = await _BaseRepository.InsertData(quotation);
        return Ok(quotation);
    }


    [HttpGet("{listIds}/{jsessionId}")]
    public async Task<ActionResult<Quotation>> PullDataBySession(string listIds,string jsessionId)
    {
        string[] ids = listIds.Split(',');
        foreach (string id in ids)
        {
            await Task.Factory.StartNew(async () => {
                Thread.Sleep(5000);

        string excelPath = Path.Combine(BLOB_PATH, MAPPING_PATH);
        Quotation checkQuotation = new Quotation();
        bool isExist = await _BaseRepository.RecordExistsAsync<Quotation>("QuotationCode", id);

        if (isExist)
        {
            checkQuotation = await _BaseRepository.GetSingleObject(s => s.QuotationCode == id);
            await _BaseRepository.DeleteData(checkQuotation, checkQuotation.Id, "Id", true);
            //return Ok();
        }
        DataSet ds = Util.ReadExcelFiles(excelPath);
        DataTable? dtMigration = Util.GetTableBySheetName(ds,"Migration");
        if (dtMigration != null)
        {
        // Ensure there are at least 2 columns

        var col1Name = dtMigration.Columns[0].ColumnName;
        var col2Name = dtMigration.Columns[1].ColumnName;

        bool IsTrueLike(object? v)
        {
            if (v == null || v == DBNull.Value) return false;

            // ExcelReader có thể trả bool, double, string...
            if (v is bool b) return b;
            if (v is double d) return Math.Abs(d - 1d) < 0.0000001; // 1 = TRUE
            var s = v.ToString()?.Trim();
            if (string.IsNullOrEmpty(s)) return false;

            return s.Equals("true", StringComparison.OrdinalIgnoreCase)
                || s.Equals("yes", StringComparison.OrdinalIgnoreCase)
                || s.Equals("y", StringComparison.OrdinalIgnoreCase)
                || s.Equals("1");
        }

        // Tạo table output chỉ gồm 2 cột
        DataTable output = new DataTable($"{dtMigration.TableName}_Filtered");
        output.Columns.Add(col1Name, typeof(string));
        output.Columns.Add(col2Name, typeof(string));

        foreach (DataRow r in dtMigration.Rows)
            { 
                if (!IsTrueLike(r["Query"])) continue;

                output.Rows.Add(
                    r[col1Name]?.ToString(),
                    r[col2Name]?.ToString()
                );

            }
            string query = Util.MakingSelectSql(
               output,                         // DataTable đã filter Query = TRUE
               "app_fd_tmiv_qp_m_qt",
               "",
               id
            );

            string pullingQuery = $"EXEC [usp_fd_quotation_process_pull] '{id}' , '{query}'";
            string queryInsert = Util.MakingInsertSql(
               output,                         // DataTable đã filter Query = TRUE
               "",
               "Quotation"
            );
            List<Dictionary<string, object>> obj = await _BaseRepository.ExecuteCustomJogetQuery(pullingQuery);
            var built = Util.BuildInsertValuesSql(
                targetTable: "Quotation",
                mapping: output,         // cột1: sourceKey, cột2: targetCol
                rows: obj,
                ignoreCaseKeys: true,
                skipRowsMissingAnyMappedField: false
            );

                // không có row hợp lệ

            using var conn = new SqlConnection(_BaseRepository._connectionString);
            await conn.OpenAsync();

            using var cmd = new SqlCommand(built.Sql, conn);
            cmd.Parameters.AddRange(built.Parameters.ToArray());

            int affected = await cmd.ExecuteNonQueryAsync();

            /// Attachment handle if in need
            string pullingQueryAttachment = $"EXEC [usp_fd_quotation_process_attachment_pull] '{id}'";
            List<Dictionary<string, object>> objAtt = await _BaseRepository.ExecuteCustomJogetQuery(pullingQueryAttachment);
            if (objAtt != null)
            foreach (var objAt in objAtt)
            {
                string attachmentId = objAt["id"]?.ToString() ?? "";
                string attachmentName = objAt["c_attachQT"]?.ToString() ?? ""   ;
                //Selen.IJavaScriptExecutor js = (Selen.IJavaScriptExecutor)driver;
                //js.ExecuteScript($"arguments[0].scrollTop = arguments[0].scrollTop - {initialScrollHeight.ToString()};", messagePane);
                if (!string.IsNullOrEmpty(attachmentId) && !string.IsNullOrEmpty(attachmentName))
                {

                    string URL = $@"https://wf.tokiomarine.com.vn/jw/web/client/app/TMIV_qp/23/form/download/tmiv_qp_grid_attach/{attachmentId}/{Uri.EscapeUriString(attachmentName)}";

                    using var client = new HttpClient();
                    ///window.getCookie = function(name) {
                    ///var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
                    ///if (match) return match[2];
                    ///}

                // ===== Headers tối thiểu =====
                client.DefaultRequestHeaders.Add(
                        "Cookie",
                        $"JSESSIONID={jsessionId}"
                    );

                    client.DefaultRequestHeaders.Referrer =
                        new Uri("https://wf.tokiomarine.com.vn/jw/web/userview/TMIV_qp/tmiv_qp_userview/_/completedQT");

                    client.DefaultRequestHeaders.UserAgent.ParseAdd(
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
                    );

                    // ===== GET =====
                    var response = await client.GetAsync(URL);
                    response.EnsureSuccessStatusCode();

                    // ===== Read file =====
                    var bytes = await response.Content.ReadAsByteArrayAsync();
                    string tempDir = System.IO.Path.Combine(_blobStorageSettings.CurrentValue.Path, _blobStorageSettings.CurrentValue.QuotationAttachmentFolder,id);
                    //string tempDir = "D:\\Source\\MySource\\ERPCore\\ERPCore\\ERPCore\\bin\\Debug\\Attachment\\Quotation";
                    if (!Directory.Exists(tempDir))
                    {
                        Directory.CreateDirectory(tempDir);
                    }
                    System.IO.File.WriteAllBytes(System.IO.Path.Combine(tempDir, attachmentName), bytes);

                    ///Remove attachment after process 
                    //System.IO.File.Delete(System.IO.Path.Combine(tempDir, attachmentName));
                }
            }
        }


        //SecureString theSecureString = new NetworkCredential(spUserName, spPassword).SecurePassword;

        //SharePointOnlineCredentials onlineCredentials = new SharePointOnlineCredentials(spUserName, theSecureString);
        //string myWebsiteUrl = "https://tokiomarinevn.sharepoint.com/:x:/r/sites/Jogettechnicaldocuments/_layouts/15/Doc.aspx?dtMigrationdoc=%7Bfc836aef-8fbf-4b7d-8118-6db3d8e1d45d%7D&action=edit&wdenableroaming=1&wdlcid=en-US&wdorigin=ItemsView&wdhostclicktime=1767835335974&wdredirectionreason=Force_SingleStepBoot&wdinitialsession=68cb23ed-0a45-e1b5-3d08-429011b3e4cd&wdrldsc=2&wdrldc=1&wdrldr=ContinueInExcel";
        ////var authManager = new OfficeDevPnP.Core.AuthenticationManager();
        //var authManager = new AuthenticationManager().GetACSAppOnlyContext(myWebsiteUrl, clientId, clientSecret));
        //{
        //    ClientContext ctx = authManager.GetWebLoginClientContext(myWebsiteUrl);
        //    //ClientContext ctx = new ClientContext(myWebsiteUrl);
        //    ctx.Credentials = onlineCredentials;
        //    Web web = ctx.Web;
        //    ctx.Load(web);
        //    ctx.ExecuteQuery();
        //    ctx.Load(ctx.Web, p => p.Title);
        //    ctx.ExecuteQuery();
        //}

        //string siteUrl = "https://tenant.sharepoint.com/";
        //using (var ctx = new OfficeDevPnP.Core.AuthenticationManager().GetWebLoginClientContext(myWebsiteUrl))
        //{
        //    ctx.Load(ctx.Web, p => p.Title);
        //    ctx.ExecuteQuery();
        //    Microsoft.SharePoint.Client.File file = ctx.Web.GetFileByUrl(myWebsiteUrl);
        //    ctx.Load(file);
        //    ctx.ExecuteQuery();
        //    //string filepath = @"C:\temp\" + file.Name;
        //    //Microsoft.SharePoint.Client.ClientResult<Stream> mstream = file.OpenBinaryStream();
        //    //ctx.ExecuteQuery();

        //};

        // This method calls a pop up window with the login page and it also prompts 
        // for the multi factor authentication code. 

        //

                await base.PullData(id);
            });
                }
        return Ok();
    }



    [HttpPost]
    public override async Task<object> ExecuteCustomQuery([FromBody] string query)
    {

        ////query = "EXEC usp_fd_policy_issuance_request";
        //List<Dictionary<string, object>> obj = await _BaseRepository.ExecuteCustomQuery(query);
        var Base = await _BaseRepository.ExecuteCustomQuery(query);
        //return obj;
        string userName = ControllerUtil.GetCurrentContextUser(_httpContextAccessor, configuration);
        Users user = await _usersRepository.GetSingleObject(s => s.username == userName);
        Employee employee = await _employeeRepository.GetSingleObject(s => s.AccountName == userName);

        if (user == null)
        {
            return BadRequest("User not found.");
        }

        // Nếu là SUPER_USER, trả về tất cả dữ liệu
        if (SUPER_USER.Contains(user.username))
        {
            return Ok(Base);
        }

        UserRoles userRole = await _userRolesRepository.GetSingleObject(s => s.UserId == user.Id);
        Roles roles = await _rolesRepository.GetSingleObject(s => s.Id == userRole.RoleId);

        List<Dictionary<string, object>> filteredBase = new List<Dictionary<string, object>>();

        if (roles.RoleName == USER_APP || roles.RoleName == CHECKER_APP)// CheckerApp no case
        {
            var existingIds = new HashSet<object>();
            if (employee.AreaId == null) return filteredBase;
            long? empArea = employee.AreaId;
            if (string.IsNullOrEmpty(employee.AccountName)) return filteredBase;
            string surveyedByAccountName = employee.AccountName;
            
  
            filteredBase = Base
                .Where(w => w.ContainsKey("stageAccount") && w["stageAccount"]?.ToString() == userName)
                .ToList();


        }
        else if (roles.RoleName == MANAGER_APP)
        {
            //var grantSurveys = Base.Where(w =>
            //    w.ContainsKey("grantSurvey") && w["grantSurvey"]?.ToString()?.Contains(user.Id.ToString()) == true
            //).ToList();
            //var sitesByOwner = BusinessConfig.Sites
            //.Where(x => x.Value.OwnData == userName)
            //.Select(x => new
            //{
            //    SiteKey = x.Key,
            //    SiteName = x.Value.Name,
            //    BranchCode = x.Value.BranchCode
            //})
            //.ToList();

            //var allowedBranchCodes = sitesByOwner
            //.Select(x => x.BranchCode)
            //.Where(x => x != null)
            //.Distinct()
            //.ToHashSet();

            ////Comment quan.tm will be own all sites data
            ////filteredBase = Base
            ////    .Where(w =>
            ////        w.ContainsKey("areaId") &&
            ////        w["areaId"] != null &&
            ////        Convert.ToInt32(w["areaId"]) == employee.AreaId
            ////    )
            ////    .ToList(); 

            //filteredBase = Base
            //    .Where(w =>
            //        w.ContainsKey("areaId") &&
            //        w["areaId"] != null &&
            //        allowedBranchCodes.Contains(Convert.ToInt32(w["areaId"]))
            //    )
            //    .ToList();


            //filteredBase.AddRange(grantSurveys);
        }
        else if (roles.RoleName == APPROVER_APP)
        {
            //filteredBase.AddRange(Base);
        }

        return filteredBase;
    }

    public async Task BulkInsertQuotationAsync(List<Quotation> data)
    {
        var dt = new DataTable();

        // Khởi tạo cột (phải khớp DB)
        foreach (var prop in typeof(Quotation).GetProperties())
        {
            dt.Columns.Add(prop.Name, typeof(string));
        }

        // Gán dữ liệu
        foreach (var item in data)
        {
            var row = dt.NewRow();
            foreach (var prop in typeof(Quotation).GetProperties())
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
            DestinationTableName = "dbo.Quotation", // Đảm bảo đúng tên bảng
            BulkCopyTimeout = 60
        };

        await bulkCopy.WriteToServerAsync(dt);
    }


    public static List<Quotation> ConvertToQuotationList(List<Dictionary<string, object>> rawData)
    {
        var result = new List<Quotation>();

        foreach (var dict in rawData)
        {
            var obj = new Quotation();
            foreach (var prop in typeof(Quotation).GetProperties())
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
