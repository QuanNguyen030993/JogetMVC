using SurveyReportRE.Models.Migration.Business.Data;
using SurveyReportRE.Models.Migration.Business.Form;

namespace SurveyReportRE.Models.Request
{
    public class SurveyUpdateRequest
    {
        public Survey? Survey { get; set; }
        public string surveyValues { get; set; } = "";
        public string reOpinionValues { get; set; } = "";   
        public Summary? Summary { get; set; }
        public string summaryValues { get; set; } = "";
        public PosNegAspectContent? PosNegAspectContent { get; set; }
        public string posNegValues { get; set; } = "";
        public SurveyEvaluation[]? SurveyEvaluations { get; set; }
        public string surveyEvaluationsValues { get; set; } = "";   
        public Management? Management { get; set; }
        public string managementValues { get; set; } = "";
        public Construction? Construction { get; set; }
        public string constructionValues { get; set; } = "";
        public ConstructionBuilding[]? ConstructionBuilding { get; set; }
        public string constructionBuildingValues { get; set; } = "";
        public OccupancyDetail[]? OccupancyUtility { get; set; }
        public OccupancyDetail[]? OccupancyIndGas { get; set; }
        public AttachmentRequest[]? AttachmentRequests { get; set; }
        public SitePictures[]? SitePictures { get; set; }
        public Occupancy? Occupancy { get; set; }
        public string occupancyValues { get; set; } = "";
        public Protection? Protection { get; set; } 
        public string protectionValues { get; set; } = ""; 
        public ExtFireExpExposures? ExtFireExpExposures { get;  set; }
        public string extFireExpExposuresValues { get; set; } = "";
        public OtherExposures? OtherExposures { get;  set; }
        public string otherExposuresValues { get; set; } = "";
        public LossHistory? LossHistory { get; set; }
        public string lossHistoryValues { get; set; } = "";
        public LossExpValueBrkdwn? LossExpValueBrkdwn { get; set; }
        public string lossExpValueBrkdwnValues { get; set; } = "";
        public Appendix? Appendix { get; set; }
        public string appendixValues { get; set; } = "";
        public SurveyOutlineOptions[]? SurveyOutlineOptions { get; set; }
        public string surveyOutlineOptionsValues { get; set; } = "";
        public string? connectionId { get; set; } = "";
        public bool autoSavedFlag { get; set; } = false;
    }
}
