using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using ERPCore.Models.Migration.Base;
using ERPCore.Models.Migration.Config;

namespace ERPCore.Models.Migration.Business.MasterData
{
    public class Country : BaseModel 
    {
          public string? Name { get; set; } 
          public string? Code { get; set; } 
          public bool? IsActive { get; set; }
          
         public string? Attributes { get; set; }
    }
}
