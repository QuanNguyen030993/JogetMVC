

var SurveyWorkFlowForm = class SurveyWorkFlowForm extends MForm {
    constructor(id, childGridConfig, formConfig, mFormConfig) {
        super(id, childGridConfig, formConfig, mFormConfig)
        this.refFieldId = mFormConfig.passingKeyId;
    }


    customizeToolbar() {
        var that = this;
        if (_role != "Staff") {
            var isReset = false;
            if (that.formOptions?.Params.instanceWorkflowFK?.workflowStatusEnum?.key == "Done") isReset = true;
            var items = super.customizeToolbar();
            //Reset button 
            items.unshift({
                name: 'btnInit',
                widget: 'dxButton',
                location: 'after',
                visible: isReset,
                options: {
                    stylingMode: 'contained',
                    type: 'success',
                    text: 'Recall',
                    onClick: function () {
                        var popupBox = appNotifyWarning("Please confirm that you want to recall this survey ?", true);
                        popupBox.then((result) => {
                            if (result.isConfirmed) {
                                $.ajax({
                                    url: `api/Survey/ResetWorkflow/${that.id}`,
                                    headers: { 'content-type': 'application/json' },
                                    type: 'get',
                                    success: function (result) {
                                        appNotifySuccess(`Survey recalled!`, false);
                                    },
                                    error: function (e) {
                                        appNotifyWarning(e.responseJSON.detail);
                                    }
                                });
                            }
                            else {
                            }
                        });
                    }, onInitialized: function (e) {
                        //approveButtonInstance = e.component;
                    }
                }
            });
            let rejectButtonInstance = null;
            let approveButtonInstance = null;
            var isDisableButton = (that.formOptions.Params.instanceWorkflowFK?.currentStep < 4
                && that.formOptions.Params.instanceWorkflowFK?.currentStep > 1) ? false : true;
            items = items.filter(function (obj) {
                return obj.name !== "btnClone";
            });

            $.each(items, function (buttonIndex, button) {
                if (button.name == "btnSave") {
                    button.options.type = 'info';
                }
                if (button.name == "btnCancel") {
                    button.options.type = 'default';
                }
            });

            if (that.id > 0) {
                items.unshift({
                    name: 'btnInit',
                    widget: 'dxButton',
                    location: 'after',
                    options: {
                        stylingMode: 'contained',
                        type: 'warning',
                        text: 'Download',
                        onClick: function () {
                            var surveyData = that.formInstance.option("formData");
                            $.ajax({
                                url: `api/Survey/DownloadPDF/${that.id}`,
                                headers: {
                                    "Accept": "*/*",
                                    "Accept-Language": "en-US,en;q=0.9",
                                    "Content-Type": "application/json",
                                    "X-Requested-With": "XMLHttpRequest"
                                },
                                type: 'get',
                                contentType: 'application/pdf',
                                xhrFields: {
                                    responseType: 'blob'
                                },
                                success: function (blob) {
                                    const url = window.URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `${surveyData.surveyNo}.pdf`;
                                    document.body.appendChild(a);
                                    a.click();
                                    a.remove();
                                    window.URL.revokeObjectURL(url);

                                },
                                error: function (e) {
                                    appNotifyWarning(e.responseJSON);
                                }

                                //url: `api/Survey/DownloadPDF/${that.id}`,
                                //headers: {
                                //    "Accept": "*/*",
                                //    "Accept-Language": "en-US,en;q=0.9",
                                //    "Content-Type": "application/json",
                                //    "X-Requested-With": "XMLHttpRequest"
                                //},
                                //type: 'get',
                                //contentType: 'application/zip',
                                //xhrFields: {
                                //    responseType: 'blob'
                                //},
                                //success: function (blob) {
                                //    const url = window.URL.createObjectURL(blob);
                                //    const a = document.createElement('a');
                                //    a.href = url;
                                //    a.download = `Download.zip`;
                                //    document.body.appendChild(a);
                                //    a.click();
                                //    a.remove();
                                //    window.URL.revokeObjectURL(url);

                                //},
                                //error: function (e) {
                                //    appNotifyWarning(e.responseJSON);
                                //}
                            });
                        }
                    }
                });
                items.unshift({
                    name: 'btnInit',
                    widget: 'dxButton',
                    location: 'after',
                    disabled: isDisableButton,
                    visible: !isReset,
                    options: {
                        stylingMode: 'contained',
                        type: 'danger',
                        text: 'Reject',
                        onClick: function () {
                            $.ajax({
                                url: `api/Survey/RejectSurvey/${that.id}`,
                                headers: { 'content-type': 'application/json' },
                                type: 'get',
                                success: function (result) {
                                    appNotifySuccess(`Reject !`);
                                    rejectButtonInstance.option("disabled", true);
                                    approveButtonInstance.option("disabled", true);
                                },
                                error: function (e) {
                                    appNotifyWarning(e.responseJSON.detail);
                                }
                            });

                        },
                        onInitialized: function (e) {
                            rejectButtonInstance = e.component;
                        }
                    }
                });

                var approveButtonTitle = "Check";
                if (that.formOptions.Params?.instanceWorkflowFK?.workflowStatusEnum?.key)
                    if (that.formOptions.Params?.instanceWorkflowFK?.workflowStatusEnum?.key == "Checking")
                        approveButtonTitle = "Check";
                    else
                        approveButtonTitle = "Approve";

                items.unshift({
                    name: 'btnInit',
                    widget: 'dxButton',
                    location: 'after',
                    visible: !isReset,
                    disabled: isDisableButton,
                    options: {
                        stylingMode: 'contained',
                        type: 'success',
                        text: approveButtonTitle,
                        onClick: function () {
                            $.ajax({
                                url: `api/Survey/ApproveSurvey/${that.id}`,
                                headers: { 'content-type': 'application/json' },
                                type: 'get',
                                success: function (result) {
                                    appNotifySuccess(`${approveButtonTitle} !`);
                                    rejectButtonInstance.option("disabled", true);
                                    approveButtonInstance.option("disabled", true);
                                },
                                error: function (e) {
                                    appNotifyWarning(e.responseJSON.detail);
                                }
                            });
                        }, onInitialized: function (e) {
                            approveButtonInstance = e.component;
                        }
                    }
                });




            }
        }
        return items;
    }

    callApi(apiMethod, dataInput, isClose) {
        try {
            var that = this;
            var efName = this.ModelName;

            var thatOnScheme = { ...that };

            thatOnScheme.ModelName = "Survey";
            var url = buildApiUrl(apiMethod, thatOnScheme);

            var dataVar = null;
            //var httpMethod = this.buildHttpMethod(apiMethod);
            if (dataInput) {
                dataVar = { values: dataInput.values };
                if (dataInput.key) {
                    dataVar = { key: dataInput.key, values: dataInput.values };
                }
                if (apiMethod == "CustomQuery") {
                    dataVar = JSON.stringify(dataInput.customQuery);
                }
            }


            var ajaxOptions = {
                url: url,
                headers: {
                    'Content-Type': apiMethod == "CustomQuery" ? "application/json" : 'application/x-www-form-urlencoded; charset=UTF-8'
                },
                type: (apiMethod == "GetSingle") || (apiMethod == "GetFKMany") ? "GET" : (apiMethod == "CustomQuery" ? "POST" : apiMethod),
                data: dataVar,
                async: false,
                error: function (e) {
                    if (e.responseText) {
                        if (apiMethod != "GetFKMany")
                            appErrorHandling(e.responseText, e);
                        else
                            console.warn(` FormCallApiException: ${url} endpoint not exist`);
                    }
                    else
                        appErrorHandling("callApi Form fail!", e);
                },
                complete: function (e) {
                    //không chèn thông báo tại đây
                    //appLoadingPanel.hide(); // hide loading...
                }
            };

            apiMethod = (apiMethod == "GetSingle") || (apiMethod == "GetFKMany" || (apiMethod == "CustomQuery")) ? "GET" : apiMethod;
            var onSuccess = null;
            switch (apiMethod) {
                case 'GET':
                    onSuccess = that.getSuccess.bind(this);
                    break;
                case 'POST':
                    onSuccess = that.postSuccess.bind(this);
                    break;
                case 'PUT':
                    onSuccess = that.putSuccess.bind(this);
                    break;
                case 'DELETE':
                    onSuccess = that.deleteSuccess.bind(this);
                    break;
                case 'CLONE':
                    onSuccess = that.cloneSuccess.bind(this);
                    break;
            }

            ajaxOptions.success = function (data) {
                if (dataInput.customQuery)
                    data = data.find(f => f.id == that.id);
                onSuccess(data);


                if (isClose) {
                    that.closeForm(efName);
                }


            };


            $.ajax(ajaxOptions).fail(function (jqXHR, statusText, errorThrown) {
                appNotify({ message: `${errorThrown}. ${jqXHR.responseText}`, type: 'warning' });
            });
        } catch (err) {
            appErrorHandling('Library error: call MForm.callApi() was failed.', err);
            return;
        }
    }

    groupingLayout(_formConfig, itemsArray, formInstance) {
        return itemsArray;
    }


    customizeForm(item) {
        var that = this;
        if (
            item.dataField == "workflowStatus"
            || item.dataField == "note"
            || item.dataField == "approvalDate"
            || item.dataField == "surveyNo"
            || item.dataField == "dueDate"
            || item.dataField == "submitBy"
            || item.dataField == "submitDate"
            || item.dataField == "waitForApproval"
            || item.dataField == "typeOfOccupancy"
            || item.dataField == "surveyType"
            || item.dataField == "locationAddress"
            || item.dataField == "clientName"
        )
            item.visible = false;
        else {
            item.visible = true;
        }
        if (item.dataField == "comment") {
            item.itemType = "simple";
            item.colSpan = 4;
            item.template = function (data, itemElement) {
                const wrapper = $("<div>").css({
                    position: "relative",  // Để gridContainer có thể absolute bên trong
                    width: "100%",
                    marginBottom: "10px",
                    zIndex: 10
                }).appendTo(itemElement);
                const upperWrapper = $("<div>").css({ width: "100%", display: "flex" }).appendTo(wrapper);
                const $dateSelector = $("<div>").css({ width: "200px" }).appendTo(upperWrapper);
                const $uploadReplacementPDFButton = $("<div>").dxButton({
                    text: "Documents",
                    stylingMode: "contained",
                    type: "normal",
                    onClick: function () {
                        var popupInstance = makePopup("medium", "Documents");
                        popupInstance.option("toolbarItems[0].options.onClick", function () {
                            that.refreshForm();
                            popupInstance.hide();
                        });
                        popupInstance.option("contentTemplate", function (container) {

                            var myGrid = $(`<div>`).dxDataGrid({
                                editing: {
                                    mode: "cell",
                                    allowUpdating: true
                                },
                                columns: [
                                    {
                                        dataField: "surveyid",
                                        width: "auto",
                                        caption: "File Name",
                                        cellTemplate: function (container, options) {
                                            const subdirectory = options.data.subdirectory;
                                            $("<div>").dxButton({
                                                stylingMode: 'contained',
                                                text: 'View File',
                                                type: 'normal',
                                                disabled: subdirectory ? false : true,
                                            })
                                                .attr("href", "javascript:void(0)")
                                                .on("click", function () {
                                                    $.ajax({
                                                        url: `/api/Attachment/StreamAttachment?id=${options.data.id}`,
                                                        method: "GET",
                                                        xhrFields: {
                                                            responseType: "blob"
                                                        },
                                                        success: function (blob) {
                                                            const url = window.URL.createObjectURL(blob);
                                                            const tabName = `pdfPreviewTab_${options.data.surveyid}`;
                                                            const existingTab = window.open('', tabName);

                                                            if (existingTab) {
                                                                existingTab.location.href = url;
                                                            } else {
                                                                window.open(url, tabName);
                                                            }

                                                            window.URL.revokeObjectURL(url);
                                                        },
                                                        error: function (xhr, status, error) {
                                                            appNotifyWarning("File is not exists.");
                                                        }
                                                    });
                                                })
                                                .appendTo(container);

                                        }, allowEditing: false
                                    },
                                    { dataField: "id", caption: "Id", dataType: "string", visible: false, allowEditing: false },
                                    {
                                        dataField: "isprimary", caption: "Set Primary", dataType: "boolean", allowEditing: true
                                        // ,setCellValue: function (newData, value) {
                                        // } 
                                    },
                                    { dataField: "subdirectory", caption: "SubDirectory", dataType: "string", allowEditing: false },
                                    { dataField: "createddate", caption: "Date Created", dataType: "date", allowEditing: false },
                                    {
                                        dataField: "command",
                                        width: "10%",
                                        caption: "",
                                        cellTemplate: function (container, options) {
                                            const id = options.data.id;
                                            const isFromSystem = options.data.subdirectory.includes("Survey\\");
                                            $("<div>").dxButton({
                                                stylingMode: 'contained',
                                                text: 'Delete',
                                                type: 'normal',
                                                disabled: isFromSystem ? true : false,
                                            })
                                                .attr("href", "javascript:void(0)")
                                                .on("click", function () {
                                                    $.ajax({
                                                        url: `/api/Attachment/DeleteAttachmentData?id=${options.data.id}`,
                                                        method: "GET",
                                                        async: false,
                                                        success: function (blob) {
                                                            myGrid.dxDataGrid("instance").refresh();
                                                        },
                                                        error: function (xhr, status, error) {
                                                        }
                                                    });
                                                })
                                                .appendTo(container);

                                        }, allowEditing: false
                                    }
                                ],
                                width: "100%",
                                height: "100%",
                                dataSource: new DevExpress.data.CustomStore({
                                    key: "id",
                                    load: function (loadOptions) {
                                        return $.ajax({
                                            url: `/api/Attachment/ExecuteCustomQuery`,
                                            type: "POST",
                                            contentType: "application/json",
                                            data: JSON.stringify(customQuery),
                                            success: function (data) {
                                            },
                                            error: function (error) {
                                                console.error("Error loading data:", error);
                                            }
                                        });
                                    },
                                    update: function (key, values) {
                                        return $.ajax({
                                            url: `/api/${that.ModelName}/UpdateData`,
                                            type: "PUT",
                                            data: {
                                                values: JSON.stringify(values),
                                                key: key
                                            },
                                            processData: true,
                                            success: function (data) {
                                            },
                                            error: function (error) {
                                                console.error("Error loading data:", error);
                                            }
                                        });
                                    }
                                })
                                , onCellClick: function (e) {
                                    const grid = e.component;
                                    if (e.column)
                                        if (e.column.dataField === "isprimary") {
                                            const data = grid.getVisibleRows();
                                            const selectedRowKey = e.rowIndex;
                                            $.each(data, function (rowIndex, row) {
                                                grid.cellValue(rowIndex, "isprimary", (rowIndex === selectedRowKey));
                                            });
                                        }
                                }
                            });

                            var customQuery = "";
                            $.ajax({
                                url: '/data/CustomQuery.json',
                                type: 'GET',
                                async: false,
                                success: function (response) {
                                    customQuery = response.baseOnExist["PDFList"];
                                },
                                error: function (exception) {
                                }
                            });

                            customQuery = passIdCustomQuery(customQuery, that.id, "Id");

                            myGrid.appendTo(container);

                            $("<div>").dxFileUploader({
                                multiple: true,
                                accept: "pdf/*",
                                selectButtonText: `Choose PDF documents`,
                                labelText: "",
                                uploadMode: "instantly",
                                uploadUrl: `/api/${that.ModelName}/AsyncUploadPDF?surveyId=${that.id}`,
                                showFileList: false,
                                onDropZoneEnter: function (e) {
                                    //$(e.dropZoneElement).addClass("highlight-drop-zone");
                                },
                                onDropZoneLeave: function (e) {
                                    //$(e.dropZoneElement).removeClass("highlight-drop-zone");
                                },
                                onBeforeSend: function (e) {
                                    e.request.setRequestHeader("X-Folder-Path", "Attachment");
                                },
                                onUploaded: function (e) {
                                    myGrid.dxDataGrid("instance").refresh();
                                }
                            }).appendTo(container);

                        });
                        popupInstance.show();
                    }
                }).css({ width: "200px" }).appendTo(upperWrapper);
                // Thanh tiêu đề hover
                const hoverBar = $("<div>")
                    .text("Comment")
                    .css({
                        backgroundColor: "#f5f5f5",
                        padding: "10px 15px",
                        fontWeight: "bold",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        cursor: "pointer",
                        width: "100%"
                    })
                    .appendTo(wrapper);
                // Container cho dxDataGrid (ẩn ban đầu, đè lên iframe)


                const gridContainer = $("<div>")
                    .attr("id", `commentGridContainer_${that.refFieldId}`)
                    .css({
                        display: "none",
                        position: "absolute",
                        top: "100%",
                        left: "0",
                        width: "100%",
                        zIndex: 999,
                        backgroundColor: "#fff",
                        boxShadow: "0px 4px 8px rgba(0,0,0,0.1)",
                        border: "1px solid #ccc",
                        padding: "10px",
                        borderRadius: "4px"
                    })
                    .appendTo(wrapper);

                hoverBar.on("mouseenter", function () {
                    gridContainer.stop(true, true).fadeIn(200);
                });

                wrapper.on("mouseleave", function () {
                    gridContainer.stop(true, true).fadeOut(200);
                });



                // Tạo Grid như cũ
                const gridOptionConfig = {
                    filterRefId: that.id,
                    filterRefField: "surveyId",
                    height: _defaultGridMinHeight,
                    instanceWorkflowFK: that.formOptions.Params.instanceWorkflowFK
                };

                const itemDataGrid = {
                    id: that.id,
                    dataField: "surveyId",
                    editorType: "dxDataGrid",
                    name: "SurveyMemoWorkflow",
                    caption: "",
                    ModelName: "SurveyMemoWorkflow",
                    gridOptionConfig: gridOptionConfig,
                    editorOptions: {}
                };

                const mGridOption = new SurveyMemoWorkflowGridOption("SurveyMemoWorkflow", "User", gridOptionConfig);
                //mGridOption.gridEditorOptions = that.isReadOnly
                //    ? {
                //        editing: {
                //            allowAdding: false,
                //            allowUpdating: false,
                //            allowDeleting: false
                //        }
                //    }
                //    : {
                //        editing: {
                //            mode: "cell",
                //            allowAdding: true,
                //            allowUpdating: true,
                //            allowDeleting: true
                //        }
                //    };

                itemDataGrid.gridOption = mGridOption;
                const filterBar = $("<div>").css({
                    marginBottom: "10px",
                    display: "flex",
                    justifyContent: "flex-end"
                }).appendTo(gridContainer);

                var gridInstance = $(`<div id='dataGrid_${itemDataGrid.name}_${itemDataGrid.id}' style="min-height: ${_defaultGridMinHeight}px;">`)
                    .dxDataGrid(mGridOption.getGridOptions(itemDataGrid.gridOption))
                    .appendTo(gridContainer);
                var GridDS = gridInstance.dxDataGrid("instance").getDataSource();

                var DS = new DevExpress.data.DataSource({
                    store: DevExpress.data.AspNet.createStore({
                        key: 'Id',
                        loadUrl: `api/SurveyMemoWorkflow/GetAll`,
                        paginate: true,
                        onBeforeSend: function (operation, ajaxSettings) {
                        }
                    })
                });


                DS.load().done(function (e) {
                    var filtered = e.filter(f => f.surveyId == that.id);

                    // Lấy tất cả ngày unique kèm timestamp gốc
                    const uniqueDates = [];
                    const seenDates = new Set();

                    filtered.forEach(item => {
                        const originalDate = new Date(item.submitDate);
                        const localDate = new Date(originalDate.getTime() + 7 * 60 * 60 * 1000);
                        const dateKey = localDate.toISOString().split('.')[0].replace('T', ' '); // giữ nguyên đến giây (bỏ milliseconds)

                        if (!seenDates.has(dateKey)) {
                            seenDates.add(dateKey);
                            uniqueDates.push({ submitDate: dateKey });
                        }
                    });
                    uniqueDates.sort((a, b) => new Date(b.submitDate) - new Date(a.submitDate));
                    var dateControl = $dateSelector.dxSelectBox({
                        placeholder: "Choose a date",
                        displayExpr: "submitDate",
                        valueExpr: "submitDate",
                        dataSource: uniqueDates,
                        value: uniqueDates.length > 0 ? uniqueDates[0].submitDate : null,
                        onSelectionChanged: function (e) {
                            // Filter theo đúng ngày giờ (toISOString dạng chuẩn)
                            const selectedDate = parseDateTime(e.selectedItem.submitDate);
                            const startDate = new Date(selectedDate);
                            startDate.setSeconds(0, 0); // Giây = 0, millisecond = 0

                            const endDate = new Date(selectedDate);
                            endDate.setSeconds(59, 999); // Giây = 59, millisecond = 999

                            GridDS.filter([[["submitDate", '>=', startDate], 'and', ["submitDate", '<=', endDate]]]);
                            GridDS.load();
                        },
                        onOpened: function (e) {
                            var DS = e.component.getDataSource();
                            DS.load();
                        }
                    });
                });
            };
            item.label.visible = false;
        }

        if (item.dataField == "document") {
            item.itemType = "simple";
            item.colSpan = 4;
            item.template = function (data, itemElement) {
                $("<iframe>")
                    .attr("id", `pdfViewer_${that.id}`)
                    .attr("src", "")
                    .css({
                        width: "100%",
                        height: "600px",
                        border: "1px solid #ccc"
                    })
                    .appendTo(itemElement);
            };
            item.label.visible = false;



            var progressBar = $("<div>").appendTo(that.container).dxLoadPanel({
                message: "Loading PDF...",
                visible: true,
                shading: true,
                showIndicator: false,
                onShown: function () {
                     setTimeout(function () {
                         progressBar.hide();
                     }, _timeoutPopup);
                 }
                //indicatorSrc: "https://js.devexpress.com/Content/data/loadingIcons/rolling.svg",
                //position: { of: `#form_SurveyWorkflow_Form_${that.id}_progressBar` }
            }).dxLoadPanel("instance");
            $(`#form_SurveyWorkflow_Form_${that.id}_progressBar`).addClass("dx-loading-ring"),
            progressBar.show();
            $.ajax({
                url: `/api/SurveyWorkflow/GetPdfFile?id=${that.id}`,
                method: "GET",
                xhrFields: {
                    responseType: "blob"
                },
                success: function (blob) {
                    const fileURL = URL.createObjectURL(blob);
                    $(`#pdfViewer_${that.id}`).attr("src", fileURL);
                    document.getElementById(`pdfViewer_${that.id}`).onload = function () {
                        progressBar.hide();
                        $(`#form_SurveyWorkflow_Form_${that.id}_progressBar`).removeClass("dx-loading-ring");
                    };
                },
                error: function (xhr, status, error) {
                    console.error("Error loading PDF:", error);
                }
            });
        }
        //if (item.name == "pdfViewing") {
        //    item.items.push({ dataField: "comment", caption: "Comment", editorType: "dxTextArea", colSpan: 1, colCount: 1, visible: true });
        //}
    }
}
var OutlineFormOption = class OutlineFormOption extends MFormOption {
    constructor(params) {
        super()
        this.parentOutlineId = 0;
        if (params.parentOutlineId) {
            this.parentOutlineId = params.parentOutlineId;
        }
        if (params.surveyTypeId) {
            this.surveyTypeId = params.surveyTypeId;
        }
    }
}

