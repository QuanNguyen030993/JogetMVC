using LdapService;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using ERPCore.Controllers.Base;
using ERPCore.Models.Base;
using ERPCore.Models.Migration.Business.Config;
using ERPCore.Models.Request;
using System.Net;
using ERPCore.Models.Models.Parsing;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Spreadsheet;
using System.Globalization;
using ERPCore.ControllerUtil;
using ERPCore.Common;
using System.Text;
using System.Net.Http.Headers;
using RESurveyTool.Models.Models.Parsing;
using ERPCore.Models.Config;
using System.Text.RegularExpressions;
using System.Text.Json;
using DocumentFormat.OpenXml.Wordprocessing;
using static iText.Kernel.Pdf.Colorspace.PdfSpecialCs;
using ERPCore.Models.Business.Migration.Config;




namespace ERPCore.Controllers.Config
{
    [Route("api/[controller]/[action]")]
    [ApiController]
    public class UtilityController : BaseControllerApi<Utility>
    {
        //private readonly IBaseRepository<Utility> _BaseRepository;
        private readonly IConfiguration _configuration;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly Microsoft.Extensions.Options.IOptionsMonitor<BlobStorageSettings> _blobStorageSettings;
        private readonly URLConfig _urlConfig;
        private readonly InternalAuth _internalAuth;


        public UtilityController(IBaseRepository<Utility> BaseRepository, IConfiguration configuration, IHttpContextAccessor httpContextAccessor, Microsoft.Extensions.Options.IOptionsMonitor<BlobStorageSettings> blobStorageSettings) : base(BaseRepository, httpContextAccessor)
        {
            //_BaseRepository = BaseRepository;
            _configuration = configuration;
            _blobStorageSettings = blobStorageSettings;
            _urlConfig = configuration.GetSection("URLConfig").Get<URLConfig>();
            _internalAuth = configuration.GetSection("InternalAuth").Get<InternalAuth>();
        }

        #region GET API 




        [HttpGet("{module}/{view}")]
        public IActionResult GetViewContent(string module, string view)
        {
            var root = _blobStorageSettings.CurrentValue.DeployPath;

            var path = Path.Combine(
                root,
                "Pages",
                "Business",
                "Form",
                $"{module}",
                $"{view}.cshtml"
            );

            if (!System.IO.File.Exists(path))
            {
                return Ok(new
                {
                    success = false,
                    message = "View not found"
                });
            }

            var content = System.IO.File.ReadAllText(path);

            return Ok(new
            {
                success = true,
                content = content.Replace("@","")
                .Replace("dept", "'dept'")
                .Replace("(quotationId)", "'quotationId'")
                .Replace("(quotationGuid)", "'quotationGuid'")
            });
        }

        public async Task<ActionResult<Utility>> GetData(string sheetName)
        {
            //dynamic Base = null;
            string excelPath =
                $@"{_blobStorageSettings.CurrentValue.Path}\StaticData\plan.xlsx";

            using var stream1 = Util.OpenExcelReadStream(excelPath);
            var dependencies = ReadDependenciesFromStream(stream1, sheetName);
            return Ok(dependencies); // trả JSON đúng cho JS
            //return Ok(Base);
        }


        [HttpPost]
        public IActionResult SaveViewSchema([FromBody]JsonElement body)
        {
            var raw = body.ToString();
            var module = body.GetProperty("module")
          .GetString();
            var view = body.GetProperty("view")
            .GetString();

            var fieldName = body.GetProperty("fieldName")
                                .GetString();   
            var fieldJson = body.GetProperty("fieldJson")
                                .GetString();

            var root = _blobStorageSettings.CurrentValue.DeployPath;



            var path = Path.Combine(
               root,
               "Pages",
               "Business",
               "Form",
              $"{module}Detail",
               view + ".cshtml"
           );

            var content = System.IO.File.ReadAllText(path);

    


            var fieldText = ExtractFieldBlock(content, fieldName);
            if (fieldText == null)
            {
                return BadRequest("Field not found");
            }


            var fieldObj = JsonConvert.DeserializeObject<Dictionary<string, object>>(fieldJson);
            string fieldTextNew = "";
            // update từng property
            foreach (var kv in fieldObj)
            {
                if (kv.Key == "dataField") continue;

                var isString = kv.Value is string;

                fieldTextNew = UpdateProperty(
                    fieldText,
                    kv.Key,
                    kv.Key == "visible" ? kv.Value.ToString().ToLower() : kv.Value.ToString(),
                    isString
                );
                content = content.Replace(fieldText, fieldTextNew);
            }

            content = content.Replace(fieldText, fieldTextNew); // !!!!



            System.IO.File.WriteAllText(path, content);

            return Ok(new
            {
                success = true
            });
        }

