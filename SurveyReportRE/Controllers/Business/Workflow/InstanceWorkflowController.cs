using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Serilog;
using ERPCore.Common;
using ERPCore.Controllers.Base;
using ERPCore.Models.Base;
using ERPCore.Models.Migration.Business.Data;
using ERPCore.Models.Migration.Business.Form;
using ERPCore.Models.Migration.Business.Workflow;
using System.Data;
using ERPCore.Models.Request;
using ERPCore.Models;
using ERPCore.ControllerUtil;
using ERPCore.Models.Migration.Business.HumanResource;
using ERPCore.Models.Migration.Business.MasterData;
using ERPCore.Models.Migration.Business.Config;
using ERPCore.Models.Migration.Business.Social;
using Microsoft.AspNetCore.SignalR;
using static ERPCore.Models.Models.Parsing.JsonHandle;
using ERPCore.Models.Business.Migration.Config;
using static WorkflowDefinition_FormModel;
using ERPCore.Models.Migration.Config;
using RESurveyTool.Models.Models.Parsing;
using System.Text.RegularExpressions;
using ERPCore.Models.Config;
using ERPCore.Storage;
using System;
using System.Net.Http.Headers;

public class WorkflowTransitionSubmitRequest : SubmitRequest
{
    public string? ActionStatus { get; set; }
}

[ApiController]
[Route("api/[controller]/[action]")]
public class InstanceWorkflowController : BaseControllerApi<InstanceWorkflow>
{
    private readonly IBaseRepository<InstanceWorkflow> _BaseRepository;
    private readonly IBaseRepository<Quotation> _quotationRepository;
    private readonly IBaseRepository<PolicyIssuance> _policyIssuanceRepository;
    private readonly IBaseRepository<CommentLog> _quotationCommentLogRepository;
    private readonly IConfiguration configuration;
    private readonly IConfigurationSection path;
    private readonly ILogger<CommentLog> _logger;
    private readonly IOptionsMonitor<BlobStorageSettings> _optionsMonitor;
    private readonly IBaseRepository<MailTemplate> _mailTemplateRepository;
    private readonly IBaseRepository<MailQueue> _mailQueueRepository;
    private readonly IBaseRepository<Users> _usersRepository;
    private readonly IBaseRepository<Employee> _employeeRepository;
    private readonly IBaseRepository<TurnAroundTimeConfig> _turnAroundTimeConfigRepository;
    private readonly IBaseRepository<TurnAroundTimeDeptProcessing> _turnAroundTimeDeptProcessingRepository;
    private readonly IBaseRepository<TurnAroundTimeSession> _turnAroundTimeSessionRepository;
    private readonly IBaseRepository<Notification> _notificationRepository;
    private readonly IBaseRepository<NotificationTemplate> _notificationTemplateRepository;
    private readonly IBaseRepository<UrlCall> _urlCallRepository;
    private readonly IBaseRepository<StepsWorkflow> _stepsWorkflowRepository;
    private readonly IBaseRepository<WorkflowDefinition> _workflowDefinitionRepository;
    private readonly IBaseRepository<EnumData> _enumDataRepository;
    private readonly IBaseRepository<Document> _documentRepository;
    private readonly IBaseRepository<WorkflowInstanceNode> _workflowInstanceNodeRepository;
    private readonly IBaseRepository<UsersSession> _usersSessionRepository;
    private readonly IHubContext<FileProcessingHub> _hubContext;
    private readonly Microsoft.Extensions.Options.IOptionsMonitor<BlobStorageSettings> _blobStorageSettings;
    private readonly Microsoft.Extensions.Options.IOptionsMonitor<BusinessConfig> _businessConfig;
    private string DOMAIN_NAME = "";
    private readonly URLConfig _urlConfig;
    private MailConfig _emailSettings;
    public InstanceWorkflowController(IBaseRepository<InstanceWorkflow> BaseRepository
        , IConfiguration config
        , IHttpContextAccessor httpContextAccessor
        , ILogger<CommentLog> logger
        , IOptionsMonitor<BlobStorageSettings> optionsMonitor
        , Microsoft.Extensions.Options.IOptionsMonitor<BlobStorageSettings> blobStorageSettings
        , Microsoft.Extensions.Options.IOptionsMonitor<BusinessConfig> businessConfig
        , IHubContext<FileProcessingHub> hubContext
        ) : base(BaseRepository, httpContextAccessor)
    {
        configuration = config;
        _httpContextAccessor = httpContextAccessor;
        _logger = logger;
        _optionsMonitor = optionsMonitor;
        _BaseRepository = BaseRepository;
        _quotationRepository = new BaseRepository<Quotation>(configuration, _httpContextAccessor);
        _policyIssuanceRepository = new BaseRepository<PolicyIssuance>(configuration, _httpContextAccessor);
        _quotationCommentLogRepository = new BaseRepository<CommentLog>(configuration, _httpContextAccessor);
        _mailQueueRepository = new BaseRepository<MailQueue>(configuration, _httpContextAccessor);
        _mailTemplateRepository = new BaseRepository<MailTemplate>(configuration, _httpContextAccessor);
        _usersRepository = new BaseRepository<Users>(configuration, _httpContextAccessor);
        _employeeRepository = new BaseRepository<Employee>(configuration, _httpContextAccessor);
        _turnAroundTimeConfigRepository = new BaseRepository<TurnAroundTimeConfig>(configuration, _httpContextAccessor);
        _turnAroundTimeDeptProcessingRepository = new BaseRepository<TurnAroundTimeDeptProcessing>(configuration, _httpContextAccessor);
        _turnAroundTimeSessionRepository = new BaseRepository<TurnAroundTimeSession>(configuration, _httpContextAccessor);
        _notificationRepository = new BaseRepository<Notification>(configuration, _httpContextAccessor);
        _notificationTemplateRepository = new BaseRepository<NotificationTemplate>(configuration, _httpContextAccessor);
        _urlCallRepository = new BaseRepository<UrlCall>(configuration, _httpContextAccessor);
        _stepsWorkflowRepository = new BaseRepository<StepsWorkflow>(configuration, _httpContextAccessor);
        _workflowDefinitionRepository = new BaseRepository<WorkflowDefinition>(configuration, _httpContextAccessor);
        _enumDataRepository = new BaseRepository<EnumData>(configuration, _httpContextAccessor);
        _documentRepository = new BaseRepository<Document>(configuration, _httpContextAccessor);
        _workflowInstanceNodeRepository = new BaseRepository<WorkflowInstanceNode>(configuration, _httpContextAccessor);
        _usersSessionRepository = new BaseRepository<UsersSession>(configuration, _httpContextAccessor);
        _emailSettings = configuration.GetSection("Email").Get<MailConfig>();
        _hubContext = hubContext;
        _blobStorageSettings = blobStorageSettings;
        _businessConfig = businessConfig;
        _urlConfig = configuration.GetSection("URLConfig").Get<URLConfig>();
        DOMAIN_NAME = configuration.GetSection("Domain:DCServer").Value;
    }

    [HttpPost]
    public async Task<IActionResult> QuotationSubmitNextStep([FromBody] WorkflowTransitionSubmitRequest submitRequest)
    {

                if (string.IsNullOrEmpty(submitRequest.StepsWorkflow.FromNodeId) || string.IsNullOrEmpty(submitRequest.StepsWorkflow.ToNodeId)) return StatusCode(500, "Submit problem, please contact IT Admin!!!!");
        
        Quotation quotation = new Quotation();
        quotation = await _quotationRepository.GetSingleObject(s => s.Id == submitRequest.QuotationId);
        
        Guid workflowDefinitionId = submitRequest.InstanceWorkflow?.WorkflowDefinitionId ?? Guid.Empty;
        if (workflowDefinitionId != Guid.Empty && submitRequest.StepsWorkflow != null && quotation != null)
        {
            WorkflowDefinition? definition = await _workflowDefinitionRepository.GetSingleObject(
                item => item.Guid == workflowDefinitionId);
            if (definition != null && !string.IsNullOrEmpty(definition.WorkflowNodes))
            {
                JObject recordData = JObject.FromObject(quotation);
                var (resolvedNodeId, resolvedDeptCode) = Util.ResolveWorkflowJumps(
                    definition.WorkflowNodes,
                    submitRequest.StepsWorkflow.TNodeId ?? "",
                    recordData
                );
                if (!string.IsNullOrEmpty(resolvedNodeId) && resolvedNodeId != submitRequest.StepsWorkflow.TNodeId)
                {
                    submitRequest.StepsWorkflow.TNodeId = resolvedNodeId;
                    submitRequest.StepsWorkflow.ToNodeId = resolvedDeptCode;
                }
            }
        }

        submitRequest.InstanceWorkflow.CurrentStep = submitRequest.StepsWorkflow.TNodeId;
        await _BaseRepository.UpdateData(submitRequest.InstanceWorkflow, JsonConvert.SerializeObject(submitRequest.InstanceWorkflow), submitRequest.InstanceWorkflow?.Id, "Id");    //comment in 
        quotation.StageDept = submitRequest.StepsWorkflow.ToNodeId;
        quotation.WorkflowStatus = submitRequest.StepsWorkflow.StatusName;
        quotation.StatusId = submitRequest.StepsWorkflow.StatusId;
        if (submitRequest.ActionStatus != null)
            quotation.ActionStatus = submitRequest.ActionStatus;
        TurnAroundAttributes result = JsonConvert.DeserializeObject<TurnAroundAttributes>(quotation.TurnAroundTimeAttributes);
        TurnAroundItem tatObject = Util.TurnAroundTimePicker(result, submitRequest.StepsWorkflow.FromNodeId);
        
        tatObject.CompleteDate = DateTime.Now;
        switch (submitRequest.StepsWorkflow.FromNodeId)
        {
            case "FO":
                result.FO = tatObject;
                break;
            case "TS":
                result.TS = tatObject;
                break;
            case "UW":
                result.UW = tatObject;
                break;
            case "LMKT":
                tatObject.AcceptDate = DateTime.Now;
                tatObject.CompleteDate = null;
                result.LMKT = tatObject;
                break;
            case "PM":
                result.PM = tatObject;
                break;
        }

        if (submitRequest.StepsWorkflow.Command != null &&
            (submitRequest.StepsWorkflow.Command.Equals("ClearTurnaroundTimesAttributes", StringComparison.OrdinalIgnoreCase) ||
             submitRequest.StepsWorkflow.Command.Equals("clear turnaroundtimesattributes", StringComparison.OrdinalIgnoreCase)))
        {
            string destDept = submitRequest.StepsWorkflow.ToNodeId;
            if (!string.IsNullOrEmpty(destDept))
            {
                switch (destDept.ToUpper())
                {
                    case "FO":
                        if (result.FO != null) { result.FO.AcceptDate = null; result.FO.CompleteDate = null; }
                        break;
                    case "TS":
                        if (result.TS != null) { result.TS.AcceptDate = null; result.TS.CompleteDate = null; }
                        break;
                    case "UW":
                        if (result.UW != null) { result.UW.AcceptDate = null; result.UW.CompleteDate = null; }
                        break;
                    case "LMKT":
                        if (result.LMKT != null) { result.LMKT.AcceptDate = null; result.LMKT.CompleteDate = null; }
                        break;
                    case "PM":
                        if (result.PM != null) { result.PM.AcceptDate = null; result.PM.CompleteDate = null; }
                        break;
                    default:
                        if (result.FO != null) { result.FO.AcceptDate = null; result.FO.CompleteDate = null; }
                        break;
                }
            }
        }

        quotation.TurnAroundTimeAttributes = JsonConvert.SerializeObject(result);

        await TATLog(quotation, tatObject, submitRequest.StepsWorkflow.FromNodeId);

        WorkflowInstanceNode workflowInstanceNode = new WorkflowInstanceNode();
        workflowInstanceNode = await _workflowInstanceNodeRepository.GetSingleObject(s => s.Code == submitRequest.InstanceWorkflow.CurrentStep);

        if (workflowInstanceNode == null) return StatusCode(500, "Cannot find node in workflow!");
        if (workflowInstanceNode.Data.Contains("End"))
        {
            quotation.StageDept = "";
            quotation.StageAccount = "";
        }    

        

        if (submitRequest.StepsWorkflow.Command != null)
        {
            WorkflowCommand commandEnum = WorkflowCommand.None;

            if (!string.IsNullOrEmpty(submitRequest.StepsWorkflow.Command))
            {
                Enum.TryParse(
                    submitRequest.StepsWorkflow.Command,
                    true, // ignore case
                    out commandEnum
                );
            }
            switch (commandEnum)
            {
                case WorkflowCommand.TransferFile:

                    var config = JsonConvert.DeserializeObject<TransferFileConfig>(
                        submitRequest.StepsWorkflow.CommandConfig ?? "{}"
                    );
                    string subDir = _blobStorageSettings.CurrentValue.QuotationAttachmentFolder + "\\" + quotation.QuotationCode;
                    await HandleTransferFile(config, quotation, subDir);
                    break;

                case WorkflowCommand.CopyFile:

                    //await HandleCopyFile();
                    break;

                case WorkflowCommand.LockFileLocal:

                    //await HandleLockFile();
                    break;

                default:
                    // do nothing
                    break;
            }
        }
        await _quotationRepository.UpdateData(quotation, JsonConvert.SerializeObject(quotation), quotation?.Id, "Id"); // comment in 





        await ControllerUtil.LogAction(_quotationCommentLogRepository, _httpContextAccessor, configuration, DOMAIN_NAME, quotation, submitRequest, _blobStorageSettings); // comment in 



        PICAttributes pICAttributes = new PICAttributes();
        pICAttributes = JsonConvert.DeserializeObject<PICAttributes>(quotation.PIC);
        string accountName = Util.PICPicker(pICAttributes, submitRequest.StepsWorkflow.ToNodeId);
        ControllerHelper.SignalRResponse(_usersSessionRepository,"R_ItemSubmitted", new { id = quotation.Id, type = "Quotation" }, ControllerUtil.GetCurrentContextUser(_httpContextAccessor, configuration), DOMAIN_NAME);
        await SendAttachedWorkflowMailAsync(submitRequest, quotation);

        dynamic transferObject = new
        {
            DOMAIN_NAME = DOMAIN_NAME,
            Resource = "Assign from ",
            Guid = quotation.Guid,
            ReceivedBy = accountName,
            Id = quotation.Id,
            Code = quotation.QuotationCode,
            ModuleName = nameof(Quotation)
        };



        Notification notification = await SendWorkflowNotificationAsync(
            submitRequest,
            transferObject,
            NotificationTypeKeys.Quotation,
            quotation.WorkflowStatus);

        return Ok();
    }