var OutlineForm = class OutlineForm extends MForm {
    constructor(id, childGridConfig, formConfig, mFormOption) {
        super(id, childGridConfig, formConfig, mFormOption)
        //this.parentOutlineId = 0;
        //if (formConfig.parentOutlineId)
        //    this.parentOutlineId = formConfig.parentOutlineId;
    }

    customizeForm(item) {
        var that = this;
        super.customizeForm(item);
        if (item.dataField == "surveyTypeId" || item.dataField == "parentId") {
            item.visible = false;
        }
        if (item.dataField == "content") {
            item.editorOptions.width = "100%";
        }
    }

    initDataNewForm() {
        var that = this;
        var newRowdata = {};
        newRowdata[`parentId`] = that.formOptions.parentOutlineId;
        newRowdata[`surveyTypeId`] = that.formOptions.surveyTypeId;
        var listFieldHasDefaultValue = that.fieldConfigs.filter(
            value => value.defaultValue
        );

        $(listFieldHasDefaultValue).each(function (i, field) {
            newRowdata[`${field.dataField}`] = Function(field.defaultValue);
        });

        that.formInstance.option("formData", newRowdata);
    }

}

var ExtFireExpExposuresForm = class ExtFireExpExposuresForm extends MForm {
    constructor(id, childGridConfig, formConfig, mFormOption) {
        super(id, childGridConfig, formConfig, mFormOption)
    }
    customizeItemLayout() {
        var itemLayout = [

            {
                itemType: "group",
                colCount: 1,
                cssClass: "header-group",
                items: [
                    {
                        itemType: "simple",
                        template: `<div class="header-text">
                    The separation distances from boundary fences between the insured premises and its immediate neighboring plants are summarized as follows:
                </div>`
                    }
                ]
            },
            // Khung chính giữa
            {
                itemType: "group",
                name: "mainGroup",
                colCount: 4, // 3 cột: Factory | Direction | Distance
                rowCount: 4,
                cssClass: "main-grid",
                items: [
                    {
                        itemType: "simple",
                        //template: `<div style="height: 175px;" class="factory-cell">XXXX factory</div>`,
                        cssClass: "vertical-group factory-cell",
                        colSpan: 1,
                        rowSpan: 4,
                        name: "factoryName",
                        editorType: "dxTextArea",
                        dataField: "factoryName",
                        label: { visible: false }
                    },
                    {
                        itemType: "group",
                        name: "directionLabel",
                        cssClass: "vertical-group",
                        editorOptions: {},
                        //items: [
                        //    { name: "directionLabelElement", editorType: "simple",  label: { text: "East", visible: true } },
                        //    { name: "directionLabelElement", editorType: "simple", label: { text: "North", visible: true } },
                        //    { name: "directionLabelElement", editorType: "simple", label: { text: "South", visible: true } },
                        //    { name: "directionLabelElement", editorType: "simple",  label: { text: "West", visible: true } },
                        //],
                        items: [
                            {
                                template: `
                                    <div class="direction-container" style="padding: 10px; height: 175px; display: flex; flex-direction: column; justify-content: space-between;">
                                        <div class="direction-item">East</div>
                                        <div class="direction-item">North</div>
                                        <div class="direction-item">South</div>
                                        <div class="direction-item">West</div>
                                    </div>
                                `
                            }
                        ],
                        colSpan: 1
                    },
                    {
                        itemType: "group",
                        name: "ExtContent",
                        colCount: 1,
                        colSpan: 1,
                        cssClass: "vertical-group",
                        items: [
                        ],
                    },
                    {
                        itemType: "group",
                        name: "ExtAreas",
                        colCount: 1,
                        colSpan: 1,
                        fClass: "vertical-group",
                        items: [
                        ],
                    }
                ]
            },
            // Phần ghi chú dưới cùng
            {
                itemType: "group",
                colCount: 1,
                cssClass: "footer-group",
                //items: [
                //    {
                //        itemType: "simple",
                //        template: `<div class="footer-text">
                //    External exposure according to types of third party’s risk is considered as ..........
                //</div>`
                //    }
                //]
                items: [
                    //{ name: "footerContent", editorType: "dxTextArea", dataField: "footerContent", label: { visible: false } }
                ],
            }

        ];
        return itemLayout;
    }
    customizeForm(item) {
        var that = this;
        if (that.isReadOnly)
            item.readOnly = that.isReadOnly;
        if (item.name != "directionLabelElement")
            item.label = { visible: false };
        if (item.formGroupName == "FormGroup@ExtAreas") {
            //item.editorOptions.placeholder = " > m ";
        }
    }
    groupingLayout(_formConfig, itemsArray, formInstance) {
        var groupedAction = groupItemsByFormGroupNameNonChild(itemsArray);
        itemsArray = groupedAction.remainingItems;
        let itemsArrayMainGroup = groupedAction.remainingItems.find(f => f.name == "mainGroup");
        var groupedItems = groupedAction.groupedItems;
        $.each(itemsArrayMainGroup.items, function (gIndex, gItem) {
            if (gItem.itemType == "group") {
                if (groupedItems[gItem.name]) {
                    gItem.items = groupedItems[gItem.name];
                }
            }

        });
        return itemsArray;
    }
}

