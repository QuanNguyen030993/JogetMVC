using Microsoft.AspNetCore.Mvc;
using ERPCore.Controllers.Base;
using ERPCore.Models.Migration.Business.Data;
using ERPCore.Common;
using Serilog;
using Microsoft.Data.SqlClient;
using System.Data;
using System.Net.Http.Headers;
using ERPCore.Models.Models.Parsing;
using Microsoft.AspNetCore.Authorization;
using System.Text;

using Newtonsoft.Json;
using static ERPCore.Models.Models.Parsing.JsonHandle;
using ERPCore.Models.Migration.Config;
using ERPCore.Models.Request;
using Syncfusion.XlsIO.Implementation.XmlSerialization;
using Syncfusion.XlsIO.Implementation;
using System.Xml;
using ERPCore.ControllerUtil;

[ApiController]
[Route("api/[controller]/[action]")]
public class DocumentController : BaseControllerApi<Document>
{
    private readonly IBaseRepository<Document> _BaseRepository;
    private readonly IBaseRepository<Constant> _constantRepository;
    private readonly IConfiguration configuration;
    private readonly IConfigurationSection path;
    private static string Query;
    public DocumentController(IBaseRepository<Document> BaseRepository
        , IConfiguration config
        , IHttpContextAccessor httpContextAccessor) : base(BaseRepository, httpContextAccessor)
    {
        configuration = config;
        _BaseRepository = BaseRepository;
        path = _BaseRepository._baseConfiguration.GetSection("BlobStorage:Path");
        _constantRepository = new BaseRepository<Constant>(configuration, _httpContextAccessor);
        //_httpClientFactory = httpClientFactory;
    }



