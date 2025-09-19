//var container = $(`<div style="width: 100%; height: 100%; float: left;">`).appendTo(itemElement);
//var imageUI = new ImageUI({
//    container: container,
//    recordGuid: _ppGuid,
//    imageFolder: "ProductPlan",
//    tabHeight: itemElement["0"].offsetParent.clientHeight - 11,
//    tabWidth: itemElement["0"].offsetParent.clientWidth - 11
//}, function (options) {
//    //refresh the main grid when image updated
//    if (options) {
//        panelcontrol();
//    }
//});
//imageUI.Load();

var ImageGridOption = class ImageGridOption extends MGridOption {
    constructor(modelName, gridType, config) {
        super(modelName, gridType, config);
        this.surveyId = config.filterRefId;
        this.outline = config.outline
    };
    onContentReady(e) {
        e.component.option("editing.allowAdding", false);
        e.component.updateDimensions();
        e.component.repaintRows();
    }

    onRowPrepared(e) {
        if (e.rowType === "data")
            e.rowElement.css({ height: 200 });
    }

    onEditorPreparing(e) {
        var that = this;
        super.onEditorPreparing(e);
        if (e.dataType == "image") {
            const fileUploaderInstance = e.editorElement.dxFileUploader({
                multiple: true,
                accept: "image/*",
                //selectButtonText: `Choose image`,
                labelText: "",
                uploadMode: "instantly",
                uploadUrl: `/api/SitePictures/AsyncUploadPicture?folder=SitePictures&surveyId=${that.surveyId}&outlineId=${that.outline.id}`,
                showFileList: false,
                onUploaded: function (data) {
                    e.component.refresh();
                }
            }).dxFileUploader("instance");


            $("#uploadPanel").on("click", function () {
                const fileInput = fileUploaderInstance._$fileInput;
                fileInput.click();
            });


        }
    }

    onCustomizeColumns(columns) {
        var that = this;

        super.onCustomizeColumns(columns);
        $.each(columns, function (i, col) {
            if (col.dataField == "attachmentId") {
                col.cellTemplate = function (container, options) {
                    if (options.data.id != null || options.data.id != undefined)
                        if (options.data.attachmentId != null || options.data.attachmentId != undefined)
                            $.ajax({
                                url: `/api/Attachment/GetSitePictureAttachment/${options.data.attachmentId}`, // Replace with your actual API
                                method: 'GET',
                                success: function (data) {
                                    if (data != null) {
                                        data.outline = that.outline;
                                        var uint8Array = new Uint8Array(data.fileData);
                                        var blob = new Blob([uint8Array], { type: data.type });
                                        var url = URL.createObjectURL(blob);
                                        addImagePreviewElement(url, data, container);
                                    }
                                }
                            });
                }
            }
            if (col.dataField == "attachmentNote") {
                col.alignment = "center";
            }
        });
    }


};
var AccompaniedByGridOption = class AccompaniedByGridOption extends MGridOption {
    constructor(modelName, gridType, gridConfig) {
        super(modelName, gridType, gridConfig);
    };
    onCellPrepared(e) {
        if (e.rowType === "group") {
            $(e.cellElement).on("click", function (event) {
                if (!$(event.target).closest("button").length) {
                    event.stopPropagation();
                }
            });
        }
        if (e.rowType === "data" && e.column.command && e.column.alignment != "center") {
            addMoveButtonsToCell(e);
        }
    }
    onCustomizeColumns(columns) {
        var that = this;
        const gridInstance = $(`#${that.mGridDetailOption.container}`).dxDataGrid().dxDataGrid("instance");
        super.onCustomizeColumns(columns);
        participantListColumnsProcess(columns, gridInstance, that);
    }

    //onEditorPreparing(e) {
    //    var that = this;
    //    const gridInstance = e.component;
    //    const rowIndex = e.row?.rowIndex;
    //    if (e.dataField === "personName") {
    //        const rowData = gridInstance.cellValue(rowIndex);
    //        if (e.row)
    //            if (e.row.data) {
    //                if (e.row.data.sideTypeId === 69) { // Employee
    //                    makeDropDownBoxOptions(e, "employee", "Select an employee", "fullName", "fullName");
    //                    e.editorOptions.contentTemplate = function (e) {
    //                        const $dataGrid = $("<div>").dxDataGrid({
    //                            dataSource: e.component.option("dataSource"),
    //                            columns: [
    //                                { dataField: "fullName", caption: "Survey Name" },
    //                                { dataField: "department", caption: "Department" }
    //                            ],
    //                            filterRow: { visible: true },
    //                            selectionMode: 'all',
    //                            selection: {
    //                                mode: "single" // Chọn một dòng duy nhất
    //                            },
    //                            width: "100%",
    //                            height: "100%",
    //                            allowItemDeleting: false,
    //                            showSelectionControls: true,
    //                            onSelectionChanged: function (selectedItems) {
    //                                const selectedName = selectedItems.selectedRowsData[0]?.fullName || "";
    //                                gridInstance.cellValue(rowIndex, "personName", selectedItems.selectedRowsData[0]?.fullName);
    //                                gridInstance.cellValue(rowIndex, "personDepartment", selectedItems.selectedRowsData[0]?.department);
    //                            },
    //                            columnAutoWidth: true,
    //                        });
    //                        e.component.on("valueChanged", function (args) {
    //                            if (args.value != null) {
    //                                e.component.close();
    //                            }
    //                        });
    //                        //var dtGrid = $dataGrid.dxDataGrid("instance");
    //                        return $dataGrid;
    //                    };
    //                } else if (e.row.data.sideTypeId === 68) {
    //                    e.editorOptions = {
    //                        editorType: "dxTextBox",
    //                        value: gridInstance.cellValue(rowIndex, "personName"),
    //                        onValueChanged: function (args) {
    //                            gridInstance.cellValue(rowIndex, "personName", args.value);
    //                        },
    //                    };
    //                }
    //            }
    //    }

    //}
    onToolbarPreparing(e) {
        var that = this;
        const dataGrid = e.component;
        const dataSource = dataGrid.getDataSource();
        super.onToolbarPreparing(e);
        e.toolbarOptions.items.push({
            location: "before",
            widget: "dxButton",
            options: {
                icon: "add",
                text: "Add Client",
                onClick: function () {

                    var popupInstance = $(`#inputTextPopup`).dxPopup({
                        width: "20%",
                        height: "40%",
                        showTitle: true,
                        title: `Client Name`,
                        dragEnabled: false,
                        closeOnOutsideClick: true,
                        contentTemplate: function (container) {
                            $("<div id='sideName'>").dxTextBox({
                                dataField: "sideName",
                                label: { text: "Client Name", location: "top" },
                                height: "50%",
                                width: "100%",
                            }).appendTo(container);
                            return container
                        },
                        onHiding: function (e) {

                        },
                        toolbarItems: [{
                            widget: 'dxButton',
                            toolbar: 'bottom',
                            location: 'after',
                            options: {
                                stylingMode: 'contained',
                                type: 'normal',
                                text: "Add",
                                onClick() {
                                    if (dataSource) {
                                        // const store = dataSource.store();
                                        var dxText = $("#sideName").dxTextBox().dxTextBox("instance");
                                        var sideName = dxText.option("value");

                                        var items = flattenItems(dataSource._items);
                                        items = items.filter(f => f.sideOrder != 999);
                                        var maxSideOrder = items.length > 0
                                            ? Math.max(...items.map((item) => item.sideOrder || 0))
                                            : 0


                                        const store = dataSource.store();
                                        const newGroup = {
                                            id: 0,
                                            sideName: sideName,
                                            personName: "",
                                            personDepartment: "",
                                            sideId: 67,
                                            surveyId: that.filterRefId,
                                            rowOrder: 0,
                                            sideOrder: maxSideOrder + 1
                                        };
                                        dataSource.store().insert(newGroup)
                                            .then(() => dataSource.reload())
                                            .catch(error => console.error("Error adding group:", error));
                                        dataGrid.refresh();
                                    }
                                    popupInstance.hide();
                                },
                            },
                        }, {
                            widget: 'dxButton',
                            toolbar: 'bottom',
                            location: 'after',
                            options: {
                                stylingMode: 'contained',
                                type: 'normal',
                                text: "Close",
                                onClick() {
                                    popupInstance.hide();
                                },
                            },
                        }]

                    }).dxPopup("instance");
                    popupInstance.show();
                }
            }
        });
        e.toolbarOptions.items.push({
            location: "before",
            widget: "dxButton",
            options: {
                icon: "add",
                text: "Add TMIV Group",
                onClick: function () {
                    const store = dataSource.store();
                    const newGroup = {
                        id: 0,
                        sideName: "Tokio Marine Insurance Vietnam Company Limited",
                        sideOrder: 999,
                        personName: "",
                        personDepartment: "",
                        sideId: 67,
                        surveyId: that.filterRefId,
                        rowOrder: 0,
                    };
                    dataSource.store().insert(newGroup)
                        .then(() => dataSource.reload())
                        .catch(error => console.error("Error adding group:", error));
                    dataGrid.refresh();
                }
            }
        });
    }
    onContentReady(e) {
        // Tìm tất cả các biểu tượng expand/collapse và xóa chúng
        e.component.option("rowDragging.allowReordering", false);
        e.component.option("editing.allowAdding", false);
        disableCellClick(e);
        //e.component.option("onRowPrepared", function (eC) {
        //    if (!eC.rowType || eC.rowType !== "data") return;

        //    const data = eC.data;

        //    if (data.isGroup) {
        //        // 👉 Custom style cho dòng nhóm giả
        //        eC.rowElement
        //            .css({
        //                fontWeight: "bold",
        //                backgroundColor: "#e6f2ff",
        //                color: "#003366"
        //            })
        //            .addClass("custom-group-row");

        //        // 👉 Gộp cột: ẩn các cell còn lại
        //        eC.rowElement.find("td").not(":first").remove();
        //        eC.rowElement.find("td:first").attr("colspan", eC.columns.length).text(`${data.groupData.sideOrder}. ${data.groupKey}`);
        //    }
        //});
    }
}


