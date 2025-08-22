using Microsoft.Extensions.Logging;
using ILogger = Serilog.ILogger;
using System;
using Serilog;
using Serilog.Debugging;
using System.Linq.Expressions;
using Serilog.Events;
using SurveyReportRE.Common;
using RESurveyTool.Models.Models.Base;

namespace RESurveyTool.Common
{
    public static class LoggerUtil
    {
        private static ILogger _logger;

        // Hàm khởi tạo Serilog
        public static void InitializeLogger(string connectionString, string blobPath)
        {
            try
            {

                if (!string.IsNullOrEmpty(blobPath))
                {
                    SelfLog.Enable(msg => File.AppendAllText(Path.Combine(blobPath, "LibLogs", "serilog-errors.txt"), msg));
                    _logger = new LoggerConfiguration()
                        .MinimumLevel.Information()
                        .MinimumLevel.Override("Microsoft.AspNetCore", LogEventLevel.Error)
                        .Enrich.FromLogContext()
                        .WriteTo.Console()
                        .WriteTo.File(Path.Combine(blobPath, "LibLogs", "common-log-.txt"), rollingInterval: RollingInterval.Day) // Log vào file
                        .WriteTo.MSSqlServer(
                            connectionString,
                            sinkOptions: new Serilog.Sinks.MSSqlServer.MSSqlServerSinkOptions
                            {
                                TableName = "Logs",
                                AutoCreateSqlTable = true
                            }
                        )
                        .CreateLogger();
                }
                else
                {
                    SelfLog.Enable(msg => File.AppendAllText(Path.Combine(blobPath, "LibLogs", "serilog-errors.txt"), msg));
                    _logger = new LoggerConfiguration()
                        .MinimumLevel.Information()
                        .MinimumLevel.Override("Microsoft.AspNetCore", LogEventLevel.Error)
                        .Enrich.FromLogContext()
                        .WriteTo.Console()
                        .WriteTo.MSSqlServer(
                            connectionString,
                            sinkOptions: new Serilog.Sinks.MSSqlServer.MSSqlServerSinkOptions
                            {
                                TableName = "Logs",
                                AutoCreateSqlTable = true
                            }
                        )
                        .CreateLogger();
                }


            }
            catch
            {

            }
        }

        public static void LogInfo(SeriLogs serilogs, string _connectionString, string blobPath = "", Exception exception = null)
        {
            try
            {
                _logger = new LoggerConfiguration()
                      .MinimumLevel.Information()
                      .MinimumLevel.Override("Microsoft.AspNetCore", LogEventLevel.Error)
                      .Enrich.FromLogContext()
                      .WriteTo.Console()
                      .WriteTo.MSSqlServer(
                          _connectionString,
                          sinkOptions: new Serilog.Sinks.MSSqlServer.MSSqlServerSinkOptions
                          {
                              TableName = "Logs",
                              AutoCreateSqlTable = true
                          }
                      )
                      .CreateLogger();
                //DataUtil.ExecuteStoredProcedureReturn(_connectionString, "sp_WriteLogs",
                //    ("@Message", serilogs.Exception.Message)
                //    , ("@TimeStamp", serilogs.TimeStamp)
                //    , ("@MessageTemplate", serilogs.MessageTemplate)
                //    , ("@Properties", serilogs.Properties)
                //    , ("@Level", serilogs.Level)
                //    , ("@Exception", serilogs.Message));
                //_logger?.Information("Test");
            }
            catch (Exception logException)
            {
                if (!string.IsNullOrEmpty(blobPath))
                    File.AppendAllText(Path.Combine(blobPath, "LibLogs", "Log-Exception.txt"), logException.Message + "\n");
            }
        }

        public static void LogError(Exception ex, string message = "", string connection = "")
        {
            _logger = new LoggerConfiguration()
                      .MinimumLevel.Information()
                      .MinimumLevel.Override("Microsoft.AspNetCore", LogEventLevel.Error)
                      .Enrich.FromLogContext()
                      .WriteTo.Console()
                      .WriteTo.MSSqlServer(
                          connection,
                          sinkOptions: new Serilog.Sinks.MSSqlServer.MSSqlServerSinkOptions
                          {
                              TableName = "Logs",
                              AutoCreateSqlTable = true
                          }
                      )
                      .CreateLogger();
            _logger?.Error(ex, message);
        }

    }
}

