using JetBrains.Annotations;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Org.BouncyCastle.Crypto;
using ERPCore.Common;
using ERPCore.Models;
using ERPCore.Models.Base;
using ERPCore.Models.Business.Migration.Config;
using ERPCore.Models.Migration.Business.Data;
using ERPCore.Models.Migration.Config;
using ERPCore.Models.Request;
using System.Dynamic;
using System.Linq.Expressions;
using System.Net;
using System.Net.Http.Formatting;
using System.Reflection;
using System.Security.AccessControl;
using System.Security.Claims;
using System.Security.Principal;
using ERPCore.ControllerUtil;
using MimeMapping;
using ERPCore.Models.Models.Parsing;
using ERPCore.Models.Migration.Business.Config;
using Serilog;
using Microsoft.AspNetCore.Authorization;
using ERPCore.Storage;


namespace ERPCore.Controllers.Base
{
    [AllowAnonymous]
    public class BaseControllerApi<T> : ControllerBase where T : class, new()
    {
        private enum DocumentStorageTarget
        {
            Local,
            Nas,
            SharePoint
        }

        private readonly IBaseRepository<T> _BaseRepository;
        internal IHttpContextAccessor _httpContextAccessor { get; set; }
        internal ILogger<T> _loggerT { get; set; }
        internal static string DOMAIN_NAME = "";
        private static string BLOB_PATH = "";

        protected static bool IsRemoteDocumentUrl(string? value)
        {
            return Uri.TryCreate(value, UriKind.Absolute, out var uri)
                && (uri.Scheme == Uri.UriSchemeHttps || uri.Scheme == Uri.UriSchemeHttp);
        }

        public BaseControllerApi(IBaseRepository<T> BaseRepository, IHttpContextAccessor httpContextAccessor)
        {
            var services = httpContextAccessor.HttpContext?.RequestServices;
            var loggerFactory = (ILoggerFactory?)services?.GetService(typeof(ILoggerFactory));
            if (loggerFactory != null)
            {
                _loggerT = loggerFactory.CreateLogger<T>();
            }
            else
            {
                _loggerT = new Serilog.Extensions.Logging.SerilogLoggerFactory().CreateLogger<T>();
            }
            _httpContextAccessor = httpContextAccessor;
            _BaseRepository = BaseRepository;
            var domainName = _BaseRepository._baseConfiguration.GetSection("Domain:DCServer").Value;
            DOMAIN_NAME = domainName;
            IConfigurationSection path = _BaseRepository._baseConfiguration.GetSection("BlobStorage:Path");
            BLOB_PATH = path.Value;
            bool isDebugMode = false;
            ControllerUtil.ControllerUtil.ContextHandle(httpContextAccessor, _BaseRepository._baseConfiguration, out isDebugMode);
            //string checkIfLoginAsDebug = _BaseRepository._baseConfiguration.GetSection("SuperUser:LoginAs").Value;
            //if (!string.IsNullOrEmpty(checkIfLoginAsDebug))
            //{
            //    {
            //        var newIdentity = new ClaimsIdentity();
            //        newIdentity.AddClaim(new System.Security.Claims.Claim(newIdentity.NameClaimType, checkIfLoginAsDebug.Replace(domainName, "")));
            //        httpContextAccessor.HttpContext.User = new ClaimsPrincipal(newIdentity);
            //    }
            //}


            //var httpContext = _httpContextAccessor.HttpContext;
            //if (httpContext.User == null || !httpContext.User.Identity.IsAuthenticated)
            //if (httpContext.User != null)
            //{
            //    var loginUser = httpContext.User.Identity.Name.Replace(domainName, "");
            //    var roles = _BaseRepository.GetUserRoles(loginUser.ToString());
            //    if (roles != null)
            //    {
            //        var newIdentity = new ClaimsIdentity();
            //        newIdentity.AddClaim(new System.Security.Claims.Claim("RoleName", roles.ToString()));
            //        ClaimsPrincipal claimsPrincipal = httpContextAccessor.HttpContext.User;
            //        claimsPrincipal.AddIdentity(newIdentity);
            //        _httpContextAccessor.HttpContext.User = claimsPrincipal;
            //        //_httpContextAccessor.HttpContext.User = new ClaimsPrincipal(newIdentity);
            //    }

            //    //    var newIdentity = new ClaimsIdentity();
            //    //    //var windowsIdentity = WindowsIdentity.GetCurrent();
            //    //    //var loginUser = windowsIdentity.Name.Replace(domainName, "");

            //    //    System.IO.File.WriteAllText(System.IO.Path.Combine(path.Value, "logs\\logoutput.txt"), loginUser);

            //    //    newIdentity.AddClaim(new System.Security.Claims.Claim(newIdentity.NameClaimType, loginUser));
            //    //    if (windowsIdentity != null)
            //    //    {
            //    //        _httpContextAccessor.HttpContext.User = new ClaimsPrincipal(newIdentity);
            //    //    }
            //}
            //_BaseRepository.GetRepositoryHttpContent(_httpContextAccessor);
        }


        #region GET API 

        [HttpGet("{environment}")]
        public async Task<IActionResult> DbContextEnvironmentChange(string environment)
        {
            await _BaseRepository.DbContextEnvironmentChange(environment);
            return Ok();
        }

        [HttpGet("{environment}")]
        public async Task<IActionResult> DbContextJogetEnvironmentChange(string environment)
        {
            await _BaseRepository.DbContextJogetEnvironmentChange(environment);
            return Ok();
        }


        [HttpGet("{guid}/{status}")]
        public async Task<IActionResult> ToggleVisibleRows(Guid guid, bool status)
        {
            await _BaseRepository.ToggleVisibleRows<T>(status, guid);
            return Ok();
        }

