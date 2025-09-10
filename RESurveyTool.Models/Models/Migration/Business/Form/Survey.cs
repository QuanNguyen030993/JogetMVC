//using System;
//using System.Collections.Generic;
//using System.ComponentModel.DataAnnotations;
//using System.Linq;
//using System.Reflection.Metadata.Ecma335;
//using System.Text;
//using System.Threading.Tasks;
//using SurveyReportRE.Models.Migration.Base;
//using SurveyReportRE.Models.Migration.Business.Data;
//using SurveyReportRE.Models.Migration.Business.MasterData;
//using SurveyReportRE.Models.Migration.Business.Workflow;
//using SurveyReportRE.Models.Migration.Config;

//namespace SurveyReportRE.Models.Migration.Business.Form
//{
//    public class Survey : BaseModel
//    {
//        public override string CreatedBy { get => base.CreatedBy; set => base.CreatedBy = value; }
//        public long? ProtectionDetailId { get; set; }
//        public string AccompaniedBy { get; set; } = "";
//        public string CompanyName { get; set; } = "";
//        public string ConferredWith { get; set; } = "";
//        public DateTime? DateOfVisit { get; set; }
//        public long? ExtFireExpExposuresId { get; set; }
//        public ExtFireExpExposures? ExtFireExpExposuresFK { get; set; }
//        public string LatitudeLongitude { get; set; } = "";
        
//        public string LocationAddress { get; set; } = "";
        
//        public string Occupancy { get; set; } = "";
//        public string? SurveyedBy { get; set; } = "";
//        public string? SurveyedByAccountName { get; set; } = "";
//        public string Management { get; set; } = "";
//        public string REOpinion { get; set; } = "";
//        public long? ClientTypeId { get; set; }
//        public long? ConstructionId { get; set; }
//        public Construction? ConstructionFK { get; set; }
//        public long? LossHistoryId { get; set; }  
//        public LossHistory? LossHistoryFK { get; set; }
//        public string Construction { get; set; } = "";
        
//        public string Exposure { get; set; } = "";
//        public long? LineOfBusinessId { get; set; }
        
//        public string LossHistory { get; set; } = "";
//        public long? ManagementId { get; set; }
//        public Management? ManagementFK { get; set; }
        
//        public string NaturalHazard { get; set; } = "";
//        public long? OccupancyId { get; set; }
//        public Occupancy? OccupancyFK { get; set; }
        
//        public long? OtherExposuresImgId { get; set; }
//        public long? OtherExposuresId { get; set; }
//        public OtherExposures? OtherExposuresFK { get; set; }
//        public long? ProtectionId { get; set; }
        
//        public string Protection { get; set; } = "";
//        public Protection? ProtectionFK { get; set; }   
//        public long? SurveyFlowStatusId { get; set; }
//        public string SurveyNo { get; set; } = "";
//        public long? SurveyOverallStatusId { get; set; }
//        public int? TranNo { get; set; } = 1;
//        public long? ClientId { get; set; }
//        //public Client? ClientFK { get; set; }   
//        public long? LocationId { get; set; }
//        public long? SurveyTypeId { get; set; }
//        public EnumData? SurveyTypeEnum { get; set; }
//        public string SurveyedPremises { get; set; } = "";
//        public string Ownership { get; set; } = "";
//        public string Department { get; set; } = "";
//        public long? SummaryId { get; set; }
//        public Summary? SummaryFK { get; set; }
//        public long? LossExpValueBrkdwnId { get; set; }
//        public LossExpValueBrkdwn? LossExpValueBrkdwnFK { get; set; }   
//        public long? AppendixId { get; set; }
//        public Appendix? AppendixFK { get; set; }
//        public long? OverViewAttachmentId { get; set; }
//        public long? WorkflowStatusId { get; set; }
//        public long? PDFAttachmentId { get; set; }
//        public Attachment? PDFAttachmentFK { get; set; }
//        public string ApprovalBy { get; set; } = "";
//        public DateTime? ApprovalDate { get; set; }
//        public string Comment { get; set; } = "";
//        public DateTime? DueDate { get; set; }
//        public string RecallReason { get; set; } = "";
//        public string GrantSurvey { get; set; } = "";
//        public long? AreaId { get; set; }
//        public EnumData? AreaEnum { get; set; }
//        public string ClientName { get; set; } = "";
//        public long? TypeOfOccupancy { get; set; } 
//        public EnumData? TypeOfOccupancyEnum { get; set; }
//        public DateTime? SubmitDate { get; set; }
//        public bool? WordRendered { get; set; }
//        public bool? NeedPDFConvert { get; set; }
//        public bool? IsArchived { get; set; }
//        public string ClientCode { get; set; } = "";
//        public string OwnerReport { get; set; } = "";
//        public string PDFReplacement { get; set; } = "";
//        public string CCSiteAccount { get; set; } = "";
//        public InstanceWorkflow? InstanceWorkflowFK { get; set; }
//        public List<ConstructionBuilding> ConstructionBuildings { get; set; } = new List<ConstructionBuilding>();
//        public List<PosNegAspect> PosNegAspects { get; set; } = new List<PosNegAspect>();
//        public List<SurveyEvaluation> SurveyEvaluations { get; set; } = new List<SurveyEvaluation>();
//        public List<OccupancyDetail> OccupancyDetails { get; set; } = new List<OccupancyDetail>();
//        public List<Chart> Charts { get; set; } = new List<Chart>();
//        public List<Attachment> Attachments { get; set; } = new List<Attachment>();
//        public List<ProtectionDetail> ProtectionDetails { get; set; } = new List<ProtectionDetail>();
//        public List<LossExpValueBrkdwnDetail> LossExpValueBrkdwnDetails { get; set; } = new List<LossExpValueBrkdwnDetail>();
//        public List<LossHistoryDetail> LossHistoryDetails { get; set; } = new List<LossHistoryDetail>();
//        public List<ParticipantList> ParticipantLists { get; set; } = new List<ParticipantList>();
//        public List<SurveyOutlineOptions> SurveyOutlineOptions { get; set; } = new List<SurveyOutlineOptions>();
//        public List<SitePictures> SitePictures { get; set; } = new List<SitePictures>();
//    }
//}
