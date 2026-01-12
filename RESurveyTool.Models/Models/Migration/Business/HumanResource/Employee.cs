using ERPCore.Models.Migration.Base;
using ERPCore.Models.Migration.Business.Config;
using ERPCore.Models.Migration.Config;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace ERPCore.Models.Migration.Business.HumanResource
{
    public class Employee : BaseModel
    {
        public string FirstName { get; set; } = "";
        public string LastName { get; set; } = "";
        public string FullName { get; set; } = "";
        public string Department { get; set; } = "";
        public string AccountName { get; set; } = "";
        public string Email { get; set; } = "";
        //public long? ReportToUserId { get; set; }
        //public long? UserId { get; set; } 
        public long? AreaId { get; set; }
        //public long? SystemRoleId { get; set; }
        //public Roles? SystemRoleFK { get;set; } 
        public long? SystemRolesId { get; set; }
        public Roles? SystemRolesFK { get;set; }
        public string EmailName { get; set; } = "";
        public long? UsersId { get; set; }
        public Users? UsersFK { get; set; }
    }
}
