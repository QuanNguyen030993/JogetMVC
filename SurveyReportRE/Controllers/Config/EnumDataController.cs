using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using ERPCore.Controllers.Base;
using ERPCore.Models.Business.Migration.Config;
using ERPCore.Models.Migration.Config;
using System.Dynamic;
namespace ERPCore.Controllers.Config
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
        [HttpGet("{name}")]
        public async Task<IActionResult> FetchEnum(string name)
        {
            var enumDatas = await _BaseRepository.EnumData(name);
            return Ok(enumDatas);
        }
    }
}