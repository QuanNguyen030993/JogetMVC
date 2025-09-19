using Newtonsoft.Json;
using SurveyReportRE.Models.Migration.Business.Data;
using SurveyReportRE.Models.Migration.Config;
using System.Reflection;
using HtmlAgilityPack;
using System.Text.RegularExpressions;
using System.Security.Cryptography;
using System.Text;
using SurveyReportRE.Models.Request;
using Newtonsoft.Json.Linq;
using System.Data;
using Syncfusion.Pdf.Parsing;
using BitMiracle.LibTiff.Classic;
using SurveyReportRE.Models.Migration.Business.Form;
using RESurveyTool.Models.Models.Parsing;
using DocumentFormat.OpenXml.Drawing.Charts;
using System.Drawing;
using System.Reflection.Metadata.Ecma335;
using System.Collections;
using Azure.Core;
using RESurveyTool.Common.Constant;
using Syncfusion.Pdf.Security;
using AngleSharp;
using SurveyReportRE.Models.Migration.Business.HumanResource;
using SurveyReportRE.Models.Migration.Business.Workflow;
using SurveyReportRE.Models.Migration.Business.Config;
using DocumentFormat.OpenXml.ExtendedProperties;
using SurveyReportRE.Models.Migration.Business.MasterData;
using DocumentFormat.OpenXml.Office2016.Excel;
using System.Linq.Expressions;
using DocumentFormat.OpenXml.Office2010.PowerPoint;
using MailKit;
using System.Drawing.Imaging;
using MailKit.Security;
using MimeKit;
using RESurveyTool.Common.Common;
using System.Linq;
using DocumentFormat.OpenXml.InkML;
using Microsoft.Data.SqlClient;
using static SkiaSharp.HarfBuzz.SKShaper;
namespace SurveyReportRE.Common
{
    public static class Util
    {

        public static bool QUERY_LOG = false;
        static string[] systemColumns = { "Id", "CreatedBy", "CreatedDate", "ModifiedDate", "ModifiedBy", "Deleted", "DeletedBy", "DeletedDate" };

        public static bool IsCanJsonPopulate(string inputString)
        {
            bool check = true;
            if (string.IsNullOrEmpty(inputString)) check = false;
            if (inputString == "{}") check = false;
            return check;
        }
        public static IEnumerable<PropertyInfo> ObjectProperties<T>() where T : class
        {
            return typeof(T).GetProperties().Where(w => w.Name != w.PropertyType.Name).Where(w => w.PropertyType.Name != "List`1").Where(w => w.Name != "Id").Where(w => !w.Name.EndsWith("FK")).Where(w => !w.Name.EndsWith("Enum"));
        }

        public static string GetJsonString(string pathToFile)
        {
            FileStream fileStream = new FileStream(pathToFile, FileMode.Open);
            var jsonSource = "";
            using (StreamReader reader = new StreamReader(fileStream))
            {
                // get system menu
                jsonSource = reader.ReadToEnd();
                //ViewBag.MenuItem = jsonMenuSource;
            }
            return jsonSource;
        }

        //public static Tuple<Attachment, SitePictures> HtmlWriteDown(JObject objectInstance, string changeData, string moduleFolder, string prefixName, string baseDirectory, AttachmentRequest? attachmentRequest = null)
        //{
        //    Tuple<Attachment, SitePictures> returnData = null;

        //    // Duyệt qua tất cả các properties của JObject
        //    foreach (var property in objectInstance.Properties())
        //    {
        //        string fieldName = property.Name;
        //        string fieldValue = property.Value?.ToString();

        //        if (string.IsNullOrWhiteSpace(fieldValue)) continue;

        //        // Kiểm tra nếu là HTML
        //        if (IsHtml(fieldValue))
        //        {
        //            string outputHtml = fieldValue;

        //            // Sử dụng HtmlAgilityPack để xử lý HTML
        //            HtmlDocument document = new HtmlDocument();
        //            document.LoadHtml(outputHtml);

        //            // Xử lý thẻ <table> và các thẻ con <td>, <th>
        //            var tables = document.DocumentNode.SelectNodes("//table");
        //            if (tables != null)
        //            {
        //                foreach (var table in tables)
        //                {
        //                    if (!table.Attributes.Contains("style"))
        //                    {
        //                        table.Attributes.Add("style", "border-collapse: collapse; width: 100%;");
        //                    }

        //                    var cells = table.SelectNodes(".//td | .//th");
        //                    if (cells != null)
        //                    {
        //                        foreach (var cell in cells)
        //                        {
        //                            if (!cell.Attributes.Contains("style"))
        //                            {
        //                                cell.Attributes.Add("style", "border: 1px solid black; text-align: center;");
        //                            }
        //                        }
        //                    }
        //                }
        //            }

        //            // Xử lý thẻ <img> base64
        //            var imgs = document.DocumentNode.SelectNodes("//img");
        //            if (imgs != null)
        //            {
        //                foreach (var img in imgs)
        //                {
        //                    string base64Pattern = @"data:image/\w+;base64,([^""]+)";
        //                    Match match = Regex.Match(img.OuterHtml, base64Pattern);
        //                    if (match.Success)
        //                    {
        //                        string base64Data = match.Groups[1].Value;
        //                        byte[] byteArray = Convert.FromBase64String(base64Data);
        //                        string folder = "SitePictures";
        //                        string fileName = GenerateFileNameFromBase64(base64Data);

        //                        // Lưu file vào Attachment
        //                        Attachment attachment = BindingAttachment(baseDirectory, folder, fileName, byteArray, attachmentRequest);

        //                        // Trả về dữ liệu SitePictures
        //                        SitePictures sitePictures = new SitePictures
        //                        {
        //                            AttachmentId = attachment.Id,
        //                            SurveyId = attachmentRequest?.surveyId
        //                        };

        //                        returnData = new Tuple<Attachment, SitePictures>(attachment, sitePictures);
        //                    }
        //                }
        //            }

        //            outputHtml = document.DocumentNode.OuterHtml;

        //            // Ghi HTML vào file
        //            string htmlFilePath = Path.Combine(baseDirectory, moduleFolder, $"{prefixName}_{fieldName}.html");
        //            string docxFilePath = Path.Combine(baseDirectory, moduleFolder, $"{prefixName}_{fieldName}.docx");

