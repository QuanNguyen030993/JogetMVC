using ERPCore.Models.Models.Parsing;
using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;
using System.Diagnostics.Contracts;

namespace ERPCore.Models.Request
{
	public class PolicyIssuanceRequest
	{
        public PolicyIssuanceData? PolicyIssuanceData { get; set; }
        public List<IFormFile>? Files { get; set; }
    }

    public class PolicyIssuanceData
    {
        public PolicyIssuance? PolicyIssuance { get; set; }
        //public PolicyIssuanceTmp? PolicyIssuanceTmp { get; set; }
        public long? WorkflowDefinitionId { get; set; }
        public string StartingDept { get; set; }
        public AttributesParsing? Attributes { get; set; }
        public SubmitRequest? SubmitRequest { get; set; }
    }
}
