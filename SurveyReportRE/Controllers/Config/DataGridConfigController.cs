using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using ERPCore.Common;
using ERPCore.Controllers.Base;
using ERPCore.Models.Business.Migration.Config;
using ERPCore.Models.Request;
using System.Net;
namespace ERPCore.Controllers.Config
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

        /// <summary>
        /// Update GridVisibleIndex - Update visible column order in grid layout
        /// </summary>
        /// <param name="gridVisibleIndexConfig">Dictionary with dataField as key and visible index as value</param>
        /// <returns>OK response with updated records count</returns>
        [HttpPost]
        public async Task<IActionResult> UpdateGridVisibleIndex([FromBody] Dictionary<string, int> gridVisibleIndexConfig)
        {
            try
            {
                if (gridVisibleIndexConfig == null || gridVisibleIndexConfig.Count == 0)
                    return BadRequest("Grid visible index configuration is empty");

                int updatedCount = 0;

                foreach (var item in gridVisibleIndexConfig)
                {
                    string dataField = item.Key;
                    int visibleIndex = item.Value;

                    // Get existing record
                    var existingConfig = await _BaseRepository.GetSingleObject(x => x.DataField == dataField);
                    
                    if (existingConfig != null)
                    {
                        // Update GridVisibleIndex
                        existingConfig.Order = visibleIndex;
                        existingConfig.GridVisibleIndex = visibleIndex;
                        
                        // Update in database
                        await _BaseRepository.UpdateData(existingConfig, 
                            JsonConvert.SerializeObject(new {Order = visibleIndex, gridVisibleIndex = visibleIndex }), 
                            existingConfig.Id, "Id");
                        
                        updatedCount++;
                    }
                }

                return Ok(new 
                { 
                    success = true, 
                    message = $"Successfully updated {updatedCount} grid columns", 
                    updatedCount = updatedCount 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Get GridVisibleIndex - Retrieve current visible column order configuration
        /// </summary>
        /// <param name="sysTableId">Optional: Filter by SysTableId</param>
        /// <returns>Dictionary with dataField as key and visible index as value</returns>
        [HttpGet]
        public async Task<IActionResult> GetGridVisibleIndex(int? sysTableId = null)
        {
            try
            {
                List<DataGridConfig> configs;

                if (sysTableId.HasValue)
                    configs = await _BaseRepository.GetListObject(x => x.SysTableId == sysTableId && x.GridVisibleIndex.HasValue);
                else
                    configs = await _BaseRepository.GetListObject(x => x.GridVisibleIndex.HasValue);

                // Build dictionary with dataField and visible index
                var result = configs
                    .OrderBy(x => x.GridVisibleIndex ?? int.MaxValue)
                    .ToDictionary(x => x.DataField, x => x.GridVisibleIndex ?? 0);

                return Ok(new 
                { 
                    success = true, 
                    data = result,
                    count = result.Count
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Batch update grid layouts - Update multiple grids layout configuration
        /// </summary>
        /// <param name="layoutUpdates">Dictionary with table names and their visible index configs</param>
        /// <returns>Summary of updated records</returns>
        [HttpPost]
        public async Task<IActionResult> BatchUpdateGridLayout([FromBody] Dictionary<string, Dictionary<string, int>> layoutUpdates)
        {
            try
            {
                if (layoutUpdates == null || layoutUpdates.Count == 0)
                    return BadRequest("Layout updates configuration is empty");

                var summary = new Dictionary<string, int>();

                foreach (var tableLayout in layoutUpdates)
                {
                    string tableName = tableLayout.Key;
                    var visibleIndexConfig = tableLayout.Value;

                    int tableUpdatedCount = 0;

                    foreach (var item in visibleIndexConfig)
                    {
                        string dataField = item.Key;
                        int visibleIndex = item.Value;

                        var existingConfig = await _BaseRepository.GetSingleObject(x => x.DataField == dataField);
                        
                        if (existingConfig != null)
                        {
                            existingConfig.GridVisibleIndex = visibleIndex;
                            _BaseRepository.UpdateData(existingConfig, 
                                JsonConvert.SerializeObject(new { gridVisibleIndex = visibleIndex }), 
                                existingConfig.Id, "Id");
                            tableUpdatedCount++;
                        }
                    }

                    summary[tableName] = tableUpdatedCount;
                }

                return Ok(new 
                { 
                    success = true, 
                    message = "Batch update completed",
                    summary = summary,
                    totalUpdated = summary.Values.Sum()
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
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