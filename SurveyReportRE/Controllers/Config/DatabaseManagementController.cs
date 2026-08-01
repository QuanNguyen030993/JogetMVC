using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using ERPCore.Models.Migration.Config;
using ERPCore.Controllers.Base;
using Microsoft.AspNetCore.Http;
using ERPCore.Common;

namespace ERPCore.Controllers.Config
{
    [ApiController]
    [Route("api/[controller]/[action]")]
    public class DatabaseManagementController : BaseControllerApi<DatabaseManagement>
    {
        private readonly IBaseRepository<DatabaseManagement> _BaseRepository;
        private readonly IConfiguration _configuration;

        public DatabaseManagementController(
            IBaseRepository<DatabaseManagement> BaseRepository, 
            IConfiguration configuration, 
            IHttpContextAccessor httpContextAccessor) : base(BaseRepository, httpContextAccessor)
        {
            _BaseRepository = BaseRepository;
            _configuration = configuration;
        }

        private string GetConnectionString()
        {
            string profile = HttpContext?.Session.GetString("CurrentDbProfile") ?? "Default";
            var rawConn = _configuration.GetConnectionString(profile) ?? _configuration.GetConnectionString(ERPCore.ControllerUtil.ControllerUtil.tmivEnvironment + "Connection");
            return ERPCore.ControllerUtil.ControllerUtil.ParseConnectionString(rawConn, _configuration);
        }

