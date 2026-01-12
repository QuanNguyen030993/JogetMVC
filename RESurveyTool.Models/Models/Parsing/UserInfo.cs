using ERPCore.Models.Migration.Business.Config;
using ERPCore.Models.Migration.Business.HumanResource;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ERPCore.Models.Models.Parsing
{
    public class UserInfo
    {
        public Users? Users { get; set; }   
        public Employee? Employee { get; set; }     
        public UserRoles? UserRoles { get; set; }
        public Roles? Roles { get; set; }   
    }
}
