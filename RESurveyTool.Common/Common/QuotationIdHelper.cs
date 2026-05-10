using System;
using System.Collections.Generic;

namespace JogetMVC.Model
{
    /// <summary>
    /// Centralized ID management for Quotation Form elements
    /// This class provides a centralized way to generate and manage all div IDs used in the Quotation Form
    /// across different sections (header, upperbody, form, lowerbody, footer) and departments (FO, TS, UW, LMKT, PM)
    /// </summary>
    public static class QuotationIdHelper
    {
        // Configuration
        public const string Prefix = "qt";
        public static readonly string[] Departments = { "FO", "TS", "UW", "LMKT", "PM" };
        public static readonly string[] Sections = { "Header", "UpperBody", "Form", "LowerBody", "Footer" };

        /// <summary>
        /// Main ID generation function
        /// </summary>
        public static string GenerateId(string element, string department, long quotationId, string additionalSuffix = "")
        {
            if (!Array.Exists(Departments, d => d == department))
            {
                throw new ArgumentException($"Invalid department: {department}. Valid departments: {string.Join(", ", Departments)}");
            }
            var suffix = string.IsNullOrEmpty(additionalSuffix) ? "" : $"_{additionalSuffix}";
            return $"{Prefix}-{element}_{department}_{quotationId}{suffix}";
        }

        // Specific element ID generators
        // Core elements
        public static string RecordNo => $"{Prefix}-recordNo";
        public static string LoginRoleLabel => $"{Prefix}-loginRoleLabel";
        public static string FocusDeptPill => $"{Prefix}-focusDeptPill";
        public static string BtnClientConfirm => $"{Prefix}-btnClientConfirm";

        // Quote list elements
        public static string QuoteList => $"{Prefix}-quoteList";
        public static string QuoteCard => $"{Prefix}-quoteCard"; // Use data-id attribute for specific cards

        // Detail elements
        public static string DetailStatus => $"{Prefix}-detailStatus";
        public static string StageDeptPill => $"{Prefix}-stageDeptPill";

        // Form elements by department
        public static string Form(string department, long quotationId) => GenerateId("form", department, quotationId);

        // Button elements by department
        public static string BtnSave(string department, long quotationId) => GenerateId("btnSave", department, quotationId);
        public static string BtnSubmitBranch(string department, long quotationId) => GenerateId("btnSubmitBranch", department, quotationId);
        public static string BtnReturnBranch(string department, long quotationId) => GenerateId("btnReturnBranch", department, quotationId);
        public static string ExpandCollapsedBtn(string department, long quotationId) => GenerateId("expandCollapsedBtn", department, quotationId);

        // Section elements by department
        public static string Sec(string department, long quotationId) => GenerateId("sec", department, quotationId);
        public static string Upd(string department, long quotationId) => GenerateId("upd", department, quotationId);
        public static string Hint(string department, long quotationId) => GenerateId("hint", department, quotationId);
        public static string RemarkBox(string department, long quotationId) => GenerateId("remarkBox", department, quotationId);

        // Control elements
        public static string BtnToggleLeftPane => $"{Prefix}-btnToggleLeftPane";
        public static string BtnCollapseAllTab => $"{Prefix}-btnCollapseAllTab";
        public static string BtnToggleComment => $"{Prefix}-btnToggleComment";
        public static string BtnToggleReferenceFields => $"{Prefix}-btnToggleReferenceFields";
        public static string BtnPreview => $"{Prefix}-btnPreview";
        public static string RoleSelect => $"{Prefix}-roleSelect";

        // Tree navigation
        public static string TreeStack => $"{Prefix}-treeStack";
        public static string TreeVLine => $"{Prefix}-treeVLine";

        // Right panel
        public static string RightCommentDock => "rightCommentDock";
        public static string RightCommentSub => "rightCommentSub";
        public static string RightCommentList => "rightCommentList";
        public static string HeaderWidgetsPanel => "headerWidgetsPanel";

        // PDF Viewer
        public static string PdfViewer(long quoteId) => $"{Prefix}-pdfViewer_{quoteId}";

        // Overlay/Dialog
        public static string BranchOverlay => "branchOverlay";

        // Section-specific elements (from QuotationDetail partials)
        public static string AssigneeBox(string department, long quotationId) => $"{Prefix}-{department.ToLower().Replace("lmkt", "lmkt")}AssigneeBox";
        public static string BtnToggleResForm => "btnToggleResForm";
        public static string StickPanel(string department, long quotationId) => GenerateId("stickPanel", department, quotationId);

        /// <summary>
        /// Get all IDs for a specific quotation
        /// </summary>
        public static Dictionary<string, Dictionary<string, string>> GetAllIdsForQuotation(long quotationId)
        {
            var ids = new Dictionary<string, Dictionary<string, string>>();
            foreach (var dept in Departments)
            {
                ids[dept] = new Dictionary<string, string>
                {
                    ["form"] = Form(dept, quotationId),
                    ["btnSave"] = BtnSave(dept, quotationId),
                    ["btnSubmitBranch"] = BtnSubmitBranch(dept, quotationId),
                    ["btnReturnBranch"] = BtnReturnBranch(dept, quotationId),
                    ["expandCollapsedBtn"] = ExpandCollapsedBtn(dept, quotationId),
                    ["sec"] = Sec(dept, quotationId),
                    ["upd"] = Upd(dept, quotationId),
                    ["hint"] = Hint(dept, quotationId),
                    ["remarkBox"] = RemarkBox(dept, quotationId),
                    ["assigneeBox"] = AssigneeBox(dept, quotationId),
                    ["stickPanel"] = StickPanel(dept, quotationId)
                };
            }
            return ids;
        }

        // Validation
        public static bool ValidateDepartment(string department)
        {
            return Array.Exists(Departments, d => d == department);
        }

        public static bool ValidateSection(string section)
        {
            return Array.Exists(Sections, s => s == section);
        }
    }
}