using Microsoft.Data.SqlClient;
using RESurveyTool.Common.Common;
using System.Data;

namespace SurveyReportRE.Common
{
    public static class DataUtil
    {
        public static DataTable ExecuteStoredProcedureReturn(string connectionString, string storedProcedureName, params (string Key, object Value)[] parameters)
        {
            try
            {
                var resultTable = new DataTable();

                using (SqlConnection connection = new SqlConnection(connectionString))
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
                Handler.ErrorException(ex, "");
                return null;
            }
        }

        public static DataTable ExecuteSelectQuery(string connectionString, string query, params (string Key, object Value)[] parameters)
        {
            try
            {
                var resultTable = new DataTable();

                using (SqlConnection connection = new SqlConnection(connectionString))
                {
                    connection.Open();

                    using (SqlCommand command = new SqlCommand(query, connection))
                    {
                        command.CommandType = CommandType.Text;

                        // Gắn các tham số vào câu query
                        foreach (var param in parameters)
                        {
                            command.Parameters.AddWithValue(param.Key, param.Value ?? DBNull.Value);
                        }

                        using (SqlDataAdapter adapter = new SqlDataAdapter(command))
                        {
                            adapter.Fill(resultTable);
                        }
                    }
                }

                return resultTable;
            }
            catch (Exception ex)
            {
                Handler.ErrorException(ex,"");
                return null; // Hoặc có thể ném lại exception tuỳ yêu cầu
            }
        }


        //public static GridConfig ScraffoldFromCustomQuery(string SysObjectCode, HRMDbContext dbContext, string query, bool isQueryDB = true)
        //{
        //    GridConfig gc = Scraffold.GetConfiguration(SysObjectCode, dbContext);


        //    DataTable schema = new DataTable();
        //    var listOfDynamic = new List<dynamic>();


        //    using (var dbConn = new SqlConnection(Util.GetConnectionString()))
        //    {
        //        dbConn.Open();
        //        string sql = query;//replace this with your store procedure name      
        //        SqlCommand cmd = new SqlCommand(sql, dbConn);
        //        cmd.CommandType = CommandType.Text;
        //        SqlDataReader reader = cmd.ExecuteReader();
        //        schema = reader.GetSchemaTable();
        //        reader.Close();
        //        dbConn.Close();
        //    }

        //    if (schema != null)
        //    {
        //        foreach (DataRow row in schema.Rows)
        //        {
        //            dynamic column = new ExpandoObject();
        //            foreach (DataColumn col in schema.Columns)
        //            {
        //                ((IDictionary<string, object>)column)[col.ColumnName] = row[col];
        //            }
        //            listOfDynamic.Add(column);
        //        }
        //    }


        //    return gc;
        //}

    }
}
