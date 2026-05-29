using ERPCore.Models.Migration.Base;
using ERPCore.Models.Migration.Business.Data;
using ERPCore.Models.Migration.Config;
using System;
using System.ComponentModel.DataAnnotations;

public class PolicyIssuance : BaseModel
{
    // =========================
    // Ý 1 — Header / Request
    // =========================

    public string? RequestType { get; set; }             // c_reqType

    public DateTime? RequestDate { get; set; }           // c_reqDate
    public DateTime? DueDate { get; set; }               // c_dueDate
    public DateTime? InsuredDate { get; set; }           // c_dateInsured

    public string? QuotationCode { get; set; }           // c_jogetQuoNum
    public string? QuotationParentCode { get; set; }        // c_jogetQuoNum1
    public long? QuotationId { get; set; }             // c_quotationId 
    // =========================
    // Ý 2 — Policy / PolicyHolder / Product / Line
    // =========================
    public string? PolicyNo { get; set; }                // c_policyNo
    public string? PolicyHolderId { get; set; }          // c_policyHolder
    //Quotation refer
    //public string? ProductCode { get; set; }             // c_productName  (join Product/Line master)
    //public string? ProductType { get; set; }             // c_productType


    //public DateTime? PolicyPeriodStartDate { get; set; } // c_periodInsStart

    public int? PolicyQuantity { get; set; }             // c_quantityOfPolicy

    // =========================
    // Ý 3 — PIC / Assignee / Routing
    // =========================
    // REMOVED BY DESIGN (do not include in PI one-row model)

    // =========================
    // Ý 4 — Status / Timeline / SLA
    // =========================
    //public string? IssueStatusCode { get; set; }         // c_piStatus
    //public string? IssueStatusLabel { get; set; }        // c_piStatusLabel
    //public string? OverallStatusCode { get; set; }       // c_status


    // SLA: DROPPED (c_a1Days, c_a1DaysOver, c_a1_flag, c_quoNumFlag)

    // =========================
    // Ý 5 — Remarks / Notes / Follow-up
    // =========================
    public string? Subject { get; set; }                 // c_subject
    public string? Notes { get; set; }                   // c_notes
    public string? Reason { get; set; }                  // c_reason


    public string? FollowUpNote { get; set; }            // c_followUp



    [MaxLength(4000)]
    public string? TurnAroundTimeAttributes { get; set; } = "";


    //Build
    public string? StageDept { get; set; } = "";
    public string? StageAccount { get; set; } = "";
    public string? WorkflowStatus { get; set; } = "";
    public string? PolicyIssuanceStatus { get; set; } = "";
    public string? PIC { get; set; } = "";
    public string? LeaderPIC { get; set; } = "";
    public string? HODPIC { get; set; } = "";
    public long? ProductId { get; set; }
    public long? LineId { get; set; }
    public long? ReinsuranceId { get; set; }
    [MaxLength(4000)]
    public long? LocationId { get; set; }
    public long? ResId { get; set; } // backup
    public string? PolicyIssuanceCode { get; set; }
    public long? ClientId { get; set; }
    public long? AttachmentId { get; set; }
    public Attachment? AttachmentFK { get; set; }
    public long? DocumentId { get; set; }
    public Document? DocumentFK { get; set; }
    public string? ClientName { get; set; }
    public long? BranchId { get; set; }
    public EnumData? BranchEnum { get; set; }

}