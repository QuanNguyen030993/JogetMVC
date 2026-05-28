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
    }

    public class InitializeMessage
    {
        public string Title  { get; set; }  
        public string Content { get; set; } 
    }

}