var ConferredWithGridOption = class ConferredWithGridOption extends MGridOption {
    constructor(modelName, gridType, gridConfig) {
        super(modelName, gridType, gridConfig);
        this.clientName = gridConfig.clientName ? gridConfig.clientName : "";
        this.draftGuid = gridConfig.draftGuid ? gridConfig.draftGuid : null;
    };

    onContentReady(e) {
        var that = this;
        e.component.option("rowDragging.allowReordering", false);
        e.component.option("editing.allowAdding", false);
        disableCellClick(e);
    }

    onCellPrepared(e) {
        if (e.rowType === "data" && e.column.command && e.column.alignment != "center") {
            addMoveButtonsToCell(e);
        }
    }

    onCustomizeColumns(columns) {
        var that = this;
        const gridInstance = $(`#${that.mGridDetailOption.container}`).dxDataGrid().dxDataGrid("instance");
        super.onCustomizeColumns(columns);
        participantListColumnsProcess(columns, gridInstance, that);
    }
    onToolbarPreparing(e) {
        var that = this;
        const dataGrid = e.component;
        const dataSource = dataGrid.getDataSource();
        super.onToolbarPreparing(e);
        e.toolbarOptions.items.push({
            location: "before",
            widget: "dxButton",
            options: {
                icon: "add",
                text: "Add Client",
                onClick: function () {

                    var popupInstance = $(`#inputTextPopup`).dxPopup({
                        width: "20%",
                        height: "40%",
                        showTitle: true,
                        title: `Client Name`,
                        dragEnabled: false,
                        closeOnOutsideClick: true,
                        contentTemplate: function (container) {
                            $("<div id='sideName'>").dxTextBox({
                                dataField: "sideName",
                                label: { text: "Client Name", location: "top" },
                                height: "50%",
                                width: "100%",
                            }).appendTo(container);
                            return container
                        },
                        onHiding: function (e) {

                        },
                        toolbarItems: [{
                            widget: 'dxButton',
                            toolbar: 'bottom',
                            location: 'after',
                            options: {
                                stylingMode: 'contained',
                                type: 'normal',
                                text: "Add",
                                onClick() {
                                    if (dataSource) {
                                        const allRows = dataGrid.getVisibleRows();
                                        var groupRowsForDisplay = allRows.filter(m => m.rowType == "group");
                                        // const store = dataSource.store();
                                        var dxText = $("#sideName").dxTextBox().dxTextBox("instance");
                                        var sideName = dxText.option("value");
                                        const store = dataSource.store();
                                        const newGroup = {
                                            id: 0,
                                            sideName: sideName,
                                            personName: "",
                                            personDepartment: "",
                                            sideId: 66,
                                            surveyId: that.filterRefId,
                                            rowOrder: 0,
                                            sideOrder: groupRowsForDisplay.length
                                        };
                                        dataSource.store().insert(newGroup)
                                            .then(() => dataSource.reload())
                                            .catch(error => console.error("Error adding group:", error));
                                        dataGrid.refresh();
                                    }
                                    popupInstance.hide();
                                },
                            },
                        }, {
                            widget: 'dxButton',
                            toolbar: 'bottom',
                            location: 'after',
                            options: {
                                stylingMode: 'contained',
                                type: 'normal',
                                text: "Close",
                                onClick() {
                                    popupInstance.hide();
                                },
                            },
                        }]

                    }).dxPopup("instance");
                    popupInstance.show();
                }
            }
        });
    }
}