        public async Task<string> GetHtmlString(long id, string fieldName)
        {
            T survey = new T();
            string returnValue = "";
            if (id != 0)
            {
                survey = await _BaseRepository.GetObjectByIdAsync(id);

                var properties = Util.ObjectProperties<T>().ToList();

                foreach (PropertyInfo property in properties)
                {
                    if (property.Name.ToLower() == fieldName.ToLower())
                    {
                        returnValue = property.GetValue(survey).ToString();
                        break;
                    }
                }
            }
            return returnValue ?? "";
        }
        //[AllowAnonymous] // Debug Nodejs
        [HttpGet("{id}")]
        public virtual async Task<ActionResult<T>> GetSingle(int id)
        {
            var Base = await _BaseRepository.GetObjectByIdAsync(id);
            if (Base == null)
            {
                return Ok(new T());
            }

            return Ok(Base);
        }

        [HttpGet("{id}")]
        public virtual async Task<ActionResult<T>> GetSingleInclude(int id)
        {
            var Base = await _BaseRepository.GetObjectIncludeByIdAsync(id);
            if (Base == null)
            {
                return Ok(new T());
            }

            return Ok(Base);
        }


        [HttpGet("{id}")]
        public virtual async Task<ActionResult<T>> GetAllInclude()
        {
            var Base = await _BaseRepository.GetAllInclude();
            if (Base.Count == 0)
            {
                return NotFound();
            }

            return Ok(Base);
        }


        [HttpGet("{idMany}")]
        public virtual async Task<ActionResult<T>> GetMany(int idMany)
        {
            var Base = await _BaseRepository.GetManyObjectByIdAsync(idMany);
            if (Base == null)
            {
                return NotFound();
            }

            return Ok(Base);
        }