        [HttpGet]
        public async Task<IActionResult> GetTablesSpaceUsage()
        {
            try
            {
                string sql = @"
                    SELECT 
                        t.NAME AS TableName,
                        s.Name AS SchemaName,
                        p.rows AS RowCounts,
                        (SUM(a.total_pages) * 8) / 1024.0 AS TotalSpaceMB, 
                        (SUM(a.used_pages) * 8) / 1024.0 AS UsedSpaceMB, 
                        ((SUM(a.total_pages) - SUM(a.used_pages)) * 8) / 1024.0 AS UnusedSpaceMB
                    FROM 
                        sys.tables t
                    INNER JOIN      
                        sys.indexes i ON t.object_id = i.object_id
                    INNER JOIN 
                        sys.partitions p ON i.object_id = p.object_id AND i.index_id = p.index_id
                    INNER JOIN 
                        sys.allocation_units a ON p.partition_id = a.container_id
                    LEFT OUTER JOIN 
                        sys.schemas s ON t.schema_id = s.schema_id
                    WHERE 
                        t.is_ms_shipped = 0
                        AND i.index_id <= 1
                    GROUP BY 
                        t.NAME, s.Name, p.rows
                    ORDER BY 
                        RowCounts DESC, TableName";

                // Securely query database using ExecuteCustomQuery with hardcoded script
                var result = await _BaseRepository.ExecuteCustomQuery(sql);
                
                var formattedResult = result.Select(r => new {
                    tableName = r.ContainsKey("tableName") ? r["tableName"] : null,
                    schemaName = r.ContainsKey("schemaName") ? r["schemaName"] : null,
                    rowCounts = r.ContainsKey("rowCounts") ? r["rowCounts"] : null,
                    totalSpaceMB = r.ContainsKey("totalSpaceMB") ? Math.Round(Convert.ToDouble(r["totalSpaceMB"]), 2) : 0,
                    usedSpaceMB = r.ContainsKey("usedSpaceMB") ? Math.Round(Convert.ToDouble(r["usedSpaceMB"]), 2) : 0,
                    unusedSpaceMB = r.ContainsKey("unusedSpaceMB") ? Math.Round(Convert.ToDouble(r["unusedSpaceMB"]), 2) : 0
                }).ToList();

                return Ok(formattedResult);
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> BackupDatabase([FromBody] BackupRequest request)
        {
            try
            {
                if (string.IsNullOrEmpty(request.BackupFolder))
                {
                    return BadRequest("Thư mục sao lưu không được để trống.");
                }

                string fileName = string.IsNullOrEmpty(request.BackupFileName) 
                    ? $"Backup_{DateTime.Now:yyyyMMdd_HHmmss}.bak" 
                    : request.BackupFileName;

                if (!fileName.EndsWith(".bak", StringComparison.OrdinalIgnoreCase))
                {
                    fileName += ".bak";
                }

                var connBuilder = new SqlConnectionStringBuilder(GetConnectionString());
                string dbName = connBuilder.InitialCatalog;
                string fullPath = Path.Combine(request.BackupFolder, fileName);

                try
                {
                    if (Directory.Exists(request.BackupFolder) == false && Path.IsPathRooted(request.BackupFolder))
                    {
                        Directory.CreateDirectory(request.BackupFolder);
                    }
                }
                catch { /* Ignore folder creation errors for remote databases */ }

                using (var connection = new SqlConnection(GetConnectionString()))
                {
                    await connection.OpenAsync();
                    
                    // Backup is a special DDL task, we execute it using connection directly to set appropriate CommandTimeout (300s)
                    string backupSql = $"BACKUP DATABASE [{dbName}] TO DISK = @FullPath WITH FORMAT, INIT, NAME = @BackupName";
                    using (var command = new SqlCommand(backupSql, connection))
                    {
                        command.Parameters.AddWithValue("@FullPath", fullPath);
                        command.Parameters.AddWithValue("@BackupName", $"Full Backup of {dbName}");
                        command.CommandTimeout = 300;
                        await command.ExecuteNonQueryAsync();
                    }

                    return Ok(new { 
                        success = true, 
                        message = $"Sao lưu CSDL '{dbName}' thành công!", 
                        dbName = dbName,
                        backupPath = fullPath 
                    });
                }
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> OptimizeBackup()
        {
            try
            {
                using (var connection = new SqlConnection(GetConnectionString()))
                {
                    await connection.OpenAsync();
                    
                    string sql = "EXEC usp_Optimize_Backup";
                    using (var command = new SqlCommand(sql, connection))
                    {
                        command.CommandTimeout = 600; // 10 minutes timeout
                        await command.ExecuteNonQueryAsync();
                    }

                    return Ok(new { 
                        success = true, 
                        message = "Thực thi tối ưu hóa sao lưu (usp_Optimize_Backup) thành công!" 
                    });
                }
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> GenerateScript([FromBody] ScriptRequest request)
        {
            try
            {
                if (request.Tables == null || request.Tables.Count == 0)
                {
                    return BadRequest("Vui lòng chọn ít nhất một bảng để tạo script.");
                }

                var sb = new StringBuilder();
                sb.AppendLine($"/* ===========================================================================");
                sb.AppendLine($"   DATABASE SCRIPT GENERATOR (SSMS TYPE)");
                sb.AppendLine($"   Generated on: {DateTime.Now:yyyy-MM-dd HH:mm:ss}");
                sb.AppendLine($"   Tables count: {request.Tables.Count}");
                sb.AppendLine($"   Include Schema: {request.ScriptSchema}");
                sb.AppendLine($"   Include Data: {request.ScriptData}");
                sb.AppendLine($"   =========================================================================== */\n");

                foreach (var table in request.Tables)
                {
                    if (request.ScriptSchema)
                    {
                        string schemaScript = await GenerateTableSchemaScript(table);
                        sb.AppendLine(schemaScript);
                    }

                    if (request.ScriptData)
                    {
                        string dataScript = await GenerateTableDataScript(table);
                        sb.AppendLine(dataScript);
                    }
                }

                return Ok(new { success = true, script = sb.ToString() });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        private async Task<string> GenerateTableSchemaScript(string tableName)
        {
            // 1. Fetch columns info
            var cols = await _BaseRepository.ExecuteCustomQuery(@"
                SELECT 
                    COLUMN_NAME, 
                    DATA_TYPE, 
                    CHARACTER_MAXIMUM_LENGTH, 
                    NUMERIC_PRECISION,
                    NUMERIC_SCALE,
                    IS_NULLABLE, 
                    COLUMN_DEFAULT
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_NAME = @TableName
                ORDER BY ORDINAL_POSITION", new Dictionary<string, object> { { "TableName", tableName } });

            if (!cols.Any()) return $"-- Table [{tableName}] not found or has no columns.\n";

            // 2. Fetch primary keys
            var pksList = await _BaseRepository.ExecuteCustomQuery(@"
                SELECT COLUMN_NAME
                FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
                WHERE OBJECTPROPERTY(OBJECT_ID(CONSTRAINT_SCHEMA + '.' + CONSTRAINT_NAME), 'IsPrimaryKey') = 1
                AND TABLE_NAME = @TableName", new Dictionary<string, object> { { "TableName", tableName } });
            
            var pks = pksList.Select(p => p.ContainsKey("COLUMN_NAME") ? p["COLUMN_NAME"]?.ToString() : "").Where(x => !string.IsNullOrEmpty(x));
            var pkSet = new HashSet<string>(pks);

            var sb = new StringBuilder();
            sb.AppendLine($"-- Create Table Schema for [{tableName}]");
            sb.AppendLine($"IF OBJECT_ID('dbo.[{tableName}]', 'U') IS NOT NULL DROP TABLE dbo.[{tableName}];");
            sb.AppendLine($"CREATE TABLE dbo.[{tableName}] (");

            var colDefs = new List<string>();
            foreach (var col in cols)
            {
                string colName = col.ContainsKey("COLUMN_NAME") ? col["COLUMN_NAME"]?.ToString() : "";
                string dataType = col.ContainsKey("DATA_TYPE") ? col["DATA_TYPE"]?.ToString() : "";
                long? maxLen = col.ContainsKey("CHARACTER_MAXIMUM_LENGTH") && col["CHARACTER_MAXIMUM_LENGTH"] != null ? Convert.ToInt64(col["CHARACTER_MAXIMUM_LENGTH"]) : null;
                int? precision = col.ContainsKey("NUMERIC_PRECISION") && col["NUMERIC_PRECISION"] != null ? Convert.ToInt32(col["NUMERIC_PRECISION"]) : null;
                int? scale = col.ContainsKey("NUMERIC_SCALE") && col["NUMERIC_SCALE"] != null ? Convert.ToInt32(col["NUMERIC_SCALE"]) : null;
                string isNullable = col.ContainsKey("IS_NULLABLE") && col["IS_NULLABLE"]?.ToString() == "YES" ? "NULL" : "NOT NULL";
                string defVal = col.ContainsKey("COLUMN_DEFAULT") ? col["COLUMN_DEFAULT"]?.ToString() : "";

                // Identity check
                int isIdentity = 0;
                var identityResult = await _BaseRepository.ExecuteCustomQuery(@"
                    SELECT COLUMNPROPERTY(object_id(TABLE_SCHEMA + '.' + TABLE_NAME), COLUMN_NAME, 'IsIdentity') AS IsIdentity
                    FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE TABLE_NAME = @TableName AND COLUMN_NAME = @ColName", 
                    new Dictionary<string, object> { { "TableName", tableName }, { "ColName", colName } });
                
                var idItem = identityResult.FirstOrDefault();
                if (idItem != null && idItem.ContainsKey("IsIdentity") && idItem["IsIdentity"] != null)
                {
                    isIdentity = Convert.ToInt32(idItem["IsIdentity"]);
                }

                string identityStr = isIdentity == 1 ? " IDENTITY(1,1)" : "";

                string lenStr = "";
                if (maxLen.HasValue)
                {
                    lenStr = maxLen.Value == -1 ? "(MAX)" : $"({maxLen.Value})";
                }
                else if ((dataType == "decimal" || dataType == "numeric") && precision.HasValue && scale.HasValue)
                {
                    lenStr = $"({precision.Value}, {scale.Value})";
                }

                string defStr = string.IsNullOrEmpty(defVal) ? "" : $" DEFAULT {defVal}";
                colDefs.Add($"    [{colName}] {dataType.ToUpper()}{lenStr}{identityStr} {isNullable}{defStr}");
            }

            if (pkSet.Count > 0)
            {
                colDefs.Add($"    CONSTRAINT [PK_{tableName}] PRIMARY KEY ({string.Join(", ", pkSet.Select(k => $"[{k}]"))})");
            }

            sb.AppendLine(string.Join(",\n", colDefs));
            sb.AppendLine(");");
            sb.AppendLine("GO\n");

            return sb.ToString();
        }

        private async Task<string> GenerateTableDataScript(string tableName)
        {
            var sb = new StringBuilder();
            sb.AppendLine($"-- Insert Data for [{tableName}]");

            // 1. Fetch column list
            var colsList = await _BaseRepository.ExecuteCustomQuery(@"
                SELECT COLUMN_NAME
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_NAME = @TableName
                ORDER BY ORDINAL_POSITION", new Dictionary<string, object> { { "TableName", tableName } });

            var cols = colsList.Select(c => c.ContainsKey("COLUMN_NAME") ? c["COLUMN_NAME"]?.ToString() : "").Where(x => !string.IsNullOrEmpty(x)).ToList();
            if (cols.Count == 0) return "";

            // 2. Identity Column Detection
            var identityResult = await _BaseRepository.ExecuteCustomQuery(@"
                SELECT OBJECTPROPERTY(OBJECT_ID(@TableName), 'TableHasIdentity') AS HasIdentity", 
                new Dictionary<string, object> { { "TableName", tableName } });
            
            bool hasIdentity = false;
            var idItem = identityResult.FirstOrDefault();
            if (idItem != null && idItem.ContainsKey("HasIdentity") && idItem["HasIdentity"] != null)
            {
                hasIdentity = Convert.ToInt32(idItem["HasIdentity"]) == 1;
            }

            if (hasIdentity)
            {
                sb.AppendLine($"SET IDENTITY_INSERT dbo.[{tableName}] ON;");
            }

            // 3. Fetch data rows securely using ExecuteCustomQuery
            var rows = await _BaseRepository.ExecuteCustomQuery($"SELECT * FROM dbo.[{tableName}]");
            
            if (!rows.Any())
            {
                sb.AppendLine($"-- Table [{tableName}] contains 0 rows.");
                if (hasIdentity)
                {
                    sb.AppendLine($"SET IDENTITY_INSERT dbo.[{tableName}] OFF;");
                }
                sb.AppendLine("GO\n");
                return sb.ToString();
            }

            foreach (var row in rows)
            {
                var colNamesList = new List<string>();
                var valList = new List<string>();

                foreach (var col in cols)
                {
                    colNamesList.Add($"[{col}]");
                    
                    // Case-insensitive key lookup in row dictionary
                    string matchingKey = row.Keys.FirstOrDefault(k => k.Equals(col, StringComparison.OrdinalIgnoreCase));
                    object val = matchingKey != null ? row[matchingKey] : null;

                    if (val == null || val == DBNull.Value)
                    {
                        valList.Add("NULL");
                    }
                    else if (val is string || val is Guid)
                    {
                        string escapedVal = val.ToString().Replace("'", "''");
                        valList.Add($"N'{escapedVal}'");
                    }
                    else if (val is DateTime dt)
                    {
                        valList.Add($"N'{dt:yyyy-MM-dd HH:mm:ss.fff}'");
                    }
                    else if (val is bool b)
                    {
                        valList.Add(b ? "1" : "0");
                    }
                    else if (val is byte[] bytes)
                    {
                        var hex = new StringBuilder("0x", bytes.Length * 2 + 2);
                        foreach (byte x in bytes)
                        {
                            hex.Append(x.ToString("X2"));
                        }
                        valList.Add(hex.ToString());
                    }
                    else
                    {
                        valList.Add(val.ToString().Replace(",", "."));
                    }
                }

                sb.AppendLine($"INSERT INTO dbo.[{tableName}] ({string.Join(", ", colNamesList)}) VALUES ({string.Join(", ", valList)});");
            }

            if (hasIdentity)
            {
                sb.AppendLine($"SET IDENTITY_INSERT dbo.[{tableName}] OFF;");
            }
            sb.AppendLine("GO\n");

            return sb.ToString();
        }

        [HttpGet]
        public override async Task<ActionResult<List<ERPCore.Models.Business.Migration.Config.DataGridConfig>>> GetScheme()
        {
            var schema = new List<ERPCore.Models.Business.Migration.Config.DataGridConfig>
            {
                new ERPCore.Models.Business.Migration.Config.DataGridConfig { DataField = "tableName", Caption = "Tên Bảng (Table)", DataType = "string", Visible = true },
                new ERPCore.Models.Business.Migration.Config.DataGridConfig { DataField = "schemaName", Caption = "Schema", DataType = "string", Visible = true },
                new ERPCore.Models.Business.Migration.Config.DataGridConfig { DataField = "rowCounts", Caption = "Số Dòng (Record Count)", DataType = "number", Visible = true },
                new ERPCore.Models.Business.Migration.Config.DataGridConfig { DataField = "totalSpaceMB", Caption = "Tổng Dung Lượng (MB)", DataType = "number", Visible = true },
                new ERPCore.Models.Business.Migration.Config.DataGridConfig { DataField = "usedSpaceMB", Caption = "Dung Lượng Đã Dùng (MB)", DataType = "number", Visible = true },
                new ERPCore.Models.Business.Migration.Config.DataGridConfig { DataField = "unusedSpaceMB", Caption = "Dung Lượng Trống (MB)", DataType = "number", Visible = true }
            };
            return Ok(schema);
        }
    }

    public class BackupRequest
    {
        public string BackupFolder { get; set; } = "";
        public string BackupFileName { get; set; } = "";
    }

    public class ScriptRequest
    {
        public List<string> Tables { get; set; } = new List<string>();
        public bool ScriptSchema { get; set; }
        public bool ScriptData { get; set; }
    }
}