    [HttpPost]
    public async Task<IActionResult> PolicyIssuanceSubmitNextStep([FromBody] WorkflowTransitionSubmitRequest submitRequest)
    {

                if (string.IsNullOrEmpty(submitRequest.StepsWorkflow.FromNodeId) || string.IsNullOrEmpty(submitRequest.StepsWorkflow.ToNodeId)) return StatusCode(500, "Submit problem, please contact IT Admin!!!!");
        
        PolicyIssuance quotation = new PolicyIssuance();
        quotation = await _policyIssuanceRepository.GetSingleObject(s => s.Id == submitRequest.PolicyIssuanceId);
        
        Guid workflowDefinitionId = submitRequest.InstanceWorkflow?.WorkflowDefinitionId ?? Guid.Empty;
        if (workflowDefinitionId != Guid.Empty && submitRequest.StepsWorkflow != null && quotation != null)
        {
            WorkflowDefinition? definition = await _workflowDefinitionRepository.GetSingleObject(
                item => item.Guid == workflowDefinitionId);
            if (definition != null && !string.IsNullOrEmpty(definition.WorkflowNodes))
            {
                JObject recordData = JObject.FromObject(quotation);
                var (resolvedNodeId, resolvedDeptCode) = Util.ResolveWorkflowJumps(
                    definition.WorkflowNodes,
                    submitRequest.StepsWorkflow.TNodeId ?? "",
                    recordData
                );
                if (!string.IsNullOrEmpty(resolvedNodeId) && resolvedNodeId != submitRequest.StepsWorkflow.TNodeId)
                {
                    submitRequest.StepsWorkflow.TNodeId = resolvedNodeId;
                    submitRequest.StepsWorkflow.ToNodeId = resolvedDeptCode;
                }
            }
        }

        submitRequest.InstanceWorkflow.CurrentStep = submitRequest.StepsWorkflow.TNodeId;
        await _BaseRepository.UpdateData(submitRequest.InstanceWorkflow, JsonConvert.SerializeObject(submitRequest.InstanceWorkflow), submitRequest.InstanceWorkflow?.Id, "Id");
        quotation.StageDept = submitRequest.StepsWorkflow.ToNodeId;
        quotation.WorkflowStatus = submitRequest.StepsWorkflow.StatusName;
        quotation.StatusId = submitRequest.StepsWorkflow.StatusId;
        if (submitRequest.ActionStatus != null)
            quotation.ActionStatus = submitRequest.ActionStatus;
        TurnAroundAttributes result = JsonConvert.DeserializeObject<TurnAroundAttributes>(quotation.TurnAroundTimeAttributes);
        TurnAroundItem tatObject = Util.TurnAroundTimePicker(result, submitRequest.StepsWorkflow.FromNodeId)
            ; 
        //switch
        //{
        //    "FO" => result.FO,
        //    "TS" => result.TS,
        //    "UW" => result.UW,
        //    "LMKT" => result.LMKT,
        //    "PM" => result.PM,
        //    _ => null
        //};
        tatObject.CompleteDate = DateTime.Now;
        switch (submitRequest.StepsWorkflow.FromNodeId)
        {
            case "FO":
                result.FO = tatObject;
                break;
            case "TS":
                result.TS = tatObject;
                break;
            case "UW":
                result.UW = tatObject;
                break;
            case "LMKT":
                result.LMKT = tatObject;
                break;
            case "PM":
                result.PM = tatObject;
                break;
        }

        if (submitRequest.StepsWorkflow.Command != null &&
            (submitRequest.StepsWorkflow.Command.Equals("ClearTurnaroundTimesAttributes", StringComparison.OrdinalIgnoreCase) ||
             submitRequest.StepsWorkflow.Command.Equals("clear turnaroundtimesattributes", StringComparison.OrdinalIgnoreCase)))
        {
            string destDept = submitRequest.StepsWorkflow.ToNodeId;
            if (!string.IsNullOrEmpty(destDept))
            {
                switch (destDept.ToUpper())
                {
                    case "FO":
                        if (result.FO != null) { result.FO.AcceptDate = null; result.FO.CompleteDate = null; }
                        break;
                    case "TS":
                        if (result.TS != null) { result.TS.AcceptDate = null; result.TS.CompleteDate = null; }
                        break;
                    case "UW":
                        if (result.UW != null) { result.UW.AcceptDate = null; result.UW.CompleteDate = null; }
                        break;
                    case "LMKT":
                        if (result.LMKT != null) { result.LMKT.AcceptDate = null; result.LMKT.CompleteDate = null; }
                        break;
                    case "PM":
                        if (result.PM != null) { result.PM.AcceptDate = null; result.PM.CompleteDate = null; }
                        break;
                }
            }
        }

        quotation.TurnAroundTimeAttributes = JsonConvert.SerializeObject(result);

        await PITATLog(quotation, tatObject, submitRequest.StepsWorkflow.FromNodeId);

        WorkflowInstanceNode workflowInstanceNode = new WorkflowInstanceNode();
        workflowInstanceNode = await _workflowInstanceNodeRepository.GetSingleObject(s => s.Code == submitRequest.InstanceWorkflow.CurrentStep);

        if (workflowInstanceNode == null) return StatusCode(500, "Cannot find node in workflow!");
        if (workflowInstanceNode.Data.Contains("End"))
        {
            quotation.StageDept = "";
            quotation.StageAccount = "";
        }

        await _policyIssuanceRepository.UpdateData(quotation, JsonConvert.SerializeObject(quotation), quotation?.Id, "Id");

        if (submitRequest.StepsWorkflow.Command != null)
        {
            WorkflowCommand commandEnum = WorkflowCommand.None;

            if (!string.IsNullOrEmpty(submitRequest.StepsWorkflow.Command))
            {
                Enum.TryParse(
                    submitRequest.StepsWorkflow.Command,
                    true, // ignore case
                    out commandEnum
                );
            }
            switch (commandEnum)
            {
                case WorkflowCommand.TransferFile:

                    var config = JsonConvert.DeserializeObject<TransferFileConfig>(
                        submitRequest.StepsWorkflow.CommandConfig ?? "{}"
                    );
                    string subDir = _blobStorageSettings.CurrentValue.QuotationAttachmentFolder + "\\" + quotation.QuotationCode;
                    await HandleTransferFile(config, quotation, subDir);
                    break;

                case WorkflowCommand.CopyFile:

                    //await HandleCopyFile();
                    break;

                case WorkflowCommand.LockFileLocal:

                    //await HandleLockFile();
                    break;

                default:
                    // do nothing
                    break;
            }
        }






        await ControllerUtil.LogAction(_quotationCommentLogRepository, _httpContextAccessor, configuration, DOMAIN_NAME, quotation, submitRequest, _blobStorageSettings);



        PICAttributes pICAttributes = new PICAttributes();
        pICAttributes = JsonConvert.DeserializeObject<PICAttributes>(quotation.PIC);
        string accountName = Util.PICPicker(pICAttributes, submitRequest.StepsWorkflow.ToNodeId);  
        //string accountName = submitRequest.StepsWorkflow.ToNodeId switch
        //{
        //    "FO" => pICAttributes.FO,
        //    "TS" => pICAttributes.TS,
        //    "UW" => pICAttributes.UW,
        //    "LMKT" => pICAttributes.LMKT,
        //    "PM" => pICAttributes.PM,
        //    _ => null
        //};
        ControllerHelper.SignalRResponse(_usersSessionRepository, "R_ItemSubmitted", new { id = quotation.Id, type = "PolicyIssuance" }, ControllerUtil.GetCurrentContextUser(_httpContextAccessor, configuration), DOMAIN_NAME);
        await PISendAttachedWorkflowMailAsync(submitRequest, quotation);
        long? notificationCloneId = await ControllerUtil.ResolvePolicyIssuanceCloneIdAsync(
            _quotationRepository,
            quotation);

        dynamic transferObject = new
        {
            DOMAIN_NAME = DOMAIN_NAME,
            Resource = "Assign from ",
            Guid = quotation.Guid,
            ReceivedBy = accountName,
            Id = quotation.Id,
            Code = quotation.PolicyIssuanceCode,
            ModuleName = nameof(PolicyIssuance),
            QuotationId = notificationCloneId,
            CopyFromGuid = quotation.CopyFromGuid
        };



        Notification notification = await SendWorkflowNotificationAsync(
            submitRequest,
            transferObject,
            NotificationTypeKeys.PolicyIssuance,
            quotation.WorkflowStatus);

        return Ok();
    }
    private async Task HandleTransferFile(
  TransferFileConfig config,
  dynamic ObjectIn, string subDir)
    {
        if (config == null)
            throw new Exception("Invalid TransferFile config");
        Guid guid = (Guid)ObjectIn.Guid;
        List<Document> files =
            await _documentRepository.GetListObject(
                x => x.RecordGuid == guid
            );
        if (files == null || files.Count == 0)
            throw new Exception("No document found");
        List<Document> result = new List<Document>();
        if (config.FileSelector == "First")
        {
            Document sourceDocument = files
                .Where(x =>
                    x != null &&
                    !string.IsNullOrWhiteSpace(x.Attributes) &&
                    x.Attributes.Contains(config.SourceDepartment)
                )
                .OrderByDescending(x => x.CreatedDate)
                .FirstOrDefault();
            if (sourceDocument != null)
                result.Add(sourceDocument);
        }
        if (result.Count == 0)
        {
            throw new Exception(
                $"No file found in department {config.SourceDepartment}"
            );
        }
 
   
            foreach (Document item in result)
        {
            await using Stream sourceStream =
              await GetTransferFileStream(item);
            if (sourceStream == null)
            {
                throw new Exception(
                    $"Cannot load source file: {item.FileName}"
                );
            }
            if (item == null)
                continue;
            // Path file Word hiện tại
            string sourcePath = item.SubDirectory;
            if (string.IsNullOrWhiteSpace(sourcePath))
                throw new Exception("Source file path is empty");
            if (!System.IO.File.Exists(sourcePath) && !sourcePath.Contains("sharepoint"))
                throw new FileNotFoundException(
                    "Source file not found",
                    sourcePath
                );
            // Folder hiện tại của file Word
            string directory = _blobStorageSettings.CurrentValue.Path;
            // Tên file không có extension




            string fileNameWithoutExt = Path.GetFileNameWithoutExtension(item.FileName);

            if (sourcePath.Contains("sharepoint"))
            {
                var query = Util.ParseQueryString(sourcePath);
                query.TryGetValue(
                    "sourcedoc",
                    out var sourceDoc
                );
                query.TryGetValue(
                    "file",
                    out var fileName
                );

                fileNameWithoutExt = Path.GetFileNameWithoutExtension(fileName);
            }

            // Tạo tên PDF
            
            // PDF nằm cùng folder với Word
            if (!System.IO.Path.Exists(Path.Combine(directory, subDir)))
                System.IO.Directory.CreateDirectory(Path.Combine(directory, subDir));
            if (!System.IO.Path.Exists(Path.Combine(directory, subDir, _blobStorageSettings.CurrentValue.AskingSignature)))
                System.IO.Directory.CreateDirectory(Path.Combine(directory, subDir, _blobStorageSettings.CurrentValue.AskingSignature));
          
            // ============================
            // CONVERT WORD -> PDF
            // ============================

            
            // ============================
            // INSERT DOCUMENT MỚI
            // ============================
            string pdfFileName =
             fileNameWithoutExt + ".pdf";
            Document newDocument = new Document();
            newDocument.RecordGuid = item.RecordGuid;
            newDocument.Attributes =
                item.Attributes?.Replace(
                    config.SourceDepartment,
                    config.TargetDepartment
                );
            newDocument.FileName = pdfFileName;
           
           
            newDocument.FileType = ".pdf";
            newDocument.SubDirectory = Path.Combine(subDir, _blobStorageSettings.CurrentValue.AskingSignature);
            newDocument.Size =
                sourceStream.Length;
            newDocument = await _documentRepository.InsertData(
                newDocument
            );


            ObjectIn.DocumentId = newDocument.Id;
            string localPdfFileName =
             newDocument.Guid.ToString() + ".pdf";
            string pdfPath = Path.Combine(
               directory, subDir, _blobStorageSettings.CurrentValue.AskingSignature,
               localPdfFileName
           );
            Util.ConvertPDFStream(
                sourceStream,
                item.FileType,
                pdfPath
            );
        }
    }
    private async Task<Stream> GetTransferFileStream(
   Document document,
   CancellationToken cancellationToken = default)
    {
        if (document == null)
            throw new ArgumentNullException(
                nameof(document)
            );
        var subDirectory =
            document.SubDirectory ?? "";
        var isSharePoint =
            subDirectory.Contains(
                "sharepoint",
                StringComparison.OrdinalIgnoreCase
            );
        if (isSharePoint)
        {
            /*
             * Ví dụ SubDirectory:
             *
             * SharePoint\Quotation\QT001\FO
             *
             * Nếu options.RootFolder đã là "SharePoint"
             * thì phải bỏ "SharePoint" khỏi SubDirectory,
             * tránh thành:
             *
             * SharePoint/SharePoint/Quotation/...
             */
            var folder =
                Util.RemoveSharePointPrefix(
                    subDirectory
                );

            var sharePointStorage = HttpContext.RequestServices
                  .GetRequiredService<ISharePointDocumentStorage>();
            var remoteFileName =
                $"{document.Guid}_{System.IO.Path.GetFileName(document.FileName)}";


            return await sharePointStorage.DownloadFromDocumentUrlAsync(
                document.SubDirectory,
                cancellationToken);
        }
        if (string.IsNullOrWhiteSpace(document.SubDirectory))
        {
            throw new InvalidOperationException(
                $"FilePath is empty for document '{document.FileName}'."
            );
        }
        if (!System.IO.File.Exists(document.SubDirectory))
        {
            throw new FileNotFoundException(
                $"File '{document.FileName}' was not found.",
                document.SubDirectory
            );
        }
        return new FileStream(
            document.SubDirectory,
            FileMode.Open,
            FileAccess.Read,
            FileShare.Read,
            bufferSize: 81920,
            useAsync: true
        );
    }
    // private async Task HandleTransferFile(
    //TransferFileConfig config,
    //dynamic ObjectIn)
    // {
    //     // {
    //     //   "sourceDepartment": "FO",
    //     //   "targetDepartment": "UW",
    //     //   "strategy": "Latest",
    //     //   "fileSelector": "First",
    //     //   "allowOverride": false
    //     // }
    //     if (config == null)
    //         throw new Exception("Invalid TransferFile config");
    //     Guid guid = (Guid)ObjectIn.Guid;
    //     List<Document> files = await _documentRepository.GetListObject(
    //         l => l.RecordGuid == guid
    //     );
    //     if (files == null || files.Count == 0)
    //         throw new Exception("No document found");
    //     List<Document> result = new List<Document>();
    //     if (config.FileSelector == "First")
    //     {
    //         Document sourceDocument = files
    //             .Where(x =>
    //                 x != null &&
    //                 !string.IsNullOrEmpty(x.Attributes) &&
    //                 x.Attributes.Contains(config.SourceDepartment)
    //             )
    //             .OrderByDescending(x => x.CreatedDate)
    //             .FirstOrDefault();
    //         if (sourceDocument != null)
    //             result.Add(sourceDocument);
    //     }
    //     if (result.Count == 0)
    //     {
    //         throw new Exception(
    //             $"No file found in department {config.SourceDepartment}"
    //         );
    //     }
    //     foreach (Document item in result)
    //     {
    //         if (item == null)
    //             continue;
    //         // Path file Word hiện tại
    //         string sourcePath = item.SubDirectory;
    //         if (string.IsNullOrWhiteSpace(sourcePath))
    //             throw new Exception("Source file path is empty");
    //         if (!System.IO.File.Exists(sourcePath))
    //             throw new FileNotFoundException(
    //                 "Source file not found",
    //                 sourcePath
    //             );
    //         // Folder hiện tại của file Word
    //         string directory = _blobStorageSettings.CurrentValue.Path;
    //         // Tên file không có extension
    //         string fileNameWithoutExt =
    //             Path.GetFileNameWithoutExtension(sourcePath);
    //         // Tạo tên PDF
    //         string pdfFileName =
    //             fileNameWithoutExt + ".pdf";
    //         // PDF nằm cùng folder với Word
    //         string pdfPath = Path.Combine(
    //             directory,
    //             pdfFileName
    //         );
    //         // ============================
    //         // CONVERT WORD -> PDF
    //         // ============================
    //         Util.ConvertPDF(
    //             sourcePath,
    //             pdfPath
    //         );
    //         // ============================
    //         // INSERT DOCUMENT MỚI
    //         // ============================
    //         Document newDocument = new Document();
    //         newDocument.RecordGuid = item.RecordGuid;
    //         newDocument.Attributes =
    //             item.Attributes?.Replace(
    //                 config.SourceDepartment,
    //                 config.TargetDepartment
    //             );
    //         newDocument.FileName = pdfFileName;
    //         newDocument.FileType = "pdf";
    //         newDocument.SubDirectory = pdfPath;
    //         newDocument.Size =
    //             new FileInfo(pdfPath).Length;
    //         await _documentRepository.InsertData(
    //             newDocument
    //         );
    //     }
    // }

