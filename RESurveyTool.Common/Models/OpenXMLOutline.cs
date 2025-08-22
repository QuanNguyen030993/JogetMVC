using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Math;
using RESurveyTool.Models.Models.Parsing;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RESurveyTool.Common.Models
{
    public class OpenXMLOutline :DynamicOutline
    {
        public OpenXmlElement[]? Data { get; set; }
        public List<dynamic> Images { get; set; } = new List<dynamic>();
        public string Placeholder { get; set; } = "";
    }
}
