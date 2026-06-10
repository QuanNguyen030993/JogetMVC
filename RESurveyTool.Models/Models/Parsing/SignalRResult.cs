using ERPCore.Models.Migration.Business.Config;
using ERPCore.Models.Migration.Business.HumanResource;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ERPCore.Models.Models.Parsing
{
    public class SignalRResult
    {
        public string status { get; set; } = "";
        public string tabName { get; set; } = "";
        public string subTabContent { get; set; } = "";
        public object             data { get; set; } = "";
        public double             progressvalue { get; set; } = 0;
        public string             type { get; set; } = "";
    }
}
