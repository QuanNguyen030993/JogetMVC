using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ERPCore.Models.Config
{
    public class URLConfig
    {
        public string OrderMail { get; set; } = "";
        public string ExpireDays { get; set; } = "";
        public string RedirectMainView { get; set; } = "";
        public string Host { get; set; } = "";
        public string REHost { get; set; } = "";
        public string LibreOfficeHost { get; set; } = "";
        public string DigiSignHost { get; set; } = "";
        public string QuotationSignEndpoint { get; set; } = "";
        public string CallbackHost { get; set; } = "";
        public string GetStreamHost { get; set; } = "";
        public string DigisignStorageHost { get; set; } = "";

    }
}