        [HttpPost]
        public IActionResult SaveGroupViewSchema([FromBody] JsonElement body)
        {
            var raw = body.ToString();
            var module = body.GetProperty("module")
          .GetString();
            var view = body.GetProperty("view")
            .GetString();

            var fieldName = body.GetProperty("groupCaption")
                                .GetString();
            var fieldJson = body.GetProperty("groupJson")
                                .GetString();

            var root = _blobStorageSettings.CurrentValue.DeployPath;



            var path = Path.Combine(
               root,
               "Pages",
               "Business",
               "Form",
              $"{module}Detail",
               view + ".cshtml"
           );

            var content = System.IO.File.ReadAllText(path);


            //var fieldPattern = $@"\{{[^{{}}]*dataField\s*:\s*'{fieldName}'[^{{}}]*\}}";

            //var fieldPattern =
            //    $@"\{[\s\S]*?{[\s\S]*?dataField\s*:\s*['""]{fieldName}['""][\s\S]*?\}[\s\S]*?}";

            var fieldPattern = $@"\{{{{                      
[\s\S] *?               
    dataField\s*:\s*       
    ['""]{fieldName}['""]  
    [\s\S] *?              
\}}}}
";

            var match = Regex.Match(
                content,
                fieldPattern,
                RegexOptions.Singleline | RegexOptions.IgnorePatternWhitespace
            );

            if (match.Success)
            {
                var fieldBlock = match.Value;
            }


            var fieldText = ExtractGroupBlock(content, fieldName);
            if (fieldText == null)
            {
                return BadRequest("Field not found");
            }


            var fieldObj = JsonConvert.DeserializeObject<Dictionary<string, object>>(fieldJson);
            string fieldTextNew = "";
            // update từng property
            foreach (var kv in fieldObj)
            {
                if (kv.Key == "caption")
                {
                    var isString = kv.Value is string;

                    fieldTextNew = UpsertProperty(
                        fieldText,
                        kv.Key,
                        kv.Key == "visible" ? kv.Value.ToString().ToLower() : kv.Value.ToString(),
                        fieldObj,
                        isString
                    );
                    break;
                }
                else continue;

            }

            content = content.Replace(fieldText, fieldTextNew);



            System.IO.File.WriteAllText(path, content);

            return Ok(new
            {
                success = true
            });
        }

        [HttpPost]
        public IActionResult RenameGroupViewSchema([FromBody] JsonElement body)
        { 
            var raw = body.ToString();
            var module = body.GetProperty("module")
           .GetString();
            var view = body.GetProperty("view")
            .GetString();
            var newName = body.GetProperty("newGroupName")
                                .GetString();
            var fieldName = body.GetProperty("oldGroupName")
                                .GetString();
            //var fieldJson = body.GetProperty("groupJson")
            //                    .GetString();

            var root = _blobStorageSettings.CurrentValue.DeployPath;



            var path = Path.Combine(
              root,
              "Pages",
              "Business",
              "Form",
             $"{module}Detail",
              view + ".cshtml"
          );

            var content = System.IO.File.ReadAllText(path);



            var fieldPattern = $@"\{{{{                      
[\s\S] *?               
    dataField\s*:\s*       
    ['""]{fieldName}['""]  
    [\s\S] *?              
\}}}}
";

            var match = Regex.Match(
                content,
                fieldPattern,
                RegexOptions.Singleline | RegexOptions.IgnorePatternWhitespace
            );

            if (match.Success)
            {
                var fieldBlock = match.Value;
            }


            var fieldText = ExtractGroupBlock(content, fieldName);
            if (fieldText == null)
            {
                return BadRequest("Field not found");
            }


            //var fieldObj = JsonConvert.DeserializeObject<Dictionary<string, object>>(fieldJson);
            string fieldTextNew = "";


            var pattern = @"(caption\s*:\s*"")(.*?)("")";

            if (Regex.IsMatch(fieldText, pattern))
            {
                 fieldTextNew = Regex.Replace(fieldText, pattern, $"$1{newName}$3");
            }



            content = content.Replace(fieldText, fieldTextNew);



            System.IO.File.WriteAllText(path, content);

            return Ok(new
            {
                success = true
            });
        }
        //[HttpPost]
        //public IActionResult AddField([FromBody] JsonElement body)
        //{
        //    var view = body.GetProperty("view").GetString();
        //    var groupCaption = body.GetProperty("groupCaption").GetString();
        //    var fieldJson = body.GetProperty("fieldJson").GetString();

        //    var root = _blobStorageSettings.CurrentValue.DeployPath;

        //    var path = Path.Combine(
        //        root,
        //        "Pages",
        //        "Business",
        //        "Form",
        //        "QuotationDetail",
        //        view + ".cshtml"
        //    );

        //    var content = System.IO.File.ReadAllText(path);

        //    var groupBlock = ExtractGroupBlock(content, groupCaption);
        //    if (string.IsNullOrEmpty(groupBlock))
        //        return BadRequest("Group not found");

        //    var fieldObj = JsonConvert.DeserializeObject<Dictionary<string, object>>(fieldJson);

        //    var fieldText = JsonConvert.SerializeObject(fieldObj);

        //    var updatedGroup = InsertFieldIntoGroup(groupBlock, fieldText);

        //    content = content.Replace(groupBlock, updatedGroup);

        //    System.IO.File.WriteAllText(path, content);

        //    return Ok();
        //}
        [HttpPost]
        public IActionResult AddField([FromBody] JsonElement body)
        {
            var module = body.GetProperty("module")
          .GetString();
            var view = body.GetProperty("view").GetString();
            var groupCaption = body.GetProperty("groupCaption").GetString();
            var fieldJson = body.GetProperty("fieldJson").GetString();

            var root = _blobStorageSettings.CurrentValue.DeployPath;

            var path = Path.Combine(
                root,
                "Pages",
                "Business",
                "Form",
               $"{module}Detail",
                view + ".cshtml"
            );

            var content = System.IO.File.ReadAllText(path);

            var fieldObj = JsonConvert.DeserializeObject<Dictionary<string, object>>(fieldJson);

            // ✅ convert sang JS object format (quan trọng)
            var fieldText = ConvertToJsObject(fieldObj);

            // ✅ TRY: nếu có group
            if (!string.IsNullOrWhiteSpace(groupCaption))
            {
                var groupBlock = ExtractGroupBlock(content, groupCaption);

                if (!string.IsNullOrEmpty(groupBlock))
                {
                    var updatedGroup = InsertFieldIntoGroup(groupBlock, fieldText);
                    content = content.Replace(groupBlock, updatedGroup);

                    System.IO.File.WriteAllText(path, content);
                    return Ok();
                }
            }

            // ✅ FALLBACK: insert vào root items của dxForm
            content = InsertIntoRootItems(content, fieldText);

            System.IO.File.WriteAllText(path, content);

            return Ok();
        }

        private string ConvertToJsObject(Dictionary<string, object> dict)
        {
            var json = JsonConvert.SerializeObject(dict, Formatting.None);

            // ✅ bỏ dấu " ở key
            json = Regex.Replace(json, @"""([^""]+)""\s*:", "$1:");

            // ✅ đổi value string sang ''
            json = Regex.Replace(json, @":\s*""([^""]*)""", ": \"$1\"");

            return json;
        }

        //private string InsertIntoRootItems(string content, string fieldText)
        //{
        //    var itemsPattern = @"items\s*:\s*\[(.*?)\]";

        //    var match = Regex.Match(content, itemsPattern, RegexOptions.Singleline);

        //    if (!match.Success)
        //        return content;

        //    var itemsContent = match.Groups[1].Value.Trim();

        //    string newItemsContent;

        //    // ✅ chèn lên đầu, , ở sau field mới
        //    if (!string.IsNullOrWhiteSpace(itemsContent))
        //    {
        //        newItemsContent = fieldText + ",\n" + itemsContent;
        //    }
        //    else
        //    {
        //        newItemsContent = fieldText;
        //    }

        //    var newItems = $"items: [\n{newItemsContent}\n]";

        //    return Regex.Replace(
        //        content,
        //        itemsPattern,
        //        newItems,
        //        RegexOptions.Singleline
        //    );
        //}
        private string InsertIntoRootItems(string content, string fieldText)
        {
            var itemsPattern = @"items\s*:\s*\[(.*?)\]";

            var match = Regex.Match(content, itemsPattern, RegexOptions.Singleline);

            if (!match.Success)
                return content;

            var itemsContent = match.Groups[1].Value.Trim();

            string newItemsContent;

            if (!string.IsNullOrWhiteSpace(itemsContent))
            {
                newItemsContent = fieldText + ",\n" + itemsContent;
            }
            else
            {
                newItemsContent = fieldText;
            }

            var newItems = $"items: [\n{newItemsContent}\n]";

            // ✅ replace đúng vị trí match (không ảnh hưởng phần khác)
            var result = content.Substring(0, match.Index)
                       + newItems
                       + content.Substring(match.Index + match.Length);

            return result;
        }
        string UpdateProperty(string fieldText, string key, string value, bool isString = true)
        {
            var pattern = $@"{key}\s*:\s*[^,}}]+";

            var replacement = isString
                ? $"{key}: \"{value}\""
                : $"{key}: {value}";
         
       
            if (Regex.IsMatch(fieldText, pattern))
            {
                // property tồn tại → replace
                return Regex.Replace(fieldText, pattern, replacement);
            }
            else
            {
                // property chưa có → thêm vào cuối
                return fieldText.TrimEnd('}') + $", {replacement} }}";
            }
        }

        //[HttpPost]
        //public IActionResult SwapGroup([FromBody] JsonElement body)
        //{
        //    var view = body.GetProperty("view").GetString();
        //    var fieldName = body.GetProperty("fieldName").GetString();
        //    var sourceCaption = body.GetProperty("sourceGroup").GetString();
        //    var targetCaption = body.GetProperty("targetGroup").GetString();

        //    var root = _blobStorageSettings.CurrentValue.DeployPath;

        //    var path = Path.Combine(
        //        root,
        //        "Pages",
        //        "Business",
        //        "Form",
        //        "QuotationDetail",
        //        view + ".cshtml"
        //    );

        //    var content = System.IO.File.ReadAllText(path);

        //    // ✅ 1. Extract field
        //    var fieldText = ExtractFieldBlock(content, fieldName);
        //    if (string.IsNullOrEmpty(fieldText))
        //        return BadRequest("Field not found");

        //    // ✅ 2. Extract source group
        //    var sourceBlock = ExtractGroupBlock(content, sourceCaption);
        //    if (string.IsNullOrEmpty(sourceBlock))
        //        return BadRequest("Source group not found");

        //    // ✅ 3. Remove field khỏi source group
        //    var updatedSource = RemoveFieldFromGroup(sourceBlock, fieldText);

        //    // ✅ 4. Replace source group
        //    content = content.Replace(sourceBlock, updatedSource);

        //    // ✅ 5. Extract target group (sau khi update content)
        //    var targetBlock = ExtractGroupBlock(content, targetCaption);
        //    if (string.IsNullOrEmpty(targetBlock))
        //        return BadRequest("Target group not found");

        //    // ✅ 6. Insert field vào target
        //    var updatedTarget = InsertFieldIntoGroup(targetBlock, fieldText);

        //    // ✅ 7. Replace target group
        //    content = content.Replace(targetBlock, updatedTarget);

        //    System.IO.File.WriteAllText(path, content);

        //    return Ok(new { success = true });
        //}

        [HttpPost]
        public IActionResult SwapGroup([FromBody] JsonElement body)
        {
            var module = body.GetProperty("module")
          .GetString();
            var view = body.GetProperty("view").GetString();
            var fieldName = body.GetProperty("fieldName").GetString();
            var sourceCaption = body.GetProperty("sourceGroup").GetString();
            var targetCaption = body.GetProperty("targetGroup").GetString();

            var root = _blobStorageSettings.CurrentValue.DeployPath;

            var path = Path.Combine(
              root,
              "Pages",
              "Business",
              "Form",
             $"{module}Detail",
              view + ".cshtml"
          );

            var content = System.IO.File.ReadAllText(path);

            // ✅ 1. Extract field
            var fieldText = ExtractFieldBlock(content, fieldName);
            if (string.IsNullOrEmpty(fieldText))
                return BadRequest("Field not found");

            // =========================================
            // ✅ CASE 1: CÓ SOURCE GROUP
            // =========================================
            if (!string.IsNullOrWhiteSpace(sourceCaption) && sourceCaption != "General")
            {
                var sourceBlock = ExtractGroupBlock(content, sourceCaption);
                if (string.IsNullOrEmpty(sourceBlock))
                    return BadRequest("Source group not found");

                var updatedSource = RemoveFieldFromGroup(sourceBlock, fieldText);

                content = ReplaceFirst(content, sourceBlock, updatedSource);
            }
            // =========================================
            // ✅ CASE 2: SOURCE = ROOT (General)
            // =========================================
            else
            {

                string fieldTextOut = null;
                content = RemoveFieldFromRootItems(content, fieldName, out fieldTextOut);

                if (string.IsNullOrEmpty(fieldText))
                    return BadRequest("Field not found in root");

            }

            // =========================================
            // ✅ TARGET GROUP
            // =========================================
            var targetBlock = ExtractGroupBlock(content, targetCaption);
            if (string.IsNullOrEmpty(targetBlock))
                return BadRequest("Target group not found");

            var updatedTarget = InsertFieldIntoGroup(targetBlock, fieldText);


 
            content = content.Replace(targetBlock, updatedTarget);

            System.IO.File.WriteAllText(path, content);

            return Ok(new { success = true });
        }
        private string ReplaceFirst(string text, string search, string replace)
        {
            var pos = text.IndexOf(search);
            if (pos < 0) return text;

            return text.Substring(0, pos)
                 + replace
                 + text.Substring(pos + search.Length);
        }
        [HttpPost]
        public IActionResult AddGroup([FromBody] JsonElement body)
        {
            var module = body.GetProperty("module")
          .GetString();
            var view = body.GetProperty("view").GetString();
            var groupJson = body.GetProperty("groupJson").GetString();

            var root = _blobStorageSettings.CurrentValue.DeployPath;

            var path = Path.Combine(
               root,
               "Pages",
               "Business",
               "Form",
              $"{module}Detail",
               view + ".cshtml"
           );

            var content = System.IO.File.ReadAllText(path);

            var groupObj = JsonConvert.DeserializeObject<Dictionary<string, object>>(groupJson);

            // ✅ convert format JS object
            var groupText = ConvertToJsObject(groupObj);

            // ✅ insert vào ROOT items
            content = InsertGroupIntoRoot(content, groupText);

            System.IO.File.WriteAllText(path, content);

            return Ok();
        }
        private string InsertGroupIntoRoot(string content, string groupText)
        {
            var pattern = @"items\s*:\s*\[";

            var match = Regex.Match(content, pattern);

            if (!match.Success)
                return content;

            var insertPos = match.Index + match.Length;

            // ✅ thêm group + dấu ,
            var insertText = "\n" + groupText + ",\n";

            return content.Insert(insertPos, insertText);
        }
        private string RemoveFieldFromRootItems(string content, string fieldName, out string removedField)
        {
            removedField = null;

            var itemsPattern = @"items\s*:\s*\[(.*?)\]";
            var match = Regex.Match(content, itemsPattern, RegexOptions.Singleline);

            if (!match.Success)
                return content;

            var itemsContent = match.Groups[1].Value;

            // ✅ match field theo dataField
            var fieldPattern = $@"dataField\s*:\s*[""']{Regex.Escape(fieldName)}[""']";

            var fieldMatch = Regex.Match(
                itemsContent,
                fieldPattern,
                RegexOptions.Singleline | RegexOptions.IgnorePatternWhitespace
            );

            if (!fieldMatch.Success)
                return content;

            // ✅ giữ lại block field để chèn sang group khác
            removedField = ExtractFieldBlock(content, fieldName);

            // ✅ remove field + dấu ,
            var newItemsContent = itemsContent.Remove(
                fieldMatch.Index,
                fieldMatch.Length
            );

            // ✅ cleanup dấu ,
            newItemsContent = Regex.Replace(newItemsContent, @",\s*,", ",");
            newItemsContent = Regex.Replace(newItemsContent, @"^\s*,", "");
            newItemsContent = Regex.Replace(newItemsContent, @",\s*$", "");

            var newItems = $"items: [\n{newItemsContent.Trim()}\n]";

            return content.Replace($"{removedField},", "");
        }
        private string RemoveFieldFromGroup(string groupBlock, string fieldText)
        {
            var newGroup = groupBlock.Replace(fieldText, "");

            // ✅ cleanup dấu ,
            newGroup = Regex.Replace(newGroup, @",\s*,", ",");
            newGroup = Regex.Replace(newGroup, @"\[\s*,", "[");
            newGroup = Regex.Replace(newGroup, @",\s*\]", "]");

            return newGroup;
        }
        private string InsertFieldIntoGroup(string targetBlock, string fieldText)
        {
            var itemsPattern = @"items\s*:\s*\[(.*?)\]";

            var match = Regex.Match(targetBlock, itemsPattern, RegexOptions.Singleline);

            if (!match.Success)
                return targetBlock;

            var itemsContent = match.Groups[1].Value.Trim();

            if (!string.IsNullOrWhiteSpace(itemsContent))
            {
                itemsContent += ",\n" + fieldText;
            }
            else
            {
                itemsContent = fieldText;
            }

            var newItems = $"items: [\n{itemsContent}\n]";

            return Regex.Replace(
                targetBlock,
                itemsPattern,
                newItems,
                RegexOptions.Singleline
            );
        }
        string UpsertProperty(

    string fieldText,

    string key,

    string value,

    Dictionary<string, object> fieldObj,

    bool isString = true)

        {

            string insertText = isString

                ? $"visible:false,"

                : $"visible:false,";

            // tìm vị trí trước items:

            // ví dụ:

            // editorType:'group',items:

            // => chèn visible:false ngay trước items

            var pattern = @"(?=items\s*:)";

            if (!(bool)fieldObj["visible"])

            {

                // chưa có thì insert trước items

                if (!Regex.IsMatch(fieldText, $@"\b{Regex.Escape(key)}\s*:\s*{value}"))

                {

                    fieldText = Regex.Replace(fieldText,pattern,insertText);

                }

            }

            else

            {

                // visible=true => xoá property trước items

                fieldText = Regex.Replace(

                    fieldText,

                    $@",?\s*{Regex.Escape("visible")}\s*:\s*('([^']*)'|true|false|null|\d+)\s*(?=,\s*items\s*:)",

                    ""

                );

            }

            return fieldText;

        }




        private static string ExtractFieldBlock(string content, string fieldName)
        {
            var pattern = $@"dataField\s*:\s*[""']{Regex.Escape(fieldName)}[""']";
            var match = Regex.Match(content, pattern, RegexOptions.Singleline);
            if (!match.Success)
                return null;
            // tìm dấu { mở object cha
            int start = match.Index;
            while (start >= 0 && content[start] != '{')
                start--;
            if (start < 0)
                return null;
            int depth = 0;
            bool inString = false;
            char stringChar = '\0';
            for (int i = start; i < content.Length; i++)
            {
                char c = content[i];
                // xử lý string
                if ((c == '"' || c == '\'') && (i == 0 || content[i - 1] != '\\'))
                {
                    if (!inString)
                    {
                        inString = true;
                        stringChar = c;
                    }
                    else if (stringChar == c)
                    {
                        inString = false;
                    }
                }
                if (inString)
                    continue;
                if (c == '{')
                    depth++;
                if (c == '}')
                    depth--;
                if (depth == 0)
                {
                    return content.Substring(start, i - start + 1);
                }
            }
            return null;
        }

        private static string ExtractGroupBlock(string content, string fieldName)
        {
            var pattern = $@"itemType:\s*""group"",\s*caption:\s*[""']{Regex.Escape(fieldName)}[""']";
            var match = Regex.Match(content, pattern, RegexOptions.Singleline);
            if (!match.Success)
                return null;
            // tìm dấu { mở object cha
            int start = match.Index;
            while (start >= 0 && content[start] != '{')
                start--;
            if (start < 0)
                return null;
            int depth = 0;
            bool inString = false;
            char stringChar = '\0';
            for (int i = start; i < content.Length; i++)
            {
                char c = content[i];
                // xử lý string
                if ((c == '"' || c == '\'') && (i == 0 || content[i - 1] != '\\'))
                {
                    if (!inString)
                    {
                        inString = true;
                        stringChar = c;
                    }
                    else if (stringChar == c)
                    {
                        inString = false;
                    }
                }
                if (inString)
                    continue;
                if (c == '{')
                    depth++;
                if (c == '}')
                    depth--;
                if (depth == 0)
                {
                    return content.Substring(start, i - start + 1);
                }
            }
            return null;
        }
        #endregion

        #region POST API 

        [HttpPost]
        public override async Task<IActionResult> InsertData([FromForm] InsertFormCollection form)
        {
            var entity = new Utility();

            return Ok(entity);
        }

        [HttpPost]
        //[RequestSizeLimit(50_000_000)] // 50MB
        public async Task<IActionResult> ImportExcel([FromForm] IFormFile file /*, [FromForm] long? projectId */)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "Empty file" });

            var ext = Path.GetExtension(file.FileName);
            if (!string.Equals(ext, ".xlsx", StringComparison.OrdinalIgnoreCase))
                return BadRequest(new { message = "Only support .xlsx" });

            // Lưu tạm (tuỳ anh)
            var tempFolder = Path.Combine(Path.GetTempPath(), "plan-import");
            Directory.CreateDirectory(tempFolder);

            var savedPath = Path.Combine(_blobStorageSettings.CurrentValue.Path, $@"StaticData\plan.xlsx");
            await using (var fs = System.IO.File.Create(savedPath))
            {
                await file.CopyToAsync(fs);
            }

            try
            {
                // TODO: parse excel -> insert/update DB
                // ví dụ: ImportPlanFromExcel(savedPath);

                return Ok(new { message = "Import OK", fileName = file.FileName });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Import error!!", detail = ex.Message });
            }
            finally
            {
                // nếu không cần giữ file:
                // System.IO.File.Delete(savedPath);
            }
        }
        #endregion

        #region DELETE API 

        [HttpDelete]
        public override async Task<IActionResult> DeleteData([FromForm] DeleteFormCollection form)
        {
            var entity = new Utility();

            return Ok(entity);
        }
        #endregion

        #region PUT API 

        [HttpPut]
        public override HttpResponseMessage UpdateData([FromForm] UpdateFormCollection form)
        {
            var entity = new Utility();
            return new HttpResponseMessage(HttpStatusCode.OK);
        }
        #endregion
        [HttpPost]
        public async Task<IActionResult> NotifyAnother([FromBody]NotificationRequest notificationRequest)
        {
            var handler = new HttpClientHandler();
            handler.UseCookies = false;
            handler.UseDefaultCredentials = true;
            handler.PreAuthenticate = true;

            using (var httpClient = new HttpClient(handler))
            {
                using (var request = new HttpRequestMessage(new HttpMethod("POST"), $"{_urlConfig.REHost}/api/Notification/Notify"))
                {
                    request.Headers.TryAddWithoutValidation("Accept", "*/*");
                    request.Headers.TryAddWithoutValidation("Accept-Language", "en-US,en;q=0.9,vi;q=0.8");
                    request.Headers.TryAddWithoutValidation("Access-Control-Request-Headers", "content-type");
                    request.Headers.TryAddWithoutValidation("Access-Control-Request-Method", "POST");
                    request.Headers.TryAddWithoutValidation("Cache-Control", "no-cache");
                    request.Headers.TryAddWithoutValidation("Connection", "keep-alive");
                    request.Headers.TryAddWithoutValidation("Origin", $"{_urlConfig.Host}");
                    request.Headers.TryAddWithoutValidation("Pragma", "no-cache");
                    request.Headers.TryAddWithoutValidation("Referer", $"{_urlConfig.Host}/");
                    request.Headers.TryAddWithoutValidation("Sec-Fetch-Dest", "empty");
                    request.Headers.TryAddWithoutValidation("Sec-Fetch-Mode", "cors");
                    request.Headers.TryAddWithoutValidation("Sec-Fetch-Site", "cross-site");
                    request.Headers.TryAddWithoutValidation("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36");
                    request.Headers.TryAddWithoutValidation("Access-Control-Request-Origin", $"{_urlConfig.Host}");
                    request.Headers.TryAddWithoutValidation("X-Internal-Token", _internalAuth.Token);
                    //request.Headers.TryAddWithoutValidation("Cookie", "visid_incap_2798233=O7uM8s8YQ4Wt9z+ilLnLVUTi9WcAAAAAQUIPAAAAAABN6GD7Jnn01N8ILccHyjDS");

                    //var base64authorization = Convert.ToBase64String(Encoding.ASCII.GetBytes("quan.nh:8iqvxbcvyF!@#$%"));
                    //request.Headers.TryAddWithoutValidation("Authorization", $"Basic {base64authorization}");

                    //request.Content = new StringContent("{\n  \"Notification\": {\n    \"Title\": \"Test Title\",\n    \"Message\": \"Test HTML Message\",\n    \"IsRead\": false,\n    \"Url\": \"Link URL\",\n    \"Resource\": \"IT_quannh\",\n    \"System\": \"Quotation Management\"\n  },\n  \"MKTSurveyRequest\": {\n    \"ClientName\": \"Client A\"\n  },\n  \"connectionId\": \"\"\n}");
                    request.Content = new StringContent(JsonConvert.SerializeObject(notificationRequest));
                    request.Content.Headers.ContentType = MediaTypeHeaderValue.Parse("application/json");

                    var responsse = await httpClient.SendAsync(request);
                }
            }
            return Ok();
        }



        private static List<dynamic> ReadDependenciesFromStream(Stream excelStream, string sheetName)
        {
            var result = new List<dynamic>();

            using var doc = Util.OpenSpreadsheetDocument(excelStream);
            var wbPart = doc.WorkbookPart!;

            var sheet = wbPart.Workbook.Sheets!
                .Elements<Sheet>()
                .FirstOrDefault(s => string.Equals(s.Name?.Value, sheetName, StringComparison.OrdinalIgnoreCase));

            if (sheet == null)
                throw new Exception($"Sheet '{sheetName}' not found.");

            var wsPart = (WorksheetPart)wbPart.GetPartById(sheet.Id!);
            var rows = wsPart.Worksheet.Descendants<Row>().ToList();
            if (rows.Count <= 1) return result;

            // header map
            var headerCells = rows[0].Elements<Cell>().ToList();
            var colMap = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);

            for (int i = 0; i < headerCells.Count; i++)
            {
                var colName = Util.GetCellValue(wbPart, headerCells[i])?.Trim();
                if (!string.IsNullOrWhiteSpace(colName))
                    colMap[colName] = i;
            }

            for (int r = 1; r < rows.Count; r++)
            {
                var cells = rows[r].Elements<Cell>().ToList();
                if (cells.Count == 0) continue;

                dynamic dto;

                switch (sheetName)
                {
                    case "Dependencies":
                        dto = new
                        {
                            id = Util.GetString(cells, colMap, "id", wbPart),
                            predecessorId = Util.GetString(cells, colMap, "predecessorId", wbPart),
                            successorId = Util.GetString(cells, colMap, "successorId", wbPart),
                            type = Util.GetString(cells, colMap, "type", wbPart)
                        };
                        break;

                    case "Tasks":
                        dto = new
                        {
                            id = Util.GetString(cells, colMap, "id", wbPart),
                            parentId = Util.GetString(cells, colMap, "parentId", wbPart),
                            title = Util.GetString(cells, colMap, "title", wbPart),
                            start = Util.GetDate(cells, colMap, "start", wbPart)?.AddHours(-7).ToString("yyyy-MM-ddTHH:mm:ss.000Z"),
                            end = Util.GetDate(cells, colMap, "end", wbPart)?.Add(new TimeSpan(16,59,59)).ToString("yyyy-MM-ddTHH:mm:ss.000Z"),
                            progress = Util.GetInt(cells, colMap, "progress", wbPart)
                        };
                        break;

                    case "Resources":
                        dto = new
                        {
                            id = Util.GetString(cells, colMap, "id", wbPart),
                            text = Util.GetString(cells, colMap, "text", wbPart)
                        };
                        break;

                    case "ResourceAssignments":
                        dto = new
                        {
                            id = Util.GetString(cells, colMap, "id", wbPart),
                            taskId = Util.GetString(cells, colMap, "taskId", wbPart),
                            resourceId = Util.GetString(cells, colMap, "resourceId", wbPart)
                        };
                        break;

                    default:
                        continue; // sheet không hỗ trợ → skip row
                }

                result.Add(dto);
            }


            return result;
        }




        

    }
}