var EmployeeGridOption = class EmployeeGridOption extends MGridOption {
    constructor(modelName, gridType) {
        super(modelName, gridType);
    };

    onCustomizeColumns(columns) {
        var that = this;
        super.onCustomizeColumns(columns);
    }

    populateCellValueFromDropDownBox() {
        //object template
        return [
            {
                srcFieldName: "usersId",
                desFieldNames: [
                    { "FieldName": "accountName", "DrFieldName": "username" }
                ]
            }
        ];
        return null;
    }

    onToolbarPreparing(e) {
        super.onToolbarPreparing(e);
        var that = this;
        e.toolbarOptions.items.unshift({
            location: "after",
            widget: "dxButton",
            options: {
                text: "Employee Update",
                onClick: function (e) {
                    $.ajax({
                        url: '/api/Employee/EmployeeUpdate',
                        success: function (response) {
                            appNotifySuccess(`Process done!`, false);
                        },
                        error: function (err) {
                            appErrorHandling('Process update!', err);
                        }
                    });
                },
                onInitialized: function (args) {
                    this.btnExportInstance = args.component;
                }
            }
        });
    }
}

var UsersGridOption = class UsersGridOption extends MGridOption {
    constructor(modelName, gridType) {
        super(modelName, gridType);
    };
    //onCustomizeColumns(columns) {
    //    var that = this;
    //    super.onCustomizeColumns(columns);
    //    //hyperLinkCodeReplace(columns, "Business/Workflow", "SurveyWorkFlow", "id", "surveyNo");
    //    $.each(columns, function (colIndex, col) {
    //        if (col.dataField == "username") {
    //            col.cellTemplate = function (container, options) {
    //                $("<div>").text(options.text).appendTo(container);
    //                $("<div>")
    //                    .dxButton({
    //                        text: "Login As",
    //                        stylingMode: "contained",
    //                        type: "normal",
    //                        onClick: function () {
    //                            $.ajax({
    //                                url: `/api/Users/LoginAs/${options.text}`,
    //                                success: function (response) {
    //                                },
    //                                error: function (err) {
    //                                }
    //                            });
    //                        },
    //                    })
    //                    .appendTo(container);
    //            };
    //        }

    //    });
    //}
    onToolbarPreparing(e) {
        super.onToolbarPreparing(e);
        var that = this;
        e.toolbarOptions.items.unshift({
            location: "after",
            widget: "dxButton",
            options: {
                text: "User Update",
                onClick: function (e) {
                    const popup = $("#detailPopup")
                        .dxPopup({
                            width: "40%",
                            height: "70%",
                            title: "Login Form",
                            showTitle: true,
                            dragEnabled: true,
                            closeOnOutsideClick: true,
                            contentTemplate: function (contentElement) {
                                $("<div>").dxForm({
                                    items: [
                                        { dataField: "adminUser", label: { text: "User" }, editorOptions: { placeholder: "Enter username" } },
                                        { dataField: "passWord", label: { text: "Password" }, editorOptions: { placeholder: "Enter password", mode: "password" } }
                                    ]
                                }).appendTo(contentElement);


                                $("<div>").dxButton({
                                    text: "OK",
                                    type: "success",
                                    onClick: function () {
                                        var data = contentElement.find(".dx-form").dxForm("instance").option("formData");
                                        $.ajax({
                                            url: `/api/Users/EmployeeUpdate?adminUser=${data.adminUser}&passWord=${data.passWord}`,
                                            success: function (response) {
                                                appNotifySuccess("Process done!", false);
                                            },
                                            error: function (err) {
                                                appErrorHandling("Process update!", err);
                                            }
                                        });

                                        // Ẩn Popup
                                        contentElement.closest(".dx-popup").dxPopup("instance").hide();
                                    }
                                })
                                    .appendTo(contentElement);
                                return contentElement;
                            }
                        }).dxPopup("instance");
                    popup.show();

                }
            }
        });
        if (_isDebugMode) {
            e.toolbarOptions.items.unshift({
                location: "after",
                widget: "dxSelectBox",
                options: {
                    //dropDownOptions : { minWidth: 200 },
                    dataSource: that.dataGrid.getDataSource(),
                    valueExpr: 'username',
                    displayExpr: 'username',
                    searchEnabled: true,
                    width: 300,
                    onValueChanged: function (e) { // handle after select
                        $.ajax({
                            url: `/api/Users/LoginAs/${e.value}`,
                            success: function (response) {
                            },
                            error: function (err) {
                            }
                        });

                        //if (gridInstance.moreActionFromSelectedChangeSelectBox)
                        //    gridInstance.moreActionFromSelectedChangeSelectBox(e, item, gridInstance);
                        //else {
                        //    if (e.value) {
                        //        // Cập nhật giá trị vào cell
                        //        gridInstance.component.cellValue(
                        //            gridInstance.row.rowIndex,
                        //            item.dataField,
                        //            e.value
                        //        );
                        //    } else {
                        //        // Xóa giá trị trong cell
                        //        gridInstance.component.cellValue(
                        //            gridInstance.row.rowIndex,
                        //            item.dataField,
                        //            null
                        //        );
                        //    }
                        //    //gridInstance.component.saveEditData();
                        //}
                    },
                }
            });
        }
    }


}

var WordingGridOption = class WordingGridOption extends MGridOption {
    constructor(modelName, gridType) {
        super(modelName, gridType);
    };

    onCustomizeColumns(columns) {
        var that = this;
        super.onCustomizeColumns(columns);
        hyperLinkCode(columns, "Business/MasterData", "Wording", "id", "wordingName");
        $.each(columns, function (cIndex, column) {
            //if (column.dataField == "wordingContent") {
            //    column.width = 80;
            //}
        });
    }
}

var SurveyMemoWorkflowGridOption = class SurveyMemoWorkflowGridOption extends MGridOption {
    constructor(modelName, gridType, params) {
        super(modelName, gridType, params);
    };
    onInitNewRow(info) {
        super.onInitNewRow(info);
        var that = this;
        const visibleRows = that.component.getVisibleRows();
        if (visibleRows.length > 0) {
            const firstRow = visibleRows[0].data;
            info.data["submitDate"] = firstRow.submitDate;
        } else {
            info.data["submitDate"] = new Date();
        }
    }
    onContentReady(e) {
        var that = this;
        e.component.option("editing.mode", "cell"); 
        if (_role == "Staff" && that.mGridDetailOption.instanceWorkflowFK?.workflowStatusEnum?.key != "Checking") {
            e.component.option("editing.allowAdding", false);
            e.component.option("editing.allowUpdating", false);
            e.component.option("editing.allowDeleting", false);
        }
    }
}



var MailTemplateGridOption = class MailTemplateGridOption extends MGridOption {
    constructor(modelName, gridType) {
        super(modelName, gridType);
    };

    onCustomizeColumns(columns) {
        var that = this;
        super.onCustomizeColumns(columns);
        hyperLinkCode(columns, "Business/MasterData", "MailTemplate", "id", "templateName");

    }
}


