using System.Data;

namespace SurveyReportRE.Models.Request
{
    public class FilterRequest
    {
        public int? Id { get; set; }    
        public DateTime? FromDate {  get; set; } 
        public DateTime? ToDate { get; set;}
        public string Outline { get; set; } = "";
        public string Content { get; set; } = "";
    }
}