    //private async Task HandleTransferFile(TransferFileConfig config, dynamic ObjectIn)
    //{//{   "sourceDepartment": "FO",   "strategy": "Latest",   "fileSelector": "First",   "allowOverride": false }
    //    if (config == null)
    //        throw new Exception("Invalid TransferFile config");
    //    Guid guid = (Guid)ObjectIn.Guid;
    //    List<Document> files = new List<Document>();
    //    files = await _documentRepository.GetListObject(l => l.RecordGuid == guid);
    //    List<Document> result = new List<Document>();
    //    if (config.FileSelector == "First")
    //        result.Add(files.OrderByDescending(x => x.CreatedDate).FirstOrDefault(x => x.Attributes.Contains(config.SourceDepartment)));


    //    if (result == null)
    //        throw new Exception($"No file found in department {config.SourceDepartment}");
    //    foreach (Document item in result)
    //    {
    //        if (item == null || item.Attributes == null) continue;
    //        Document newDocument = new Document();
    //        newDocument.Attributes = item.Attributes.Replace(config.SourceDepartment, config.TargetDepartment);
    //        await _documentRepository.UpdateData(newDocument, item, ["Attributes"], "Id");
    //    }

    //}
    [HttpPost]
    public async Task<IActionResult> QuotationReturnToStep([FromBody] WorkflowTransitionSubmitRequest submitRequest)
    {

        if (string.IsNullOrEmpty(submitRequest.StepsWorkflow.FromNodeId) || string.IsNullOrEmpty(submitRequest.StepsWorkflow.ToNodeId)) return StatusCode(500, "Submit problem, please contact IT Admin!!!!");
        //submitRequest.InstanceWorkflow.CurrentStep = submitRequest.StepsWorkflow.JumpStepNo;
        submitRequest.InstanceWorkflow.CurrentStep = submitRequest.StepsWorkflow.TNodeId;
        await _BaseRepository.UpdateData(submitRequest.InstanceWorkflow, JsonConvert.SerializeObject(submitRequest.InstanceWorkflow), submitRequest.InstanceWorkflow?.Id, "Id");
        Quotation quotation = new Quotation();
        quotation = await _quotationRepository.GetSingleObject(s => s.Id == submitRequest.QuotationId);
        quotation.StageDept = submitRequest.StepsWorkflow.ToNodeId;
        quotation.WorkflowStatus = submitRequest.StepsWorkflow.StatusName;
        quotation.StatusId = submitRequest.StepsWorkflow.StatusId;
        if (submitRequest.ActionStatus != null)
            quotation.ActionStatus = submitRequest.ActionStatus;
        TurnAroundAttributes result = JsonConvert.DeserializeObject<TurnAroundAttributes>(quotation.TurnAroundTimeAttributes);
        TurnAroundItem tatObject = Util.TurnAroundTimePicker(result, submitRequest.StepsWorkflow.FromNodeId);

        //    switch
        //{
        //    "FO" => result.FO,
        //    "TS" => result.TS,
        //    "UW" => result.UW,
        //    "LMKT" => result.LMKT,
        //    "PM" => result.PM,
        //    _ => null
        //};
        tatObject.CompleteDate = DateTime.Now;
        switch (submitRequest.StepsWorkflow.FromNodeId)
        {
            case "FO":
                result.FO = tatObject;
                break;
            case "TS":
                result.TS = tatObject;
                break;
            case "UW":
                result.UW = tatObject;
                break;
            case "LMKT":
                result.LMKT = tatObject;
                break;
            case "PM":
                result.PM = tatObject;
                break;
        }
        quotation.TurnAroundTimeAttributes = JsonConvert.SerializeObject(result);

        await TATLog(quotation, tatObject, submitRequest.StepsWorkflow.FromNodeId);

        await _quotationRepository.UpdateData(quotation, JsonConvert.SerializeObject(quotation), quotation?.Id, "Id");
        await ControllerUtil.LogAction(_quotationCommentLogRepository, _httpContextAccessor, configuration, DOMAIN_NAME, quotation, submitRequest, _blobStorageSettings);


        PICAttributes pICAttributes = new PICAttributes();
        pICAttributes = JsonConvert.DeserializeObject<PICAttributes>(quotation.PIC);
        string accountName = Util.PICPicker(pICAttributes, submitRequest.StepsWorkflow.ToNodeId);
        //string accountName = submitRequest.StepsWorkflow.ToNodeId switch
        //{
        //    "FO" => pICAttributes.FO,
        //    "TS" => pICAttributes.TS,
        //    "UW" => pICAttributes.UW,
        //    "LMKT" => pICAttributes.LMKT,
        //    "PM" => pICAttributes.PM,
        //    _ => null
        //};
        ControllerHelper.SignalRResponse(_usersSessionRepository, "R_ItemSubmitted", new { id = quotation.Id,  type = "Quotation" }, ControllerUtil.GetCurrentContextUser(_httpContextAccessor, configuration), DOMAIN_NAME);
        bool attachedMailSent = await SendAttachedWorkflowMailAsync(submitRequest, quotation);
        if (!attachedMailSent)
        {
            MailTemplate? mailTemplate = await _mailTemplateRepository.GetSingleObject(s => s.TemplateName == "Return Mail");
            Employee? targetEmployee = await FindEmployeeByAccountAsync(accountName);
            if (mailTemplate != null && targetEmployee != null)
            {
                DataTable query = DataUtil.ExecuteSelectQuery(_BaseRepository._connectionString, mailTemplate.MailQuery, ("", ""));
                Dictionary<string, object> flowDictionaryData = query.Rows.Count > 0
                    ? Util.MakeQueryIntoDirectory(query.Rows[0])
                    : new Dictionary<string, object>();
                MailQueue mailQueue = Util.NotifySession(targetEmployee, mailTemplate, _emailSettings, flowDictionaryData, Util.CCAllEmail(_emailSettings.FollowCC, ""), null);
                if (mailQueue != null) await _mailQueueRepository.InsertData(mailQueue);
            }
        }


        dynamic transferObject = new
        {
            DOMAIN_NAME = DOMAIN_NAME,
            Resource = "Assign from ",
            Guid = quotation.Guid,
            ReceivedBy = accountName,
            Id = quotation.Id,
            Code = quotation.QuotationCode,
            ModuleName = nameof(Quotation)
        };

        Notification notification = await SendWorkflowNotificationAsync(
            submitRequest,
            transferObject,
            NotificationTypeKeys.Quotation,
            quotation.WorkflowStatus);

        return Ok();
    }

