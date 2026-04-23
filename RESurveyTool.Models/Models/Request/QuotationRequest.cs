using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;
using System.Diagnostics.Contracts;

namespace ERPCore.Models.Request
{
	public class QuotationRequest
	{
        public QuotationData? QuotationData { get; set; }
        public List<IFormFile>? Files { get; set; }
    }

    public class QuotationData
    {
        public Quotation? Quotation { get; set; }
       
        public long? WorkflowDefinitionId { get; set; }
        public string StartingDept { get; set; }
    }
}
