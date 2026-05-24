using ERPCore.Models.Migration.Business.Workflow;
using System.ComponentModel.DataAnnotations;
using System.Diagnostics.Contracts;

namespace ERPCore.Models.Request
{
	public class SubmitRequest
	{
        public InstanceWorkflow? InstanceWorkflow { get; set; }
        public StepsWorkflow? StepsWorkflow { get; set; }
        public StepsWorkflow? ToStepsWorkflow { get; set; }
        public long? QuotationId { get; set; }  
        public string? Comment { get; set; }
        public bool? isEmail { get; set; } = false;
    }
}