    [HttpPost]
    public async Task<IActionResult> PolicyIssuanceReturnToStep([FromBody] WorkflowTransitionSubmitRequest submitRequest)
    {
        if (string.IsNullOrEmpty(submitRequest.StepsWorkflow?.FromNodeId)
            || string.IsNullOrEmpty(submitRequest.StepsWorkflow.ToNodeId))
        {
            return StatusCode(500, "Submit problem, please contact IT Admin!!!!");
        }

        submitRequest.InstanceWorkflow.CurrentStep = submitRequest.StepsWorkflow.TNodeId;
        await _BaseRepository.UpdateData(
            submitRequest.InstanceWorkflow,
            JsonConvert.SerializeObject(submitRequest.InstanceWorkflow),
            submitRequest.InstanceWorkflow?.Id,
            "Id");

        PolicyIssuance policyIssuance = await _policyIssuanceRepository.GetSingleObject(
            item => item.Id == submitRequest.PolicyIssuanceId);
        if (policyIssuance == null) return NotFound("Policy Issuance not found.");

        policyIssuance.StageDept = submitRequest.StepsWorkflow.ToNodeId;
        policyIssuance.WorkflowStatus = submitRequest.StepsWorkflow.StatusName;
        policyIssuance.StatusId = submitRequest.StepsWorkflow.StatusId;
        if (submitRequest.ActionStatus != null) policyIssuance.ActionStatus = submitRequest.ActionStatus;

        TurnAroundAttributes result = JsonConvert.DeserializeObject<TurnAroundAttributes>(policyIssuance.TurnAroundTimeAttributes);
        TurnAroundItem tatObject = Util.TurnAroundTimePicker(result, submitRequest.StepsWorkflow.FromNodeId);  
        //submitRequest.StepsWorkflow.FromNodeId switch
        //{
        //    "FO" => result.FO,
        //    "TS" => result.TS,
        //    "UW" => result.UW,
        //    "LMKT" => result.LMKT,
        //    "PM" => result.PM,
        //    _ => null
        //};
        if (tatObject != null) tatObject.CompleteDate = DateTime.Now;
        policyIssuance.TurnAroundTimeAttributes = JsonConvert.SerializeObject(result);

        await PITATLog(policyIssuance, tatObject, submitRequest.StepsWorkflow.FromNodeId);
        await _policyIssuanceRepository.UpdateData(
            policyIssuance,
            JsonConvert.SerializeObject(policyIssuance),
            policyIssuance.Id,
            "Id");

        await ControllerUtil.LogAction(
            _quotationCommentLogRepository,
            _httpContextAccessor,
            configuration,
            DOMAIN_NAME,
            policyIssuance,
            submitRequest,
            _blobStorageSettings);

        PICAttributes picAttributes = JsonConvert.DeserializeObject<PICAttributes>(policyIssuance.PIC);
        string accountName = Util.PICPicker(picAttributes, submitRequest.StepsWorkflow.ToNodeId);
        //string accountName = submitRequest.StepsWorkflow.ToNodeId switch
        //{
        //    "FO" => picAttributes.FO,
        //    "TS" => picAttributes.TS,
        //    "UW" => picAttributes.UW,
        //    "LMKT" => picAttributes.LMKT,
        //    "PM" => picAttributes.PM,
        //    _ => null
        //};

        ControllerHelper.SignalRResponse(
            _usersSessionRepository,
            "R_ItemSubmitted",
            new { id = policyIssuance.Id, type = "PolicyIssuance" },
            ControllerUtil.GetCurrentContextUser(_httpContextAccessor, configuration),
            DOMAIN_NAME);

        bool attachedMailSent = await PISendAttachedWorkflowMailAsync(submitRequest, policyIssuance);
        if (!attachedMailSent)
        {
            MailTemplate? mailTemplate = await _mailTemplateRepository.GetSingleObject(item => item.TemplateName == "Return Mail");
            Employee? targetEmployee = await FindEmployeeByAccountAsync(accountName);
            if (mailTemplate != null && targetEmployee != null)
            {
                DataTable query = DataUtil.ExecuteSelectQuery(_BaseRepository._connectionString, mailTemplate.MailQuery, ("", ""));
                Dictionary<string, object> flowDictionaryData = query.Rows.Count > 0
                    ? Util.MakeQueryIntoDirectory(query.Rows[0])
                    : new Dictionary<string, object>();
                MailQueue mailQueue = Util.NotifySession(targetEmployee, mailTemplate, _emailSettings, flowDictionaryData, Util.CCAllEmail(_emailSettings.FollowCC, ""), null);
                if (mailQueue != null) await _mailQueueRepository.InsertData(mailQueue);
            }
        }

        long? notificationCloneId = await ControllerUtil.ResolvePolicyIssuanceCloneIdAsync(
            _quotationRepository,
            policyIssuance);

        dynamic transferObject = new
        {
            DOMAIN_NAME,
            Resource = "Assign from ",
            Guid = policyIssuance.Guid,
            ReceivedBy = accountName,
            Id = policyIssuance.Id,
            Code = policyIssuance.PolicyIssuanceCode,
            ModuleName = nameof(PolicyIssuance),
            QuotationId = notificationCloneId,
            CopyFromGuid = policyIssuance.CopyFromGuid
        };

        Notification notification = await SendWorkflowNotificationAsync(
            submitRequest,
            transferObject,
            NotificationTypeKeys.PolicyIssuance,
            policyIssuance.WorkflowStatus);

        return Ok();
    }

    private static string? ReadMailTemplateName(JObject? source)
        => ReadTemplateName(source, ["mailTemplateName", "templateMailName", "mailTemplate"]);

    private static string? ReadNotificationTemplateName(JObject? source)
        => ReadTemplateName(source, ["notificationTemplateName", "templateNotificationName", "notificationTemplate"]);

    private static string? ReadTemplateName(JObject? source, string[] keys)
    {
        if (source == null) return null;

        foreach (string key in keys)
        {
            JToken? token = source.GetValue(key, StringComparison.OrdinalIgnoreCase);
            if (token == null || token.Type == JTokenType.Null) continue;

            if (token.Type == JTokenType.Object)
            {
                JObject templateObject = (JObject)token;
                token = templateObject.GetValue("templateName", StringComparison.OrdinalIgnoreCase)
                    ?? templateObject.GetValue("name", StringComparison.OrdinalIgnoreCase)
                    ?? templateObject.GetValue("value", StringComparison.OrdinalIgnoreCase);
            }

            string value = token?.ToString().Trim() ?? "";
            if (!string.IsNullOrWhiteSpace(value)) return value;
        }

        return null;
    }

    private static JObject? TryReadJsonObject(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        try
        {
            JToken token = JToken.Parse(value);
            while (token.Type == JTokenType.String)
            {
                string nested = token.Value<string>() ?? "";
                if (string.IsNullOrWhiteSpace(nested)) return null;
                token = JToken.Parse(nested);
            }
            return token as JObject;
        }
        catch
        {
            return null;
        }
    }

