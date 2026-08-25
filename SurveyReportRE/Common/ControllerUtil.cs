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
using Microsoft.Extensions.DependencyInjection;
using RESurveyTool.Models.Models.Parsing;
using ERPCore.Models.Migration.Business.Social;
using ERPCore.Common;
using ERPCore.Models.Business.Migration.Config;
using static ERPCore.Models.Models.Parsing.JsonHandle;
using System.Runtime.CompilerServices;
using ERPCore.Models.Migration.Business.MasterData;
using ERPCore.Models.Migration.Business.Config;
using ERPCore.Models.Migration.Business.HumanResource;
using System.Reflection;
using ERPCore.Models.Config;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using System.Net.Http.Headers;
using ERPCore.Models.Migration.Business.Data;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace ERPCore.ControllerUtil
{
    public static class ControllerUtil
    {
        public const string InitialNotificationITAllRegionsConstant = "InitialNotificationITAllRegions";
        public const string ConnectionEnvironmentSessionKey = "CurrentConnectionEnvironment";
        public const string DatabaseProfileSessionKey = "CurrentDbProfile";
        public static string tmivEnvironment = "Default";
        public static string jogetEnvironment = "Joget";

        public static string NormalizeConnectionEnvironment(string? environment)
        {
            if (string.Equals(environment, "Default", StringComparison.OrdinalIgnoreCase)) return "Default";
            if (string.Equals(environment, "UAT", StringComparison.OrdinalIgnoreCase)) return "UAT";

            throw new ArgumentException("Connection environment must be Default or UAT.", nameof(environment));
        }

        public static string GetApplicationConnectionName(string environment)
        {
            return NormalizeConnectionEnvironment(environment) == "Default"
                ? "DefaultConnection"
                : "UATConnection";
        }

        public static string GetJogetConnectionName(string environment)
        {
            return NormalizeConnectionEnvironment(environment) == "Default"
                ? "JogetConnection"
                : "UATJogetConnection";
        }

        public static string GetLogConnectionName(string environment)
        {
            return NormalizeConnectionEnvironment(environment) == "Default"
                ? "LogConnection"
                : "UATLogConnection";
        }
        public static string GetWebFile(IWebHostEnvironment env, string folder, string filename)
        {
            return env.WebRootPath
               + Path.DirectorySeparatorChar.ToString()
               + folder
               + Path.DirectorySeparatorChar.ToString()
               + filename;
        }

        public static string NormalizeAccountName(string? accountName)
        {
            return (accountName ?? "").Trim().Replace('/', '\\');
        }

        public static bool IsSuperUser(IConfiguration configuration, string? accountName)
        {
            var normalizedAccount = NormalizeAccountName(accountName);
            if (string.IsNullOrWhiteSpace(normalizedAccount)) return false;

            var configuredUsers = configuration.GetSection("SuperUser:SuperUser").Value ?? "";
            return configuredUsers
                .Split(new[] { ',', ';', '|', '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries)
                .Select(NormalizeAccountName)
                .Any(user =>
                    string.Equals(user, normalizedAccount, StringComparison.OrdinalIgnoreCase)
                    || (!user.Contains('\\')
                        && string.Equals(
                            user,
                            normalizedAccount.Split('\\').Last(),
                            StringComparison.OrdinalIgnoreCase)));
        }

        public static string GetCurrentContextUser(IHttpContextAccessor httpContextAccessor, IConfiguration configuration)
        {
            var debugEnv = bool.TryParse(
                configuration?.GetSection("SuperUser:IsDebug").Value,
                out var isDebug) && isDebug;
            var identityName = httpContextAccessor?.HttpContext?.User?.Identity?.Name;
            if (debugEnv && string.IsNullOrWhiteSpace(identityName))
            {
                return "quan.nh";
            }
            var normalizedIdentity = NormalizeAccountName(identityName);
            var configuredDomain = NormalizeAccountName(
                configuration?.GetSection("Domain:DCServer").Value);
            if (!string.IsNullOrWhiteSpace(configuredDomain)
                && normalizedIdentity.StartsWith(configuredDomain, StringComparison.OrdinalIgnoreCase))
            {
                return normalizedIdentity[configuredDomain.Length..].TrimStart('\\');
            }
            return normalizedIdentity;
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

        public static (PICAttributes PICMain, PICSysHandleAttributes PICLeader, PICAttributes PICHOD) PersonInChargeHandle(dynamic objectIn, StepsWorkflow stepsWorkflow, Microsoft.Extensions.Options.IOptionsMonitor<BusinessConfig> businessConfig, List<EnumData> siteEnums)
        {
            EnumData enumData = siteEnums.FirstOrDefault(f => f.Code == objectIn?.BranchCode?.Value);
            var getBranchId = businessConfig.CurrentValue.Sites.Values.Where(w => w.BranchCode == enumData.Code).ToList();
            PICSysHandleAttributes PICLeader = new PICSysHandleAttributes();
            PICAttributes PICHOD = new PICAttributes();
            PICLeader = getBranchId.First().LeaderFollowRequest;
            PICHOD = getBranchId.First().HODFollowRequest;
            PICAttributes PICMain = new PICAttributes();
            PICMain = JsonConvert.DeserializeObject<PICAttributes>(objectIn?.PIC?.Value ?? "");
           


            return (PICMain, PICLeader, PICHOD);

        }

        public static async Task<string[]> ResolveInitialNotificationRecipientsAsync(
            IBaseRepository<Users> usersRepository,
            PICAttributes pic,
            IEnumerable<PICSysHandleAttributes> leaderPics,
            IEnumerable<PICAttributes> hodPics,
            string? department,
            string? foRoutingCode = null)
        {
            string normalizedDepartment = (department ?? string.Empty).Trim().ToUpperInvariant();
            string[] assignedPicAccounts = SplitNotificationAccounts(
                Util.PICPicker(pic ?? new PICAttributes(), normalizedDepartment));
            if (assignedPicAccounts.Length > 0)
            {
                return assignedPicAccounts;
            }

            List<PICSysHandleAttributes> regionalLeaders = (leaderPics
                ?? Enumerable.Empty<PICSysHandleAttributes>()).ToList();
            List<PICAttributes> regionalHods = (hodPics
                ?? Enumerable.Empty<PICAttributes>()).ToList();
            List<string> regionalRecipients = new();
            int regionCount = Math.Max(regionalLeaders.Count, regionalHods.Count);

            for (int regionIndex = 0; regionIndex < regionCount; regionIndex++)
            {
                PICSysHandleAttributes? leaderPic = regionIndex < regionalLeaders.Count
                    ? regionalLeaders[regionIndex]
                    : null;
                string leaderValue = normalizedDepartment switch
                {
                    "FO" => ResolveFoLeaderValue(leaderPic?.FO, foRoutingCode),
                    "TS" => leaderPic?.TS ?? string.Empty,
                    "UW" => leaderPic?.UW ?? string.Empty,
                    "LMKT" => leaderPic?.LMKT ?? string.Empty,
                    "PM" => leaderPic?.PM ?? string.Empty,
                    _ => string.Empty
                };
                string[] existingLeaders = await FilterExistingNotificationAccountsAsync(
                    usersRepository,
                    SplitNotificationAccounts(leaderValue));
                if (existingLeaders.Length > 0)
                {
                    regionalRecipients.AddRange(existingLeaders);
                    continue;
                }

                PICAttributes? hodPic = regionIndex < regionalHods.Count
                    ? regionalHods[regionIndex]
                    : null;
                string hodValue = Util.PICPicker(hodPic ?? new PICAttributes(), normalizedDepartment);
                regionalRecipients.AddRange(await FilterExistingNotificationAccountsAsync(
                    usersRepository,
                    SplitNotificationAccounts(hodValue)));
            }

            return regionalRecipients
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToArray();
        }

        public static async Task<bool> ShouldUseAllRegionsForInitialNotificationAsync(
            IBaseRepository<Employee> employeeRepository,
            IBaseRepository<Constant> constantRepository,
            IHttpContextAccessor httpContextAccessor,
            IConfiguration configuration)
        {
            Constant? setting = await constantRepository.GetSingleObject(item =>
                item.ParameterName == InitialNotificationITAllRegionsConstant && !item.Deleted);
            string settingValue = setting?.Value?.Trim() ?? string.Empty;
            bool featureEnabled = setting == null
                || !new[] { "false", "0", "off", "no" }.Contains(
                    settingValue,
                    StringComparer.OrdinalIgnoreCase);
            if (!featureEnabled) return false;

            string currentAccount = GetCurrentContextUser(httpContextAccessor, configuration);
            Employee? employee = await employeeRepository.GetSingleObjectFullInclude(
                item => item.AccountName == currentAccount && !item.Deleted,
                null,
                item => item.SystemRolesFK);

            return string.Equals(employee?.Department?.Trim(), "IT", StringComparison.OrdinalIgnoreCase)
                || string.Equals(employee?.SystemRolesFK?.RoleName?.Trim(), "IT", StringComparison.OrdinalIgnoreCase);
        }

        private static string ResolveFoLeaderValue(FO? foLeaders, string? routingCode)
        {
            if (foLeaders == null) return string.Empty;

            PropertyInfo[] properties = typeof(FO).GetProperties();
            PropertyInfo? matchedProperty = properties.FirstOrDefault(property =>
                string.Equals(property.Name, routingCode?.Trim(), StringComparison.OrdinalIgnoreCase));
            string matchedValue = matchedProperty?.GetValue(foLeaders)?.ToString() ?? string.Empty;
            if (!string.IsNullOrWhiteSpace(matchedValue)) return matchedValue;

            return string.Join(",", properties
                .Select(property => property.GetValue(foLeaders)?.ToString())
                .Where(value => !string.IsNullOrWhiteSpace(value)));
        }

        private static string[] SplitNotificationAccounts(string? value)
            => (value ?? string.Empty)
                .Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(account => account.Split('\\').Last().Trim())
                .Where(account => !string.IsNullOrWhiteSpace(account))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToArray();

        private static async Task<string[]> FilterExistingNotificationAccountsAsync(
            IBaseRepository<Users> usersRepository,
            IEnumerable<string> accounts)
        {
            List<string> existingAccounts = new();
            foreach (string account in accounts)
            {
                Users? user = await usersRepository.GetSingleObject(item =>
                    item.username == account && !item.Deleted);
                if (user != null) existingAccounts.Add(account);
            }

            return existingAccounts
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToArray();
        }
        //public static async Task<Notification> Notify(
        //    dynamic transferObject,
        //    long? notificationTypeId = null,
        //    bool sendRealtime = true)
        //{
        //    string DOMAIN_NAME = transferObject.DOMAIN_NAME;
        //    NotificationRequest notification = new NotificationRequest();
        //    Notification Notification = BuildNotification(transferObject, notificationTypeId, );
        //    notification.Notification = Notification;
        //    notification.connectionId = transferObject.ReceivedBy;
        //    notification.tabPublicUrl = NotificationURLObjectMaking(transferObject);
        //    IReadOnlyList<OnlineUserDto> onlineUsers = FileProcessingHub._store.GetOnlineUsers();

        //    foreach (string item in transferObject.ReceivedBy.Split(','))
        //    {
        //        if (!sendRealtime) break;
        //        string[] connectionIds = onlineUsers
        //            .Where(user => SameRealtimeAccount(user.User, item, DOMAIN_NAME))
        //            .Select(user => user.ConnectionId)
        //            .Where(id => !string.IsNullOrWhiteSpace(id))
        //            .Distinct()
        //            .ToArray();
        //        if (connectionIds.Length > 0)
        //        {
        //            await FileProcessingHub._hubContext.Clients.Clients(connectionIds).SendAsync("R_NotificationReceive",
        //                      new
        //                      {
        //                          title = notification?.Notification?.Title ?? "",
        //                          message = notification?.Notification?.Message ?? ""
        //                      });
        //        }
        //    }
        //    return Notification;
        //}

       

        public static async Task<Notification> NotifySameEmail(
            Notification Notification,
            dynamic transferObject,
            long? notificationTypeId = null)
        {
            string DOMAIN_NAME = transferObject.DOMAIN_NAME;
            NotificationTemplate notificationTemplate = new NotificationTemplate();
            notificationTemplate.Title = Notification.Title;
            notificationTemplate.Content = Notification.Message;

            Notification = BuildNotification(transferObject, notificationTypeId, transferObject.ReceivedBy, notificationTemplate, nameof(NotifySameEmail));
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
            notification.tabPublicUrl = NotificationURLObjectMaking(transferObject);
            IReadOnlyList<OnlineUserDto> onlineUsers = FileProcessingHub._store.GetOnlineUsers();
            foreach (string item in transferObject.ReceivedBy.Split(','))
            {
                string[] connectionIds = onlineUsers
                    .Where(user => SameRealtimeAccount(user.User, item, DOMAIN_NAME))
                    .Select(user => user.ConnectionId)
                    .Where(id => !string.IsNullOrWhiteSpace(id))
                    .Distinct()
                    .ToArray();
                if (connectionIds.Length > 0)
                {
                    await FileProcessingHub._hubContext.Clients.Clients(connectionIds).SendAsync("R_NotificationReceive",
                              new
                              {
                                  title = notification?.Notification?.Title ?? "",
                                  message = notification?.Notification?.Message ?? ""
                              });
                }
            }
           
            return Notification;
        }

        private static bool SameRealtimeAccount(string? left, string? right, string? domainName)
        {
            string Normalize(string? value)
            {
                string account = (value ?? "").Trim();
                if (!string.IsNullOrWhiteSpace(domainName)) {
                    account = account.Replace(domainName, "", StringComparison.OrdinalIgnoreCase);
                }
                return account.Trim().TrimStart('\\').Split('\\').Last();
            }

            return string.Equals(Normalize(left), Normalize(right), StringComparison.OrdinalIgnoreCase);
        }

        public static Notification BuildNotification(
            dynamic transferObject,
            long? notificationTypeId,
            string member,
            NotificationTemplate notificationTemplate = null,
            [CallerMemberName] string callerName = "")
        {
            Notification notification = new Notification();
            dynamic transferObjectIn;
            transferObjectIn = new
            {
                Title = Util.ReplaceDynamicProperties(notificationTemplate.Title, transferObject),
                Message = Util.ReplaceDynamicProperties(notificationTemplate.Content, transferObject),
                Guid = transferObject.Guid,
                ReceivedBy = member,
                ModuleName = transferObject.GetType().Name,
                CopyFromGuid = transferObject.CopyFromGuid ?? Guid.Empty
            };
            if (transferObject is Quotation)
            {
                transferObjectIn = new
                {
                    Title = Util.ReplaceDynamicProperties(notificationTemplate.Title, transferObject),
                    Message = Util.ReplaceDynamicProperties(notificationTemplate.Content, transferObject),
                    Guid = transferObject.Guid,
                    ReceivedBy = member,
                    ModuleName = transferObject.GetType().Name,
                    CopyFromGuid = transferObject.CopyFromGuid ?? Guid.Empty
                };
            }
            if (transferObject is PolicyIssuance)
            {
                transferObjectIn = new
                {
                    Id = transferObject.Id,
                    Title = Util.ReplaceDynamicProperties(notificationTemplate.Title, transferObject),
                    Message = Util.ReplaceDynamicProperties(notificationTemplate.Content, transferObject),
                    Guid = transferObject.Guid,
                    ReceivedBy = member,
                    ModuleName = transferObject.GetType().Name,
                    QuotationId = transferObject.QuotationId,
                    CopyFromGuid = transferObject.CopyFromGuid ?? Guid.Empty
                };
            }

            notification = new Notification();
            notification.Title = Util.ReplaceDynamicProperties(transferObjectIn.Title, transferObject);
            notification.Message = Util.ReplaceDynamicProperties(transferObjectIn.Message, transferObject);
            notification.IsRead = false;
            notification.Resource = $"{member}_{transferObject.GetType().Name}_{callerName}";
            notification.System = "WorkflowManagement";
            notification.RecordGuid = transferObjectIn.Guid;
            notification.Type = notificationTypeId;
            notification.Url = JsonConvert.SerializeObject(ControllerUtil.NotificationURLObjectMaking(transferObjectIn));
            notification.ReceivedBy = member;


            return notification;
        }



        /// <summary>
        /// Builds the target stored with a notification. Policy Issuance records cloned
        /// from a Quotation need all four route values expected by PolicyIssuance_Form:
        /// id/guid/cloneId/copyfromguid. QuotationId is the related FK and therefore is
        /// the cloneId; CopyFromGuid identifies the source Quotation record.
        /// </summary>
        public static object NotificationURLObjectMaking(dynamic transferObject)
        {
            Type transferType = transferObject.GetType();
            object? ReadProperty(string name) => transferType.GetProperty(name)?.GetValue(transferObject);

            string moduleName = ReadProperty("ModuleName")?.ToString() ?? nameof(Quotation);
            long.TryParse(ReadProperty("Id")?.ToString(), out long id);
            string recordGuid = ReadProperty("Guid")?.ToString() ?? "";
            string code = ReadProperty("Code")?.ToString() ?? "";

            if (string.Equals(moduleName, nameof(Quotation), StringComparison.OrdinalIgnoreCase))
            {
                return new
                {
                    url = $"/Business/Form/{nameof(Quotation)}_Form/{id}/{recordGuid}",
                    caption = $"form_{nameof(Quotation)}_Form_{id}",
                    name = $"{nameof(Quotation)} {code}".Trim(),
                    data = ""
                };
            }

            if (!string.Equals(moduleName, nameof(PolicyIssuance), StringComparison.OrdinalIgnoreCase))
            {
                return new
                {
                    url = $"/Business/Form/{nameof(PolicyIssuance)}_Form/{id}/{recordGuid}",
                    caption = $"form_{nameof(PolicyIssuance)}_Form_{id}",
                    name = $"{nameof(PolicyIssuance)} {code}".Trim(),
                    data = ""
                };
            }

            string copyFromGuid = ReadProperty("CopyFromGuid")?.ToString() ?? "";
            long.TryParse(ReadProperty("QuotationId")?.ToString(), out long cloneId);
            System.Guid.TryParse(copyFromGuid, out System.Guid sourceGuid);

            return new
            {
                url = $"/Business/Form/{nameof(PolicyIssuance)}_Form/{id}/{recordGuid}/{cloneId}/{sourceGuid}",
                caption = $"form_{nameof(PolicyIssuance)}_Form_{id}",
                name = $"{nameof(PolicyIssuance)} {code}".Trim(),
                data = ""
            };
        }

        public static async Task<long?> ResolvePolicyIssuanceCloneIdAsync(
            IBaseRepository<Quotation> quotationRepository,
            PolicyIssuance policyIssuance)
        {
            if (policyIssuance.QuotationId.HasValue && policyIssuance.QuotationId.Value > 0)
            {
                return policyIssuance.QuotationId.Value;
            }

            if (!policyIssuance.CopyFromGuid.HasValue || policyIssuance.CopyFromGuid.Value == System.Guid.Empty)
            {
                return null;
            }

            Quotation? sourceQuotation = await quotationRepository.GetSingleObject(item =>
                item.Guid == policyIssuance.CopyFromGuid.Value && !item.Deleted);
            return sourceQuotation?.Id;
        }
        public static async Task CloneAction(
    IBaseRepository<CommentLog> _quotationCommentLogRepository,
    List<Dictionary<string, object>> commentLogs,
    List<Dictionary<string, object>> workflowHistories,
    long quotationId
)
        {
            foreach (var commentLog in commentLogs)
            {
                    var commentQuery = CloneQuery(
                    commentLog,
                   "CommentLog",
                   quotationId
               );
                await _quotationCommentLogRepository
                .ExecuteCustomLogQuery(commentQuery);
            }

            foreach (var workflowHistory in workflowHistories)
            {
                var workflowQuery = CloneQuery(
                 workflowHistory,
                 "QuotationWorkflowHistory",
                 quotationId
             );
                await _quotationCommentLogRepository
                .ExecuteCustomLogQuery(workflowQuery);
            }



        }


        public static string CloneQuery(
    Dictionary<string, object> row,
    string tableName,
    long quotationId)
        {
            var columns = new List<string>();
            var values = new List<string>();


            foreach (var item in row)
            {
                var column = item.Key;


                // bỏ identity
                if (column.Equals("id", StringComparison.OrdinalIgnoreCase)
                    || column.Equals("commentId", StringComparison.OrdinalIgnoreCase))
                    continue;


                columns.Add(column);


                object value =
                    column.Equals("quotationId",
                        StringComparison.OrdinalIgnoreCase)
                        ? quotationId
                        : item.Value;


                values.Add(SqlValue(value));
            }


            return $@"
        INSERT INTO {tableName}
        (
            {string.Join(",", columns)}
        )
        VALUES
        (
            {string.Join(",", values)}
        )";
        }



        private static string SqlValue(object value)
        {
            if (value == null)
                return "NULL";


            if (value is DateTime dt)
                return $"'{dt:yyyy-MM-dd HH:mm:ss}'";


            if (value is string)
                return $"N'{value.ToString().Replace("'", "''")}'";

            if (value is long)
                return $"{value.ToString().Replace("'", "''")}";

            return value.ToString();
        }
        public static async Task<IActionResult> LogAction(IBaseRepository<CommentLog> _quotationCommentLogRepository
            , IHttpContextAccessor httpContextAccessor
            , IConfiguration configuration
            , string DOMAIN_NAME
            , dynamic entity
            , dynamic workflowEntity
            , IOptionsMonitor<BlobStorageSettings> optionsMonitor
            ) 
        {



            var userInfo = await ControllerHelper.FetchUserRoles(httpContextAccessor, configuration, DOMAIN_NAME);
            var actorName = userInfo.Users?.name;
            if (string.IsNullOrWhiteSpace(actorName))
                actorName = GetCurrentContextUser(httpContextAccessor, configuration);
            if (string.IsNullOrWhiteSpace(actorName))
                actorName = "anonymous";

            var actorSqlValue = SqlValue(actorName);
            var commentSqlValue = SqlValue(Convert.ToString(workflowEntity.Comment) ?? string.Empty);
              string logQuery = $@"INSERT INTO CommentLog (RecordGuid
            ,DeptCode,CommentOrder,CommentBy,CommentTime,CommentText,SourceSystem,CreatedAtUtc)
                        VALUES ('{entity.Guid}','{workflowEntity.StepsWorkflow.FromNodeId} - {workflowEntity.StepsWorkflow.StepName}'
            ,{0}
            ,{actorSqlValue}
            ,'{DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")}'
            ,{commentSqlValue}
            ,'WEB', GETDATE())
                    ";
            string logFlowQuery = "";
            if (workflowEntity.isFullDetail)
            {
                logFlowQuery = $@"INSERT INTO WorkflowHistory(RecordGuid
            ,StepNo,DeptCode,ActionTime,ActionNote,FromDeptCode,ToDeptCode,ActionCode,Actor,SourceSystem,CreatedAtUtc)
                        VALUES ('{entity.Guid}','{workflowEntity.InstanceWorkflow.CurrentStep}'
            ,'{workflowEntity.StepsWorkflow.FromNodeId}'
            ,'{DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")}'
            ,'{workflowEntity.StepsWorkflow.DisplayStatus}'
            ,'{workflowEntity.StepsWorkflow.FromNodeId}'
            ,'{workflowEntity.StepsWorkflow.ToNodeId}'
            ,'{workflowEntity.StepsWorkflow.ActionCode}'
            ,{actorSqlValue},'WEB',GETDATE())
                    ";
            }
            using var loggerFactory = LoggerFactory.Create(loggingBuilder => loggingBuilder
          .SetMinimumLevel(LogLevel.Trace)
          .AddConsole());
            try
            {
                var logger = loggerFactory.CreateLogger<CommentLog>();
                var quotationCommentLogApiController = new CommentLogController(_quotationCommentLogRepository, configuration, httpContextAccessor, logger, optionsMonitor);
                await quotationCommentLogApiController.ExecuteCustomQuery(logQuery);
                if (workflowEntity.isFullDetail)
                    await quotationCommentLogApiController.ExecuteCustomQuery(logFlowQuery);
            }
            catch (Exception ex) {
                Serilog.Log.Error(ex, ex.Message);
            }

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

        public static async Task<DigisignCallbackResult?> SignByKeywordWithCKSHSM(IBaseRepository<Document> baseRepository, long?  documentId)
        {
            // var uRLConfig = baseRepository._baseConfiguration.GetSection("URLConfig").Get<URLConfig>();
            var blobSettings = baseRepository._baseConfiguration.GetSection("BlobStorage").Get<BlobStorageSettings>();
            // Chờ 5 giây
            await Task.Delay(TimeSpan.FromSeconds(10));
            //
            
            var attachment = await baseRepository.GetObjectByIdAsync(documentId ?? 0 );

            // Ví dụ: đường dẫn vật lý file
            // Bạn sửa lại theo cấu trúc thật của hệ thống
            string filePath = Path.Combine(
                blobSettings.Path,
                attachment.SubDirectory ?? "", attachment.Guid.ToString() + attachment.FileType
            );

            byte[]? fileBytes = File.ReadAllBytes(filePath);

            var callbackResult = new DigisignCallbackResult
            {
                JobId = Guid.NewGuid().ToString(),
                Status = "SUCCESS",
                FileName = attachment.FileName,
                ContentType = "application/pdf",
                FileBase64 = Convert.ToBase64String(fileBytes),
                Metadata = new
                {
                    Id = attachment.Id,
                    DocumentId = attachment.Id,
                    attachment.FileName
                },
                ConvertedAt = DateTime.UtcNow
            };

            // Callback qua HTTP tạm thời không sử dụng.
            // using var client = new HttpClient();
            // string callbackUrl = uRLConfig.GetStreamHost;
            // var response = await client.PostAsJsonAsync(callbackUrl, callbackResult);

            var requestServices = baseRepository._httpContextAccessor?.HttpContext?.RequestServices
                ?? throw new InvalidOperationException("Request services are unavailable for CallbackSignature.");
            var instanceWorkflowController = ActivatorUtilities.CreateInstance<global::InstanceWorkflowController>(requestServices);
            var callbackResponse = await instanceWorkflowController.CallbackSignature(callbackResult);
            var callbackStatusCode = callbackResponse switch
            {
                ObjectResult objectResult => objectResult.StatusCode ?? StatusCodes.Status200OK,
                StatusCodeResult statusCodeResult => statusCodeResult.StatusCode,
                _ => StatusCodes.Status200OK
            };

            if (callbackStatusCode < StatusCodes.Status200OK ||
                callbackStatusCode >= StatusCodes.Status300MultipleChoices)
            {
                return new DigisignCallbackResult
                {
                    JobId = callbackResult.JobId,
                    Status = "FAILED",
                    Error = $"CallbackSignature failed with status code {callbackStatusCode}."
                };
            }

            return callbackResult;
        }

        public static async Task SignManualByLocationWithCKSHSMCompany()
        {

        }
        public static async Task makeSign()
        {

        }

        public static async Task<byte[]?> DigiSign(IBaseRepository<Document> baseRepository , long? id )
        {

            DigisignCallbackResult result = await SignByKeywordWithCKSHSM(baseRepository, id);
            return Convert.FromBase64String(result.FileBase64).ToArray();

            //Golive change
            //var uRLConfig = baseRepository._baseConfiguration.GetSection("URLConfig").Get<URLConfig>();
            //var blobSettings = baseRepository._baseConfiguration.GetSection("BlobStorage").Get<BlobStorageSettings>();
            //string URL = uRLConfig.DigiSignHost;
            ////Change lại thành hàm của chính link host cho source này từ 
            ////TestCallBackUrl  -> CallbackFileHandle
            //string callURL = uRLConfig.DigisignStorageHost;
            //string endpoint = $"{URL}/api/convert";
            //string keyApi = baseRepository._baseConfiguration.GetSection("DigiSignServer:Key").Value;
            //try
            //{
            //    if (string.IsNullOrWhiteSpace(endpoint))
            //        throw new Exception("Config UrlConfig:DigiSignHost is empty.");

            //    // Ví dụ: lấy thông tin file theo id từ DB
            //    // Bạn thay Attachment bằng model thực tế của bạn
            //    var attachment = await baseRepository.GetObjectByIdAsync(id ?? 0);
            //    if (attachment == null)
            //        throw new Exception($"Attachment id={id} not found.");

            //    // Ví dụ: đường dẫn vật lý file
            //    // Bạn sửa lại theo cấu trúc thật của hệ thống
            //    string filePath = Path.Combine(
            //        blobSettings.Path,
            //        attachment.SubDirectory ?? "", attachment.FileName
            //    );

            //    if (!System.IO.File.Exists(filePath))
            //        throw new Exception($"File not found: {filePath}");

            //    await using var fileStream = System.IO.File.OpenRead(filePath);

            //    using var multipart = new MultipartFormDataContent();

            //    var fileContent = new StreamContent(fileStream);
            //    fileContent.Headers.ContentType = new MediaTypeHeaderValue(Util.GetMimeType(filePath));

            //    // "file" phải đúng tên field mà API bên convert yêu cầu
            //    multipart.Add(fileContent, "file", Path.GetFileName(filePath));

            //    // Các field form-data khác
            //    multipart.Add(new StringContent("pdf"), "outputFormat");
            //    multipart.Add(new StringContent(callURL), "callbackUrl");
            //    multipart.Add(new StringContent(JsonConvert.SerializeObject(new { Document = new Document() { Id = id ?? 0 } })), "metadata");

            //    var client = new HttpClient();
            //    client.Timeout = TimeSpan.FromMinutes(10);
            //    client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("*/*"));
            //    client.DefaultRequestHeaders.Add("X-API-KEY", keyApi);


            //    var response = await client.PostAsync(endpoint, multipart);
            //    var responseBytes = await response.Content.ReadAsByteArrayAsync();
            //    var responseText = await response.Content.ReadAsStringAsync();

            //    if (!response.IsSuccessStatusCode)
            //    {
            //        throw new Exception("Signing server returned error.");
            //    }

            //    // Nếu server convert trả thẳng file đã convert về
            //    var outputFileName = Path.GetFileNameWithoutExtension(filePath) + ".pdf";

            //    string getStreamHost = uRLConfig.GetStreamHost + $"?fileName={outputFileName}";
            //    var responseGet = await client.GetAsync(getStreamHost);
            //    var responseBytesGet = await responseGet.Content.ReadAsByteArrayAsync();
            //    var responseTextGet = await responseGet.Content.ReadAsStringAsync();

            //    if (!response.IsSuccessStatusCode)
            //    {
            //        throw new Exception("Signing server returned error.");
            //    }

            //    return responseBytesGet;
            //    //return File(responseBytesGet, "application/pdf", outputFileName);

            //    // Nếu bạn chỉ muốn lưu xuống disk rồi return ok thì dùng đoạn này thay thế:
            //    // var outputPath = Path.Combine(Path.GetDirectoryName(filePath)!, outputFileName);
            //    // await System.IO.File.WriteAllBytesAsync(outputPath, responseBytes);
            //    // return Ok(new { message = "Signing success", outputPath });
            //}
            //catch (Exception ex)
            //{
            //    throw new Exception("Signing failed");

            //}
        }

    }
}
