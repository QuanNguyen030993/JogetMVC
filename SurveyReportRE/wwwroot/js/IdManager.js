// QuotationIdManager.js - Centralized ID management for Quotation Form elements
// This file provides a centralized way to generate and manage all div IDs used in the Quotation Form
// across different sections (header, upperbody, form, lowerbody, footer) and departments (FO, TS, UW, LMKT, PM)

window.IdManager = {
    cd: function (name, prefix)  { return `${prefix}-${name}`; }, 
    attachmentPreviewList: function (name, prefix, dept, type, quotationId) { return `attList_${this.cd(name, prefix)}_${dept}__${type}_${quotationId}`;; },
    attachmentControl: function (name, prefix, dept, type, quotationId) { return `fileUpload_${this.cd(name, prefix)}_${dept}__${type}_${quotationId}`; }, 
};

// Example usage:
// const formId = QuotationIdManager.form('FO', 123); // "qt-form_FO_123"
// const allIds = QuotationIdManager.getAllIdsForQuotation(123); // Object with all IDs for quotation 123
