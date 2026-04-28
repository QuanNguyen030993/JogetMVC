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
            string userName = httpContextAccessor.HttpContext.User.Identity.Name.Replace(DOMAIN_NAME, "");
            var userInfo = new UserInfo();
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
                return (Convert.ToInt32((instanceWorkflow?.CurrentStep ?? "0")) + 1).ToString();
            else return "1";
        }
        public static string DownStep(InstanceWorkflow instanceWorkflow)
        {
            if (instanceWorkflow != null)
                return (Convert.ToInt32(instanceWorkflow?.CurrentStep ?? "0") - 1) < 1 ? "1": ((Convert.ToInt32(instanceWorkflow?.CurrentStep ?? "0") - 1) - 1).ToString();
            else return "1";
        }

        public async static Task SignalRResponse(IHubContext<FileProcessingHub> hubContext
            , string UIMethod
            , object returnObject
            , string connectionId
            , string domainName
            )
        {

            IReadOnlyList<OnlineUserDto> onlineUsers = FileProcessingHub._store.GetOnlineUsers();
                OnlineUserDto onlineUser = onlineUsers.FirstOrDefault(f => f.User.Replace(domainName, "") == connectionId);

                await hubContext.Clients.Client(onlineUser.ConnectionId).SendAsync(UIMethod,
                returnObject);
        }
     
    }
}