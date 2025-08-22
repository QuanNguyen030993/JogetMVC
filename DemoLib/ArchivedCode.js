
///LANGUAGE
//Globalize.formatMessage // Translate function//
//$try(function () { return Globalize.formatMessage("Word") });

///CLASS
//// Tạo đối tượng từ tên lớp dưới dạng chuỗi
//var createInstance = function createInstance(className, ...args) {
//    const ClassObj = window[className];
//    if (typeof ClassObj === 'function') {
//        return new ClassObj(...args);
//    } else {
//        throw new Error(`Class ${className} not found or is not a constructor function.`);
//    }
//}

//Form button
//$(`#btnSave_${that.ModelName}`).dxButton("instance")

//dxButton option
//icon: "chevronnext",
//    template: "content",


//Tab permission
//container.attr("formPermissions-grid-allowAdding", that.formPermissions.grid.allowAdding);

//Editor date format
//i.editorOptions.dateSerializationFormat = "yyyy-MM-dd";

//Form class main
//setup key events
//onInitialized: tryExecute(function () {
//    $(this.container).bind('keydown', { combi: 'Ctrl+s', mForm: this }, function assets(e) {
//        e.data.mForm.doSaveData(false);
//        return false;
//    });
//}.bind(this)),
//remove key events
//onDisposing: tryExecute(function () {
//    $(this.container).unbind('keydown', { combi: 'Ctrl+s', mForm: this }, function assets(e) {
//        e.data.mForm.doSaveData(false);
//        return false;
//    });
//}.bind(this)),
//update display field when field data was changed

//Dropdown options relate to popup
// assign fields to form header
//            //    i.editorType = 'dxDropDownBox';
//            //    i.editorOptions = {
//            //        contentTemplate: function (e, container) {
//            //                    cacheEnabled: true,
//            //                    hoverStateEnabled: true,
//            //                    onContentReady: function (eR) {
//            //                                e.component._popup.option("width", 100);
//            //                        }
//            //                    },
//            //                });
//            //        }
//            //    };

//component process order
//            //            e.component.repaint();
//            //            e.component.close();
//            //            e.component.blur();



//Grid class maim

//formPermissions_grid_allowAdding = $(container.closest("[formPermissions-grid-allowAdding")[0]).attr("formPermissions-grid-allowAdding");


//Image grid option
//            properties.onCellPrepared = function (e) {
//                if (e.rowType === "data" && e.column.command != "edit") {
//                    if (e.data.Active == null || e.data.Active == false) {
//                        e.cellElement.css("text-decoration", "line-through");
//                    }

//                }
//            }

//col.editorOptions.validationMessageMode = 'always';
//remoteOperations: { paging: true, filtering: true, sorting: true, grouping: true, summary: true, groupPaging: true },

//All editor type
//image
//date
//datetime
//decimal0
//int
//decimal
//decimal3
//decimal4
//currency
//currency3
//currency4
//percentage
//percentage3
//boolean
//percentagetype
//currencytype
//string

//mLook
//                ee.dropDowncontentTemplate = function (e, container) {
//                    var value = e.component.option("value") == null ? -1 : e.component.option("value"),
//                        $dataGrid = $("<div>").dxDataGrid({
//                            onSelectionChanged: function (selectedItems) {
//                                var keys = selectedItems.selectedRowKeys,
//                                    hasSelection = keys.length;
//                                if (hasSelection) {
//                                    e.component.close();
//                                } else {
//                                    ee.seletedData = null;
//                                    ee.dropDownBox.seletedData = null;
//                                    ee.dropDownBox.value = null;
//                                    if (ee.dataGrid != undefined) {
//                                        ee.dataGrid.clearSelection();
//                                    }
//                                }
//                            },
//                        }).appendTo(container);
//                };


