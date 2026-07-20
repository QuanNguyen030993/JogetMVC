using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ERPCore.Models.Business.Migration.Config
{
    public class Message
    {
        public Assign Assign { get; set; }
        public Accept Accept { get; set; }
    }

    public class TemplateNotifyMessage
    {
        public string Title { get; set; }
        public string Content { get; set; }

    }

    public class Assign : TemplateNotifyMessage
    {
    }
    public class Accept : TemplateNotifyMessage
    {
    }
}
