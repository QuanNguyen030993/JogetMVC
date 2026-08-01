using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using ERPCore.Controllers.Base;
using ERPCore.Models.Business.Migration.Config;
using ERPCore.Models.Migration.Config;
using System.Dynamic;
using Dapper;
using Microsoft.Data.SqlClient;
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
                if (f.DataField == "value"
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

        [HttpPost]
        public async Task<IActionResult> FetchEnumBatch([FromBody] List<string>? names)
        {
            var requestedNames = (names ?? [])
                .Where(name => !string.IsNullOrWhiteSpace(name))
                .Select(name => name.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .Take(100)
                .ToList();

            if (requestedNames.Count == 0)
                return Ok(new Dictionary<string, List<EnumData>>(StringComparer.OrdinalIgnoreCase));

            await using var connection = new SqlConnection(_BaseRepository._connectionString);
            var enumData = (await connection.QueryAsync<EnumData>(@"
                SELECT EnumData.*
                FROM dbo.EnumData WITH (NOLOCK)
                WHERE EnumData.Name IN @Names
                ORDER BY EnumData.Name, EnumData.RowOrder, EnumData.Id",
                new { Names = requestedNames })).ToList();

            var result = requestedNames.ToDictionary(
                name => name,
                name => enumData
                    .Where(item => string.Equals(item.Name, name, StringComparison.OrdinalIgnoreCase))
                    .ToList(),
                StringComparer.OrdinalIgnoreCase);

            return Ok(result);
        }
    }
}
