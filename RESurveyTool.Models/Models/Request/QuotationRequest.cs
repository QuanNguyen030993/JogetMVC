using System.ComponentModel.DataAnnotations;

namespace ERPCore.Models.Request
{
	public class QuotationRequest
	{
		public string? ClientName { get; set; } = "";
		public string? PolicyNo { get; set; } = "";
    }
}
