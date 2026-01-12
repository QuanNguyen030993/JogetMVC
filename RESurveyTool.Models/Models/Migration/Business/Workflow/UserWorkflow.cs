using System;
using System.ComponentModel.DataAnnotations;
using ERPCore.Models.Migration.Base;
using ERPCore.Models.Migration.Business.Config;
namespace ERPCore.Models.Migration.Business.Workflow
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
