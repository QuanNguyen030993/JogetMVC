using System;
using System.ComponentModel.DataAnnotations;
using SurveyReportRE.Models.Migration.Base;
using SurveyReportRE.Models.Migration.Business.MasterData;
using SurveyReportRE.Models.Migration.Config;
namespace SurveyReportRE.Models.Migration.Business.Workflow
{
    public class SurveyMemoWorkflow : BaseModel
    {
        public long? SurveyId { get; set; }
        public string Comment { get; set; } = "";
        public long? OutlineId { get; set; }
        public Outline?  OutlineFK { get; set; }  
        public string OutlineName { get; set; } = "";
        public DateTime? SubmitDate { get; set; }
        public string OutlineOrder { get; set; } = "";
        public string OutlinePage { get; set; } = "";

    }
}