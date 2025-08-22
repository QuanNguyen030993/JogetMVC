using Microsoft.AspNetCore.Mvc;
using SurveyReportRE.Controllers.Base;
using SurveyReportRE.Models.Migration.Business.LCForm;
using Newtonsoft.Json;
using SurveyReportRE.Models.Request;
using SurveyReportRE.ControllerUtil;
using SurveyReportRE.Models.Migration.Config;
using RESurveyTool.Common.Common;
[ApiController]
[Route("api/[controller]/[action]")]
public class LossControlController : BaseControllerApi<LossControl>
{
    private readonly IBaseRepository<LossControl> _BaseRepository;
	private readonly IConfiguration configuration;

	public LossControlController(IBaseRepository<LossControl> BaseRepository, IConfiguration config,IHttpContextAccessor httpContextAccessor) : base(BaseRepository,httpContextAccessor)
    {
        configuration = config;
        _BaseRepository = BaseRepository;
    }
    [HttpPost]
    public override async Task<IActionResult> InsertData([FromForm] InsertFormCollection form)
    {
        var entity = new LossControl();
        JsonConvert.PopulateObject(form.values, entity);
        IBaseRepository<FormatCodeNo> _formatCodeNoRepository = new BaseRepository<FormatCodeNo>(configuration, _httpContextAccessor);
        List<FormatCodeNo> tableConfig = new List<FormatCodeNo>();

        tableConfig = await _formatCodeNoRepository.GetListObjectFullInclude(l => l.NoSeqCode == "LossControlCode");
        

        entity.LossControlNo = ControllerUtil.GenerateNumberSeq(tableConfig, _formatCodeNoRepository, nameof(LossControl));
        entity = await _BaseRepository.InsertData(entity);
        return Ok(entity);
    }
    [HttpGet("{id}")]
    public async Task<ActionResult> DownloadPowerpoint(long? id)
    {
        var stream = new MemoryStream(); //  cứ xem là 1 đường dẫn 
        LossControl lossControl = new LossControl();
        lossControl = await _BaseRepository.GetSingleObject(s => s.Id == id );
        //surveyData = await _BaseRepository.IncludeListsOnly(surveyData);
        //var pathExportFile = System.IO.Path.Combine(BLOB_PATH, nameof(Survey), $"{surveyData.SurveyNo}.docx");
        var inputFilePath = "D:\\output.pptx";
        string typeError = "FileNotFound";
        if (!System.IO.File.Exists(inputFilePath))
        {
            //// Kiểm tra dung lượng file
            //if (survey.WordRendered ?? false)
            //{
            //    // Đọc file vào stream
            //    using (var fileStream = System.IO.File.OpenRead(pathExportFile))
            //    {
            //        await fileStream.CopyToAsync(stream);
            //    }
            //}
            //else
            //{
            //    typeError = "FileNotFound";
            //    Response.Headers.Add("X-Error-Message", $"Please try \"Update Report\" once !");
            //    Response.Headers.Add("X-Error-Type", typeError);
            //    return StatusCode(500);
            //}
        }
        else
        {
            //WordHandleConfig wordHandleConfig = new WordHandleConfig();
            //wordHandleConfig.BlobPath = BLOB_PATH;
            //wordHandleConfig.MainProcessPathFolder = nameof(Survey);
            //wordHandleConfig.LabelWordPath = LABEL_WORD_PATH;
            //wordHandleConfig.LogoWordPath = LOGO_WORD_PATH;
            //wordHandleConfig.NoImagePath = NO_IMAGE;
            stream = PowerPointHelper.GeneratePowerPoint(lossControl,_BaseRepository._connectionString);
        }
        stream.Seek(0, SeekOrigin.Begin);
        return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.presentationml.presentation");
    }
}