var ParticipantListForm = class ParticipantListForm extends MForm {
    constructor(id, childGridConfig, formConfig, mFormOption) {
        super(id, childGridConfig, formConfig, mFormOption)
    }

    customizeItemLayout() {
        var itemLayout = [
            {
                itemType: "group",
                name: "ConferredWith",
                caption: "Conferred With",
                colCount: 1,
                items: [
                ],
                formItem: {
                    outline: { id: "52,106" }
                }
            },
            {
                itemType: "group",
                name: "AccompaniedBy",
                caption: "Accompanied By",
                colCount: 1,
                items: [
                ],
                formItem: {
                    outline: { id: "53,107" }
                }
            },
        ];
        return itemLayout;
    }


    customizeForm(item) {
        var that = this;

        if (item.name === "ConferredWith") {
            var gridOptionConfig = {
                container: `dataGrid_ParticipantList_ConferredWith_${that.refFieldId}`,
                filterRefId: that.refFieldId,
                filterRefField: "surveyId",
                filterRefId2: 66,
                filterRefField2: "sideId",
                clientName: that.formOptions?.clientName ? that.formOptions.clientName : "",
                draftGuid: that.formOptions?.draftGuid ? that.formOptions.draftGuid : null,
                visibleColumns: ["personName", "personDepartment", "sideOrder", "sideName"],
                summary: {
                    groupItems: [
                        {
                            column: "sideOrder",
                            summaryType: "count",
                            displayFormat: "",
                            alignByColumn: true
                        }
                    ]
                }
            };

            var mGridOption = new ConferredWithGridOption("ParticipantList", 'User', gridOptionConfig);
            mGridOption.gridEditorOptions = {
                editing: {
                    mode: "cell",
                    allowAdding: true,
                    allowUpdating: true,
                    allowDeleting: true
                }
            };
            if (that.isReadOnly)
                mGridOption.gridEditorOptions = {
                    editing: {
                        mode: "cell",
                        allowAdding: false,
                        allowUpdating: false,
                        allowDeleting: false
                    }
                };
            item.isDefaultImage = false;
            item.items.push({
                id: that.refFieldId,
                dataField: "participantList",
                editorType: "dxDataGrid",
                name: "ParticipantList",
                label: {
                    text: "Conferred With",
                    visible: true
                },
                caption: "Conferred With",
                ModelName: "ParticipantList",
                gridOptionConfig: gridOptionConfig,
                gridOption: mGridOption,
                editorOptions: {}
            })
            item.template = function (data, itemElement) {
                createAccordionGroup(item, itemElement, that);
            }
        }

        if (item.name === "AccompaniedBy") {

            var gridOptionConfig = {
                filterRefId: that.refFieldId,
                container: `dataGrid_ParticipantList_AccompaniedBy_${that.refFieldId}`,
                filterRefField: "surveyId",
                filterRefId2: 67,
                filterRefField2: "sideId",
                visibleColumns: ["personName", "personDepartment", "sideOrder", "sideName"],
                summary: {
                    groupItems: [
                        {
                            column: "sideOrder",
                            summaryType: "count",
                            displayFormat: "",
                            alignByColumn: true
                        }
                    ]
                }
            };
            var mGridOption = new AccompaniedByGridOption("ParticipantList", 'User', gridOptionConfig);
            mGridOption.gridEditorOptions = {
                editing: {
                    mode: "cell",
                    allowAdding: true,
                    allowUpdating: true,
                    allowDeleting: true
                }
            };
            if (that.isReadOnly)
                mGridOption.gridEditorOptions = {
                    editing: {
                        mode: "cell",
                        allowAdding: false,
                        allowUpdating: false,
                        allowDeleting: false
                    }
                };

            item.isDefaultImage = false;
            item.items.push({
                id: that.refFieldId,
                dataField: "participantList",
                editorType: "dxDataGrid",
                name: "ParticipantList",
                label: {
                    text: "Accompanied By",
                    visible: true
                },
                caption: "Accompanied By",
                ModelName: "ParticipantList",
                gridOptionConfig: gridOptionConfig,
                gridOption: mGridOption,
                editorOptions: {},

            })

            item.template = function (data, itemElement) {
                createAccordionGroup(item, itemElement, that);
            }
        }

    }
}

