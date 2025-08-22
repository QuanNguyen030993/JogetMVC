using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using RESurveyTool.Models.Models.Parsing;
using SurveyReportRE.Common;
using SurveyReportRE.Controllers.Base;
using SurveyReportRE.Models.Migration.Business.Data;
using System.Text;

[ApiController]
[Route("api/[controller]/[action]")]
public class ManagementController : BaseControllerApi<Management>
{
    private readonly IBaseRepository<Management> _BaseRepository;
    private readonly IConfiguration configuration;

    public ManagementController(IBaseRepository<Management> BaseRepository, IConfiguration config, IHttpContextAccessor httpContextAccessor) : base(BaseRepository, httpContextAccessor)
    {
        configuration = config;
        _BaseRepository = BaseRepository;
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetAdditionalOutline(int id)
    {
        var Base = await _BaseRepository.GetObjectByIdAsync(id);
        return Ok(Base.AdditionalOutline);
    }
    [HttpGet("{masterId}/{dynamicOutlineId}")]
    public async Task<IActionResult> DeleteOutline(long masterId, long dynamicOutlineId)
    {
        var Base = await _BaseRepository.GetObjectByIdAsync(masterId);
        List<DynamicOutline> dynamicOutline = new List<DynamicOutline>();
        string jsonString = Encoding.UTF8.GetString(Base.AdditionalOutline);
        dynamicOutline.AddRange(JsonConvert.DeserializeObject<List<DynamicOutline>>(jsonString));
        if (dynamicOutline.Any(a => a.OutlineDynamic.Id == dynamicOutlineId))
        {
            var outlineToRemove = dynamicOutline.FirstOrDefault(a => a.OutlineDynamic.Id == dynamicOutlineId);
            dynamicOutline.Remove(outlineToRemove);
        }
        Base.AdditionalOutline = Util.ConvertObjectToByteArray(dynamicOutline);
        Base = await _BaseRepository.UpdateData(Base, JsonConvert.SerializeObject(Base), Base.Id, "Id");
        return Ok(Base);
    }
}
