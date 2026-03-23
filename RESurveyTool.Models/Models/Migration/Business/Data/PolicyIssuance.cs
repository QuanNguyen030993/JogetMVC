using ERPCore.Models.Migration.Base;
using ERPCore.Models.Migration.Business.Data;
using System;
using System.ComponentModel.DataAnnotations;

public class PolicyIssuance : BaseModel 
{
    // =========================
    // Ý 1 — Header / Request
    // =========================
    public string? IssueReqNo { get; set; }              // c_piRefNum
    public string? IssueReqRefNo { get; set; }           // c_refNum
    public string? ParentRequestId { get; set; }         // c_parent_id
    public string? RequestType { get; set; }             // c_reqType
    public string? IssueRequestCategory { get; set; }    // c_piType

    public DateTime? RequestDate { get; set; }           // c_reqDate
    public DateTime? DueDate { get; set; }               // c_dueDate

    public string? QuotationCode { get; set; }           // c_jogetQuoNum
    public string? QuotationCodeAlt { get; set; }        // c_jogetQuoNum1
    public long? QuotationId { get; set; }             // c_quotationId 
    // =========================
    // Ý 2 — Policy / PolicyHolder / Product / Line
    // =========================
    public string? PolicyNo { get; set; }                // c_policyNo
    public string? PolicyHolderId { get; set; }          // c_policyHolder
    public string? PolicyType { get; set; }              // c_policyType

    public string? ProductCode { get; set; }             // c_productName  (join Product/Line master)
    public string? ProductType { get; set; }             // c_productType

    public string? PolicyLanguage { get; set; }          // c_languageOfPolicy
    public string? PolicyPackage { get; set; }           // c_packageOfPolicy

    public DateTime? PolicyPeriodStartDate { get; set; } // c_periodInsStart
    public DateTime? InsuredDate { get; set; }           // c_dateInsured

    public int? PolicyQuantity { get; set; }             // c_quantityOfPolicy

    // =========================
    // Ý 3 — PIC / Assignee / Routing
    // =========================
    // REMOVED BY DESIGN (do not include in PI one-row model)

    // =========================
    // Ý 4 — Status / Timeline / SLA
    // =========================
    public string? IssueStatusCode { get; set; }         // c_piStatus
    public string? IssueStatusLabel { get; set; }        // c_piStatusLabel
    public string? OverallStatusCode { get; set; }       // c_status

    // TODO: Timeline fields – move to workflow/history module
    // public DateTime? AcceptedDate { get; set; }        // c_acceptedDate
    // public DateTime? FoTsActionDate { get; set; }      // c_dateFOTS
    // public string? PiNoByPm { get; set; }              // c_piNumByPm
    // public string? PiNoByTs { get; set; }              // c_piNumByTs
    // public string? PiNoByFo { get; set; }              // c_piNumByFo

    // SLA: DROPPED (c_a1Days, c_a1DaysOver, c_a1_flag, c_quoNumFlag)

    // =========================
    // Ý 5 — Remarks / Notes / Follow-up
    // =========================
    public string? Subject { get; set; }                 // c_subject
    public string? Notes { get; set; }                   // c_notes
    public string? Reason { get; set; }                  // c_reason

    public string? Remarks { get; set; }                 // c_remarks
    public string? PrevRemarks { get; set; }             // c_preRemarks / c_preRemark (merged)
    public string? PmRemarks { get; set; }               // c_pmRemarks
    public string? TsRemarks { get; set; }               // c_TS_remarks

    public string? FollowUpNote { get; set; }            // c_followUp

    // NOTE: c_piRemarks is TODO to review (merge into Notes/Remarks)

    // =========================
    // Ý 6 — RI / Co-insurance / Premium
    // =========================
    public string? RiScheme { get; set; }                // c_RIScheme
    public string? RiClosings { get; set; }              // c_RIClosings
    public string? ReinsuranceType { get; set; }         // c_reinsurrance

    public string? CoInsuranceOutward { get; set; }      // c_coInsuranceOutward
    public string? CoInsuranceNote { get; set; }         // c_noteForCoInsuranceOutward
    public string? CoInsurerName { get; set; }           // c_NameCoInsurer

    public decimal? FinalPremium { get; set; }           // c_finalPremium
    public string? PremiumBreakdown { get; set; }        // c_premiumBreakdown

