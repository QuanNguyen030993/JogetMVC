using ERPCore.Models.Migration.Base;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ERPCore.Models.Models.Parsing
{
    public class DynamicFieldFilter
    {
        public string FieldName { get; set; } = "";
        public object? FieldValue { get; set; }
        public string Operator { get; set; } = "="; 
    }
    public class RefFilter
    {
        public string Key { get; set; } = "";
        public string Value { get; set; } = "";
        public string Operator { get; set; } = "=";
    }

}
