using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Data.SqlClient;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading.Tasks;
using Newtonsoft.Json;
using ERPCore.Models.Migration.Config;
using ERPCore.Models.Request;
using ERPCore.Controllers.Base;
using Microsoft.AspNetCore.Http;
using ERPCore.Common;
using System.Net.Http;
using System.Net;

namespace ERPCore.Controllers.Config
{
    [ApiController]
    [Route("api/[controller]/[action]")]
    public class SqlStoredProcedureController : BaseControllerApi<SqlStoredProcedure>
    {
        private readonly IBaseRepository<SqlStoredProcedure> _BaseRepository;
        private readonly IConfiguration _configuration;

        public SqlStoredProcedureController(
            IBaseRepository<SqlStoredProcedure> BaseRepository, 
            IConfiguration configuration, 
            IHttpContextAccessor httpContextAccessor) : base(BaseRepository, httpContextAccessor)
        {
            _BaseRepository = BaseRepository;
            _configuration = configuration;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? searchText = null)
        {
            try
            {
                string sql = @"
                    SELECT DISTINCT
                        o.id AS Id,
                        o.name AS Name,
                        o.crdate AS CreateDate,
                        (SELECT COUNT(*) FROM sys.parameters param WHERE param.object_id = o.id) AS ParamCount
                    FROM sysobjects o
                    LEFT JOIN syscomments c ON c.id = o.id
                    WHERE o.type = 'P' AND o.name NOT LIKE 'sp_%'";

                var parameters = new Dictionary<string, object>();
                if (!string.IsNullOrEmpty(searchText))
                {
                    sql += " AND c.text LIKE @SearchText";
                    parameters.Add("SearchText", $"%{searchText}%");
                }

                sql += " ORDER BY o.name";

                // Query securely via ExecuteCustomQuery using hardcoded query
                var result = await _BaseRepository.ExecuteCustomQuery(sql, parameters);
                
                var formattedResult = result.Select(r => new {
                    id = r.ContainsKey("Id") ? r["Id"] : null,
                    name = r.ContainsKey("Name") ? r["Name"] : null,
                    createDate = r.ContainsKey("CreateDate") ? r["CreateDate"] : null,
                    modifyDate = r.ContainsKey("CreateDate") ? r["CreateDate"] : null, // sysobjects has crdate only
                    paramCount = r.ContainsKey("ParamCount") ? r["ParamCount"] : null
                }).ToList();
                
                return Ok(formattedResult);
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public override async Task<ActionResult<SqlStoredProcedure>> GetSingle(int id)
        {
            try
            {
                var sql = @"
                    SELECT 
                        o.id AS Id,
                        o.name AS Name,
                        o.crdate AS CreateDate
                    FROM sysobjects o
                    WHERE o.id = @ObjectId AND o.type = 'P'";
                
                var procList = await _BaseRepository.ExecuteCustomQuery(sql, new Dictionary<string, object> { { "ObjectId", id } });
                var proc = procList.FirstOrDefault();
                if (proc == null) return NotFound("Stored procedure not found.");

                // Concatenate chunks from syscomments in order
                var chunksSql = "SELECT text FROM syscomments WHERE id = @ObjectId ORDER BY colid";
                var chunksList = await _BaseRepository.ExecuteCustomQuery(chunksSql, new Dictionary<string, object> { { "ObjectId", id } });
                string definition = string.Concat(chunksList.Select(c => c.ContainsKey("text") ? c["text"]?.ToString() : ""));

                var paramSql = @"
                    SELECT 
                        parameter_id AS ParameterId,
                        name AS Name,
                        TYPE_NAME(user_type_id) AS DataType,
                        max_length AS MaxLength,
                        is_output AS IsOutput
                    FROM sys.parameters
                    WHERE object_id = @ObjectId
                    ORDER BY parameter_id";
                
                var paramList = await _BaseRepository.ExecuteCustomQuery(paramSql, new Dictionary<string, object> { { "ObjectId", id } });
                var formattedParams = paramList.Select(p => new {
                    parameterId = p.ContainsKey("ParameterId") ? p["ParameterId"] : null,
                    name = p.ContainsKey("Name") ? p["Name"] : null,
                    dataType = p.ContainsKey("DataType") ? p["DataType"] : null,
                    maxLength = p.ContainsKey("MaxLength") ? p["MaxLength"] : null,
                    isOutput = p.ContainsKey("IsOutput") ? p["IsOutput"] : null
                }).ToList();

                var result = new {
                    id = proc.ContainsKey("Id") ? proc["Id"] : null,
                    name = proc.ContainsKey("Name") ? proc["Name"] : null,
                    createDate = proc.ContainsKey("CreateDate") ? proc["CreateDate"] : null,
                    modifyDate = proc.ContainsKey("CreateDate") ? proc["CreateDate"] : null,
                    definition = definition,
                    parameters = formattedParams
                };
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost]
        public override async Task<IActionResult> InsertData([FromForm] InsertFormCollection form)
        {
            try
            {
                var values = JsonConvert.DeserializeObject<Dictionary<string, string>>(form.values);
                if (values == null || !values.ContainsKey("definition"))
                {
                    return BadRequest("Definition SQL is required.");
                }

                string definition = values["definition"];
                string name = values.ContainsKey("name") ? values["name"] : "";

                // Execute definition code compiling SP securely
                await _BaseRepository.ExecuteCustomQuery(definition);

                int? objectId = null;
                if (!string.IsNullOrEmpty(name))
                {
                    var sql = "SELECT id AS Id FROM sysobjects WHERE name = @Name AND type = 'P'";
                    var result = await _BaseRepository.ExecuteCustomQuery(sql, new Dictionary<string, object> { { "Name", name } });
                    var item = result.FirstOrDefault();
                    if (item != null && item.ContainsKey("Id"))
                    {
                        objectId = Convert.ToInt32(item["Id"]);
                    }
                }

                return Ok(new { id = objectId ?? 0, name = name, success = true });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost]
        public override HttpResponseMessage UpdateData([FromForm] UpdateFormCollection form)
        {
            try
            {
                var values = JsonConvert.DeserializeObject<Dictionary<string, string>>(form.values);
                if (values == null || !values.ContainsKey("definition"))
                {
                    return new HttpResponseMessage(HttpStatusCode.BadRequest);
                }

                string definition = values["definition"];
                string newName = values.ContainsKey("name") ? values["name"] : "";

                string oldName = "";
                var oldNameResult = _BaseRepository.ExecuteCustomQuery(
                    "SELECT name AS Name FROM sysobjects WHERE id = @ObjectId AND type = 'P'", 
                    new Dictionary<string, object> { { "ObjectId", form.key } }).GetAwaiter().GetResult();
                
                var oldItem = oldNameResult.FirstOrDefault();
                if (oldItem != null && oldItem.ContainsKey("Name"))
                {
                    oldName = oldItem["Name"]?.ToString() ?? "";
                }

                if (!string.IsNullOrEmpty(oldName))
                {
                    _BaseRepository.ExecuteCustomQuery($"DROP PROCEDURE [{oldName}]").GetAwaiter().GetResult();
                }

                _BaseRepository.ExecuteCustomQuery(definition).GetAwaiter().GetResult();

                return new HttpResponseMessage(HttpStatusCode.OK);
            }
            catch (Exception)
            {
                return new HttpResponseMessage(HttpStatusCode.InternalServerError);
            }
        }

        [HttpPost]
        public override async Task<IActionResult> DeleteData([FromForm] DeleteFormCollection form)
        {
            try
            {
                string procName = "";
                var result = await _BaseRepository.ExecuteCustomQuery(
                    "SELECT name AS Name FROM sysobjects WHERE id = @ObjectId AND type = 'P'", 
                    new Dictionary<string, object> { { "ObjectId", form.key } });
                
                var item = result.FirstOrDefault();
                if (item != null && item.ContainsKey("Name"))
                {
                    procName = item["Name"]?.ToString() ?? "";
                }

                if (!string.IsNullOrEmpty(procName))
                {
                    await _BaseRepository.ExecuteCustomQuery($"DROP PROCEDURE [{procName}]");
                    return Ok(new { success = true });
                }
                return NotFound("Stored procedure not found.");
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> Execute([FromBody] StoredProcExecuteRequest request)
        {
            try
            {
                // To execute stored procedure dynamically with parameters, we use direct command
                var selectedEnvironment = HttpContext?.Session.GetString(ERPCore.ControllerUtil.ControllerUtil.ConnectionEnvironmentSessionKey) ?? "Default";
                var defaultProfile = ERPCore.ControllerUtil.ControllerUtil.GetApplicationConnectionName(selectedEnvironment);
                string profile = HttpContext?.Session.GetString(ERPCore.ControllerUtil.ControllerUtil.DatabaseProfileSessionKey) ?? defaultProfile;
                var rawConn = _configuration.GetConnectionString(profile)
                    ?? throw new InvalidOperationException($"ConnectionStrings:{profile} is not configured.");
                var connectionString = ERPCore.ControllerUtil.ControllerUtil.ParseConnectionString(rawConn, _configuration);

                using (var connection = new SqlConnection(connectionString))
                {
                    await connection.OpenAsync();
                    using (var command = new SqlCommand(request.Name, connection))
                    {
                        command.CommandType = CommandType.StoredProcedure;
                        if (request.Parameters != null)
                        {
                            foreach (var param in request.Parameters)
                            {
                                command.Parameters.AddWithValue("@" + param.Key.TrimStart('@'), param.Value ?? DBNull.Value);
                            }
                        }

                        using (var adapter = new SqlDataAdapter(command))
                        {
                            var dt = new DataTable();
                            adapter.Fill(dt);

                            var resultList = dt.AsEnumerable()
                                .Select(row => dt.Columns.Cast<DataColumn>()
                                    .ToDictionary(
                                        col => col.ColumnName,
                                        col => row[col] == DBNull.Value ? null : row[col]
                                    ))
                                .ToList();

                            return Ok(new { success = true, data = resultList });
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpGet]
        public override async Task<ActionResult<List<ERPCore.Models.Business.Migration.Config.DataGridConfig>>> GetScheme()
        {
            var schema = new List<ERPCore.Models.Business.Migration.Config.DataGridConfig>
            {
                new ERPCore.Models.Business.Migration.Config.DataGridConfig { DataField = "id", Caption = "ID", DataType = "number", Visible = false },
                new ERPCore.Models.Business.Migration.Config.DataGridConfig { DataField = "name", Caption = "Tên Stored Procedure", DataType = "string", Visible = true },
                new ERPCore.Models.Business.Migration.Config.DataGridConfig { DataField = "paramCount", Caption = "Số lượng tham số", DataType = "number", Visible = true },
                new ERPCore.Models.Business.Migration.Config.DataGridConfig { DataField = "createDate", Caption = "Ngày tạo", DataType = "date", Visible = true },
                new ERPCore.Models.Business.Migration.Config.DataGridConfig { DataField = "modifyDate", Caption = "Ngày cập nhật", DataType = "date", Visible = true }
            };
            return Ok(schema);
        }
    }

    public class StoredProcExecuteRequest
    {
        public string Name { get; set; } = "";
        public Dictionary<string, object>? Parameters { get; set; }
    }
}
