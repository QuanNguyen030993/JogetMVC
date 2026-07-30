using ERPCore.Models.Models.Parsing;
using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;
using System.Diagnostics.Contracts;

namespace ERPCore.Models.Request
{
	public class QuotationRequest
	{
        public QuotationData? QuotationData { get; set; }
        //public PolicyIssuanceData? PolicyIssuanceData { get; set; }
        public List<IFormFile>? Files { get; set; }
    }

    public class QuotationData
    {
        public Quotation? Quotation { get; set; }
        public QuotationTmp? QuotationTmp { get; set; }
        public long? WorkflowDefinitionId { get; set; }
        public string StartingDept { get; set; }
        public AttributesParsing? Attributes { get; set; }
        public SubmitRequest? SubmitRequest { get; set; }
    }
    //public class PolicyIssuanceData
    //{
    //    public PolicyIssuance? Quotation { get; set; }
    //    public QuotationTmp? QuotationTmp { get; set; }
    //    public long? WorkflowDefinitionId { get; set; }
    //    public string StartingDept { get; set; }
    //    public AttributesParsing? Attributes { get; set; }
    //    public SubmitRequest? SubmitRequest { get; set; }
    //}
}