    public async Task<IActionResult> StreamDocument(long id)
    {
        string typeError = "InternalError";
        try
        {
            Document Document = await _BaseRepository.GetObjectByIdAsync(id);
            if (Document == null)
            {
                return NotFound($"Document id={id} not found.");
            }
            if (IsRemoteDocumentUrl(Document.SubDirectory))
            {
                return Redirect(Document.SubDirectory);
            }

            string fullPath = System.IO.Path.Combine(path.Value, Document.SubDirectory, Document.Guid.ToString()+ Document.FileType);
            var mimeTypes = Util.GetMimeType(Document.FileName);
            if (System.IO.File.Exists(fullPath))
            {
                var fileStream = System.IO.File.OpenRead(fullPath);
                return File(fileStream, mimeTypes, Path.GetFileName(Document.FileName));
            }
            else
            {
                typeError = "FileNotFound";
                throw new Exception($"{fullPath} not found.");
            }
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
    [AllowAnonymous]
    //public async Task<IActionResult> TestCallBackUrl([FromBody] DigisignCallbackResult convertResult)
    public async Task<IActionResult> CallbackFileHandle([FromBody] DigisignCallbackResult convertResult)
    {
        try
        {
            if (!Directory.Exists(path.Value + "\\CallBack"))
            {
                Directory.CreateDirectory(path.Value + "\\CallBack");
            }
            System.IO.File.WriteAllBytes(path.Value + "\\CallBack\\" + convertResult.FileName, Convert.FromBase64String(convertResult.FileBase64));
            return Ok();

        }
        catch (Exception ex)
        {
            Log.Error(ex, ex.Message);
            return StatusCode(500, ex.Message);
        }
    }

    [HttpPost]
    [AllowAnonymous]
    //public async Task<IActionResult> TestCallBackUrl([FromBody] DigisignCallbackResult convertResult)
    public async Task<IActionResult> CallBackFileDigisign([FromBody] DigisignCallbackResult convertResult)
    {
        try
        {
            Document document = new Document();
            document = JsonConvert.DeserializeObject<Document>(JsonConvert.SerializeObject(convertResult.Metadata));
            //Determine instance record
 

            if (document != null)
            {
                document = await _BaseRepository.GetSingleObject(s => s.Id == document.Id);
                Document newDocument = new Document();
                JsonConvert.PopulateObject(JsonConvert.SerializeObject(document),newDocument);
                newDocument.Id = 0;

                //dynamic object 
                Quotation quotation = new Quotation();
                IBaseRepository<Quotation> _quotationRepository = new BaseRepository<Quotation>(configuration,_httpContextAccessor);
                IBaseRepository<EnumData> _enumDataRepository = new BaseRepository<EnumData>(configuration,_httpContextAccessor);
                quotation = await _quotationRepository.GetSingleObject(s => s.Guid == newDocument.RecordGuid);
                List<EnumData> enumDatas = await _enumDataRepository.EnumData("OverallStatus");
                EnumData completeSigning = enumDatas.FirstOrDefault(f => f.Code == "DGSC");
                string approveDept = "LMKT";
                PICAttributes pICAttributes = new PICAttributes();
                pICAttributes = JsonConvert.DeserializeObject<PICAttributes>(quotation.PIC);
                string accountApproveName = Util.PICPicker(pICAttributes, approveDept);
                //    switch
                //{
                //    "FO" => pICAttributes.FO,
                //    "TS" => pICAttributes.TS,
                //    "UW" => pICAttributes.UW,
                //    "LMKT" => pICAttributes.LMKT,
                //    "PM" => pICAttributes.PM,
                //    _ => string.Join(",",
                //                    new[]
                //                    {
                //                       pICAttributes.FO,
                //                       pICAttributes.TS,
                //                       pICAttributes.UW,
                //                       pICAttributes.LMKT,
                //                       pICAttributes.PM
                //                    }.Where(x => !string.IsNullOrEmpty(x)))
                //};
                if (quotation != null)
                {
                    if (!Directory.Exists(path.Value + "\\Digisign"))
                    {
                        Directory.CreateDirectory(path.Value + "\\Digisign");
                    }
                    System.IO.File.WriteAllBytes(Path.Combine(path.Value,"Digisign", accountApproveName, quotation.QuotationCode,convertResult.FileName), Convert.FromBase64String(convertResult.FileBase64));
                    newDocument.SubDirectory = $"Digisign\\{accountApproveName}\\{quotation.QuotationCode}";

                    Quotation newQuotation = new Quotation();
                    newQuotation.WorkflowStatus = completeSigning.Name;
                    newQuotation.StatusId = completeSigning.Id;



                    newDocument = await _BaseRepository.InsertData(newDocument);

                    newQuotation.DocumentId = newDocument.Id;
                    await _quotationRepository.UpdateData(newQuotation, quotation, ["DocumentId", "WorkflowStatus", "StatusId"], "Id");
                }
            }
            //Update status instance to complete 
            //
            return Ok();

        }
        catch (Exception ex)
        {
            Log.Error(ex, ex.Message);
            return StatusCode(500, ex.Message);
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> LibreConvert(long? id)
    {
        string URL = _BaseRepository._baseConfiguration.GetSection("UrlConfig:LibreOfficeHost").Value;

        //Change lại thành hàm của chính link host cho source này từ 
        //TestCallBackUrl  -> CallbackFileHandle
        string callURL = _BaseRepository._baseConfiguration.GetSection("UrlConfig:CallbackHost").Value;
        string endpoint = $"{URL}/api/convert";
        string keyApi = _BaseRepository._baseConfiguration.GetSection("LibreServer:Key").Value;
        try
        {
            if (string.IsNullOrWhiteSpace(endpoint))
                return BadRequest("Config UrlConfig:LibreOfficeHost is empty.");

            // Ví dụ: lấy thông tin file theo id từ DB
            // Bạn thay Attachment bằng model thực tế của bạn
            var attachment = await _BaseRepository.GetObjectByIdAsync(id ?? 0);
            if (attachment == null)
                return NotFound($"Attachment id={id} not found.");

            // Ví dụ: đường dẫn vật lý file
            // Bạn sửa lại theo cấu trúc thật của hệ thống
            string filePath = Path.Combine(
                path.Value,
                attachment.SubDirectory ?? ""
            );

            if (!System.IO.File.Exists(filePath))
                return NotFound($"File not found: {filePath}");

            await using var fileStream = System.IO.File.OpenRead(filePath);

            using var multipart = new MultipartFormDataContent();

            var fileContent = new StreamContent(fileStream);
            fileContent.Headers.ContentType = new MediaTypeHeaderValue(Util.GetMimeType(filePath));

            // "file" phải đúng tên field mà API bên convert yêu cầu
            multipart.Add(fileContent, "file", Path.GetFileName(filePath));

            // Các field form-data khác
            multipart.Add(new StringContent("pdf"), "outputFormat");
            multipart.Add(new StringContent(callURL), "callbackUrl");
            multipart.Add(new StringContent("{}"), "metadata");

            var client =  new HttpClient();
            client.Timeout = TimeSpan.FromMinutes(10);
            client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("*/*"));
            client.DefaultRequestHeaders.Add("X-API-KEY", keyApi);


            var response = await client.PostAsync(endpoint, multipart);
            var responseBytes = await response.Content.ReadAsByteArrayAsync();
            var responseText = await response.Content.ReadAsStringAsync();
            
            if (!response.IsSuccessStatusCode)
            {
                return StatusCode((int)response.StatusCode, new
                {
                    message = "Convert server returned error.",
                    detail = responseText
                });
            }
            
            // Nếu server convert trả thẳng file đã convert về
            var outputFileName = Path.GetFileNameWithoutExtension(filePath) + ".pdf";

            string getStreamHost = _BaseRepository._baseConfiguration.GetSection("UrlConfig:GetStreamHost").Value + $"?fileName={outputFileName}";
            var responseGet = await client.GetAsync(getStreamHost);
            var responseBytesGet = await responseGet.Content.ReadAsByteArrayAsync();
            var responseTextGet = await responseGet.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                return StatusCode((int)response.StatusCode, new
                {
                    message = "Convert server returned error.",
                    detail = responseText
                });
            }


            return File(responseBytesGet, "application/pdf", outputFileName);

            // Nếu bạn chỉ muốn lưu xuống disk rồi return ok thì dùng đoạn này thay thế:
            // var outputPath = Path.Combine(Path.GetDirectoryName(filePath)!, outputFileName);
            // await System.IO.File.WriteAllBytesAsync(outputPath, responseBytes);
            // return Ok(new { message = "Convert success", outputPath });
        }
        catch (Exception ex)
        {
            Serilog.Log.Error(ex, "DocumentController.ConvertToPdf failed.");
            return StatusCode(500, new
            {
                message = "Convert failed",

                detail = ex.Message
            });
        }
    }


    [HttpPost]
    public override async Task<IActionResult> AsyncUploadFile()
    {
        var settings = await SystemWriteControl.GetAsync(_BaseRepository._connectionString);
        var storageTarget = settings.AttachmentStorage == "SharePoint"
                ? DocumentStorageTarget.SharePoint
                : DocumentStorageTarget.Local;

        // LEGACY ROLLBACK: uploads always used local BlobStorage.
        // return await UploadRequestFileAsync(DocumentStorageTarget.Local);
        return await base.UploadRequestFileAsync(storageTarget);
    }

    


    [HttpGet]
    public async Task<IActionResult> DeleteDocumentData(long id)
    {
        Document Document = new Document();
        Document = await _BaseRepository.GetSingleObject(s => s.Id == id);
        if (Document != null)
        {
            if (Document.SubDirectory != null && !IsRemoteDocumentUrl(Document.SubDirectory))
                if (System.IO.File.Exists(Path.Combine(path.Value, Document.SubDirectory, Document.Guid.ToString()+ Document.FileType)))
                    System.IO.File.Delete(Path.Combine(path.Value, Document.SubDirectory, Document.Guid.ToString()+ Document.FileType));

            Document = await _BaseRepository.DeleteData(Document, (int)Document.Id, "Id", true);
        }
        return Ok(Document);
    }
    [HttpGet("{recordGuid}/{folder}")]
    public async Task<IActionResult> AttachmentSummary(Guid recordGuid, string folder)
    {
        var count = await _BaseRepository.GetListObject(x =>
            x.RecordGuid == recordGuid &&
            x.Attributes.Contains($"{folder}"));

        return Ok(new
        {
            hasAttachment = count.Count > 0,
            attachmentCount = count
        });
    }

    [HttpGet]
    public async Task<IActionResult> GetByKey(Guid recordGuid, string? folder = null, bool? isOutOfRule = false)
    {
        // folder: "FO" => filter SubDirectory start with "MKT\"
        folder = string.IsNullOrWhiteSpace(folder) ? null : folder.Trim();

        // Lấy toàn bộ rồi filter (vì repo bạn đang có GetAll)
        // Nếu repo có method GetListObject(predicate) thì thay bằng query trực tiếp sẽ nhanh hơn
        IEnumerable<Document> all;
        if (isOutOfRule ?? false)
        {
            all = string.IsNullOrWhiteSpace(folder)
                ? Enumerable.Empty<Document>()
                : await _BaseRepository.GetListObject(l =>
                    l.Attributes != null && l.Attributes.Contains(folder));
        }
        else
        {
            // A request without folder is the record-level snapshot used by all
            // upload controls. Query it once, then distribute by attributes in UI.
            all = string.IsNullOrWhiteSpace(folder)
                ? await _BaseRepository.GetListObject(l => l.RecordGuid == recordGuid)
                : await _BaseRepository.GetListObject(l =>
                    l.RecordGuid == recordGuid &&
                    l.Attributes != null &&
                    l.Attributes.Contains(folder));
        }

        var docs = all
            .Where(d => (d.Deleted == null || d.Deleted == false)
                        && ((isOutOfRule ?? false) ||
                            (d.RecordGuid.HasValue && d.RecordGuid.Value == recordGuid)))
            .ToList();
        //if (!string.IsNullOrEmpty(folder))
        //{
        //    var prefix = (folder.EndsWith("\\") ? folder : folder + "\\");
        //    docs = docs.Where(d =>
        //            !string.IsNullOrEmpty(d.SubDirectory) &&
        //            d.SubDirectory.Replace("/", "\\")
        //                .StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
        //        .ToList();
        //}

        var result = docs
            .OrderByDescending(d => d.CreatedDate)
            .Select(d =>
            {
                var fileName = !string.IsNullOrEmpty(d.FileName)
                    ? d.FileName
                    : Path.GetFileName(d.SubDirectory ?? "");

                var ext = d.FileType;
                if (!IsRemoteDocumentUrl(d.SubDirectory))
                    if (!System.IO.File.Exists(
                        Path.Combine(
                            path.Value,
                            d.SubDirectory,
                            d.Guid.ToString() + d.FileType)))
                {
                    ext = "Not Found On Server";
                }
                return new
                {
                    id = d.Id,
                    recordGuid = d.RecordGuid,
                    fileName = fileName,
                    fileType = d.FileType,
                    extension = ext.Replace(".", ""),
                    size = d.Size,
                    subDirectory = d.SubDirectory,
                    attributes = d.Attributes,
                    downloadUrl = Url.Action(nameof(StreamDocument), new { id = d.Id }),
                    author = d.CreatedBy,
                    date = d.CreatedDate
                };
            })
            .ToList();

        return Ok(result);
    }

    //[HttpGet]
    //public JsonResult GetUploadedFiles()
    //{
    //    var path = _BaseRepository._baseConfiguration.GetSection("BlobStorage:Path");
    //    IBaseRepository<Document> _DocumentRepository = new BaseRepository<Document>(_BaseRepository._baseConfiguration);

    //    // Lấy danh sách file từ thư mục
    //    var files = Directory.GetFiles(uploadFolder)
    //        .Select(file => new
    //        {
    //            Name = Path.GetFileName(file),
    //            Url = Url.Content($"~/Uploads/{Path.GetFileName(file)}")
    //        })
    //        .ToList();

    //    return Json(files, JsonRequestBehavior.AllowGet);
    //}

    [HttpPost]
    public override async Task<object> ExecuteCustomQuery([FromBody] string query)
    {

        //query = "EXEC usp_fd_policy_issuance_request";
        List<Dictionary<string, object>> obj = new List<Dictionary<string, object>>();
        if (Query != query && !query.Contains("@"))
        {
            Query = query;
        }
        obj = await _BaseRepository.ExecuteCustomJogetQuery(Query);
        return obj;
    }


    public async Task BulkInsertSystemPropertiesAsync(List<SystemProperties> data)
    {
        var dt = new DataTable();

        // Khởi tạo cột (phải khớp DB)
        foreach (var prop in typeof(SystemProperties).GetProperties())
        {
            dt.Columns.Add(prop.Name, typeof(string));
        }

        // Gán dữ liệu
        foreach (var item in data)
        {
            var row = dt.NewRow();
            foreach (var prop in typeof(SystemProperties).GetProperties())
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
            DestinationTableName = "dbo.SystemProperties", // Đảm bảo đúng tên bảng
            BulkCopyTimeout = 60
        };

        await bulkCopy.WriteToServerAsync(dt);
    }
    #region Digisign

    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> CallBackGetFile([FromBody]  DigisignCallbackResult fileName) // Old version from Retool - 2026-08-19
    {

        try
        {
            if (!Directory.Exists(path.Value + "\\CallBack"))
            {
                return StatusCode(500, "Directory not exist!");
            }
            string fullPath = path.Value + "\\CallBack\\" + fileName;
            var mimeTypes = Util.GetMimeType(fileName.FileName);
            var fileStream = System.IO.File.OpenRead(path.Value + "\\CallBack\\" + fileName);
            return File(fileStream, mimeTypes, Path.GetFileName(fullPath));

        }
        catch (Exception ex)
        {
            Log.Error(ex, ex.Message);
            return StatusCode(500, ex.Message);
        }
    }


    [HttpGet("{id}")]
    public async Task<IActionResult> SignByKeywordWithCKSHSM(long? id)
    {
        try
        {
            // Xử lý ký demo
            ControllerUtil.SignByKeywordWithCKSHSM(_BaseRepository, id);

            return Ok(new
            {
                Message = "Sign success and callback completed"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }
    [HttpGet("{id}")]
    public async Task<IActionResult> SignManualByLocationWithCKSHSMCompany(long? id)
    {
        ControllerUtil.SignManualByLocationWithCKSHSMCompany();
        return Ok();
    }
    [HttpGet("{id}")]
    public async Task<IActionResult> makeSign(long? id)
    {
        ControllerUtil.makeSign();
        return Ok();
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> DigiSign(long? id)
    {
        //Sign by keyword 

        //SyncfusionSigns / SignByKeywordWithCKSHSM
        //SyncfusionSigns / SignManualByLocationWithCKSHSM
        //SyncfusionSigns / SignByKeywordWithCKSCongCongStream
        //SyncfusionSigns / SignManualByLocationWithCKSCongCong
        //SyncfusionSigns / SignManualByLocationWithSyncfusion

        //const fd = new FormData();
        //fd.append('file', new Blob([pdfBuffer], { type: 'application/pdf' }), 'ItDemo Sign.pdf');
        //fd.append('userNameSign', 'trung.vt');
        //fd.append('keyword', 'KEYWORK A');
        //fd.append('pageSign', '1');

        //Sign by coordinate

        //        MakeDigiSigns / sign
        //MakeDigiSigns / SignManualByLocationWithCKSHSMCompany
        //MakeDigiSigns / MakeSignManualWithRectangleCSign
        //MakeDigiSigns / MakeSignWithHash256File
        //MakeDigiSigns / CheckHealthUrl


        //        const payload = {
        //                fileSignPdfWithBytes: pdfBase64,
        //                agreementUUID: '4BC3CA84-49E4-4191-A026-8FF67C45B30B',
        //                passCode: '43227474',
        //                pageNo: 1,
        //                coordinate: '100,500,250,650',
        //                base64SignatureImg: companyStampBase64,
        //                iSecrect: false
        //            };

        //    const res = await fetch(`${NODE_API_URL}/ api / MakeDigiSigns / SignManualByLocationWithCKSHSMCompany`, {
        //method: 'POST',
        //                headers: { 'Content-Type': 'application/json' },
        //                body: JSON.stringify(payload)
        //            });

        //Public sign
        //PublicSigns / makeSign

        //        const xmlBody = `<? xml version = "1.0" encoding = "utf-8" ?>
        //< PublicSignRequest xmlns = "http://tempuri.org/" >
        //   < userName > VO TOAN TRUNG IT </ userName >
        //   < passWord > abc123 </ passWord >
        //   < dataBase64 >${ pdfBase64}</ dataBase64 >
        //   < imageSignBase64 >${ defaultStampBase64}</ imageSignBase64 >
        //   < locationKey > KEYWORK A </ locationKey >
        //   < pageIndex > 1 </ pageIndex >
        //</ PublicSignRequest >`;
        //        const res = await fetch(`${ NODE_API_URL}/ api / PublicSigns / makeSign`, {
        //        method: 'POST',
        //                headers:
        //            {
        //                'Content-Type': 'application/xml',
        //                    'Accept': 'application/xml'
        //                },
        //                body: xmlBody
        //            });



        return Ok();
        //string URL = _BaseRepository._baseConfiguration.GetSection("UrlConfig:DigiSignHost").Value;

        ////Change lại thành hàm của chính link host cho source này từ 
        ////TestCallBackUrl  -> CallbackFileHandle
        //string callURL = _BaseRepository._baseConfiguration.GetSection("UrlConfig:DigisignStorageHost").Value;
        //string endpoint = $"{URL}/api/convert";
        //string keyApi = _BaseRepository._baseConfiguration.GetSection("DigiSignServer:Key").Value;
        //try
        //{
        //    if (string.IsNullOrWhiteSpace(endpoint))
        //        return BadRequest("Config UrlConfig:DigiSignHost is empty.");

        //    // Ví dụ: lấy thông tin file theo id từ DB
        //    // Bạn thay Attachment bằng model thực tế của bạn
        //    var attachment = await _BaseRepository.GetObjectByIdAsync(id ?? 0);
        //    if (attachment == null)
        //        return NotFound($"Attachment id={id} not found.");

        //    // Ví dụ: đường dẫn vật lý file
        //    // Bạn sửa lại theo cấu trúc thật của hệ thống
        //    string filePath = Path.Combine(
        //        path.Value,
        //        attachment.SubDirectory ?? ""
        //    );

        //    if (!System.IO.File.Exists(filePath))
        //        return NotFound($"File not found: {filePath}");

        //    await using var fileStream = System.IO.File.OpenRead(filePath);

        //    using var multipart = new MultipartFormDataContent();

        //    var fileContent = new StreamContent(fileStream);
        //    fileContent.Headers.ContentType = new MediaTypeHeaderValue(Util.GetMimeType(filePath));

        //    // "file" phải đúng tên field mà API bên convert yêu cầu
        //    multipart.Add(fileContent, "file", Path.GetFileName(filePath));

        //    // Các field form-data khác
        //    multipart.Add(new StringContent("pdf"), "outputFormat");
        //    multipart.Add(new StringContent(callURL), "callbackUrl");
        //    multipart.Add(new StringContent(JsonConvert.SerializeObject(new { Document = new Document() { Id = id  ?? 0} })), "metadata");

        //    var client = new HttpClient();
        //    client.Timeout = TimeSpan.FromMinutes(10);
        //    client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("*/*"));
        //    client.DefaultRequestHeaders.Add("X-API-KEY", keyApi);


        //    var response = await client.PostAsync(endpoint, multipart);
        //    var responseBytes = await response.Content.ReadAsByteArrayAsync();
        //    var responseText = await response.Content.ReadAsStringAsync();

        //    if (!response.IsSuccessStatusCode)
        //    {
        //        return StatusCode((int)response.StatusCode, new
        //        {
        //            message = "Signing server returned error.",
        //            detail = responseText
        //        });
        //    }

        //    // Nếu server convert trả thẳng file đã convert về
        //    var outputFileName = Path.GetFileNameWithoutExtension(filePath) + ".pdf";

        //    string getStreamHost = _BaseRepository._baseConfiguration.GetSection("UrlConfig:GetStreamHost").Value + $"?fileName={outputFileName}";
        //    var responseGet = await client.GetAsync(getStreamHost);
        //    var responseBytesGet = await responseGet.Content.ReadAsByteArrayAsync();
        //    var responseTextGet = await responseGet.Content.ReadAsStringAsync();

        //    if (!response.IsSuccessStatusCode)
        //    {
        //        return StatusCode((int)response.StatusCode, new
        //        {
        //            message = "Signing server returned error.",
        //            detail = responseText
        //        });
        //    }


        //    return File(responseBytesGet, "application/pdf", outputFileName);

        //    // Nếu bạn chỉ muốn lưu xuống disk rồi return ok thì dùng đoạn này thay thế:
        //    // var outputPath = Path.Combine(Path.GetDirectoryName(filePath)!, outputFileName);
        //    // await System.IO.File.WriteAllBytesAsync(outputPath, responseBytes);
        //    // return Ok(new { message = "Signing success", outputPath });
        //}
        //catch (Exception ex)
        //{
        //    return StatusCode(500, new
        //    {
        //        message = "Signing failed",

        //        detail = ex.Message
        //    });
        //}
    }


    [HttpPost("{id}")]
    public async Task<IActionResult> DigiSignPfx(
    long id,
    [FromQuery] string keyword,
    CancellationToken cancellationToken)
    {
        try
        {
            var document =
                await _BaseRepository.GetObjectByIdAsync(id);

            if (document == null)
            {
                return NotFound(
                    $"Document id={id} not found."
                );
            }
              
            await using var stream =
                await GetDocumentStreamAsync(
                    document,
                    cancellationToken
                );

            var signedBytes =
                await SignPfxByKeywordAsync(
                    stream,
                    document.FileName,
                    keyword,
                    null,
                    cancellationToken
                );

            return File(
                signedBytes,
                "application/pdf",
                Path.GetFileNameWithoutExtension(
                    document.FileName
                ) + "_signed.pdf"
            );
        }
        catch (Exception ex)
        {
            Log.Error(
                ex,
                "DigiSignPfx failed for Document {DocumentId}",
                id
            );

            return StatusCode(
                500,
                new
                {
                    message = "Digital signing failed.",
                    detail = ex.Message
                }
            );
        }
    }


    private async Task<byte[]> SignHsmByKeywordAsync(
    Stream documentStream,
    string fileName,
    string keyword,
    string passcode,
    CancellationToken cancellationToken = default)
    {
        using var multipart =
            new MultipartFormDataContent();

        using var fileContent =
            new StreamContent(documentStream);

        fileContent.Headers.ContentType =
            new MediaTypeHeaderValue(
                Util.GetMimeType(fileName)
            );

        multipart.Add(
            fileContent,
            "file",
            fileName
        );

        multipart.Add(
            new StringContent(keyword ?? ""),
            "keyword"
        );

        multipart.Add(
            new StringContent(passcode ?? ""),
            "passcode"
        );

        using var response =
            await CallDigiSignApiAsync(
                "/api/MakeDigiSigns/sign-hsm-by-keyword-form",
                multipart,
                cancellationToken
            );

        if (!response.IsSuccessStatusCode)
        {
            var error =
                await response.Content.ReadAsStringAsync(
                    cancellationToken
                );

            throw new Exception(
                $"DigiSign HSM failed. " +
                $"HTTP {(int)response.StatusCode}: {error}"
            );
        }

        return await response.Content.ReadAsByteArrayAsync(
            cancellationToken
        );
    }
    private async Task<HttpResponseMessage> CallDigiSignApiAsync(
   string endpoint,
   HttpContent content,
   CancellationToken cancellationToken = default)
    {
        var baseUrl = configuration["UrlConfig:DigiSignHost"];

        var url =
            $"{baseUrl}/{endpoint.TrimStart('/')}".TrimEnd('/'); ;

        var client = new HttpClient
        {
            Timeout = TimeSpan.FromMinutes(
                configuration.GetValue<int?>(
                    "DigiSign:TimeoutMinutes"
                ) ?? 10
            )
        };

        client.DefaultRequestHeaders.Accept.Add(
            new MediaTypeWithQualityHeaderValue("*/*")
        );

        var response = await client.PostAsync(
            url,
            content,
            cancellationToken
        );

        return response;
    }


    private async Task<byte[]> SignPfxByKeywordAsync(
    Stream documentStream,
    string fileName,
    string keyword,
    string? password = null,
    CancellationToken cancellationToken = default)
    {
        using var multipart =
            new MultipartFormDataContent();

        using var fileContent =
            new StreamContent(documentStream);

        fileContent.Headers.ContentType =
            new MediaTypeHeaderValue(
                Util.GetMimeType(fileName)
            );

        multipart.Add(
            fileContent,
            "file",
            fileName
        );

        multipart.Add(
            new StringContent(keyword ?? ""),
            "keyword"
        );

        if (!string.IsNullOrWhiteSpace(password))
        {
            multipart.Add(
                new StringContent(password),
                "password"
            );
        }

        using var response =
            await CallDigiSignApiAsync(
                "/api/MakeDigiSigns/sign-pfx-by-keyword",
                multipart,
                cancellationToken
            );

        if (!response.IsSuccessStatusCode)
        {
            var error =
                await response.Content.ReadAsStringAsync(
                    cancellationToken
                );

            throw new Exception(
                $"DigiSign PFX failed. " +
                $"HTTP {(int)response.StatusCode}: {error}"
            );
        }

        return await response.Content.ReadAsByteArrayAsync(
            cancellationToken
        );
    }


    [HttpPost("{id}")]
    public async Task<IActionResult> DigiSignHsm(
    long id,
    [FromBody] DigiSignHsmRequest request,
    CancellationToken cancellationToken)
    {
        try
        {
            var document =
                await _BaseRepository.GetObjectByIdAsync(id);

            if (document == null)
                return NotFound();

            await using var stream =
                await GetDocumentStreamAsync(
                    document,
                    cancellationToken
                );

            var result =
                await SignHsmByKeywordAsync(
                    stream,
                    document.FileName,
                    request.Keyword,
                    request.Passcode,
                    cancellationToken
                );

            return File(
                result,
                "application/pdf",
                Path.GetFileNameWithoutExtension(
                    document.FileName
                ) + "_signed.pdf"
            );
        }
        catch (Exception ex)
        {
            Log.Error(ex, "DigiSignHsm failed.");

            return StatusCode(
                500,
                new
                {
                    message = "HSM signing failed.",
                    detail = ex.Message
                }
            );
        }
    }
    public static List<SystemProperties> ConvertToSystemPropertiesList(List<Dictionary<string, object>> rawData)
    {
        var result = new List<SystemProperties>();

        foreach (var dict in rawData)
        {
            var obj = new SystemProperties();
            foreach (var prop in typeof(SystemProperties).GetProperties())
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

    private async Task<Stream> GetDocumentStreamAsync(
    Document document,
    CancellationToken cancellationToken = default)
    {
        if (document == null)
            throw new ArgumentNullException(nameof(document));

        /*
         * SharePoint / Remote
         */
        if (IsRemoteDocumentUrl(document.SubDirectory))
        {
            var client = new HttpClient();

            var response = await client.GetAsync(
                document.SubDirectory,
                HttpCompletionOption.ResponseHeadersRead,
                cancellationToken
            );

            response.EnsureSuccessStatusCode();

            return await response.Content.ReadAsStreamAsync(
                cancellationToken
            );
        }

        /*
         * Local
         */
        var fullPath = Path.Combine(
            path.Value,
            document.SubDirectory ?? "",
            document.Guid.ToString() + document.FileType
        );

        if (!System.IO.File.Exists(fullPath))
        {
            throw new FileNotFoundException(
                $"Document file not found: {fullPath}",
                fullPath
            );
        }

        return new FileStream(
            fullPath,
            FileMode.Open,
            FileAccess.Read,
            FileShare.Read,
            81920,
            useAsync: true
        );
    }

    public class DigiSignHsmRequest
    {
        public string Keyword { get; set; } = "";
        public string Passcode { get; set; } = "";
    }
    #endregion
}

public enum DocumentStorageTarget
{
    Local,
    Nas,
    SharePoint
}