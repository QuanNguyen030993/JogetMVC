using System.ComponentModel.DataAnnotations;

namespace SurveyReportRE.Models.Request
{
	public class UpdateFormCollection
    {
        public int key { get; set; }    
        public string values {  get; set; }
    }
}
