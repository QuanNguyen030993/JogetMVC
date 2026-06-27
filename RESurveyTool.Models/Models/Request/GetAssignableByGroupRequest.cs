using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace JogetMVC.Models.Models.Request
{
    public class GetAssignableByGroupRequest
    {
        public string? group { get; set; }
        public string? branchCode { get; set; }
        public bool? excludeCurrent { get; set; } = true;
        public string? keyword { get; set; } = "";
    }
}
