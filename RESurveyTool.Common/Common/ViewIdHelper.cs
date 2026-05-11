using System;
using System.Collections.Generic;

namespace JogetMVC.Model
{
    /// <summary>
    /// Centralized ID management for Quotation Form elements
    /// This class provides a centralized way to generate and manage all div IDs used in the Quotation Form
    /// across different sections (header, upperbody, form, lowerbody, footer) and departments (FO, TS, UW, LMKT, PM)
    /// </summary>
    /// 

    //Cấu trúc div id chính:
    //qt-recordNo: Hiển thị số hiệu quotation.
    //qt-loginRoleLabel: Role đăng nhập hiện tại.
    //qt-focusDeptPill: Phòng ban hiện tại.
    //qt-btnClientConfirm: Nút submit sang Policy Issuance.
    //qt-quoteList: Container chứa danh sách quote cards.
    //qt-quoteCard[data-id]: Các card quotation riêng lẻ (với data-id động).
    //qt-recordNo: Hiển thị mã quotation trong chi tiết.
    //qt-detailStatus: Trạng thái hiện tại.
    //qt-stageDeptPill: Phòng ban xử lý + người phụ trách.
    //qt-focusDeptPill: Phòng ban được focus.
    //qt-form{dept}: Form dxForm chính cho mỗi phòng ban (ví dụ: qt-formFO, qt-formTS, qt-formUW, qt-formLMKT, qt-formPM).
    //qt-btnSave_{dept}: Nút save cho phòng ban.
    //qt-btnSubmitBranch_{dept}: Nút submit workflow.
    //qt-btnReturnBranch_{dept}: Nút return/back.
    //qt-expandCollapsedBtn_{dept}: Nút expand/collapse.
    //qt-sec{dept}: Section container cho mỗi phòng ban.
    //qt-upd{dept}: Thời gian cập nhật cuối.
    //qt-hint{dept}: Biểu thị edit/lock status.
    //qt-remarkBox_{dept}: TinyMCE editor để nhập remarks.
    //qt-btnToggleLeftPane: Toggle left panel.
    //qt-btnCollapseAllTab: Collapse tất cả sections.
    //qt-btnToggleComment: Toggle audit logs.
    //qt-btnToggleReferenceFields: Toggle common fields.
    //qt-btnPreview: Xem trước PDF.
    //qt-roleSelect: Selector role phòng ban.
    //qt-treeStack: Cây phòng ban.
    //qt-treeVLine: Đường thẳng đứng.
    //rightCommentDock: Main panel bên phải.
    //rightCommentSub: Header text.
    //rightCommentList: Nội dung danh sách.
    //headerWidgetsPanel: Panel buttons.
    //qt-pdfViewer_{quoteId}: IFrame preview PDF.
    //branchOverlay: Popup workflow routing.
    public static class ViewIdHelper
    {
        public static string OverViewScroll(string Prefix,string Id) => $"{Prefix}-overviewScroll_{Id}";
    }

        public static class QTViewIdHelper
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
        public static string AssigneeBox(string department, long quotationId) => $"{Prefix}-AssigneeBox_{department}_{quotationId}";
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

    public static class PIViewIdHelper
    {
        // Configuration
        public const string Prefix = "pi";
        public static readonly string[] Departments = { "FO", "TS", "PM" };
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
        public static string AssigneeBox(string department, long quotationId) => $"{Prefix}-AssigneeBox_{department}_{quotationId}";
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