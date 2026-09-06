using DocumentFormat.OpenXml.Math;
using MimeMapping;
using Newtonsoft.Json;
using ERPCore.Models.Models.Parsing;
using ERPCore.Common;
using ERPCore.Models.Business.Migration.Config;
using ERPCore.Models.Migration.Business.Config;
using ERPCore.Models.Migration.Business.Data;
using ERPCore.Models.Migration.Business.Form;
using ERPCore.Models.Migration.Business.HumanResource;
using ERPCore.Models.Migration.Business.MasterData;
using ERPCore.Models.Migration.Business.Workflow;
using ERPCore.Models.Request;
using ERPCore.Models.Migration.Business.Social;
using Microsoft.AspNetCore.SignalR;
using Microsoft.SharePoint.ApplicationPages.Calendar.Exchange;
using ERPCore.Models.Migration.Config;

namespace ERPCore.ControllerUtil
{
    public sealed class SignalRDistributionResult
    {
        public IReadOnlyList<string> Accounts { get; init; } = Array.Empty<string>();
        public IReadOnlyList<string> ConnectionIds { get; init; } = Array.Empty<string>();
        public int SentConnectionCount => ConnectionIds.Count;
    }

    public sealed class WorkflowRefreshSignal
    {
        public string CorrelationId { get; init; } = Guid.NewGuid().ToString("N");
        public long? Id { get; init; }
        public string Type { get; init; } = "";
        public string Action { get; init; } = "update";
        public string RefreshScope { get; init; } = "view";
        public string? FromDepartment { get; init; }
        public string? ToDepartment { get; init; }
        public string? ActorAccount { get; init; }
        public IReadOnlyList<string> TargetAccounts { get; init; } = Array.Empty<string>();
        public DateTime OccurredAtUtc { get; init; } = DateTime.UtcNow;
        public object? Data { get; init; }
    }

    public static class ControllerHelper
    {
        public static void SeriLog<T>(ILogger<T> _logger, Exception ex = null, string message = "") where T : class
        {
            if (ex != null)
                _logger.LogError(ex, ex.Message);
            if (!string.IsNullOrEmpty(message))
                _logger.LogError(message);
        }

        public async static Task<UserInfo> FetchUserRoles(IHttpContextAccessor httpContextAccessor, IConfiguration configuration, string DOMAIN_NAME)
        {
            var userInfo = new UserInfo();
            string userName = ControllerUtil.GetCurrentContextUser(httpContextAccessor, configuration);

            if (!string.IsNullOrWhiteSpace(userName))
            {
                IBaseRepository<Users> _usersRepository = new BaseRepository<Users>(configuration, httpContextAccessor);
                userInfo.Users = await _usersRepository.GetSingleObject(s => s.username == userName);
                if (userInfo.Users != null)
                {
                    IBaseRepository<Employee> _employeeRepository = new BaseRepository<Employee>(configuration, httpContextAccessor);
                    userInfo.Employee = await _employeeRepository.GetSingleObject(s => s.AccountName == userInfo.Users.username);
                    IBaseRepository<UserRoles> _userRolesRepository = new BaseRepository<UserRoles>(configuration, httpContextAccessor);
                    userInfo.UserRoles = await _userRolesRepository.GetSingleObject(s => s.UserId == userInfo.Users.Id);
                    if (userInfo.UserRoles != null)
                    {
                        IBaseRepository<Roles> _rolesRepository = new BaseRepository<Roles>(configuration, httpContextAccessor);
                        userInfo.Roles = await _rolesRepository.GetSingleObject(s => s.Id == userInfo.UserRoles.RoleId);
                    }
                }
            }
            return userInfo;
        }

        public async static Task<string> GetEmailFromUserAccount(string userAccounts, IBaseRepository<Employee> employeeRepository)
        {
            if (!string.IsNullOrEmpty(userAccounts))
            {
                string[] accounts = userAccounts.Split(';');
                List<string> emailFromUserAccounts = new List<string>();
                foreach (string account in accounts)
                {
                    Employee employee = new Employee();
                    employee = await employeeRepository.GetSingleObject(e => e.AccountName == account);
                    emailFromUserAccounts.Add(employee.Email);
                }
                return string.Join(";", emailFromUserAccounts);
            }
            else
            {
                return string.Empty;    
            }
        }
        public async static Task ConvertRuleSurvey(IBaseRepository<InstanceWorkflow> workflowRepository
            , IBaseRepository<UserWorkflow> userWorkflowRepository
            , long? userId
            , InstanceWorkflow instanceWorkflow)
        {
            UserWorkflow userWorkflow = await userWorkflowRepository.GetSingleObject(s => s.UsersId == userId);
            if (userWorkflow != null)
            {
                instanceWorkflow.UserWorkflowId = userWorkflow.Id;
                instanceWorkflow.RuleNo = 1;
            }
            await workflowRepository.UpdateData(instanceWorkflow, JsonConvert.SerializeObject(instanceWorkflow), instanceWorkflow.Id, "Id");
        }

      
      
        public static string UpStep(InstanceWorkflow instanceWorkflow)
        {
            if (instanceWorkflow != null)
                return (Util.GetPreviousSegment(instanceWorkflow?.CurrentStep ?? "0") + 1).ToString();
            else return "1";
        }
        public static string DownStep(InstanceWorkflow instanceWorkflow)
        {
            if (instanceWorkflow != null)
                return (Util.GetPreviousSegment(instanceWorkflow?.CurrentStep ?? "0") - 1) < 1 ? "1": ((Util.GetPreviousSegment(instanceWorkflow?.CurrentStep ?? "0") - 1) - 1).ToString();
            else return "1";
        }