//                        ee.dropDownBox = ee.editorElement.dxDropDownBox({
//                            valueChangeEvent: "",
//                            popupPosition: {
//                                my: (constDropBoxChildHeight + ee.editorElement["0"].offsetTop > ee.component.option("height") - 80) ? "left top" : "left bottom",
//                                at: (constDropBoxChildHeight + ee.editorElement["0"].offsetTop > ee.component.option("height") - 80) ? "left bottom" : "left top",
//                                offset: { h: 0, v: 0 },
//                                of: ee.editorElement
//                            },
//                            onClosed: function (e) {
//                                dataSource.pageIndex(0);
//                                dataSource.reload();
//                            },
//                            //openOnFieldClick: true,
//                            onFocusIn: function (args) {
//                                if (ee.component.option("editing.mode") === "batch" && ee.editorOptions.readOnly == false && args.component.opened == false) {
//                                    args.component.open();
//                                }
//                            },
//                            onInput: function (e) {
//                            }
//                        }).dxDropDownBox("instance");

//                        if (that.cascadingDropDownConfigObj != null) {
//                            $.each(that.cascadingDropDownConfigObj, function (i, cdc) {
//                                if (ee.dataField == cdc.desField) {
//                                    //add displayField property to cascadingDropDownConfig object
//                                    cdc["displayField"] = ee.displayField;
//                                    var editor_onOpened = function (eo) {
//                                        var dsource = eo.component.option('dataSource');
//                                        dsource.filter([cdc.filterBy, "=", ee.row.data[cdc.srcField] || -1]);
//                                        dsource.load();
//                                    };
//                                    ee.dropDownBox.option("onOpened", editor_onOpened);
//                                }
//                            });
//                        }

//small Paging
//e.component.element().find('.dx-scrollable-scroll-content').css("background-color", "rgb(177, 234, 158)");

//column filtering
//col.allowFiltering = true;

//onDataErrorOccurred
//                    let errorRow = document.querySelector(".dx-error-message");
//                    errorRow.innerHTML = message;


//attachment class
//                    var attachmentUI = new AttachmentUI({
//                        containerId: id,
//                        recordguid: guid,
//                        tabHeight: 400
//                    }, function (result) {

//                    });
//                    attachmentUI.Load();

///COLOR
//var parseRGBtoHex = function parseColor(color) {
//    var arr = [];
//    color.replace(/[\d+\.]+/g, function (v) { arr.push(parseFloat(v)); });
//    return (arr.slice(0, 3).map(toHex).join(""));
//}


//function numberFormat(container, options, valueIds) {
//    if (options.rowType == "data") { // phân loại màu sắc của text
//        switch (options.data.WareHouseTypeStatusId) {
//            case valueIds[0]:
//                return $(`<div class="green-label">+${options.displayValue}</div>`).appendTo(container);
//            case valueIds[1]:
//                return $(`<div class="red-label">-${options.displayValue}</div>`).appendTo(container);
//        }
//        switch (options.data.RequestWareHouseTypeStatusId) {
//            case valueIds[2]:
//                return $(`<div>[+${options.displayValue}]</div>`).appendTo(container);
//            case valueIds[3]:
//                return $(`<div>[-${options.displayValue}]</div>`).appendTo(container);
//        }
//    }
//}

///TIME
//function formatDate(date) {
//    var year = date.getFullYear();
//    var month = ("0" + (date.getMonth() + 1)).slice(-2);
//    var day = ("0" + date.getDate()).slice(-2);
//    return year + "-" + month + "-" + day;
//}

//Date.prototype.addDays = function (days) {
//    var dat = new Date(this.valueOf());
//    dat.setDate(dat.getDate() + days);
//    return dat;
//}

//function FormatTimeRelationToNow(date) {
//    if (date != undefined && date) {
//        var date = moment(date).add(7, 'hours');
//        date = moment(date).fromNow();
//        return date;
//    }
//    return '';
//}

//function addMonths(date, months) {
//    var d = date.getDate();
//    date.setMonth(date.getMonth() + +months);
//    if (date.getDate() != d) {
//        date.setDate(0);
//    }
//    return date;
//}

//var DateDiff = {

//    inDays: function (d1, d2) {
//        var t2 = d2.getTime();
//        var t1 = d1.getTime();

//        return parseInt((t2 - t1) / (24 * 3600 * 1000));
//    },

//    inWeeks: function (d1, d2) {
//        var t2 = d2.getTime();
//        var t1 = d1.getTime();

//        return parseInt((t2 - t1) / (24 * 3600 * 1000 * 7));
//    },

