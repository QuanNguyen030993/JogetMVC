using System;
using System.ComponentModel.DataAnnotations;
using SurveyReportRE.Models.Migration.Base;
namespace SurveyReportRE.Models.Migration.Business.Workflow
{
    public class PendingJoget : BaseModel
    {
        public string NextActionOnJoget { get; set; } = "";
        public string NextPerson { get; set; } = "";
        public string ActionDoneQuotationStatus { get; set; } = "";
        public string CompleteQuo { get; set; } = "";
        public string MKTFORequestedQuotationBy { get; set; } = "";
        public string MKTTS { get; set; } = "";
        public string FirstUWthatAcceptedRisk { get; set; } = "";
        public string PM { get; set; } = "";
        public string QuotationNumber { get; set; } = "";
        public string RequestQuotationNumber { get; set; } = "";
        public string DateCreatedQT { get; set; } = "";
        public string DateCreatedPM { get; set; } = "";
        public string TeamGroup { get; set; } = "";
        public string PolicyNumber { get; set; } = "";
        public string CompletePI { get; set; } = "";
        public string CompletedDate { get; set; } = "";
        public string PolicyHolder { get; set; } = "";

    }
}