using Newtonsoft.Json;
using ERPCore.Models.Migration.Business.Data;
using System.Reflection;
using HtmlAgilityPack;
using System.Text.RegularExpressions;
using System.Security.Cryptography;
using System.Text;
using ERPCore.Models.Request;
using System.Data;
using System.Drawing;
using ERPCore.Common.Constant;
using ERPCore.Models.Migration.Business.HumanResource;
using ERPCore.Models.Migration.Business.MasterData;
using System.Linq.Expressions;
using System.Drawing.Imaging;
using Microsoft.Data.SqlClient;
using ExcelDataReader;
using System.Globalization;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Spreadsheet;
using System.Text.Json;
using System.Configuration;
using TMIVHashing;
using ERPCore.Models.Models.Parsing;
using WebConfig = Microsoft.Extensions.Configuration;
using ERPCore.Models.Migration.Business.Social;
namespace ERPCore.Common
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
        public static object URLObjectMaking(dynamic transferObject)
        {

            try
            {
                Type objectType = ((Type)transferObject.GetType());
                string CodeField = objectType.GetProperties().FirstOrDefault(f => f.Name.Contains("Code"))?.Name ?? "";
                string fieldValue = objectType.GetProperties().FirstOrDefault(f => f.Name.Contains("Code"))?.GetValue((dynamic)transferObject) ?? "";
                if (string.IsNullOrEmpty(CodeField))
                return new
                {
                    url = $"/Business/Form/{objectType.Name}_Form/{transferObject.Id}",
                    caption = $"form_{objectType.Name}_Form_{transferObject.Id}",
                    name = $"{(objectType.Name)}",
                    data = ""

                }; else
                return new
                {
                    url = $"/Business/Form/{objectType.Name}_Form/{transferObject.Id}",
                    caption = $"form_{objectType.Name}_Form_{transferObject.Id}",
                    name = $"{(objectType.Name)} {fieldValue}",
                    data = ""

                };

            }
            catch
            {
                return new
                {
                    url = $"",
                    caption = $"",
                    name = $"",
                    data = ""

                };
            }
            return new
            {
                url = $"",
                caption = $"",
                name = $"",
                data = ""

            };
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
                                //int maxHeight = 400;
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
                                                //if (double.Parse(height) > maxHeight)
                                                //newImgNode.SetAttributeValue("height", maxHeight.ToString());
                                                if (double.Parse(height) > 0)
                                                    newImgNode.SetAttributeValue("height", height.ToString());




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

        public static string HtmlExtractToString(string htmlContent)
        {
            HtmlDocument document = new HtmlDocument();
            document.LoadHtml(htmlContent);
            return document.DocumentNode.InnerText;
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
            mailQueue.ToName = mailItem.ToName;
            mailQueue.ToEmail = mailItem.ToEmail;
            mailQueue.Subject = mailItem.Subject;
            mailQueue.TextBody = mailItem.TextBody;
            mailQueue.HtmlBody = mailItem.HtmlBody;
            mailQueue.CC = mailItem.CC;
            mailQueue.BCC = mailItem.BCC;
            mailQueue.FromAccount = emailSettings.User;
            mailQueue.Type = type;
            mailQueue.Attachments = attachments != null ? string.Join(',', attachments) : "";
            mailQueue.IsSend = false;
            return mailQueue;
        }

        public static string ClearMailPlaceHolder(string input)
        {
            return Regex.Replace(input, @"@@[a-zA-Z0-9]+", "");
        }

        public static MailQueue NotifySession(Employee staff, MailTemplate mailTemplate, MailConfig emailSettings, Dictionary<string, object> dictionary, string FOLLOW_CC, List<string> attachments = null)
        {
            string contentHandle = MailUtil.BodyContentHandle(mailTemplate.TemplateContent, dictionary);
            mailTemplate.TemplateMailTitle = MailUtil.TitleContentHandle(mailTemplate.TemplateMailTitle, dictionary);
            mailTemplate.PrefixTitleMail = MailUtil.TitleContentHandle(mailTemplate.PrefixTitleMail, dictionary);
            if  (mailTemplate != null && staff != null)
            {
                if (mailTemplate.IsActive ?? false)
                {
                    MailItem mailItem = new MailItem();
                    mailItem.ToName = !string.IsNullOrEmpty(staff.FullName) ? staff.FullName : mailTemplate.To;
                    mailItem.ToEmail = !string.IsNullOrEmpty(staff.Email) ? staff.Email : mailTemplate.To;
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




        public static int GetLastSegment(string? stepNo)
        {
            if (string.IsNullOrWhiteSpace(stepNo))
                return 0;

            var parts = stepNo.Split('.');

            return int.TryParse(parts[^1], out int result) ? result : 0;
        }


        public static int GetPreviousSegment(string? stepNo)
        {
            if (string.IsNullOrWhiteSpace(stepNo))
                return 0;

            var parts = stepNo.Split('.');
            var number = parts[0];
            return int.Parse(parts[0]);
            //return int.TryParse(parts[0], out int result) ? result : 0;
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

        public static void createThumbLC(string subDirectory, string saveToPath, string folder, ref Dictionary<string, string> newFiles)
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
        public static string CheckImageQualityByConfig(string optimizeSize)
        {
            string prefixThumbnailName = "";
            switch (optimizeSize)
            {
                case "S":
                    prefixThumbnailName = "thumb" + optimizeSize;
                    break;
                case "SM":
                    prefixThumbnailName = "thumbnail";
                    break;
                case "M":
                    prefixThumbnailName = "thumb" + optimizeSize;
                    break;
                case "L":
                    prefixThumbnailName = "thumb" + optimizeSize;
                    break;
                default:
                    break;
            }
            return prefixThumbnailName;
        }
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
                                CASE col.name WHEN 'CSSClass' THEN 'cssClass'
                                ELSE
                                STUFF(LOWER(LEFT(col.name, 1)) + SUBSTRING(col.name, 2, LEN(col.name)), 1, LEN(col.name), LOWER(LEFT(col.name, 1)) + SUBSTRING(col.name, 2, LEN(col.name))) 
                                END AS DataField, 
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
                            WHERE st.Name = '{tableName}' AND dgc.Deleted = 0 
                            --ORDER BY [Order] ASC
                      "; ;
        }

        public static string BuildGetAllTableColumnsFromConfigQuery()
        {
            //return $@"SELECT dgc.* 
            //                FROM DataGridConfig dgc WITH (NOLOCK) 
            //                INNER JOIN SysTable st ON dgc.SysTableId = st.Id
            //                WHERE  dgc.Deleted = 0
            //                ORDER BY [Order] ASC
            //          "; ;
            return $@"SELECT dgc.* 
                            FROM DataGridConfig dgc WITH (NOLOCK) 
                            INNER JOIN SysTable st ON dgc.SysTableId = st.Id
                            WHERE  dgc.Deleted = 0
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
        public static (string sqlQuery, Dictionary<string, object> parameters) BuildSelectAllQuery<T>(string tableName, Expression<Func<T, bool>> predicate = null, bool nonCondition = false)
        {
            //return $"SELECT * FROM [{tableName}] WITH (NOLOCK) WHERE Deleted = 0 ORDER BY RowOrder ASC";
            string baseQuery = $"SELECT * FROM [{tableName}] WITH (NOLOCK) WHERE Deleted = 0";
            if (nonCondition) return (baseQuery, new Dictionary<string, object>());
            if (predicate != null)
            {
                var (whereClause, parameters) = ExpressionToSqlConverter<T>.ConvertToSqlWhere(predicate);

                if (!string.IsNullOrEmpty(whereClause))
                {
                    baseQuery += " AND " + whereClause;
                }
                return (baseQuery, parameters);
            }
            else
            {
                return (baseQuery, new Dictionary<string, object>());
            }

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

        public static Notification MakeNotificationFromEmail(Notification notification, MailQueue mailQueue,dynamic objectIn , WebConfig.IConfiguration configuration,out UrlCall urlCall)
        {
            urlCall = new UrlCall();
            

            urlCall.Folder = "Business";
            urlCall.Module = "Workflow";
            urlCall.Controller = "SurveyWorkflow";
            urlCall.Action = "Index";
            urlCall.TypeAction = "View";
            urlCall.Token = "";
            urlCall.RecordGuidId = objectIn.Guid;
            urlCall.Params = JsonConvert.SerializeObject(new
            {
                url = $"/Business/Form/{objectIn.GetType().Name}_Form/{objectIn.Id}",
                caption = $"form_{objectIn.GetType().Name}_Form_{objectIn.Id}",
                name = $"{objectIn.GetType().Name} {objectIn.Code}",
                data = ""
            });
            urlCall.ExpireTime = DateTime.Now.AddDays(2);
            urlCall.Expired = false;
            string REDIRECT_MAIN_VIEW = configuration.GetSection("UrlConfig:RedirectMainView").Value;
            //string redirectMainView = System.IO.Path.Combine(REDIRECT_MAIN_VIEW, typeof(UrlCall).Name, "ReturnView");
            string redirectMainView = $"{REDIRECT_MAIN_VIEW}{typeof(UrlCall).Name}{"/ReturnView"}";
            redirectMainView += $"?guid={urlCall.Guid}";
            notification.IsRead = false;
            notification.Url = $"/Business/Form/{nameof(Quotation)}_Form/{objectIn.Id}";
            notification.Resource = $"{objectIn.Resource}";
            notification.System = "WM";
            notification.Title = mailQueue.subject;
            notification.Message = mailQueue.html_body;
            notification.ReceivedBy = $"{mailQueue.ToName},{mailQueue.cc}";
            notification.RecordGuid = objectIn.Guid;

            return notification;
        }
        public static Dictionary<string, object> MakeQueryIntoDirectory(DataRow row)
        {
            var dictionary = new Dictionary<string, object>();
            if (row != null)
            {
                // Lấy danh sách các cột từ DataRow
                foreach (DataColumn column in row.Table.Columns)
                {
                    // Lấy giá trị và chuẩn hóa về chuỗi
                    var value = row[column.ColumnName]?.ToString();

                    if (!string.IsNullOrWhiteSpace(value))
                    {
                        string propertyName = column.ColumnName;

                        if (propertyName == "DueDate")
                        {
                            DateTime? dueDate = DateTime.Parse(value);
                            string formattedDate = dueDate?.ToString("dd/MM/yyyy");
                            dictionary.Add($"@@{char.ToLower(propertyName[0])}{propertyName.Substring(1)}", formattedDate);
                        }
                        else
                        {
                            dictionary.Add($"@@{char.ToLower(propertyName[0])}{propertyName.Substring(1)}", value);
                        }
                    }
                }
            }
            return dictionary;
        }

        public static Dictionary<string, object> SimilarObject(object obj)
        {
            if (obj == null)
                return new Dictionary<string, object>();

            return obj.GetType()
                      .GetProperties()
                      .ToDictionary(prop => prop.Name, prop => prop.GetValue(obj, null));
        }
        public static FileStream OpenExcelReadStream(string filePath)
        {
            return new FileStream(
                filePath,
                FileMode.Open,
                FileAccess.Read,
                FileShare.ReadWrite // để không bị lock nếu file đang mở ở nơi khác
            );
        }

        // Source - https://stackoverflow.com/a
        // Posted by Tim Schmelter, modified by community. See post 'Timeline' for change history
        // Retrieved 2026-01-08, License - CC BY-SA 3.0

        public static DataSet ReadExcelFiles(string filePath, bool useHeaderRow = true)
        {
            // Required for .NET Core to handle various encodings (xls)
            Encoding.RegisterProvider(CodePagesEncodingProvider.Instance);

            using (var stream = File.Open(filePath, FileMode.Open, FileAccess.Read))
            using (var reader = ExcelReaderFactory.CreateReader(stream))
            {
                var result = reader.AsDataSet(new ExcelDataSetConfiguration
                {
                    ConfigureDataTable = _ => new ExcelDataTableConfiguration
                    {
                        UseHeaderRow = useHeaderRow
                    }
                });

                return result;
            }
        }
        public static DataTable? GetTableBySheetName(DataSet ds, string sheetName, bool ignoreCase = true)
        {
            if (ds == null || ds.Tables.Count == 0) return null;

            if (!ignoreCase) return ds.Tables.Contains(sheetName) ? ds.Tables[sheetName] : null;

            // case-insensitive lookup
            return ds.Tables
                     .Cast<DataTable>()
                     .FirstOrDefault(t => string.Equals(t.TableName, sheetName, StringComparison.OrdinalIgnoreCase));
        }
        public static string MakingSelectSql(
            DataTable mappingTable,
            string sourceTable,
            string targetTable,
            string idValue)
                {
                        var sourceFields = new List<string>();
                        var targetFields = new List<string>();

                        foreach (DataRow r in mappingTable.Rows)
                        {
                            sourceFields.Add(r[0].ToString()!); // cột 1
                            targetFields.Add(r[1].ToString()!); // cột 2
                        }

                        return $@"
            SELECT {string.Join(", ", sourceFields)}
            FROM {sourceTable}
            WHERE c_jogetQuoNum = ''{idValue}''
            ".Trim();
        }

        public static string MakingInsertSql(
            DataTable mappingTable,
            string sourceTable,
            string targetTable)
        {
            var sourceFields = new List<string>();
            var targetFields = new List<string>();

            foreach (DataRow r in mappingTable.Rows)
            {
                sourceFields.Add(r[0].ToString()!); // cột 1
                targetFields.Add(r[1].ToString()!); // cột 2
            }

            return $@"
            INSERT INTO {targetTable} ({string.Join(", ", targetFields)})
             ";
        }
        public sealed class BuiltSql
        {
            public string Sql { get; init; } = "";
            public List<SqlParameter> Parameters { get; init; } = new();
            public int RowCount { get; init; }
            public int ColumnCount { get; init; }
        }

        /// <summary>
        /// mapping: cột 1 = sourceField (key trong Dictionary), cột 2 = targetField (cột DB)
        /// rows: list dictionary từ ExecuteCustomJogetQuery
        /// </summary>
        public static BuiltSql BuildInsertValuesSql(
            string targetTable,
            DataTable mapping,
            List<Dictionary<string, object>> rows,
            bool ignoreCaseKeys = true,
            bool skipRowsMissingAnyMappedField = false)
        {
            if (string.IsNullOrWhiteSpace(targetTable)) throw new ArgumentNullException(nameof(targetTable));
            if (mapping == null) throw new ArgumentNullException(nameof(mapping));
            if (rows == null) throw new ArgumentNullException(nameof(rows));
            if (rows.Count == 0) return new BuiltSql { Sql = "", RowCount = 0, ColumnCount = 0 };

            // 1) Chuẩn hoá mapping
            var mapPairs = mapping.Rows.Cast<DataRow>()
                .Select(r => new
                {
                    Source = (r[0]?.ToString() ?? "").Trim(),
                    Target = (r[1]?.ToString() ?? "").Trim()
                })
                .Where(x => !string.IsNullOrWhiteSpace(x.Source) && !string.IsNullOrWhiteSpace(x.Target))
                .ToList();

            if (mapPairs.Count == 0)
                throw new InvalidOperationException("Mapping table không có dòng hợp lệ (cột 1/2 rỗng).");

            // 2) Key comparer cho Dictionary
            StringComparer cmp = ignoreCaseKeys ? StringComparer.OrdinalIgnoreCase : StringComparer.Ordinal;

            // 3) Chọn “target columns” theo mapping, giữ đúng thứ tự mapping
            var targetColumns = mapPairs.Select(x => x.Target).ToList();

            // 4) Build VALUES rows + parameters
            var parameters = new List<SqlParameter>();
            var valuesRowsSql = new List<string>();

            int rowIndex = 0;
            foreach (var row in rows)
            {
                // Bọc lại dictionary để lookup ignoreCase ổn định
                var dict = (row is Dictionary<string, object> d && d.Comparer.Equals(cmp))
                    ? d
                    : new Dictionary<string, object>(row, cmp);

                // optional: bỏ qua row nếu thiếu field quan trọng
                if (skipRowsMissingAnyMappedField)
                {
                    bool missing = mapPairs.Any(p => !dict.ContainsKey(p.Source));
                    if (missing) continue;
                }

                var oneRowPlaceholders = new List<string>();

                for (int colIndex = 0; colIndex < mapPairs.Count; colIndex++)
                {
                    var p = mapPairs[colIndex];
                    string paramName = $"@p_{rowIndex}_{colIndex}";

                    object? raw = dict.TryGetValue(p.Source, out var v) ? v : null;
                    object dbValue = NormalizeToDbValue(raw);

                    //if (p.Source.Contains("oductName"))
                    //{
                      
                    //}

                    // Tạo parameter (SqlParameter tự infer type là được trong nhiều case)
                    var sp = new SqlParameter(paramName, dbValue ?? DBNull.Value);
                    parameters.Add(sp);

                    oneRowPlaceholders.Add(paramName);
                }

                valuesRowsSql.Add("(" + string.Join(", ", oneRowPlaceholders) + ")");
                rowIndex++;
            }

            if (valuesRowsSql.Count == 0)
                return new BuiltSql { Sql = "", Parameters = parameters, RowCount = 0, ColumnCount = mapPairs.Count };

            string sql = $@"
INSERT INTO {targetTable} ({string.Join(", ", targetColumns)})
VALUES
{string.Join(",\n", valuesRowsSql)};
".Trim();

            return new BuiltSql
            {
                Sql = sql,
                Parameters = parameters,
                RowCount = valuesRowsSql.Count,
                ColumnCount = mapPairs.Count
            };
        }

        private static object NormalizeToDbValue(object? v)
        {
            if (v == null || v == DBNull.Value) return DBNull.Value;

            // Excel/Joget hay trả string "TRUE"/"FALSE", "1"/"0"
            if (v is string s)
            {
                s = s.Trim();

                if (string.Equals(s, "NULL", StringComparison.OrdinalIgnoreCase)) return DBNull.Value;

                // bool-like
                if (string.Equals(s, "TRUE", StringComparison.OrdinalIgnoreCase)) return true;
                if (string.Equals(s, "FALSE", StringComparison.OrdinalIgnoreCase)) return false;

                // số (optional)
                if (decimal.TryParse(s, NumberStyles.Any, CultureInfo.InvariantCulture, out var dec))
                    return dec;
                DateTime dateValue = new DateTime();
                string[] formats = { "dd-mm-yyyy" };
                string[] excludesFormats = {"m.d.y", "d.m.y" };
                if (DateTime.TryParseExact(s, formats,
                        CultureInfo.InvariantCulture,
                        DateTimeStyles.None,
                        out dateValue))
                {
                    return dateValue;
                }
                // datetime (optional)
                if (DateTime.TryParse(s, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out DateTime dt))
                { 
                    if (DateTime.TryParseExact(s, excludesFormats,
                        CultureInfo.InvariantCulture,
                        DateTimeStyles.None,
                        out dateValue))
                    {
                        return s;
                    }
                    return dt;
                }

                return s;
            }

            return v;
        }

        public static DataTable ReadExcelFile(string filePath)
        {
            // Required for .NET Core to handle various encodings
            Encoding.RegisterProvider(CodePagesEncodingProvider.Instance);

            using (var stream = File.Open(filePath, FileMode.Open, FileAccess.Read))
            {
                // Auto-detect the file type (xls or xlsx)
                using (var reader = ExcelReaderFactory.CreateReader(stream))
                {
                    // Configure the data set to use the first row as column headers
                    var result = reader.AsDataSet(new ExcelDataSetConfiguration()
                    {
                        ConfigureDataTable = _ => new ExcelDataTableConfiguration()
                        {
                            UseHeaderRow = true
                        }
                    });

                    // Return the first sheet as a DataTable
                    if (result.Tables.Count > 0)
                    {
                        return result.Tables[0];
                    }
                }
            }
            return null;
        }
        public static SpreadsheetDocument OpenSpreadsheetDocument(Stream stream)
        {
            var settings = new OpenSettings
            {
                AutoSave = false//,
                //LeaveOpen = true
            };
            return SpreadsheetDocument.Open(stream, false, settings);
        }
        public static string GetString(
    List<Cell> cells,
    Dictionary<string, int> colMap,
    string col,
    WorkbookPart wbPart)
        {
            if (!colMap.ContainsKey(col)) return null;
            int idx = colMap[col];
            if (idx >= cells.Count) return null;
            return GetCellValue(wbPart, cells[idx]);
        }

        public static int? GetNullableInt(
            List<Cell> cells,
            Dictionary<string, int> colMap,
            string col,
            WorkbookPart wbPart)
        {
            var s = GetString(cells, colMap, col, wbPart);
            return int.TryParse(s, out var v) ? v : (int?)null;
        }

        public static DateTime? GetDate(
            List<Cell> cells,
            Dictionary<string, int> colMap,
            string col,
            WorkbookPart wbPart)
        {
            var raw = GetString(cells, colMap, col, wbPart);
            if (string.IsNullOrWhiteSpace(raw))
                return null;

            if (double.TryParse(raw, NumberStyles.Any, CultureInfo.InvariantCulture, out double oaDate))
            {
                try
                {
                    return DateTime.FromOADate(oaDate);
                }
                catch
                {
                    return null;
                }
            }


            if (DateTime.TryParse(raw, out var d))
                return d;

            return null;
        }

        public static int GetInt(
            List<Cell> cells,
            Dictionary<string, int> colMap,
            string colName,
            WorkbookPart wbPart)
        {
            if (!colMap.ContainsKey(colName))
                return 0;

            int idx = colMap[colName];
            if (idx >= cells.Count)
                return 0;

            var text = GetCellValue(wbPart, cells[idx]);
            return int.TryParse(text, out int v) ? v : 0;
        }

        public static string GetCellValue(WorkbookPart wbPart, Cell cell)
        {
            string value = "";
            if (cell != null)
            {
                if (cell.CellValue != null) value = cell.CellValue.InnerText;
                if (cell.DataType?.Value == CellValues.SharedString)
                {
                    var sst = wbPart.SharedStringTablePart?.SharedStringTable;
                    return sst?.ElementAt(int.Parse(value))?.InnerText ?? "";
                }
                if (cell?.ChildElements[0] != null)
                {
                    var chillCell = cell?.ChildElements[0];
                    value = chillCell.InnerText;
                }
            }
            else
            {
                return "";
            }



            if (cell.DataType != null && cell.DataType == CellValues.SharedString)
            {
                return wbPart.SharedStringTablePart
                    .SharedStringTable
                    .Elements<SharedStringItem>()
                    .ElementAt(int.Parse(value))
                    .InnerText;
            }

            return value;
        }

        public static Dictionary<int, string?> BuildColIndexToTextMap(WorkbookPart wbPart, Row row)
        {
            var dict = new Dictionary<int, string?>();
            foreach (var cell in row.Elements<Cell>())
            {
                try
                {
                    var colIndex = GetColumnIndexFromCellReference(cell.CellReference?.Value);
                    if (colIndex < 0) continue;

                    dict[colIndex] = Util.GetCellValue(wbPart, cell); // hàm bạn đã có

                }
                catch
                {

                }
            }
            return dict;
        }

        // A=0, B=1, Z=25, AA=26...
        private static int GetColumnIndexFromCellReference(string? cellRef)
        {
            if (string.IsNullOrWhiteSpace(cellRef)) return -1;

            // lấy phần chữ đầu: "AB12" -> "AB"
            int i = 0;
            while (i < cellRef.Length && char.IsLetter(cellRef[i])) i++;
            if (i == 0) return -1;

            var colLetters = cellRef.Substring(0, i).ToUpperInvariant();

            int index = 0;
            foreach (var ch in colLetters)
            {
                index = index * 26 + (ch - 'A' + 1);
            }
            return index - 1; // 0-based
        }

        private static bool IsNullable(Type t) =>
    !t.IsValueType || Nullable.GetUnderlyingType(t) != null;
        public static void SetPropertyValue(Client dto, PropertyInfo prop, string? raw)
        {
            var s = (raw ?? "").Trim();
            if (string.IsNullOrEmpty(s))
            {
                // null cho nullable, hoặc giữ default string=""
                if (IsNullable(prop.PropertyType) && prop.PropertyType != typeof(string))
                    prop.SetValue(dto, null);
                return;
            }

            var t = Nullable.GetUnderlyingType(prop.PropertyType) ?? prop.PropertyType;

            try
            {
                if (t == typeof(string))
                {
                    prop.SetValue(dto, s);
                    return;
                }

                if (t == typeof(long))
                {
                    if (long.TryParse(s, NumberStyles.Any, CultureInfo.InvariantCulture, out var lv))
                        prop.SetValue(dto, lv);
                    return;
                }

                if (t == typeof(int))
                {
                    if (int.TryParse(s, NumberStyles.Any, CultureInfo.InvariantCulture, out var iv))
                        prop.SetValue(dto, iv);
                    return;
                }

                if (t == typeof(bool))
                {
                    // hỗ trợ Y/N, True/False, 1/0, "Active"
                    var bv =
                        s.Equals("Y", StringComparison.OrdinalIgnoreCase) ||
                        s.Equals("YES", StringComparison.OrdinalIgnoreCase) ||
                        s.Equals("TRUE", StringComparison.OrdinalIgnoreCase) ||
                        s.Equals("1", StringComparison.OrdinalIgnoreCase) ||
                        s.Equals("ACTIVE", StringComparison.OrdinalIgnoreCase);

                    prop.SetValue(dto, bv);
                    return;
                }

                if (t == typeof(DateTime))
                {
                    // hỗ trợ: yyyyMMdd, yyyy-MM-dd, yyyy-MM-dd HH:mm:ss.fff
                    if (TryParseDate(s, out var dt))
                        prop.SetValue(dto, dt);
                    return;
                }

                // fallback convert
                var converted = Convert.ChangeType(s, t, CultureInfo.InvariantCulture);
                prop.SetValue(dto, converted);
            }
            catch
            {
                // tuỳ bạn: log lỗi theo col/row/prop để debug
            }
        }

        public static void SetPropertyProductValue(Product dto, PropertyInfo prop, string? raw)
        {
            var s = (raw ?? "").Trim();
            if (string.IsNullOrEmpty(s))
            {
                // null cho nullable, hoặc giữ default string=""
                if (IsNullable(prop.PropertyType) && prop.PropertyType != typeof(string))
                    prop.SetValue(dto, null);
                return;
            }

            var t = Nullable.GetUnderlyingType(prop.PropertyType) ?? prop.PropertyType;

            try
            {
                if (t == typeof(string))
                {
                    prop.SetValue(dto, s);
                    return;
                }

                if (t == typeof(long))
                {
                    if (long.TryParse(s, NumberStyles.Any, CultureInfo.InvariantCulture, out var lv))
                        prop.SetValue(dto, lv);
                    return;
                }

                if (t == typeof(int))
                {
                    if (int.TryParse(s, NumberStyles.Any, CultureInfo.InvariantCulture, out var iv))
                        prop.SetValue(dto, iv);
                    return;
                }

                if (t == typeof(bool))
                {
                    // hỗ trợ Y/N, True/False, 1/0, "Active"
                    var bv =
                        s.Equals("Y", StringComparison.OrdinalIgnoreCase) ||
                        s.Equals("YES", StringComparison.OrdinalIgnoreCase) ||
                        s.Equals("TRUE", StringComparison.OrdinalIgnoreCase) ||
                        s.Equals("1", StringComparison.OrdinalIgnoreCase) ||
                        s.Equals("ACTIVE", StringComparison.OrdinalIgnoreCase);

                    prop.SetValue(dto, bv);
                    return;
                }

                if (t == typeof(DateTime))
                {
                    // hỗ trợ: yyyyMMdd, yyyy-MM-dd, yyyy-MM-dd HH:mm:ss.fff
                    if (TryParseDate(s, out var dt))
                        prop.SetValue(dto, dt);
                    return;
                }

                // fallback convert
                var converted = Convert.ChangeType(s, t, CultureInfo.InvariantCulture);
                prop.SetValue(dto, converted);
            }
            catch
            {
                // tuỳ bạn: log lỗi theo col/row/prop để debug
            }
        }
        private static bool TryParseDate(string s, out DateTime dt)
        {
            // yyyymmdd
            if (s.Length == 8 && DateTime.TryParseExact(s, "yyyyMMdd", CultureInfo.InvariantCulture,
                    DateTimeStyles.None, out dt))
                return true;

            // yyyy-MM-dd
            if (DateTime.TryParseExact(s, "yyyy-MM-dd", CultureInfo.InvariantCulture,
                    DateTimeStyles.None, out dt))
                return true;

            // full datetime
            if (DateTime.TryParse(s, CultureInfo.InvariantCulture, DateTimeStyles.AllowWhiteSpaces, out dt))
                return true;

            dt = default;
            return false;
        }

        private static string? Get(Dictionary<string, string> dict, string key)
        => dict.TryGetValue(key, out var v) ? v : null;

        private static int ParseInt(string? s, int def)
            => int.TryParse(s, out var x) ? x : def;

        private static string QuoteName(string name)
            => "[" + name.Replace("]", "]]") + "]";
        private static readonly HashSet<string> _reservedKeys = new(StringComparer.OrdinalIgnoreCase)
        {
            "mode","paging","skip","take","pageSize","orderBy","orderDir","key","_", "requireTotalCount", "refField", "refKey"
        };
        public sealed class SqlQueryBuildResult
        {
            public string Sql { get; set; } = "";
            public Dictionary<string, object> Parameters { get; set; } = new();
        }
        public static SqlQueryBuildResult BuildSelectQueryByDynamicField<T>(
    string tableName,
    IDictionary<string, string>? requestParams = null,
    string defaultOrderBy = "Id",
    string defaultOrderDir = "DESC",
    int maxTake = 200,
    int maxAll = 5000,
    string? pkTieBreaker = "Id",
    bool useNoLock = true
)
        {
            tableName ??= typeof(T).Name;

            // =========================
            // 1) Merge params
            // =========================
            var allParams = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

            if (requestParams != null)
            {
                foreach (var kv in requestParams)
                {
                    if (kv.Key == "_") continue;
                    allParams[kv.Key] = kv.Value ?? "";
                }
            }

            // =========================
            // 2) Parse paging
            // =========================
            int skip = ParseInt(Get(allParams, "skip"), 0);
            int take = ParseInt(Get(allParams, "take"), ParseInt(Get(allParams, "pageSize"), 50));

            skip = Math.Max(skip, 0);
            take = Math.Clamp(take, 1, maxTake);

            var mode = Get(allParams, "mode");
            var pagingFlag = Get(allParams, "paging");

            bool paging =
                string.Equals(mode, "page", StringComparison.OrdinalIgnoreCase)
                || pagingFlag == "1"
                || string.Equals(pagingFlag, "true", StringComparison.OrdinalIgnoreCase)
                || allParams.ContainsKey("skip")
                || allParams.ContainsKey("take");

            // =========================
            // 3) Build base SQL
            // =========================
            var sql = new StringBuilder();
            var parameters = new Dictionary<string,Dictionary<string, object>>(StringComparer.OrdinalIgnoreCase);
            Dictionary<string, object> parameterProcess = new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase);
            int pIndex = 0;

            sql.Append("SELECT * FROM ");
            sql.Append(QuoteName(tableName));
            if (useNoLock) sql.Append(" WITH (NOLOCK)");
            sql.AppendLine();
            sql.AppendLine("WHERE Deleted = 0");

            // =========================
            // 4) Apply refField/refKey AND N lần
            // refField + refKey
            // refField2 + refKey2
            // refField3 + refKey3 ...
            // =========================

            // cặp đầu tiên
            if (allParams.TryGetValue("refField", out var refField) &&
                allParams.TryGetValue("refKey", out var refKey))
            {
                var pName = "@p" + (++pIndex);
                Dictionary<string, object> parameter = new Dictionary<string, object>();
                parameter[pName] = NormalizeToDbValue(refKey);
                parameters[refField] = parameter;
                parameterProcess[pName] = NormalizeToDbValue(refKey);
            }

            // các cặp tiếp theo
            for (int i = 2; i <= 50; i++)
            {
                string fieldParam = $"refField{i}";
                string keyParam = $"refKey{i}";

                if (allParams.TryGetValue(fieldParam, out var fieldName) &&
                    allParams.TryGetValue(keyParam, out var fieldValue))
                {
                    var pName = "@p" + (++pIndex);
                    Dictionary<string, object> parameter = new Dictionary<string, object>();
                    parameter[pName] = NormalizeToDbValue(fieldValue);
                    parameters[fieldName] = parameter;
                    parameterProcess[pName] = NormalizeToDbValue(fieldValue);
                }
            }
           
            // =========================
            // 5) DevExtreme filter JSON (nếu cần giữ)
            // =========================
            //var filterJson = Get(allParams, "filter");
            //if (!string.IsNullOrWhiteSpace(filterJson))
            //{
            //    var filterSql = ParseDevExtremeFilter(filterJson!, _reservedKeys, ref pIndex, parameters);
            //    if (!string.IsNullOrWhiteSpace(filterSql))
            //    {
            //        sql.Append(" AND ");
            //        sql.AppendLine(filterSql);
            //    }
            //}

            // =========================
            // 6) Custom query params thường
            // Ví dụ: ?Type=Request&IsRead=false
            // KHÔNG xử lý refField/refKey ở đây nữa
            // =========================
            foreach (KeyValuePair<string,Dictionary<string,object>> kv in parameters)
            {
                var key = kv.Key;
                foreach (var item in kv.Value)
                {
                    var value = item;
                    if (_reservedKeys.Contains(key)) continue;
                    AppendNormalCondition(sql, key, value);
                }
             

            }

            // =========================
            // 7) ORDER BY
            // =========================
            var sortJson = Get(allParams, "sort");
            var orderBySql = BuildOrderByFromSort(sortJson, _reservedKeys);

            if (string.IsNullOrWhiteSpace(orderBySql))
            {
                string orderBy = Get(allParams, "orderBy") ?? defaultOrderBy;
                string orderDir = Get(allParams, "orderDir") ?? defaultOrderDir;

                orderDir = string.Equals(orderDir, "asc", StringComparison.OrdinalIgnoreCase)
                    ? "ASC"
                    : "DESC";

                if (!_reservedKeys.Contains(orderBy))
                    orderBy = defaultOrderBy;

                if (!_reservedKeys.Contains(orderBy))
                    orderBy = pkTieBreaker ?? "Id";

                orderBySql = $"{QuoteName(orderBy)} {orderDir}";
            }

            if (!string.IsNullOrWhiteSpace(pkTieBreaker) && _reservedKeys.Contains(pkTieBreaker))
            {
                var tie = QuoteName(pkTieBreaker);
                if (!orderBySql.Contains(tie, StringComparison.OrdinalIgnoreCase))
                {
                    orderBySql += $", {tie} DESC";
                }
            }

            sql.Append("ORDER BY ");
            sql.AppendLine(orderBySql);

            // =========================
            // 8) Paging
            // =========================
            //if (paging)
            //{
            //    sql.AppendLine("OFFSET @skip ROWS FETCH NEXT @take ROWS ONLY;");
            //    parameters["@skip"] = skip;
            //    parameters["@take"] = take;
            //}
            //else
            //{
            //    sql.AppendLine($"OFFSET 0 ROWS FETCH NEXT {maxAll} ROWS ONLY;");
            //}

            return new SqlQueryBuildResult
            {
                Sql = sql.ToString(),
                Parameters = parameterProcess
            };
        }
        private static void AppendRefCondition(
     StringBuilder sql,
     Dictionary<string, object> parameters,
     string fieldName,
     string fieldValue,
     ref int pIndex)
        {
            if (string.IsNullOrWhiteSpace(fieldName)) return;
            if (string.IsNullOrWhiteSpace(fieldValue)) return;

            // chống inject tên cột
            if (_reservedKeys.Contains(fieldName)) return;

            var pName = "@p" + (++pIndex);

            sql.Append(" AND ");
            sql.Append(QuoteName(fieldName));
            sql.Append(" = ");
            sql.AppendLine(pName);

            parameters[pName] = NormalizeToDbValue(fieldValue);
        }
        public static List<DynamicFieldFilter> ExtractDynamicFilters(Dictionary<string, string> rawParams)
        {
            var result = new List<DynamicFieldFilter>();

            // cặp đầu tiên: refField + refKey
            if (
                rawParams.TryGetValue("refField", out var refField) &&
                rawParams.TryGetValue("refKey", out var refKey) &&
                !string.IsNullOrWhiteSpace(refField)
            )
            {
                result.Add(new DynamicFieldFilter
                {
                    FieldName = refField,
                    FieldValue = NormalizeToDbValue(refKey)
                });
            }

            // các cặp tiếp theo: refField2/refKey2, refField3/refKey3...
            for (int i = 2; i <= 20; i++)
            {
                var fieldKey = $"refField{i}";
                var valueKey = $"refKey{i}";

                if (
                    rawParams.TryGetValue(fieldKey, out var fieldName) &&
                    rawParams.TryGetValue(valueKey, out var fieldValue) &&
                    !string.IsNullOrWhiteSpace(fieldName)
                )
                {
                    result.Add(new DynamicFieldFilter
                    {
                        FieldName = fieldName,
                        FieldValue = NormalizeToDbValue(fieldValue)
                    });
                }
            }

            return result;
        }
        private static void AppendNormalCondition(
    StringBuilder sql,
    string key,
    KeyValuePair<string,object> value)
        {

            sql.Append(" AND ");
            sql.Append(QuoteName(key));

            switch (value.Value)
            {
                case bool:
                case int:
                case long:
                case decimal:
                case double:
                case float:
                case Guid:
                case DateTime:
                    sql.Append(" = ");
                    sql.AppendLine(value.Key);
                    break;

                default:
                    sql.Append(" LIKE '%' + ");
                    sql.Append(value.Key);
                    sql.AppendLine(" + '%'");
                    break;
            }
        }
        public static SqlQueryBuildResult LoadParamsBuildSelectAllQuery<T>(
    string tableName,
    List<KeyValuePair<string, Microsoft.Extensions.Primitives.StringValues>> loadParams,
    string defaultOrderBy = "Id",
    string defaultOrderDir = "DESC",
    int maxTake = 200,
    int maxAll = 5000,
    string? pkTieBreaker = "Id",
    bool useNoLock = true
)
        {
            // =========================
            // 1) merge params (KHÔNG bỏ reserved ở đây)
            // =========================
            var allParams = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

            if (loadParams != null)
            {
                foreach (var kv in loadParams)
                {
                    if (kv.Key == "_") continue;
                    allParams[kv.Key] = kv.Value.ToString() ?? "";
                }
            }

            // =========================
            // 2) parse paging
            // DevExtreme sẽ gửi skip/take trực tiếp
            // =========================
            int skip = ParseInt(Get(allParams, "skip"), 0);
            int take = ParseInt(Get(allParams, "take"), ParseInt(Get(allParams, "pageSize"), 50));

            skip = Math.Max(skip, 0);
            take = Math.Clamp(take, 1, maxTake);

            // Nếu bạn vẫn muốn tự bật/tắt paging theo flag:
            var mode = Get(allParams, "mode");
            var pagingFlag = Get(allParams, "paging");
            bool paging =
                string.Equals(mode, "page", StringComparison.OrdinalIgnoreCase)
                || pagingFlag == "1"
                || string.Equals(pagingFlag, "true", StringComparison.OrdinalIgnoreCase)
                // ✅ nếu DevExtreme có skip/take thì coi như paging
                || allParams.ContainsKey("skip")
                || allParams.ContainsKey("take");

            // =========================
            // 3) build base SQL
            // =========================
            var sql = new StringBuilder();
            sql.Append("SELECT * FROM ");
            sql.Append(QuoteName(tableName));
            if (useNoLock) sql.Append(" WITH (NOLOCK)");
            sql.AppendLine();
            sql.AppendLine("WHERE Deleted = 0");

            var parameters = new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase);
            int pIndex = 0;

            // =========================
            // 4) apply DevExtreme FILTER (filter= JSON)
            // =========================
            var filterJson = Get(allParams, "filter");
            if (!string.IsNullOrWhiteSpace(filterJson))
            {
                var filterSql = ParseDevExtremeFilter(filterJson!, _reservedKeys, ref pIndex, parameters);
                if (!string.IsNullOrWhiteSpace(filterSql))
                {
                    sql.Append(" AND ");
                    sql.AppendLine(filterSql);
                }
            }

            // =========================
            // 5) apply simple filters (query params ngoài filter/sort/skip/take)
            // Ví dụ receivedBy=quan.nh
            // =========================
            foreach (var kv in allParams)
            {
                var key = kv.Key;
                var value = kv.Value;

                if (_reservedKeys.Contains(key)) continue;      // ✅ chỉ bỏ ở đây
                if (string.IsNullOrWhiteSpace(value)) continue;
                if (!_reservedKeys.Contains(key)) continue;    // ✅ chống inject column

                var pName = "@p" + (++pIndex);

                sql.Append(" AND ");
                sql.Append(QuoteName(key));
                sql.Append(" LIKE '%' + ");
                sql.Append(pName);
                sql.AppendLine(" + '%'");

                parameters[pName] = value;
            }

            // =========================
            // 6) ORDER BY (DevExtreme sort= JSON)
            // =========================
            var sortJson = Get(allParams, "sort");
            var orderBySql = BuildOrderByFromSort(sortJson, _reservedKeys);

            if (string.IsNullOrWhiteSpace(orderBySql))
            {
                // fallback từ orderBy/orderDir (nếu bạn tự truyền)
                string orderBy = Get(allParams, "orderBy") ?? defaultOrderBy;
                string orderDir = (Get(allParams, "orderDir") ?? defaultOrderDir);
                orderDir = string.Equals(orderDir, "asc", StringComparison.OrdinalIgnoreCase) ? "ASC" : "DESC";

                if (!_reservedKeys.Contains(orderBy)) orderBy = defaultOrderBy;
                if (!_reservedKeys.Contains(orderBy)) orderBy = pkTieBreaker ?? "Id";

                orderBySql = $"{QuoteName(orderBy)} {orderDir}";
            }

            // tie-breaker để paging ổn định khi trùng sort key
            if (!string.IsNullOrWhiteSpace(pkTieBreaker) && _reservedKeys.Contains(pkTieBreaker))
            {
                var tie = QuoteName(pkTieBreaker);
                if (!orderBySql.Contains(tie, StringComparison.OrdinalIgnoreCase))
                    orderBySql += $", {tie} DESC";
            }

            sql.Append("ORDER BY ");
            sql.AppendLine(orderBySql);

            // =========================
            // 7) paging / all
            // =========================
            if (paging)
            {
                sql.AppendLine("OFFSET @skip ROWS FETCH NEXT @take ROWS ONLY;");
                parameters["@skip"] = skip;
                parameters["@take"] = take;
            }
            else
            {
                sql.AppendLine($"OFFSET 0 ROWS FETCH NEXT {maxAll} ROWS ONLY;");
            }

            return new SqlQueryBuildResult
            {
                Sql = sql.ToString(),
                Parameters = parameters
            };
        }

        /* ---------------- helpers ---------------- */

        private static string BuildOrderByFromSort(string? sortJson, HashSet<string> _reservedKeys)
        {
            if (string.IsNullOrWhiteSpace(sortJson)) return "";

            try
            {
                using var doc = JsonDocument.Parse(sortJson);
                if (doc.RootElement.ValueKind != JsonValueKind.Array) return "";

                var parts = new List<string>();
                foreach (var item in doc.RootElement.EnumerateArray())
                {
                    if (item.ValueKind != JsonValueKind.Object) continue;

                    var selector = item.TryGetProperty("selector", out var selEl) ? selEl.GetString() : null;
                    if (string.IsNullOrWhiteSpace(selector)) continue;

                    var field = selector!;
                    if (!_reservedKeys.Contains(field)) continue;

                    bool desc = item.TryGetProperty("desc", out var dEl) && dEl.ValueKind == JsonValueKind.True;
                    parts.Add($"{QuoteName(field)} {(desc ? "DESC" : "ASC")}");
                }

                return string.Join(", ", parts);
            }
            catch
            {
                return "";
            }
        }

        // DevExtreme filter JSON (nested arrays)
        private static string ParseDevExtremeFilter(
            string filterJson,
            HashSet<string> _reservedKeys,
            ref int pIndex,
            Dictionary<string, object> parameters
        )
        {
            try
            {
                using var doc = JsonDocument.Parse(filterJson);
                return ParseFilterNode(doc.RootElement, _reservedKeys, ref pIndex, parameters);
            }
            catch
            {
                return "";
            }
        }

        private static string ParseFilterNode(
            JsonElement node,
            HashSet<string> _reservedKeys,
            ref int pIndex,
            Dictionary<string, object> parameters
        )
        {
            if (node.ValueKind != JsonValueKind.Array) return "";

            // condition: ["Field","op",value]
            if (node.GetArrayLength() == 3
                && node[0].ValueKind == JsonValueKind.String
                && node[1].ValueKind == JsonValueKind.String)
            {
                var field = node[0].GetString()!;
                var op = node[1].GetString()!;
                var value = node[2];

                if (_reservedKeys.Contains(field)) return "";
                return BuildCondition(field, op, value, ref pIndex, parameters);
            }

            // composite: [expr, "and"/"or", expr, ...]
            var parts = new List<string>();
            string? pendingLogic = null;

            for (int i = 0; i < node.GetArrayLength(); i++)
            {
                var item = node[i];

                if (item.ValueKind == JsonValueKind.String)
                {
                    var token = item.GetString()!;
                    if (string.Equals(token, "and", StringComparison.OrdinalIgnoreCase) ||
                        string.Equals(token, "or", StringComparison.OrdinalIgnoreCase))
                    {
                        pendingLogic = token.ToUpperInvariant();
                        continue;
                    }

                    if (token == "!")
                    {
                        if (i + 1 < node.GetArrayLength())
                        {
                            var next = ParseFilterNode(node[i + 1], _reservedKeys, ref pIndex, parameters);
                            if (!string.IsNullOrWhiteSpace(next)) parts.Add($"NOT ({next})");
                            i++;
                        }
                        continue;
                    }

                    continue;
                }

                var expr = ParseFilterNode(item, _reservedKeys, ref pIndex, parameters);
                if (string.IsNullOrWhiteSpace(expr)) continue;

                if (parts.Count == 0) parts.Add($"({expr})");
                else parts.Add($"{(pendingLogic ?? "AND")} ({expr})");

                pendingLogic = null;
            }

            return parts.Count == 0 ? "" : string.Join(" ", parts);
        }

        private static string BuildCondition(
            string field,
            string op,
            JsonElement valueEl,
            ref int pIndex,
            Dictionary<string, object> parameters
        )
        {
            op = op.ToLowerInvariant();

            bool isNull = valueEl.ValueKind == JsonValueKind.Null;
            if (isNull)
            {
                return op switch
                {
                    "=" => $"{QuoteName(field)} IS NULL",
                    "<>" => $"{QuoteName(field)} IS NOT NULL",
                    _ => $"{QuoteName(field)} IS NULL"
                };
            }

            object? val = valueEl.ValueKind switch
            {
                JsonValueKind.String => valueEl.GetString(),
                JsonValueKind.Number => valueEl.TryGetInt64(out var l) ? l : valueEl.GetDouble(),
                JsonValueKind.True => true,
                JsonValueKind.False => false,
                _ => valueEl.ToString()
            };

            var pName = "@p" + (++pIndex);

            switch (op)
            {
                case "=":
                case "<>":
                case ">":
                case "<":
                case ">=":
                case "<=":
                    parameters[pName] = val!;
                    return $"{QuoteName(field)} {op} {pName}";

                case "contains":
                    parameters[pName] = val?.ToString() ?? "";
                    return $"{QuoteName(field)} LIKE '%' + {pName} + '%'";

                case "notcontains":
                    parameters[pName] = val?.ToString() ?? "";
                    return $"{QuoteName(field)} NOT LIKE '%' + {pName} + '%'";

                case "startswith":
                    parameters[pName] = val?.ToString() ?? "";
                    return $"{QuoteName(field)} LIKE {pName} + '%'";

                case "endswith":
                    parameters[pName] = val?.ToString() ?? "";
                    return $"{QuoteName(field)} LIKE '%' + {pName}";

                default:
                    parameters[pName] = val!;
                    return $"{QuoteName(field)} = {pName}";
            }
        }

        public static string ParseConnectionString(string connectionString)
        {
            var builderStr = new SqlConnectionStringBuilder(connectionString);

            bool isUseEncryption = bool.Parse(ConfigurationManager.AppSettings["encryption"]);


            if (isUseEncryption)
            {
                string scheme = ConfigurationManager.AppSettings["scheme"];
                string encryptString = Environment.GetEnvironmentVariable($"{scheme}_PWD", EnvironmentVariableTarget.Machine);
                var passwordDecrypt = KeyVaultLocal.DecryptConnectionStringPassword(encryptString, "ApplicationSecretKey", "ApplicationSaltKey", 10);
                //string password = KeyVaultLocal.DecryptConnectionStringPassword(builderStr.Password, "ApplicationSecretKey", "ApplicationSaltKey", 10);
                builderStr.Password = passwordDecrypt;
            }
            //try
            //{
            //    string writeString = Environment.GetEnvironmentVariable("RETool_PWD", EnvironmentVariableTarget.Machine);
            //    File.WriteAllText("application_key.txt", writeString);
            //}
            //catch (Exception ex)
            //{
            //    File.WriteAllText("error.txt", "Error");
            //}


            return builderStr.ConnectionString;
        }
        public static SqlQueryBuildResult LoadParamsBuildCustomQuery<T>(
string baseQuery,
List<KeyValuePair<string, Microsoft.Extensions.Primitives.StringValues>> loadParams,
string defaultOrderBy = "Id",
string defaultOrderDir = "DESC",
int maxTake = 200,
int maxAll = 5000,
string? pkTieBreaker = "Id",
HashSet<string>? allowedColumns = null,
string? mainTableAlias = null
)
        {
            if (string.IsNullOrWhiteSpace(baseQuery))
                throw new ArgumentException("baseQuery is required.");

            var reservedKeys = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    {
        "_",
        "filter",
        "sort",
        "skip",
        "take",
        "page",
        "pageSize",
        "mode",
        "paging",
        "orderBy",
        "orderDir",
        "requireTotalCount",
        "requireGroupCount",
        "group",
        "groupSummary",
        "totalSummary",
        "searchExpr",
        "searchOperation",
        "searchValue",
        "select"
    };

            var safeColumns = allowedColumns ?? new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    {
        pkTieBreaker
    };

            string QuoteName(string name)
            {
                if (string.IsNullOrWhiteSpace(name)) return name;
                return "[" + name.Replace("]", "]]") + "]";
            }

            string BuildColumnSql(string columnName)
            {
                var q = QuoteName(columnName);
                return string.IsNullOrWhiteSpace(mainTableAlias) ? q : $"{mainTableAlias}.{q}";
            }

            int ParseInt(string? value, int defaultValue)
            {
                return int.TryParse(value, out var x) ? x : defaultValue;
            }

            string? Get(Dictionary<string, string> dict, string key)
            {
                return dict.TryGetValue(key, out var value) ? value : null;
            }
            var allParams = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

            if (loadParams != null)
            {
                var dict = loadParams.ToDictionary(x => x.Key, x => x.Value.ToString(), StringComparer.OrdinalIgnoreCase);

                bool hasRefPair = dict.Keys.Any(k => k.StartsWith("filterRefField", StringComparison.OrdinalIgnoreCase));

                // =========================
                // 1. build refField/refId
                // =========================
                var refIndexes = new List<string>();

                foreach (var key in dict.Keys)
                {
                    if (key.StartsWith("filterRefField", StringComparison.OrdinalIgnoreCase))
                    {
                        var suffix = key.Substring("filterRefField".Length); // "", "2", "3"
                        refIndexes.Add(suffix);
                    }
                }

                refIndexes = refIndexes
                    .Distinct()
                    .OrderBy(x => string.IsNullOrEmpty(x) ? 0 : int.TryParse(x, out var n) ? n : int.MaxValue)
                    .ToList();

                foreach (var suffix in refIndexes)
                {
                    var fieldKey = "filterRefField" + suffix;
                    var valueKey = "filterRefId" + suffix;

                    if (!dict.TryGetValue(fieldKey, out var field)) continue;
                    if (!dict.TryGetValue(valueKey, out var value)) continue;

                    if (string.IsNullOrWhiteSpace(field) || string.IsNullOrWhiteSpace(value))
                        continue;

                    allParams[field] = value;
                }

                // =========================
                // 2. add params thường
                // =========================
                foreach (var kv in dict)
                {
                    var key = kv.Key;

                    if (key.StartsWith("filterRefField", StringComparison.OrdinalIgnoreCase) ||
                        key.StartsWith("filterRefId", StringComparison.OrdinalIgnoreCase))
                        continue;

                    // nếu có refField thì bỏ key
                    if (hasRefPair && string.Equals(key, "key", StringComparison.OrdinalIgnoreCase))
                    { allParams["key"] = kv.Value;  continue; }

                    allParams[key] = kv.Value;
                }
            }

            int skip = ParseInt(Get(allParams, "skip"), 0);
            int take = ParseInt(Get(allParams, "take"), ParseInt(Get(allParams, "pageSize"), 50));

            skip = Math.Max(skip, 0);
            take = Math.Clamp(take, 1, maxTake);

            var mode = Get(allParams, "mode");
            var pagingFlag = Get(allParams, "paging");

            bool paging =
                string.Equals(mode, "page", StringComparison.OrdinalIgnoreCase)
                || pagingFlag == "1"
                || string.Equals(pagingFlag, "true", StringComparison.OrdinalIgnoreCase)
                || allParams.ContainsKey("skip")
                || allParams.ContainsKey("take");

            var parameters = new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase);
            int pIndex = 0;

            string originalSql = baseQuery.Trim().TrimEnd(';');

            string cleanedSql = originalSql;

            cleanedSql = System.Text.RegularExpressions.Regex.Replace(
                cleanedSql,
                @"'([^']|'')*'",
                "''",
                System.Text.RegularExpressions.RegexOptions.Singleline
            );

            cleanedSql = System.Text.RegularExpressions.Regex.Replace(
                cleanedSql,
                @"--.*?$",
                "",
                System.Text.RegularExpressions.RegexOptions.Multiline
            );

            cleanedSql = System.Text.RegularExpressions.Regex.Replace(
                cleanedSql,
                @"/\*.*?\*/",
                "",
                System.Text.RegularExpressions.RegexOptions.Singleline
            );

            int level = 0;
            int lastOrderByIndex = -1;
            int lastOffsetIndex = -1;

            string upperSql = cleanedSql.ToUpperInvariant();

            for (int i = 0; i < upperSql.Length; i++)
            {
                char c = upperSql[i];
                if (c == '(') level++;
                else if (c == ')') level--;

                if (level == 0)
                {
                    if (i + 8 <= upperSql.Length && upperSql.Substring(i, 8) == "ORDER BY")
                    {
                        bool startOk = i == 0 || !char.IsLetterOrDigit(upperSql[i - 1]);
                        bool endOk = (i + 8) >= upperSql.Length || !char.IsLetterOrDigit(upperSql[i + 8]);
                        if (startOk && endOk) lastOrderByIndex = i;
                    }

                    if (i + 6 <= upperSql.Length && upperSql.Substring(i, 6) == "OFFSET")
                    {
                        bool startOk = i == 0 || !char.IsLetterOrDigit(upperSql[i - 1]);
                        bool endOk = (i + 6) >= upperSql.Length || !char.IsLetterOrDigit(upperSql[i + 6]);
                        if (startOk && endOk) lastOffsetIndex = i;
                    }
                }
            }

            string sqlHead = originalSql;
            string existingOrderBy = "";
            string existingOffsetFetch = "";

            if (lastOrderByIndex >= 0)
            {
                if (lastOffsetIndex > lastOrderByIndex)
                {
                    sqlHead = originalSql.Substring(0, lastOrderByIndex).TrimEnd();
                    existingOrderBy = originalSql.Substring(lastOrderByIndex, lastOffsetIndex - lastOrderByIndex).Trim();
                    existingOffsetFetch = originalSql.Substring(lastOffsetIndex).Trim();
                }
                else
                {
                    sqlHead = originalSql.Substring(0, lastOrderByIndex).TrimEnd();
                    existingOrderBy = originalSql.Substring(lastOrderByIndex).Trim();
                }

                existingOrderBy = System.Text.RegularExpressions.Regex.Replace(
                    existingOrderBy,
                    @"^\s*ORDER\s+BY\s+",
                    "",
                    System.Text.RegularExpressions.RegexOptions.IgnoreCase
                ).Trim();
            }
            else if (lastOffsetIndex >= 0)
            {
                sqlHead = originalSql.Substring(0, lastOffsetIndex).TrimEnd();
                existingOffsetFetch = originalSql.Substring(lastOffsetIndex).Trim();
            }

            string cleanedHead = sqlHead;
            cleanedHead = System.Text.RegularExpressions.Regex.Replace(cleanedHead, @"'([^']|'')*'", "''", System.Text.RegularExpressions.RegexOptions.Singleline);
            cleanedHead = System.Text.RegularExpressions.Regex.Replace(cleanedHead, @"--.*?$", "", System.Text.RegularExpressions.RegexOptions.Multiline);
            cleanedHead = System.Text.RegularExpressions.Regex.Replace(cleanedHead, @"/\*.*?\*/", "", System.Text.RegularExpressions.RegexOptions.Singleline);

            bool hasWhere = System.Text.RegularExpressions.Regex.IsMatch(
                cleanedHead,
                @"\bWHERE\b",
                System.Text.RegularExpressions.RegexOptions.IgnoreCase
            );

            var sql = new System.Text.StringBuilder();
            sql.AppendLine(sqlHead);

            if (!hasWhere)
            {
                sql.AppendLine(" WHERE 1 = 1 ");
            }

            // DevExtreme filter
            var filterJson = Get(allParams, "filter");
            if (!string.IsNullOrWhiteSpace(filterJson))
            {
                try
                {
                    using var doc = System.Text.Json.JsonDocument.Parse(filterJson);
                    string ParseFilter(System.Text.Json.JsonElement el)
                    {
                        if (el.ValueKind != System.Text.Json.JsonValueKind.Array)
                            return "";

                        var arr = el.EnumerateArray().ToList();
                        if (arr.Count == 0) return "";

                        // unary not
                        if (arr.Count == 2 && arr[0].ValueKind == System.Text.Json.JsonValueKind.String &&
                            string.Equals(arr[0].GetString(), "!", StringComparison.OrdinalIgnoreCase))
                        {
                            var inner = ParseFilter(arr[1]);
                            return string.IsNullOrWhiteSpace(inner) ? "" : $"NOT ({inner})";
                        }

                        // simple condition: [field, op, value]
                        if (arr.Count == 3 &&
                            arr[0].ValueKind == System.Text.Json.JsonValueKind.String &&
                            arr[1].ValueKind == System.Text.Json.JsonValueKind.String)
                        {
                            string field = arr[0].GetString() ?? "";
                            string op = arr[1].GetString() ?? "";
                            string actualField = string.Equals(field, "key", StringComparison.OrdinalIgnoreCase) ? pkTieBreaker : field;

                            if (!safeColumns.Contains(actualField))
                                return "";

                            string colSql = BuildColumnSql(actualField);
                            string pName = "@p" + (++pIndex);

                            object? val = null;
                            var valEl = arr[2];
                            switch (valEl.ValueKind)
                            {
                                case System.Text.Json.JsonValueKind.String:
                                    val = valEl.GetString();
                                    break;
                                case System.Text.Json.JsonValueKind.Number:
                                    if (valEl.TryGetInt64(out var l)) val = l;
                                    else if (valEl.TryGetDecimal(out var d)) val = d;
                                    else val = valEl.ToString();
                                    break;
                                case System.Text.Json.JsonValueKind.True:
                                case System.Text.Json.JsonValueKind.False:
                                    val = valEl.GetBoolean();
                                    break;
                                case System.Text.Json.JsonValueKind.Null:
                                    val = null;
                                    break;
                                default:
                                    val = valEl.ToString();
                                    break;
                            }

                            switch (op.ToLowerInvariant())
                            {
                                case "=":
                                    if (val == null) return $"{colSql} IS NULL";
                                    parameters[pName] = val;
                                    return $"{colSql} = {pName}";

                                case "<>":
                                    if (val == null) return $"{colSql} IS NOT NULL";
                                    parameters[pName] = val;
                                    return $"{colSql} <> {pName}";

                                case ">":
                                case ">=":
                                case "<":
                                case "<=":
                                    parameters[pName] = val ?? DBNull.Value;
                                    return $"{colSql} {op} {pName}";

                                case "contains":
                                    parameters[pName] = val == null ? "" : val.ToString()!;
                                    return $"{colSql} LIKE '%' + {pName} + '%'";

                                case "notcontains":
                                    parameters[pName] = val == null ? "" : val.ToString()!;
                                    return $"{colSql} NOT LIKE '%' + {pName} + '%'";

                                case "startswith":
                                    parameters[pName] = val == null ? "" : val.ToString()!;
                                    return $"{colSql} LIKE {pName} + '%'";

                                case "endswith":
                                    parameters[pName] = val == null ? "" : val.ToString()!;
                                    return $"{colSql} LIKE '%' + {pName}";

                                default:
                                    return "";
                            }
                        }

                        // complex group: [cond1, "and", cond2, "or", cond3...]
                        var parts = new List<string>();
                        for (int i = 0; i < arr.Count; i++)
                        {
                            var item = arr[i];

                            if (item.ValueKind == System.Text.Json.JsonValueKind.String)
                            {
                                string token = item.GetString() ?? "";
                                if (string.Equals(token, "and", StringComparison.OrdinalIgnoreCase) ||
                                    string.Equals(token, "or", StringComparison.OrdinalIgnoreCase))
                                {
                                    parts.Add(token.ToUpperInvariant());
                                }
                            }
                            else if (item.ValueKind == System.Text.Json.JsonValueKind.Array)
                            {
                                string inner = ParseFilter(item);
                                if (!string.IsNullOrWhiteSpace(inner))
                                    parts.Add("(" + inner + ")");
                            }
                        }

                        return string.Join(" ", parts);
                    }

                    var filterSql = ParseFilter(doc.RootElement);
                    if (!string.IsNullOrWhiteSpace(filterSql))
                    {
                        sql.Append(" AND ");
                        sql.AppendLine(filterSql);
                    }
                }
                catch
                {
                    // bỏ qua filter lỗi json
                }
            }

            foreach (var kv in allParams)
            {
                var key = kv.Key;
                var value = kv.Value;

                if (reservedKeys.Contains(key)) continue;
                if (string.IsNullOrWhiteSpace(value)) continue;

                var actualColumn = string.Equals(key, "key", StringComparison.OrdinalIgnoreCase)
                    ? pkTieBreaker
                    : key;

                if (!safeColumns.Contains(actualColumn)) continue;

                var pName = "@p" + (++pIndex);

                sql.Append(" AND ");
                sql.Append(BuildColumnSql(actualColumn));
                sql.Append(" = ");
                sql.Append(pName);
                sql.AppendLine();

                parameters[pName] = value;
            }


            // ORDER BY
            string? orderBySql = null;

            var sortJson = Get(allParams, "sort");
            if (!string.IsNullOrWhiteSpace(sortJson))
            {
                try
                {
                    using var sortDoc = System.Text.Json.JsonDocument.Parse(sortJson);
                    if (sortDoc.RootElement.ValueKind == System.Text.Json.JsonValueKind.Array)
                    {
                        var orderParts = new List<string>();

                        foreach (var item in sortDoc.RootElement.EnumerateArray())
                        {
                            if (item.ValueKind != System.Text.Json.JsonValueKind.Object) continue;

                            if (!item.TryGetProperty("selector", out var selectorEl)) continue;
                            string selector = selectorEl.GetString() ?? "";
                            string actualColumn = string.Equals(selector, "key", StringComparison.OrdinalIgnoreCase)
                                ? pkTieBreaker
                                : selector;

                            if (!safeColumns.Contains(actualColumn)) continue;

                            bool desc = false;
                            if (item.TryGetProperty("desc", out var descEl) &&
                                (descEl.ValueKind == System.Text.Json.JsonValueKind.True || descEl.ValueKind == System.Text.Json.JsonValueKind.False))
                            {
                                desc = descEl.GetBoolean();
                            }

                            orderParts.Add($"{BuildColumnSql(actualColumn)} {(desc ? "DESC" : "ASC")}");
                        }

                        if (orderParts.Count > 0)
                            orderBySql = string.Join(", ", orderParts);
                    }
                }
                catch
                {
                }
            }

            if (string.IsNullOrWhiteSpace(orderBySql))
            {
                string? requestedOrderBy = Get(allParams, "orderBy");
                string? requestedOrderDir = Get(allParams, "orderDir");

                if (!string.IsNullOrWhiteSpace(requestedOrderBy))
                {
                    string actualColumn = string.Equals(requestedOrderBy, "key", StringComparison.OrdinalIgnoreCase)
                        ? pkTieBreaker
                        : requestedOrderBy!;

                    if (safeColumns.Contains(actualColumn))
                    {
                        string orderDir = string.Equals(requestedOrderDir, "asc", StringComparison.OrdinalIgnoreCase)
                            ? " ASC"
                            : " DESC";

                        orderBySql = $"{BuildColumnSql(actualColumn)} {orderDir}";
                    }
                }
            }

            if (string.IsNullOrWhiteSpace(orderBySql))
            {
                if (!string.IsNullOrWhiteSpace(existingOrderBy))
                {
                    orderBySql = existingOrderBy;
                }
                else
                {
                    string actualDefaultOrderBy = string.Equals(defaultOrderBy, "key", StringComparison.OrdinalIgnoreCase)
                        ? defaultOrderBy
                        : defaultOrderBy;

                    string orderDir = string.Equals(defaultOrderDir, "asc", StringComparison.OrdinalIgnoreCase)
                        ? "ASC"
                        : "DESC";

                    if (!safeColumns.Contains(actualDefaultOrderBy))
                        actualDefaultOrderBy = !string.IsNullOrWhiteSpace(pkTieBreaker) ? pkTieBreaker! : defaultOrderBy;

                    if (!safeColumns.Contains(actualDefaultOrderBy))
                        actualDefaultOrderBy = defaultOrderBy;

                    orderBySql = $"{BuildColumnSql(actualDefaultOrderBy)} {orderDir}";
                }
            }

            if (!string.IsNullOrWhiteSpace(pkTieBreaker) && safeColumns.Contains(pkTieBreaker))
            {
                string tie = BuildColumnSql(pkTieBreaker);
                if (!orderBySql.Contains(tie, StringComparison.OrdinalIgnoreCase))
                {
                    orderBySql += $", {tie} DESC";
                }
            }

            sql.Append(" ORDER BY ");
            sql.AppendLine(orderBySql);

            if (paging)
            {
                sql.AppendLine(" OFFSET @skip ROWS FETCH NEXT @take ROWS ONLY;");
                parameters["@skip"] = skip;
                parameters["@take"] = take;
            }
            else
            {
                sql.AppendLine($" OFFSET 0 ROWS FETCH NEXT {maxAll} ROWS ONLY;");
            }

            return new SqlQueryBuildResult
            {
                Sql = sql.ToString(),
                Parameters = parameters
            };
        }
        public static List<KeyValuePair<string, Microsoft.Extensions.Primitives.StringValues>>
NormalizeRefParams(
    List<KeyValuePair<string, Microsoft.Extensions.Primitives.StringValues>> requestParams,
    string? pkTieBreaker = "Id")
        {
            var result = new List<KeyValuePair<string, Microsoft.Extensions.Primitives.StringValues>>();
            if (requestParams == null || requestParams.Count == 0) return result;

            var dict = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

            foreach (var kv in requestParams)
            {
                dict[kv.Key] = kv.Value.ToString();
            }

            // Giữ lại các param thường như skip/take/filter/sort...
            foreach (var kv in requestParams)
            {
                var key = kv.Key ?? "";
                if (!key.StartsWith("refField", StringComparison.OrdinalIgnoreCase) &&
                    !key.StartsWith("refKey", StringComparison.OrdinalIgnoreCase))
                {
                    result.Add(new KeyValuePair<string, Microsoft.Extensions.Primitives.StringValues>(
                        kv.Key,
                        kv.Value
                    ));
                }
            }

            // Cặp đầu tiên: refField + refKey
            // Cặp sau: refField2/refKey2, refField3/refKey3...
            var indexes = new List<string> { "" };

            foreach (var key in dict.Keys)
            {
                if (key.StartsWith("refField", StringComparison.OrdinalIgnoreCase))
                {
                    var suffix = key.Substring("refField".Length); // "", "2", "3"...
                    if (!indexes.Contains(suffix, StringComparer.OrdinalIgnoreCase))
                        indexes.Add(suffix);
                }
            }

            // sort: "" trước, rồi 2,3,4...
            indexes = indexes
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .OrderBy(x => string.IsNullOrEmpty(x) ? 0 : int.TryParse(x, out var n) ? n : int.MaxValue)
                .ToList();

            foreach (var suffix in indexes)
            {
                var refFieldKey = "refField" + suffix;
                var refValueKey = "refKey" + suffix;

                if (!dict.TryGetValue(refFieldKey, out var field)) continue;
                if (!dict.TryGetValue(refValueKey, out var value)) continue;

                field = field?.Trim();
                value = value?.Trim();

                if (string.IsNullOrWhiteSpace(field) || string.IsNullOrWhiteSpace(value))
                    continue;

                // optional: nếu muốn refField=key thì map qua pkTieBreaker
                if (string.Equals(field, "key", StringComparison.OrdinalIgnoreCase) &&
                    !string.IsNullOrWhiteSpace(pkTieBreaker))
                {
                    field = pkTieBreaker;
                }

                result.Add(new KeyValuePair<string, Microsoft.Extensions.Primitives.StringValues>(
                    field,
                    value
                ));
            }

            return result;
        }
    }
    public enum CommandQueryType
    {
        Insert,
        Update,
        Delete
    }
}