//    inMonths: function (d1, d2) {
//        var d1Y = d1.getFullYear();
//        var d2Y = d2.getFullYear();
//        var d1M = d1.getMonth();
//        var d2M = d2.getMonth();

//        return (d2M + 12 * d2Y) - (d1M + 12 * d1Y);
//    },

//    inYears: function (d1, d2) {
//        return d2.getFullYear() - d1.getFullYear();
//    }
//}

//    function DateToMonthYear(date) {
//        if (!date) {
//            return ''
//        }
//        var new_date = moment(date);
//        var month = new_date.format('MMM');
//        var year = new_date.format('YYYY');
//        return month + ' ' + year;
//    }

//    function DateFormatFromTo(from, to) {
//        if (!from || !to) {
//            return ''
//        }
//        var from_date = moment(from);
//        var to_date = moment(to);
//        return `${from_date.format('MMM')} - ${to_date.format('MMM')} ${to_date.format('YYYY')}`;
//    }
//}




//new Date().getTimezoneOffset() * 60;
//moment(date).subtract(-constOffset, 'seconds').format('DD MMM YYYY'); //ToUTCDate
//moment(date).subtract(+constOffset, 'seconds')._d; //ToLocaleDate
//moment(date).format('DD MMM YYYY hh:mm:ss'); //FormatDate


///LIB CODE
//dataGrid.getController("errorHandling").renderErrorRow(errorText, rowIndex);  //showErrorRow


//$.getJSON(hostUrl + "/lib/devextreme/cldr/main/vi/ca-gregorian.json"),


//            var dateBox = $(`<div style="width:100%;">`).appendTo(container).dxDateBox({
//                type: "date",
//                value: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
//                displayFormat: 'dd-MM-yyyy',
//                calendarOptions: {
//                    maxZoomLevel: 'month',
//                    minZoomLevel: 'century',
//                }
//                pickerType: "rollers",
//            }).dxDateBox('instance');

//                        var workbook = new ExcelJS.Workbook();
//                                    var worksheet = workbook.addWorksheet(exportSheetName);
//                                    DevExpress.excelExporter.exportDataGrid({
//                                        component: e.component,
//                                        worksheet: worksheet,
//                                    }).then(() => {
//                                        var columns = worksheet.columns;
//                                        var headerRow = worksheet.getRow(1, 2);
//                                        var headerRow2 = worksheet.getRow(1, 2);
//                                        // Apply color to the entire header row

//                                        var changeColorCol = 0;
//                                        headerRow.eachCell({ includeEmpty: true }, (cell) => {
//                                            cell.style.font = {
//                                                bold: true,
//                                                color: { argb: 'FF000000' }
//                                            };
//                                        });
//                                        columns.forEach((column, index) => {
//                                            // Apply border to all cells in the column
//                                            column.eachCell({ includeEmpty: true }, (cell) => {
//                                                cell.border = {
//                                                    top: { style: 'thin', color: { argb: 'FF000000' } },
//                                                    left: { style: 'thin', color: { argb: 'FF000000' } },
//                                                    bottom: { style: 'thin', color: { argb: 'FF000000' } },
//                                                    right: { style: 'thin', color: { argb: 'FF000000' } }
//                                                };
//                                            });
//                                        });
//                                        workbook.xlsx.writeBuffer().then((buffer) => {
//                                            saveAs(new Blob([buffer], { type: 'application/octet-stream' }), exportFileName.replace("_DateFormat", `Content`));
//                                        });
//                                    });


///JAVASCRIPT CODE
//new Promise(resolve => setTimeout(resolve, ms)); // sleep

//var makeupTextCompare = function (text, container) {
//    if (text != null && text.indexOf('-->') >= 0) {
//        var values = text.split("|");
//        if (values.length > 1) {
//            $("<span>").appendTo(container).addClass(values[1] >= 0 ? "inc" : "dec")
//                .html(`<span class="current-value">${values[0]}</span><span class="arrow"></span><span class="diff">${values[1]}</span>`);
//        } else {
//            container.html(`<span style="color: steelblue;">${text}</span>`);
//        }
//    } else {
//        container.html(`<span>${text}</span>`);
//    }
//}

//$.extend(ajaxSettings.data, { queryParams: params });