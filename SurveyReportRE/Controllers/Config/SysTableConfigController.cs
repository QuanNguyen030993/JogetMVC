using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using SurveyReportRE.Controllers.Base;
using SurveyReportRE.Models.Business.Migration.Config;
using SurveyReportRE.Models.Request;
namespace SurveyReportRE.Controllers.Config
{
    [Route("api/[controller]/[action]")]
    [ApiController]
    public class SysTableController : BaseControllerApi<SysTable>
    {
        private readonly IBaseRepository<SysTable> _BaseRepository;

        public SysTableController(IBaseRepository<SysTable> BaseRepository,IHttpContextAccessor httpContextAccessor) : base(BaseRepository,httpContextAccessor)
        {
            _BaseRepository = BaseRepository;
        }

		[HttpPost]
		public override async Task<IActionResult> InsertData([FromForm] InsertFormCollection form)
		{
			SysTable entity = new SysTable();
			JsonConvert.PopulateObject(form.values, entity);
			entity = await _BaseRepository.InsertData(entity);

			await _BaseRepository.ExecuteStoredProcedure("usp_FormGridConfig",
			("@TableName", entity.Name),
			("@TableId", entity.Id));

			return Ok(entity);
		}


        public override async Task<ActionResult<List<dynamic>>> GetSystemScheme()
        {
            var entity = new SysTable();
            dynamic Base = await _BaseRepository.GetSystemScheme(entity);
            List<DataGridConfig> dataGridConfigs = new List<DataGridConfig>();
            dataGridConfigs.AddRange(JsonConvert.DeserializeObject<List<DataGridConfig>>(JsonConvert.SerializeObject(Base)));
            dataGridConfigs.ForEach(f => {
                if (f.DataField == "name")
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