var LossExpValueBrkdwnDetailGridOption = class LossExpValueBrkdwnDetailGridOption extends MGridOption {
    constructor(modelName, gridType, params) {
        super(modelName, gridType, params);
        if (params)
            this.Params = params
    };

    onCustomizeColumns(columns) {
        var that = this;
        super.onCustomizeColumns(columns);

        var currencyName = that.Params.params.currencyName;
        var currencySign = "đồng";
        var toFix = 0;
        var precision = 0;
        const locale = that.Params.params.currencyId == 85 ? "vi-VN" : "en-US";
        var format = {
            type: "fixedPoint",
            precision: precision,
            formatter: function (value) {
                return new Intl.NumberFormat(locale, {
                    minimumFractionDigits: toFix,
                    maximumFractionDigits: toFix
                }).format(value == null ? "" : value.toFixed(toFix)) + ` ${currencySign}`;

                //value == null ? "" : value.toFixed(toFix) + ` ${currencySign}`;
            }
        };

        $.each(columns, function (colIndex, col) {
            if (that.Params.params.currencyId == 85) {
                currencySign = "$";
                toFix = 2;
                precision = 2;
            }
            if (col.dataField == "pml") {
                col.caption = `PML (in ${currencyName})`;
                col.format = format;
            }
            if (col.dataField == "valueBrkdwnSum") {
                col.caption = `Sum insured (${currencyName})`;
                col.format = format;
            }
        });
    }
}
var UserWorkflowGridOption = class UserWorkflowGridOption extends MGridOption {
    constructor(modelName, gridType) {
        super(modelName, gridType);
    }
}
var InstanceWorkflowGridOption = class InstanceWorkflowGridOption extends MGridOption {
    constructor(modelName, gridType) {
        super(modelName, gridType);
    }
}
var StepsWorkflowGridOption = class StepsWorkflowGridOption extends MGridOption {
    constructor(modelName, gridType) {
        super(modelName, gridType);
    }
}
var SurveyWorkflowGridOption = class SurveyWorkflowGridOption extends MGridOption {
    constructor(modelName, gridType) {
        super(modelName, gridType);
    };

    onCustomizeColumns(columns) {
        var that = this;
        super.onCustomizeColumns(columns);
        //hyperLinkCodeReplace(columns, "Business/Workflow", "SurveyWorkFlow", "id", "surveyNo");
        this.hyperLinkCode(columns, "Business/Workflow", "SurveyWorkFlow", "id", "surveyNo");
        $.each(columns, function (colIndex, col) {
            if (col.dataField == "submitDate") {
                col.sortOrder = "desc";
            }
            if (col.dataField == "workflowStatus") {
                col.cellTemplate = function (container, options) {

                    container = markupStatusCSS(container, options);
                    return container;

                };
            }

        });
    }

    hyperLinkCode(columns, moduleName, controllerName, propertyName, specificLinkField = null) {
        $.each(columns, function (i, col) {
            if (col.dataField == (specificLinkField != null ? specificLinkField : "Code")) {
                col.cellTemplate = function (container, options) {
                    if (options.row.data.workflowStatus != "Recall") {
                        var selectedValue = options.data[propertyName];
                        $('<a>').addClass('dx-link dx-link-edit')
                            .text(options.text)
                            .css({ color: "blue", textDecoration: "underline", cursor: "pointer" })
                            .on('dxclick', function () {
                                if (Object.keys(options.key).length > 0)
                                    callElementView(`/${moduleName}/${controllerName}_Form/${selectedValue}`, `form_${controllerName}_Form_${options.key.id}`, `${controllerName} ${options.text}`);
                                else
                                    callElementView(`/${moduleName}/${controllerName}_Form/${selectedValue}`, `form_${controllerName}_Form_${options.key}`, `${controllerName} ${options.text}`);
                                //callElementView(`/Business/MasterData/Client_Form/2`, `${controllerName}_Form`, `${controllerName} ${options.text}`);
                            })
                            .appendTo(container);
                    }
                    else {
                        var selectedValue = options.data[propertyName];
                        $('<a>').addClass('dx-link dx-link-edit')
                            .text(options.text)
                            .css({ color: "blue", textDecoration: "underline", cursor: "pointer" })
                            .on('dxclick', function () {
                                var popupInstance = $(`#inputTextPopup`).dxPopup({
                                    width: "50%",
                                    height: "40%",
                                    showTitle: true,
                                    title: `Recall reason`,
                                    dragEnabled: false,
                                    closeOnOutsideClick: true,
                                    contentTemplate: function (containerPopup) {
                                        $("<div style='height:100%'>")
                                            .addClass("custom-popup-content")
                                            .text(options.row.data.recallReason)
                                            .appendTo(containerPopup);
                                        //$(`<div id='recallReason'>${options.row.data.recallReason}</div>`).appendTo(containerPopup);
                                        return containerPopup;
                                    },
                                    onHiding: function (e) {

                                    },
                                    toolbarItems: [{
                                        widget: 'dxButton',
                                        toolbar: 'bottom',
                                        location: 'after',
                                        options: {
                                            stylingMode: 'contained',
                                            type: 'normal',
                                            text: "Close",
                                            onClick() {
                                                popupInstance.hide();
                                            },
                                        },
                                    }]

                                }).dxPopup("instance");
                                popupInstance.show();
                            })
                            .appendTo(container);
                    }
                }
            } else {

            }
        });
    }


}
var PendingJogetGridOption = class PendingJogetGridOption extends MGridOption {
    constructor(modelName, gridType) {
        super(modelName, gridType);
    };

    onCustomizeColumns(columns) {
        var that = this;
        super.onCustomizeColumns(columns);
        //hyperLinkCodeReplace(columns, "Business/Workflow", "PendingJoget", "id", "surveyNo");
        this.hyperLinkCode(columns, "Business/Workflow", "PendingJoget", "id", "surveyNo");
        $.each(columns, function (colIndex, col) {
            if (col.dataField == "submitDate") {
                col.sortOrder = "desc";
            }
            if (col.dataField == "workflowStatus") {
                col.cellTemplate = function (container, options) {

                    container = markupStatusCSS(container, options);
                    return container;

                };
            }

        });
    }

    hyperLinkCode(columns, moduleName, controllerName, propertyName, specificLinkField = null) {
        $.each(columns, function (i, col) {
            if (col.dataField == (specificLinkField != null ? specificLinkField : "Code")) {
                col.cellTemplate = function (container, options) {
                    if (options.row.data.workflowStatus != "Recall") {
                        var selectedValue = options.data[propertyName];
                        $('<a>').addClass('dx-link dx-link-edit')
                            .text(options.text)
                            .css({ color: "blue", textDecoration: "underline", cursor: "pointer" })
                            .on('dxclick', function () {
                                if (Object.keys(options.key).length > 0)
                                    callElementView(`/${moduleName}/${controllerName}_Form/${selectedValue}`, `form_${controllerName}_Form_${options.key.id}`, `${controllerName} ${options.text}`);
                                else
                                    callElementView(`/${moduleName}/${controllerName}_Form/${selectedValue}`, `form_${controllerName}_Form_${options.key}`, `${controllerName} ${options.text}`);
                                //callElementView(`/Business/MasterData/Client_Form/2`, `${controllerName}_Form`, `${controllerName} ${options.text}`);
                            })
                            .appendTo(container);
                    }
                    else {
                        var selectedValue = options.data[propertyName];
                        $('<a>').addClass('dx-link dx-link-edit')
                            .text(options.text)
                            .css({ color: "blue", textDecoration: "underline", cursor: "pointer" })
                            .on('dxclick', function () {
                                var popupInstance = $(`#inputTextPopup`).dxPopup({
                                    width: "50%",
                                    height: "40%",
                                    showTitle: true,
                                    title: `Recall reason`,
                                    dragEnabled: false,
                                    closeOnOutsideClick: true,
                                    contentTemplate: function (containerPopup) {
                                        $("<div style='height:100%'>")
                                            .addClass("custom-popup-content")
                                            .text(options.row.data.recallReason)
                                            .appendTo(containerPopup);
                                        //$(`<div id='recallReason'>${options.row.data.recallReason}</div>`).appendTo(containerPopup);
                                        return containerPopup;
                                    },
                                    onHiding: function (e) {

                                    },
                                    toolbarItems: [{
                                        widget: 'dxButton',
                                        toolbar: 'bottom',
                                        location: 'after',
                                        options: {
                                            stylingMode: 'contained',
                                            type: 'normal',
                                            text: "Close",
                                            onClick() {
                                                popupInstance.hide();
                                            },
                                        },
                                    }]

                                }).dxPopup("instance");
                                popupInstance.show();
                            })
                            .appendTo(container);
                    }
                }
            } else {

            }
        });
    }


}

