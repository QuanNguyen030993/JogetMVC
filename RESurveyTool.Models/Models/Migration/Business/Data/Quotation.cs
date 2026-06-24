using System;
using System.ComponentModel.DataAnnotations.Schema;
using ERPCore.Models.Migration.Base;
using ERPCore.Models.Migration.Business.Data;
using ERPCore.Models.Migration.Business.MasterData;
using ERPCore.Models.Migration.Business.Workflow;
using ERPCore.Models.Migration.Config;
using static ERPCore.Models.Models.Parsing.JsonHandle;

public class Quotation : BaseModel
{
    // =========================================================
    // System keys (optional) - user said exclude system keys, so not included.
    // =========================================================

    public string? Subject { get; set; } = "";
    public string? LeaderComment { get; set; } = "";

    // =========================================================
    // Ý 1 — Header/Request (rename)
    // =========================================================
    public string? RequestNo { get; set; } = "";                 // c_qrNum
    public string? RequestRefNo { get; set; } = "";              // c_refNum
    public string? QuotationCode { get; set; } = "";             // c_jogetQuoNum

    public DateTime? RequestedDate { get; set; }           // c_reqDate
    public DateTime? DueDate { get; set; }                 // c_dueDate

    public string? RequestType { get; set; } = "";               // c_reqType
    public long? RequestTypeId { get; set; } = 0;
    public EnumData? RequestTypeEnum { get; set; }
    public string? QuotationType { get; set; } = "";             // c_typeOfQT

    public string? BusinessChannelName { get; set; } = "";        // c_businessChannel
    public string? SourceOfBusinessName { get; set; } = "";       // c_sourceOfBusiness
    public string? BusinessChannelDisplayName { get; set; } = ""; // c_nameOfBizChannel
    public DateTime? InceptionDate { get; set; }
    public string? LockedReferenceFields { get; set; } = "";

    // =========================================================
    // Ý 2 — PolicyHolder/Insured/Client
    // - Multi-language expandable (3rd language+) via JSON
    // =========================================================
    public string? PolicyHolderId { get; set; } = "";            // c_policyHolder
    public string? PolicyNo { get; set; } = "";

    public string? InsuredId { get; set; } = "";                 // c_ins
    public string? InsuredName { get; set; } = "";               // from c_insNameViet/c_insNameEng
    public string? ClientName { get; set; } = "";                // from c_clientNameViet/c_clientNameEng
    public long? ClientId { get; set; }                // from c_clientNameViet/c_clientNameEng
    public Client? ClientFK { get; set; }                // from c_clientNameViet/c_clientNameEng
    public string? ClientCode { get; set; }
    public string? RegisteredAddress { get; set; } = "";         // from c_registeredAddressViet/c_registeredAddress
    public string? BusinessAddress { get; set; } = "";           // from c_businessAddressViet/c_businessAddressEng

    public string? InsRegisteredAddress { get; set; } = "";
    public string BusinessOccupationName { get; set; } = "";
    public long? Occupation { get; set; } = 0;
    public EnumData? OccupationEnum { get; set; }   

    // Multi-language payload for PolicyHolder/Insured/Client + addresses
    public string? PartyMultiLangJson { get; set; } = "";        // JSON (vi/en/..)

    // =========================================================
    // Ý 3 — Product/Line/CFE (rename; TODO Master Data)
    // =========================================================
    // TODO: Move Product/Line/CFE to Master Data later.
    public string? ProductName { get; set; } = "";               // c_productName
    //public string? ProductDisplayName { get; set; } = "";        // c_productNameView
    //public string? ProductType { get; set; } = "";               // c_productType
    public string? LineName { get; set; } = "";                  // c_lineName
    //public string? SubLineName { get; set; } = "";               // c_lineName1
    public long? QuotationQuantity { get; set; }


    //Build
    public string? StageDept { get; set; } = "";
    public string? StageAccount { get; set; } = "";
    public string? WorkflowStatus { get; set; } = "";
    //public string? QuotationStatus { get; set; } = "";
    public string? PIC { get; set; } = "";
    public string? LeaderPIC { get; set; } = "";
    public string? HODPIC { get; set; } = "";
    public long? ProductId { get; set; }
    public Product? ProductFK { get; set; }
    public string? ProductCode { get; set; } = "";
    public long? ReinsuranceId { get; set; }
    public EnumData? ReinsuranceEnum { get; set; }
    public long? ResId { get; set; }
    public Res? ResFK { get; set; }
    public long? LineId { get; set; }
    public Line? LineFK { get; set; }
    public string? LineCode { get; set; } = "";
    public long? AttachmentId { get; set; }
    public Attachment? AttachmentFK { get; set; }
    public long? DocumentId { get; set; }
    public Document? DocumentFK { get; set; }
    public long? BranchId { get; set; } 
    public EnumData? BranchEnum { get; set; }
    public string? BranchCode { get; set; }
    public string? TurnAroundTimeAttributes { get; set; }
    public long? StatusId { get; set; }
    public bool? IsNotMakeOption { get; set; } = false;
    public string? OptionParentCode { get; set; }
    public bool? IsView { get; set; } = true;
    public EnumData? StatusEnum { get; set; }
    public InstanceWorkflow? InstanceWorkflowFK { get; set; }
    public TurnAroundAttributes? TurnAroundAttributes { get; set; }
    public List<Document> Documents { get; set; } = new List<Document>();
    public List<QuotationDetails> QuotationDetails { get; set; } = new List<QuotationDetails>();
}
