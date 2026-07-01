using System.ComponentModel.DataAnnotations;

namespace ERPCore.Models.Request
{
	public class UWActionRequest
    {
		public string? TemplateMailName { get; set; }
		public string? RouteAction { get; set; }
		public string? RecordStatus { get; set; }
		public long? QuotationId { get; set; }	


		//public UWSurvey UWSurvey { get; set; }	
		//public UWSurveyResult UWSurveyResult { get; set; }
    }
}
