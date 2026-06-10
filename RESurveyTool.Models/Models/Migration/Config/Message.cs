using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ERPCore.Models.Business.Migration.Config
{
    public class Message
    {
        public InitializeMessage InitializeMessage { get; set; }
        public OverviewMessageLoading OverviewMessageLoading { get; set; }
    }

    public class TemplateNotifyMessage
    {
        public string Title { get; set; }
        public string Content { get; set; }

    }

    public class InitializeMessage : TemplateNotifyMessage
    {
    }
    public class OverviewMessageLoading : TemplateNotifyMessage
    {
    }
}
