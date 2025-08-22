using SurveyReportRE.Models.Migration.Business.Data;
using SurveyReportRE.Models.Migration.Business.Form;
using SurveyReportRE.Models.Migration.Business.MasterData;

namespace SurveyReportRE.Models.Request
{
    public class SurveySubmitRequest
	{
		public Guid? DraftGuid { get; set; }
		public int? CloneSurveyId { get; set; }

        public Survey? Survey { get; set; }
		public PosNegAspectContent? PosNegAspectContent { get; set; }
		public SurveyEvaluation[]? SurveyEvaluations { get; set; }
		public Summary? Summary { get; set; }
		public Management? Management { get; set; }
		public Construction? Construction { get; set; }
        public Occupancy? Occupancy { get; set; }
        public ConstructionBuilding[]? ConstructionBuilding { get; set; }
		public OccupancyDetail[]? OccupancyUtility { get; set; }
		public OccupancyDetail[]? OccupancyIndGas { get; set; }
		//public Chart[]? Charts { get; set; }	
		public AttachmentRequest[]? AttachmentRequests { get; set; }
		public Protection? Protection { get; set; }	
		public ExtFireExpExposures? ExtFireExpExposures { get; set; }	
		public OtherExposures? OtherExposures { get; set; }
        public LossHistory? LossHistory { get; set; }
		public LossExpValueBrkdwn? LossExpValueBrkdwn { get; set; }
        public Appendix? Appendix { get; set; }
		public Outline[]? MainOutlines { get; set; }
		public SurveyOutlineOptions[]? SurveyOutlineOptions { get; set; }
		public SitePictures[]? SitePictures { get; set; }
        public OccupancyDetail[]? OccupancyDetail { get; set; }
        public LossExpValueBrkdwnDetail[]? LossExpValueBrkdwnDetail { get; set; }
        public LossHistoryDetail[]? LossHistoryDetail { get; set; }
        public ParticipantList[]? ParticipantList { get; set; }
        public ProtectionDetail[]? ProtectionDetail { get; set; }

    }

    public class PosNegAspectContent
	{
		public string? PosAspecContent { get; set; }
		public string? NegAspecContent { get; set; }

    }

	public class AttachmentRequest
	{
		public AttachmentForm? attachment { get; set; }
		public string? fileName { get; set; } = "";
		public string? dataField { get; set; } = "";
		public int[]? fileData { get; set; }
		public long? outlineId { get; set; }
		public string outlinePlaceholder { get; set; } = "";
		public Guid? outlineGuid { get; set; }
		public string? modelName { get; set; } = "";
		public long? surveyId { get; set; }
		public Guid? cacheGuid { get; set; }


    }
	public class AttachmentForm
	{
		//public IFormFile?  { get; set; }
		public string sitePictureDescription { get; set; } = "";
        public long? sitePictureId { get; set; }	
		public int[]? fileData { get; set; }
		public byte[]? byteArray { get; set; }
		public string? name { get; set; } = "";
		public long? size { get; set; }
		public string? type { get; set; } = "";
		public string? webkitRelativePath { get; set; } = "";
		public string? baseString = "";
		public long? surveyId { get; set; }
		public long? outlineId { get; set; }
		public string outlinePlaceholder { get; set; } = "";
		public long? attachmentId { get; set; }
        public int? width { get; set; }
        public int? height { get; set; }
		public string attachmentGuid { get; set; } = "";
		public string fileDate { get; set; } = "";
    }
}
