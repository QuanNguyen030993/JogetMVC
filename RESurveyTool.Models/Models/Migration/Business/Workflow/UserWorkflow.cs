using System;
using System.ComponentModel.DataAnnotations;
using SurveyReportRE.Models.Migration.Base;
using SurveyReportRE.Models.Migration.Business.Config;
namespace SurveyReportRE.Models.Migration.Business.Workflow
{
    public class UserWorkflow : BaseModel
    {
        public long? UsersId { get; set; }
        public Users? UsersFK { get; set; }
        public long? CheckerUsersId { get; set; }
        public Users? CheckerUsersFK { get; set; }   
        public long? ApproverUsersId { get; set; }
        public Users? ApproverUsersFK { get; set; }
    }
}
