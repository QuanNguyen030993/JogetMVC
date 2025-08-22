using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using SurveyReportRE.Controllers.Base;
using SurveyReportRE.Models.Business.Migration.Config;
using SurveyReportRE.Models.Migration.Config;
using System.Dynamic;
namespace SurveyReportRE.Controllers.Config
{
    [Route("api/[controller]/[action]")]
    [ApiController]
    public class EnumDataController : BaseControllerApi<EnumData>
    {
        private readonly IBaseRepository<EnumData> _BaseRepository;

        public EnumDataController(IBaseRepository<EnumData> BaseRepository,IHttpContextAccessor httpContextAccessor) : base(BaseRepository,httpContextAccessor)
        {
            _BaseRepository = BaseRepository;
        }
        public override async Task<ActionResult<List<dynamic>>> GetSystemScheme()
        {
            var entity = new EnumData();
            dynamic Base = await _BaseRepository.GetSystemScheme(entity);
            List<DataGridConfig> dataGridConfigs = new List<DataGridConfig>();
            dataGridConfigs.AddRange(JsonConvert.DeserializeObject<List<DataGridConfig>>(JsonConvert.SerializeObject(Base)));
            dataGridConfigs.ForEach(f => {
                if (f.DataField == "key"
                )
                {
                    f.Fixed = true;
                    f.FixedPosition = "left";
                }
            });
            dataGridConfigs = dataGridConfigs.Select(s => { if (s.DataField == "sysTableId") { s.DataType = "table"; }; return s; }).ToList();
            return Ok(dataGridConfigs);
        }

    }
}