using Microsoft.AspNetCore.Connections;
using Microsoft.AspNetCore.Http;
using Newtonsoft.Json;
using ERPCore.Models.Models.Parsing;
using Serilog.Context;
using ERPCore.Models.Migration.Business.Form;
using ERPCore.Models.Migration.Business.Workflow;
using ERPCore.Models.Migration.Config;
using System.Data;
using System.Security.Claims;
using System.Text;
using Microsoft.Data.SqlClient;
using TMIVHashing;
using ERPCore.Models.Request;
using Microsoft.Extensions.Options;
using ERPCore.Models;
using ERPCore.Models.Base;
using Microsoft.AspNetCore.Mvc;
using iText.StyledXmlParser.Node;
using Microsoft.AspNetCore.SignalR;
using RESurveyTool.Models.Models.Parsing;
using ERPCore.Models.Migration.Business.Social;
using ERPCore.Common;
using ERPCore.Models.Business.Migration.Config;
using static ERPCore.Models.Models.Parsing.JsonHandle;

namespace ERPCore.ControllerUtil
{
    public static class ControllerUtil
    {
        public static string tmivEnvironment = "Default";
        public static string jogetEnvironment = "Joget";
        public static string GetWebFile(IWebHostEnvironment env, string folder, string filename)
        {
            return env.WebRootPath
               + Path.DirectorySeparatorChar.ToString()
               + folder
               + Path.DirectorySeparatorChar.ToString()
               + filename;
        }

        public static string  GetCurrentContextUser(IHttpContextAccessor httpContextAccessor, IConfiguration configuration)
        {
            string domain = configuration?.GetSection("Domain:DCServer").Value ?? "";
            var DebugEnv = bool.Parse(configuration?.GetSection("SuperUser:IsDebug").Value ?? "");
            if (DebugEnv && httpContextAccessor?.HttpContext?.User?.Identity?.Name == null)
            {
                return "quan.nh";
            }
            return httpContextAccessor?.HttpContext?.User?.Identity?.Name?.Replace(domain, "") ?? ""; 
        }

        public static void ContextHandle(IHttpContextAccessor httpContextAccessor, IConfiguration configuration, out bool isDebugmode)
        {
            isDebugmode = false;
            string checkIfLoginAsDebug = configuration.GetSection("SuperUser:LoginAs").Value;
            string superUsers = configuration.GetSection("SuperUser:SuperUser").Value;
            
            if (!string.IsNullOrEmpty(checkIfLoginAsDebug))
            {
                {
                    var newIdentity = new ClaimsIdentity();
                    newIdentity.AddClaim(new System.Security.Claims.Claim(newIdentity.NameClaimType, checkIfLoginAsDebug));
                    httpContextAccessor.HttpContext.User = new ClaimsPrincipal(newIdentity);
                }
            }
            var session = httpContextAccessor.HttpContext.Session;
            if (session != null && session.TryGetValue("ImpersonatedUser", out var userData))
            {
                var impersonatedUser = System.Text.Encoding.UTF8.GetString(userData);
                if (!string.IsNullOrWhiteSpace(impersonatedUser))
                {
                    isDebugmode = true;
                    var newIdentity = new ClaimsIdentity();
                    newIdentity.AddClaim(new System.Security.Claims.Claim(newIdentity.NameClaimType, impersonatedUser));
                    httpContextAccessor.HttpContext.User = new ClaimsPrincipal(newIdentity);
                }
            }else
            {
            }
        }

