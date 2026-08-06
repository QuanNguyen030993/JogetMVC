// QuotationIdManager.js - Centralized ID management for Quotation Form elements
// This file provides a centralized way to generate and manage all div IDs used in the Quotation Form
// across different sections (header, upperbody, form, lowerbody, footer) and departments (FO, TS, UW, LMKT, PM)

window.IdManager = {
    cd: function (name, prefix) { return `${prefix}-${name}`; },
    attachmentKey: function (name, prefix, dept, type, quotationId) {
        return `${this.cd(name, prefix)}_${dept}__${type}_${quotationId}`;
    },
    attachmentPreviewBase: function (controlId) { return `attList_${controlId}`; },
    attachmentControlBase: function (controlId) { return `fileUpload_${controlId}`; },
    attachmentSectionKey: function (sectionId, type, recordId) {
        return `${sectionId}_${type}_${recordId}`;
    },
    attachmentPreviewList: function (name, prefix, dept, type, quotationId) {
        return this.attachmentPreviewBase(this.attachmentKey(name, prefix, dept, type, quotationId));
    },
    attachmentControl: function (name, prefix, dept, type, quotationId) {
        return this.attachmentControlBase(this.attachmentKey(name, prefix, dept, type, quotationId));
    },
    attachmentPreviewHost: function (controlId, renderTime) {
        return `${this.attachmentPreviewBase(controlId)}_${renderTime}`;
    },
    attachmentControlHost: function (controlId, renderTime) {
        return this.fileUploaderId(controlId, renderTime);
    },
    fileUploaderId: function (context, instanceId) { return `fileUpload_${context}_${instanceId}`; },
    attachmentHostIds: function (controlId, renderTime) {
        return {
            preview: this.attachmentPreviewHost(controlId, renderTime),
            uploader: this.attachmentControlHost(controlId, renderTime)
        };
    },
    attachmentPreviewItemsSelector: function (name, prefix, dept, type, quotationId) {
        return `[id^='${this.attachmentPreviewList(name, prefix, dept, type, quotationId)}_'] .att-item`;
    },
    attachmentPreviewItemsByControlIdSelector: function (controlId) {
        return `[id^='${this.attachmentPreviewBase(controlId)}_'] .att-item`;
    },
    attachmentControlHostsSelector: function () {
        return `[id^='fileUpload_']`;
    }
};

// Example usage:
// const formId = QuotationIdManager.form('FO', 123); // "qt-form_FO_123"
// const allIds = QuotationIdManager.getAllIdsForQuotation(123); // Object with all IDs for quotation 123
