using AutoMapper.Execution;
using Newtonsoft.Json;
using Microsoft.Data.SqlClient;
using Dapper;
using System.Linq.Expressions;
using SurveyReportRE.Common;
using static Dapper.SqlMapper;
using System.Linq;
using System.Data;
using System.Collections;
using System.Reflection;
using SurveyReportRE.Models.Migration.Config;
using Microsoft.AspNetCore.Http;
using DocumentFormat.OpenXml.Math;
using DocumentFormat.OpenXml.Office2016.Drawing.Command;
using Microsoft.AspNetCore.Identity;
using static iText.IO.Codec.TiffWriter;
using System;
using Microsoft.Identity.Client;
using System.Drawing.Text;
using Core.Arango.Linq;
public interface IBaseRepository<T> where T : class
{
    Task<T> GetObjectByIdAsync(long id); //Use for Base processing 
    Task<T> GetObjectIncludeByIdAsync(long id); //Use for Base processing 
    Task<T> GetSingleObject(Expression<Func<T, bool>> predicate); //Use for Class processing
    Task<T> GetSingleObjectFullInclude(Expression<Func<T, bool>> predicate, params Expression<Func<T, object>>[] includeProperties); //Use for Class processing
    Task<List<T>> GetListObject(Expression<Func<T, bool>> predicate);
    Task<List<T>> GetListObjectFullInclude(Expression<Func<T, bool>> predicate, params Expression<Func<T, object>>[] includeProperties);
    Task<List<T>> GetFKMany(int fkId, string fkField);
    Task<List<T>> GetManyObjectByIdAsync(int id);
    Task<List<T>> EnumData(string name);
    Task<List<Dictionary<string, object>>> ExecuteCustomQuery(string query);
    Task<List<Dictionary<string, object>>> ExecuteCustomJogetQuery(string query);
    Task<List<dynamic>> EnumLookup(string refField, string enumName = null);
    Task UpdateEnum(string refField, string valueKey, long sysTableId);
    Task<List<T>> GetAll();
    Task<List<T>> GetAllInclude();
    Task<List<T>> GetAllActive();
    //Task<List<T>> AllIncluding(params Expression<Func<T, object>>[] includeProperties);
    //Task<List<T>> AllIncludingTracking(params Expression<Func<T, object>>[] includeProperties);
    //Task<List<T>> AllLinesIncluding();
    //Task<List<T>> GetFromSql(string sql);
    Task<T> FindBy(Func<T, bool> predicate);
    //Task<List<T>> FindByTracking(Expression<Func<T, bool>> predicate);
    //Task<List<T>> FindByRange(DateTime startDate, DateTime endDate);
    //Task<List<T>> FindByCreator(string userName);
    //Task<List<T>> FindByOther(string userName);
    //int Count();
    Task<dynamic> GetUserRoles(string accountName);
    //bool Any(Expression<Func<T, bool>> predicate);
    //List<T> GetList(Expression<Func<T, bool>> predicate = null);
    //List<T> GetList(Expression<Func<T, bool>> predicate = null, params Expression<Func<T, object>>[] includeProperties);
    Task<dynamic> GetScheme(T entity);
    Task<dynamic> GetAllScheme();
    Task<dynamic> GetSystemScheme(T entity);
    Task<bool> RecordExistsAsync<T>(string lookupField, object lookupValue);
    //Task<T> Include(T entity, params Expression<Func<T, object>>[] includeProperties);
    Task<T> IncludeSpecificField(T entity, string prefixMainField, params Expression<Func<T, object>>[] includeProperties); // Use for FK custom name as prefix
    Task<T> ObjectSpecificInclude(T entity, params Expression<Func<T, object>>[] includeProperties); //Normal FK Include


    //Task<EnumData?> EnumInclude(string propName, object objectInstance, string fieldName);
    Task<T> InsertData(T entity);

    /// <summary>
    /// </summary>
    /// <param name="entity"> entity chứa giá trị, entity thay đổi</param>
    /// <param name="changeFields"> string field cần update</param>
    /// <param name="keyId"> id chỉ định để update</param>
    /// <param name="keyField"></param>
    /// Method 1: Update đơn lẻ chỉ truyền entity có giá trị thay đổi cùng với string, Populate entity từ chuỗi thay đổi này trước 
    /// Method 2: Update toàn bộ, Populate toàn bộ object thành 1 string rồi truyền vào, để không bị sai thì phải update object entity trước khi Json SerialObject
    /// <returns></returns>
    Task<T> UpdateData(T entity, string changeFields, long? keyId, string keyField);
    Task<T> DeleteData(T entity, object keyId, string keyField, bool isRemove);
    string GetConnection();
    Task ExecuteStoredProcedure(string storedProcedureName, params (string Key, object Value)[] parameters);
    Task<DataTable> ExecuteStoredProcedureReturn(string storedProcedureName, params (string Key, object Value)[] parameters);
    Task<T> IncludeListsOnly(T entity);
    IConfiguration _baseConfiguration { get; set; }
    IHttpContextAccessor _httpContextAccessor { get; set; }
    //Task<EnumData?> ObjectSpecificEnumInclude(object entity, string enumName, params Expression<Func<T, object>>[] includeProperties);
    string _connectionString { get; set; }
    string _logConnectionString { get; set; }

    #region Sync 
    T ObjectSpecificIncludeSync(T entity, params Expression<Func<T, object>>[] includeProperties); //Normal FK Include
    /// <summary>
    /// Hàm này đang dùng cho enum lẻ dễ hiểu hiệu quả 2025-05-26
    /// </summary>
    /// <param name="entity"></param>
    /// <param name="enumName"></param>
    /// <param name="includeProperties"></param>
    /// <returns></returns>
    EnumData? ObjectSpecificEnumIncludeSync(object entity, string enumName, params Expression<Func<T, object>>[] includeProperties);
    #endregion
    //void GetRepositoryHttpContent(IHttpContextAccessor httpContextAccessor);
}