var ClientGridOption = class ClientGridOption extends MGridOption {
    constructor(modelName, gridType) {
        super(modelName, gridType);
    };

    onCustomizeColumns(columns) {
        var that = this;
        super.onCustomizeColumns(columns);
        hyperLinkCode(columns, "Business/MasterData", "Client", "id", "clientName");
    }
}

var UsersCacheGridOption = class UsersCacheGridOption extends MGridOption {
    constructor(modelName, gridType) {
        super(modelName, gridType);
    };
}

var DataGridConfigGridOption = class DataGridConfigGridOption extends MGridOption {
    constructor(modelName, gridType) {
        super(modelName, gridType);
    };

    onCustomizeColumns(columns) {
        var that = this;
        super.onCustomizeColumns(columns);
        $.each(columns, function (cIndex, column) {
            if (column.dataField == "mappingFieldId") {
                var model = "SysTable"
                var gridConfig = fetchConfigurationData(model, "System");
                var gridDataSource = makeBasicDataSource(that);
                column.lookup = {
                    dataSource: {
                        key: 'id',
                        store: DevExpress.data.AspNet.createStore({
                            key: "id",
                            loadUrl: `/api/${model}/GetAll`
                        }),
                        paginate: true,
                    },
                    displayExpr: gridConfig.displayExp,
                    valueExpr: 'id'
                };
                $.each(gridConfig.getScheme, function (schIndex, schCol) {
                    delete schCol.width;
                    delete schCol.height;
                    if (schCol.dataType == "string" && schCol.dataField.indexOf("Id") < 0 && schCol.lookup == null && schCol.mLookup == null) {
                        schCol.calculateFilterExpression = function (value, operation, target) {
                            if (value != null) {
                                if (value.indexOf(",") < 0) {
                                    value = typeof value === "string" ? value.trim() : value;
                                    return this.defaultCalculateFilterExpression(value, operation, target);
                                } else {
                                    var filterValues = value.split(',');
                                    var filterExpression = [];
                                    for (var i = 0; i < filterValues.length; i++) {
                                        var valf = typeof filterValues[i] === "string" ? filterValues[i].trim() : filterValues[i];
                                        var filterExpr = [this.dataField, operation || '=', valf];
                                        if (i > 0) {
                                            filterExpression.push('or');
                                        }
                                        filterExpression.push(filterExpr);
                                    }
                                    return filterExpression;
                                }
                            } else {
                                return this.defaultCalculateFilterExpression(null, operation, target);
                            }
                        }
                    }
                    else {
                        schCol.calculateFilterExpression = function (value, operation, target) {
                            return this.defaultCalculateFilterExpression(value, operation, target);
                        }
                    }

                });
                column.editorType = "dxDropDownBox";
                column.editorOptions = {
                    width: "100%",
                    dropDownOptions: {
                        width: 1000,
                        height: _defaultDropDownHeight
                    },
                    dataSource: DevExpress.data.AspNet.createStore({
                        key: 'id',
                        loadUrl: `api/${model}/GetAll`,
                        paginate: true
                    }),
                    columns: gridConfig.getScheme,
                    contentTemplate: function (e) {
                        const $dataGrid = $("<div>").dxDataGrid({
                            selectionMode: 'all',
                            // remoteOperations: { paging: true, filtering: true, sorting: true, grouping: true, summary: true, groupPaging: true },
                            filterRow: { visible: true },
                            dataSource: e.component.option("dataSource"),
                            columns: e.component.option("columns"),
                            selection: { mode: "single" },
                            scrolling: {
                                mode: 'standard',
                                preloadEnabled: false,
                                showScrollbar: 'always',
                                useNative: false
                            },
                            width: "100%",
                            height: "100%",
                            allowItemDeleting: false,
                            showSelectionControls: true,
                            sorting: {
                                mode: 'multiple',
                            },
                            onSelectionChanged: function (selectedItems) {
                                var keys = selectedItems.selectedRowKeys,
                                    hasSelection = keys.length;
                                if (hasSelection) {
                                    e.component.selectedItem = selectedItems.selectedRowsData;
                                    e.component.option("displayValue", selectedItems.selectedRowsData[0]["dataField"]);
                                    e.component.option("value", keys[0]);
                                }
                            },
                            columnAutoWidth: true,
                            customizeColumns: function (columns) {
                            },
                        });

                        var dtGrid = $dataGrid.dxDataGrid("instance");
                        e.component.on("valueChanged", function (args) {
                            dtGrid.selectRows(args.value, false);
                            if (args.value != null) {
                                e.component.close();
                            }
                        });

                        return $dataGrid;
                    }
                };
            }
        });
    }
}