    private async Task<string?> ResolveAttachedMailTemplateNameAsync(WorkflowTransitionSubmitRequest submitRequest)
        => await ResolveAttachedTemplateNameAsync(submitRequest, ReadMailTemplateName);

    private async Task<string?> ResolveAttachedNotificationTemplateNameAsync(WorkflowTransitionSubmitRequest submitRequest)
        => await ResolveAttachedTemplateNameAsync(submitRequest, ReadNotificationTemplateName);

    private async Task<MailTemplate?> ResolveAttachedMailTemplateAsync(
        WorkflowTransitionSubmitRequest submitRequest)
    {
        long? templateId = submitRequest.StepsWorkflow?.MailTemplateId;
        if (templateId > 0)
        {
            return await _mailTemplateRepository.GetSingleObject(item => item.Id == templateId);
        }

        string? templateName = await ResolveAttachedMailTemplateNameAsync(submitRequest);
        return string.IsNullOrWhiteSpace(templateName)
            ? null
            : await _mailTemplateRepository.GetSingleObject(item => item.TemplateName == templateName);
    }

    private async Task<NotificationTemplate?> ResolveAttachedNotificationTemplateAsync(
        WorkflowTransitionSubmitRequest submitRequest)
    {
        long? templateId = submitRequest.StepsWorkflow?.NotificationTemplateId;
        if (templateId > 0)
        {
            return await _notificationTemplateRepository.GetSingleObject(item => item.Id == templateId);
        }

        string? templateName = await ResolveAttachedNotificationTemplateNameAsync(submitRequest);
        return string.IsNullOrWhiteSpace(templateName)
            ? null
            : await _notificationTemplateRepository.GetSingleObject(item => item.TemplateName == templateName);
    }

    private async Task<string> ResolveWorkflowActionNameAsync(
        WorkflowTransitionSubmitRequest submitRequest)
    {
        StepsWorkflow? step = submitRequest.StepsWorkflow;
        if (step == null) return "";

        Guid workflowDefinitionId = submitRequest.InstanceWorkflow?.WorkflowDefinitionId ?? Guid.Empty;
        if (workflowDefinitionId != Guid.Empty)
        {
            WorkflowDefinition? definition = await _workflowDefinitionRepository.GetSingleObject(
                item => item.Guid == workflowDefinitionId);
            JObject? payload = TryReadJsonObject(definition?.WorkflowNodes);
            JArray? transitions = payload?
                .GetValue("workflowTransitions", StringComparison.OrdinalIgnoreCase) as JArray;
            JObject? selectedTransition = transitions?
                .OfType<JObject>()
                .FirstOrDefault(item =>
                    string.Equals(item.GetValue("fromNodeId", StringComparison.OrdinalIgnoreCase)?.ToString(), step.FromNodeId, StringComparison.OrdinalIgnoreCase)
                    && string.Equals(item.GetValue("toNodeId", StringComparison.OrdinalIgnoreCase)?.ToString(), step.ToNodeId, StringComparison.OrdinalIgnoreCase)
                    && (string.IsNullOrWhiteSpace(step.ActionCode)
                        || string.Equals(item.GetValue("actionCode", StringComparison.OrdinalIgnoreCase)?.ToString(), step.ActionCode, StringComparison.OrdinalIgnoreCase)));

            string? actionName = selectedTransition?
                .GetValue("actionName", StringComparison.OrdinalIgnoreCase)?
                .ToString()
                .Trim();
            if (!string.IsNullOrWhiteSpace(actionName)) return actionName;
        }
        if (!string.IsNullOrWhiteSpace(step.StepName)) return step.StepName;
        if (!string.IsNullOrWhiteSpace(step.ActionCode)) return step.ActionCode;
        return step.StatusName ?? "";
    }

    private async Task<string?> ResolveAttachedTemplateNameAsync(
        WorkflowTransitionSubmitRequest submitRequest,
        Func<JObject?, string?> readTemplateName)
    {
        string? configuredName = readTemplateName(TryReadJsonObject(submitRequest.StepsWorkflow?.CommandConfig));
        if (!string.IsNullOrWhiteSpace(configuredName)) return configuredName;

        Guid workflowDefinitionId = submitRequest.InstanceWorkflow?.WorkflowDefinitionId ?? Guid.Empty;
        if (workflowDefinitionId == Guid.Empty) return null;

        WorkflowDefinition? definition = await _workflowDefinitionRepository.GetSingleObject(
            item => item.Guid == workflowDefinitionId);
        JObject? payload = TryReadJsonObject(definition?.WorkflowNodes);
        if (payload == null) return null;

        StepsWorkflow step = submitRequest.StepsWorkflow;
        JArray? transitions = payload.GetValue("workflowTransitions", StringComparison.OrdinalIgnoreCase) as JArray;
        JObject? selectedTransition = transitions?
            .OfType<JObject>()
            .FirstOrDefault(item =>
                string.Equals(item.GetValue("fromNodeId", StringComparison.OrdinalIgnoreCase)?.ToString(), step.FromNodeId, StringComparison.OrdinalIgnoreCase)
                && string.Equals(item.GetValue("toNodeId", StringComparison.OrdinalIgnoreCase)?.ToString(), step.ToNodeId, StringComparison.OrdinalIgnoreCase)
                && (string.IsNullOrWhiteSpace(step.ActionCode)
                    || string.Equals(item.GetValue("actionCode", StringComparison.OrdinalIgnoreCase)?.ToString(), step.ActionCode, StringComparison.OrdinalIgnoreCase)));

        configuredName = readTemplateName(selectedTransition);
        if (!string.IsNullOrWhiteSpace(configuredName)) return configuredName;

        JArray? nodes = payload.GetValue("workflowNodes", StringComparison.OrdinalIgnoreCase) as JArray;
        JObject? targetNode = nodes?
            .OfType<JObject>()
            .FirstOrDefault(item =>
                string.Equals(item.GetValue("id", StringComparison.OrdinalIgnoreCase)?.ToString(), step.ToNodeId, StringComparison.OrdinalIgnoreCase)
                || string.Equals(item.GetValue("nodeCode", StringComparison.OrdinalIgnoreCase)?.ToString(), step.ToNodeId, StringComparison.OrdinalIgnoreCase));

        configuredName = readTemplateName(targetNode);
        if (!string.IsNullOrWhiteSpace(configuredName)) return configuredName;

        JObject? sourceNode = nodes?
            .OfType<JObject>()
            .FirstOrDefault(item =>
                string.Equals(item.GetValue("id", StringComparison.OrdinalIgnoreCase)?.ToString(), step.FromNodeId, StringComparison.OrdinalIgnoreCase)
                || string.Equals(item.GetValue("nodeCode", StringComparison.OrdinalIgnoreCase)?.ToString(), step.FromNodeId, StringComparison.OrdinalIgnoreCase));

        return readTemplateName(sourceNode);
    }

    private string NormalizeWorkflowAccount(string? account)
    {
        string value = (account ?? "").Trim();
        if (string.IsNullOrWhiteSpace(value)) return "";
        if (!string.IsNullOrWhiteSpace(DOMAIN_NAME))
        {
            value = value.Replace(DOMAIN_NAME, "", StringComparison.OrdinalIgnoreCase);
        }
        int slashIndex = Math.Max(value.LastIndexOf('\\'), value.LastIndexOf('/'));
        return (slashIndex >= 0 ? value[(slashIndex + 1)..] : value).Trim();
    }

    private async Task<Employee?> FindEmployeeByAccountAsync(string? account)
    {
        string normalizedAccount = NormalizeWorkflowAccount(account);
        if (string.IsNullOrWhiteSpace(normalizedAccount)) return null;

        Users? user = await _usersRepository.GetSingleObject(
            item => item.username == normalizedAccount);
        if (user == null) return null;

        return await _employeeRepository.GetSingleObject(item => item.UsersId == user.Id);
    }

