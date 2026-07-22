using Microsoft.Data.SqlClient;
using ERPCore.Common.Common;
using System.Data;

namespace ERPCore.Common
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
                throw new Exception(ex.Message);
                //return null;
            }
        }

        public static DataTable ExecuteSelectQuery(string connectionString, string query, params (string Key, object Value)[] parameters)
        {
            try
            {
                var resultTable = new DataTable();
                if (!string.IsNullOrEmpty(query))
                {
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
                }
                return resultTable;
            }
            catch (Exception ex)
            {
                Handler.ErrorException(ex,"");
                Serilog.Log.Error(ex, ex.Message);
                return null; // Hoặc có thể ném lại exception tuỳ yêu cầu
            }
        }
    }
}
