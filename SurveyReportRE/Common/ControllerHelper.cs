using DocumentFormat.OpenXml.Math;
using MimeMapping;
using Newtonsoft.Json;
using RESurveyTool.Models.Models.Parsing;
using SurveyReportRE.Common;
using SurveyReportRE.Models.Business.Migration.Config;
using SurveyReportRE.Models.Migration.Business.Config;
using SurveyReportRE.Models.Migration.Business.Data;
using SurveyReportRE.Models.Migration.Business.Form;
using SurveyReportRE.Models.Migration.Business.HumanResource;
using SurveyReportRE.Models.Migration.Business.MasterData;
using SurveyReportRE.Models.Migration.Business.Workflow;
using SurveyReportRE.Models.Request;

namespace SurveyReportRE.ControllerUtil
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

        public async static Task SurveyMemoMaking(string docPath, Survey survey, IBaseRepository<SurveyMemoWorkflow> _surveyMemoWorkflowRepository)
        {
            List<Outline> outlines = new List<Outline>();
            List<SurveyMemoWorkflow> tocParagraphs = new List<SurveyMemoWorkflow>();
            tocParagraphs = WordUtil.ExtractTocLines(docPath);
            long? surveyTypeId = survey.SurveyTypeId;
            //if (surveyTypeId != null)
            //{
            //    outlines = await _outlineRepository.GetListObject(l => l.SurveyTypeId == surveyTypeId);
            //    foreach (Outline item in outlines)
            //    {
            //        SurveyMemoWorkflow surveyMemoWorkflow = new SurveyMemoWorkflow();
            //        surveyMemoWorkflow.SurveyId = survey.Id;
            //        surveyMemoWorkflow.OutlineId = item.Id;
            //        surveyMemoWorkflow.OutlineName = item.Content;
            //        surveyMemoWorkflow.SubmitDate = survey.SubmitDate;
            //        await _surveyMemoWorkflowRepository.InsertData(surveyMemoWorkflow);
            //    }
            //}
            foreach (SurveyMemoWorkflow surveyMemoWorkflow in tocParagraphs)
            {
                surveyMemoWorkflow.SurveyId = survey.Id;
                surveyMemoWorkflow.SubmitDate = survey.SubmitDate;
                await _surveyMemoWorkflowRepository.InsertData(surveyMemoWorkflow);
            }
        }

        public async static Task WFChangeStatus(IBaseRepository<InstanceWorkflow> baseRepository, Survey survey, InstanceWorkflow instanceWorkflow, long? stepsWorkflow, string stepDirection, bool isDelete = false)
        {
            if (instanceWorkflow != null)
            {
                if (!isDelete)
                {
                    if (stepDirection == "Up" || stepDirection == "Down")
                    {
                        instanceWorkflow.CurrentStep = (stepDirection == "Up" ? UpStep(instanceWorkflow) : DownStep(instanceWorkflow));
                        instanceWorkflow.WorkflowStatusId = stepsWorkflow;
                    }
                    else
                    {
                        instanceWorkflow.CurrentStep = 1;
                        instanceWorkflow.WorkflowStatusId = stepsWorkflow;
                    }
                    await baseRepository.UpdateData(instanceWorkflow, JsonConvert.SerializeObject(instanceWorkflow), instanceWorkflow.Id, "Id");
                }
                else
                {
                    await baseRepository.DeleteData(instanceWorkflow, instanceWorkflow.Id, "Id", isDelete);
                }
            }
        }
        public static int UpStep(InstanceWorkflow instanceWorkflow)
        {
            if (instanceWorkflow != null)
                return (instanceWorkflow?.CurrentStep ?? 0) + 1;
            else return 1;
        }
        public static int DownStep(InstanceWorkflow instanceWorkflow)
        {
            if (instanceWorkflow != null)
                return ((instanceWorkflow?.CurrentStep ?? 0) - 1) < 1 ? 1 : (instanceWorkflow?.CurrentStep ?? 0) - 1;
            else return 1;
        }

        public static AttachmentForm BindingAttachmentForm(Attachment Base, string blobPath)
        {
            AttachmentForm attachmentForm = new AttachmentForm();
            attachmentForm.name = Base.FileName;
            string mimeType = MimeUtility.GetMimeMapping(Base.FileName);
            attachmentForm.type = mimeType;
            byte[] byteArray = System.IO.File.ReadAllBytes(Path.Combine(blobPath, Base.SubDirectory));
            attachmentForm.baseString = Convert.ToBase64String(byteArray);
            attachmentForm.fileData = Array.ConvertAll(byteArray, b => (int)b);
            attachmentForm.byteArray = byteArray;
            attachmentForm.size = attachmentForm.fileData.Length;
            attachmentForm.surveyId = Base.SurveyId;
            attachmentForm.attachmentId = Base.Id;
            attachmentForm.outlineId = Base.OutlineId;
            attachmentForm.outlinePlaceholder = Base.OutlinePlaceholder;
            attachmentForm.sitePictureId = 0;
            attachmentForm.sitePictureDescription = Base.AttachmentNote;
            attachmentForm.attachmentGuid = Base.Guid.ToString();
            attachmentForm.fileDate = Base.ModifiedDate.ToString() ?? "";
            return attachmentForm;
        }

        public static void DynamicOutlineObjectHandle(string placeHolder, DynamicOutline dynamicOutline, SurveyCustomOutline surveyData, OutlineDynamic outlineDynamic, DataGridConfig gridConfig, SurveyOutlineOptions surveyOutlineOptions)
        {
            dynamicOutline.Outline = surveyData.Outline;
            if (dynamicOutline.Outline != null)
            {
                dynamicOutline.Outline.PlaceHolder = placeHolder;
            }
            dynamicOutline.OutlineDynamic = outlineDynamic;
            dynamicOutline.Params = "";
            dynamicOutline.Content = "";
            dynamicOutline.DataGridConfig = gridConfig;
            dynamicOutline.SurveyOutlineOptions = surveyOutlineOptions;
        }
    }
}