public class BaseRepository<T> : IBaseRepository<T> where T : class, new()
{
    //private readonly string _connectionString;
    public IConfiguration _baseConfiguration { get; set; }
    public IHttpContextAccessor _httpContextAccessor { get; set; }
    public string _connectionString { get; set; }
    public string _jogetConnectionString { get; set; }
    public string _logConnectionString { get; set; }
    public string userName { get; set; }

    public BaseRepository(IConfiguration config, IHttpContextAccessor httpContextAccessor)
    {
        _baseConfiguration = config;
        _connectionString = _baseConfiguration.GetConnectionString("DefaultConnection");
        _jogetConnectionString = _baseConfiguration.GetConnectionString("JogetConnection");
        _logConnectionString = _baseConfiguration.GetConnectionString("LogConnection");
        _httpContextAccessor = httpContextAccessor;
        userName = _httpContextAccessor?.HttpContext?.User?.Identity?.Name ?? "";
    }
    public string GetConnection()
    {
        return _baseConfiguration.GetConnectionString("DefaultConnection");
    }

    //public void GetRepositoryHttpContent(IHttpContextAccessor httpContextAccessor)
    //{
    //    _httpContextAccessor = httpContextAccessor;
    //}


    public async Task<List<T>> GetListObject(Expression<Func<T, bool>> predicate)
    {
        using (var connection = new SqlConnection(_connectionString))
        {
            List<T> entities = new List<T>();
            var sql = Util.BuildSelectAllQuery<T>(typeof(T).Name); ;
            try
            {
                var compiledPredicate = predicate.Compile();
                var result = await connection.QueryAsync<T>(sql, new { });
                IQueryable<T> queryableResult = result.ToList().AsQueryable();
                if (queryableResult.Any(predicate))
                    entities.AddRange(queryableResult.Where(predicate).ToList());
                Util.QueryLogs(_connectionString, "sp_Querylogs",
                            ("@QueryString", $"GetListObject: {sql}")
                            , ("@Duration", "")
                            , ("@User", userName));
            }
            catch (Exception ex)
            {
                Util.QueryLogs(_connectionString, "sp_Querylogs",
                           ("@QueryString", $"Error GetListObject: {sql}")
                           , ("@Duration", "")
                           , ("@User", userName));
            }

            return entities;
        }
    }


    public async Task<T> GetSingleObject(Expression<Func<T, bool>> predicate)
    {
        using (var connection = new SqlConnection(_connectionString))
        {
            T entity = new T();
            var (sql, parameters) = Util.BuildSelectQuery<T>(typeof(T).Name, predicate);
            try
            {
                var compiledPredicate = predicate.Compile();
                //var sql = Util.BuildSelectQuery<T>(typeof(T).Name, predicate);
                var result = await connection.QueryAsync<T>(sql, parameters);
                IQueryable<T> queryableResult = result.ToList().AsQueryable();
                entity = queryableResult.FirstOrDefault(predicate);
                //foreach (var includeProperty in includeProperties)
                //{
                //    entity = await ObjectSpecificInclude(entity, includeProperty);
                //}
                Util.QueryLogs(_connectionString, "sp_Querylogs",
                            ("@QueryString", $"GetSingleObject: {sql}")
                            , ("@Duration", "")
                            , ("@User", userName));
            }catch (Exception ex)
            {
                Util.QueryLogs(_connectionString, "sp_Querylogs",
                            ("@QueryString", $"Error GetSingleObject: {sql}")
                            , ("@Duration", "")
                            , ("@User", userName));
            }
            return entity;
        }
    }

    public async Task<T> InsertData(T entity)
    {
        using (var connection = new SqlConnection(_connectionString))
        {
            var userName = _httpContextAccessor?.HttpContext?.User?.Identity?.Name.Replace("TOKIOMARINE\\", "");
            string insertQuery = Util.BuildInsertQuery(entity, typeof(T).Name, userName);
            dynamic? inserted = null;
            try
            {
                inserted = await connection.QuerySingleAsync<dynamic>(insertQuery, entity);
                dynamic returnEntity = entity;
                returnEntity.Id = inserted.Id ?? 0;
                returnEntity.Guid = inserted.Guid ?? 0;
                Util.QueryLogs(_connectionString, "sp_Querylogs",
                       ("@QueryString", $"InsertData: {insertQuery}")
                       , ("@Duration", "")
                       , ("@User", userName));
                return (T)returnEntity;
            }
            catch
                 (Exception ex)
            {
                Util.QueryLogs(_connectionString, "sp_Querylogs",
                      ("@QueryString", $"Error InsertData: {insertQuery}")
                      , ("@Duration", "")
                      , ("@User", userName));
                throw new Exception(ex.Message);
            }
        }
    }



