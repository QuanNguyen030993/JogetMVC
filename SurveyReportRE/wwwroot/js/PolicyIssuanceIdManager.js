// QuotationIdManager.js - Centralized ID management for Quotation Form elements
// This file provides a centralized way to generate and manage all div IDs used in the Quotation Form
// across different sections (header, upperbody, form, lowerbody, footer) and departments (FO, TS, UW, LMKT, PM)

window.PolicyIssuanceIdManager = {
    // Configuration
    prefix: 'pi',
    departments: ['FO', 'TS', 'PM'],
    sections: ['Header', 'UpperBody', 'Form', 'LowerBody', 'Footer'],
    // Main ID generation function
    generateId: function (element, department, quotationId, additionalSuffix = '') {
        if (!this.departments.includes(department)) {
            console.warn(`Invalid department: ${department}. Valid departments: ${this.departments.join(', ')}`);
            return '';
        }
        const suffix = additionalSuffix ? `_${additionalSuffix}` : '';
        return `${this.prefix}-${element}_${department}_${quotationId}${suffix}`;
    },

    // Specific element ID generators
    // Core elements
    recordNo: function (quotationId) { return `${this.prefix}-recordNo`; },
    loginRoleLabel: function () { return `${this.prefix}-loginRoleLabel`; },
    focusDeptPill: function () { return `${this.prefix}-focusDeptPill`; },
    btnClientConfirm: function () { return `${this.prefix}-btnClientConfirm`; },

    // Quote list elements
    quoteList: function () { return `${this.prefix}-quoteList`; },
    quoteCard: function (quotationId) { return `${this.prefix}-quoteCard`; }, // Use data-id attribute for specific cards

    // Detail elements
    detailStatus: function (quotationId) { return `${this.prefix}-detailStatus_${quotationId}`; },
    //btnToggleReferenceFieldsMini: function (quotationId) { return `${this.prefix}-btnToggleReferenceFieldsMini_${quotationId}`; },
    //btnToggleCommentMini: function (quotationId) { return `${this.prefix}-btnToggleCommentMini_${quotationId}`; },
    btnCollapseAllTab: function (quotationId) { return `${this.prefix}-btnCollapseAllTab_${quotationId}`; },
    btnToggleComment: function (quotationId) { return `${this.prefix}-btnToggleComment_${quotationId}`; },
    btnToggleReferenceFields: function (quotationId) { return `${this.prefix}-btnToggleReferenceFields_${quotationId}`; },
    btnPreview: function (quotationId) { return `${this.prefix}-btnPreview_${quotationId}`; },
    btnAttachmentLog: function (quotationId) { return `${this.prefix}-btnAttachmentLog_${quotationId}`; },
    panelHoverInFlow: function (quotationId) { return `${this.prefix}-panelHoverInFlow_${quotationId}`; },
    stageDeptPill: function (quotationId) { return `${this.prefix}-stageDeptPill_${quotationId}`; },
    flowPanel: function (quotationId) { return `${this.prefix}-flowPanel_${quotationId}`; },
    flowHistoryPanel: function (quotationId) { return `${this.prefix}-flowHistoryPanel_${quotationId}`; },
    // Form elements by department
    form: function (department, quotationId) { return this.generateId('form', department, quotationId); },
    overviewScroll: function (quotationId) { return `${this.prefix}-overviewScroll_${quotationId}`; },

    // Button elements by department
    btnSave: function (department, quotationId) { return this.generateId('btnSave', department, quotationId); },
    btnSubmitBranch: function (department, quotationId) { return this.generateId('btnSubmitBranch', department, quotationId); },
    btnReturnBranch: function (department, quotationId) { return this.generateId('btnReturnBranch', department, quotationId); },
    expandCollapsedBtn: function (department, quotationId) { return this.generateId('expandCollapsedBtn', department, quotationId); },
    actionBarDept: function (department, quotationId) { return this.generateId('actionBarDept', department, quotationId); },

    // Section elements by department
    sec: function (department, quotationId) { return this.generateId('sec', department, quotationId); },
    upd: function (department, quotationId) { return this.generateId('upd', department, quotationId); },
    hint: function (department, quotationId) { return this.generateId('hint', department, quotationId); },
    remarkBox: function (department, quotationId) { return this.generateId('remarkBox', department, quotationId); },

    // Control elements
    btnToggleLeftPane: function () { return `${this.prefix}-btnToggleLeftPane`; },
    btnCollapseAllTab: function () { return `${this.prefix}-btnCollapseAllTab`; },
    btnToggleReferenceFields: function () { return `${this.prefix}-btnToggleReferenceFields`; },
    roleSelect: function () { return `${this.prefix}-roleSelect`; },

    // Tree navigation
    treeStack: function (quotationId) { return `${this.prefix}-treeStack_${quotationId}`; },
    treeVLine: function (quotationId) { return `${this.prefix}-treeVLine_${quotationId}`; },

    // Right panel
    rightCommentDock: function () { return 'rightCommentDock'; },
    rightCommentSub: function () { return 'rightCommentSub'; },
    rightCommentList: function () { return 'rightCommentList'; },
    headerWidgetsPanel: function () { return 'headerWidgetsPanel'; },

    // PDF Viewer
    pdfViewer: function (quoteId) { return `${this.prefix}-pdfViewer_${quoteId}`; },

    // Overlay/Dialog
    branchOverlay: function () { return 'branchOverlay'; },

    // Section-specific elements (from QuotationDetail partials)
    assigneeBox: function (department, quotationId) {
        return `${this.prefix}-AssigneeBox_${department}_${quotationId}`;
    },
    btnToggleResForm: function () { return 'btnToggleResForm'; },
    stickPanel: function (department, quotationId) { return this.generateId('stickPanel', department, quotationId); },

    // Utility functions
    getAllIdsForQuotation: function (quotationId) {
        const ids = {};
        this.departments.forEach(dept => {
            ids[dept] = {
                form: this.form(dept, quotationId),
                btnSave: this.btnSave(dept, quotationId),
                btnSubmitBranch: this.btnSubmitBranch(dept, quotationId),
                btnReturnBranch: this.btnReturnBranch(dept, quotationId),
                expandCollapsedBtn: this.expandCollapsedBtn(dept, quotationId),
                sec: this.sec(dept, quotationId),
                upd: this.upd(dept, quotationId),
                hint: this.hint(dept, quotationId),
                remarkBox: this.remarkBox(dept, quotationId),
                assigneeBox: this.assigneeBox(dept, quotationId),
                stickPanel: this.stickPanel(dept, quotationId)
            };
        });
        return ids;
    },

    // Validation
    validateDepartment: function (department) {
        return this.departments.includes(department);
    },

    validateSection: function (section) {
        return this.sections.includes(section);
    },

    // Extension point for adding new elements
    addCustomElement: function (elementName, generatorFunction) {
        if (typeof generatorFunction === 'function') {
            this[elementName] = generatorFunction;
        } else {
            console.error('Generator must be a function');
        }
    }
};

// Example usage:
// const formId = QuotationIdManager.form('FO', 123); // "qt-form_FO_123"
// const allIds = QuotationIdManager.getAllIdsForQuotation(123); // Object with all IDs for quotation 123