        private static string NormalizeSignalRAccount(string? account, string? domainName)
        {
            string value = (account ?? "").Trim();
            if (!string.IsNullOrWhiteSpace(domainName))
                value = value.Replace(domainName, "", StringComparison.OrdinalIgnoreCase);

            return value.Trim().TrimStart('\\').Split('\\').LastOrDefault() ?? "";
        }

        private static IEnumerable<string> ExpandSignalRAccounts(IEnumerable<string?> accounts, string domainName)
        {
            return accounts
                .Where(account => !string.IsNullOrWhiteSpace(account))
                .SelectMany(account => account!.Split(new[] { ';', ',' }, StringSplitOptions.RemoveEmptyEntries))
                .Select(account => NormalizeSignalRAccount(account, domainName))
                .Where(account => !string.IsNullOrWhiteSpace(account))
                .Distinct(StringComparer.OrdinalIgnoreCase);
        }

        /// <summary>
        /// Sends a UI event to every active SignalR connection belonging to the requested
        /// accounts. The in-memory presence store is authoritative while the UsersSession
        /// table supplies active sessions after an application restart or on another node.
        /// </summary>
        public async static Task<SignalRDistributionResult> DistributeSignalRResponse(
            IBaseRepository<UsersSession> usersSessionRepository,
            string uiMethod,
            object returnObject,
            IEnumerable<string?> accounts,
            string domainName,
            IEnumerable<string?>? explicitConnectionIds = null)
        {
            string[] targetAccounts = ExpandSignalRAccounts(accounts, domainName).ToArray();
            var connectionIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            foreach (string connectionId in explicitConnectionIds ?? Array.Empty<string>())
            {
                if (!string.IsNullOrWhiteSpace(connectionId)) connectionIds.Add(connectionId.Trim());
            }

            if (targetAccounts.Length > 0)
            {
                foreach (OnlineUserDto onlineUser in FileProcessingHub._store.GetOnlineUsers())
                {
                    string onlineAccount = NormalizeSignalRAccount(onlineUser.User, domainName);
                    if (targetAccounts.Contains(onlineAccount, StringComparer.OrdinalIgnoreCase)
                        && !string.IsNullOrWhiteSpace(onlineUser.ConnectionId))
                    {
                        connectionIds.Add(onlineUser.ConnectionId);
                    }
                }

                // SignalR sessions are short lived. Restrict the fallback query so stale
                // historical connection ids do not accumulate indefinitely.
                DateTime sessionFloor = DateTime.Today.AddDays(-1);
                DateTime sessionCeiling = DateTime.Today.AddDays(1);
                List<UsersSession> sessions = await usersSessionRepository.GetListObject(item =>
                    item.CreatedDate >= sessionFloor && item.CreatedDate < sessionCeiling);

                foreach (UsersSession session in sessions.Where(item =>
                    item.IsActive != false
                    && !string.IsNullOrWhiteSpace(item.SignalRConnectionId)
                    && targetAccounts.Contains(
                        NormalizeSignalRAccount(item.UserName ?? item.CreatedBy, domainName),
                        StringComparer.OrdinalIgnoreCase)))
                {
                    connectionIds.Add(session.SignalRConnectionId);
                }
            }

            if (connectionIds.Count > 0 && FileProcessingHub._hubContext != null)
            {
                await FileProcessingHub._hubContext.Clients
                    .Clients(connectionIds.ToArray())
                    .SendAsync(uiMethod, returnObject);
            }

            return new SignalRDistributionResult
            {
                Accounts = targetAccounts,
                ConnectionIds = connectionIds.ToArray()
            };
        }

        public async static Task<SignalRDistributionResult> DistributeWorkflowRefresh(
            IBaseRepository<UsersSession> usersSessionRepository,
            string flowType,
            long? recordId,
            string action,
            string actorAccount,
            string? assignedAccount,
            string? fromDepartment,
            string? toDepartment,
            string domainName,
            string refreshScope = "view",
            object? data = null)
        {
            string normalizedFlow = string.Equals(
                flowType?.Replace(" ", ""),
                "PolicyIssuance",
                StringComparison.OrdinalIgnoreCase)
                ? "PolicyIssuance"
                : "Quotation";
            string[] targetAccounts = ExpandSignalRAccounts(
                new[] { actorAccount, assignedAccount }, domainName).ToArray();
            var signal = new WorkflowRefreshSignal
            {
                Id = recordId,
                Type = normalizedFlow,
                Action = string.IsNullOrWhiteSpace(action) ? "update" : action.Trim().ToLowerInvariant(),
                RefreshScope = string.IsNullOrWhiteSpace(refreshScope) ? "view" : refreshScope.Trim().ToLowerInvariant(),
                FromDepartment = fromDepartment,
                ToDepartment = toDepartment,
                ActorAccount = NormalizeSignalRAccount(actorAccount, domainName),
                TargetAccounts = targetAccounts,
                Data = data
            };

            return await DistributeSignalRResponse(
                usersSessionRepository,
                "R_WorkflowRefresh",
                signal,
                targetAccounts,
                domainName);
        }

        public async static Task SignalRResponse(IBaseRepository<UsersSession> _usersSessionRepository, string UIMethod
            , object returnObject
            , string connectionId
            , string domainName
            )
        {
            await DistributeSignalRResponse(
                _usersSessionRepository,
                UIMethod,
                returnObject,
                new[] { connectionId },
                domainName);
        }
     
    }
}
