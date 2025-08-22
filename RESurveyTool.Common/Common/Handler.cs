using RESurveyTool.Models.Models.Base;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Diagnostics;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RESurveyTool.Common.Common
{
    public static class Handler
    {
        public static void ErrorException(Exception exception, string blobpath)
        {
            //var connection = ConfigurationManager.AppSettings["LogConnection"].Value;
            var connection = ConfigurationManager.ConnectionStrings["LogConnection"].ConnectionString;
            LoggerUtil.InitializeLogger(Constant.ConfigConstant._logConnection, blobpath);
            var stackTrace = new StackTrace(exception, true);
            var frame = stackTrace.GetFrame(0); 
            var method = frame.GetMethod(); 
            var fileName = frame.GetFileName(); 
            var lineNumber = frame.GetFileLineNumber(); 
            var time = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");

            // Xây dựng nội dung log

            string logMessage = $@"StackTrace: {exception.StackTrace}";


            //string logMessage = $@"StackTrace: {exception.StackTrace}";
            SeriLogs  seriLogs = new SeriLogs();
            seriLogs.Message = logMessage;
            seriLogs.Exception = exception;
            seriLogs.TimeStamp = DateTime.Now;
            seriLogs.MessageTemplate = "Common Util Exception";
            seriLogs.Level = lineNumber.ToString() ;
            seriLogs.Properties = method.Name;


            if (!string.IsNullOrEmpty(blobpath))
            {
                if (!Directory.Exists(Path.Combine(blobpath, "LibLogs")))
                {
                    Directory.CreateDirectory(Path.Combine(blobpath, "LibLogs"));
                }
            }
            //LoggerUtil.LogInfo(seriLogs, Constant.ConfigConstant._logConnection, blobpath, exception);
            LoggerUtil.LogError( exception, exception.Message, Constant.ConfigConstant._logConnection);
            
        }
    }
}
