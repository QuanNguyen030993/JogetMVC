using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading.Tasks;
using Newtonsoft.Json;
using ERPCore.Models.Request;
using Dapper;
using Microsoft.AspNetCore.Http;
using ERPCore.Common;

namespace ERPCore.Controllers.Config
{
    [Route("api/[controller]/[action]")]
    [ApiController]
    public class SqlStoredProcedureController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public SqlStoredProcedureController(IConfiguration configuration, IHttpContextAccessor httpContextAccessor)
        {
            _configuration = configuration;
            _httpContextAccessor = httpContextAccessor;
        }

        private string GetConnectionString()
        {
            string profile = _httpContextAccessor.HttpContext?.Session.GetString("CurrentDbProfile") ?? "Default";
            var rawConn = _configuration.GetConnectionString(profile) ?? _configuration.GetConnectionString(ERPCore.ControllerUtil.ControllerUtil.tmivEnvironment + "Connection");
            return ERPCore.ControllerUtil.ControllerUtil.ParseConnectionString(rawConn, _configuration);
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? searchText = null)
        {
            try
            {
                using (var connection = new SqlConnection(GetConnectionString()))
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

                    var result = await connection.QueryAsync<dynamic>(sql, parameters);
                    
                    var formattedResult = result.Select(r => new {
                        id = r.Id,
                        name = r.Name,
                        createDate = r.CreateDate,
                        modifyDate = r.CreateDate, // sysobjects has crdate only
                        paramCount = r.ParamCount
                    }).ToList();
                    
                    return Ok(formattedResult);
                }
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetSingle(int id)
        {
            try
            {
                using (var connection = new SqlConnection(GetConnectionString()))
                {
                    var sql = @"
                        SELECT 
                            o.id AS Id,
                            o.name AS Name,
                            o.crdate AS CreateDate
                        FROM sysobjects o
                        WHERE o.id = @ObjectId AND o.type = 'P'";
                    var proc = await connection.QueryFirstOrDefaultAsync<dynamic>(sql, new { ObjectId = id });
                    if (proc == null) return NotFound("Stored procedure not found.");

                    // Concatenate chunks from syscomments in order
                    var chunksSql = "SELECT text FROM syscomments WHERE id = @ObjectId ORDER BY colid";
                    var chunks = await connection.QueryAsync<string>(chunksSql, new { ObjectId = id });
                    string definition = string.Concat(chunks);

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
                    var parameters = await connection.QueryAsync<dynamic>(paramSql, new { ObjectId = id });

                    var formattedParams = parameters.Select(p => new {
                        parameterId = p.ParameterId,
                        name = p.Name,
                        dataType = p.DataType,
                        maxLength = p.MaxLength,
                        isOutput = p.IsOutput
                    }).ToList();

                    var result = new {
                        id = proc.Id,
                        name = proc.Name,
                        createDate = proc.CreateDate,
                        modifyDate = proc.CreateDate,
                        definition = definition,
                        parameters = formattedParams
                    };
                    return Ok(result);
                }
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> InsertData([FromForm] InsertFormCollection form)
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

                using (var connection = new SqlConnection(GetConnectionString()))
                {
                    await connection.ExecuteAsync(definition);

                    int? objectId = null;
                    if (!string.IsNullOrEmpty(name))
                    {
                        var sql = "SELECT id FROM sysobjects WHERE name = @Name AND type = 'P'";
                        objectId = await connection.QueryFirstOrDefaultAsync<int?>(sql, new { Name = name });
                    }

                    return Ok(new { id = objectId ?? 0, name = name, success = true });
                }
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> UpdateData([FromForm] UpdateFormCollection form)
        {
            try
            {
                var values = JsonConvert.DeserializeObject<Dictionary<string, string>>(form.values);
                if (values == null || !values.ContainsKey("definition"))
                {
                    return BadRequest("Definition SQL is required.");
                }

                string definition = values["definition"];
                string newName = values.ContainsKey("name") ? values["name"] : "";

                string oldName = "";
                using (var connection = new SqlConnection(GetConnectionString()))
                {
                    oldName = await connection.QueryFirstOrDefaultAsync<string>(
                        "SELECT name FROM sysobjects WHERE id = @ObjectId AND type = 'P'", 
                        new { ObjectId = form.key });
                }

                using (var connection = new SqlConnection(GetConnectionString()))
                {
                    if (!string.IsNullOrEmpty(oldName))
                    {
                        await connection.ExecuteAsync($"DROP PROCEDURE [{oldName}]");
                    }

                    await connection.ExecuteAsync(definition);

                    int? newObjectId = null;
                    if (!string.IsNullOrEmpty(newName))
                    {
                        newObjectId = await connection.QueryFirstOrDefaultAsync<int?>(
                            "SELECT id FROM sysobjects WHERE name = @Name AND type = 'P'", 
                            new { Name = newName });
                    }

                    return Ok(new { id = newObjectId ?? form.key, name = newName, success = true });
                }
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> DeleteData([FromForm] DeleteFormCollection form)
        {
            try
            {
                string procName = "";
                using (var connection = new SqlConnection(GetConnectionString()))
                {
                    procName = await connection.QueryFirstOrDefaultAsync<string>(
                        "SELECT name FROM sysobjects WHERE id = @ObjectId AND type = 'P'", 
                        new { ObjectId = form.key });
                }

                if (!string.IsNullOrEmpty(procName))
                {
                    using (var connection = new SqlConnection(GetConnectionString()))
                    {
                        await connection.ExecuteAsync($"DROP PROCEDURE [{procName}]");
                    }
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
                using (var connection = new SqlConnection(GetConnectionString()))
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
        public IActionResult GetScheme()
        {
            var schema = new List<object>
            {
                new { dataField = "id", caption = "ID (Object ID)", dataType = "number", readOnly = true, visible = false },
                new { dataField = "name", caption = "Tên Stored Procedure", dataType = "string", readOnly = false, visible = true, validationRules = new[] { new { type = "required", message = "Tên Stored Procedure là bắt buộc" } } },
                new { dataField = "paramCount", caption = "Số lượng tham số", dataType = "number", readOnly = true, visible = true },
                new { dataField = "createDate", caption = "Ngày tạo", dataType = "date", readOnly = true, visible = true },
                new { dataField = "modifyDate", caption = "Ngày cập nhật", dataType = "date", readOnly = true, visible = true },
                new { dataField = "definition", caption = "Định nghĩa SQL", dataType = "string", editorType = "textarea", visible = false }
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