        public static (PICAttributes PICMain, PICSysHandleAttributes PICLeader) PersonInChargeHandle(dynamic objectIn, StepsWorkflow stepsWorkflow, Microsoft.Extensions.Options.IOptionsMonitor<BusinessConfig> businessConfig)
        {

            var getBranchId = businessConfig.CurrentValue.Sites.Values.Where(w => w.BranchCode == objectIn.BranchId).ToList();
            PICSysHandleAttributes PICLeader = new PICSysHandleAttributes();
            PICLeader = getBranchId.First().LeaderFollowRequest;
            PICAttributes PICMain = new PICAttributes();
            PICMain = JsonConvert.DeserializeObject<PICAttributes>(objectIn.PIC);
            //TurnAroundAttributes result = JsonConvert.DeserializeObject<TurnAroundAttributes>(objectIn.TurnAroundTimeAttributes);
            //TurnAroundItem tatObject = stepsWorkflow.ToNodeId switch
            //{
            //    "FO" => result.FO,
            //    "TS" => result.TS,
            //    "UW" => result.UW,
            //    "LMKT" => result.LMKT,
            //    "PM" => result.PM,
            //    _ => null
            //};
            //tatObject.CompleteDate = DateTime.Now;
            //switch (stepsWorkflow.FromNodeId)
            //{
            //    case "FO":
            //        result.FO = tatObject;
            //        break;
            //    case "TS":
            //        result.TS = tatObject;
            //        break;
            //    case "UW":
            //        result.UW = tatObject;
            //        break;
            //    case "LMKT":
            //        result.LMKT = tatObject;
            //        break;
            //    case "PM":
            //        result.PM = tatObject;
            //        break;
            //}
            //objectIn.TurnAroundTimeAttributes = JsonConvert.SerializeObject(result);



            return (PICMain, PICLeader);

        }
        public static async Task<Notification> Notify(dynamic transferObject
            )
        {
            string DOMAIN_NAME = transferObject.DOMAIN_NAME;
            NotificationRequest notification = new NotificationRequest();
            Notification Notification = new Notification();
            Notification.Title = transferObject.Title; 
            Notification.Message = transferObject.Subject;
            Notification.IsRead = false;
            Notification.Url = $"/Business/Form/{nameof(Quotation)}_Form/{transferObject.Id}";
            Notification.Resource = $"{transferObject.Resource}";
            Notification.System = "WM";
            Notification.RecordGuid = transferObject.Guid;

            Notification.ReceivedBy = transferObject.ReceivedBy;
            notification.Notification = Notification;
            notification.connectionId = transferObject.ReceivedBy;
            //notification.tabPublicUrl = new
            //{
            //    url = $"/Business/Form/{nameof(Quotation)}_Form/{transferObject.Id}",
            //    caption = $"form_{nameof(Quotation)}_Form_{transferObject.Id}",
            //    name = $"{nameof(Quotation)} {transferObject.Code}",
            //    data = ""
            //}; 
            notification.tabPublicUrl = Util.URLObjectMaking(transferObject);
            IReadOnlyList<OnlineUserDto> onlineUsers = FileProcessingHub._store.GetOnlineUsers();

            //OnlineUserDto onlineUser = onlineUsers.FirstOrDefault(f => f.User.Replace(DOMAIN_NAME, "") == transferObject.ReceivedBy);
            //if (onlineUser?.ConnectionId != null)
            //{
            //    await FileProcessingHub._hubContext.Clients.Client(onlineUser?.ConnectionId).SendAsync("NotificationReceive",
            //              new
            //              {
            //                  title = notification?.Notification?.Title ?? "",
            //                  message = notification?.Notification?.Message ?? ""
            //              });
            //}
            foreach (string item in transferObject.ReceivedBy.Split(','))
            {
                OnlineUserDto onlineUser = onlineUsers.FirstOrDefault(f => f.User.Replace(DOMAIN_NAME, "") == item);
                if (onlineUser?.ConnectionId != null)
                {
                    await FileProcessingHub._hubContext.Clients.Client(onlineUser?.ConnectionId).SendAsync("NotificationReceive",
                              new
                              {
                                  title = notification?.Notification?.Title ?? "",
                                  message = notification?.Notification?.Message ?? ""
                              });
                }
            }
            return Notification;
        }


