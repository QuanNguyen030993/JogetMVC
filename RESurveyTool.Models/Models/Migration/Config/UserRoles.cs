using ERPCore.Models.Migration.Base;
using System.ComponentModel.DataAnnotations;

namespace ERPCore.Models.Migration.Business.Config
{
    public class UserRoles : BaseModel
    {
        public long? RoleId { get; set; }
        public Roles? RoleFK { get; set; }   
        public long? UserId { get; set; }
        public Users? UserFK { get; set; }    
        public long? MenuId { get; set; }
        public Menu? MenuFK { get; set; }    
    }
}