var SurveyArchivedGridOption = class SurveyArchivedGridOption extends MGridOption {
    constructor(modelName, gridType, params) {
        super(modelName, gridType );
        this.Params = params;
        //if (_role == "Staff") {
        //    this.filterRefField = "createdBy";
        //    this.filterRefId = _loginUser;
        //}
    };

    onCustomizeColumns(columns) {
        var that = this;
        super.onCustomizeColumns(columns);
        hyperLinkCode(columns, "Business/Form", "Survey", "id", "surveyNo");
        $.each(columns, function (colIndex, colItems) {
            if (colItems.dataField == "createdDate") {
                colItems.sortOrder = "desc";
            }
            if (colItems.dataField == "workflowStatus") {
                colItems.cellTemplate = function (container, options) {

                    container = markupStatusCSS(container, options);
                    return container;

                };
            }

            if (colItems.dataField == "mainOutlines") {
                colItems.cellTemplate = function (container, options) {
                    $("<div>")
                        .dxButton({
                            text: "Change",
                            stylingMode: "contained",
                            type: "normal",
                            onClick: function () {
                                var listInstance = new Object();
                                var popupInstance = $(`#outlinePopup`).dxPopup({
                                    width: "40%",
                                    height: "70%",
                                    showTitle: true,
                                    title: `Choose more outlines of survey`,
                                    dragEnabled: false,
                                    closeOnOutsideClick: true,
                                    contentTemplate: function (container) {
                                        var itemArrays = [];
                                        $.ajax({
                                            url: `api/SurveyOutlineOptions/GetMainOutLineList/${options.data.id}/${options.data.surveyTypeId}`,
                                            type: 'GET',
                                            async: false,
                                            success: function (response) {
                                                itemArrays = response;
                                            },
                                            error: function (exception) {
                                            }
                                        });

                                        listInstance = $("<div>").dxList({
                                            dataSource: itemArrays,
                                            selectionMode: "multiple",
                                            selectedItems: itemArrays.filter(f => f.mainEnable),
                                            showSelectionControls: true,
                                            height: 300,
                                            itemTemplate: function (data) {
                                                return $("<div>").addClass("list-item").append(
                                                    $("<div>")
                                                        .addClass("column")
                                                        .css({ width: "25px", display: "inline-block" }),
                                                    $("<div>")
                                                        .addClass("column")
                                                        .text(data.outline)
                                                        .css({ width: "200px", display: "inline-block" })
                                                );
                                            },
                                            onSelectionChanged: function (e) {
                                            }
                                        }).appendTo(container).dxList("instance");

                                        return container;
                                    },
                                    onHiding: function (e) {

                                    }
                                    , toolbarItems: [{
                                        widget: 'dxButton',
                                        toolbar: 'bottom',
                                        location: 'after',
                                        options: {
                                            stylingMode: 'contained',
                                            type: 'normal',
                                            text: "OK",
                                            onClick() {
                                                const selectedItems = listInstance.option("selectedItems");
                                                var requestPassingData = new Object();
                                                requestPassingData.SurveyId = options.data.id;
                                                requestPassingData.MainOutlines = selectedItems.map(item => ({
                                                    Id: item.id,
                                                    Content: item.outline
                                                }));;

                                                $.ajax({
                                                    url: '/api/SurveyOutlineOptions/UpdateMainOutlineList',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    type: 'POST',
                                                    data: JSON.stringify(requestPassingData)
                                                    , success: function (response) {
                                                        appNotifySuccess(`Survey Outlines Updated !`, false);
                                                    },
                                                    error: function (err, status, error) {
                                                        appErrorHandling('Survey Outlines Updated failed !', err);
                                                    }
                                                });

                                                popupInstance.hide();
                                            },
                                        },
                                    }, {
                                        widget: 'dxButton',
                                        toolbar: 'bottom',
                                        location: 'after',
                                        options: {
                                            stylingMode: 'contained',
                                            type: 'normal',
                                            text: "Close",
                                            onClick() {
                                                popupInstance.hide();
                                            },
                                        },
                                    }]
                                }).dxPopup("instance");
                                popupInstance.show();
                            },
                        })
                        .appendTo(container);
                }
            }

            if (colItems.dataField == "grantSurvey") {
                colItems.cellTemplate = function (container, options) {
                    $("<div>")
                        .dxButton({
                            text: "View Users",
                            stylingMode: "contained",
                            type: "normal",
                            onClick: function () {
                                // Parse giá trị của cell từ string sang array
                                const userIds = JSON.parse(options.value || "[]");

                                // Gọi AJAX lấy danh sách Users
                                $.ajax({
                                    url: "/api/Users/GetUsersByIds",
                                    type: "POST",
                                    contentType: "application/json",
                                    data: JSON.stringify(userIds),
                                    success: function (users) {
                                        // Mở popup hiển thị danh sách
                                        const popup = $("#detailPopup")
                                            .dxPopup({
                                                width: "40%",
                                                height: "70%",
                                                title: "Share List",
                                                showTitle: true,
                                                dragEnabled: true,
                                                closeOnOutsideClick: true,
                                                contentTemplate: function () {
                                                    // Tạo container cuộn
                                                    const scrollableContainer = $("<div>")
                                                        .css({
                                                            maxHeight: "100%",
                                                            overflowY: "auto", // Bật cuộn dọc
                                                            padding: "10px",
                                                        });

                                                    // Tạo danh sách Users
                                                    users.forEach((user) => {
                                                        $("<div>")
                                                            .css({
                                                                borderBottom: "1px solid #ccc",
                                                                padding: "10px",
                                                                marginBottom: "5px",
                                                            })
                                                            .html(`
                                                            <strong>Name:</strong> ${user.name}<br>
                                                            <strong>Email:</strong> ${user.mail}<br>
                                                            <strong>Branch:</strong> ${user.branch}<br>
                                                            <strong>Department:</strong> ${user.department}
                                                            `)
                                                            .appendTo(scrollableContainer);
                                                    });

                                                    return scrollableContainer;
                                                },
                                                onShown: function () {
                                                    // Đảm bảo popup cuộn mượt mà khi hiển thị
                                                    $(".dx-popup-content").css({
                                                        overflowY: "hidden",
                                                    });
                                                },
                                            })
                                            .dxPopup("instance");

                                        popup.show();
                                    },
                                    error: function (xhr) {
                                        DevExpress.ui.notify("Failed to load users.", "error", 3000);
                                    },
                                });
                            },
                        })
                        .appendTo(container);
                }
            }

        });

    }
    onToolbarPreparing(e) {
        var that = this;
        var toolbars = super.onToolbarPreparing(e);
    }
    onEditingStart(e) {
        super.onEditingStart(e);
        e.cancel = true;
        callElementView(`/Business/Form/Survey_Form/${e.key}`, `form_Survey_Form_${e.key}`, `Survey ${e.data.surveyNo}`);
    }

    onContextMenuPreparing(e) {
        var that = this;
        var dataGrid = e.component;
        var editorOptions = dataGrid.option("editing");
        var cloneItem = {
            text: "Unarchived",
            onItemClick: function () {
                 $.ajax({
                     url: `api/${that.ModelName}/StoreSurvey/${e.row.data.id}/Unarchived`,
                        headers: { 'Content-Type': 'application/json' },
                        success: function (result) {
                            e.component.refresh();
                            appNotifyInfo("Unarchived to Survey Lists.");
                        },
                        error: function (e) {
                            appErrorHandling(e.responsetext, e);
                        }
                });
            }
        };
        if (that.isAllowRowMenu)
            if (e.row != undefined && e.row.rowType === "data") {
                e.items = [];
                e.items.push(cloneItem);
            }
    }

    onContentReady(e) {
        e.component.columnOption("command:edit", "visibleIndex", -1);
    }
}


