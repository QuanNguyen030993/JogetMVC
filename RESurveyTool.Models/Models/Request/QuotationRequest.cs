using System.ComponentModel.DataAnnotations;
using System.Diagnostics.Contracts;

namespace ERPCore.Models.Request
{
	public class QuotationRequest
	{
         public Quotation? Quotation { get; set; }
        public Guid? WorkflowDefinitionId { get; set; }
    }
}
