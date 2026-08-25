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

        public async static Task SignalRResponse(IBaseRepository<UsersSession> _usersSessionRepository, string UIMethod
            , object returnObject
            , string connectionId
            , string domainName
            )
        {
            static string NormalizeSignalRAccount(string? account, string? domain)
            {
                string value = (account ?? "").Trim();
                if (!string.IsNullOrWhiteSpace(domain)) {
                    value = value.Replace(domain, "", StringComparison.OrdinalIgnoreCase);
                }
                return value.Trim().TrimStart('\\').Split('\\').Last();
            }

            string targetAccount = NormalizeSignalRAccount(connectionId, domainName);
            string[] liveConnectionIds = FileProcessingHub._store
                .GetOnlineUsers()
                .Where(item => string.Equals(
                    NormalizeSignalRAccount(item.User, domainName),
                    targetAccount,
                    StringComparison.OrdinalIgnoreCase))
                .Select(item => item.ConnectionId)
                .Where(id => !string.IsNullOrWhiteSpace(id))
                .Distinct()
                .ToArray();

            if (liveConnectionIds.Length > 0)
            {
                await FileProcessingHub._hubContext.Clients
                    .Clients(liveConnectionIds)
                    .SendAsync(UIMethod, returnObject);
                return;
            }

            //IReadOnlyList<OnlineUserDto> onlineUsers = FileProcessingHub._store.GetOnlineUsers();
            //    OnlineUserDto onlineUser = onlineUsers.FirstOrDefault(f => f.User.Replace(domainName, "") == connectionId);
            
            List<UsersSession> usersSession = new List<UsersSession>();

            var today = DateTime.Today.AddDays(-1);
            var tomorrow = DateTime.Today.AddDays(1);

            string loginUser = connectionId;
            usersSession = await _usersSessionRepository
                .GetListObject(s => s.CreatedDate >= today
                         && s.CreatedDate < tomorrow
                );
            UsersSession currentUsersSession = usersSession.Where(w =>
                    string.Equals(
                        NormalizeSignalRAccount(w.CreatedBy ?? w.UserName, domainName),
                        targetAccount,
                        StringComparison.OrdinalIgnoreCase))
                .OrderByDescending(s => s.CreatedDate)
                .FirstOrDefault();

            //IReadOnlyList<OnlineUserDto> onlineUsers = FileProcessingHub._store.GetOnlineUsers();
            //OnlineUserDto onlineUser = onlineUsers.FirstOrDefault(f => f.User.Replace(domainName, "") == connectionId);
            await FileProcessingHub._hubContext.Clients.Client(currentUsersSession?.SignalRConnectionId ?? "").SendAsync(UIMethod,
                returnObject);
        }
     
    }
}
