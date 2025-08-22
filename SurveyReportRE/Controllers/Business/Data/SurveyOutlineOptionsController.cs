using DocumentFormat.OpenXml.Office.CustomUI;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using SurveyReportRE.Controllers.Base;
using SurveyReportRE.Models.Migration.Business.Data;
using SurveyReportRE.Models.Migration.Business.MasterData;
using SurveyReportRE.Models.Request;
using System.Linq;

[ApiController]
[Route("api/[controller]/[action]")]
public class SurveyOutlineOptionsController : BaseControllerApi<SurveyOutlineOptions>
{
    private readonly IBaseRepository<SurveyOutlineOptions> _BaseRepository;
    private readonly IConfiguration configuration;
    private readonly IBaseRepository<Outline> _outlineRepository;

    public SurveyOutlineOptionsController(IBaseRepository<SurveyOutlineOptions> BaseRepository, IConfiguration config, IHttpContextAccessor httpContextAccessor) : base(BaseRepository, httpContextAccessor)
    {
        configuration = config;
        _BaseRepository = BaseRepository;
        _outlineRepository = new BaseRepository<Outline>(config, httpContextAccessor);
    }
    [HttpGet("{surveyId}/{surveyTypeId}")]
    public async Task<IActionResult> GetMainOutLineList(long surveyId, long surveyTypeId)
    {
        string placeholderChoosing = configuration["CoreConfig:MainPlaceHolderChoosing"];
        string[] placeholders = placeholderChoosing.Split(',');
        List<SurveyOutlineOptions> surveyOutlineOptions = new List<SurveyOutlineOptions>();
        List<Outline> mainOutlines = new List<Outline>();
        mainOutlines = await _outlineRepository.GetListObject(l => l.SurveyTypeId == surveyTypeId && l.ParentId == null);
        mainOutlines = mainOutlines.Where(w => placeholders.Contains(w.PlaceHolder)).ToList();


        if (surveyId == 0)
        {
            surveyOutlineOptions = mainOutlines.Select(s =>
            {
                SurveyOutlineOptions surveyOutlineOptions = new SurveyOutlineOptions
                {
                    OutlineId = s.Id,
                    MainEnable = false
                };
                return surveyOutlineOptions;
            }).ToList();
        }
        else
        {
            surveyOutlineOptions = await _BaseRepository.GetListObject(l => l.SurveyId == surveyId);
        }
        return Ok(mainOutlines.Select(s => new { id = s.Id, mainEnable = surveyOutlineOptions.Count > 0 ? surveyOutlineOptions.First(a => a.OutlineId == s.Id).MainEnable : false, outline = s.Content, placeholder = s.PlaceHolder }).ToList());
    }

    [HttpGet("{surveyId}/{surveyTypeId}")]
    public async Task<IActionResult> GetMainOutLineListInclude(long surveyId, long surveyTypeId)
    {
        string placeholderChoosing = configuration["CoreConfig:MainPlaceHolderChoosing"];
        string[] placeholders = placeholderChoosing.Split(',');
        List<SurveyOutlineOptions> surveyOutlineOptions = new List<SurveyOutlineOptions>();
        List<Outline> mainOutlines = new List<Outline>();
        mainOutlines = await _outlineRepository.GetListObject(l => l.SurveyTypeId == surveyTypeId && l.ParentId == null);
        mainOutlines = mainOutlines.Where(w => placeholders.Contains(w.PlaceHolder)).ToList();

        if (surveyId == 0)
        {
            surveyOutlineOptions = mainOutlines.Select(s =>
            {
                SurveyOutlineOptions surveyOutlineOptions = new SurveyOutlineOptions
                {
                    OutlineId = s.Id,
                    MainEnable = false,
                    OutlineFK = s
                };
                return surveyOutlineOptions;
            }).ToList();
        }
        else
        {
            surveyOutlineOptions = await _BaseRepository.GetListObject(l => l.SurveyId == surveyId);
            surveyOutlineOptions.ForEach(async f =>
            {
                f = await _BaseRepository.ObjectSpecificInclude(f, f => f.OutlineFK);
            });
        }
        return Ok(mainOutlines.Select(s => new { id = s.Id, outlineFK = s, mainEnable = surveyOutlineOptions.Count > 0 ? surveyOutlineOptions.First(a => a.OutlineId == s.Id).MainEnable : false, outline = s.Content, placeholder = s.PlaceHolder }).ToList());
    }


    [HttpPost]
    public async Task<IActionResult> UpdateMainOutlineList([FromBody] SurveyMainOutline surveyMainOutline)
    {
        string placeholderChoosing = configuration["CoreConfig:MainPlaceHolderChoosing"];
        string[] placeholders = placeholderChoosing.Split(',');
        List<SurveyOutlineOptions> surveyOutlineOptions = new List<SurveyOutlineOptions>();
        surveyOutlineOptions = await _BaseRepository.GetListObject(l => l.SurveyId == surveyMainOutline.SurveyId);
        surveyOutlineOptions.ForEach(async f => {
            f = await _BaseRepository.ObjectSpecificInclude(f,f => f.OutlineFK);
        });
        if (surveyOutlineOptions.Any(w => placeholders.Contains(w.OutlineFK?.PlaceHolder)))
            {
            surveyOutlineOptions = surveyOutlineOptions.Where(w => placeholders.Contains(w.OutlineFK?.PlaceHolder)).ToList();
            surveyOutlineOptions.ForEach(f =>
            {
                f.MainEnable = surveyMainOutline.MainOutlines.Any(a => a.Id == f.OutlineId) ? true : false;
                _BaseRepository.UpdateData(f, JsonConvert.SerializeObject(f), f.Id, "Id");
            }); 
        }
        return Ok();
    }
}