        [HttpGet]
        public virtual async Task<ActionResult<T>> GetFKMany(int fkId, string fkField)
        {
            try
            {
                var Base = await _BaseRepository.GetFKMany(fkId, fkField);
                return Ok(Base);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        //[HttpGet]
        //public virtual async Task<ActionResult<T>> GetUserRoles(string accountName)
        //{
        //    string roleName = "";
        //    string superUsers = _BaseRepository?._baseConfiguration?.GetSection("SuperUser:SuperUser")?.Value ?? "Anonymous";
        //    bool isSuperUser = superUsers.Contains(accountName);
        //    var roles = await _BaseRepository.GetUserRoles(accountName.Replace(DOMAIN_NAME, ""), isSuperUser);
        //    if (roles != null)
        //        roleName = roles.RoleName.ToString();
        //    return Ok(roles);
        //}

        [HttpGet("{id}")]
        public virtual async Task<ActionResult<T>> Clone(int id)
        {
            dynamic Base = await _BaseRepository.GetObjectByIdAsync(id);
            Base.Id = 0;
            Base.CopyFromGuid = Base.Guid;
            Base.Guid = new Guid();
            await _BaseRepository.InsertData(Base);

            if (Base == null)
            {
                return NotFound();
            }

            return Ok(Base);
        }


        [HttpGet]
        public virtual async Task<ActionResult<T>> EnumLookup(string refField, string enumName = null)
        {

            var requestParams = HttpContext.Request.Query.ToList();
            IDictionary<string, object> dynamicObj = new ExpandoObject { };
            foreach (var item in requestParams)
            {
                dynamicObj[item.Key] = item.Value;
            }
            var Base = await _BaseRepository.EnumLookup(refField, enumName);



            if (Base == null)
            {
                return NotFound();
            }
            List<EnumData> enumDatas = new List<EnumData>();
            enumDatas = JsonConvert.DeserializeObject<List<EnumData>>(JsonConvert.SerializeObject(Base));

            if (dynamicObj.ContainsKey("filter"))
            {
                var obj = dynamicObj["filter"];
                JArray jsonArray = JArray.Parse(dynamicObj["filter"].ToString());
                try
                {
                    int number = jsonArray[1].Value<int>();
                    enumDatas = enumDatas.Where(x => x.Id == number).ToList();
                }
                catch
                {

                }
                return Ok(enumDatas);
            }

            return Ok(enumDatas);
        }


        [HttpGet]
        public virtual async Task<ActionResult<T>> DropDownLookup()
        {
            var requestParams = HttpContext.Request.Query.ToList();
            IDictionary<string, object> dynamicObj = new ExpandoObject { };
            foreach (var item in requestParams)
            {
                dynamicObj[item.Key] = item.Value;
            }
            var Base = new List<T>();

            if (dynamicObj.ContainsKey("key"))
            {
                var obj = dynamicObj["key"];
                int result = 0;
                int.TryParse(obj.ToString(), out result);
                if (result != 0)
                    Base = await _BaseRepository.GetManyObjectByIdAsync(int.Parse(obj.ToString()));
            }
            else
            {
                Base = await _BaseRepository.GetAll();
            }

            if (Base == null)
            {
                return NotFound();
            }

            return Ok(Base);
        }
        [HttpGet("{id}")]
        public async Task<IActionResult> GetPdfFile(long id)
        {
            string typeError = "InternalError";
            try
            {
                BaseRepository<Document> _attachmentRepository = new BaseRepository<Document>(_BaseRepository._baseConfiguration, _httpContextAccessor);
                Document attachment = await _attachmentRepository.GetObjectByIdAsync(id);
                if (attachment != null)
                {
                    if (IsRemoteDocumentUrl(attachment.SubDirectory))
                    {
                        return Redirect(attachment.SubDirectory);
                    }

                     string fullPath = System.IO.Path.Combine(BLOB_PATH, attachment.SubDirectory, attachment.Guid.ToString()+ attachment.FileType);
                    try
                    {
                        if (attachment == null)
                        {
                            typeError = "FileNotFound";
                            throw new Exception($"PDF attachment not found.");
                        }
                        
                        if (System.IO.File.Exists(fullPath))
                        {
                            var fileStream = System.IO.File.OpenRead(fullPath);
                            return File(fileStream, "application/pdf", Path.GetFileName(fullPath));
                        }
                        else
                        {
                            typeError = "FileNotFound";
                            throw new Exception($"{fullPath} not found.");
                        }
                    }
                    catch (Exception ex)
                    {
                        typeError = "InternalError";
                        Response.Headers.Add("X-Error-Message", ex.Message);
                        Response.Headers.Add("X-Error-Type", typeError);
                    }
                }
                typeError = "UserGuide";
                Response.Headers.Add("X-Error-Message", $"Attachment not found!");
                Response.Headers.Add("X-Error-Type", typeError);
                return StatusCode(404);
            }
            catch (Exception ex)
            {
                Log.Error(ex, ex.Message);
                Response.Headers.Add("X-Error-Message", ex.Message);
                Response.Headers.Add("X-Error-Type", typeError);
                return StatusCode(500); // Internal Server Error
            }
        }
        [HttpPost]
        public virtual async Task<object> DropDownLookupCustomQuery([FromBody] string query)
        {
            object Base = null;
            if (query == "OnSystem")
            {
                var controllerName = ControllerContext.RouteData.Values["controller"]?.ToString();
                BaseRepository<SysTable> sysTableRepo = new BaseRepository<SysTable>(_BaseRepository._baseConfiguration, _httpContextAccessor);
                SysTable sysTable = await sysTableRepo.GetSingleObject(s => s.Name == controllerName);
                Base = await _BaseRepository.ExecuteCustomQuery(sysTable.CustomQuery);
            }
            else Base = await _BaseRepository.ExecuteCustomQuery(query);
            var requestParams = HttpContext.Request.Query.ToList();
            IDictionary<string, object> dynamicObj = new ExpandoObject { };
            foreach (var item in requestParams)
            {
                dynamicObj[item.Key] = item.Value;
            }

            if (dynamicObj.ContainsKey("key"))
            {
                var obj = dynamicObj["key"];
                int result = 0;
                int.TryParse(obj.ToString(), out result);
                if (result != 0)
                {
                    var list = Base as List<Dictionary<string, object>>;
                    if (list != null)
                    {
                        var filtered = list
                            .Where(d => d.ContainsKey("id") && d["id"] != null && Convert.ToInt32(d["id"]) == result)
                            .ToList();

                        Base = filtered;
                    }
                }
            }
            else
            {
                Base = await _BaseRepository.GetAll();
            }

            if (Base == null)
            {
                return StatusCode(500, "Null Object");
            }

            return Ok(Base);
        }


        protected static List<KeyValuePair<string, Microsoft.Extensions.Primitives.StringValues>> NormalizeGridLoadParams(
            Microsoft.AspNetCore.Http.IQueryCollection queryParams,
            int defaultTake = 50,
            int maxTake = 200)
        {
            var normalized = queryParams
                .Where(item => !string.Equals(item.Key, "_", StringComparison.OrdinalIgnoreCase))
                .ToList();

            // Keep non-grid GetAll calls backward compatible. DevExtreme always sends
            // at least one of these values when remote paging is active.
            var hasPaging = queryParams.ContainsKey("skip") || queryParams.ContainsKey("take");
            if (!hasPaging)
                return normalized;

            var skip = queryParams.TryGetValue("skip", out var rawSkip) && int.TryParse(rawSkip.ToString(), out var parsedSkip)
                ? Math.Max(parsedSkip, 0)
                : 0;
            var take = queryParams.TryGetValue("take", out var rawTake) && int.TryParse(rawTake.ToString(), out var parsedTake)
                ? Math.Clamp(parsedTake, 1, maxTake)
                : defaultTake;

            normalized.RemoveAll(item =>
                string.Equals(item.Key, "skip", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(item.Key, "take", StringComparison.OrdinalIgnoreCase));
            normalized.Add(new KeyValuePair<string, Microsoft.Extensions.Primitives.StringValues>("skip", skip.ToString()));
            normalized.Add(new KeyValuePair<string, Microsoft.Extensions.Primitives.StringValues>("take", take.ToString()));

            return normalized;
        }

        //[AllowAnonymous] // test
        [HttpGet]
        public virtual async Task<ActionResult<List<T>>> GetAll()
        {
            var queryParams = HttpContext.Request.Query;
            var requestParams = NormalizeGridLoadParams(queryParams);
            IDictionary<string, object> dynamicObj = new ExpandoObject { };
            foreach (var item in requestParams)
            {
                dynamicObj[item.Key] = item.Value;
            }

            var rawParams = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            foreach (var item in requestParams)
            {
                if (item.Key == "_") continue;
                rawParams[item.Key] = item.Value.ToString() ?? "";
            }

            var Base = new List<T>();

            if (requestParams.Count > 1)
            {

            }

            if (dynamicObj.ContainsKey("key") )
            {

                    var obj = dynamicObj["key"];
                    int result = 0;
                    int.TryParse(obj.ToString(), out result);
                    if (result != 0)
                        Base = await _BaseRepository.GetManyObjectByIdAsync(int.Parse(obj.ToString()));


            }
            else if (
                rawParams.TryGetValue("refField", out var refField) &&
                rawParams.TryGetValue("refKey", out var refKey) &&
                !string.IsNullOrWhiteSpace(refField) &&
                !string.IsNullOrWhiteSpace(refKey)
            )
            {
                var filters = Util.ExtractDynamicFilters(rawParams);

                if (filters.Count > 0)
                    Base = await _BaseRepository.GetByDynamicField(filters, rawParams);
                //else
                //Base = await _BaseRepository.GetByDynamicField(refField, refKey, rawParams);
            }
            else
            {
                Base = await _BaseRepository.GetAll(requestParams);
            }

            //var Base = await _BaseRepository.GetAll();
            if (Base == null)
            {
                return NotFound();
            }

            return Ok(Base);
        }
        [HttpGet]
        public virtual async Task<ActionResult<T>> GetAllActive()
        {
            var Base = await _BaseRepository.GetAllActive();
            if (Base == null)
            {
                return NotFound();
            }

            return Ok(Base);
        }

        [HttpGet]
        public virtual async Task<ActionResult<List<dynamic>>> GetSystemScheme()
        {
            try
            {
                var entity = new T();
                dynamic Base = await _BaseRepository.GetSystemScheme(entity);
                List<DataGridConfig> dataGridConfigs = new List<DataGridConfig>();
                dataGridConfigs.AddRange(JsonConvert.DeserializeObject<List<DataGridConfig>>(JsonConvert.SerializeObject(Base)));
                return Ok(dataGridConfigs);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet]
        public virtual async Task<ActionResult<List<DataGridConfig>>> GetScheme()
        {
            try
            {
                var entity = new T();
                dynamic Base = await _BaseRepository.GetScheme(entity);
                List<DataGridConfig> dataGridConfigs = new List<DataGridConfig>();
                dataGridConfigs.AddRange(JsonConvert.DeserializeObject<List<DataGridConfig>>(JsonConvert.SerializeObject(Base)));
                List<DataGridConfig> returnDataGridConfigs = new List<DataGridConfig>();
                foreach (DataGridConfig item in dataGridConfigs)
                {
                    DataGridConfig returnObj = item;
                    if (returnObj.MappingFieldId != null)
                    {
                        BaseRepository<SysTable> sysTableRepo = new BaseRepository<SysTable>(_BaseRepository._baseConfiguration, _httpContextAccessor);
                        dynamic obj = sysTableRepo.GetObjectByIdAsync((int)returnObj.MappingFieldId);
                        string objString = JsonConvert.SerializeObject(obj.Result);
                        returnObj.MappingFieldFK = JsonConvert.DeserializeObject<SysTable>(objString);
                    }
                    returnDataGridConfigs.Add(returnObj);
                }
                return Ok(returnDataGridConfigs);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet]
        public virtual async Task<ActionResult<List<DataGridConfig>>> GetAllScheme()
        {
            try
            {
                var entity = new T();
                dynamic Base = await _BaseRepository.GetAllScheme();
                List<DataGridConfig> dataGridConfigs = new List<DataGridConfig>();
                dataGridConfigs.AddRange(JsonConvert.DeserializeObject<List<DataGridConfig>>(JsonConvert.SerializeObject(Base)));
                List<DataGridConfig> returnDataGridConfigs = new List<DataGridConfig>();
                BaseRepository<SysTable> sysTableRepo = new BaseRepository<SysTable>(_BaseRepository._baseConfiguration, _httpContextAccessor);
                foreach (DataGridConfig item in dataGridConfigs)
                {
                    DataGridConfig returnObj = item;
                    if (returnObj.MappingFieldId != null)
                    {
                        dynamic obj = sysTableRepo.GetObjectByIdAsync((int)returnObj.MappingFieldId);
                        string objString = JsonConvert.SerializeObject(obj.Result);
                        returnObj.MappingFieldFK = JsonConvert.DeserializeObject<SysTable>(objString);
                    }
                    if (returnObj.SysTableId != null)
                    {
                        dynamic obj = sysTableRepo.GetObjectByIdAsync((int)returnObj.SysTableId);
                        string objString = JsonConvert.SerializeObject(obj.Result);
                        returnObj.SysTableFK = JsonConvert.DeserializeObject<SysTable>(objString);
                    }
                    returnDataGridConfigs.Add(returnObj);
                }
                return Ok(returnDataGridConfigs);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("{ModelName}")]
        public virtual async Task<ActionResult<SysTable>> GetSTConfig(string ModelName)
        {
            BaseRepository<SysTable> sysTableRepo = new BaseRepository<SysTable>(_BaseRepository._baseConfiguration, _httpContextAccessor);
            dynamic obj = await sysTableRepo.GetSingleObject( s => s.Name == ModelName);
            if (ModelName == nameof(SysTable)
                )
            {
                obj = await sysTableRepo.GetAll();
            }
            if ((obj != null && (
                ModelName == nameof(Roles)
                || ModelName == nameof(Users)
                ))  || (obj == null && (
                ModelName == nameof(Constant)
                || ModelName == nameof(DataGridConfig)
                || ModelName == nameof(EnumData)
                || ModelName == nameof(FormatCodeNo)
                || ModelName == nameof(Menu)
                || ModelName == nameof(UsersCache)
                ))
                )
            {
                return Ok(new { Name = ModelName });
            }
            if (obj != null)
            {
                try
                {
                    if (obj is List<SysTable>)
                    {

                    }
                    if (obj is SysTable && !string.IsNullOrEmpty(obj.CustomQuery))
                        obj.CustomQuery = "OnSystem";
                }
                catch
                {

                }
                //string objString = JsonConvert.SerializeObject(obj.Result);

                return Ok(obj);
            }
            else
            {
                return StatusCode(500,"Model Name is not allowed !!");
            }
        }


        [HttpGet("{id}")]
        public virtual async Task<ActionResult<T>> PullData(string id)
        {
            return Ok();
            }
        public virtual async Task<IEnumerable<T>>  GetJsonData<T>(IWebHostEnvironment env, string folder, string filename)
        {
            var pathToFile = ControllerUtil.ControllerUtil.GetWebFile(env, folder, filename);
            return JsonConvert.DeserializeObject<IEnumerable<T>>(Util.GetJsonString(pathToFile)).ToList();
        }


        [HttpPost]
        public virtual async Task<IActionResult> CloneFileAndData(Document cloneDocument, string sourceFolder, string oldGuid,string oldFileType)
        {// Use blog settings while override this method instead
            var path = BLOB_PATH;
            IBaseRepository<Document> _documentRepository = new BaseRepository<Document>(_BaseRepository._baseConfiguration, _httpContextAccessor);
            string folder = sourceFolder;
            string guid = cloneDocument.RecordGuid.ToString();
            if (System.IO.File.Exists(Path.Combine(path, folder, $"{oldGuid}{oldFileType}")))
            {
                    var fileBytes = System.IO.File.ReadAllBytes(Path.Combine(path, folder, $"{oldGuid}{oldFileType}"));
                    var unixMilliseconds = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
                    string s = Convert.ToBase64String(fileBytes);
                    if (!System.IO.Directory.Exists(BLOB_PATH))
                        Directory.CreateDirectory(BLOB_PATH);
                    if (!System.IO.Directory.Exists(Path.Combine(BLOB_PATH, cloneDocument.SubDirectory)))
                        Directory.CreateDirectory(Path.Combine(BLOB_PATH, cloneDocument.SubDirectory));
                cloneDocument = await _documentRepository.InsertData(cloneDocument);
                System.IO.File.WriteAllBytes(Path.Combine(path, cloneDocument.SubDirectory, $"{cloneDocument.Guid}{cloneDocument.FileType}"), fileBytes);

                    return Ok(new { success = true, message = "File uploaded successfully", attachment = cloneDocument });
            }
            else
                return Ok(new { success = false, message = "No file uploaded" });
        }


        #endregion

        #region POST API 

        protected virtual IActionResult? ValidateUploadFileSize(IFormFile file)
        {
            var maxFileSizeMb = _BaseRepository._baseConfiguration.GetValue<long?>("Upload:MaxFileSizeMB") ?? 50;
            if (maxFileSizeMb <= 0)
            {
                maxFileSizeMb = 50;
            }

            var maxFileSize = maxFileSizeMb * 1024L * 1024L;
            if (file.Length <= maxFileSize)
            {
                return null;
            }

            return StatusCode(StatusCodes.Status413PayloadTooLarge, new
            {
                success = false,
                message = $"File '{file.FileName}' exceeds the {maxFileSizeMb} MB upload limit."
            });
        }

        private async Task StoreUploadedDocumentAsync(
            Document document,
            IFormFile file,
            string folder,
            IBaseRepository<Document> documentRepository,
            DocumentStorageTarget storageTarget,
            CancellationToken cancellationToken)
        {
            if (storageTarget == DocumentStorageTarget.SharePoint)
            {
                var sharePointStorage = HttpContext.RequestServices
                    .GetRequiredService<ISharePointDocumentStorage>();
                await using var uploadStream = file.OpenReadStream();
                var remoteFileName =
                    $"{document.Guid}_{System.IO.Path.GetFileName(file.FileName)}";
                var webUrl = await sharePointStorage.UploadAsync(
                    uploadStream,
                    remoteFileName,
                    folder,
                    file.ContentType,
                    cancellationToken);

                var update = new Document
                {
                    SubDirectory = webUrl
                };
                await documentRepository.UpdateData(
                    update,
                    document,
                    new[] { nameof(Document.SubDirectory) },
                    nameof(Document.Id));

                var persisted = await documentRepository.GetObjectByIdAsync(document.Id);
                if (persisted == null
                    || !string.Equals(
                        persisted.SubDirectory,
                        webUrl,
                        StringComparison.OrdinalIgnoreCase))
                {
                    throw new InvalidOperationException(
                        "The file was uploaded to SharePoint, but its web URL could not be saved " +
                        "to Document.SubDirectory.");
                }

                document.SubDirectory = webUrl;
                return;
            }

            var storageFolder = storageTarget == DocumentStorageTarget.Nas
                ? document.SubDirectory
                : System.IO.Path.Combine(BLOB_PATH, folder);
            if (string.IsNullOrWhiteSpace(storageFolder))
            {
                throw new InvalidOperationException(
                    $"The {storageTarget} document storage path is not configured.");
            }

            if (!System.IO.Directory.Exists(storageFolder))
            {
                Directory.CreateDirectory(storageFolder);
            }

            var filePath = System.IO.Path.Combine(
                storageFolder,
                $"{document.Guid}{document.FileType}");
            await using var sourceStream = file.OpenReadStream();
            await using var destinationStream = new FileStream(
                filePath,
                FileMode.Create,
                FileAccess.Write,
                FileShare.None,
                bufferSize: 81920,
                useAsync: true);
            await sourceStream.CopyToAsync(destinationStream, cancellationToken);
        }

        private string ResolveDocumentSubDirectory(
            string folder,
            DocumentStorageTarget storageTarget)
        {
            if (storageTarget != DocumentStorageTarget.Nas)
            {
                return System.IO.Path.Combine(folder);
            }

            var nasPath = _BaseRepository._baseConfiguration["NasStorage:Path"];
            if (string.IsNullOrWhiteSpace(nasPath))
            {
                throw new InvalidOperationException(
                    "NasStorage:Path is required for NAS document uploads.");
            }

            return System.IO.Path.Combine(nasPath, folder);
        }

        private static Document CreateUploadedDocument(
            IFormFile file,
            string folder,
            string guid,
            string sectionName,
            string department,
            string? data = null)
        {
            var document = new Document
            {
                SubDirectory = System.IO.Path.Combine(folder),
                RecordGuid = !string.IsNullOrWhiteSpace(guid) ? Guid.Parse(guid) : null,
                FileName = file.FileName,
                FileType = System.IO.Path.GetExtension(file.FileName),
                Size = file.Length
            };

            if (!string.IsNullOrEmpty(data))
            {
                dynamic attributes = new ExpandoObject();
                JsonConvert.PopulateObject(data, attributes);
                document.Attributes = JsonConvert.SerializeObject(attributes);
            }
            else
            {
                document.Attributes = JsonConvert.SerializeObject(new
                {
                    SectionName = sectionName,
                    Department = department
                });
            }

            return document;
        }

        private async Task RemoveFailedDocumentRecordAsync(
            IBaseRepository<Document> documentRepository,
            Document? document)
        {
            if (document == null || document.Id <= 0) return;
            try
            {
                await documentRepository.DeleteData(
                    document,
                    document.Id,
                    nameof(Document.Id),
                    true);
            }
            catch (Exception cleanupException)
            {
                _loggerT.LogError(
                    cleanupException,
                    "Could not remove failed Document record {DocumentId}.",
                    document.Id);
            }
        }

        private async Task<IActionResult> UploadRequestFileAsync(
            DocumentStorageTarget storageTarget)
        {
            IBaseRepository<Document> _documentRepository = new BaseRepository<Document>(_BaseRepository._baseConfiguration, _httpContextAccessor);
            IFormFileCollection files = ((FormCollection)(Request.Form)).Files;
            string folder = Request.Headers["Folder"];
            string guid = Request.Headers["RecordGuid"];
            string sectionName = Request.Headers["SectionName"];
            string department = Request.Headers["Department"];
            string data = Request.Headers["Data"];
            IFormFile file = files.FirstOrDefault();
            if (file != null && file.Length > 0)
            {
                var sizeValidationError = ValidateUploadFileSize(file);
                if (sizeValidationError != null) return sizeValidationError;

                Document? document = null;
                try
                {
                    document = CreateUploadedDocument(
                        file,
                        folder,
                        guid,
                        sectionName,
                        department,
                        data);
                    document.SubDirectory = ResolveDocumentSubDirectory(folder, storageTarget);
                    document = await _documentRepository.InsertData(document);
                    await StoreUploadedDocumentAsync(
                        document,
                        file,
                        folder,
                        _documentRepository,
                        storageTarget,
                        HttpContext.RequestAborted);

                    return Ok(new
                    {
                        success = true,
                        message = "File uploaded successfully",
                        attachment = document
                    });
                }
                catch (Exception exception)
                {
                    await RemoveFailedDocumentRecordAsync(_documentRepository, document);
                    _loggerT.LogError(
                        exception,
                        "Async document upload to {StorageTarget} failed.",
                        storageTarget);
                    return StatusCode(StatusCodes.Status502BadGateway, new
                    {
                        success = false,
                        message = exception.Message
                    });
                }
            }
            else
                return Ok(new { success = false, message = "No file uploaded" });
        }

        /// <summary>Uploads a Document to the admin-configured Local or SharePoint storage.</summary>
        [HttpPost]
        public virtual async Task<IActionResult> AsyncUploadFile()
        {
            var settings = await SystemWriteControl.GetAsync(_BaseRepository._connectionString);
            var storageTarget = string.Equals(
                settings.AttachmentStorage,
                "SharePoint",
                StringComparison.OrdinalIgnoreCase)
                    ? DocumentStorageTarget.SharePoint
                    : DocumentStorageTarget.Local;

            // LEGACY ROLLBACK: uploads always used local BlobStorage.
            // return await UploadRequestFileAsync(DocumentStorageTarget.Local);
            return await UploadRequestFileAsync(storageTarget);
        }

        /// <summary>Uploads a Document explicitly to local BlobStorage.</summary>
        [HttpPost]
        public virtual Task<IActionResult> AsyncUploadFileLocal()
        {
            return UploadRequestFileAsync(DocumentStorageTarget.Local);
        }

        /// <summary>Uploads a Document to the configured NAS path.</summary>
        [HttpPost]
        public virtual Task<IActionResult> AsyncUploadFileNAS()
        {
            return UploadRequestFileAsync(DocumentStorageTarget.Nas);
        }

        /// <summary>Uploads a Document to SharePoint through Microsoft Graph.</summary>
        [HttpPost]
        public virtual Task<IActionResult> AsyncUploadFileSharePoint()
        {
            return UploadRequestFileAsync(DocumentStorageTarget.SharePoint);
        }

        private async Task<IActionResult> UploadSingleFileAsync(
            IFormFile file,
            DocumentStorageTarget storageTarget)
        {
            IBaseRepository<Document> _documentRepository = new BaseRepository<Document>(_BaseRepository._baseConfiguration, _httpContextAccessor);
            string folder = Request.Headers["Folder"];
            string guid = Request.Headers["RecordGuid"];
            string sectionName = Request.Headers["SectionName"];
            string department = Request.Headers["Department"];
            if (file != null && file.Length > 0)
            {
                var sizeValidationError = ValidateUploadFileSize(file);
                if (sizeValidationError != null) return sizeValidationError;

                Document? document = null;
                try
                {
                    document = CreateUploadedDocument(
                        file,
                        folder,
                        guid,
                        sectionName,
                        department);
                    document.SubDirectory = ResolveDocumentSubDirectory(folder, storageTarget);
                    document = await _documentRepository.InsertData(document);
                    await StoreUploadedDocumentAsync(
                        document,
                        file,
                        folder,
                        _documentRepository,
                        storageTarget,
                        HttpContext.RequestAborted);

                    return Ok(new
                    {
                        success = true,
                        message = "File uploaded successfully",
                        attachment = document
                    });
                }
                catch (Exception exception)
                {
                    await RemoveFailedDocumentRecordAsync(_documentRepository, document);
                    _loggerT.LogError(
                        exception,
                        "Async single document upload to {StorageTarget} failed.",
                        storageTarget);
                    return StatusCode(StatusCodes.Status502BadGateway, new
                    {
                        success = false,
                        message = exception.Message
                    });
                }
            }
            else
                return Ok(new { success = false, message = "No file uploaded" });
        }

        /// <summary>Uploads one explicitly bound Document file to the configured storage.</summary>
        [HttpPost]
        public virtual async Task<IActionResult> AsyncUploadSingleFile(IFormFile file)
        {
            var settings = await SystemWriteControl.GetAsync(_BaseRepository._connectionString);
            var storageTarget = string.Equals(
                settings.AttachmentStorage,
                "SharePoint",
                StringComparison.OrdinalIgnoreCase)
                    ? DocumentStorageTarget.SharePoint
                    : DocumentStorageTarget.Local;

            // LEGACY ROLLBACK: single-file uploads always used local BlobStorage.
            // return await UploadSingleFileAsync(file, DocumentStorageTarget.Local);
            return await UploadSingleFileAsync(file, storageTarget);
        }

        /// <summary>Uploads one explicitly bound Document file to local BlobStorage.</summary>
        [HttpPost]
        public virtual Task<IActionResult> AsyncUploadSingleFileLocal(IFormFile file)
        {
            return UploadSingleFileAsync(file, DocumentStorageTarget.Local);
        }

        /// <summary>Uploads one explicitly bound Document file to NAS storage.</summary>
        [HttpPost]
        public virtual Task<IActionResult> AsyncUploadSingleFileNAS(IFormFile file)
        {
            return UploadSingleFileAsync(file, DocumentStorageTarget.Nas);
        }

        /// <summary>Uploads one explicitly bound Document file to SharePoint.</summary>
        [HttpPost]
        public virtual Task<IActionResult> AsyncUploadSingleFileSharePoint(IFormFile file)
        {
            return UploadSingleFileAsync(file, DocumentStorageTarget.SharePoint);
        }





        [HttpPost]
        public virtual async Task<object> ExecuteCustomQuery([FromBody] string query)
        {
            object obj = null;
            if (query == "OnSystem")
            { 
                var controllerName = ControllerContext.RouteData.Values["controller"]?.ToString();
                BaseRepository<SysTable> sysTableRepo = new BaseRepository<SysTable>(_BaseRepository._baseConfiguration, _httpContextAccessor);
                SysTable sysTable = await sysTableRepo.GetSingleObject(s => s.Name == controllerName);

                var requestParams = HttpContext.Request.Query.ToList();
                IDictionary<string, object> dynamicObj = new ExpandoObject { };
                foreach (var item in requestParams)
                {
                    dynamicObj[item.Key] = item.Value;
                }
                var Base = new List<T>();
                if (requestParams != null && requestParams.Count > 0)
                {
                    if (dynamicObj.ContainsKey("key"))
                    {
                        var built = Util.LoadParamsBuildCustomQuery<object>(
                            baseQuery: sysTable.CustomQuery,
                            loadParams: Util.NormalizeRefParams(requestParams),
                            defaultOrderBy: "Id",
                            defaultOrderDir: "DESC",
                            pkTieBreaker: "Id",
                            mainTableAlias: null,
                            allowedColumns: new HashSet<string>(StringComparer.OrdinalIgnoreCase)
                            {
                                "Id",
                                "Guid",
                                "CreatedBy",
                                "CreatedDate",
                                "Deleted"
                            }
                        );
                        sysTable.CustomQuery = built.Sql;
                        return obj = await _BaseRepository.ExecuteCustomQuery(sysTable.CustomQuery, built.Parameters);
                    }
                }
                obj = await _BaseRepository.ExecuteCustomQuery(sysTable.CustomQuery);
            }
            else
                obj = await _BaseRepository.ExecuteCustomQuery(query);
            return obj;
        }


        [HttpPost]
        public virtual async Task<IActionResult> InsertData([FromForm] InsertFormCollection form)
        {
            var entity = new T();
            JsonConvert.PopulateObject(form.values, entity);
            entity = await _BaseRepository.InsertData(entity);
            return Ok(entity);
        }
        [HttpPost]
        public virtual async Task<ActionResult<T>> UpdateEnum([FromForm] InsertFormCollection formData)
        {

            IDictionary<string, object> dynamicObj = new ExpandoObject { };
            JsonConvert.PopulateObject(formData.values, dynamicObj);
            await _BaseRepository.UpdateEnum(dynamicObj["mappingField"].ToString(), dynamicObj["key"].ToString(), (long)dynamicObj["sysTableId"]);
            return Ok();
        }
        #endregion

        #region DELETE API 
        [HttpDelete]
        public virtual async Task<IActionResult> DeleteAttachmentData([FromForm] DeleteFormCollection form)
        {
            IBaseRepository<Attachment> _attachmentRepository = new BaseRepository<Attachment>(_BaseRepository._baseConfiguration, _httpContextAccessor);
            var entity = new Attachment();

            Attachment attachment = new Attachment();
            if (form.key != null)
            {
                attachment = await _attachmentRepository.GetSingleObject(s => s.Id == (int)form.key);
                if (attachment.file_folder != null)
                    if (System.IO.File.Exists(Path.Combine(BLOB_PATH, attachment.file_folder)))
                        System.IO.File.Delete(Path.Combine(BLOB_PATH, attachment.file_folder));

                attachment = await _attachmentRepository.DeleteData(attachment, (int)attachment.Id, "Id", false);
            }
            return Ok(entity);

        }
        [HttpDelete]
        public virtual async Task<IActionResult> DeleteData([FromForm] DeleteFormCollection form)
        {
            var entity = new T();
            entity = await _BaseRepository.DeleteData(entity, form.key, "Id", true);
            return Ok(entity);
        }
        #endregion

        #region PUT API 
        [HttpPut]
        public virtual HttpResponseMessage UpdateNote([FromForm] UpdateFormCollection form)
        {
            var entity = new Attachment();
            IBaseRepository<Attachment> _attachmentRepository = new BaseRepository<Attachment>(_BaseRepository._baseConfiguration, _httpContextAccessor);
            JsonConvert.PopulateObject(form.values, entity);
            _attachmentRepository.UpdateData(entity, form.values, form.key, "Id");
            return new HttpResponseMessage(HttpStatusCode.OK);
        }
        //[AllowAnonymous] // test
        [HttpPut]
        public virtual HttpResponseMessage UpdateData([FromForm] UpdateFormCollection form)
        {
            var entity = new T();
            JsonConvert.PopulateObject(form.values, entity);
            _BaseRepository.UpdateData(entity, form.values, form.key, "Id");
            return new HttpResponseMessage(HttpStatusCode.OK);
        }
        #endregion


        #region Bulk Action


        // POST: api/YourModel/BulkInsert
        // Body: [{ ...entity1 }, { ...entity2 }]
        [HttpPost]
        public virtual async Task<IActionResult> BulkInsert([FromBody] List<T> entities)
        {
            if (entities == null || entities.Count == 0)
                return BadRequest("At least one item is required.");
            if (entities.Any(entity => entity == null))
                return BadRequest("Bulk insert items cannot be null.");

            const int maxBatchSize = 5000;
            if (entities.Count > maxBatchSize)
                return BadRequest($"A bulk request cannot contain more than {maxBatchSize} items.");

            await _BaseRepository.BulkInsertAsync(entities);
            return Ok(new
            {
                operation = "insert",
                affected = entities.Count
            });
        }


        // PUT: api/YourModel/BulkUpdate
        // Body: { "items": [{ "id": 1, ... }], "updateFields": ["Field1", "Field2"] }
        [HttpPut]
        public virtual async Task<IActionResult> BulkUpdate([FromBody] BulkUpdateRequest<T> request)
        {
            if (request?.Items == null || request.Items.Count == 0)
                return BadRequest("At least one item is required.");
            if (request.Items.Any(item => item == null))
                return BadRequest("Bulk update items cannot be null.");
            if (request.UpdateFields == null || request.UpdateFields.Count == 0)
                return BadRequest("At least one update field is required.");

            const int maxBatchSize = 5000;
            if (request.Items.Count > maxBatchSize)
                return BadRequest($"A bulk request cannot contain more than {maxBatchSize} items.");

            const string keyField = "Id";
            var modelProperties = typeof(T).GetProperties()
                .ToDictionary(property => property.Name, StringComparer.OrdinalIgnoreCase);
            if (!modelProperties.TryGetValue(keyField, out var keyProperty))
                return BadRequest($"{typeof(T).Name} does not define the required {keyField} key.");

            var invalidKeyIndexes = request.Items
                .Select((item, index) => new { item, index })
                .Where(entry => IsEmptyBulkKey(keyProperty.GetValue(entry.item)))
                .Select(entry => entry.index)
                .ToList();
            if (invalidKeyIndexes.Count > 0)
                return BadRequest($"Every update item must contain a non-zero {keyField}. Invalid item indexes: {string.Join(", ", invalidKeyIndexes)}.");

            var protectedFields = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                keyField,
                "Guid",
                "CreatedBy",
                "CreatedDate",
                "Deleted",
                "DeletedBy",
                "DeletedDate"
            };
            var updateFields = request.UpdateFields
                .Where(field => !string.IsNullOrWhiteSpace(field))
                .Select(field => field.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();
            var invalidFields = updateFields
                .Where(field =>
                    !modelProperties.TryGetValue(field, out var property) ||
                    protectedFields.Contains(field) ||
                    !IsBulkWritableProperty(property))
                .ToList();
            if (invalidFields.Count > 0)
                return BadRequest($"Unknown or protected update field(s): {string.Join(", ", invalidFields)}.");

            updateFields = updateFields
                .Select(field => modelProperties[field].Name)
                .ToList();

            // Persist the audit values populated by BaseRepository.HandleSystemAttribute.
            if (modelProperties.ContainsKey("ModifiedBy"))
                updateFields.Add("ModifiedBy");
            if (modelProperties.ContainsKey("ModifiedDate"))
                updateFields.Add("ModifiedDate");
            updateFields = updateFields
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            await _BaseRepository.BulkUpdateAsync(request.Items, updateFields.ToArray(), keyField);
            return Ok(new
            {
                operation = "update",
                affected = request.Items.Count,
                fields = updateFields
            });
        }


        // DELETE: api/YourModel/BulkDelete
        // Body: { "ids": [1, 2], "hardDelete": false }
        [HttpDelete]
        public virtual async Task<IActionResult> BulkDelete([FromBody] BulkDeleteRequest request)
        {
            if (request?.Ids == null || request.Ids.Count == 0)
                return BadRequest("At least one Id is required.");
            if (request.Ids.Any(id => id <= 0))
                return BadRequest("Every Id must be greater than zero.");

            const int maxBatchSize = 5000;
            var ids = request.Ids.Distinct().ToList();
            if (ids.Count > maxBatchSize)
                return BadRequest($"A bulk request cannot contain more than {maxBatchSize} Ids.");

            await _BaseRepository.BulkDeleteAsync(ids.Cast<object>(), "Id", request.HardDelete);
            return Ok(new
            {
                operation = request.HardDelete ? "hard-delete" : "soft-delete",
                affected = ids.Count
            });
        }


        // POST: api/YourModel/BulkDelete
        // Legacy body: [1, 2]
        [HttpPost]
        public virtual async Task<IActionResult> BulkDelete([FromBody] List<int> ids)
        {
            if (ids == null || ids.Count == 0)
                return BadRequest("At least one Id is required.");
            if (ids.Any(id => id <= 0))
                return BadRequest("Every Id must be greater than zero.");

            var distinctIds = ids.Distinct().ToList();
            const int maxBatchSize = 5000;
            if (distinctIds.Count > maxBatchSize)
                return BadRequest($"A bulk request cannot contain more than {maxBatchSize} Ids.");

            await _BaseRepository.BulkDeleteAsync(distinctIds.Cast<object>(), "Id", true);
            return Ok(new
            {
                operation = "hard-delete",
                affected = distinctIds.Count,
                legacy = true
            });
        }


        private static bool IsEmptyBulkKey(object? value)
        {
            if (value == null)
                return true;

            return value switch
            {
                byte number => number == 0,
                short number => number == 0,
                int number => number == 0,
                long number => number == 0,
                uint number => number == 0,
                ulong number => number == 0,
                Guid guid => guid == Guid.Empty,
                string text => string.IsNullOrWhiteSpace(text) || text == "0",
                _ => false
            };
        }


        private static bool IsBulkWritableProperty(PropertyInfo property)
        {
            if (!property.CanWrite || property.GetIndexParameters().Length > 0)
                return false;

            var propertyType = Nullable.GetUnderlyingType(property.PropertyType) ?? property.PropertyType;
            return propertyType.IsPrimitive ||
                   propertyType.IsEnum ||
                   propertyType == typeof(string) ||
                   propertyType == typeof(decimal) ||
                   propertyType == typeof(DateTime) ||
                   propertyType == typeof(DateTimeOffset) ||
                   propertyType == typeof(TimeSpan) ||
                   propertyType == typeof(Guid) ||
                   propertyType == typeof(byte[]);
        }


        #endregion












        //public virtual async Task<ActionResult<List<DataGridConfig>>> GetScheme()
        //{
        //    var entity = new T();
        //    dynamic Base = await _BaseRepository.GetScheme(entity);
        //    List<DataGridConfig> dataGridConfigs = new List<DataGridConfig>();
        //    dataGridConfigs.AddRange(JsonConvert.DeserializeObject<List<DataGridConfig>>(JsonConvert.SerializeObject(Base)));
        //    return Ok(dataGridConfigs);
        //}







    }
}