        //            if (!Directory.Exists(Path.Combine(baseDirectory, moduleFolder)))
        //                Directory.CreateDirectory(Path.Combine(baseDirectory, moduleFolder));

        //            File.WriteAllText(htmlFilePath, outputHtml);

        //            // Convert HTML sang DOCX nếu cần
        //            // WordUtil.SyncfusionConvertDocxToHtml(htmlFilePath, docxFilePath);
        //        }
        //    }

        //    return returnData;
        //}

     

        public static string CloneAttachment(Attachment attachment, string type, long unixMilliseconds, string blobPath)
        {
            string subCopyPath = "";
            string sourcePath = "";
            string fileName = $"{unixMilliseconds}_{attachment.FileName}";

            // Bổ sung tên file riêng biệt nếu cần clone các loại như thumbnail
            string prefix = "";
            switch (type)
            {
                case nameof(attachment.SubDirectory):
                    prefix = ""; // Không thêm gì cho file chính
                    subCopyPath = Path.Combine("Management", fileName);
                    sourcePath = Path.Combine(blobPath, attachment.SubDirectory);
                    break;

                case nameof(attachment.SubThumbnailDirectory):
                    prefix = "thumbnail_";
                    fileName = $"{prefix}{unixMilliseconds}_{attachment.FileName}";
                    subCopyPath = Path.Combine("Management", fileName);
                    sourcePath = Path.Combine(blobPath, attachment.SubThumbnailDirectory);
                    break;

                case nameof(attachment.SubOverviewDirectory):
                    prefix = "overviewthumbnail_";
                    fileName = $"{prefix}{unixMilliseconds}_{attachment.FileName}";
                    subCopyPath = Path.Combine("Management", fileName);
                    sourcePath = Path.Combine(blobPath, attachment.SubOverviewDirectory);
                    break;

                case nameof(attachment.SubSitePictureDirectory):
                    prefix = "sitepicturethumbnail_";
                    fileName = $"{prefix}{unixMilliseconds}_{attachment.FileName}";
                    subCopyPath = Path.Combine("Management", fileName);
                    sourcePath = Path.Combine(blobPath, attachment.SubSitePictureDirectory);
                    break;

                default:
                    break;
            }

            string destPath = Path.Combine(blobPath, subCopyPath);

            // Đảm bảo thư mục đích tồn tại
            var dir = Path.GetDirectoryName(destPath);
            if (!Directory.Exists(dir))
            {
                Directory.CreateDirectory(dir);
            }

            if (File.Exists(sourcePath))
                File.Copy(sourcePath, destPath, overwrite: true);

            return subCopyPath;
        }

        public static void GetQueryLog(string _connectionString)
        {
            List<Dictionary<string, object>> resultList = new List<Dictionary<string, object>>();
            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                connection.Open();

                using (SqlCommand command = new SqlCommand("SELECT TOP 1 [Value] FROM Constant WHERE ParameterName = 'QueryLog'", connection))
                {
                    using (var reader = command.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            var row = new Dictionary<string, object>();

                            for (int i = 0; i < reader.FieldCount; i++)
                            {
                                var columnName = Char.ToLowerInvariant(reader.GetName(i)[0]) + reader.GetName(i).Substring(1);

                                //var columnName = reader.GetName(i); // Tên cột
                                var value = reader.IsDBNull(i) ? null : reader.GetValue(i); // Giá trị cột
                                row[columnName] = value; // Thêm vào dictionary
                            }
                            resultList.Add(row);
                        }


                    }
                }
                connection.Close();