var SurveyGridOption = class SurveyGridOption extends MGridOption {
    constructor(modelName, gridType, params) {
        super(modelName, gridType);
        this.Params = params;
        //if (_role == "Staff") {
        //    this.filterRefField = "createdBy";
        //    this.filterRefId = _loginUser;
        //}
    };
    onContextMenuPreparing(e) {
        var that = this;
        var dataGrid = e.component;
        var editorOptions = dataGrid.option("editing");
        var cloneItem = {
            text: "Archived",
            onItemClick: function () {
                $.ajax({
                    url: `api/${that.ModelName}/StoreSurvey/${e.row.data.id}/Archived`,
                    headers: { 'Content-Type': 'application/json' },
                    success: function (result) {
                        e.component.refresh();
                        appNotifyInfo("Archived Survey.");
                    },
                    error: function (e) {
                        appErrorHandling(e.responsetext, e);
                    }
                });
            }
        };
        if (that.isAllowRowMenu)
            if (e.row != undefined && e.row.rowType === "data") {
                e.items = [];
                e.items.push(cloneItem);
            }
    }

    onCustomizeColumns(columns) {
        var that = this;
        super.onCustomizeColumns(columns);
        hyperLinkCode(columns, "Business/Form", "Survey", "id", "surveyNo");
        $.each(columns, function (colIndex, colItems) {
            if (colItems.dataField == "createdDate") {
                colItems.sortOrder = "desc";
            }
            if (colItems.dataField == "workflowStatus") {
                var controllerName = "Survey";
                colItems.cellTemplate = function (container, options) {
                    var link = $('<a>').addClass('dx-link dx-link-edit')
                        .css({ cursor: "pointer" })
                        .on('dxclick', function () {
                            callElementView(`/Business/Workflow/${controllerName}Workflow_Form/${options.key.id}`, `form_${controllerName}Workflow_Form_${options.key.id}`, `${controllerName}Workflow ${options.key.surveyNo}`);
                        })
                   container = markupStatusCSS(container, options, link);
                    return container;

                };
            }

            if (colItems.dataField == "mainOutlines") {
                colItems.cellTemplate = function (container, options) {
                    $("<div>")
                        .dxButton({
                            text: "Change",
                            stylingMode: "contained",
                            type: "normal",
                            onClick: function () {
                                var listInstance = new Object();
                                var popupInstance = $(`#outlinePopup`).dxPopup({
                                    width: "40%",
                                    height: "70%",
                                    showTitle: true,
                                    title: `Choose more outlines of survey`,
                                    dragEnabled: false,
                                    closeOnOutsideClick: true,
                                    contentTemplate: function (container) {
                                        var itemArrays = [];
                                        $.ajax({
                                            url: `api/SurveyOutlineOptions/GetMainOutLineList/${options.data.id}/${options.data.surveyTypeId}`,
                                            type: 'GET',
                                            async: false,
                                            success: function (response) {
                                                itemArrays = response;
                                            },
                                            error: function (exception) {
                                            }
                                        });

                                        listInstance = $("<div>").dxList({
                                            dataSource: itemArrays,
                                            selectionMode: "multiple",
                                            selectedItems: itemArrays.filter(f => f.mainEnable),
                                            showSelectionControls: true,
                                            height: 300,
                                            itemTemplate: function (data) {
                                                return $("<div>").addClass("list-item").append(
                                                    $("<div>")
                                                        .addClass("column")
                                                        .css({ width: "25px", display: "inline-block" }),
                                                    $("<div>")
                                                        .addClass("column")
                                                        .text(data.outline)
                                                        .css({ width: "200px", display: "inline-block" })
                                                );
                                            },
                                            onSelectionChanged: function (e) {
                                            }
                                        }).appendTo(container).dxList("instance");

                                        return container;
                                    },
                                    onHiding: function (e) {

                                    }
                                    , toolbarItems: [{
                                        widget: 'dxButton',
                                        toolbar: 'bottom',
                                        location: 'after',
                                        options: {
                                            stylingMode: 'contained',
                                            type: 'normal',
                                            text: "OK",
                                            onClick() {
                                                const selectedItems = listInstance.option("selectedItems");
                                                var requestPassingData = new Object();
                                                requestPassingData.SurveyId = options.data.id;
                                                requestPassingData.MainOutlines = selectedItems.map(item => ({
                                                    Id: item.id,
                                                    Content: item.outline
                                                }));;

                                                $.ajax({
                                                    url: '/api/SurveyOutlineOptions/UpdateMainOutlineList',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    type: 'POST',
                                                    data: JSON.stringify(requestPassingData)
                                                    , success: function (response) {
                                                        appNotifySuccess(`Survey Outlines Updated !`, false);
                                                    },
                                                    error: function (err, status, error) {
                                                        appErrorHandling('Survey Outlines Updated failed !', err);
                                                    }
                                                });

                                                popupInstance.hide();
                                            },
                                        },
                                    }, {
                                        widget: 'dxButton',
                                        toolbar: 'bottom',
                                        location: 'after',
                                        options: {
                                            stylingMode: 'contained',
                                            type: 'normal',
                                            text: "Close",
                                            onClick() {
                                                popupInstance.hide();
                                            },
                                        },
                                    }]
                                }).dxPopup("instance");
                                popupInstance.show();
                            },
                        })
                        .appendTo(container);
                }
            }

            if (colItems.dataField == "grantSurvey") {
                colItems.cellTemplate = function (container, options) {
                    $("<div>")
                        .dxButton({
                            text: "View Users",
                            stylingMode: "contained",
                            type: "normal",
                            onClick: function () {
                                // Parse giá trị của cell từ string sang array
                                const userIds = JSON.parse(options.value || "[]");

                                // Gọi AJAX lấy danh sách Users
                                $.ajax({
                                    url: "/api/Users/GetUsersByIds",
                                    type: "POST",
                                    contentType: "application/json",
                                    data: JSON.stringify(userIds),
                                    success: function (users) {
                                        // Mở popup hiển thị danh sách
                                        const popup = $("#detailPopup")
                                            .dxPopup({
                                                width: "40%",
                                                height: "70%",
                                                title: "Share List",
                                                showTitle: true,
                                                dragEnabled: true,
                                                closeOnOutsideClick: true,
                                                contentTemplate: function () {
                                                    // Tạo container cuộn
                                                    const scrollableContainer = $("<div>")
                                                        .css({
                                                            maxHeight: "100%",
                                                            overflowY: "auto", // Bật cuộn dọc
                                                            padding: "10px",
                                                        });

                                                    // Tạo danh sách Users
                                                    users.forEach((user) => {
                                                        $("<div>")
                                                            .css({
                                                                borderBottom: "1px solid #ccc",
                                                                padding: "10px",
                                                                marginBottom: "5px",
                                                            })
                                                            .html(`
                                                            <strong>Name:</strong> ${user.name}<br>
                                                            <strong>Email:</strong> ${user.mail}<br>
                                                            <strong>Branch:</strong> ${user.branch}<br>
                                                            <strong>Department:</strong> ${user.department}
                                                            `)
                                                            .appendTo(scrollableContainer);
                                                    });

                                                    return scrollableContainer;
                                                },
                                                onShown: function () {
                                                    // Đảm bảo popup cuộn mượt mà khi hiển thị
                                                    $(".dx-popup-content").css({
                                                        overflowY: "hidden",
                                                    });
                                                },
                                            })
                                            .dxPopup("instance");

                                        popup.show();
                                    },
                                    error: function (xhr) {
                                        DevExpress.ui.notify("Failed to load users.", "error", 3000);
                                    },
                                });
                            },
                        })
                        .appendTo(container);
                }
            }

        });

    }
    onToolbarPreparing(e) {
        var that = this;
        var toolbars = super.onToolbarPreparing(e);
    }
    onEditingStart(e) {
        super.onEditingStart(e);
        e.cancel = true;
        callElementView(`/Business/Form/Survey_Form/${e.key}`, `form_Survey_Form_${e.key}`, `Survey ${e.data.surveyNo}`);
    }
    onContentReady(e) {
        e.component.columnOption("command:edit", "visibleIndex", -1);

    }
}

