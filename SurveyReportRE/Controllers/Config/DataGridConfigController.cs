using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using SurveyReportRE.Common;
using SurveyReportRE.Controllers.Base;
using SurveyReportRE.Models.Business.Migration.Config;
using SurveyReportRE.Models.Request;
using System.Net;
namespace SurveyReportRE.Controllers.Config
{
    [Route("api/[controller]/[action]")]
    [ApiController]
    public class DataGridConfigController : BaseControllerApi<DataGridConfig>
    {
        private readonly IBaseRepository<DataGridConfig> _BaseRepository;
        private readonly IConfiguration _Configuration; 

        public DataGridConfigController(IBaseRepository<DataGridConfig> BaseRepository, IConfiguration configuration,IHttpContextAccessor httpContextAccessor) : base(BaseRepository,httpContextAccessor)
        {
            _BaseRepository = BaseRepository;
            _Configuration = configuration; 
        }

        public IActionResult CacheUsingModel()
        {
            string usingTemplate = _Configuration.GetSection("Cache:FormCacheModel").Value;
            return Ok(usingTemplate);
        }

        public override async Task<ActionResult<List<dynamic>>> GetSystemScheme()
        {
            var entity = new DataGridConfig();
            dynamic Base = await _BaseRepository.GetSystemScheme(entity);
            List<DataGridConfig> dataGridConfigs = new List<DataGridConfig>();
            dataGridConfigs.AddRange(JsonConvert.DeserializeObject<List<DataGridConfig>>(JsonConvert.SerializeObject(Base)));
            dataGridConfigs.ForEach(f => { 
                if (f.DataField == "dataField")
                {
                    f.Fixed = true;
                    f.FixedPosition = "left";
                }
            });
            dataGridConfigs = dataGridConfigs.Select(s => { if (s.DataField == "sysTableId") { s.DataType = "table"; } ; return s; }).ToList();
            return Ok(dataGridConfigs);
        }


        [HttpPut]
        public override HttpResponseMessage UpdateData([FromForm] UpdateFormCollection form)
        {
            var entity = new DataGridConfig();
            var settings = new JsonSerializerSettings
            {
                Converters = new List<JsonConverter> { new FlexibleByteArrayJsonConverter() }
            };

            JsonConvert.PopulateObject(form.values, entity, settings);
            _BaseRepository.UpdateData(entity, form.values, form.key, "Id");
            return new HttpResponseMessage(HttpStatusCode.OK);
        }

        [HttpPost]
        public override async Task<IActionResult> InsertData([FromForm] InsertFormCollection form)
        {
            var entity = new DataGridConfig();
            var settings = new JsonSerializerSettings
            {
                Converters = new List<JsonConverter> { new FlexibleByteArrayJsonConverter() }
            };

            JsonConvert.PopulateObject(form.values, entity, settings);
            entity = await _BaseRepository.InsertData(entity);
            return Ok(entity);
        }
    }
    public class FlexibleByteArrayJsonConverter : JsonConverter
    {
        public override bool CanConvert(Type objectType)
        {
            return objectType == typeof(byte[]);
        }

        public override object ReadJson(JsonReader reader, Type objectType, object existingValue, JsonSerializer serializer)
        {
            if (reader.Value == null)
                return null;

            var input = reader.Value as string;

            if (string.IsNullOrWhiteSpace(input))
                return null;

            if (IsBase64String(input))
            {
                return Convert.FromBase64String(input);
            }

            return System.Text.Encoding.UTF8.GetBytes(input);
        }

        public override void WriteJson(JsonWriter writer, object value, JsonSerializer serializer)
        {
            if (value is byte[] byteArray)
            {
                writer.WriteValue(Convert.ToBase64String(byteArray));
            }
            else
            {
                writer.WriteNull();
            }
        }

        private bool IsBase64String(string input)
        {
            if (string.IsNullOrEmpty(input) || input.Length % 4 != 0)
                return false;

            Span<byte> buffer = stackalloc byte[input.Length];
            return Convert.TryFromBase64String(input, buffer, out _);
        }
    }
}