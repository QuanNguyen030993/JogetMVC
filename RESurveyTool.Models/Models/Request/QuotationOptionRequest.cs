using ERPCore.Models.Models.Parsing;
using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;
using System.Diagnostics.Contracts;

namespace ERPCore.Models.Request
{

    public class QuotationOptionRequest
    {
        public long? QuotationId { get; set; }
        public List<QuotationOptionElements> QuotationData { get; set; }
    }

    public class QuotationOptionElements
    {
        
        public long? Index { get; set; }  
        public long? QuotationId { get; set; }  
        public long? DocumentId { get; set; }   
        public string AttachmentElement { get; set; }  
        public long? LineId { get; set; }   
        public long? ProductId { get; set; }
    }

   
}