var LossControlGridOption = class LossControlGridOption extends MGridOption {
    constructor(modelName, gridType, params) {
        super(modelName, gridType);
        this.Params = params;
        //if (_role == "Staff") {
        //    this.filterRefField = "createdBy";
        //    this.filterRefId = _loginUser;
        //}
    };
    onContextMenuPreparing(e) {
        var that = this;
        var dataGrid = e.component;
        var editorOptions = dataGrid.option("editing");
        var cloneItem = {
            text: "Archived",
            onItemClick: function () {
                $.ajax({
                    url: `api/${that.ModelName}/StoreSurvey/${e.row.data.id}/Archived`,
                    headers: { 'Content-Type': 'application/json' },
                    success: function (result) {
                        e.component.refresh();
                        appNotifyInfo("Archived Survey.");
                    },
                    error: function (e) {
                        appErrorHandling(e.responsetext, e);
                    }
                });
            }
        };
        if (that.isAllowRowMenu)
            if (e.row != undefined && e.row.rowType === "data") {
                e.items = [];
                e.items.push(cloneItem);
            }
    }

    onCustomizeColumns(columns) {
        var that = this;
        super.onCustomizeColumns(columns);
        //hyperLinkCodeReplace(columns, "Business/Workflow", "SurveyWorkFlow", "id", "surveyNo");
        this.hyperLinkCode(columns, "Business/LCForm", "LossControl", "id", "lossControlNo");
        $.each(columns, function (colIndex, col) {

        });
    }
    onToolbarPreparing(e) {
        var that = this;
        var toolbars = super.onToolbarPreparing(e);
    }
    onEditingStart(e) {
        super.onEditingStart(e);
        e.cancel = true;
        callElementView(`/Business/Form/Survey_Form/${e.key}`, `form_Survey_Form_${e.key}`, `Survey ${e.data.surveyNo}`);
    }
    onContentReady(e) {
        e.component.columnOption("command:edit", "visibleIndex", -1);

    }
}

var LocationGridOption = class LocationGridOption extends MGridOption {
    constructor(modelName, gridType) {
        super(modelName, gridType);
    };


    onCustomizeColumns(columns) {
        var that = this;
        super.onCustomizeColumns(columns);
        $.each(columns, function (cIndex, column) {
            if (column.dataField == "locationAddress") {
                //column.editCellTemplate = function (cellElement, cellInfo) {
                //    $("<div>").dxTextArea({
                //    })
                //        .css({
                //            width: "100%",
                //            height: "100px",
                //            boxSizing: "border-box",
                //            resize: "none"
                //        })
                //        .val(cellInfo.value)
                //        .on("input", function (e) {
                //            cellInfo.setValue(e.target.value);
                //        })
                //        .appendTo(cellElement);
                //    return cellElement;
                //}
            }
        });
    }
}

var OutlineGridOption = class OutlineGridOption extends MGridOption {
    constructor(modelName, gridType) {
        super(modelName, gridType);
    };


    onCustomizeColumns(columns) {
        var that = this;
        super.onCustomizeColumns(columns);
        $.each(columns, function (cIndex, column) {
            if (column.dataField == "surveyTypeId") {
                const dataSource = DevExpress.data.AspNet.createStore({
                    key: 'id',
                    loadUrl: `api/Survey/EnumLookup?refField=SurveyTypeId`,
                    paginate: true
                });
                column.lookup = { //Search Bar data
                    dataSource: dataSource,
                    displayExpr: 'key',
                    valueExpr: 'id'
                };
                column.editorType = "dxSelectBox",
                    column.editorOptions = {
                        editorType: "dxSelectBox",
                        //dropDownOptions : { minWidth: 200 },
                        dataSource: dataSource,
                        valueExpr: 'id',
                        displayExpr: 'key',
                        searchEnabled: true,
                        width: 300,
                        showClearButton: true
                    };
            }

        });
    }


    onContentReady(e) {
        e.component.columnOption("command:edit", "visibleIndex", -1);
    }
}


var AttachmentGridOption = class AttachmentGridOption extends MGridOption {
    constructor(modelName, gridType) {
        super(modelName, gridType);
    };

    //onCustomizeColumns(columns) {
    //    var that = this;
    //    super.onCustomizeColumns(columns);
    //    hyperLinkCode(columns, "Business/MasterData", "Client", "id", "clientName");
    //}
}

//Update date: 2025-05-09
var ConstructionInfoGridOption = class ConstructionInfoGridOption extends MGridOption {
    constructor(modelName, gridType, params) {
        super(modelName, gridType, params);
    };
}


//New version template class
//var TemplateGridOption = class TemplateGridOption extends MGridOption {
//    constructor(modelName, gridType, params) {
//        super(modelName, gridType, params);
//    };
//    onInitNewRow(info) {
//        super.onInitNewRow(info);
//        var that = this;
//        var that = this;
//        const visibleRows = that.component.getVisibleRows();
//
//        if (visibleRows.length > 0) {
//            const firstRow = visibleRows[0].data;
//            info.data["submitDate"] = firstRow.submitDate;
//        } else {
//            info.data["submitDate"] = new Date();
//        }
//    }
//    onContentReady(e) {
//        if (_role == "Staff") {
//            e.component.option("editing.allowAdding", false);
//            e.component.option("editing.allowUpdating", false);
//            e.component.option("editing.allowDeleting", false);
//        }
//    }
//}


var MailQueueGridOption = class MailQueueGridOption extends MGridOption {
    constructor(modelName, gridType) {
        super(modelName, gridType);
    };
    onCustomizeColumns(columns) {
        var that = this;
        super.onCustomizeColumns(columns);
        var colResend = {
            dataField: "cmdResend",
            caption: "Resend",
            fixed: true,
            fixedPosition: "right",
            cellTemplate: function (container, options) {
                console.log(options);
                container.append($(`<span class="dx-link">Resend</span>`).on('click', function () {
                    $.ajax({
                        headers: { 'Content-Type': 'application/json' },
                        type: 'POST',
                        data: JSON.stringify(options.row.data),
                        url: `/api/MailQueue/Resend`,
                        success: function (data) {
                            appNotifySuccess("Resend successed.");
                        },
                        error: function (e) {
                            appErrorHandling(e.responseText, e);
                        }
                    });
                }));
            }
        }
        columns.push(colResend);
    }

}