var AppendixForm = class AppendixForm extends MForm {
    constructor(id, childGridConfig, formConfig) {
        super(id, childGridConfig, formConfig)
    }

}
var REOpinionForm = class REOpinionForm extends MForm {
    constructor(id, childGridConfig, formConfig) {
        super(id, childGridConfig, formConfig)
    }


    callApi(apiMethod, dataInput, isClose) {
        try {
            var that = this;
            var efName = this.ModelName;

            var thatOnScheme = { ...that };

            thatOnScheme.ModelName = "Survey";
            var url = buildApiUrl(apiMethod, thatOnScheme);

            var dataVar = null;
            //var httpMethod = this.buildHttpMethod(apiMethod);
            if (dataInput) {
                dataVar = { values: dataInput.values };
                if (dataInput.key) {
                    dataVar = { key: dataInput.key, values: dataInput.values };
                }
                if (apiMethod == "CustomQuery") {
                    dataVar = JSON.stringify(dataInput.customQuery);
                }
            }


            var ajaxOptions = {
                url: url,
                headers: {
                    'Content-Type': apiMethod == "CustomQuery" ? "application/json" : 'application/x-www-form-urlencoded; charset=UTF-8'
                },
                type: (apiMethod == "GetSingle") || (apiMethod == "GetFKMany") ? "GET" : (apiMethod == "CustomQuery" ? "POST" : apiMethod),
                data: dataVar,
                async: false,
                error: function (e) {
                    if (e.responseText) {
                        if (apiMethod != "GetFKMany")
                            appErrorHandling(e.responseText, e);
                        else
                            console.warn(` FormCallApiException: ${url} endpoint not exist`);
                    }
                    else
                        appErrorHandling("callApi Form fail!", e);
                },
                complete: function (e) {
                    //không chèn thông báo tại đây
                    //appLoadingPanel.hide(); // hide loading...
                }
            };

            apiMethod = (apiMethod == "GetSingle") || (apiMethod == "GetFKMany" || (apiMethod == "CustomQuery")) ? "GET" : apiMethod;
            var onSuccess = null;
            switch (apiMethod) {
                case 'GET':
                    onSuccess = that.getSuccess.bind(this);
                    break;
                case 'POST':
                    onSuccess = that.postSuccess.bind(this);
                    break;
                case 'PUT':
                    onSuccess = that.putSuccess.bind(this);
                    break;
                case 'DELETE':
                    onSuccess = that.deleteSuccess.bind(this);
                    break;
                case 'CLONE':
                    onSuccess = that.cloneSuccess.bind(this);
                    break;
            }

            ajaxOptions.success = function (data) {
                if (dataInput.customQuery)
                    data = data.find(f => f.id == that.id);
                onSuccess(data);


                if (isClose) {
                    that.closeForm(efName);
                }


            };


            $.ajax(ajaxOptions).fail(function (jqXHR, statusText, errorThrown) {
                appNotify({ message: `${errorThrown}. ${jqXHR.responseText}`, type: 'warning' });
            });
        } catch (err) {
            appErrorHandling('Library error: call MForm.callApi() was failed.', err);
            return;
        }
    }


    customizeForm(item) {
        var that = this;
        item.editorOptions.height = _defaultHtmlEditorHeight;
        item.editorOptions.width = _defaultHtmlEditorWidth;
        item.template = function (data, itemElement) {
            //itemElement.css({
            //    display: "flex",
            //    alignItems: "center"
            //});
            item.editorOptions.label = {
                visible: true
            };
            item.editorOptions.id = that.id;
            item.editorOptions.value = getHtmlEditorBeforeRender(item, that);
            item.editorOptions.onValueChanged = function (e) {
                data.component.updateData(item.dataField, e.value);
            }


            createEditor(item, itemElement, $("<div>"), item.editorOptions);
            var defaultImageUploader = { ...item.editorOptions };
            defaultImageUploader.editorType = "dxFileUploader";
            //if (that.fieldByOutline.find(f => f.dataField == item.dataField)) {
            //defaultImageUploader.outline = that.fieldByOutline.find(f => f.dataField == item.dataField).outlineInstance[0];
            defaultImageUploader.outline = item.outlineObject;
            var imageChildProps = customChildProps(defaultImageUploader, that);
            var imageFieldInstance = { ...item };
            imageFieldInstance.editorType = "dxFileUploader";
            imageFieldInstance.outline = defaultImageUploader.outline;
            imageChildProps.refFieldId = that.id;
            if (defaultImageUploader.outline) {
                imageChildProps.outlineId = defaultImageUploader.outline.id;
                createEditor(imageFieldInstance, itemElement, $("<div>"), imageChildProps);
            }
            //}

            //$("<span>").text("").css({
            //    marginLeft: "5px"
            //}).appendTo(itemElement);
            return itemElement;
        }
    }

}

var OverViewFormOption = class OverViewFormOption extends MFormOption {
    constructor(params) {
        super()
        this.OverViewAttachmentId = 0;
        if (params) {
            this.Params = params;
        }
        if (params.overViewAttachmentId) {
            this.OverViewAttachmentId = params.overViewAttachmentId;
        }
    }
}