                //var valueStr = ((string)resultList.First().Value);
                //Util.QUERY_LOG = bool.Parse(valueStr);
                var valueStr = ((string)resultList[0].First().Value);
                QUERY_LOG = bool.Parse(valueStr);
            }
        }

        public static void QueryLogs(string _connectionString, string storeName, params (string Key, object Value)[] paramerters)
        {
            if (QUERY_LOG)
                DataUtil.ExecuteStoredProcedureReturn(_connectionString, storeName,
                paramerters);
        }

        
        public static void AddFontFamilyToNodes(HtmlDocument document, string fontFamily = "Asap")
        {
            // Chọn các thẻ div, p, và span
            var targetNodes = document.DocumentNode.SelectNodes("//div | //p | //span");
            if (targetNodes != null)
            {
                foreach (var node in targetNodes)
                {
                    // Lấy thuộc tính style hiện có
                    string existingStyle = node.GetAttributeValue("style", "");
                    string innerText = node.InnerText;

                    if (innerText.Contains(" LPG for the sole "))
                    {

                    }

                    // Nếu chưa có font-family, thì thêm vào
                    if (!existingStyle.Contains("font-family"))
                    {
                        existingStyle = $"{existingStyle}; font-family: {fontFamily};".Trim(';').Trim();
                        node.SetAttributeValue("style", existingStyle);
                    }
                }
            }
        }

        public static void AddFontToHTMLNodes<T>(T objectInstance) where T : class
        {
            var properties = ObjectProperties<T>().ToList().Where(x => !systemColumns.Contains(x.Name));
            foreach (PropertyInfo property in properties)
            {
                string fieldName = property.Name;
                object fieldValue = property.GetValue((dynamic)objectInstance);
                if (fieldValue == null) continue;
                string nameValueType = fieldValue.GetType().Name;
                if (nameValueType == "String")
                {
                    string outputHtml = fieldValue.ToString();

                    if (IsHtml(fieldValue.ToString()))
                    {
                        HtmlDocument document = new HtmlDocument();
                        document = TableHTMLRemake(fieldValue.ToString());

                        // Add font-family: Asap to div, p, and span tags
                        AddFontFamilyToNodes(document);

                        outputHtml = document.DocumentNode.OuterHtml;
                        property.SetValue(objectInstance, outputHtml);
                    }
                }
            }
        }

        public static void HTMLRemake<T>(T objectInstance) where T : class
        {
            ImageHTMLRemake<T>(objectInstance);
            IndentHTMLRemake<T>(objectInstance);
            ReplaceNonAsapFonts<T>(objectInstance);
        }

        public static void ReplaceNonAsapFonts<T>(T objectInstance) where T : class
        {
            var properties = ObjectProperties<T>().ToList().Where(x => !systemColumns.Contains(x.Name));
            foreach (PropertyInfo property in properties)
            {
                string fieldName = property.Name;
                object fieldValue = property.GetValue((dynamic)objectInstance);
                if (fieldValue == null) continue;
                string nameValueType = fieldValue.GetType().Name;
                if (nameValueType == "String")
                {
                    string outputHtml = fieldValue.ToString();

                    if (IsHtml(fieldValue.ToString()))
                    {
                        HtmlDocument document = new HtmlDocument();
                        document = TableHTMLRemake(fieldValue.ToString());

                        var nodesWithStyle = document.DocumentNode.SelectNodes("//*[@style]");
                        if (nodesWithStyle != null)
                        {
                            foreach (var node in nodesWithStyle)
                            {
                                string existingStyle = node.GetAttributeValue("style", "");
                                string updatedStyle = Regex.Replace(existingStyle, "font-family:(?!.*?(Asap|Wingdings))[^;]+", "font-family: Asap", RegexOptions.IgnoreCase);
                                node.SetAttributeValue("style", updatedStyle);
                            }
                        }

                        outputHtml = document.DocumentNode.OuterHtml;
                        property.SetValue(objectInstance, outputHtml);
                    }
                }
            }
        }

        public static string HandleDefaultFont(string fieldValue)
        {
            string output = fieldValue;
            if (IsHtml(fieldValue))
            {
                HtmlDocument document = new HtmlDocument();
                document = TableHTMLRemake(fieldValue.ToString());

                var nodesWithStyle = document.DocumentNode.SelectNodes("//*[@style]");
                if (nodesWithStyle != null)
                {
                    foreach (var node in nodesWithStyle)
                    {
                        string existingStyle = node.GetAttributeValue("style", "");
                        if (Regex.IsMatch(existingStyle, "font-family", RegexOptions.IgnoreCase))
                        {
                            string updatedStyle = Regex.Replace(existingStyle, "font-family:(?!.*?(Asap|Wingdings))[^;]+", "font-family: Asap", RegexOptions.IgnoreCase);
                            node.SetAttributeValue("style", updatedStyle);
                        }
                        else
                        {
                            // Nếu chưa có font-family thì thêm vào
                            string updatedStyle = existingStyle.Trim().TrimEnd(';');
                            updatedStyle += "; font-family: Asap;";
                            node.SetAttributeValue("style", updatedStyle);
                        }
                    }
                }

                output = document.DocumentNode.OuterHtml;
            }
            return output;
        }


        public static void IndentHTMLRemake<T>(T objectInstance) where T : class
        {
            AddFontToHTMLNodes<T>(objectInstance);
            var properties = ObjectProperties<T>().ToList().Where(x => !systemColumns.Contains(x.Name));
            foreach (PropertyInfo property in properties)
            {
                string fieldName = property.Name;
                object fieldValue = property.GetValue((dynamic)objectInstance);
                if (fieldValue == null) continue;
                string nameValueType = fieldValue.GetType().Name;
                if (nameValueType == "String")
                {
                    string outputHtml = fieldValue.ToString();

                    if (IsHtml(fieldValue.ToString()))
                    {
                        HtmlDocument document = new HtmlDocument();
                        document = TableHTMLRemake(fieldValue.ToString());

                        // Xử lý thẻ <p> có class ql-indent
                        var indentNodes = document.DocumentNode.SelectNodes("//p[contains(@class, 'ql-indent')]");
                        if (indentNodes != null)
                        {
                            foreach (var node in indentNodes)
                            {
                                var classAttr = node.GetAttributeValue("class", "");
                                Match match = Regex.Match(classAttr, "ql-indent-(\\d+)");
                                if (match.Success)
                                {
                                    int indentLevel = int.Parse(match.Groups[1].Value);
                                    int paddingLeft = indentLevel * 18;
                                    string existingStyle = node.GetAttributeValue("style", "");
                                    existingStyle = $"{existingStyle}; padding-left: {paddingLeft}pt;".Trim(';').Trim();
                                    node.SetAttributeValue("style", existingStyle);
                                }
                            }
                        }

                        outputHtml = document.DocumentNode.OuterHtml;
                        property.SetValue(objectInstance, outputHtml);
                    }
                }
            }
        }

        public static void ImageHTMLRemake<T>(T objectInstance) where T : class
        {
            AddFontToHTMLNodes<T>(objectInstance);
            var properties = ObjectProperties<T>().ToList().Where(x => !systemColumns.Contains(x.Name));
            foreach (PropertyInfo property in properties)
            {
                //string serial = _baseRepository._baseConfiguration.GetSection("SautinSoft:License").Value;
                string fieldName = property.Name;
                object fieldValue = property.GetValue((dynamic)objectInstance);
                if (fieldValue == null) continue;
                string nameValueType = fieldValue.GetType().Name;
                if (nameValueType == "String")
                {

                    string outputHtml = fieldValue.ToString();

                    if (IsHtml(fieldValue.ToString()))
                    {
                        HtmlDocument document = new HtmlDocument();
                        document = TableHTMLRemake(fieldValue.ToString());

                        var imgs = document.DocumentNode.SelectNodes("//img");
                        if (imgs != null)
                        {
                            foreach (var img in imgs)
                            {
                                int maxWidth = ConfigConstant._maxWordPictureWidth;
                                int maxHeight = 400;
                                string base64Pattern = @"data:image/\w+;base64,([^""]+)";
                                Match match = Regex.Match(img.OuterHtml, base64Pattern);
                                string base64Data = "";
                                if (match.Success)
                                {
                                    base64Data = match.Groups[1].Value;
                                    byte[] byteArray = Convert.FromBase64String(base64Data);
                                    var src = img.GetAttributeValue("src", null);
                                    var width = img.GetAttributeValue("width", "0");  // lấy string
                                    var height = img.GetAttributeValue("height", "0");
                                    if (!string.IsNullOrEmpty(src) && src.StartsWith("data:image/"))
                                    {
                                        try
                                        {

                                            byte[] imageData = Convert.FromBase64String(base64Data);

                                            using (var stream = new MemoryStream(imageData))
                                            using (var image = Image.FromStream(stream))
                                            {
                                                var newImgNode = img.Clone(); // Tạo bản sao của thẻ <img>
                                                //if (image.Width > maxWidth)
                                                if (double.Parse(width) > maxWidth)
                                                    newImgNode.SetAttributeValue("width", maxWidth.ToString());
                                                //if (image.Height > maxHeight)
                                                if (double.Parse(height) > maxHeight)
                                                    newImgNode.SetAttributeValue("height", maxHeight.ToString());




                                                img.ParentNode.ReplaceChild(newImgNode, img);
                                            }
                                        }
                                        catch (Exception ex)
                                        {
                                        }
                                    }
                                    outputHtml = document.DocumentNode.OuterHtml;
                                    outputHtml = RoundImageDimensions(document.DocumentNode.OuterHtml);
                                    property.SetValue(objectInstance, outputHtml);
                                }
                                else
                                {
                                    outputHtml = RoundImageDimensions(document.DocumentNode.OuterHtml);
                                    property.SetValue(objectInstance, outputHtml);
                                }
                            }
                        }
                    }
                }
            }

        }

        public static string CCAllEmail(string systemAddress, string userAddresses)
        {
            return $"{userAddresses};{systemAddress}";
        }

        public static string RoundImageDimensions(string html)
        {
            string pattern = @"(width|height)\s*=\s*[""']?([\d.]+)[""']?";
            return Regex.Replace(html, pattern, match =>
            {
                string attr = match.Groups[1].Value;
                double value = double.Parse(match.Groups[2].Value);
                int rounded = (int)Math.Round(value);
                return $"{attr}=\"{rounded}\"";
            });
        }
        public static HtmlDocument TableHTMLRemake(string stringValue)
        {
            HtmlDocument document = new HtmlDocument();
            document.LoadHtml(stringValue);
            var styleNode = HtmlNode.CreateNode(@"
                        <style>
                            table {
                                border-collapse: collapse;
                                width: 100%;
                            }
                            td {
                                border: 1px solid black;
                                text-align: center;
                                width: 50px;
                                height: 30px;
                            }
                            td:nth-child(2) {
                                font-weight: bold;
                            }
                        </style>
                    ");
            // Lấy tất cả các thẻ <table>
            var tables = document.DocumentNode.SelectNodes("//table");
            if (tables != null)
            {
                foreach (var table in tables)
                {
                    var newTable = table;
                    // Kiểm tra nếu thẻ <table> chưa có thuộc tính border
                    if (newTable.Attributes.Count > 0)
                    {
                        if (!newTable.Attributes.Contains("border"))
                        {
                            //newTable.Attributes.Add("border", "0");
                            if (newTable.Attributes.Count > 0)
                            {
                                string newStyle = "border-spacing: 0;border-collapse: collapse; ";
                                if (newTable.Attributes["style"] != null)
                                {
                                    string currentStyle = newTable.Attributes["style"].Value;

                                    table.Attributes["style"].Value = $"{currentStyle} {newStyle}".Trim();
                                }
                                else
                                {
                                    newTable.Attributes.Add("style", newStyle);
                                }
                            }
                        }
                        // Lấy tất cả các cell trong bảng
                        var cells = newTable.SelectNodes(".//td | .//th");
                        if (cells != null)
                        {
                            foreach (var cell in cells)
                            {
                                var newCell = cell;
                                // Thêm style vào từng cell
                                if (newCell.Attributes["style"] != null)
                                {
                                    string currentStyle = cell.Attributes["style"].Value;
                                    string newStyle = "border: 1px solid black; text-align: center;";
                                    newCell.Attributes["style"].Value = $"{currentStyle} {newStyle}".Trim();
                                }
                                else
                                {
                                    newCell.Attributes.Add("style", "border: 1px solid black;");
                                }
                                cell.ParentNode.ReplaceChild(newCell, cell);

                                //// Ví dụ: Chèn nội dung nếu ô trống
                                //if (string.IsNullOrWhiteSpace(newCell.InnerText))
                                //{
                                //    newCell.InnerHtml = "N/A";
                                //}
                            }
                        }
                        //newTable.PrependChild(styleNode);
                        table.ParentNode.ReplaceChild(newTable, table);
                    }
                }
            }
            return document;
        }

        public static string GenerateFileNameFromBase64(string base64Content)
        {
            using (var md5 = MD5.Create())
            {
                byte[] hashBytes = md5.ComputeHash(Encoding.UTF8.GetBytes(base64Content));
                return BitConverter.ToString(hashBytes).Replace("-", "").ToLower() + ".jpg";
            }
        }

        public static string BuildInsertQuery<T>(T entity, string tableName, string userName) where T : class
        {
            HandleSystemAttribute(entity, userName, CommandQueryType.Insert);
            var properties = ObjectProperties<T>();//typeof(T).GetProperties().Where(w => w.Name != w.PropertyType.Name).Where(w => w.PropertyType.Name != "List`1").Where(w => w.Name != "Id").Where(w => !w.Name.EndsWith("FK")).Where(w => !w.Name.EndsWith("Enum"));
            var columnNames = string.Join(", ", properties.Select(p => $"[{p.Name}]"));
            var valueParameters = string.Join(", ", properties.Select(p => $"@{p.Name}"));

            return $"INSERT INTO [{tableName}] ({columnNames}) OUTPUT INSERTED.Id, INSERTED.Guid VALUES ({valueParameters})";
        }

        public static string BuildSelectQuery<T>(string tableName = null, string field = null) where T : class
        {
            string inField = field != null ? field : "Id";
            string inTableName = tableName != null ? tableName : typeof(T).Name;
            return $"SELECT * FROM {inTableName} WITH (NOLOCK) WHERE {inField} = @Id AND Deleted = 0";
        }

        public static string BuildEnumQuery<T>(string enumName = "") where T : class
        {
            string query = $@"SELECT EnumData.* 
                         FROM EnumData WITH (NOLOCK) 
                         WHERE EnumData.Id = @Id";
            if (!string.IsNullOrEmpty(enumName))
            {
                query = $@"SELECT EnumData.* 
                         FROM EnumData WITH (NOLOCK) 
                         INNER JOIN SysTable ON SysTable.Id = EnumData.SysTableId
                         WHERE EnumData.[Name] = '{enumName}' AND EnumData.Id = @Id";
            }
            return query;
        }

        public static Expression<Func<T, object>> MakeLambda<T>(Type entityType, PropertyInfo property) where T : class
        {
            var parameter = Expression.Parameter(entityType, "x");
            var propertyAccess = Expression.Property(parameter, property.Name);
            return Expression.Lambda<Func<T, object>>(Expression.Convert(propertyAccess, typeof(object)), parameter);
        }

        public static void HandleSystemAttribute<T>(T entity, string userName, CommandQueryType commandType) where T : class
        {
            //var userName = httpContextAccessor?.HttpContext?.User?.Identity?.Name.Replace("TOKIOMARINE\\","");

            if (string.IsNullOrEmpty(userName))
                return; // Nếu không có user, không xử lý

            var properties = typeof(T).GetProperties(BindingFlags.Public | BindingFlags.Instance);
            switch (commandType)
            {
                case CommandQueryType.Insert:
                    var createdByProperty = properties.FirstOrDefault(p => p.Name == "CreatedBy" && p.CanWrite);
                    if (createdByProperty != null)
                    {
                        createdByProperty.SetValue(entity, userName);
                    }
                    break;

                case CommandQueryType.Update:
                    var modifiedByProperty = properties.FirstOrDefault(p => p.Name == "ModifiedBy" && p.CanWrite);
                    if (modifiedByProperty != null)
                    {
                        modifiedByProperty.SetValue(entity, userName);
                    }
                    break;

                case CommandQueryType.Delete:
                    var deletedByProperty = properties.FirstOrDefault(p => p.Name == "DeletedBy" && p.CanWrite);
                    if (deletedByProperty != null)
                    {
                        deletedByProperty.SetValue(entity, userName);
                    }
                    break;

                default:
                    break;
            }
        }
      



        public static byte[] ConvertIntArrayToByteArray(int[] intArray)
        {
            // Mỗi int có 4 byte, nên byte array sẽ có độ dài gấp 4 lần int array
            byte[] byteArray = new byte[intArray.Length * 4];

            for (int i = 0; i < intArray.Length; i++)
            {
                byte[] bytes = BitConverter.GetBytes(intArray[i]);
                Buffer.BlockCopy(bytes, 0, byteArray, i * 4, 4);
            }

            return byteArray;
        }

    
        private static Dictionary<string, string> LoadAbbreviationsFromJson()
        {
            string JsonFilePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot/config/abbreviations.json");
            if (!File.Exists(JsonFilePath))
                return new Dictionary<string, string>() { };

            string jsonContent = System.IO.File.ReadAllText(JsonFilePath);
            return JsonConvert.DeserializeObject<Dictionary<string, string>>(jsonContent);
        }

        private static string ImageResizeBeforeSaveAsDataBase()
        {
            return "";

        }

       

        public static List<Dictionary<string, object>> ConvertDataTableToDictionaryList(System.Data.DataTable dt)
        {
            var list = new List<Dictionary<string, object>>();

            foreach (DataRow row in dt.Rows)
            {
                var dict = new Dictionary<string, object>();

                foreach (DataColumn col in dt.Columns)
                {
                    dict[col.ColumnName] = row[col] != DBNull.Value ? row[col] : null;
                }

                list.Add(dict);
            }

            return list;
        }
    

        public static MailQueue MakeMailQueueItem(MailItem mailItem, MailConfig emailSettings, List<string> attachments = null, string type = "")
        {
            MailQueue mailQueue = new MailQueue();
            //mailQueue.ToName = mailItem.ToName;
            //mailQueue.ToEmail = mailItem.ToEmail;
            //mailQueue.Subject = mailItem.Subject;
            //mailQueue.TextBody = mailItem.HtmlBody;
            //mailQueue.HtmlBody = mailItem.TextBody;
            //mailQueue.CC = mailItem.CC;
            //mailQueue.BCC = mailItem.BCC;
            //mailQueue.FromAccount = emailSettings.User;
            //mailQueue.Type = type;
            //mailQueue.Attachments = attachments != null ? string.Join(',', attachments) : "";
            //mailQueue.IsSend = true;
            return mailQueue;
        }

        public static string ClearMailPlaceHolder(string input)
        {
            return Regex.Replace(input, @"@@[a-zA-Z0-9]+", "");
        }

        public static MailQueue NotifySession(Employee staff, Users notifyUser, MailTemplate mailTemplate, MailConfig emailSettings, Dictionary<string, object> dictionary, string FOLLOW_CC, List<string> attachments = null)
        {
            string contentHandle = MailUtil.BodyContentHandle(mailTemplate.TemplateContent, dictionary);
            mailTemplate.TemplateMailTitle = MailUtil.TitleContentHandle(mailTemplate.TemplateMailTitle, dictionary);
            mailTemplate.PrefixTitleMail = MailUtil.TitleContentHandle(mailTemplate.PrefixTitleMail, dictionary);
            if (notifyUser != null && mailTemplate != null)
            {
                if (mailTemplate.IsActive ?? false)
                {
                    MailItem mailItem = new MailItem();
                    mailItem.ToName = !string.IsNullOrEmpty(notifyUser.mail) ? notifyUser.name : mailTemplate.To;
                    mailItem.ToEmail = !string.IsNullOrEmpty(notifyUser.mail) ? notifyUser.mail : mailTemplate.To;
                    mailItem.Subject = $"{mailTemplate.PrefixTitleMail} {mailTemplate.TemplateMailTitle}";
                    mailItem.HtmlBody = contentHandle;
                    mailItem.TextBody = "";

                    string ccAddresses = string.Join(';', mailTemplate.CC.Split(';').Concat(FOLLOW_CC.Split(';')).Where(w => !string.IsNullOrEmpty(w)));
                    mailItem.CC = ccAddresses;
                    MailUtil.SendEmail(emailSettings, mailItem, attachments).Wait();
                    return MakeMailQueueItem(mailItem, emailSettings, attachments, "User");
                }
            }
            return null;
        }

       


        private static int getDecreaseTime(int maxSize, double x)//x is imgWidth or imgHeight
        {
            //----------        Getting Decreased Size
            int y = 1;
            while (true)
            {
                double t = x / y;
                if (t <= maxSize)
                {
                    break;
                }
                else
                {
                    y++;
                }

            }
            return y;
        }

        public static string GetMimeType(string fileName)
        {
            var ext = Path.GetExtension(fileName);
            return ext != null && GetMimeTypes().TryGetValue(ext.ToLower(), out var mime) ? mime : "application/octet-stream";
        }

        public static Dictionary<string, string> GetMimeTypes()
        {
            return new Dictionary<string, string>
            {
                {".txt", "text/plain"},
                {".pdf", "application/pdf"},
                {".doc", "application/vnd.ms-word"},
                {".docx", "application/vnd.ms-word"},
                {".xls", "application/vnd.ms-excel"},
                {".xlsx", "application/vnd.openxmlformatsofficedocument.spreadsheetml.sheet"},
                {".ppt", "application/vnd.ms-powerpoint"},
                {".pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation"},
                {".png", "image/png"},
                {".jpg", "image/jpeg"},
                {".jpeg", "image/jpeg"},
                {".bmp", "image/bmp"},
                {".gif", "image/gif"},
                {".svg", "image/svg+xml"},
                {".bin", "application/octet-stream"},
                {".ico", "image/vnd.microsoft.icon"},
                {".csv", "text/csv"},
                {".rar", "application/x-rar-compressed"},
                {".rtf", "application/rtf"},
            };
        }

        private static bool ThumbnailCallback()
        {
            return false;
        }

        private static void createImage(System.Drawing.Image img, string name, int width, int height)
        {
            using (Bitmap thumbnail = new Bitmap(width, height))
            {
                using (Graphics graphics = Graphics.FromImage(thumbnail))
                {
                    // Cải thiện chất lượng ảnh
                    graphics.InterpolationMode = System.Drawing.Drawing2D.InterpolationMode.HighQualityBicubic;
                    graphics.SmoothingMode = System.Drawing.Drawing2D.SmoothingMode.AntiAlias;
                    graphics.PixelOffsetMode = System.Drawing.Drawing2D.PixelOffsetMode.HighQuality;
                    graphics.CompositingQuality = System.Drawing.Drawing2D.CompositingQuality.HighQuality;

                    // Vẽ ảnh đã resize lên bitmap
                    graphics.DrawImage(img, 0, 0, width, height);
                }

                // Lưu ảnh với chất lượng cao hơn
                SaveImageWithQuality(thumbnail, name, 90); // 90 = Chất lượng cao
            }
        }

        // Hàm lưu ảnh với chất lượng cao
        private static void SaveImageWithQuality(Bitmap image, string filePath, int quality)
        {
            ImageCodecInfo jpgEncoder = ImageCodecInfo.GetImageDecoders()
                .FirstOrDefault(codec => codec.FormatID == System.Drawing.Imaging.ImageFormat.Jpeg.Guid);

            if (jpgEncoder != null)
            {
                EncoderParameters encoderParams = new EncoderParameters(1);
                encoderParams.Param[0] = new EncoderParameter(System.Drawing.Imaging.Encoder.Quality, quality);
                image.Save(filePath, jpgEncoder, encoderParams);
            }
            else
            {
                // Nếu không tìm thấy encoder JPEG, dùng PNG làm fallback
                image.Save(filePath, System.Drawing.Imaging.ImageFormat.Png);
            }
        }


        //private static void createImage(System.Drawing.Image img, string name, int width, int height)
        //{

        //    //----------        Creating Small Image
        //    System.Drawing.Image.GetThumbnailImageAbort myCallback = new System.Drawing.Image.GetThumbnailImageAbort(ThumbnailCallback);
        //    System.Drawing.Image myThumbnail = img.GetThumbnailImage(width, height, myCallback, IntPtr.Zero);

        //    //----------        Saving Image
        //    myThumbnail.Save(name);
        //}

        public static void ExifRotate(this Image img)
        {
            const int exifOrientationID = 0x112; //274
            if (!img.PropertyIdList.Contains(exifOrientationID))
                return;

            var prop = img.GetPropertyItem(exifOrientationID);
            int val = BitConverter.ToUInt16(prop.Value, 0);
            var rot = RotateFlipType.RotateNoneFlipNone;

            if (val == 3 || val == 4)
                rot = RotateFlipType.Rotate180FlipNone;
            else if (val == 5 || val == 6)
                rot = RotateFlipType.Rotate90FlipNone;
            else if (val == 7 || val == 8)
                rot = RotateFlipType.Rotate270FlipNone;

            if (val == 2 || val == 4 || val == 5 || val == 7)
                rot |= RotateFlipType.RotateNoneFlipX;

            if (rot != RotateFlipType.RotateNoneFlipNone)
                img.RotateFlip(rot);
        }

        public static void createThumb(string subDirectory, string saveToPath, string folder, ref Dictionary<string, string> newFiles)
        {
            //Stream fileStream, string path, string name
            string name = subDirectory.Split("\\").LastOrDefault();

            if (File.Exists(subDirectory))
                using (var fileStream = new FileStream(subDirectory, FileMode.Open))
                {
                    Image img = Image.FromStream(fileStream, true, false);

                    ExifRotate(img);
                    //----------Getting Size of Original Image
                    double imgHeight = img.Size.Height;
                    double imgWidth = img.Size.Width;
                    double x = 0;
                    int maxSize = 100;
                    int y = 0;
                    bool isLanscape = false;

                    if (imgHeight > imgWidth)
                    {
                        x = imgHeight;
                        isLanscape = false;
                    }
                    else
                    {
                        x = imgWidth;
                        isLanscape = true;
                    }


                    //create small size
                    y = getDecreaseTime(maxSize, x);
                    string thumbS_Name = Path.Combine(saveToPath, "thumbS_" + name);
                    createImage(img, thumbS_Name, Convert.ToInt32(imgWidth / y), Convert.ToInt32(imgHeight / y));
                    if (newFiles != null)
                    {
                        //newFiles.Add(thumbS_Name);
                    }
                    //create medium size
                    maxSize = 300;
                    y = getDecreaseTime(maxSize, x);
                    string thumbM_Name = Path.Combine(saveToPath, "thumbM_" + name);
                    createImage(img, thumbM_Name, Convert.ToInt32(imgWidth / y), Convert.ToInt32(imgHeight / y));
                    if (newFiles != null)
                    {
                        //newFiles.Add(thumbM_Name);
                    }
                    //create larg size
                    if (isLanscape == true)
                    {
                        if (x < 1000)
                        {
                            maxSize = Convert.ToInt32(x);
                        }
                        else
                        {
                            maxSize = 1000;
                        }
                    }
                    else
                    {
                        if (x < 680)
                        {
                            maxSize = Convert.ToInt32(x);
                        }
                        else
                        {
                            maxSize = 680;
                        }
                    }
                    y = getDecreaseTime(maxSize, x);
                    string thumbL_Name = Path.Combine(saveToPath, "thumbL_" + name);
                    createImage(img, thumbL_Name, Convert.ToInt32(imgWidth / y), Convert.ToInt32(imgHeight / y));
                    if (newFiles != null)
                    {
                        //newFiles.Add(thumbL_Name);
                    }
                    maxSize = 160;
                    y = getDecreaseTime(maxSize, x);
                    string thumbnail_Name = Path.Combine(saveToPath, "thumbnail_" + name);
                    createImage(img, thumbnail_Name, Convert.ToInt32(imgWidth / y), Convert.ToInt32(imgHeight / y));
                    if (newFiles != null)
                    {
                        newFiles.Add("thumbnail", $"{folder}\\thumbnail_{name}");
                    }
                    maxSize = 434;
                    y = getDecreaseTime(maxSize, x);
                    string thumbnail_Overview = Path.Combine(saveToPath, "overviewthumbnail_" + name);
                    createImage(img, thumbnail_Overview, Convert.ToInt32(imgWidth / y), Convert.ToInt32(imgHeight / y));
                    if (newFiles != null)
                    {
                        newFiles.Add("overview", $"{folder}\\overviewthumbnail_{name}");
                    }
                    maxSize = 235;
                    y = getDecreaseTime(maxSize, x);
                    string thumbnail_Sitepicture = Path.Combine(saveToPath, "sitepicturethumbnail_" + name);
                    createImage(img, thumbnail_Sitepicture, Convert.ToInt32(imgWidth / y), Convert.ToInt32(imgHeight / y));
                    if (newFiles != null)
                    {
                        newFiles.Add("sitepicture", $"{folder}\\sitepicturethumbnail_{name}");
                    }
                }
        }
        public static bool IsObjectEmpty(object obj, string[] checkFields)
        {
            if (obj == null || checkFields == null || checkFields.Length == 0)
                return true;

            // Lấy danh sách tất cả property của object, chuyển thành lowercase
            var properties = obj.GetType().GetProperties()
                .Where(p => checkFields.Any(a => a.ToLower() == p.Name.ToLower())) // Chỉ lấy property có trong checkFields
                .ToList();

            foreach (var prop in properties)
            {
                var value = prop.GetValue(obj);

                if (value is string strValue && !string.IsNullOrWhiteSpace(strValue))
                {
                    string plainTextValue = "";
                    if (Util.IsHtml(strValue))
                    {
                        HtmlDocument document = new HtmlDocument();
                        document = Util.TableHTMLRemake(strValue);
                        plainTextValue = document.DocumentNode.InnerText;
                        return string.IsNullOrEmpty(plainTextValue);

                    }
                    return false; // Có ít nhất một giá trị không rỗng
                }
            }

            return true; // Nếu tất cả thuộc tính cần kiểm tra đều rỗng
        }

        //public static Dictionary<string, bool> IsObjectProperties(object obj, string[] checkFields)
        //{
        //    Dictionary<string, bool> returnObject = new Dictionary<string, bool>();

        //    if (obj == null || checkFields == null || checkFields.Length == 0)
        //        return returnObject;

        //    // Lấy danh sách các property được yêu cầu kiểm tra (ignore case)
        //    var properties = obj.GetType().GetProperties()
        //        .Where(p => checkFields.Any(f => f.Equals(p.Name, StringComparison.OrdinalIgnoreCase)))
        //        .ToList();

        //    foreach (var prop in properties)
        //    {
        //        string fieldName = prop.Name;
        //        var value = prop.GetValue(obj);

        //        bool isEmpty = false;

        //        if (value == null)
        //        {
        //            isEmpty = true;
        //        }
        //        else if (value is string strValue)
        //        {
        //            if (Util.IsHtml(strValue))
        //            {
        //                HtmlDocument document = new HtmlDocument();
        //                document.LoadHtml(strValue);
        //                var plainText = document.DocumentNode.InnerText?.Trim();

        //                isEmpty = string.IsNullOrWhiteSpace(plainText);
        //            }
        //            else
        //            {
        //                isEmpty = string.IsNullOrWhiteSpace(strValue);
        //            }
        //        }

        //        returnObject[fieldName.ToLower()] = isEmpty;
        //    }

        //    return returnObject;
        //}

        public static Dictionary<string, bool> IsObjectProperties(object obj, string[] checkFields)
        {
            Dictionary<string, bool> returnObject = new Dictionary<string, bool>();

            if (obj == null || checkFields == null || checkFields.Length == 0)
                return returnObject;

            // Tạo dictionary để tra cứu property theo tên lower case
            var propertyDict = obj.GetType().GetProperties()
                .ToDictionary(p => p.Name.ToLower(), p => p);

            foreach (var field in checkFields)
            {
                string fieldKey = field.ToLower();
                bool isEmpty = true;

                if (propertyDict.TryGetValue(fieldKey, out PropertyInfo prop))
                {
                    var value = prop.GetValue(obj);

                    if (value != null)
                    {
                        if (value is string strValue)
                        {
                            if (Util.IsHtml(strValue))
                            {
                                HtmlDocument document = new HtmlDocument();
                                document.LoadHtml(strValue);
                                var plainText = document.DocumentNode.InnerText?.Trim();
                                isEmpty = string.IsNullOrWhiteSpace(plainText);
                            }
                            else
                            {
                                isEmpty = string.IsNullOrWhiteSpace(strValue);
                            }
                        }
                        else
                        {
                            // Nếu không phải string, mà có giá trị thì coi như không rỗng
                            isEmpty = false;
                        }
                    }
                }

                // Add kết quả vào dictionary (giữ key là lowercase)
                returnObject[field] = isEmpty;
            }

            return returnObject;
        }


        public static string ApplyAbbreviation(string input)
        {
            var abbreviations = LoadAbbreviationsFromJson();
            if (abbreviations.Count > 0)
                foreach (var abbreviation in abbreviations)
                {
                    input = Regex.Replace(input, $@"\b{abbreviation.Key}\b", abbreviation.Value, RegexOptions.IgnoreCase);
                }
            return input;
        }

        public static byte[] ConvertObjectToByteArray(object objectInstance)
        {
            return Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(objectInstance));
        }

        public static string BuildGetTableColumnsFromDataBaseQuery(string tableName)
        {
            return $@"SELECT 
                                col.column_id AS Id,  
                                STUFF(LOWER(LEFT(col.name, 1)) + SUBSTRING(col.name, 2, LEN(col.name)), 1, LEN(col.name), LOWER(LEFT(col.name, 1)) + SUBSTRING(col.name, 2, LEN(col.name))) AS DataField, 
                                CASE 
                                    WHEN typ.name IN ('varchar', 'nvarchar', 'char', 'text', 'ntext') THEN 'string'
                                    WHEN typ.name IN ('int', 'bigint', 'smallint', 'tinyint', 'decimal', 'numeric', 'float', 'real', 'money') THEN 'number'
                                    WHEN typ.name IN ('bit') THEN 'boolean' 
                                    WHEN typ.name IN ('varbinary') THEN 'bytes'
                                    ELSE 'other' 
                                END AS DataType, 
                                1 AS AllowGrouping,  
                                1 AS AllowHeaderFiltering,  
                                col.name AS Caption
                            FROM sys.columns col
                            JOIN sys.types typ ON col.user_type_id = typ.user_type_id
                            WHERE col.object_id = OBJECT_ID('{tableName}')";
        }

        public static string BuildGetTableColumnsFromConfigQuery(string tableName)
        {
            return $@"SELECT dgc.* 
                            FROM DataGridConfig dgc WITH (NOLOCK) 
                            INNER JOIN SysTable st ON dgc.SysTableId = st.Id
                            WHERE st.Name = '{tableName}' AND dgc.Deleted = 0 ORDER BY [Order] ASC
                      "; ;
        }

        public static string BuildGetAllTableColumnsFromConfigQuery()
        {
            return $@"SELECT dgc.* 
                            FROM DataGridConfig dgc WITH (NOLOCK) 
                            INNER JOIN SysTable st ON dgc.SysTableId = st.Id
                            WHERE  dgc.Deleted = 0
                            ORDER BY [Order] ASC
                      "; ;
        }
        public static bool IsHtml(string input)
        {
            if (string.IsNullOrWhiteSpace(input))
                return false;

            string pattern = @"<[^>]+>"; // Kiểm tra nếu có bất kỳ thẻ HTML nào
            return System.Text.RegularExpressions.Regex.IsMatch(input, pattern);
        }
        public static string BuildUpdateQuery<T>(string changeFields, string tableName, long? keyId, string keyColumn, string userName) where T : class
        {
            //var userName = httpContextAccessor?.HttpContext?.User?.Identity?.Name;
            //HandleSystemAttribute(entity, httpContextAccessor, CommandQueryType.Update);
            var changedProperties = JsonConvert.DeserializeObject<Dictionary<string, object>>(changeFields).Select(s => s.Key.ToLower());
            if (changedProperties.Count() > 0)
            {
                var properties = ObjectProperties<T>();//typeof(T).GetProperties().Where(w => w.Name != w.PropertyType.Name).Where(w => w.PropertyType.Name != "List`1").Where(w => w.Name != "Id").Where(w => !w.Name.EndsWith("FK")).Where(w => !w.Name.EndsWith("Enum"));
                var setClause = string.Join(", ", properties
                            .Where(p => changedProperties.Contains(p.Name.ToLower())).Select(p => $"[{p.Name}] = @{p.Name}"));
                //setClause += $", ModifiedBy = '{userName}', ModifiedDate = GETDATE()";
                if (!string.IsNullOrEmpty(setClause))
                    return $"UPDATE [{tableName}] SET {setClause} WHERE [{keyColumn}] = {keyId}";
                else
                    return "";
            }
            else
            {
                return "";
            }
        }
        public static string BuildDeleteQuery<T>(T entity, object keyId, string keyColumn, string userName, bool isRemove = true) where T : class
        {
            HandleSystemAttribute(entity, userName, CommandQueryType.Delete);
            if (!isRemove)
            {
                //var userName = httpContextAccessor?.HttpContext?.User?.Identity?.Name;
                return $"UPDATE [{typeof(T).Name}] SET Deleted = 1, DeletedBy = '{userName}', DeletedDate = GETDATE()  WHERE [{keyColumn}] = '{keyId}'";
            }
            else
                return $"DELETE FROM [{typeof(T).Name}] WHERE [{keyColumn}] = '{keyId}'";
        }
        public static string BuildSelectAllQuery<T>(string tableName)
        {
            //return $"SELECT * FROM [{tableName}] WITH (NOLOCK) WHERE Deleted = 0 ORDER BY RowOrder ASC";
            return $"SELECT * FROM [{tableName}] WITH (NOLOCK) WHERE Deleted = 0";
        }

        public static (string sqlQuery, Dictionary<string, object> parameters) BuildSelectQuery<T>(string tableName, Expression<Func<T, bool>> predicate)
        {
            string baseQuery = $"SELECT * FROM [{tableName}] WITH (NOLOCK) WHERE Deleted = 0";

            var (whereClause, parameters) = ExpressionToSqlConverter<T>.ConvertToSqlWhere(predicate);

            if (!string.IsNullOrEmpty(whereClause))
            {
                baseQuery += " AND " + whereClause;
            }

            //baseQuery += " ORDER BY RowOrder ASC";

            return (baseQuery, parameters);
        }

        public static string BuildSelectAllActiveQuery<T>(string tableName)
        {
            return $"SELECT * FROM [{tableName}] WITH (NOLOCK) WHERE Active = 1 AND Deleted = 0";
        }




    }
    public enum CommandQueryType
    {
        Insert,
        Update,
        Delete
    }
}
