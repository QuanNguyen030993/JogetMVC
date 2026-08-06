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
        public static string OverViewScroll(string Prefix, string Id) => $"{Prefix}-overviewScroll_{Id}";


        // Utility method
        public static string GenerateId(string element, string dept, long quotationId) => $"{element}_{dept}_{quotationId}";

        // Core elements
        public static string RecordNo => $"recordNo";
        public static string LoginRoleLabel => $"loginRoleLabel";
        public static string FocusDeptPill => $"recordNo";
        public static string BtnClientConfirm => $"recordNo";

        // Quote list elements
        public static string QuoteList => $"recordNo";
        public static string QuoteCard => $"recordNo"; // Use data-id attribute

        // Detail elements
        public static string DetailStatus(string prefix,long quotationId) => $"{prefix}-detailStatus_{quotationId}";
        public static string StageDeptPill(string prefix, long quotationId) => $"{prefix}-stageDeptPill_{quotationId}";

        // Form elements by department
        public static string Form(string dept, long quotationId) => GenerateId("form", dept, quotationId);
        public static string OverViewScroll(string prefix, long quotationId) => $"{prefix}-overviewScroll_{quotationId}";

        // Button elements by department
        public static string BtnSave(string dept, long quotationId) => GenerateId("btnSave", dept, quotationId);
        public static string BtnSubmitBranch(string dept, long quotationId) => GenerateId("btnSubmitBranch", dept, quotationId);
        public static string BtnReturnBranch(string dept, long quotationId) => GenerateId("btnReturnBranch", dept, quotationId);
        public static string ExpandCollapsedBtn(string dept, long quotationId) => GenerateId("expandCollapsedBtn", dept, quotationId);

        // Section elements by department
        public static string Sec(string dept, long quotationId) => GenerateId("sec", dept, quotationId);
        public static string Upd(string dept, long quotationId) => GenerateId("upd", dept, quotationId);
        public static string Hint(string dept, long quotationId) => GenerateId("hint", dept, quotationId);
        public static string RemarkBox(string dept, long quotationId) => GenerateId("remarkBox", dept, quotationId);


        //Overview button

        public static string PanelHoverInFlow(string prefix, long quotationId) => $"{prefix}-panelHoverInFlow_{quotationId}";
        public static string BtnCollapseAllTab(string prefix, long quotationId) => $"{prefix}-btnCollapseAllTab_{quotationId}";
        public static string BtnToggleReferenceFields(string prefix, long quotationId) => $"{prefix}-btnToggleReferenceFields_{quotationId}";
        public static string BtnToggleComment(string prefix, long quotationId) => $"{prefix}-btnToggleComment_{quotationId}";
        public static string BtnPreview(string prefix, long quotationId) => $"{prefix}-btnPreview_{quotationId}";
        public static string BtnAttachmentLog(string prefix, long quotationId) => $"{prefix}-btnAttachmentLog_{quotationId}";
        public static string FlowPanel(string prefix, long quotationId) => $"{prefix}-flowPanel_{quotationId}";
        public static string FlowHistoryPanel(string prefix, long quotationId) => $"{prefix}-flowHistoryPanel_{quotationId}";
        public static string FlowSummary(string prefix, long quotationId) => $"{prefix}-flowSummary_{quotationId}";
        public static string FlowHistoryBody(string prefix, long quotationId) => $"{prefix}-flowHistoryBody_{quotationId}";
        //// Control elements
        //public static string BtnToggleLeftPane => $"{Prefix}-btnToggleLeftPane";
        //public static string RoleSelect => $"{Prefix}-roleSelect";

        //// Tree navigation
        //public static string TreeStack => $"{Prefix}-treeStack";
        //public static string TreeVLine => $"{Prefix}-treeVLine";

        // Right panel
        public static string RightCommentDock => "rightCommentDock";
        public static string RightCommentSub => "rightCommentSub";
        public static string RightCommentList => "rightCommentList";
        public static string HeaderWidgetsPanel => "headerWidgetsPanel";

        // PDF Viewer
        //public static string PdfViewer(long quoteId) => $"{Prefix}-pdfViewer_{quoteId}";

        // Overlay/Dialog
        public static string BranchOverlay => "branchOverlay";

        // Section-specific elements
        public static string AssigneeBox(string dept, long quotationId) => GenerateId("AssigneeBox", dept, quotationId);
        //attList_qt-body_TS__default_564_1786001889416
        public static string Id(string name, string prefix, long quotationId) => $"{prefix}-{name}_{quotationId}";
        public static string Cd(string name, string prefix) => $"{prefix}-{name}_";
        public static string AttachmentPreviewList(string name, string prefix, string dept, string type, long quotationId) => $"attList_{Cd(name, prefix)}_{dept}_{type}_{quotationId}";
        public static string AttachmentControl(string name, string prefix, string dept, string type, long quotationId) => $"fileUpload_{Cd(name, prefix)}_{dept}_{type}_{quotationId}";
    }

    public static class QTViewIdHelper
    {
        public const string Prefix = "qt";

        public static readonly string[] Departments =
        {
            "FO",
            "TS",
            "UW",
            "LMKT",
            "PM"
        };

        public static readonly string[] Sections =
        {
            "Header",
            "UpperBody",
            "Form",
            "LowerBody",
            "Footer"
        };

        #region Utilities
        //public static string GenerateId(string element, string department, long quotationId, string additionalSuffix = "")
        //{
        //    if (!Array.Exists(Departments, d => d == department))
        //    {
        //        throw new ArgumentException($"Invalid department: {department}. Valid departments: {string.Join(", ", Departments)}");
        //    }
        //    var suffix = string.IsNullOrEmpty(additionalSuffix) ? "" : $"_{additionalSuffix}";
        //    return $"{Prefix}-{element}_{department}_{quotationId}{suffix}";
        //}

        // Specific element ID generators
        // Core elements
        public static string RecordNo => $"{Prefix}-recordNo";
        public static string LoginRoleLabel => $"{Prefix}-loginRoleLabel";
        public static string FocusDeptPill => $"{Prefix}-focusDeptPill";
        public static string BtnClientConfirm => $"{Prefix}-btnClientConfirm";

        // Quote list elements

       


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

        public static string RoleSelect => $"{Prefix}-roleSelect";

        // Tree navigation
        public static string DeptTree(long quotationId) => $"{Prefix}-deptTree_{quotationId}";
        public static string TreeStack(long quotationId) => $"{Prefix}-treeStack_{quotationId}";
        public static string TreeVLine(long quotationId) => $"{Prefix}-treeVLine_{quotationId}";

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

        public static string BtnToggleResForm(string department, long quotationId) => $"{Prefix}-btnToggleResForm_{department}_{quotationId}";
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
        public static string GenerateId(
            string element,
            string department = null,
            long? quotationId = null,
            string suffix = null)
        {
            var parts = new List<string>
            {
                $"{Prefix}-{element}"
            };

            if (!string.IsNullOrWhiteSpace(department))
                parts.Add(department);

            if (quotationId.HasValue)
                parts.Add(quotationId.Value.ToString());

            if (!string.IsNullOrWhiteSpace(suffix))
                parts.Add(suffix);

            return string.Join("_", parts);
        }

        //public static bool ValidateDepartment(string department)
        //{
        //    return Departments.Contains(department);
        //}

        //public static bool ValidateSection(string section)
        //{
        //    return Sections.Contains(section);
        //}

        //#endregion

        //#region Core

        //public static string RecordNo => GenerateId("recordNo");

        //public static string LoginRoleLabel => GenerateId("loginRoleLabel");

        //public static string FocusDeptPill => GenerateId("focusDeptPill");

        //public static string BtnClientConfirm => GenerateId("btnClientConfirm");

        #endregion

        #region Quote List

        public static string QuoteList => GenerateId("quoteList");

        public static string QuoteCard(long quotationId)
            => GenerateId("quoteCard", quotationId: quotationId);

        #endregion

        #region Detail

      

        public static string OverViewScroll(long quotationId)
            => GenerateId("overviewScroll", quotationId: quotationId);

        // Backward compatibility overload
        public static string OverViewScroll(string department, long quotationId)
            => GenerateId("overviewScroll", department, quotationId);


        #endregion

        #region Forms

     

        public static string Section(string department, long quotationId)
            => GenerateId("sec", department, quotationId);

        

        public static string UpdateLabel(string department, long quotationId)
            => GenerateId("upd", department, quotationId);

      
        // Missing old helper methods
        public static string CommentWrap(string department, long quotationId)
            => GenerateId("commentWrap", department, quotationId);

        #endregion

        #region Buttons

     

        public static string BtnExpandCollapse(string department, long quotationId)
            => GenerateId("btnExpandCollapse", department, quotationId);

        // Backward compatibility
      

        #endregion

        // Missing filter buttons from original project
        public static string BtnFilterRequest(string department, long quotationId)
            => GenerateId("btnFilterRequest", department, quotationId);

        public static string BtnFilterBlocker(string department, long quotationId)
            => GenerateId("btnFilterBlocker", department, quotationId);

        public static string BtnFilterDiscussion(string department, long quotationId)
            => GenerateId("btnFilterDiscussion", department, quotationId);

        public static string BtnFilterInternal(string department, long quotationId)
            => GenerateId("btnFilterInternal", department, quotationId);

        #region Comment Filters

        public static string BtnFilterAll(string department, long quotationId)
            => GenerateId("btnFilterAll", department, quotationId);

        #endregion

        #region Role / Navigation

        //public static string RoleSelect
        //    => GenerateId("roleSelect");

        //public static string TreeStack
        //    => GenerateId("treeStack");

        //public static string TreeVLine
        //    => GenerateId("treeVLine");

        #endregion

        #region Right Panel



        #endregion

        #region PDF



        #endregion

        #region Overlay

        //public static string BranchOverlay => "branchOverlay";

        #endregion

        #region Pin / Comment

        public static string PinZone(string department, long quotationId)
            => GenerateId("pinZone", department, quotationId);

        public static string PinList(string department, long quotationId)
            => GenerateId("pinList", department, quotationId);

        public static string BtnExpandAllPins(string department, long quotationId)
            => GenerateId("btnExpandAllPins", department, quotationId);

        public static string BtnCollapseAllPins(string department, long quotationId)
            => GenerateId("btnCollapseAllPins", department, quotationId);

        public static string BtnUrgentPins(string department, long quotationId)
            => GenerateId("btnUrgentPins", department, quotationId);

        public static string CommentPanelControl(string department, long quotationId) 
            => GenerateId("commentPanelControl", department, quotationId);

        public static string FilterTypeSelect(string department, long quotationId)
            => GenerateId("filterTypeSelect", department,quotationId);

        public static string ActionBarDept(string department, long quotationId)
            => GenerateId("actionBarDept", department, quotationId);

        #endregion

        #region Additional IDs

        public static string BranchContainer(long quotationId)
            => GenerateId("branchContainer", quotationId: quotationId);

        public static string WorkflowTimeline(long quotationId)
            => GenerateId("workflowTimeline", quotationId: quotationId);

        public static string AuditLogPanel(long quotationId)
            => GenerateId("auditLogPanel", quotationId: quotationId);

        public static string CommonReferencePanel(long quotationId)
            => GenerateId("commonReferencePanel", quotationId: quotationId);

        public static string LoadingPanel(long quotationId)
            => GenerateId("loadingPanel", quotationId: quotationId);

        public static string DxPopup(long quotationId)
            => GenerateId("dxPopup", quotationId: quotationId);
        public static string Decision(string department, long quotationId)
            => $"decisionRadio_{department}_{quotationId}";

        #endregion

        #region All IDs

        //public static Dictionary<string, Dictionary<string, string>>
        //    GetAllIdsForQuotation(long quotationId)
        //{
        //    var result =
        //        new Dictionary<string, Dictionary<string, string>>();

        //    foreach (var dept in Departments)
        //    {
        //        result[dept] = new Dictionary<string, string>
        //        {
        //            ["form"] = Form(dept, quotationId),
        //            ["section"] = Section(dept, quotationId),
        //            ["btnSave"] = BtnSave(dept, quotationId),
        //            ["btnSubmitBranch"] = BtnSubmitBranch(dept, quotationId),
        //            ["btnReturnBranch"] = BtnReturnBranch(dept, quotationId),
        //            ["btnExpandCollapse"] = BtnExpandCollapse(dept, quotationId),
        //            ["updateLabel"] = UpdateLabel(dept, quotationId),
        //            ["hint"] = Hint(dept, quotationId),
        //            ["remarkBox"] = RemarkBox(dept, quotationId),
        //            ["assigneeBox"] = AssigneeBox(dept, quotationId),
        //            ["stickPanel"] = StickPanel(dept, quotationId)
        //        };
        //    }

        //    return result;
        //}

       
        #endregion
    }

    /// <summary>
    /// Policy Issuance View ID Helper
    /// </summary>
    public static class PIViewIdHelper
    {
        public const string Prefix = "pi";

        public static readonly string[] Departments =
        {
            "FO",
            "TS",
            "PM"
        };

        public static readonly string[] Sections =
        {
            "Header",
            "UpperBody",
            "Form",
            "LowerBody",
            "Footer"
        };

        #region Utilities
        
        public static string GenerateId(
            string element,
            string department = null,
            long? quotationId = null,
            string suffix = null)
        {
            var parts = new List<string>
            {
                $"{Prefix}-{element}"
            };

            if (!string.IsNullOrWhiteSpace(department))
                parts.Add(department);

            if (quotationId.HasValue)
                parts.Add(quotationId.Value.ToString());

            if (!string.IsNullOrWhiteSpace(suffix))
                parts.Add(suffix);

            return string.Join("_", parts);
        }

        public static bool ValidateDepartment(string department)
        {
            return Departments.Contains(department);
        }

        public static bool ValidateSection(string section)
        {
            return Sections.Contains(section);
        }

        #endregion

        #region Core

        public static string RecordNo => GenerateId("recordNo");

        public static string LoginRoleLabel => GenerateId("loginRoleLabel");

        public static string FocusDeptPill => GenerateId("focusDeptPill");

        public static string BtnClientConfirm => GenerateId("btnClientConfirm");

        #endregion

        #region Quote List

        public static string QuoteList => GenerateId("quoteList");

        public static string QuoteCard(long quotationId)
            => GenerateId("quoteCard", quotationId: quotationId);

        #endregion

        #region Detail

        public static string DetailStatus(long quotationId) => $"{Prefix}-detailStatus_{quotationId}";

        public static string StageDeptPill(long quotationId)
            => GenerateId("stageDeptPill", quotationId: quotationId);

        public static string OverViewScroll(long quotationId)
            => GenerateId("overviewScroll", quotationId: quotationId);

        // Backward compatibility overload
        public static string OverViewScroll(string department, long quotationId)
            => GenerateId("overviewScroll", department, quotationId);


        #endregion

        #region Forms

        public static string Form(string department, long quotationId)
            => GenerateId("form", department, quotationId);

        public static string Section(string department, long quotationId)
            => GenerateId("sec", department, quotationId);

        public static string Sec(string department, long quotationId)
            => Section(department, quotationId);

        public static string UpdateLabel(string department, long quotationId)
            => GenerateId("upd", department, quotationId);

        public static string Upd(string department, long quotationId)
            => UpdateLabel(department, quotationId);

        public static string Hint(string department, long quotationId)
            => GenerateId("hint", department, quotationId);

        public static string RemarkBox(string department, long quotationId)
            => GenerateId("remarkBox", department, quotationId);

        public static string AssigneeBox(string department, long quotationId) => $"{Prefix}-AssigneeBox_{department}_{quotationId}";

        public static string StickPanel(string department, long quotationId)
            => GenerateId("stickPanel", department, quotationId);

        // Missing old helper methods
        public static string CommentWrap(string department, long quotationId)
             => GenerateId("commentWrap", department, quotationId);

        #endregion

        #region Buttons

        public static string BtnSave(string department, long quotationId)
            => GenerateId("btnSave", department, quotationId);

        public static string BtnSubmitBranch(string department, long quotationId)
            => GenerateId("btnSubmitBranch", department, quotationId);

        public static string BtnReturnBranch(string department, long quotationId)
            => GenerateId("btnReturnBranch", department, quotationId);

        public static string BtnExpandCollapse(string department, long quotationId)
            => GenerateId("btnExpandCollapse", department, quotationId);

        // Backward compatibility
        public static string ExpandCollapsedBtn(string department, long quotationId)
            => BtnExpandCollapse(department, quotationId);

        public static string BtnToggleLeftPane
            => GenerateId("btnToggleLeftPane");

        public static string BtnCollapseAllTab
            => GenerateId("btnCollapseAllTab");

        public static string BtnToggleComment
            => GenerateId("btnToggleComment");

        public static string BtnToggleReferenceFields
            => GenerateId("btnToggleReferenceFields");

        public static string BtnPreview
            => GenerateId("btnPreview");

        public static string BtnToggleResForm(string department, long quotationId) => $"{Prefix}-btnToggleResForm_{department}_{quotationId}";

        #endregion
        public static string BtnFilterRequest(string department, long quotationId)
                   => GenerateId("btnFilterRequest", department, quotationId);

        public static string BtnFilterBlocker(string department, long quotationId)
            => GenerateId("btnFilterBlocker", department, quotationId);

        public static string BtnFilterDiscussion(string department, long quotationId)
            => GenerateId("btnFilterDiscussion", department, quotationId);

        public static string BtnFilterInternal(string department, long quotationId)
            => GenerateId("btnFilterInternal", department, quotationId);

        #region Comment Filters

        public static string BtnFilterAll(string department, long quotationId)
            => GenerateId("btnFilterAll", department, quotationId);

        #endregion

        #region Role / Navigation

        public static string RoleSelect
            => GenerateId("roleSelect");

        // Tree navigation
        public static string DeptTree(long quotationId) => $"{Prefix}-deptTree_{quotationId}";
        public static string TreeStack(long quotationId) => $"{Prefix}-treeStack_{quotationId}";
        public static string TreeVLine(long quotationId) => $"{Prefix}-treeVLine_{quotationId}";

        #endregion

        #region Right Panel

        public static string RightCommentDock => "rightCommentDock";

        public static string RightCommentSub => "rightCommentSub";

        public static string RightCommentList => "rightCommentList";

        public static string HeaderWidgetsPanel => "headerWidgetsPanel";

        #endregion

        #region PDF

        public static string PdfViewer(long quotationId)
            => GenerateId("pdfViewer", quotationId: quotationId);

        #endregion

        #region Overlay

        public static string BranchOverlay => "branchOverlay";

        #endregion

        #region Pin / Comment

        public static string PinZone(string department, long quotationId)
            => GenerateId("pinZone", department, quotationId);

        public static string PinList(string department, long quotationId)
            => GenerateId("pinList", department, quotationId);

        public static string BtnExpandAllPins(string department, long quotationId)
            => GenerateId("btnExpandAllPins", department, quotationId);

        public static string BtnCollapseAllPins(string department, long quotationId)
            => GenerateId("btnCollapseAllPins", department, quotationId);

        public static string BtnUrgentPins(string department, long quotationId)
            => GenerateId("btnUrgentPins", department, quotationId);

        public static string CommentPanelControl(string department, long quotationId)
            => GenerateId("commentPanelControl", department, quotationId);

        public static string FilterTypeSelect(string department, long quotationId)
            => GenerateId("filterTypeSelect", department, quotationId);

        public static string ActionBarDept(string department, long quotationId)
            => GenerateId("actionBarDept", department, quotationId);

        #endregion

        #region Additional IDs

        public static string BranchContainer(long quotationId)
            => GenerateId("branchContainer", quotationId: quotationId);

        public static string WorkflowTimeline(long quotationId)
            => GenerateId("workflowTimeline", quotationId: quotationId);

        public static string AuditLogPanel(long quotationId)
            => GenerateId("auditLogPanel", quotationId: quotationId);

        public static string CommonReferencePanel(long quotationId)
            => GenerateId("commonReferencePanel", quotationId: quotationId);

        public static string LoadingPanel(long quotationId)
            => GenerateId("loadingPanel", quotationId: quotationId);

        public static string DxPopup(long quotationId)
            => GenerateId("dxPopup", quotationId: quotationId);

        #endregion

        #region All IDs

        public static Dictionary<string, Dictionary<string, string>>
            GetAllIdsForQuotation(long quotationId)
        {
            var result =
                new Dictionary<string, Dictionary<string, string>>();

            foreach (var dept in Departments)
            {
                result[dept] = new Dictionary<string, string>
                {
                    ["form"] = Form(dept, quotationId),
                    ["section"] = Section(dept, quotationId),
                    ["btnSave"] = BtnSave(dept, quotationId),
                    ["btnSubmitBranch"] = BtnSubmitBranch(dept, quotationId),
                    ["btnReturnBranch"] = BtnReturnBranch(dept, quotationId),
                    ["btnExpandCollapse"] = BtnExpandCollapse(dept, quotationId),
                    ["updateLabel"] = UpdateLabel(dept, quotationId),
                    ["hint"] = Hint(dept, quotationId),
                    ["remarkBox"] = RemarkBox(dept, quotationId),
                    ["assigneeBox"] = AssigneeBox(dept, quotationId),
                    ["stickPanel"] = StickPanel(dept, quotationId)
                };
            }

            return result;
        }
        public static string Decision(string department, long quotationId)
            => $"decisionRadio_{department}_{quotationId}";

        #endregion
    }
}