var OverviewForm = class OverviewForm extends MForm {
    constructor(id, childGridConfig, formConfig, formOptions) {
        super(id, childGridConfig, formConfig, formOptions)
        this.ClientId = 0;

    }
    moreActionFromSelectedChangeSelectBox(e, field, formConfig) {
        var that = this;
        var formData = formConfig.formInstance.option("formData");
        if (field.dataField == "surveyTypeId" && formConfig.id == 0 && !formData["mainOutlines"] && !formData["cloneSurveyId"]) {
            var passingParams = { pageNum: 0 };
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
                        url: `api/SurveyOutlineOptions/GetMainOutLineList/${formConfig.id}/${e.value}`,
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
                        //selectedItems: itemArrays,
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
                            that.formOptions.Params.isAddOutline = true;
                            const selectedItems = listInstance.option("selectedItems");
                            var formData = formConfig.formInstance.option("formData");
                            formData["mainOutlines"] = selectedItems;
                            formConfig.formInstance.option("formData", formData);
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

    customizeForm(item) {
        var that = this;
        var listInstance = new Object();
        super.customizeForm(item);
        if (item.dataField == "grantSurvey") {
            if (that.id == 0)
                item.visible = false;
        }
        if (item.dataField == "mainOutlines") {
            if (that.formOptions.Params.isAddOutline) {
                if (!that.formOptions.Params.isReadOnly) {
                    item.template = function (component, itemElement) {
                        $("<div>").dxButton({
                            text: "Change",
                            stylingMode: "contained",
                            type: "normal",
                            onClick: function () {
                                var popupInstance = $(`#outlinePopup`).dxPopup({
                                    width: "40%",
                                    height: "70%",
                                    showTitle: true,
                                    title: `Choose more outlines of survey`,
                                    dragEnabled: false,
                                    closeOnOutsideClick: true,
                                    contentTemplate: function (contentElement) {
                                        var itemArrays = [];
                                        $.ajax({
                                            url: `api/SurveyOutlineOptions/GetMainOutLineList/${that.id}/${that.formOptions.Params.outlineForm.surveyTypeId}`,
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
                                        }).appendTo(contentElement).dxList("instance");

                                        return contentElement;
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
                                                requestPassingData.SurveyId = that.id;
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
                        }).appendTo(itemElement);
                        return itemElement;
                    }
                }
            }
            else {
                item.visible = false;
            }
        }

        if (item.dataField == "overViewAttachmentId") {
            var _cacheOutlines = [];
            if (_cacheCompanyData)
                _cacheOutlines = _cacheCompanyData.find(f => f.table == "Outline").rows;
            var outlineObject = _cacheOutlines.find(f => f.content == "OVERVIEW");
            item.template = function (data, itemElement) {

                const $container = $(`<div id='imageOverViewPreview_${that.id}' class='imagePreview' style='display: flex; flex-wrap: wrap'>`)
                    .appendTo(itemElement);


                //$(`<div id='imageOverViewPreview_${that.id}' class='imagePreview' style='display: flex; flex-wrap: wrap; gap: 10px;top: 10px'>`).appendTo(itemElement);
                if (that.OverViewAttachmentId != 0)
                    $.ajax({
                        url: `/api/Attachment/GetOverviewAttachment/${that.formOptions.OverViewAttachmentId}`, // Replace with your actual API
                        method: 'GET',
                        success: function (imageInstance) {
                            if (imageInstance != null || imageInstance != undefined) {
                                if (imageInstance.id != 0) {
                                    imageInstance.outline = outlineObject;
                                    var uint8Array = new Uint8Array(imageInstance.fileData);
                                    var blob = new Blob([uint8Array], { type: imageInstance.type });
                                    var url = URL.createObjectURL(blob);
                                    var thumbUrl = `https://${window.location.host}/api/Attachment/Browse/${imageInstance.attachmentGuid}`;
                                    item.attachment = imageInstance;
                                    const $imageContainer = $("<div>").css({ position: 'relative', width: '100%', height: '100%', margin: '5px' });
                                    const $imageLink = $("<a>")
                                        .attr("href", thumbUrl)
                                        .attr("target", "_blank")
                                        .appendTo($imageContainer);

                                    $("<img>")
                                        .attr("src", url)
                                        .css({ width: '100%', height: 'auto', objectFit: 'cover', borderRadius: '5px' })
                                        .appendTo($imageLink);

                                    $imageContainer.appendTo($(`#imageOverViewPreview_${that.id}`));
                                }
                            }
                        }
                    });


                var fileUploader = $("<div>").dxFileUploader({
                    multiple: false,
                    accept: "image/*",
                    labelText: "",
                    uploadMode: "instantly",
                    uploadUrl: `/api/Survey/UpdateOverviewPicture?folder=SitePictures&surveyId=${that.id}&outlineId=${outlineObject.id}`,
                    showFileList: true,
                    onUploaded: function (e) {
                        var fr = new FileReader();
                        fr.readAsArrayBuffer(e.file);
                        fr.onload = function (event) {
                            var arrayBuffer = fr.result;
                            var byteArray = new Uint8Array(arrayBuffer);
                            var blob = new Blob([byteArray], { type: e.file.type });
                            var url = URL.createObjectURL(blob);
                            if (e.file && e.file.type.startsWith("image/")) {
                                const img = new Image();
                                img.src = url;
                                img.onload = function () {
                                    e.file.width = img.width;
                                    e.file.height = img.height;
                                };
                            }
                            const $imageContainer = $("<div>").css({ position: 'relative', width: '100%', height: '100%', margin: '5px' });
                            const $imageLink = $("<a>")
                                .attr("href", url)
                                .attr("target", "_blank")
                                .appendTo($imageContainer);

                            $("<img>")
                                .attr("src", url)
                                .css({ width: '100%', height: 'auto', objectFit: 'cover', borderRadius: '5px' })
                                .appendTo($imageLink);

                            $imageContainer.appendTo($(`#imageOverViewPreview_${that.id}`));
                        }
                    }

                }).css({
                    display: "flex",
                    marginRight: "10%",
                }).appendTo(itemElement);

                //$("<div>")
                //    .text("Supported formats: JPG, PNG, GIF")
                //    .css({
                //        fontSize: "12px",
                //        color: "gray",
                //        whiteSpace: "nowrap"
                //    })
                //    .appendTo(itemElement);
                $("<div>")
                    .text("Minimum image size recommended: > 1MB, dimension: 1200 x 800")
                    .css({
                        fontSize: "12px",
                        color: "red",
                        whiteSpace: "nowrap"
                    })
                    .appendTo(itemElement);

            };
            if (that.id != 0)
                item.visible = true;
            else
                item.visible = false;
        }
        var editorOptions = {
            width: _defaultFormFieldWidth
        };

        if (item.dataField === "surveyedByAccountName") {
            var configData = fetchConfigurationData("employee");
            $.each(configData.getScheme, function (schIndex, schCol) {
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
            makeDropDownBoxOptions(item, "employee", "Select an employee", "accountName", "fullName");
            var checkCustomQueryByModel = new Object();
            checkCustomQueryByModel.customQuery = `SELECT * FROM Employee`;
            item.editorOptions.dataSource = new DevExpress.data.CustomStore({
                key: "accountName",
                load: function (loadOptions) {
                    return $.ajax({
                        url: `/api/Employee/ExecuteCustomQuery`,
                        method: "POST",
                        contentType: "application/json",
                        data: JSON.stringify(checkCustomQueryByModel.customQuery)
                    });
                }, byKey: function (key) {
                    return $.ajax({
                        url: `/api/Employee/DropDownLookupCustomQuery?key=${encodeURIComponent(key)}`,
                        method: "POST",
                        contentType: "application/json",
                        data: JSON.stringify(checkCustomQueryByModel.customQuery)
                    }).then(function (result) {
                        return Array.isArray(result) ? result[0] : result;
                    });
                },
            });

            //item.lookup = {
            //    dataSource: item.editorOptions.dataSource,
            //    displayExpr: "fullName",
            //    valueExpr: 'fullName'
            //};
            //item.editorOptions.displayExpr= 'fullName';
            //item.editorOptions.valueExpr= 'fullName';
            item.editorOptions.contentTemplate = function (e) {
                const $dataGrid = $("<div>").dxDataGrid({
                    dataSource: item.editorOptions.dataSource,
                    columns: [
                        { dataField: "fullName", caption: "Full Name" },
                        { dataField: "department", caption: "Department" }
                    ],
                    filterRow: { visible: true },
                    selectionMode: 'all',
                    selection: {
                        mode: "single" // Chọn một dòng duy nhất
                    },
                    width: "100%",
                    height: "100%",
                    allowItemDeleting: false,
                    showSelectionControls: true,
                    onSelectionChanged: function (selectedItems) {
                        //var keys = selectedItems.selectedRowKeys,
                        //    hasSelection = keys.length;
                        //if (hasSelection) {
                        //    e.component.selectedItem = selectedItems.selectedRowsData;
                        //    const selectedName = selectedItems.selectedRowsData[0]["fullName"] || "";
                        //    e.component.option("value", selectedName);
                        //    e.component.option("displayValue", selectedName);
                        //    that.formInstance.updateData("department", selectedItems.selectedRowsData[0]?.department || "")
                        //    that.formInstance.updateData("surveyedByAccountName", selectedItems.selectedRowsData[0]?.accountName || "")
                        //}
                        var hasSelection = selectedItems.selectedRowKeys.length > 0;
                        if (hasSelection) {
                            const selectedRow = selectedItems.selectedRowsData[0];
                            const selectedKey = selectedRow.accountName; // Giả sử key là id

                            e.component.option("value", selectedKey);
                            that.formInstance.updateData("department", selectedRow.department || "");
                            that.formInstance.updateData("surveyedBy", selectedRow.fullName || "");
                        }

                    },
                    columnAutoWidth: true,

                });
                e.component.on("valueChanged", function (args) {
                    if (args.value != null) {
                        e.component.close();
                    }
                });
                return $dataGrid;
            };
        }
        //if (item.dataField === "clientName") {
        if (item.dataField === "clientId") {
            var configData = fetchConfigurationData("client");
            $.each(configData.getScheme, function (schIndex, schCol) {
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
            makeDropDownBoxOptions(item, "client", "Select a client", "id", "clientName");
            //item.lookup = {
            //    dataSource: item.editorOptions.dataSource,
            //    displayExpr: "fullName",
            //    valueExpr: 'fullName'
            //};
            //item.editorOptions.displayExpr= 'fullName';
            //item.editorOptions.valueExpr= 'fullName';
            var checkCustomQueryByModel = new Object();
            var customQuery = "";
            $.ajax({
                url: '/data/CustomQuery.json',
                type: 'GET',
                async: false,
                success: function (response) {
                    customQuery = response.baseOnExist["ClientOverview"];
                },
                error: function (exception) {
                }
            });

            var querys = $.getJSON(window.location.host + "/data/CustomQuery.json");
            //checkCustomQueryByModel.customQuery = `SELECT c.Id, c.ClientCode , c.ClientName, l.LocationAddress AS ClientAddress, l.ClientId AS ClientId, l.Id AS LocationId
            //                                        FROM Client c
            //                                        left join [Location] l ON l.ClientId = c.Id WHERE l.Id IS NOT NULL AND c.Deleted = 0`;
            checkCustomQueryByModel.customQuery = customQuery;
            item.editorOptions.dataSource = new DevExpress.data.CustomStore({
                key: "id",
                load: function (loadOptions) {
                    return $.ajax({
                        url: `/api/Client/ExecuteCustomQuery`,
                        method: "POST",
                        contentType: "application/json",
                        data: JSON.stringify(checkCustomQueryByModel.customQuery)
                    });
                }, byKey: function (key) {
                    //return $.ajax({
                    //    url: `/api/Client/ExecuteCustomQuery`,
                    //    method: "POST",
                    //    contentType: "application/json",
                    //    data: JSON.stringify(checkCustomQueryByModel.customQuery)
                    //});
                    return $.ajax({
                        url: `/api/Client/DropDownLookupCustomQuery?key=${encodeURIComponent(key)}`,
                        method: "POST",
                        contentType: "application/json",
                        data: JSON.stringify(checkCustomQueryByModel.customQuery)
                    }).then(function (result) {
                        return Array.isArray(result) ? result[0] : result;
                    });
                },
            });


            item.editorOptions.contentTemplate = function (e) {
                const $dataGrid = $("<div>").dxDataGrid({
                    dataSource: item.editorOptions.dataSource,
                    columns: [
                        { dataField: "clientCode", caption: "Client Code" },
                        { dataField: "clientName", caption: "Client Name" },
                        { dataField: "clientAddress", caption: "Client Address" },
                        { dataField: "locationAddressName", caption: "Location Address Name" },


                    ],
                    filterRow: { visible: true },
                    selectionMode: 'all',
                    selection: {
                        mode: "single" // Chọn một dòng duy nhất
                    },
                    width: "100%",
                    height: "100%",
                    allowItemDeleting: false,
                    showSelectionControls: true,
                    onSelectionChanged: function (selectedItems) {
                        //var keys = selectedItems.selectedRowKeys,
                        //    hasSelection = keys.length;
                        //if (hasSelection) {
                        //    e.component.selectedItem = selectedItems.selectedRowsData;

                        //    //const selectedName = selectedItems.selectedRowsData[0]["clientName"] || "";
                        //    //e.component.option("value", selectedName);
                        //    //e.component.option("displayValue", selectedName);
                        //    //that.formInstance.updateData("clientName", selectedItems.selectedRowsData[0]["clientName"] || "");
                        //    that.formInstance.updateData("locationAddress", selectedItems.selectedRowsData[0]?.clientAddress || "");
                        //    that.formInstance.updateData("clientCode", selectedItems.selectedRowsData[0]?.clientCode || "");
                        //    that.formInstance.updateData("locationId", selectedItems.selectedRowsData[0]?.id || 0);
                        //}
                        //var keys = selectedItems.selectedRowKeys,
                        //    hasSelection = keys.length;
                        //if (hasSelection) {
                        //    e.component.selectedItem = selectedItems.selectedRowsData;
                        //    e.component.option("displayValue", selectedItems.selectedRowsData[0][e.component.option("displayExpr")]);
                        //    e.component.option("value", selectedItems.selectedRowsData[0][e.component.option("displayExpr")]);

                        //}
                        var hasSelection = selectedItems.selectedRowKeys.length > 0;
                        if (hasSelection) {
                            const selectedRow = selectedItems.selectedRowsData[0];
                            const selectedKey = selectedRow.clientId; // Giả sử key là id
                            //e.component.option("value", selectedRow.clientName);
                            e.component.option("value", selectedItems.selectedRowKeys[0]);

                            that.formInstance.updateData("clientName", selectedRow.clientName || "");
                            that.formInstance.updateData("locationAddress", selectedRow.clientAddress || "");
                            that.formInstance.updateData("clientCode", selectedRow.clientCode || "");
                            that.formInstance.updateData("locationId", selectedRow.locationId || 0);
                        }

                    },
                    columnAutoWidth: true,

                });
                e.component.on("valueChanged", function (args) {
                    if (args.value != null) {
                        e.component.close();
                    }
                });
                return $dataGrid;
            };
        }
    }

    moreActionFromSelectedChangeDropDown(item, field, formInstance) {
        var that = this;
        if (field.dataField == "clientId") {
            //formInstance.updateData("companyName", item.selectedRowsData[0]["clientName"]);
            that.ClientId = item.selectedRowsData[0]["id"];
            //var locationControl = formInstance.getEditor("locationId")
            //var DS = locationControl.option("dataSource");
            //var customFilter = [["clientId", "=", that.ClientId]];
            //DS.load().done((e) => {
            //formInstance.updateData("locationId", e[0].id);
            //formInstance.updateData("locationAddress", e[0]["locationAddress"]);
            //});
        }

        if (field.dataField == "locationId")
            formInstance.updateData("locationAddress", item.selectedRowsData[0]["locationAddress"]);

    }
    moreActionOpenDropDown(e, dataSource, field) {
        var that = this;
        if (field.dataField == "clientId") {
            dataSource.load();
        }

        if (field.dataField == "locationId") {
            var customFilter = ["clientId", "=", that.ClientId];
            dataSource.filter(customFilter);
            dataSource.load();
        }
    }

    callApi(apiMethod, dataInput, isClose) {
        try {
            var that = this;
            var efName = this.ModelName;

            var thatOnScheme = { ...that };

            thatOnScheme.ModelName = "Survey";
            var url = buildApiUrl(apiMethod, thatOnScheme);

            var dataVar = null;
            //var httpMethod = this.buildHttpMethod(apiMethod);
            if (dataInput) {
                dataVar = { values: dataInput.values };
                if (dataInput.key) {
                    dataVar = { key: dataInput.key, values: dataInput.values };
                }
                if (apiMethod == "CustomQuery") {
                    dataVar = JSON.stringify(dataInput.customQuery);
                }
            }


            var ajaxOptions = {
                url: url,
                headers: {
                    'Content-Type': apiMethod == "CustomQuery" ? "application/json" : 'application/x-www-form-urlencoded; charset=UTF-8'
                },
                type: (apiMethod == "GetSingle") || (apiMethod == "GetFKMany") ? "GET" : (apiMethod == "CustomQuery" ? "POST" : apiMethod),
                data: dataVar,
                async: false,
                error: function (e) {
                    if (e.responseText) {
                        if (apiMethod != "GetFKMany")
                            appErrorHandling(e.responseText, e);
                        else
                            console.warn(` FormCallApiException: ${url} endpoint not exist`);
                    }
                    else
                        appErrorHandling("callApi Form fail!", e);
                },
                complete: function (e) {
                    //không chèn thông báo tại đây
                    //appLoadingPanel.hide(); // hide loading...
                }
            };

            apiMethod = (apiMethod == "GetSingle") || (apiMethod == "GetFKMany" || (apiMethod == "CustomQuery")) ? "GET" : apiMethod;
            var onSuccess = null;
            switch (apiMethod) {
                case 'GET':
                    onSuccess = that.getSuccess.bind(this);
                    break;
                case 'POST':
                    onSuccess = that.postSuccess.bind(this);
                    break;
                case 'PUT':
                    onSuccess = that.putSuccess.bind(this);
                    break;
                case 'DELETE':
                    onSuccess = that.deleteSuccess.bind(this);
                    break;
                case 'CLONE':
                    onSuccess = that.cloneSuccess.bind(this);
                    break;
            }

            ajaxOptions.success = function (data) {
                if (dataInput.customQuery)
                    data = data.find(f => f.id == that.id);
                onSuccess(data);


                if (isClose) {
                    that.closeForm(efName);
                }

            };


            $.ajax(ajaxOptions).fail(function (jqXHR, statusText, errorThrown) {
                appNotify({ message: `${errorThrown}. ${jqXHR.responseText}`, type: 'warning' });
            });
        } catch (err) {
            appErrorHandling('Library error: call MForm.callApi() was failed.', err);
            return;
        }
    }
}
var OccupancyForm = class OccupancyForm extends MForm {
    constructor(id, childGridConfig, formConfig, mFormOption) {
        super(id, childGridConfig, formConfig, mFormOption)
    }

    //customizeForm(item) {
    //    var that = this;
    //    super.customizeForm(item);
    //    var editorOptions = { ...item.editorOptions };

    //    if (item.name === "SpecialHazardsGroup") {
    //        $.each(item.items, function (i, itemChild) {
    //            itemChild.label.visible = false;
    //        });

    //        item.template = function (data, itemElement) {
    //            createAccordionGroup(item, itemElement, that);
    //        }
    //    }

    //    if (item.name === "PowerUtilitiesGroup") {
    //        $.each(item.items, function (i, itemChild) {
    //            itemChild.label.visible = false;
    //        });

    //        //item.items.push({
    //        //    id: that.refFieldId,
    //        //    dataField: "occupancyDetail",
    //        //    editorType: "dxDataGrid",
    //        //    name: "OccupancyDetail_Utility",
    //        //    label: {
    //        //        text: "Power and utilities of the premises could be briefly listed as follows",
    //        //        visible: true
    //        //    },
    //        //    caption: "",
    //        //    ModelName: "OccupancyDetail",
    //        //    gridOptionConfig: {
    //        //        filterRefId: that.refFieldId,
    //        //        filterRefField: "surveyId",
    //        //        filterRefId2: null,
    //        //        filterRefField2: "indGasSupCategoryTypeId",
    //        //        visibleColumns: ["utilityTypeId", "quantity", "technicalSpec", "installedPosition"]
    //        //    },
    //        //    editorOptions: {}
    //        //})


    //        //item.items.push({
    //        //    dataField: "utilityContent",
    //        //    editorType: "empty",
    //        //    name: "utilityContent",
    //        //    label: {
    //        //        text: groupContent,
    //        //        visible: true
    //        //    },
    //        //    caption: "UtilityContent",
    //        //    editorOptions: {}
    //        //})

    //        var gridOptionConfig = {
    //            filterRefId: that.refFieldId,
    //            filterRefField: "surveyId",
    //            filterRefId2: null,
    //            filterRefField2: "utilityTypeId",
    //            visibleColumns: ["indGasSupCategoryTypeId", "indGasSupTypeId", "capacity", "quantity", "installedPosition"],
    //        };

    //        var mGridOption = new MGridOption("OccupancyDetail", "User", gridOptionConfig);
    //        mGridOption.gridEditorOptions = {};
    //        if (that.isReadOnly)
    //            mGridOption.gridEditorOptions = {
    //                allowAdding: false,
    //                allowUpdating: false,
    //                allowDeleting: false
    //            };

    //        item.items.push({
    //            id: that.refFieldId,
    //            dataField: "occupancyDetail",
    //            editorType: "dxDataGrid",
    //            name: "OccupancyDetail_IndustrialGasSupply",
    //            label: {
    //                text: "Storage of flammables/ combustibles onsite are as follows",
    //                visible: true
    //            },
    //            caption: "",
    //            ModelName: "OccupancyDetail",
    //            //gridOptionConfig: {
    //            //    filterRefId: that.refFieldId,
    //            //    filterRefField: "surveyId",
    //            //    filterRefId2: null,
    //            //    filterRefField2: "utilityTypeId",
    //            //    visibleColumns: ["indGasSupCategoryTypeId", "indGasSupTypeId", "capacity", "quantity", "installedPosition"],
    //            //},
    //            gridOptionConfig: gridOptionConfig,
    //            gridOption: mGridOption,
    //            editorOptions: {}
    //        })


    //        item.template = function (data, itemElement) {

    //            createAccordionGroup(item, itemElement, that);
    //            //$(`<div>`).appendTo(itemElement);
    //            //$(`<div>`).text("Hello").appendTo(itemElement);
    //        }
    //    }

    //    if (item.name === "ProductionProcessGroup") {
    //        item.isDefaultImage = false;

    //        item.template = function (data, itemElement) {
    //            createAccordionGroup(item, itemElement, that);
    //        }
    //    }
    //}

    //customizeItemLayout() {
    //    var itemLayout = [
    //        {
    //            itemType: "group",
    //            name: "ProductionProcessGroup",
    //            colCount: 1,
    //            items: [
    //            ],
    //            formItem: {
    //                outline: { id: "29" }
    //            }
    //        },
    //        {
    //            itemType: "group",
    //            name: "SpecialHazardsGroup",
    //            colCount: 1,
    //            items: [
    //            ],
    //            formItem: {
    //                outline: { id: "45" }
    //            }
    //        },
    //        {
    //            itemType: "group",
    //            name: "PowerUtilitiesGroup",
    //            colCount: 1,
    //            items: [
    //            ],
    //            formItem: {
    //                outline: { id: "30" }
    //            }
    //        }
    //    ];
    //    return itemLayout;
    //}


}

var ClientForm = class ClientForm extends MForm {
    constructor(id, childGridConfig, formConfig, mFormConfig) {
        super(id, childGridConfig, formConfig, mFormConfig)
    }

}
var PNAspectForm = class PNAspectForm extends MForm {
    constructor(id, childGridConfig, formConfig) {
        super(id, childGridConfig, formConfig)
    }
    customFormOrgData(data) {
        var result = data.reduce((acc, item) => {
            if (item.posNegTypeId === 18) {
                acc.posAspecContent = item.posNegContent;
            } else if (item.posNegTypeId === 21) {
                acc.negAspecContent = item.posNegContent;
            }
            return acc;
        }, {});
        return result;
    }
}

var ConstructionForm = class ConstructionForm extends MForm {
    constructor(id, childGridConfig, formConfig, mFormConfig) {
        super(id, childGridConfig, formConfig, mFormConfig)
    }

    //customizeItemLayout() {
    //    var itemLayout = [
    //        {
    //            itemType: "group",
    //            name: "ConstructionGroup",
    //            caption: "Construction",
    //            colCount: 1,
    //            items: [
    //            ],
    //            formItem: {
    //                outline: { id: "25,88" }
    //            }
    //        }
    //    ];
    //    return itemLayout;
    //}

    //customizeForm(item) {
    //    super.customizeForm(item);
    //    var that = this;

    //    if (item.itemType === "group") {
    //        $.each(item.items, function (i, itemChild) {
    //            var editorOptions = {
    //                width: _defaultFormFieldWidth
    //            };
    //            if (itemChild.dataField == "constructionBuildingId") {
    //                var gridOptionConfig = {
    //                    filterRefId: that.refFieldId,
    //                    filterRefField: "surveyId"
    //                };
    //                itemChild.id = that.id;
    //                itemChild.ModelName = "ConstructionBuilding";
    //                itemChild.gridOptionConfig = gridOptionConfig;

    //                itemChild.editorType = "dxDataGrid";
    //                itemChild.name = "ConstructionBuilding";

    //                var mGridOption = new MGridOption("ConstructionBuilding", "User", gridOptionConfig);
    //                mGridOption.gridEditorOptions = {};
    //                if (that.isReadOnly)
    //                    mGridOption.gridEditorOptions = {
    //                        allowAdding: false,
    //                        allowUpdating: false,
    //                        allowDeleting: false
    //                    };

    //                itemChild.gridOption = mGridOption;

    //            }
    //            if (itemChild.editorType == "dxTextArea") {
    //                itemChild.label.visible = false;
    //            }
    //            //if (itemChild.dataField === "layoutSiteArea" || itemChild.dataField === "layoutContructionArea") {
    //            //    editorOptions.width = 100;
    //            //    itemChild.template = function (data, itemElement) {
    //            //        itemElement.css({
    //            //            display: "flex",
    //            //            alignItems: "center"
    //            //        });
    //            //        editorOptions.value = data.component.option("formData")[itemChild.dataField],
    //            //            editorOptions.onValueChanged = function (e) {
    //            //                data.component.updateData(itemChild.dataField, e.value);
    //            //            }
    //            //        createEditor(itemChild, itemElement, $("<div>"), editorOptions);
    //            //        $("<span>").text(" m2").css({
    //            //            marginLeft: "5px"
    //            //        }).appendTo(itemElement);
    //            //    }
    //            //}
    //            itemChild.label.visible = false;
    //        });
    //        item.template = function (data, itemElement) {
    //            createAccordionGroup(item, itemElement, that);
    //        }
    //    }


    //}
    customizeForm(item) {
        var that = this;
        super.customizeForm(item);
        var editorOptions = { ...item.editorOptions };

        if (isAccordionGroupSupportControls(item, editorOptions, that)) {
            item.template = function (data, itemElement) {
                editorOptions.onInitialized = function (e) {
                    e.component.option("value", data.component.option("formData")[item.dataField]);
                    $(e.element).on("dblclick", function () {
                        e.component.option("value", e.component.option("placeholder"));
                    });
                }
                editorOptions.onValueChanged = function (e) {
                    data.component.updateData(item.dataField, e.value);
                };


                var gridOptionConfig = {
                    filterRefId: that.refFieldId,
                    filterRefField: "surveyId",
                    height: _defaultGridMinHeight
                };


                var itemDataGrid = {
                    id: that.refFieldId,
                    dataField: "constructionBuilding",
                    editorType: "dxDataGrid",
                    name: "ConstructionBuilding",
                    label: { text: "", visible: false },
                    caption: "",
                    ModelName: "ConstructionBuilding",
                    gridOptionConfig: gridOptionConfig,
                    editorOptions: {}
                }

                createAccordionField(item, itemElement, editorOptions, that);

                if (item.dataField == "constructionContent") {
                    var elementName = itemDataGrid.ModelName;
                    if (itemDataGrid.name != null || itemDataGrid.name != undefined) {
                        elementName = itemDataGrid.name;
                    }
                    var mGridOption = new MGridOption("ConstructionBuilding", "User", gridOptionConfig);
                    mGridOption.gridEditorOptions = {
                        editing: {
                            mode: "cell",
                            allowAdding: true,
                            allowUpdating: true,
                            allowDeleting: true
                        }
                    };
                    if (that.isReadOnly)
                        mGridOption.gridEditorOptions = {
                            editing: {
                                allowAdding: false,
                                allowUpdating: false,
                                allowDeleting: false
                            }
                        };

                    itemDataGrid.gridOption = mGridOption;
                    $(`<div id='dataGrid_${elementName}_${itemDataGrid.id}' style="min-height: ${_defaultGridMinHeight}px;">`).dxDataGrid(mGridOption.getGridOptions(itemDataGrid.gridOption)).appendTo(itemElement);
                }
            }
            item.label.visible = false;

        }

    }

}
var LossHistoryForm = class LossHistoryForm extends MForm {
    constructor(id, childGridConfig, formConfig) {
        super(id, childGridConfig, formConfig)
    }
    customizeForm(item) {
        var that = this;
        super.customizeForm(item);
        var editorOptions = { ...item.editorOptions };

        if (isAccordionGroupSupportControls(item, editorOptions, that)) {
            item.template = function (data, itemElement) {
                editorOptions.onInitialized = function (e) {
                    e.component.option("value", data.component.option("formData")[item.dataField]);
                    $(e.element).on("dblclick", function () {
                        e.component.option("value", e.component.option("placeholder"));
                    });
                }
                editorOptions.onValueChanged = function (e) {
                    data.component.updateData(item.dataField, e.value);
                };

                var gridOptionConfig = {
                    filterRefId: that.refFieldId,
                    filterRefField: "surveyId",
                    visibleColumns: ["claimNo", "lossDate", "lossDescriptions", "totalLoss"],
                    height: _defaultGridMinHeight
                };

                var mGridOption = new MGridOption("LossHistoryDetail", "User", gridOptionConfig);
                mGridOption.gridEditorOptions = {
                    editing: {
                        mode: "cell",
                        allowAdding: true,
                        allowUpdating: true,
                        allowDeleting: true
                    }
                };
                if (that.isReadOnly)
                    mGridOption.gridEditorOptions = {
                        editing: {
                            allowAdding: false,
                            allowUpdating: false,
                            allowDeleting: false
                        }
                    };


                var itemDataGrid = {
                    id: that.refFieldId,
                    dataField: "lossHistoryDetail",
                    editorType: "dxDataGrid",
                    name: "LossHistoryDetail",
                    label: { text: "", visible: false },
                    caption: "",
                    ModelName: "LossHistoryDetail",
                    gridOptionConfig: gridOptionConfig,
                    gridOption: mGridOption,
                    editorOptions: {}
                }
                var elementName = itemDataGrid.ModelName;
                if (itemDataGrid.name != null || itemDataGrid.name != undefined) {
                    elementName = itemDataGrid.name;
                }
                createAccordionField(item, itemElement, editorOptions, that);
                $(`<div id='dataGrid_${elementName}_${itemDataGrid.id}' style="min-height: ${_defaultGridMinHeight}px;">`).dxDataGrid(mGridOption.getGridOptions(itemDataGrid.gridOption)).appendTo(itemElement);

            }
            item.label.visible = false;

        }

    }
}
var LossExpValueBrkdwnForm = class LossExpValueBrkdwnForm extends MForm {
    constructor(id, childGridConfig, formConfig, formOptions) {
        super(id, childGridConfig, formConfig, formOptions)
    }

    customizeItemLayout() {
        var itemLayout = [
            {
                itemType: "group",
                name: "ValueBreakdown",
                colCount: 1,
                items: [
                ],
                formItem: {
                    outline: { id: "43,97" }
                }
            },
            {
                itemType: "group",
                name: "ProbableMaximumLoss",
                colCount: 1,
                items: [
                ],
                formItem: {
                    outline: { id: "44,98" }
                }
            }
        ];
        return itemLayout;
    }

    groupingLayout(_formConfig, itemsArray, formInstance) {
        let currencyIdItem = itemsArray.find(f => f.dataField === "currencyId");
        let currencyIdBackup = null;

        if (currencyIdItem) {
            currencyIdBackup = { ...currencyIdItem }; // Lưu bản sao của item
            itemsArray = itemsArray.filter(f => f.dataField !== "currencyId");
        }

        const groupedItems = groupItemsByFormGroupName(itemsArray);
        const itemsArrayGroup = itemsArray.filter(f => f.itemType === "group");
        const outlineAdd = itemsArray.find(f => f.name === "addOutline");

        if (itemsArrayGroup.length > 0) {
            itemsArrayGroup.forEach(group => {
                if (groupedItems[group.name]) {
                    group.items = groupedItems[group.name];
                }
            });

            if (outlineAdd) {
                itemsArrayGroup.push(outlineAdd);
            }

            if (currencyIdBackup) {
                itemsArrayGroup.unshift(currencyIdBackup);
            }

            return itemsArrayGroup;
        } else {
            if (currencyIdBackup) {
                itemsArray.unshift(currencyIdBackup);
            }
            return itemsArray;
        }
    }

    customizeForm(item) {
        var that = this;
        super.customizeForm(item);
        var editorOptions = { ...item.editorOptions };

        if (item.name === "ValueBreakdown") {
            var gridOptionConfig = {
                filterRefId: that.refFieldId,
                filterRefField: "surveyId",
                visibleColumns: ["valueBrkdwnInterest", "valueBrkdwnSum"],
                params: that.formOptions.Params,
                height: _defaultGridMinHeight
            };

            var mGridOption = new LossExpValueBrkdwnDetailGridOption("LossExpValueBrkdwnDetail", 'User', gridOptionConfig);
            mGridOption.gridEditorOptions = {
                editing: {
                    mode: "cell",
                    allowAdding: true,
                    allowUpdating: true,
                    allowDeleting: true
                }
            };
            if (that.isReadOnly)
                mGridOption.gridEditorOptions = {
                    editing: {
                        allowAdding: false,
                        allowUpdating: false,
                        allowDeleting: false
                    }
                };


            $.each(item.items, function (i, itemChild) {
                itemChild.label.visible = false;
            });
            item.isDefaultImage = true;
            item.items.push({
                id: that.refFieldId,
                dataField: "lossExpValueBrkdwnDetail",
                editorType: "dxDataGrid",
                name: "LossExpValueBrkdwnDetail",
                label: {
                    text: "Value Breakdown",
                    visible: true
                },
                caption: "Value Breakdown",
                ModelName: "LossExpValueBrkdwnDetail",
                gridOptionConfig: gridOptionConfig,
                gridOption: mGridOption,
                editorOptions: {}
            })
            item.template = function (data, itemElement) {
                createAccordionGroup(item, itemElement, that);
            }
        }

        if (item.name === "ProbableMaximumLoss") {
            var gridOptionConfig = {
                filterRefId: that.refFieldId,
                filterRefField: "surveyId",
                visibleColumns: ["valueBrkdwnInterest", "valueBrkdwnSum", "pmlPercent", "pml"],
                params: that.formOptions.Params,
                height: _defaultGridMinHeight
            };
            var mGridOption = new LossExpValueBrkdwnDetailGridOption("LossExpValueBrkdwnDetail", 'User', gridOptionConfig);
            mGridOption.gridEditorOptions = {
                editing: {
                    mode: "cell",
                    allowAdding: true,
                    allowUpdating: true,
                    allowDeleting: true
                }
            };
            if (that.isReadOnly)
                mGridOption.gridEditorOptions = {
                    editing: {
                        allowAdding: false,
                        allowUpdating: false,
                        allowDeleting: false
                    }
                };

            item.items.push({
                id: that.refFieldId,
                dataField: "lossExpValueBrkdwnDetail",
                editorType: "dxDataGrid",
                name: "LossExpValueBrkdwnDetail",
                label: {
                    text: "Probable Maximum Loss",
                    visible: true
                },
                caption: "Probable Maximum Loss",
                ModelName: "LossExpValueBrkdwnDetail",
                gridOptionConfig: gridOptionConfig,
                gridOption: mGridOption,
                editorOptions: {},

            })
            $.each(item.items, function (i, itemChild) {
                itemChild.label.visible = false;
                if (itemChild.dataField == "currencyId") {
                    itemChild = selectBoxRemakeOption(itemChild, that);
                    itemChild.label.visible = true;
                    itemChild.width = _defaultFormFieldWidth;
                    itemChild.height = _defaultFormFieldHeight;
                }
            });
            item.isDefaultImage = true;
            item.template = function (data, itemElement) {
                createAccordionGroup(item, itemElement, that);
            }
        }

    }
}

var ProtectionForm = class ProtectionForm extends MForm {
    constructor(id, childGridConfig, formConfig, mFormOption) {
        super(id, childGridConfig, formConfig, mFormOption)
    }


    customizeForm(item) {
        var that = this;
        super.customizeForm(item);
        var editorOptions = { ...item.editorOptions };

        if (isAccordionGroupSupportControls(item, editorOptions, that)) {
            item.template = function (data, itemElement) {
                editorOptions.onInitialized = function (e) {
                    e.component.option("value", data.component.option("formData")[item.dataField]);
                    $(e.element).on("dblclick", function () {
                        e.component.option("value", e.component.option("placeholder"));
                    });
                }
                editorOptions.onValueChanged = function (e) {
                    data.component.updateData(item.dataField, e.value);
                };

                var gridOptionConfig = {
                    filterRefId: that.refFieldId,
                    filterRefField: "surveyId",
                    visibleColumns: ["firefightingEquipmentId", "availability", "coverAreasRemarks"],
                    height: _defaultGridMinHeight
                }

                var itemDataGrid = {
                    id: that.refFieldId,
                    dataField: "protectionDetail",
                    editorType: "dxDataGrid",
                    name: "ProtectionDetail",
                    label: { text: "", visible: false },
                    caption: "",
                    ModelName: "ProtectionDetail",
                    gridOptionConfig: gridOptionConfig,
                    editorOptions: {}
                }
                if (item.dataField == "maintenanceProgram") {
                    var elementName = itemDataGrid.ModelName;
                    if (itemDataGrid.name != null || itemDataGrid.name != undefined) {
                        elementName = itemDataGrid.name;
                    }
                    var mGridOption = new MGridOption("ProtectionDetail", "User", gridOptionConfig);
                    mGridOption.gridEditorOptions = {
                        editing: {
                            mode: "cell",
                            allowAdding: true,
                            allowUpdating: true,
                            allowDeleting: true
                        }
                    };
                    if (that.isReadOnly)
                        mGridOption.gridEditorOptions = {
                            editing: {
                                allowAdding: false,
                                allowUpdating: false,
                                allowDeleting: false
                            }
                        };

                    itemDataGrid.gridOption = mGridOption;
                    $(`<div id='dataGrid_${elementName}_${itemDataGrid.id}' style="min-height: ${_defaultGridMinHeight}px;">`).dxDataGrid(mGridOption.getGridOptions(itemDataGrid.gridOption)).appendTo(itemElement);
                }
                createAccordionField(item, itemElement, editorOptions, that);
            }
            item.label.visible = false;

        }

    }
}

var ManagementForm = class ManagementForm extends MForm {
    constructor(id, childGridConfig, formConfig, mFormConfig) {
        super(id, childGridConfig, formConfig, mFormConfig)
    }
}


var OtherExposuresForm = class OtherExposuresForm extends MForm {
    constructor(id, childGridConfig, formConfig, mFormConfig) {
        super(id, childGridConfig, formConfig, mFormConfig)
    }
}

var SummaryForm = class SummaryForm extends MForm {
    constructor(id, childGridConfig, formConfig) {
        super(id, childGridConfig, formConfig)
    }
}

var SitePicturesForm = class SitePicturesForm extends MForm {
    constructor(id, childGridConfig, formConfig, mFormOptions) {
        super(id, childGridConfig, formConfig, mFormOptions)
    }

    customizeItemLayout() {
        var itemLayout = [
            {
                itemType: "group",
                name: "SitePictures",
                colCount: 1,
                items: [
                ],
                formItem: {
                    outline: { id: "119,120" }
                }
            }
        ];
        return itemLayout;
    }

    customizeForm(item) {
        var that = this;
        super.customizeForm(item);
        var editorOptions = { ...item.editorOptions };
        if (item.name === "SitePictures") {
            $.each(item.items, function (i, itemChild) {
                itemChild.label.visible = false;
            });



            var gridOptionConfig = {
                filterRefId: that.id,
                filterRefField: "surveyId",
                visibleColumns: ["attachmentId", "attachmentNote"]
            };



            //item.isDefaultImage = true;
            item.items.push({
                id: that.refFieldId,
                dataField: "sitePicturesUpload",
                editorType: "dxDataGrid",
                name: "SitePictures",
                label: {
                    text: "Site Pictures",
                    visible: true
                },
                caption: "Site Pictures",
                ModelName: "SitePictures",
                //gridOptionConfig: {
                //    filterRefId: that.id,
                //    filterRefField: "surveyId",
                //    visibleColumns: ["attachmentId", "attachmentNote"]
                //},
                gridOptionConfig: gridOptionConfig,
                gridOption: {},
                editorOptions: {}
            })
            item.template = function (data, itemElement) {
                var formField = $("<div>");
                var outlineObject = null
                //if (that.Outline != null)
                //    outlineObject = that.Outline.find(f => item.caption.includes(f.content));
                if (item.formItem) {
                    if (item.formItem.outline)
                        //outlineObject = that.Outline.find(f => f.id == item.formItem.outline.id);
                        outlineObject = _cacheOutlines.find(f => {
                            const outlineIds = item.formItem.outline.id.split(",").map(id => id.trim());
                            return outlineIds.includes(f.id.toString());
                        });

                }
                if (item.isDefaultImage || item.isDefaultImage == null || item.isDefaultImage == undefined) {
                    var defaultImageUploader = {
                        dataField: item.caption,
                        editorOptions: {
                            height: 100,
                            showClearButton: true,
                            tabIndex: 1,
                            value: "",
                            width: 300
                        },
                        editorType: "dxFileUploader",
                        formGroupName: "",
                        label: { location: "left", text: "", visible: true },
                        validationRules: []
                    };
                    item.items.push(defaultImageUploader);
                }
                else {
                }




                if (outlineObject != null || outlineObject != undefined)
                    $("<div>").dxAccordion({
                        dataSource: [
                            { title: outlineObject.content, items: item.items, outline: outlineObject }
                        ],
                        collapsible: false,
                        multiple: true,
                        animationDuration: 300,
                        selectedIndex: -1,
                        itemTitleTemplate: function (itemData) {
                            var container = $(`<span><strong>${itemData.title}</strong></span>`);
                            if (that.outlineForm)
                                if (that.outlineForm.isOutlineChecked)
                                    $("<span>").dxRadioGroup(yesNoGroupHandle(outlineObject, that, itemData)).appendTo(container);
                            return container;
                        },
                        itemTemplate: function (itemData, index, $contentElement) {
                            $.each(itemData.items, function (iIndex, itemChild) {
                                itemChild.editorOptions.onInitialized = function (e) {
                                    $(e.element).on("dblclick", function () {
                                        e.component.option("value", e.component.option("placeholder"));
                                    });
                                }
                                itemChild.editorOptions.value = that.formInstance.option("formData")[itemChild.dataField],
                                    itemChild.editorOptions.onValueChanged = function (e) {
                                        that.formInstance.updateData(itemChild.dataField, e.value);
                                    }
                                itemChild.outline = itemData.outline;
                                //var childProps = { ...itemChild, ...itemChild.editorOptions };

                                //if (itemChild.editorType == 'dxDataGrid' || itemChild.editorType == 'dxFileUploader') {
                                //    childProps.gridConfig = itemChild.gridConfig;
                                //    childProps.gridOptionConfig = itemChild.gridOptionConfig;
                                //    childProps.id = itemChild.id;
                                //    childProps.ModelName = itemChild.ModelName;
                                //}
                                var childProps = customChildProps(itemChild, that);
                                itemChild.instanceProps = childProps.instanceProps;

                                if (itemChild.label.visible)
                                    if (itemChild.editorType != "empty")
                                        $(`<span class='dx-label'>${itemChild.label.text}: </span >`).appendTo($contentElement);
                                    else
                                        $(`<div class='dx-label'>`).html(itemChild.label.text).appendTo($contentElement);
                                itemChild.inputAttr = {
                                    'aria-label': itemChild.label.text
                                };
                                switch (itemChild.editorType) {
                                    case "dxDataGrid":
                                        var minHeight = 500;
                                        var elementName = childProps.ModelName;
                                        if (childProps.name != null || childProps.name != undefined) {
                                            elementName = childProps.name;
                                        }
                                        childProps.gridOptionConfig.height = _defaultGridMinHeight;
                                        childProps.gridOptionConfig.outline = itemData.outline;
                                        var mGridOption = new ImageGridOption(childProps.ModelName, 'User', childProps.gridOptionConfig);
                                        mGridOption.gridEditorOptions = {};
                                        if (that.isReadOnly)
                                            mGridOption.gridEditorOptions = {
                                                editing: {
                                                    allowAdding: false,
                                                    allowUpdating: false,
                                                    allowDeleting: false
                                                }
                                            };
                                        $(`<div id='dataGrid_${elementName}_${childProps.id}' style="min-height: ${minHeight}px;">`).dxDataGrid(mGridOption.getGridOptions(mGridOption)).appendTo($contentElement);
                                        break;
                                }
                            });
                        }
                    }).appendTo(itemElement);
            }
        }
    }

}
var LossControlFormOption = class LossControlFormOption extends MFormOption {
    constructor(params) {
        super()
        this.parentLossControlId = 0;
        if (params.parentLossControlId) {
            this.parentLossControlId = params.parentLossControlId;
        }
        if (params.surveyTypeId) {
            this.surveyTypeId = params.surveyTypeId;
        }
    }
}

var LossControlForm = class LossControlForm extends MForm {
    constructor(id, childGridConfig, formConfig, mFormOption) {
        super(id, childGridConfig, formConfig, mFormOption)
        //this.parentLossControlId = 0;
        //if (formConfig.parentLossControlId)
        //    this.parentLossControlId = formConfig.parentLossControlId;
    }

    //customizeForm(item) {
    //    var that = this;
    //    super.customizeForm(item);
    //    if (item.dataField == "surveyTypeId" || item.dataField == "parentId") {
    //        item.visible = false;
    //    }
    //    if (item.dataField == "content") {
    //        item.editorOptions.width = "100%";
    //    }
    //}

    //initDataNewForm() {
    //    var that = this;
    //    var newRowdata = {};
    //    newRowdata[`parentId`] = that.formOptions.parentLossControlId;
    //    newRowdata[`surveyTypeId`] = that.formOptions.surveyTypeId;
    //    var listFieldHasDefaultValue = that.fieldConfigs.filter(
    //        value => value.defaultValue
    //    );

    //    $(listFieldHasDefaultValue).each(function (i, field) {
    //        newRowdata[`${field.dataField}`] = Function(field.defaultValue);
    //    });

    //    that.formInstance.option("formData", newRowdata);
    //}

}