    private IEnumerable<string> ExtractAssignedPicAccounts(string? picJson)
    {
        JObject? pic = TryReadJsonObject(picJson);
        if (pic == null) yield break;

        foreach (JProperty property in pic.Properties())
        {
            IEnumerable<string> values = property.Value.Type switch
            {
                JTokenType.Array => property.Value.Values<string>(),
                JTokenType.Object => new[]
                {
                    ((JObject)property.Value).GetValue("account", StringComparison.OrdinalIgnoreCase)?.ToString()
                    ?? ((JObject)property.Value).GetValue("username", StringComparison.OrdinalIgnoreCase)?.ToString()
                    ?? ((JObject)property.Value).GetValue("value", StringComparison.OrdinalIgnoreCase)?.ToString()
                    ?? ""
                },
                _ => new[] { property.Value.ToString() }
            };

            foreach (string value in values)
            {
                foreach (string account in (value ?? "").Split([';', ','], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
                {
                    if (!string.IsNullOrWhiteSpace(account)) yield return account;
                }
            }
        }
    }

    private async Task<bool> SendAttachedWorkflowMailAsync(WorkflowTransitionSubmitRequest submitRequest, Quotation quotation)
    {
        try
        {
            MailTemplate? mailTemplate = await ResolveAttachedMailTemplateAsync(submitRequest);
            if (mailTemplate == null || !(mailTemplate.IsActive ?? false)) return false;

            Employee? creator = await FindEmployeeByAccountAsync(quotation.CreatedBy);
            if (creator == null || string.IsNullOrWhiteSpace(creator.Email))
            {
                Log.Warning("Workflow mail {TemplateName} was skipped because creator {CreatedBy} has no employee email.", mailTemplate.TemplateName, quotation.CreatedBy);
                return false;
            }

            HashSet<string> ccEmails = new(StringComparer.OrdinalIgnoreCase);
            HashSet<string> seenAccounts = new(StringComparer.OrdinalIgnoreCase)
            {
                NormalizeWorkflowAccount(quotation.CreatedBy)
            };

            foreach (string account in ExtractAssignedPicAccounts(quotation.PIC))
            {
                string normalizedAccount = NormalizeWorkflowAccount(account);
                if (string.IsNullOrWhiteSpace(normalizedAccount) || !seenAccounts.Add(normalizedAccount)) continue;

                Employee? employee = await FindEmployeeByAccountAsync(normalizedAccount);
                if (employee != null
                    && !string.IsNullOrWhiteSpace(employee.Email)
                    && !string.Equals(employee.Email, creator.Email, StringComparison.OrdinalIgnoreCase))
                {
                    ccEmails.Add(employee.Email.Trim());
                }
            }

            foreach (string configuredCc in (mailTemplate.CC ?? "").Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            {
                if (!string.Equals(configuredCc, creator.Email, StringComparison.OrdinalIgnoreCase)) ccEmails.Add(configuredCc);
            }
            foreach (string followCc in Util.CCAllEmail(_emailSettings.FollowCC, "").Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            {
                if (!string.Equals(followCc, creator.Email, StringComparison.OrdinalIgnoreCase)) ccEmails.Add(followCc);
            }

            Dictionary<string, object> templateData = new();
            Dictionary<string, object> paramInObject = new();

            paramInObject["RecordId"] = quotation.Id;
            paramInObject["RecordCode"] = quotation.QuotationCode ?? "";
            paramInObject["QuotationId"] = quotation.Id;
            paramInObject["QuotationCode"] = quotation.QuotationCode ?? "";
            paramInObject["WorkflowStatus"] = quotation.WorkflowStatus ?? "";
            paramInObject["FromNodeId"] = submitRequest.StepsWorkflow?.FromNodeId ?? "";
            paramInObject["ToNodeId"] = submitRequest.StepsWorkflow?.ToNodeId ?? "";
            paramInObject["ActionCode"] = submitRequest.StepsWorkflow?.ActionCode ?? "";
            paramInObject["ActionStatus"] = submitRequest.ActionStatus ?? "";
            paramInObject["Comment"] = submitRequest.Comment ?? "";
            string sql = mailTemplate.MailQuery;

            List<(string, object)> parameters = new();

            foreach (Match match in Regex.Matches(sql, @"\@(\w+)"))
            {
                string paramName = match.Groups[1].Value;

                if (!paramInObject.TryGetValue(paramName, out object? value))
                {
                    throw new Exception($"Parameter '{paramName}' was not found.");
                }

                sql = sql.Replace(match.Value, $"@{paramName}");
                parameters.Add((paramName, value?.ToString() ?? ""));
            }


            if (!string.IsNullOrWhiteSpace(mailTemplate.MailQuery))
            {
                DataTable query = DataUtil.ExecuteSelectQuery(_BaseRepository._connectionString, mailTemplate.MailQuery, parameters.ToArray()); // ("QuotationId", quotation.Id));
                if (query != null)
                    if (query.Rows.Count > 0) templateData = Util.MakeQueryIntoDirectory(query.Rows[0]);
            }
            var paramsObject = new
            {
                url = $"/Business/Form/{nameof(Quotation)}_Form/{quotation.Id}/{quotation.Guid}",
                caption = $"form_{nameof(Quotation)}_Form_{quotation.Id}",
                name = $"{nameof(Quotation)} {quotation.QuotationCode}",
                data = ""
            };

            UrlCall urlCall = new UrlCall();
            urlCall.Folder = "Business";
            urlCall.Module = "Form";
            urlCall.Controller = $"{nameof(Quotation)}";
            urlCall.Action = "Index";
            urlCall.TypeAction = "View";
            urlCall.Token = "";
            urlCall.RecordGuidId = quotation.Guid;
            urlCall.Params = JsonConvert.SerializeObject(paramsObject);
            urlCall.ExpireTime = DateTime.Now.AddDays(2);
            urlCall.Expired = false;

            urlCall = await _urlCallRepository.InsertData(urlCall);


            urlCall = await _urlCallRepository.GetSingleObject(s => s.RecordGuidId == quotation.Guid);
            if (urlCall != null)
            {
                //string redirectMainView = System.IO.Path.Combine(REDIRECT_MAIN_VIEW, typeof(UrlCall).Name, "ReturnView");
                string redirectMainView = $"{_urlConfig.RedirectMainView}{typeof(UrlCall).Name}{"/ReturnView"}";
                redirectMainView += $"?guid={urlCall.Guid}";
                //parameters.Add(("urlCallView", redirectMainView));
                mailTemplate.TemplateContent = mailTemplate.TemplateContent.Replace("urlCallView", redirectMainView);
            }
            templateData["RecordId"] = quotation.Id;
            templateData["RecordCode"] = quotation.QuotationCode ?? "";
            templateData["QuotationId"] = quotation.Id;
            templateData["QuotationCode"] = quotation.QuotationCode ?? "";
            templateData["WorkflowStatus"] = quotation.WorkflowStatus ?? "";
            templateData["FromNodeId"] = submitRequest.StepsWorkflow?.FromNodeId ?? "";
            templateData["ToNodeId"] = submitRequest.StepsWorkflow?.ToNodeId ?? "";
            templateData["ActionCode"] = submitRequest.StepsWorkflow?.ActionCode ?? "";
            templateData["ActionStatus"] = submitRequest.ActionStatus ?? "";
            templateData["Comment"] = submitRequest.Comment ?? "";

            MailItem mailItem = new()
            {
                ToName = creator.FullName,
                ToEmail = creator.Email,
                Subject = $"{MailUtil.TitleContentHandle(mailTemplate.PrefixTitleMail, templateData)} {MailUtil.TitleContentHandle(mailTemplate.TemplateMailTitle, templateData)}".Trim(),
                HtmlBody = MailUtil.BodyContentHandle(mailTemplate.TemplateContent, templateData),
                TextBody = "",
                CC = string.Join(';', ccEmails),
                BCC = mailTemplate.BCC ?? ""
            };

           


            MailUtil.SendEmail(_emailSettings, mailItem, null).Wait();
            MailQueue mailQueue = Util.MakeMailQueueItem(mailItem, _emailSettings, null, "Workflow");
            await _mailQueueRepository.InsertData(mailQueue);
            return true;
        }
        catch (Exception ex)
        {
            Log.Error(ex, "Unable to send attached workflow mail for quotation {QuotationId}.", quotation.Id);
            return false;
        }
    }

    private async Task<bool> PISendAttachedWorkflowMailAsync(WorkflowTransitionSubmitRequest submitRequest, PolicyIssuance quotation)
    {
        try
        {
            MailTemplate? mailTemplate = await ResolveAttachedMailTemplateAsync(submitRequest);
            if (mailTemplate == null || !(mailTemplate.IsActive ?? false)) return false;

            Employee? creator = await FindEmployeeByAccountAsync(quotation.CreatedBy);
            if (creator == null || string.IsNullOrWhiteSpace(creator.Email))
            {
                Log.Warning("Workflow mail {TemplateName} was skipped because creator {CreatedBy} has no employee email.", mailTemplate.TemplateName, quotation.CreatedBy);
                return false;
            }

            HashSet<string> ccEmails = new(StringComparer.OrdinalIgnoreCase);
            HashSet<string> seenAccounts = new(StringComparer.OrdinalIgnoreCase)
        {
            NormalizeWorkflowAccount(quotation.CreatedBy)
        };

            foreach (string account in ExtractAssignedPicAccounts(quotation.PIC))
            {
                string normalizedAccount = NormalizeWorkflowAccount(account);
                if (string.IsNullOrWhiteSpace(normalizedAccount) || !seenAccounts.Add(normalizedAccount)) continue;

                Employee? employee = await FindEmployeeByAccountAsync(normalizedAccount);
                if (employee != null
                    && !string.IsNullOrWhiteSpace(employee.Email)
                    && !string.Equals(employee.Email, creator.Email, StringComparison.OrdinalIgnoreCase))
                {
                    ccEmails.Add(employee.Email.Trim());
                }
            }

            foreach (string configuredCc in (mailTemplate.CC ?? "").Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            {
                if (!string.Equals(configuredCc, creator.Email, StringComparison.OrdinalIgnoreCase)) ccEmails.Add(configuredCc);
            }
            foreach (string followCc in Util.CCAllEmail(_emailSettings.FollowCC, "").Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            {
                if (!string.Equals(followCc, creator.Email, StringComparison.OrdinalIgnoreCase)) ccEmails.Add(followCc);
            }

            Dictionary<string, object> templateData = new();
            Dictionary<string, object> paramInObject = new();

            paramInObject["RecordId"] = quotation.Id;
            paramInObject["RecordCode"] = quotation.PolicyIssuanceCode ?? "";
            paramInObject["PolicyIssuanceId"] = quotation.Id;
            paramInObject["PolicyIssuanceCode"] = quotation.PolicyIssuanceCode ?? "";
            paramInObject["WorkflowStatus"] = quotation.WorkflowStatus ?? "";
            paramInObject["FromNodeId"] = submitRequest.StepsWorkflow?.FromNodeId ?? "";
            paramInObject["ToNodeId"] = submitRequest.StepsWorkflow?.ToNodeId ?? "";
            paramInObject["ActionCode"] = submitRequest.StepsWorkflow?.ActionCode ?? "";
            paramInObject["ActionStatus"] = submitRequest.ActionStatus ?? "";
            paramInObject["Comment"] = submitRequest.Comment ?? "";
            string sql = mailTemplate.MailQuery;

            List<(string, object)> parameters = new();

            foreach (Match match in Regex.Matches(sql, @"\@(\w+)"))
            {
                string paramName = match.Groups[1].Value;

                if (!paramInObject.TryGetValue(paramName, out object? value))
                {
                    throw new Exception($"Parameter '{paramName}' was not found.");
                }

                sql = sql.Replace(match.Value, $"@{paramName}");
                parameters.Add((paramName, value?.ToString() ?? ""));
            }

            if (!string.IsNullOrWhiteSpace(mailTemplate.MailQuery))
            {
                DataTable query = DataUtil.ExecuteSelectQuery(_BaseRepository._connectionString, mailTemplate.MailQuery, parameters.ToArray()); // ("PolicyIssuanceId", quotation.Id));
                if (query != null)
                    if (query.Rows.Count > 0) templateData = Util.MakeQueryIntoDirectory(query.Rows[0]);
            }
            UrlCall urlCall = new UrlCall();
            urlCall = await _urlCallRepository.GetSingleObject(s => s.RecordGuidId == quotation.Guid);
            if (urlCall != null)
            {
                //string redirectMainView = System.IO.Path.Combine(REDIRECT_MAIN_VIEW, typeof(UrlCall).Name, "ReturnView");
                string redirectMainView = $"{_urlConfig.RedirectMainView}{typeof(UrlCall).Name}{"/ReturnView"}";
                redirectMainView += $"?guid={urlCall.Guid}";
                //parameters.Add(("urlCallView", redirectMainView));
            }
            templateData["RecordId"] = quotation.Id;
            templateData["RecordCode"] = quotation.PolicyIssuanceCode ?? "";
            templateData["PolicyIssuanceId"] = quotation.Id;
            templateData["PolicyIssuanceCode"] = quotation.PolicyIssuanceCode ?? "";
            templateData["WorkflowStatus"] = quotation.WorkflowStatus ?? "";
            templateData["FromNodeId"] = submitRequest.StepsWorkflow?.FromNodeId ?? "";
            templateData["ToNodeId"] = submitRequest.StepsWorkflow?.ToNodeId ?? "";
            templateData["ActionCode"] = submitRequest.StepsWorkflow?.ActionCode ?? "";
            templateData["ActionStatus"] = submitRequest.ActionStatus ?? "";
            templateData["Comment"] = submitRequest.Comment ?? "";

            MailItem mailItem = new()
            {
                ToName = creator.FullName,
                ToEmail = creator.Email,
                Subject = $"{MailUtil.TitleContentHandle(mailTemplate.PrefixTitleMail, templateData)} {MailUtil.TitleContentHandle(mailTemplate.TemplateMailTitle, templateData)}".Trim(),
                HtmlBody = MailUtil.BodyContentHandle(mailTemplate.TemplateContent, templateData),
                TextBody = "",
                CC = string.Join(';', ccEmails),
                BCC = mailTemplate.BCC ?? ""
            };




            MailUtil.SendEmail(_emailSettings, mailItem, null).Wait();
            MailQueue mailQueue = Util.MakeMailQueueItem(mailItem, _emailSettings, null, "Workflow");
            await _mailQueueRepository.InsertData(mailQueue);
            return true;
        }
        catch (Exception ex)
        {
            Log.Error(ex, "Unable to send attached workflow mail for quotation {PolicyIssuanceId}.", quotation.Id);
            return false;
        }
    }

    private async Task<Notification> SendWorkflowNotificationAsync(
        WorkflowTransitionSubmitRequest submitRequest,
        dynamic fallbackTransferObject,
        string fallbackType,
        string? workflowStatus)
    {
        Type fallbackObjectType = fallbackTransferObject.GetType();
        object? relatedQuotationId = fallbackObjectType.GetProperty("QuotationId")?.GetValue(fallbackTransferObject);
        object? copyFromGuid = fallbackObjectType.GetProperty("CopyFromGuid")?.GetValue(fallbackTransferObject);
        NotificationTemplate? notificationTemplate = await ResolveAttachedNotificationTemplateAsync(submitRequest);
        if (notificationTemplate == null || !(notificationTemplate.IsActive ?? false))
        {
            Log.Warning(
                "Workflow notification template {NotificationTemplateId} was not found, is inactive, or was not configured for {FromNodeId} -> {ToNodeId}.",
                submitRequest.StepsWorkflow?.NotificationTemplateId,
                submitRequest.StepsWorkflow?.FromNodeId,
                submitRequest.StepsWorkflow?.ToNodeId);
            return new Notification();
        }

        Dictionary<string, object> templateData = new();
        if (!string.IsNullOrWhiteSpace(notificationTemplate.NotificationQuery))
        {
            try
            {
                DataTable query = DataUtil.ExecuteSelectQuery(
                    _BaseRepository._connectionString,
                    notificationTemplate.NotificationQuery,
                    ("", ""));
                if (query.Rows.Count > 0)
                {
                    templateData = Util.MakeQueryIntoDirectory(query.Rows[0]);
                }
            }
            catch (Exception ex)
            {
                Log.Error(
                    ex,
                    "Unable to execute notification query for template {NotificationTemplateId} ({TemplateName}).",
                    notificationTemplate.Id,
                    notificationTemplate.TemplateName);
            }
        }

        templateData["RecordId"] = fallbackTransferObject.Id;
        templateData["RecordCode"] = fallbackTransferObject.Code ?? "";
        templateData["QuotationId"] = fallbackTransferObject.Id;
        templateData["QuotationCode"] = fallbackTransferObject.Code ?? "";
        templateData["PolicyIssuanceId"] = fallbackTransferObject.Id;
        templateData["PolicyIssuanceCode"] = fallbackTransferObject.Code ?? "";
        templateData["WorkflowStatus"] = workflowStatus ?? "";
        templateData["FromNodeId"] = submitRequest.StepsWorkflow?.FromNodeId ?? "";
        templateData["ToNodeId"] = submitRequest.StepsWorkflow?.ToNodeId ?? "";
        templateData["ActionCode"] = submitRequest.StepsWorkflow?.ActionCode ?? "";
        templateData["ActionStatus"] = submitRequest.ActionStatus ?? "";
        
        string actionName = await ResolveWorkflowActionNameAsync(submitRequest);
        var userInfo = await ControllerHelper.FetchUserRoles(
            _httpContextAccessor,
            configuration,
            DOMAIN_NAME);
        string performedBy = userInfo.Employee?.FullName ?? "";
        if (string.IsNullOrWhiteSpace(performedBy))
        {
            performedBy = ControllerUtil.GetCurrentContextUser(_httpContextAccessor, configuration) ?? "anonymous";
        }
        string comment = string.IsNullOrWhiteSpace(submitRequest.Comment)
            ? $"No comment from {performedBy}"
            : submitRequest.Comment.Trim();
        templateData["ActionName"] = actionName;
        templateData["PerformedBy"] = performedBy;
        templateData["Comment"] = comment;

        string moduleName = fallbackTransferObject.ModuleName?.ToString() ?? nameof(Quotation);
        string recordCode = fallbackTransferObject.Code?.ToString() ?? "";
        string titleTemplate = MailUtil.TitleContentHandle(notificationTemplate.Title, templateData).Trim();
        string title;
        try
        {
            title = string.Format(
                titleTemplate,
                moduleName,
                recordCode,
                actionName,
                performedBy);
        }
        catch (FormatException ex)
        {
            Log.Error(
                ex,
                "Invalid title format for notification template {NotificationTemplateId} ({TemplateName}).",
                notificationTemplate.Id,
                notificationTemplate.TemplateName);
            title = titleTemplate;
        }

        string contentTemplate = notificationTemplate.Content ?? "";
        string message = comment;
        if (contentTemplate.Contains("<comment>", StringComparison.OrdinalIgnoreCase))
        {
            contentTemplate = contentTemplate.Replace(
                "<comment>",
                comment,
                StringComparison.OrdinalIgnoreCase);
            message = MailUtil.BodyContentHandle(contentTemplate, templateData).Trim();
        }

        dynamic transferObject = new
        {
            DOMAIN_NAME,
            Title = title,
            Message = message,
            Resource = fallbackTransferObject.Resource,
            Guid = fallbackTransferObject.Guid,
            ReceivedBy = fallbackTransferObject.ReceivedBy,
            Id = fallbackTransferObject.Id,
            Code = fallbackTransferObject.Code,
            ModuleName = fallbackTransferObject.ModuleName,
            QuotationId = relatedQuotationId,
            CopyFromGuid = copyFromGuid
        };
        long? notificationTypeId = notificationTemplate.TypeId
            ?? await ResolveWorkflowNotificationTypeId(
                submitRequest.StepsWorkflow,
                submitRequest.InstanceWorkflow,
                fallbackType);

        if (submitRequest.isEmail ?? false)
        {
            Notification notification = await ControllerUtil.NotifySameEmail(
                new Notification(),
                transferObject,
                notificationTypeId);
            await _notificationRepository.InsertData(notification);
            return notification;
        }


        foreach (string item in transferObject.ReceivedBy.Split(','))
        {
            NotificationRequest notification = new NotificationRequest();
            Notification Notification = new Notification();

            Notification = ControllerUtil.BuildNotification(
                transferObject,
                notificationTypeId,
                item,
                notificationTemplate,
                callerName: nameof(SendWorkflowNotificationAsync)
                );


            notification.Notification = Notification;
            notification.connectionId = item;
            notification.tabPublicUrl = ControllerUtil.NotificationURLObjectMaking(transferObject);

            await _notificationRepository.InsertData(Notification);
            await ControllerHelper.SignalRResponse(_usersSessionRepository, "R_NotificationReceive",
            new
            {
                title = transferObject.Title,
                message = transferObject.Message
            }
            , item, DOMAIN_NAME);
        }



        return new Notification();
        //return await ControllerUtil.Notify(transferObject, notificationTypeId);


    }

    private async Task<long?> ResolveWorkflowNotificationTypeId(
        StepsWorkflow? stepsWorkflow,
        InstanceWorkflow? instanceWorkflow,
        string fallbackType)
    {
        WorkflowDefinition? workflowDefinition = null;
        if (instanceWorkflow != null)
        {
            workflowDefinition = await _workflowDefinitionRepository.GetSingleObject(
                definition => definition.Guid == instanceWorkflow.WorkflowDefinitionId);
        }

        string notificationType = NotificationTypeResolver.ResolveWorkflowType(
            stepsWorkflow,
            workflowDefinition,
            fallbackType);

        return await NotificationTypeResolver.ResolveIdAsync(_enumDataRepository, notificationType);
    }

    [HttpPost]
    public async Task<IActionResult> RecoverWorkflow([FromBody] WorkflowRecoverRequest request)
    {
        if (request == null) return BadRequest("Recover payload is required.");

        InstanceWorkflow instanceWorkflow = await _BaseRepository.GetSingleObject(s => s.Id == request.InstanceWorkflowId);
        if (instanceWorkflow == null) return NotFound("InstanceWorkflow not found.");

        WorkflowDefinition workflowDefinition = await _workflowDefinitionRepository.GetSingleObject(
            item => item.Guid == instanceWorkflow.WorkflowDefinitionId);
        if (workflowDefinition == null) return NotFound("WorkflowDefinition not found.");

        string normalizedFlowType = (workflowDefinition.FlowType ?? "")
            .Replace(" ", "", StringComparison.Ordinal)
            .Replace("-", "", StringComparison.Ordinal);
        bool isQuotationFlow = string.Equals(
            normalizedFlowType,
            nameof(Quotation),
            StringComparison.OrdinalIgnoreCase);
        bool isPolicyIssuanceFlow = string.Equals(
            normalizedFlowType,
            nameof(PolicyIssuance),
            StringComparison.OrdinalIgnoreCase);
        bool isSharedFlow = string.Equals(
            normalizedFlowType,
            "Both",
            StringComparison.OrdinalIgnoreCase);

        if (!isQuotationFlow && !isPolicyIssuanceFlow && !isSharedFlow)
        {
            return BadRequest(
                $"WorkflowDefinition FlowType '{workflowDefinition.FlowType}' is not supported. Expected Quotation, PolicyIssuance, or Both.");
        }

        Quotation? quotation = null;
        PolicyIssuance? policyIssuance = null;
        string? recordType = null;

        if (isQuotationFlow || isSharedFlow)
        {
            quotation = await _quotationRepository.GetSingleObject(
                item => item.Guid == instanceWorkflow.RecordGuid);
            if (quotation != null)
            {
                recordType = nameof(Quotation);
            }
        }

        if (isPolicyIssuanceFlow || (isSharedFlow && quotation == null))
        {
            policyIssuance = await _policyIssuanceRepository.GetSingleObject(
                item => item.Guid == instanceWorkflow.RecordGuid);
            if (policyIssuance != null)
            {
                recordType = nameof(PolicyIssuance);
            }
        }

        if (recordType == null)
        {
            return NotFound(
                $"{workflowDefinition.FlowType} record was not found for RecordGuid {instanceWorkflow.RecordGuid}.");
        }

        bool isRevise = string.Equals(request.Mode, "Revise", StringComparison.OrdinalIgnoreCase);
        string nextCurrentStep = "";
        string nextDeptCode = "";
        string? nextStatusName = null;
        long? nextStatusId = null;

        if (!string.IsNullOrEmpty(request.TargetNodeId))
        {
            nextCurrentStep = request.TargetNodeId;
            nextDeptCode = request.TargetDeptCode ?? "";

            if (isRevise)
            {
                var startStep = await _stepsWorkflowRepository.GetSingleObject(s => s.WorkflowDefinitionId == instanceWorkflow.WorkflowDefinitionId && (s.IsStart ?? false));
                if (startStep != null)
                {
                    nextCurrentStep = !string.IsNullOrEmpty(startStep.TNodeId) ? startStep.TNodeId : startStep.FNodeId;
                    nextDeptCode = startStep.ToNodeId;
                    nextStatusName = startStep.StatusName;
                    nextStatusId = startStep.StatusId;
                }
            }
            else
            {
                var matchingStep = await _stepsWorkflowRepository.GetSingleObject(s =>
                    s.WorkflowDefinitionId == instanceWorkflow.WorkflowDefinitionId
                    && (s.FNodeId == request.TargetNodeId || s.TNodeId == request.TargetNodeId));
                if (matchingStep == null)
                {
                    return BadRequest("Target node does not belong to the InstanceWorkflow definition.");
                }

                if (string.IsNullOrEmpty(nextDeptCode))
                {
                    nextDeptCode = (matchingStep.FNodeId == request.TargetNodeId)
                        ? matchingStep.FromNodeId
                        : matchingStep.ToNodeId;
                }
            }
        }
        else
        {
            StepsWorkflow selectedStep = await _stepsWorkflowRepository.GetSingleObject(s => s.Id == request.StepsWorkflowId);
            if (selectedStep == null) return NotFound("StepsWorkflow not found.");
            if (selectedStep.WorkflowDefinitionId != instanceWorkflow.WorkflowDefinitionId)
            {
                return BadRequest("StepsWorkflow does not belong to the InstanceWorkflow definition.");
            }

            StepsWorkflow targetStep = selectedStep;
            if (isRevise)
            {
                targetStep = await _stepsWorkflowRepository.GetSingleObject(s => s.WorkflowDefinitionId == instanceWorkflow.WorkflowDefinitionId && (s.IsStart ?? false))
                    ?? selectedStep;
            }

            nextCurrentStep = isRevise
                ? (!string.IsNullOrEmpty(targetStep.TNodeId) ? targetStep.TNodeId : targetStep.FNodeId)
                : (!string.IsNullOrEmpty(targetStep.FNodeId) ? targetStep.FNodeId : targetStep.TNodeId);
            nextDeptCode = isRevise ? targetStep.ToNodeId : targetStep.FromNodeId;
            nextStatusName = targetStep.StatusName;
            nextStatusId = targetStep.StatusId;
        }

        if (string.IsNullOrEmpty(nextCurrentStep)) return BadRequest("Target step does not have a valid workflow node id.");

        instanceWorkflow.CurrentStep = nextCurrentStep;
        await _BaseRepository.UpdateData(instanceWorkflow, JsonConvert.SerializeObject(instanceWorkflow), instanceWorkflow.Id, "Id");

        if (quotation != null)
        {
            quotation.StageDept = nextDeptCode;
            quotation.StageAccount = ResolveStageAccount(quotation.PIC, nextDeptCode);
            if (isRevise)
            {
                quotation.WorkflowStatus = nextStatusName ?? quotation.WorkflowStatus;
                quotation.StatusId = nextStatusId;
            }
            else
            {
                quotation.WorkflowStatus = "Recover";
            }
            quotation.ActionStatus = "";
            await _quotationRepository.UpdateData(quotation, JsonConvert.SerializeObject(quotation), quotation.Id, "Id");
        }

        if (policyIssuance != null)
        {
            policyIssuance.StageDept = nextDeptCode;
            policyIssuance.StageAccount = ResolveStageAccount(policyIssuance.PIC, nextDeptCode);
            if (isRevise)
            {
                policyIssuance.WorkflowStatus = nextStatusName ?? policyIssuance.WorkflowStatus;
                policyIssuance.StatusId = nextStatusId;
            }
            else
            {
                policyIssuance.WorkflowStatus = "Recover";
            }

            policyIssuance.ActionStatus = "";
            await _policyIssuanceRepository.UpdateData(
                policyIssuance,
                JsonConvert.SerializeObject(policyIssuance),
                policyIssuance.Id,
                "Id");
        }

        string recoveredStageDept = quotation?.StageDept ?? policyIssuance?.StageDept ?? "";
        string recoveredStageAccount = quotation?.StageAccount ?? policyIssuance?.StageAccount ?? "";

        return Ok(new
        {
            instanceWorkflow.Id,
            instanceWorkflow.RecordGuid,
            instanceWorkflow.WorkflowDefinitionId,
            CurrentStep = instanceWorkflow.CurrentStep,
            StageDept = recoveredStageDept,
            StageAccount = recoveredStageAccount,
            QuotationStageDept = quotation?.StageDept,
            QuotationStageAccount = quotation?.StageAccount,
            QuotationWorkflowStatus = quotation?.WorkflowStatus,
            QuotationStatusId = quotation?.StatusId,
            PolicyIssuanceStageDept = policyIssuance?.StageDept,
            PolicyIssuanceStageAccount = policyIssuance?.StageAccount,
            PolicyIssuanceWorkflowStatus = policyIssuance?.WorkflowStatus,
            PolicyIssuanceStatusId = policyIssuance?.StatusId,
            RecordType = recordType,
            WorkflowFlowType = workflowDefinition.FlowType,
            Mode = isRevise ? "Revise" : "Recover",
            TargetNodeId = nextCurrentStep,
            TargetDeptCode = nextDeptCode,
            request.Note
        });
    }

    private static string ResolveStageAccount(string? picJson, string? stageDept)
    {
        if (string.IsNullOrWhiteSpace(picJson) || string.IsNullOrWhiteSpace(stageDept))
        {
            return "";
        }

        try
        {
            var pic = JObject.Parse(picJson);
            return pic.GetValue(stageDept, StringComparison.OrdinalIgnoreCase)?.ToString().Trim() ?? "";
        }
        catch (JsonException ex)
        {
            Log.Warning(ex, "Cannot recover StageAccount from PIC for department {StageDept}.", stageDept);
            return "";
        }
    }

    public async Task TATLog([FromBody]Quotation quotation, [FromQuery] TurnAroundItem tatObject, string department)
    {
         TurnAroundTimeSession activeSession = new TurnAroundTimeSession();
            activeSession = await _turnAroundTimeSessionRepository
            .GetSingleObject(s => s.RecordGuid == quotation.Guid);


                if (activeSession == null)
                {
                    // Đếm số phiên đã có để tính SessionNo tiếp theo
                    var allSessions = await _turnAroundTimeSessionRepository
                        .GetListObject(s => s.RecordGuid == quotation.Guid);

            int nextSessionNo = (allSessions?.Count ?? 0) + 1;

            activeSession = new TurnAroundTimeSession
                    {
                        SessionNo = nextSessionNo,
                        SessionTypeId = quotation.RequestTypeId,   // truyền từ client: New=1 / Renew=2 / Amend=3
                        SessionStartDate = tatObject.AcceptDate,
                        SessionEndDate = tatObject.CompleteDate,
                        TotalDays = 0,
                        RecordGuid = quotation.Guid
        };
        await _turnAroundTimeSessionRepository.InsertData(activeSession);
                    // Sau insert, activeSession.Id đã được gán bởi EF/repository
                }
                else
        {
            // Đếm số phiên đã có để tính SessionNo tiếp theo
            var allSessions = await _turnAroundTimeSessionRepository
                .GetListObject(s => s.RecordGuid == quotation.Guid);


            activeSession.SessionNo = activeSession.SessionNo;
            activeSession.SessionTypeId = quotation.RequestTypeId;   // truyền từ client: New=1 / Renew=2 / Amend=3
            activeSession.SessionStartDate = activeSession.SessionStartDate;
            activeSession.SessionEndDate = tatObject.CompleteDate;
            activeSession.TotalDays = 0;
            activeSession.RecordGuid = quotation.Guid;
            await _turnAroundTimeSessionRepository.UpdateData(activeSession, JsonConvert.SerializeObject(activeSession), activeSession.Id, "Id");
            // Sau insert, activeSession.Id đã được gán bởi EF/repository
        }

        // Bước 2 — Tìm hoặc tạo DeptProcessing cho phòng ban đang submit
        TurnAroundTimeDeptProcessing deptProcessing = new TurnAroundTimeDeptProcessing();

        DateTime acceptDate = tatObject.AcceptDate ?? DateTime.Now;
        DateTime completeDate = tatObject.CompleteDate ?? DateTime.Now;
        int processingDays = (completeDate.Date - acceptDate.Date).Days;  // đơn vị ngày

        // Chưa có → tạo mới
        deptProcessing = new TurnAroundTimeDeptProcessing
        {
            TurnAroundTimeSessionId = activeSession.Id,
            Department = department,
            AcceptDate = acceptDate,
            CompleteDate = completeDate,
            ProcessingDays = processingDays
        };
        await _turnAroundTimeDeptProcessingRepository.InsertData(deptProcessing);

        }

    public async Task PITATLog([FromBody] PolicyIssuance quotation, [FromQuery] TurnAroundItem tatObject, string department)
    {
        TurnAroundTimeSession activeSession = new TurnAroundTimeSession();
        activeSession = await _turnAroundTimeSessionRepository
        .GetSingleObject(s => s.RecordGuid == quotation.Guid);


        if (activeSession == null)
        {
            // Đếm số phiên đã có để tính SessionNo tiếp theo
            var allSessions = await _turnAroundTimeSessionRepository
                .GetListObject(s => s.RecordGuid == quotation.Guid);

            int nextSessionNo = (allSessions?.Count ?? 0) + 1;

            activeSession = new TurnAroundTimeSession
            {
                SessionNo = nextSessionNo,
                SessionTypeId = quotation.RequestTypeId,   // truyền từ client: New=1 / Renew=2 / Amend=3
                SessionStartDate = tatObject.AcceptDate,
                SessionEndDate = tatObject.CompleteDate,
                TotalDays = 0,
                RecordGuid = quotation.Guid
            };
            await _turnAroundTimeSessionRepository.InsertData(activeSession);
            // Sau insert, activeSession.Id đã được gán bởi EF/repository
        }
        else
        {
            // Đếm số phiên đã có để tính SessionNo tiếp theo
            var allSessions = await _turnAroundTimeSessionRepository
                .GetListObject(s => s.RecordGuid == quotation.Guid);


            activeSession.SessionNo = activeSession.SessionNo;
            activeSession.SessionTypeId = quotation.RequestTypeId;   // truyền từ client: New=1 / Renew=2 / Amend=3
            activeSession.SessionStartDate = activeSession.SessionStartDate;
            activeSession.SessionEndDate = tatObject.CompleteDate;
            activeSession.TotalDays = 0;
            activeSession.RecordGuid = quotation.Guid;
            await _turnAroundTimeSessionRepository.UpdateData(activeSession, JsonConvert.SerializeObject(activeSession), activeSession.Id, "Id");
            // Sau insert, activeSession.Id đã được gán bởi EF/repository
        }

        // Bước 2 — Tìm hoặc tạo DeptProcessing cho phòng ban đang submit
        TurnAroundTimeDeptProcessing deptProcessing = new TurnAroundTimeDeptProcessing();

        DateTime acceptDate = tatObject.AcceptDate ?? DateTime.Now;
        DateTime completeDate = tatObject.CompleteDate ?? DateTime.Now;
        int processingDays = (completeDate.Date - acceptDate.Date).Days;  // đơn vị ngày

        // Chưa có → tạo mới
        deptProcessing = new TurnAroundTimeDeptProcessing
        {
            TurnAroundTimeSessionId = activeSession.Id,
            Department = department,
            AcceptDate = acceptDate,
            CompleteDate = completeDate,
            ProcessingDays = processingDays
        };
        await _turnAroundTimeDeptProcessingRepository.InsertData(deptProcessing);

    }
   

    public class TransferFileConfig
    {
        public string? SourceDepartment { get; set; }
        public string? TargetDepartment { get; set; }
        public string? Strategy { get; set; } // Latest
        public string? FileSelector { get; set; } // First
    }

    public class WorkflowRecoverRequest
    {
        public long InstanceWorkflowId { get; set; }
        public long? StepsWorkflowId { get; set; }
        public string? TargetNodeId { get; set; }
        public string? TargetDeptCode { get; set; }
        public string? Mode { get; set; }
        public string? Note { get; set; }
    }
}

