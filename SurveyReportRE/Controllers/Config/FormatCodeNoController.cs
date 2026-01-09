using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using ERPCore.Controllers.Base;
using ERPCore.Models.Business.Migration.Config;
using ERPCore.Models.Migration.Config;
namespace ERPCore.Controllers.Config
{
    [Route("api/[controller]/[action]")]
    [ApiController]
    public class FormatCodeNoController : BaseControllerApi<FormatCodeNo>
    {
        private readonly IBaseRepository<FormatCodeNo> _BaseRepository;

        public FormatCodeNoController(IBaseRepository<FormatCodeNo> BaseRepository,IHttpContextAccessor httpContextAccessor) : base(BaseRepository,httpContextAccessor)
        {
            _BaseRepository = BaseRepository;
        }
        public override async Task<ActionResult<List<dynamic>>> GetSystemScheme()
        {
            var entity = new FormatCodeNo();
            dynamic Base = await _BaseRepository.GetSystemScheme(entity);
            List<DataGridConfig> dataGridConfigs = new List<DataGridConfig>();
            dataGridConfigs.AddRange(JsonConvert.DeserializeObject<List<DataGridConfig>>(JsonConvert.SerializeObject(Base)));
            dataGridConfigs = dataGridConfigs.Select(s => { if (s.DataField == "sysTableId") { s.DataType = "table"; }; return s; }).ToList();
            return Ok(dataGridConfigs);
        }
    }
}