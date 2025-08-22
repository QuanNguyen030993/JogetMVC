using JetBrains.Annotations;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Org.BouncyCastle.Crypto;
using SurveyReportRE.Common;
using SurveyReportRE.Models;
using SurveyReportRE.Models.Base;
using SurveyReportRE.Models.Business.Migration.Config;
using SurveyReportRE.Models.Migration.Business.Data;
using SurveyReportRE.Models.Migration.Config;
using SurveyReportRE.Models.Request;
using System.Dynamic;
using System.Linq.Expressions;
using System.Net;
using System.Net.Http.Formatting;
using System.Reflection;
using System.Security.AccessControl;
using System.Security.Claims;
using System.Security.Principal;
using SurveyReportRE.ControllerUtil;
using MimeMapping;


namespace SurveyReportRE.Controllers.Base
{
    public class BaseControllerApi<T> : ControllerBase where T : class, new()
    {
        private readonly IBaseRepository<T> _BaseRepository;
        internal IHttpContextAccessor _httpContextAccessor { get; set; }
        private static string DOMAIN_NAME = "";
        private static string BLOB_PATH = "";

        public BaseControllerApi(IBaseRepository<T> BaseRepository, IHttpContextAccessor httpContextAccessor)
        {
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

            _httpContextAccessor = httpContextAccessor;
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

        [HttpGet]
        public virtual async Task<ActionResult<T>> GetUserRoles(string accountName)
        {
            string roleName = "";
            var roles = await _BaseRepository.GetUserRoles(accountName.Replace(DOMAIN_NAME, ""));
            if (roles != null)
                roleName = roles.RoleName.ToString();
            return Ok(roleName);
        }

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

        [HttpPost]
        public virtual async Task<object> DropDownLookupCustomQuery([FromBody] string query)
        {
            object Base = await _BaseRepository.ExecuteCustomQuery(query);
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
                return NotFound();
            }

            return Ok(Base);
        }

        [HttpGet]
        public virtual async Task<ActionResult<T>> GetAll()
        {
            var Base = await _BaseRepository.GetAll();
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
        public virtual async Task<ActionResult<Attachment>> GetAttachtmentBySurvey(int id)
        {//Dùng cho control
            List<Attachment> sitePictures = new List<Attachment>();
            IBaseRepository<Attachment> _attachmentRepository = new BaseRepository<Attachment>(_BaseRepository._baseConfiguration, _httpContextAccessor);
            sitePictures = await _attachmentRepository.GetFKMany(id, "SurveyId");
            List<AttachmentForm> attachmentRequests = new List<AttachmentForm>();
            foreach (Attachment item in sitePictures)
            {
                AttachmentForm attachmentForm = new AttachmentForm();
                Attachment BaseItem = new Attachment();
                BaseItem = item;
                attachmentForm.name = BaseItem.FileName;
                string mimeType = MimeUtility.GetMimeMapping(BaseItem.FileName);
                attachmentForm.type = mimeType;
                if (!System.IO.File.Exists(Path.Combine(BLOB_PATH, BaseItem.SubThumbnailDirectory))) continue;
                byte[] byteArray = System.IO.File.ReadAllBytes(Path.Combine(BLOB_PATH, BaseItem.SubThumbnailDirectory));
                attachmentForm.baseString = Convert.ToBase64String(byteArray);
                attachmentForm.fileData = Array.ConvertAll(byteArray, b => (int)b);
                attachmentForm.byteArray = byteArray;
                attachmentForm.size = attachmentForm.fileData.Length;
                attachmentForm.surveyId = BaseItem.SurveyId;
                attachmentForm.attachmentId = BaseItem.Id;
                attachmentForm.outlineId = BaseItem.OutlineId;
                attachmentForm.outlinePlaceholder = BaseItem.OutlinePlaceholder;
                attachmentForm.sitePictureId = 0;
                attachmentForm.sitePictureDescription = BaseItem.AttachmentNote;
                attachmentForm.attachmentGuid = item.Guid.ToString();
                attachmentForm.fileDate = item.ModifiedDate.ToString() ?? "";
                attachmentRequests.Add(attachmentForm);
            }
            return Ok(attachmentRequests);
        }

        public virtual async Task<IEnumerable<T>>  GetJsonData<T>(IWebHostEnvironment env, string folder, string filename)
        {
            var pathToFile = ControllerUtil.ControllerUtil.GetWebFile(env, folder, filename);
            return JsonConvert.DeserializeObject<IEnumerable<T>>(Util.GetJsonString(pathToFile)).ToList();
        }
        #endregion

        #region POST API 
        [HttpPost]
        public virtual async Task<IActionResult> AsyncUploadPicture(int surveyId, int outlineId, string outlinePlaceHolder = "")
        {// Use blog settings while override this method instead
            var path = BLOB_PATH;
            string folder = typeof(T).Name;
            IBaseRepository<Attachment> _attachmentRepository = new BaseRepository<Attachment>(_BaseRepository._baseConfiguration, _httpContextAccessor);
            //var storageFolder = _blobStorageSettings.CurrentValue.Path;
            IFormFileCollection files = null;
            files = ((FormCollection)(Request.Form)).Files;

            IFormFile file = null;
            file = files.FirstOrDefault();
            if (file != null && file.Length > 0)
            {
                using (var ms = new MemoryStream())
                {
                    file.CopyTo(ms);
                    var fileBytes = ms.ToArray();
                    var unixMilliseconds = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
                    string s = Convert.ToBase64String(fileBytes);
                    if (!System.IO.Directory.Exists(BLOB_PATH))
                        Directory.CreateDirectory(BLOB_PATH);
                    if (!System.IO.Directory.Exists(Path.Combine(BLOB_PATH, folder)))
                        Directory.CreateDirectory(Path.Combine(BLOB_PATH, folder));

                    Attachment attachment = new Attachment();
                    AttachmentRequest attachmentRequest = new AttachmentRequest();
                    attachmentRequest.surveyId = surveyId;
                    attachmentRequest.outlineId = outlineId;
                    attachmentRequest.outlinePlaceholder = outlinePlaceHolder;
                    attachment = Util.BindingAttachment(BLOB_PATH, folder, file.FileName, fileBytes, attachmentRequest);
                    attachment = await _attachmentRepository.InsertData(attachment);
                    AttachmentForm attachmentForm = ControllerHelper.BindingAttachmentForm(attachment,BLOB_PATH);
                    //System.IO.File.WriteAllBytes(Path.Combine(path.Value, folder, $"{unixMilliseconds}_{file.FileName}"), fileBytes);

                    return Ok(new { success = true, message = "File uploaded successfully", attachment = attachmentForm });
                }
            }
            else
                return Ok(new { success = false, message = "No file uploaded" });
        }

        [HttpPost]
        public virtual async Task<object> ExecuteCustomQuery([FromBody] string query)
        {
            object obj = await _BaseRepository.ExecuteCustomQuery(query);
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
                if (attachment.SubDirectory != null)
                    if (System.IO.File.Exists(Path.Combine(BLOB_PATH, attachment.SubDirectory)))
                        System.IO.File.Delete(Path.Combine(BLOB_PATH, attachment.SubDirectory));

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
        [HttpPut]
        public virtual HttpResponseMessage UpdateData([FromForm] UpdateFormCollection form)
        {
            var entity = new T();
            JsonConvert.PopulateObject(form.values, entity);
            _BaseRepository.UpdateData(entity, form.values, form.key, "Id");
            return new HttpResponseMessage(HttpStatusCode.OK);
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