        //public static async Task<Notification> MakeNotificationFromEmail(Notification Notification, dynamic transferObject
        //    )
        //{
        //    string DOMAIN_NAME = transferObject.DOMAIN_NAME;
        //    NotificationRequest notification = new NotificationRequest();
        //    notification.Notification = Notification;
        //    notification.connectionId = transferObject.ReceivedBy;
        //    notification.tabPublicUrl = new
        //    {
        //        url = $"/Business/Form/{nameof(Quotation)}_Form/{transferObject.Id}",
        //        caption = $"form_{nameof(Quotation)}_Form_{transferObject.Id}",
        //        name = $"{nameof(Quotation)} {transferObject.Code}",
        //        data = ""
        //    };
        //    IReadOnlyList<OnlineUserDto> onlineUsers = FileProcessingHub._store.GetOnlineUsers();
        //    foreach (string item in transferObject.ReceivedBy.Split(','))
        //    {
        //        OnlineUserDto onlineUser = onlineUsers.FirstOrDefault(f => f.User.Replace(DOMAIN_NAME, "") == item);
        //        if (onlineUser?.ConnectionId != null)
        //        {
        //            await FileProcessingHub._hubContext.Clients.Client(onlineUser?.ConnectionId).SendAsync("NotificationReceive",
        //                      new
        //                      {
        //                          title = notification?.Notification?.Title ?? "",
        //                          message = notification?.Notification?.Message ?? ""
        //                      });
        //        }
        //    }

        //    return Notification;
        //}


        public static async Task<Notification> NotifySameEmail(Notification Notification, dynamic transferObject
            )
        {
            string DOMAIN_NAME = transferObject.DOMAIN_NAME;
            NotificationRequest notification = new NotificationRequest();
            notification.Notification = Notification;
            notification.connectionId = transferObject.ReceivedBy;
            //notification.tabPublicUrl = new
            //{
            //    url = $"/Business/Form/{nameof(Quotation)}_Form/{transferObject.Id}",
            //    caption = $"form_{nameof(Quotation)}_Form_{transferObject.Id}",
            //    name = $"{nameof(Quotation)} {transferObject.Code}",
            //    data = ""
            //};
            notification.tabPublicUrl = Util.URLObjectMaking(transferObject);
            IReadOnlyList<OnlineUserDto> onlineUsers = FileProcessingHub._store.GetOnlineUsers();
            foreach (string item in transferObject.ReceivedBy.Split(','))
            {
                OnlineUserDto onlineUser = onlineUsers.FirstOrDefault(f => f.User.Replace(DOMAIN_NAME, "") == item);
                if (onlineUser?.ConnectionId != null)
                {
                    await FileProcessingHub._hubContext.Clients.Client(onlineUser?.ConnectionId).SendAsync("NotificationReceive",
                              new
                              {
                                  title = notification?.Notification?.Title ?? "",
                                  message = notification?.Notification?.Message ?? ""
                              });
                }
            }
           
            return Notification;
        }

        public static async Task<IActionResult> LogAction(IBaseRepository<QuotationCommentLog> _quotationCommentLogRepository
            , IHttpContextAccessor httpContextAccessor
            , IConfiguration configuration
            , string DOMAIN_NAME
            , dynamic entity
            , dynamic workflowEntity
            , IOptionsMonitor<BlobStorageSettings> optionsMonitor
            ) 
        {
            var userInfo = await ControllerHelper.FetchUserRoles(httpContextAccessor, configuration, DOMAIN_NAME);
              string logQuery = $@"INSERT INTO QuotationCommentLog (QuotationId
            ,DeptCode,CommentOrder,CommentBy,CommentTime,CommentText,SourceSystem)
                        VALUES ({entity.Id},'{workflowEntity.StepsWorkflow.FromNodeId}'
            ,{0}
            ,'{userInfo.Users.name}'
            ,'{DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")}'
            ,N'{workflowEntity.Comment}'
            ,'WEB')
                    ";


                        string logFlowQuery = $@"INSERT INTO QuotationWorkflowHistory(QuotationId
            ,StepNo,DeptCode,ActionTime,ActionNote,FromDeptCode,ToDeptCode,ActionCode,Actor,SourceSystem)
                        VALUES ({entity.Id},{workflowEntity.InstanceWorkflow.CurrentStep}
            ,'{workflowEntity.StepsWorkflow.FromNodeId}'
            ,'{DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")}'
            ,'{workflowEntity.StepsWorkflow.DisplayStatus}'
            ,'{workflowEntity.StepsWorkflow.FromNodeId}'
            ,'{workflowEntity.StepsWorkflow.ToNodeId}'
            ,'{workflowEntity.StepsWorkflow.ActionCode}'
            ,'{userInfo.Users.name}','WEB')
                    ";

            using var loggerFactory = LoggerFactory.Create(loggingBuilder => loggingBuilder
          .SetMinimumLevel(LogLevel.Trace)
          .AddConsole());