    // TODO: RI & Premium attachments – move to Attachment module
    // public string? RiSchemeAttachment { get; set; }    // c_RISchemeAtt
    // public string? RiClosingsAttachment { get; set; }  // c_RIClosingsAtt
    // public string? PremiumBreakdownAttachment { get; set; } // c_premiumBreakdownAtt
    // public string? EmailInformRiAttachment { get; set; }    // c_emailInformRIAtt

    // =========================
    // Ý 7 — KYC / Compliance / Declaration
    // =========================
    public string? IsKycChecked { get; set; }            // c_KYCChecked (Checked/NULL/Yes/No...)
    public string? DeclarationText { get; set; }         // c_declaration
    public string? URF { get; set; }                     // c_URF  (keep name)
    public string? IsBodApproved { get; set; }           // c_BODApproved
    public string? HoldCoverType { get; set; }           // c_holdCover

    // TODO: Compliance attachments – move to Attachment / Compliance module
    // public string? KycCheckedAttachment { get; set; }  // c_KYCCheckedAtt
    // public string? DeclarationAttachment { get; set; } // c_declarationAtt
    // public string? URFAttachment { get; set; }         // c_URFAtt
    // public string? BodApprovedAttachment { get; set; } // c_BODApprovedAtt
    // public string? HoldCoverAttachment { get; set; }   // c_holdCoverAtt

    // =========================
    // Ý 8 — Asset / Property / Machinery Lists
    // =========================
    public string? MachineryList { get; set; }           // c_listOfMachineries
    public string? PropertyTypeList { get; set; }        // c_typeOfPropertyList
    public string? FactoryOperationYears { get; set; }   // c_operationYearofFactories
    public string? ChassisEngineNumber { get; set; }     // c_chasisEngineNumber
    public string? NewReplacementValue { get; set; }     // c_newReplacementValue
    public string? SumInsuredBreakdown { get; set; }     // c_breakdownSI
    public string? IsGlobalCover { get; set; }           // c_global (Both/Yes/No)
    public string? PolicyLocation { get; set; }          // c_piLocation
    [MaxLength(4000)]
    public string? TurnAroundTimeAttributes { get; set; } = "";


    //Build
    public string? StageDept { get; set; } = "";
    public string? StageAccount { get; set; } = "";
    public string? WorkflowStatus { get; set; } = "";
    public string? PolicyIssuanceStatus { get; set; } = "";
    public string? PIC { get; set; } = "";

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

    // TODO: Asset list attachments – move to Attachment module
    // public string? MachineryListAttachment { get; set; }       // c_listOfMachineriesAtt
    // public string? PropertyTypeListAttachment { get; set; }    // c_typeOfPropertyListAtt
    // public string? FactoryOperationYearsAttachment { get; set; }// c_operationYearofFactoriesAtt
    // public string? ChassisEngineNumberAttachment { get; set; } // c_chasisEngineNumberAtt
    // public string? GlobalCoverAttachment { get; set; }         // c_globalAtt

    // =========================
    // Ý 9 — Email / Attachments
    // =========================
    // TODO: rename but COMMENT OUT ALL fields; move to Email/Attachment module
    // public string? EmailTitle { get; set; }             // c_titleEmail
    // public string? EmailTitle2 { get; set; }            // c_title2Email
    // public string? EmailLink { get; set; }              // c_linkEmail
    // public string? EmailListHtml { get; set; }          // c_listEmail
    // public string? EmailCc { get; set; }                // c_emailCC
    // public string? AdditionalEmailCc { get; set; }      // c_addiEmailCc
    // public string? PrevAdditionalEmailCc { get; set; }  // c_preAddiEmailCc
    // public string? EmailMktClient { get; set; }         // c_emailMKTClient
    // public string? EmailInformRi { get; set; }          // c_emailInformRI
    // public string? PiAttachment { get; set; }           // c_piAttach
    // public string? AdditionalAttachments { get; set; }  // c_addiAttachments
    // public string? MainAttachment { get; set; }         // c_attachment
    // public string? ResultAttachment { get; set; }       // c_resAtt
    // public string? ConfirmedQuotationFlag { get; set; } // c_confirmedQuotation
    // public string? ConfirmedQuotationAttachment { get; set; } // c_confirmedQuotationAtt
    // public string? ProposalForm { get; set; }           // c_proposalForm
    // public string? ProposalFormAttachment { get; set; } // c_proposalFormAtt
    // public string? HardSoftCopy { get; set; }           // c_hardSoftCopy
}