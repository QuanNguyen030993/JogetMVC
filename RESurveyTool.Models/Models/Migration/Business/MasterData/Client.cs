using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using ERPCore.Models.Migration.Base;

namespace ERPCore.Models.Migration.Business.MasterData
{
    public class Client : BaseModel 
    {
        public string ClientCode { get; set; } = "";
        public string ClientName { get; set; } = "";

        public string PolicyCode { get; set; } = "";
        public long? OldClientCodeId { get; set; }
        public string ShortName { get; set; } = "";
        public long? AreaId { get; set; }

    }
}
