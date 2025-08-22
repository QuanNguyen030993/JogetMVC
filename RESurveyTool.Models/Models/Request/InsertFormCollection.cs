using System.ComponentModel.DataAnnotations;

namespace SurveyReportRE.Models.Request
{
	public class InsertFormCollection
    {
        public int key { get; set; }    
        public string values {  get; set; }
    }
}
