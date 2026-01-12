using ERPCore.Models.Migration.Business.Config;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ERPCore.Models.Models.Parsing
{
    public class GrantQuotation
    {
        public List<Users> GrantUsers { get; set; } = new List<Users>();
    }
}