            var logger = loggerFactory.CreateLogger<QuotationCommentLog>();
            var quotationCommentLogApiController = new QuotationCommentLogController(_quotationCommentLogRepository, configuration, httpContextAccessor, logger, optionsMonitor);
                        await quotationCommentLogApiController.ExecuteCustomQuery(logQuery);
                        await quotationCommentLogApiController.ExecuteCustomQuery(logFlowQuery);

            return null; 
        }

        public static string GenerateNumberSeq(List<FormatCodeNo> tableConfigs, IBaseRepository<FormatCodeNo> baseRepository, string tableName = "")
        {
            FormatCodeNo tableConfig = new FormatCodeNo();

            tableConfig = tableConfigs.Where(x => x.SysTableFK?.Name == tableName && x.IsDefault == true).FirstOrDefault();
            // Begin process
            if (tableConfig != null)
            {
                string rs = string.Empty;

                bool hasCodeNumberConfig = false;
                bool isManual = false;
                bool hasHasTableRefWithDefault = false;

                string r_format = string.Empty;
                string r_DateFormat = string.Empty;
                int r_Next = 0;

                //Get config of Table

                if (tableConfig != null)
                {
                    hasCodeNumberConfig = true;
                    r_format = tableConfig.Format;
                    r_DateFormat = tableConfig.DateFormat;
                    r_Next = tableConfig.Next ?? 1;
                }
                else
                {

                    if (tableConfig != null)
                    {
                        hasHasTableRefWithDefault = true;
                        r_format = tableConfig.Format;
                        r_DateFormat = tableConfig.DateFormat;
                        r_Next = tableConfig.Next ?? 1;
                    }
                }

                if (hasCodeNumberConfig && isManual == false)
                {
                    string format = r_format;
                    if (format.Contains("@"))
                    {
                        format = format.Replace("@", string.Format("{0:" + r_DateFormat + "}", DateTime.UtcNow.Date));
                    }

                    string formatNumber = string.Empty;
                    string formatNumberString = string.Empty;
                    foreach (var c in format.ToCharArray())
                    {
                        if (c == '#')
                        {
                            formatNumber += c;
                            formatNumberString += '0';
                        }
                    }

                    if (formatNumber != string.Empty)
                    {
                        format = format.Replace(formatNumber, string.Format("{0:" + formatNumberString + "}", r_Next));
                    }

                    rs = format;

                    //Update NumberSeq
                    tableConfig.Next = r_Next + 1;
                }
                //else if (hasCodeNumberConfig && isManual == true)
                //{
                //    rs = string.Format("{0}", paperNo);

                //    //Update NumberSeq
                //    tableConfig.Next = r_Next + 1;
                //}
                else if (hasCodeNumberConfig == false && hasHasTableRefWithDefault == true)
                {
                    string format = r_format;
                    if (format.Contains("@"))
                    {
                        format = format.Replace("@", string.Format("{0:" + r_DateFormat + "}", DateTime.UtcNow.Date));
                    }

                    string formatNumber = string.Empty;
                    string formatNumberString = string.Empty;
                    foreach (var c in format.ToCharArray())
                    {
                        if (c == '#')
                        {
                            formatNumber += c;
                            formatNumberString += '0';
                        }
                    }

                    if (formatNumber != string.Empty)
                    {
                        format = format.Replace(formatNumber, string.Format("{0:" + formatNumberString + "}", r_Next));
                    }

                    rs = format;

                    //Update NumberSeq
                    tableConfig.Next = r_Next + 1;
                }
                else
                {
                    rs = string.Empty;
                }
                baseRepository.UpdateData(tableConfig, JsonConvert.SerializeObject(tableConfig), tableConfig?.Id, "Id");
                return rs;
            }
            else
                return "...";
        }


        public static async Task<string> GenerateNumberSeqAsync(List<FormatCodeNo> tableConfigs, IBaseRepository<FormatCodeNo> baseRepository, string tableName = "")
        {
            FormatCodeNo tableConfig = new FormatCodeNo();

            tableConfig = tableConfigs.Where(x => x.SysTableFK?.Name == tableName && x.IsDefault == true).FirstOrDefault();
            // Begin process
            if (tableConfig != null)
            {
                string rs = string.Empty;

                bool hasCodeNumberConfig = false;
                bool isManual = false;
                bool hasHasTableRefWithDefault = false;

                string r_format = string.Empty;
                string r_DateFormat = string.Empty;
                int r_Next = 0;

                //Get config of Table

                if (tableConfig != null)
                {
                    hasCodeNumberConfig = true;
                    r_format = tableConfig.Format;
                    r_DateFormat = tableConfig.DateFormat;
                    r_Next = tableConfig.Next ?? 1;
                }
                else
                {

                    if (tableConfig != null)
                    {
                        hasHasTableRefWithDefault = true;
                        r_format = tableConfig.Format;
                        r_DateFormat = tableConfig.DateFormat;
                        r_Next = tableConfig.Next ?? 1;
                    }
                }

                if (hasCodeNumberConfig && isManual == false)
                {
                    string format = r_format;
                    if (format.Contains("@"))
                    {
                        format = format.Replace("@", string.Format("{0:" + r_DateFormat + "}", DateTime.UtcNow.Date));
                    }

                    string formatNumber = string.Empty;
                    string formatNumberString = string.Empty;
                    foreach (var c in format.ToCharArray())
                    {
                        if (c == '#')
                        {
                            formatNumber += c;
                            formatNumberString += '0';
                        }
                    }

                    if (formatNumber != string.Empty)
                    {
                        format = format.Replace(formatNumber, string.Format("{0:" + formatNumberString + "}", r_Next));
                    }

                    rs = format;

                    //Update NumberSeq
                    tableConfig.Next = r_Next + 1;
                }
                //else if (hasCodeNumberConfig && isManual == true)
                //{
                //    rs = string.Format("{0}", paperNo);

                //    //Update NumberSeq
                //    tableConfig.Next = r_Next + 1;
                //}
                else if (hasCodeNumberConfig == false && hasHasTableRefWithDefault == true)
                {
                    string format = r_format;
                    if (format.Contains("@"))
                    {
                        format = format.Replace("@", string.Format("{0:" + r_DateFormat + "}", DateTime.UtcNow.Date));
                    }

                    string formatNumber = string.Empty;
                    string formatNumberString = string.Empty;
                    foreach (var c in format.ToCharArray())
                    {
                        if (c == '#')
                        {
                            formatNumber += c;
                            formatNumberString += '0';
                        }
                    }

                    if (formatNumber != string.Empty)
                    {
                        format = format.Replace(formatNumber, string.Format("{0:" + formatNumberString + "}", r_Next));
                    }

                    rs = format;

                    //Update NumberSeq
                    tableConfig.Next = r_Next + 1;
                }
                else
                {
                    rs = string.Empty;
                }
                await baseRepository.UpdateData(tableConfig, JsonConvert.SerializeObject(tableConfig), tableConfig?.Id, "Id");
                return rs;
            }
            else
                return "...";
        }

        public static string ParseConnectionString(string connectionString, IConfiguration configuration)
        {
            var builderStr = new SqlConnectionStringBuilder(connectionString);

            bool isUseEncryption = bool.Parse(configuration?.GetSection("SystemConfig:DataEncryption").Value ?? "false");


            if (isUseEncryption)
            {
                string scheme = configuration?.GetSection("SystemConfig:Scheme").Value;
                var passwordDecrypt = KeyVaultLocal.DecryptConnectionStringPassword(Environment.GetEnvironmentVariable($"{scheme}_PWD", EnvironmentVariableTarget.Machine), "ApplicationSecretKey", "ApplicationSaltKey", 10);
                //string password = KeyVaultLocal.DecryptConnectionStringPassword(builderStr.Password, "ApplicationSecretKey", "ApplicationSaltKey", 10);
                builderStr.Password = passwordDecrypt;
            }
            //try
            //{
            //    string writeString = Environment.GetEnvironmentVariable("RETool_PWD", EnvironmentVariableTarget.Machine);
            //    File.WriteAllText("application_key.txt", writeString);
            //}
            //catch (Exception ex)
            //{
            //    File.WriteAllText("error.txt", "Error");
            //}


            return builderStr.ConnectionString;
        }

    }
}