    public async Task ExecuteStoredProcedure(string storedProcedureName, params (string Key, object Value)[] parameters)
    {
        try
        {
            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                connection.Open();

                using (SqlCommand command = new SqlCommand(storedProcedureName, connection))
                {
                    command.CommandType = CommandType.StoredProcedure;

                    // Thêm các tham số từ dictionary vào SqlCommand
                    foreach (var param in parameters)
                    {
                        command.Parameters.AddWithValue(param.Key, param.Value ?? DBNull.Value);
                    }

                    // Thực thi stored procedure
                    await command.ExecuteNonQueryAsync();
                }
            }
        }
        catch (Exception ex)
        {
            Serilog.Log.Error(ex, ex.Message);
        }
    }
    public async Task<bool> RecordExistsAsync<T>(string lookupField, object lookupValue)
    {
        using (var connection = new SqlConnection(_connectionString))
        {
            var tableName = typeof(T).Name;
            var sql = $"SELECT TOP 1 1 FROM {tableName} WHERE {lookupField} = @lookupValue";
            try
            {
                var result = await connection.ExecuteScalarAsync<int?>(sql, new { lookupValue });
                Util.QueryLogs(_connectionString, "sp_Querylogs",
                       ("@QueryString", $"RecordExistsAsync: {sql}")
                       , ("@Duration", "")
                       , ("@User", userName));

                return result.HasValue;
            }
            catch
            {
                Util.QueryLogs(_connectionString, "sp_Querylogs",
                       ("@QueryString", $"Error RecordExistsAsync: {sql}")
                       , ("@Duration", "")
                       , ("@User", userName));
                return false;
            }
        }
    }


    public async Task<DataTable> ExecuteStoredProcedureReturn(string storedProcedureName, params (string Key, object Value)[] parameters)
    {
        try
        {
            var resultTable = new DataTable();

            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                connection.Open();

                using (SqlCommand command = new SqlCommand(storedProcedureName, connection))
                {
                    command.CommandType = CommandType.StoredProcedure;

                    foreach (var param in parameters)
                    {
                        command.Parameters.AddWithValue(param.Key, param.Value ?? DBNull.Value);
                    }

                    using (var adapter = new SqlDataAdapter(command))
                    {
                        adapter.Fill(resultTable);
                    }
                    return resultTable;
                }
            }
        }
        catch (Exception ex)
        {
            Serilog.Log.Error(ex, ex.Message);
            return null;
        }
    }

    public async Task<T> UpdateData(T entity, string changeFields, long? keyId, string keyField)
    {
        using (var connection = new SqlConnection(_connectionString))
        {
            var userName = _httpContextAccessor?.HttpContext?.User?.Identity?.Name.Replace("TOKIOMARINE\\", "");
            Util.HandleSystemAttribute(entity, userName, CommandQueryType.Update);
            string updateQuery = Util.BuildUpdateQuery<T>(changeFields, typeof(T).Name, keyId, keyField, userName);
            try
            {
                if (!string.IsNullOrEmpty(updateQuery))
                {
                    connection.Execute(updateQuery, entity);
                    Util.QueryLogs(_connectionString, "sp_Querylogs",
                          ("@QueryString", $"UpdateData: {updateQuery}")
                          , ("@Duration", "")
                          , ("@User", userName));
                }
            }
            catch (Exception ex)
            {
                Util.QueryLogs(_connectionString, "sp_Querylogs",
                      ("@QueryString", $"Error UpdateData: {updateQuery}")
                      , ("@Duration", "")
                      , ("@User", userName));
                Serilog.Log.Error(ex, ex.Message);
            }
            return entity;
        }
    }

    public async Task<T> UpdateSpecificData(T entity, string changeFields, long? keyId, string keyField)
    {
        using (var connection = new SqlConnection(_connectionString))
        {
            var userName = _httpContextAccessor?.HttpContext?.User?.Identity?.Name.Replace("TOKIOMARINE\\", "");
            Util.HandleSystemAttribute(entity, userName, CommandQueryType.Update);
            string updateQuery = Util.BuildUpdateQuery<T>(changeFields, typeof(T).Name, keyId, keyField, userName);
            try
            {
                if (!string.IsNullOrEmpty(updateQuery))
                {
                    connection.Execute(updateQuery, entity);
                    Util.QueryLogs(_connectionString, "sp_Querylogs",
                         ("@QueryString", $"UpdateSpecificData: {updateQuery}")
                         , ("@Duration", "")
                         , ("@User", userName));
                }
            }
            catch (Exception ex)
            {
                Util.QueryLogs(_connectionString, "sp_Querylogs",
                   ("@QueryString", $"Error UpdateSpecificData: {updateQuery}")
                   , ("@Duration", "")
                   , ("@User", userName));
                Serilog.Log.Error(ex, ex.Message);
            }
            return entity;
        }
    }

    public async Task<T> DeleteData(T entity, object keyId, string keyField, bool isRemove = true)
    {
        using (var connection = new SqlConnection(_connectionString))
        {
            var userName = _httpContextAccessor?.HttpContext?.User?.Identity?.Name.Replace("TOKIOMARINE\\", "");
            var query = Util.BuildDeleteQuery(entity, keyId, keyField, userName, isRemove);

            var parameters = new DynamicParameters();
            var keyProperty = typeof(T).GetProperty(keyField);
            if (keyProperty != null)
            {
                var keyValue = keyProperty.GetValue(entity);
                parameters.Add($"@{keyField}", keyValue);
            }
            try
            {
                connection.Execute(query, parameters);
                Util.QueryLogs(_connectionString, "sp_Querylogs",
                    ("@QueryString", $"DeleteData: {query}")
                    , ("@Duration", "")
                    , ("@User", userName));
            }
            catch (Exception ex)
            {
                Util.QueryLogs(_connectionString, "sp_Querylogs",
                   ("@QueryString", $"Error DeleteData: {query}")
                   , ("@Duration", "")
                   , ("@User", userName));
                Serilog.Log.Error(ex, ex.Message);
            }
            return entity;
        }
    }



    public async Task<T> GetObjectByIdAsync(long id)
    {
        using (var connection = new SqlConnection(_connectionString))
        {
            var sql = Util.BuildSelectQuery<T>(); ;
            try
            {
                T result = await connection.QuerySingleOrDefaultAsync<T>(sql, new { Id = id });
                Util.QueryLogs(_connectionString, "sp_Querylogs",
                        ("@QueryString", $"GetObjectByIdAsync: {sql}")
                        , ("@Duration", "")
                        , ("@User", userName));
                return result;
            }
            catch
            {
                Util.QueryLogs(_connectionString, "sp_Querylogs",
                      ("@QueryString", $"Error GetObjectByIdAsync: {sql}")
                      , ("@Duration", "")
                      , ("@User", userName));
                return null;
            }
        }
    }

    public async Task<List<T>> GetManyObjectByIdAsync(int id)
    {
        using (var connection = new SqlConnection(_connectionString))
        {
            var sql = Util.BuildSelectQuery<T>(); ;
            try
            {
            var result = await connection.QueryAsync<T>(sql, new { Id = id });
            Util.QueryLogs(_connectionString, "sp_Querylogs",
                    ("@QueryString", $"GetManyObjectByIdAsync: {sql}")
                    , ("@Duration", "")
                    , ("@User", userName));
            return result.ToList();
            }
            catch
            {
                Util.QueryLogs(_connectionString, "sp_Querylogs",
               ("@QueryString", $"Error GetManyObjectByIdAsync: {sql}")
               , ("@Duration", "")
               , ("@User", userName));
                return null;
            }
        }
    }
    public async Task<List<T>> EnumData(string name)
    {
        using (var connection = new SqlConnection(_connectionString))
        {
            var sql = $@"SELECT EnumData.* FROM EnumData WITH (NOLOCK) 
                        INNER JOIN SysTable ON SysTable.Id = EnumData.SysTableId
                        WHERE SysTable.Name = '{name}' ORDER BY EnumOrder ASC";
            var result = await connection.QueryAsync<T>(sql, new { SysTableName = name });
            Util.QueryLogs(_connectionString, "sp_Querylogs",
                   ("@QueryString", $"EnumData: {sql}")
                   , ("@Duration", "")
                   , ("@User", userName));
            return result.ToList();
        }
    }
    public async Task<List<dynamic>> EnumLookup(string refField, string enumName = null)
    {
        using (var connection = new SqlConnection(_connectionString))
        {
            var sql = $@"SELECT EnumData.* FROM EnumData WITH (NOLOCK) 
                        INNER JOIN SysTable ON SysTable.Id = EnumData.SysTableId
                        WHERE SysTable.Name = '{typeof(T).Name}' AND EnumData.[Name] = '{refField}' ORDER BY EnumOrder ASC";

            if (!string.IsNullOrEmpty(enumName))
                sql = $@"SELECT EnumData.* FROM EnumData WITH (NOLOCK) 
                        INNER JOIN SysTable ON SysTable.Id = EnumData.SysTableId
                        WHERE EnumData.Name = '{enumName}' ORDER BY EnumOrder ASC";

            var result = await connection.QueryAsync<dynamic>(sql);
            Util.QueryLogs(_connectionString, "sp_Querylogs",
                  ("@QueryString", $"EnumLookup: {sql}")
                  , ("@Duration", "")
                  , ("@User", userName));
            return result.ToList();
        }
    }

    public async Task<dynamic> GetUserRoles(string accountName)
    {
        using (var connection = new SqlConnection(_connectionString))
        {
            var sql = $@"SELECT DISTINCT TOP 1 r.RoleName
                    FROM UserRoles ur
                    LEFT JOIN Users u ON ur.UserId = u.Id
                    LEFT JOIN Roles r ON ur.RoleId = r.Id
                    WHERE u.[username] = '{accountName}'";
            var result = await connection.QueryAsync<dynamic>(sql);
            Util.QueryLogs(_connectionString, "sp_Querylogs",
                 ("@QueryString", $"GetUserRoles: {sql}")
                 , ("@Duration", "")
                 , ("@User", userName));
            return result.ToList().FirstOrDefault();
        }
    }

    public async Task UpdateEnum(string refField, string valueKey, long sysTableId)
    {
        using (var connection = new SqlConnection(_connectionString))
        {
            var sql = $@"INSERT INTO EnumData ([Key],[Name],SysTableId) VALUES (N'{valueKey}',N'{refField}',{sysTableId})";
            var result = await connection.QueryAsync<dynamic>(sql);
            Util.QueryLogs(_connectionString, "sp_Querylogs",
                ("@QueryString", $"UpdateEnum: {sql}")
                , ("@Duration", "")
                , ("@User", userName));
        }
    }

    public async Task<List<T>> GetAll()
    {
        using (var connection = new SqlConnection(_connectionString))
        {
            var query = Util.BuildSelectAllQuery<T>(typeof(T).Name);
            var result = await connection.QueryAsync<T>(query);
            var prop = typeof(T).GetProperty("RowOrder");
            if (prop != null)
            {
                return result.OrderBy(x =>
                {
                    var val = prop.GetValue(x);
                    if (val == null) return 0;
                    return Convert.ToInt32(val);
                }).ToList();
            }
            Util.QueryLogs(_connectionString, "sp_Querylogs",
               ("@QueryString", $"GetAll: {query}")
               , ("@Duration", "")
               , ("@User", userName));
            return result.ToList();
        }
    }

    public async Task<List<T>> GetAllActive()
    {
        using (var connection = new SqlConnection(_connectionString))
        {
            var query = Util.BuildSelectAllActiveQuery<T>(typeof(T).Name);
            var result = await connection.QueryAsync<T>(query);
            Util.QueryLogs(_connectionString, "sp_Querylogs",
               ("@QueryString", $"GetAllActive: {query}")
               , ("@Duration", "")
               , ("@User", userName));
            return result.ToList();
        }
    }




    public async Task<T> IncludeSpecificField(T entity, string prefixMainField, params Expression<Func<T, object>>[] includeProperties)
    {
        if (entity != null)
        {
            using (var connection = new SqlConnection(_connectionString))
            {
                T entityResult = entity;
                foreach (var property in includeProperties)
                {
                    string includeObject = property.Body.GetMemberExpressions().First().Type.Name.ToString();
                    var foreignKeyPropertyName = prefixMainField + includeObject + "Id";
                    var foreignKeyPropertyInfo = typeof(T).GetProperty(foreignKeyPropertyName);
                    var sql = Util.BuildSelectQuery<T>(includeObject);
                    if (foreignKeyPropertyInfo != null)
                    {
                        var foreignKeyValue = foreignKeyPropertyInfo.GetValue(entity);
                        var result = await connection.QueryFirstOrDefaultAsync<dynamic>(sql, new { Id = foreignKeyValue });
                        var jsonResult = JsonConvert.SerializeObject(result);

                        var propertyInfo = typeof(T).GetProperty(prefixMainField + includeObject + "FK");

                        if (propertyInfo != null && propertyInfo.CanWrite)
                        {
                            var deserializedObject = JsonConvert.DeserializeObject(jsonResult, propertyInfo.PropertyType);
                            propertyInfo.SetValue(entityResult, deserializedObject);
                        }
                    }
                    Util.QueryLogs(_connectionString, "sp_Querylogs",
                       ("@QueryString", $"IncludeSpecificField: {sql}")
                       , ("@Duration", "")
                       , ("@User", userName));
                }
                return entityResult;
            }
        }
        else return null;
    }




    public async Task<T> ObjectSpecificInclude(T entity, params Expression<Func<T, object>>[] includeProperties)
    {
        using (var connection = new SqlConnection(_connectionString))
        {
            T entityResult = entity;
            if (entityResult == null) return new T();
            foreach (var propertyExpression in includeProperties)
            {
                if (propertyExpression.Body is MemberExpression memberExpression)
                {
                    var includeObject = memberExpression.Member.Name.Replace("FK", "");
                    var foreignKeyPropertyName = includeObject + "Id";
                    var foreignKeyPropertyInfo = typeof(T).GetProperty(foreignKeyPropertyName);
                    if (foreignKeyPropertyInfo != null)
                    {
                        var sql = Util.BuildSelectQuery<T>(includeObject);
                        var foreignKeyValue = foreignKeyPropertyInfo.GetValue(entity);
                        if (foreignKeyValue != null)
                        {
                            var result = await connection.QueryFirstOrDefaultAsync<dynamic>(sql, new { Id = foreignKeyValue });
                            var jsonResult = JsonConvert.SerializeObject(result);
                            var propertyInfo = typeof(T).GetProperty(includeObject + "FK");
                            if (propertyInfo != null && propertyInfo.CanWrite)
                            {
                                var deserializedObject = JsonConvert.DeserializeObject(jsonResult, propertyInfo.PropertyType);
                                propertyInfo.SetValue(entityResult, deserializedObject);
                            }
                        }
                        Util.QueryLogs(_connectionString, "sp_Querylogs",
                       ("@QueryString", $"ObjectSpecificInclude: {sql}")
                       , ("@Duration", "")
                       , ("@User", userName));
                    }
                }
                else if (propertyExpression.Body is UnaryExpression unaryExpression &&
                         unaryExpression.Operand is MemberExpression unaryMemberExpression)
                {
                    var includeObject = unaryMemberExpression.Member.Name.Replace("FK", "");
                    var foreignKeyPropertyName = includeObject + "Id";
                    var foreignKeyPropertyInfo = typeof(T).GetProperty(foreignKeyPropertyName);
                    if (foreignKeyPropertyInfo != null)
                    {
                        var sql = Util.BuildSelectQuery<T>(includeObject);
                        var foreignKeyValue = foreignKeyPropertyInfo.GetValue(entity);
                        Util.QueryLogs(_connectionString, "sp_Querylogs",
                          ("@QueryString", $"ObjectSpecificInclude: {sql}")
                          , ("@Duration", "")
                          , ("@User", userName));
                    }
                }
            }
            return entityResult;
        }
    }

    public async Task<dynamic> GetScheme(T entity)
    {
        using (var connection = new SqlConnection(_connectionString))
        {
            var sql = Util.BuildGetTableColumnsFromConfigQuery(typeof(T).Name.ToString());
            dynamic result = await connection.QueryAsync<dynamic>(sql, new { });
            Util.QueryLogs(_connectionString, "sp_Querylogs",
                         ("@QueryString", $"GetScheme: {sql}")
                         , ("@Duration", "")
                         , ("@User", userName));
            return result;
        }
    }

    public async Task<dynamic> GetAllScheme()
    {
        using (var connection = new SqlConnection(_connectionString))
        {
            var sql = Util.BuildGetAllTableColumnsFromConfigQuery();
            dynamic result = await connection.QueryAsync<dynamic>(sql, new { });
            Util.QueryLogs(_connectionString, "sp_Querylogs",
                        ("@QueryString", $"GetAllScheme: {sql}")
                        , ("@Duration", "")
                        , ("@User", userName));
            return result;
        }
    }
    public async Task<dynamic> GetSystemScheme(T entity)
    {
        using (var connection = new SqlConnection(_connectionString))
        {
            var sql = Util.BuildGetTableColumnsFromDataBaseQuery(typeof(T).Name.ToString());
            dynamic result = await connection.QueryAsync<dynamic>(sql, new { });
            Util.QueryLogs(_connectionString, "sp_Querylogs",
                       ("@QueryString", $"GetSystemScheme: {sql}")
                       , ("@Duration", "")
                       , ("@User", userName));
            return result;
        }
    }

    public async Task<T> FindBy(Func<T, bool> predicate = null)
    {
        using (var connection = new SqlConnection(_connectionString))
        {
            var query = Util.BuildSelectAllQuery<T>(typeof(T).Name);
            var result = await connection.QueryAsync<T>(query);
            Util.QueryLogs(_connectionString, "sp_Querylogs",
                      ("@QueryString", $"FindBy: {query}")
                      , ("@Duration", "")
                      , ("@User", userName));
            if (predicate != null)
                if (result.ToList().Any(predicate))
                    return result.ToList().Where(predicate).First();
                else return new T();
            else
                return new T();
        }
    }

    public async Task<List<T>> GetFKMany(int fkId, string fkField)
    {
        //var sql = $@"SELECT * FROM {typeof(T).Name} WITH (NOLOCK) WHERE {fkField} = @Id";

        var sql = Util.BuildSelectQuery<T>(null, fkField);
        try
        {
            using (var connection = new SqlConnection(_connectionString))
            {
                var result = await connection.QueryAsync<T>(sql, new { Id = fkId });
                Util.QueryLogs(_connectionString, "sp_Querylogs",
                   ("@QueryString", $"GetFKMany: {sql}")
                   , ("@Duration", "")
                   , ("@User", userName));
                return result.ToList();
            }
        }
        catch (Exception ex)
        {
            Serilog.Log.Error(ex, ex.Message);
            throw new Exception($"GetFKMany Exception Query: {sql}. Details: {ex.Message}");
        }
    }

    public async Task<T> IncludeListsOnly(T entity)
    {
        if (entity == null) return entity;
        using (var connection = new SqlConnection(_connectionString))
        {
            var entityType = typeof(T);
            var properties = entityType.GetProperties();

            foreach (var property in properties)
            {
                if (property.PropertyType.IsGenericType &&
                    property.PropertyType.GetGenericTypeDefinition() == typeof(List<>))
                {
                    var listItemType = property.PropertyType.GetGenericArguments()[0];

                    var foreignKeyProperty = listItemType.GetProperty($"{typeof(T).Name}Id");
                    if (foreignKeyProperty != null)
                    {
                        var tableName = listItemType.Name;
                        var parentId = entity.GetType().GetProperty("Id")?.GetValue(entity);
                        string parentField = $"{typeof(T).Name}Id";
                        var sql = Util.BuildSelectQuery<T>(tableName, parentField);

                        var result = await connection.QueryAsync(listItemType, sql, new { Id = parentId });



                        // Khởi tạo List mới và gán các kết quả truy vấn vào List này
                        var listType = typeof(List<>).MakeGenericType(listItemType);
                        var list = (IList)Activator.CreateInstance(listType);
                        foreach (var item in result)
                        {
                            list.Add(item);
                        }

                        // Gán lại List vào thuộc tính của entity
                        property.SetValue(entity, list);
                        Util.QueryLogs(_connectionString, "sp_Querylogs",
                          ("@QueryString", $"IncludeListsOnly: {sql}")
                          , ("@Duration", "")
                          , ("@User", userName));
                    }
                }
            }

            return entity;
        }
    }


    public async Task<List<Dictionary<string, object>>> ExecuteCustomQuery(string query)
    {
        try
        {
            var resultList = new List<Dictionary<string, object>>();

            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                await connection.OpenAsync();

                using (SqlCommand command = new SqlCommand(query, connection))
                {
                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        // Đọc dữ liệu từ DataReader
                        while (await reader.ReadAsync())
                        {
                            var row = new Dictionary<string, object>();

                            for (int i = 0; i < reader.FieldCount; i++)
                            {
                                var columnName = Char.ToLowerInvariant(reader.GetName(i)[0]) + reader.GetName(i).Substring(1);

                                //var columnName = reader.GetName(i); // Tên cột
                                var value = reader.IsDBNull(i) ? null : reader.GetValue(i); // Giá trị cột
                                row[columnName] = value; // Thêm vào dictionary
                            }

                            resultList.Add(row);
                        }
                    }
                }
                Util.QueryLogs(_connectionString, "sp_Querylogs",
                       ("@QueryString", $"ExecuteCustomQuery: {query}")
                       , ("@Duration", "")
                       , ("@User", userName));
            }

            return resultList;
        }
        catch (Exception ex)
        {
            Serilog.Log.Error(ex, ex.Message);
            return null;
        }
    }

    public async Task<List<Dictionary<string, object>>> ExecuteCustomJogetQuery(string query)
    {
        try
        {
            var resultList = new List<Dictionary<string, object>>();

            using (SqlConnection connection = new SqlConnection(_jogetConnectionString))
            {
                await connection.OpenAsync();

                using (SqlCommand command = new SqlCommand(query, connection))
                {
                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        // Đọc dữ liệu từ DataReader
                        while (await reader.ReadAsync())
                        {
                            var row = new Dictionary<string, object>();

                            for (int i = 0; i < reader.FieldCount; i++)
                            {
                                var columnName = Char.ToLowerInvariant(reader.GetName(i)[0]) + reader.GetName(i).Substring(1);

                                //var columnName = reader.GetName(i); // Tên cột
                                var value = reader.IsDBNull(i) ? null : reader.GetValue(i); // Giá trị cột
                                row[columnName] = value; // Thêm vào dictionary
                            }

                            resultList.Add(row);
                        }
                    }
                }
                Util.QueryLogs(_connectionString, "sp_Querylogs",
                       ("@QueryString", $"ExecuteCustomQuery: {query}")
                       , ("@Duration", "")
                       , ("@User", userName));
            }

            return resultList;
        }
        catch (Exception ex)
        {
            Serilog.Log.Error(ex, ex.Message);
            return null;
        }
    }
    public async Task<List<T>> GetAllInclude()
    {
        List<T> returnObjectList = new List<T>();
        returnObjectList = await GetAll();
        returnObjectList.ForEach(f =>
        {
            FKEnumLogicRunSync(f);
        });
        return returnObjectList;
    }

    public async Task<T> GetSingleObjectFullInclude(Expression<Func<T, bool>> predicate, params Expression<Func<T, object>>[] includeProperties)
    {
        T entity = new T();
        entity = await GetSingleObject(predicate);
        FKEnumLogicRunSync(entity);
        if (includeProperties.Count() > 0)
            entity = IncludeSpecificFieldSync(entity, includeProperties);
        return entity;
    }

    public async Task<T> GetObjectIncludeByIdAsync(long id)
    {
        T entity = new T();
        entity = await GetObjectByIdAsync(id);
        FKEnumLogicRunSync(entity);
        return entity;
    }


    //Last change date: 2025-02-21
    public async Task<List<T>> GetListObjectFullInclude(Expression<Func<T, bool>> predicate, params Expression<Func<T, object>>[] includeProperties)
    {
        List<T> entities = new List<T>(); var compiledPredicate = predicate.Compile();
        using (var connection = new SqlConnection(_connectionString))
        {

            var sql = Util.BuildSelectAllQuery<T>(typeof(T).Name); ;
            var result = await connection.QueryAsync<T>(sql, new { });
            IQueryable<T> queryableResult = result.ToList().AsQueryable();
            entities = queryableResult.ToList();
            entities.ForEach(f =>
            {
                FKEnumLogicRunSync(f);
                if (includeProperties.Count() > 0)
                {
                    f = IncludeSpecificFieldSync(f, includeProperties);
                }
            });
            Util.QueryLogs(_connectionString, "sp_Querylogs",
                     ("@QueryString", $"GetListObjectFullInclude: {sql}")
                     , ("@Duration", "")
                     , ("@User", userName));
        }


        if (entities.Any(compiledPredicate))
            entities = (entities.Where(compiledPredicate).ToList());
        return entities;
    }




    #region Sync

    //Last change date: 2025-02-21
    public EnumData? ObjectSpecificEnumIncludeSync(object entity, string enumName, params Expression<Func<T, object>>[] includeProperties)
    {
        EnumData returnObject = new EnumData();
        using (var connection = new SqlConnection(_connectionString))
        {
            if (includeProperties.Count() > 0)
                returnObject = (EnumData)PropertyProcess(entity, includeProperties, connection, IncludeType.Enum, enumName);

        }
        return returnObject;
    }

    //Last change date: 2025-02-21
    public void FKEnumLogicRunSync(T entity)
    {
        var entityType = typeof(T);
        var properties = entityType.GetProperties();
        foreach (var property in properties)
        {
            if (property.Name.EndsWith("FK") &&
               !property.PropertyType.IsValueType &&
               property.PropertyType != typeof(string) &&
               property.PropertyType != typeof(byte[]))
            {
                var lambda = Util.MakeLambda<T>(entityType, property);
                ObjectSpecificIncludeSync(entity, lambda);
            }
            if (property.Name.EndsWith("Enum") &&
              !property.PropertyType.IsValueType &&
              property.PropertyType != typeof(string) &&
              property.PropertyType != typeof(byte[]))
            {
                var lambda = Util.MakeLambda<T>(entityType, property);
                ObjectSpecificEnumIncludeSync(entity, "", lambda);
            }
        }
    }

    //Last change date: 2025-02-21
    public T ObjectSpecificIncludeSync(T entity, params Expression<Func<T, object>>[] includeProperties)
    {
        using (var connection = new SqlConnection(_connectionString))
        {
            T entityResult = entity;
            if (includeProperties.Count() > 0)
                entityResult = (T)PropertyProcess(entity, includeProperties, connection, IncludeType.FK);

            return entityResult;
        }
    }



    //Last change date: 2025-02-21
    public object PropertyProcess(object entity, Expression<Func<T, object>>[] includeProperties, SqlConnection connection, IncludeType includeType, string enumName = "")
    {
        if (entity != null)
        {
            EnumData enumData = new EnumData();
            T entityResult = new T();
            if (includeType == IncludeType.Enum)
            {

            }
            else
                entityResult = (T)entity;
            string handleKeyWord = includeType == IncludeType.Enum ? "Enum" : "FK";
            if (includeType == IncludeType.Enum)
            {
                foreach (var propertyExpression in includeProperties)
                {
                    if (propertyExpression.Body is MemberExpression memberExpression)
                    {
                        var includeObject = memberExpression.Member.Name.Replace(handleKeyWord, "");
                        var foreignKeyPropertyName = includeObject + "Id";
                        var foreignKeyPropertyInfo = typeof(T).GetProperty(foreignKeyPropertyName);
                        if (foreignKeyPropertyInfo != null)
                        {
                            var sql = Util.BuildEnumQuery<EnumData>(enumName);
                            var foreignKeyValue = foreignKeyPropertyInfo.GetValue(entity);
                            if (foreignKeyValue != null)
                            {
                                var result = connection.QueryFirstOrDefault<dynamic>(sql, new { Id = foreignKeyValue });
                                var jsonResult = JsonConvert.SerializeObject(result);
                                var propertyInfo = typeof(T).GetProperty(includeObject + handleKeyWord);
                                if (propertyInfo != null && propertyInfo.CanWrite)
                                {
                                    enumData = JsonConvert.DeserializeObject<EnumData>(jsonResult);
                                    propertyInfo.SetValue(entity, enumData);
                                }
                            }
                            Util.QueryLogs(_connectionString, "sp_Querylogs",
                           ("@QueryString", $"PropertyProcess: {sql}")
                           , ("@Duration", "")
                           , ("@User", userName));
                        }
                    }
                    else if (propertyExpression.Body is UnaryExpression unaryExpression &&
                             unaryExpression.Operand is MemberExpression unaryMemberExpression)
                    {
                        var includeObject = unaryMemberExpression.Member.Name.Replace(handleKeyWord, "");
                        var foreignKeyPropertyName = includeObject + "Id";
                        var foreignKeyPropertyInfo = typeof(T).GetProperty(foreignKeyPropertyName);
                        if (foreignKeyPropertyInfo != null)
                        {
                            var sql = Util.BuildEnumQuery<T>(enumName);
                            var foreignKeyValue = foreignKeyPropertyInfo.GetValue(entity);

                            if (foreignKeyValue != null)
                            {
                                try
                                {
                                    var result = connection.QueryFirstOrDefault<dynamic>(sql, new { Id = foreignKeyValue });
                                    var jsonResult = JsonConvert.SerializeObject(result);

                                    var propertyInfo = typeof(T).GetProperty(includeObject + handleKeyWord);

                                    if (propertyInfo != null && propertyInfo.CanWrite)
                                    {
                                        enumData = JsonConvert.DeserializeObject<EnumData>(jsonResult);
                                        propertyInfo.SetValue(entity, enumData);
                                    }
                                }
                                catch
                                {
                                    continue;
                                }
                            }
                            Util.QueryLogs(_connectionString, "sp_Querylogs",
                            ("@QueryString", $"PropertyProcess: {sql}")
                            , ("@Duration", "")
                            , ("@User", userName));
                        }
                    }
                }
            }

            if (includeType == IncludeType.Other)
            {
                foreach (var property in includeProperties)
                {
                    string propName = property.Body.GetMemberExpressions().First().Member.Name.ToString();
                    string propertyTypeName = property.Body.GetMemberExpressions().First().Type.Name.ToString();
                    string prefixName = propName.Replace(propertyTypeName + handleKeyWord, "");
                    //string includeObject = property.Body.GetMemberExpressions().First().Type.Name.ToString();
                    var foreignKeyPropertyName = prefixName + propertyTypeName + "Id";
                    var foreignKeyPropertyInfo = typeof(T).GetProperty(foreignKeyPropertyName);
                    var sql = Util.BuildSelectQuery<T>(propertyTypeName);
                    if (foreignKeyPropertyInfo != null)
                    {
                        var foreignKeyValue = foreignKeyPropertyInfo.GetValue(entity);
                        var result = connection.QueryFirstOrDefault<dynamic>(sql, new { Id = foreignKeyValue });
                        var jsonResult = JsonConvert.SerializeObject(result);
                        var propertyInfo = typeof(T).GetProperty(prefixName + propertyTypeName + handleKeyWord);
                        if (propertyInfo != null && propertyInfo.CanWrite)
                        {
                            var deserializedObject = JsonConvert.DeserializeObject(jsonResult, propertyInfo.PropertyType);
                            propertyInfo.SetValue(entityResult, deserializedObject);
                        }
                    }
                    Util.QueryLogs(_connectionString, "sp_Querylogs",
                    ("@QueryString", $"PropertyProcess: {sql}")
                    , ("@Duration", "")
                    , ("@User", userName));
                }
            }

            if (includeType == IncludeType.FK)
            {
                foreach (var propertyExpression in includeProperties)
                {
                    if (propertyExpression.Body is MemberExpression memberExpression)
                    {
                        var includeObject = memberExpression.Member.Name.Replace(handleKeyWord, "");
                        var foreignKeyPropertyName = includeObject + "Id";
                        var foreignKeyPropertyInfo = typeof(T).GetProperty(foreignKeyPropertyName);
                        if (foreignKeyPropertyInfo != null)
                        {
                            var sql = Util.BuildSelectQuery<T>(includeObject);
                            var foreignKeyValue = foreignKeyPropertyInfo.GetValue(entity);
                            if (foreignKeyValue != null)
                            {
                                var result = connection.QueryFirstOrDefault<dynamic>(sql, new { Id = foreignKeyValue });
                                var jsonResult = JsonConvert.SerializeObject(result);
                                var propertyInfo = typeof(T).GetProperty(includeObject + handleKeyWord);
                                if (propertyInfo != null && propertyInfo.CanWrite)
                                {
                                    var deserializedObject = JsonConvert.DeserializeObject(jsonResult, propertyInfo.PropertyType);
                                    propertyInfo.SetValue(entityResult, deserializedObject);
                                }
                            }
                            Util.QueryLogs(_connectionString, "sp_Querylogs",
                            ("@QueryString", $"PropertyProcess: {sql}")
                            , ("@Duration", "")
                            , ("@User", userName));
                        }
                    }
                    else if (propertyExpression.Body is UnaryExpression unaryExpression &&
                             unaryExpression.Operand is MemberExpression unaryMemberExpression)
                    {
                        var includeObject = unaryMemberExpression.Member.Name.Replace(handleKeyWord, "");
                        var foreignKeyPropertyName = includeObject + "Id";
                        var foreignKeyPropertyInfo = typeof(T).GetProperty(foreignKeyPropertyName);
                        if (foreignKeyPropertyInfo != null)
                        {
                            var sql = Util.BuildSelectQuery<T>(includeObject);
                            var foreignKeyValue = foreignKeyPropertyInfo.GetValue(entity);

                            if (foreignKeyValue != null)
                            {
                                try
                                {
                                    var result = connection.QueryFirstOrDefault<dynamic>(sql, new { Id = foreignKeyValue });
                                    var jsonResult = JsonConvert.SerializeObject(result);

                                    var propertyInfo = typeof(T).GetProperty(includeObject + handleKeyWord);

                                    if (propertyInfo != null && propertyInfo.CanWrite)
                                    {
                                        var deserializedObject = JsonConvert.DeserializeObject(jsonResult, propertyInfo.PropertyType);
                                        propertyInfo.SetValue(entityResult, deserializedObject);
                                    }
                                }
                                catch
                                {
                                    continue;
                                }
                            }
                            Util.QueryLogs(_connectionString, "sp_Querylogs",
                    ("@QueryString", $"PropertyProcess: {sql}")
                    , ("@Duration", "")
                    , ("@User", userName));
                        }
                    }
                }
            }
            if (includeType == IncludeType.Enum)
            {
                return enumData;
            }
            else
                return entityResult;
        }
        else
            return null;
    }

    //Last change date: 2025-02-21
    public T IncludeSpecificFieldSync(T entity, params Expression<Func<T, object>>[] includeProperties)
    {
        if (entity != null)
        {
            using (var connection = new SqlConnection(_connectionString))
            {
                T entityResult = entity;
                if (includeProperties.Count() > 0)
                    entityResult = (T)PropertyProcess(entity, includeProperties, connection, IncludeType.Other);
                return entityResult;
            }
        }
        else return null;
    }
    #endregion
    public enum IncludeType
    {
        Other,
        Enum,
        FK
    }
}


