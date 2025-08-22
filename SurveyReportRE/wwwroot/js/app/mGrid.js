var MGrid = class MGrid {
    constructor(gridConfig, container, mGridOption) {
        try {
            this.ImportType = "default";
            this.refId = 0;
            this.refField = "Id";
            this.isAllowRowMenu = true;
            if (mGridOption) {
                if (mGridOption.mGridDetailOption != null || mGridOption.mGridDetailOption != undefined)
                    this.mGridDetailOption = mGridOption.mGridDetailOption;
                if (mGridOption.filterRefId != null || mGridOption.filterRefId != undefined)
                    this.refId = mGridOption.filterRefId;
                if (mGridOption.filterRefField != null || mGridOption.filterRefField != undefined)
                    this.refField = mGridOption.filterRefField;
                if (mGridOption.filterRefId2 != undefined)
                    this.refId2 = mGridOption.filterRefId2;
                if (mGridOption.filterRefField2 != undefined)
                    this.refField2 = mGridOption.filterRefField2;
                if (mGridOption.isAllowRowMenu != null || mGridOption.isAllowRowMenu != undefined)
                    this.isAllowRowMenu = mGridOption.isAllowRowMenu;
                this.mGridOption = mGridOption;
            }
            else
                this.mGridOption = new MGridOption();
            if (container)
                this.container = container;
            else
                this.container = $("<div>");

            this.renderGrid();
        } catch (err) {
            appErrorHandling('Library error: call new MGrid instance was failed.', err);
            console.trace();
        }
    };

    renderGrid() {
        try {
            var that = this;
            this.component = this.container.dxDataGrid(that.mGridOption.getGridOptions(null)).dxDataGrid("instance");

            return this.component;
        } catch (err) {
            appErrorHandling('Library error: call renderGrid was failed.', err);
        }
    };
};
var MGridOption = class MGridOption {
    constructor(modelName, gridType, gridConfig) {
        this.editors = {};
        this.ModelName = modelName;
        if (gridConfig) {
            this.mGridDetailOption = gridConfig;
            if (gridConfig.filterRefId != null || gridConfig.filterRefId != undefined)
                this.filterRefId = gridConfig.filterRefId;
            if (gridConfig.filterRefField != null || gridConfig.filterRefField != undefined)
                this.filterRefField = gridConfig.filterRefField;
            if (gridConfig.filterRefId2 != undefined)
                this.filterRefId2 = gridConfig.filterRefId2;
            if (gridConfig.filterRefField2 != undefined)
                this.filterRefField2 = gridConfig.filterRefField2;
            if (gridConfig.height != undefined)
                this.height = gridConfig.height;
        }
        if (gridType)
            this.gridType = gridType;
        else
            this.gridType = "User";
    }

    //populate cellvalue
    populateCellValueFromDropDownBox() {

        return null;
    }

    cascadingDropDowns() {
        //object template
        //return [
        //    {srcField: "srcFieldName", desField: "desFieldName", filterBy: "drDownFieldName"}
        //];
        return null;
    }

    buildGridColumn(fieldConfigs) {
        try {
            var that = this;
            //            var columnNames = gConfig.Columns;
            //            var columns = [];
            var populateDropDownConfigs = that.populateCellValueFromDropDownBox();
            var populateDataConfigs = [];
            $.each(fieldConfigs, function (i, fc) {

                //if (fc.gridVisibleIndex != null || fc.gridVisibleIndex != undefined)
                //    fc.visibleIndex = fc.gridVisibleIndex;
                //else
                //    fc.visibleIndex = fc.order;



                if (populateDropDownConfigs != null) {
                    if (populateDataConfigs.length > 0) {
                        $.each(populateDataConfigs, function (i, pdc) {
                            var pddc = populateDropDownConfigs.find(x => x.srcFieldName === pdc.srcFieldName);
                            if (pddc != null) {
                                $.each(pddc.desFieldNames, function (i, desFieldName) {
                                    pdc.desFieldNames.push(desFieldName);
                                });
                            }
                            //else {
                            //    $.each(populateDropDownConfigs, function (i, pdc) {
                            //        populateDataConfigs.push(pdc);
                            //    });
                            //}
                        });

                        $.each(populateDropDownConfigs, function (i, pdrc) {
                            var pdc = populateDataConfigs.find(x => x.srcFieldName === pdrc.srcFieldName);
                            if (pdc == null) {
                                populateDataConfigs.push(pdrc);
                            }
                        });

                    } else {
                        $.each(populateDropDownConfigs, function (i, pdc) {
                            populateDataConfigs.push(pdc);
                        });
                    }
                }
                if (fieldConfigs == null) return;

                //apply populate cell value from DropDown
                if (populateDataConfigs != null) {
                    var populateDataConfig = populateDataConfigs.find(x => x.srcFieldName == fc.dataField);
                    if (populateDataConfig != undefined) {
                        fc.setCellValue = function (newData, value, currentRowData) {
                            newData[this.srcFieldName] = value;
                            //set displayField value for dropdownbox
                            var editor = null;
                            editor = that.editors[this.srcFieldName];
                            if (editor != null) {
                                // drop down box
                                if (editor.value != null && value != null) {
                                    if (editor.seletedData != null) {
                                        var seleteddata = editor.seletedData[0];
                                        $.each(this.desFieldNames, function (i, dFieldName) {
                                            var selectedValue = seleteddata[dFieldName.DrFieldName];
                                            //if (selectedValue == undefined)
                                            //    selectedValue = dFieldName.DrFieldName;
                                            newData[dFieldName.FieldName] = selectedValue;
                                        });
                                    }
                                }
                                // select box
                                else if (editor.option("displayValue") != null && value != null) {
                                    $.each(this.desFieldNames, function (i, dFieldName) {
                                        newData[dFieldName.FieldName] = editor.option("displayValue");
                                    });
                                } else {
                                    $.each(this.desFieldNames, function (i, dFieldName) {
                                        newData[dFieldName.FieldName] = null;
                                    });
                                }
                            }
                        }.bind(populateDataConfig);
                    }
                }
                // trim filter text

                //Filter Feature

                if (fc.dataType == "bytes") {
                    fc.dataType = "string";
                    if (fc.dataField == "editorOptions" || fc.dataField == "formItem")
                        fc.calculateCellValue = function (data) {
                            if (!(typeof data[fc.dataField] === "object") && !(data[fc.dataField] == null)) {
                                var decodedString = data[fc.dataField];
                                if (isValidBase64(data[fc.dataField])) {
                                    const decodedBytes = Uint8Array.from(atob(data[fc.dataField]), c => c.charCodeAt(0));
                                    decodedString = new TextDecoder("utf-8").decode(decodedBytes);
                                    try {
                                        const jsonObject = JSON.parse(decodedString);
                                        data[`${fc.dataField}Config`] = jsonObject;
                                    }
                                    catch {
                                    }
                                }
                                return decodedString;
                            }
                            return null;
                        }
                }

                if (fc.dataType == "string" && fc.dataField.indexOf("Id") < 0 && fc.lookup == null && fc.mLookup == null) {
                    fc.calculateFilterExpression = function (value, operation, target) {
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
                    fc.calculateFilterExpression = function (value, operation, target) {
                        return this.defaultCalculateFilterExpression(value, operation, target);
                    }
                }
            });

        } catch (err) {
            appErrorHandling('Library error: call buildGridColumn was failed.', err);
            console.trace();
        }
    }

    //override it to customize columns
    onCustomizeColumns(columns) {
    }

    onCellClick(e) {
        this.focusData = e;
        this.focusRowData = e.data;
        this.focusColumn = e.column;
        this.focusColumnIndex = e.columnIndex;
    }

    onToolbarPreparing(e) {
        var that = this;
        var dtGrid = e.component;
        e.toolbarOptions.items.unshift({
            location: "after",
            widget: "dxButton",
            options: {
                type: 'default',
                icon: "refresh",
                onClick: function () {
                    dtGrid.refresh();
                }
            }
        });
        if (this.GridConfig)
            if (this.GridConfig.toolbarItemsConfig) {
                var gridToolBarConfig = JSON.parse(this.GridConfig.toolbarItemsConfig);
                var toolbarItems = e.toolbarOptions.items;
                $.each(toolbarItems, function (_, item) {
                    var configItem = gridToolBarConfig.find(function (config) {
                        return config.name === item.name;
                    });

                    if (configItem) {
                        item.options.onClick = function (args) {
                            eval(configItem.callElementView);
                        };
                    }
                });
            }



        // import features
        //e.toolbarOptions.items.push({
        //    name: "btnImport",
        //    location: "after",
        //    widget: "dxButton",
        //    options: {
        //        hint: "Import",
        //        icon: "upload",
        //        entityName: that.ModelName,
        //        importType: that.ImportType,
        //        onClick: that.showImportPopup.bind(this)
        //    }
        //});

    }
    onEditorPreparing(e) {
        var that = this;
        that.row = e.row;
        if (that.component == null || that.component == undefined)
            that.component = e.component;

    }

    //    onDataErrorOccurred(e) {
    //        }


    onEditorPrepared(e) {
        try {
            if (e.parentType == 'dataRow') {
                this.editors[e.dataField] = e.editorElement[e.editorElement.data().dxComponents[0]]('instance');
            }
        } catch (err) {
            appErrorHandling('Library error: call onEditorPrepared was failed.', err);
            console.trace();
        }
    }
    onBeforeSend(operation, ajaxSettings) {
        if (this.queryParams != null)
            $.extend(ajaxSettings.data, { queryParams: this.queryParams });
    }

    initDefaultValue(initNewRowEventParam) {
        var that = this;
    }

    //    onCellHoverChanged(e) { }

    onContextMenuPreparing(e) {
        var that = this;
        var dataGrid = e.component;
        var editorOptions = dataGrid.option("editing");
        var cloneItem = {
            text: "Copy Row",
            onItemClick: function () {
                var dialog = DevExpress.ui.dialog.confirm("Are you sure to make a copy of this row?");
                dialog.done(function (confirm) {
                    if (confirm == true) {
                        $.ajax({
                            url: `api/${that.ModelName}/Clone/${e.row.data.id}`,
                            headers: { 'Content-Type': 'application/json' },
                            success: function (result) {
                                e.component.refresh();
                                appNotifyInfo("Copy successed.");
                            },
                            error: function (e) {
                                appErrorHandling(e.responsetext, e);
                            }
                        });
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

    //    onRowExpanding(e) {
    //    }

    //    onRowUpdated(e) { }

    onRowInserted(e) { }
    onRowPrepared(e) { }
    onRowUpdating(e) { }
    onRowInserting(e) { }
    //    onSaved(e) { }
    //    onSaving(e) { }
    //    onRowRemoving(e) { }
    //    onRowRemoved(e) { }
    hyperLinkCode(columns, moduleName, controllerName, propertyName, specificLinkField = null) {
        $.each(columns, function (i, col) {
            if (col.dataField == (specificLinkField != null ? specificLinkField : "Code")) {
                col.cellTemplate = function (container, options) {
                    var selectedValue = options.data[propertyName];
                    $('<a>').addClass('dx-link dx-link-edit')
                        .text(options.text)
                        .on('dxclick', function () {
                            if (Object.keys(options.key).length > 0)
                                callElementView(`/${moduleName}/${controllerName}_Form/${selectedValue}`, `form_${controllerName}_Form_${options.key.id}`, `${controllerName} ${options.text}`);
                            else
                                callElementView(`/${moduleName}/${controllerName}_Form/${selectedValue}`, `form_${controllerName}_Form_${options.key}`, `${controllerName} ${options.text}`);
                            //callElementView(`/Business/MasterData/Client_Form/2`, `${controllerName}_Form`, `${controllerName} ${options.text}`);
                        })
                        .appendTo(container);
                }
            } else {

            }
        });
    }

    onEditingStart(e) {
        //this.editors = {};
        if (e.component.options != null && e.component.options.editing.mode != "batch" && e.component.options.editing.mode != "cell") {
            this.editors = {};
        }
        this.cellValues = {};
        this.curRowIndex = e.component.getRowIndexByKey(e.key);
    }

    onContentReady(e) {
    }

    onInitialized(e) {
        var that = this;
        that.dataGrid = e.component;
    }

    //    onRowValidating(e) {
    //    }

    onCellPrepared(e) {
        try {
            if (e.data && e.column.editorOptions != null && e.column.editorOptions.readOnly == true && e.component.option("editing.mode") === "batch") {
                e.cellElement.css("background-color", "#F2F2F2");
            }


        } catch (err) {
            appErrorHandling('Library error: call onCellPrepared was failed.', err);
        }
    }



    onKeyDown(e) {
        var that = this;
        //if (e.event.ctrlKey && e.event.key === "v") {
        //    e.event.preventDefault();
        //    e.component.element().focus();
        //    handlePaste(e.component, e.event, that);
        //}
    }


    onInitNewRow(info) {
        var that = this;
        if (that.filterRefField) {
            info.data[that.filterRefField] = that.filterRefId;
        }
        info.data[this.refField] = this.refId;
        if (this.filterRefId2 != null || this.filterRefId2 != undefined)
            info.data[this.filterRefField2] = this.filterRefId2;
    }

    getGridOptions(mGridConfigInstance = null) {
        try {
            this.isAllowRowMenu = true;
            var that = this;
            var summary = new Object();
            var gridEditorOptions = {};
            var fetchConfig = fetchConfigurationData(that.ModelName, that.gridType);
            var gridDataSource = makeBasicDataSource(that);
            if (that.mGridDetailOption != null || that.mGridDetailOption != undefined) {
                if (that.mGridDetailOption.visibleColumns != null || that.mGridDetailOption.visibleColumns != undefined) {
                    fetchConfig.getScheme = fetchConfig.getScheme.filter(field =>
                        that.mGridDetailOption.visibleColumns.includes(field.dataField)
                    );

                }
                if (that.mGridDetailOption.summary != null || that.mGridDetailOption.summary != undefined) {
                    summary = that.mGridDetailOption.summary;
                }
                if (that.mGridDetailOption.container != null || that.mGridDetailOption.container != undefined) {
                    that.container = that.mGridDetailOption.container;
                }
            }
            this.buildGridColumn(fetchConfig.getScheme);
            this.columns = fetchConfig.getScheme;
            this.GridConfig = getModelConfig(that.ModelName, false);
            if (that.gridType == "User")
                this.GridConfig = getModelConfig(that.ModelName);
            RenderGridElement(fetchConfig.getScheme, that);
            if (mGridConfigInstance) {
                if (mGridConfigInstance.gridEditorOptions != null || mGridConfigInstance.gridEditorOptions != undefined)
                    gridEditorOptions = mGridConfigInstance.gridEditorOptions;
            }
            else {
                try {
                    gridEditorOptions = this.GridConfig.gridEditorOptions ? JSON.parse(this.GridConfig.gridEditorOptions) : {};
                }
                catch {

                }
            }
            var defaultEditing = new Object();
            var exportConfig = new Object();
            if (fetchConfig.sysTableConfig) {
                try {
                    exportConfig = JSON.parse(fetchConfig.sysTableConfig.export);
                }
                catch {

                }
            }


            defaultEditing.editing = {
                mode: "batch",
                allowUpdating: true,
                allowDeleting: true,
                allowAdding: true,
                selectTextOnEditStart: true,
                startEditAction: "click"
            };
            var properties = {
                dataSource: gridDataSource,
                repaintChangesOnly: true,
                filterBuilder: { fields: this.columns },
                filterBuilderPopup: { position: { of: window, at: "top", my: "top", offset: { y: 10 } }, },
                errorRowEnabled: true,
                hoverStateEnabled: true,
                allowColumnReordering: true,
                allowColumnResizing: true,
                columnResizingMode: 'widget',
                columnHidingEnabled: false,
                columnAutoWidth: true,
                showColumnLines: true,
                columnChooser: { allowSearch: true, enabled: true },
                columnFixing: { enabled: true },
                sorting: { mode: 'multiple' },
                rowDragging: {
                    allowReordering: false,
                    onReorder: function (e) {
                        const gridInstance = e.component;
                        const dataSource = gridInstance.getDataSource();

                        let visibleRows = gridInstance.getVisibleRows();

                        const fromIndex = dataSource._items.findIndex((item) => item.id === e.itemData.id);
                        const toIndex = dataSource._items.findIndex((item) => item.id === visibleRows[e.toIndex].data.id);

                        const movedItem = dataSource._items.splice(fromIndex, 1)[0];
                        dataSource._items.splice(toIndex, 0, movedItem);

                        const updatedData = dataSource._items.map((item, index) => ({
                            id: item.id,
                            rowOrder: index + 1
                        }));
                        $.each(updatedData, function (_, row) {
                            dataSource.store().update(row.id, { rowOrder: row.rowOrder })
                                .then(() => {
                                })
                                .catch(error => console.error("Error updating rowOrder:", error));
                        });

                        dataSource.reload().then(() => {
                            gridInstance.refresh();
                        });
                    }
                },
                keyExpr: "id",
                //scrolling: { mode: 'infinite', showScrollbar: 'always' },
                scrolling: {
                    mode: 'virtual',
                    // renderingThreshold: 500,
                    preloadEnabled: false,
                    showScrollbar: 'always'
                },
                filterRow: { visible: true },
                headerFilter: { visible: true, allowSearch: true },
                filterPanel: { visible: true },
                groupPanel: { visible: true, allowColumnDragging: true, emptyPanelText: "" },
                grouping: {
                    contextMenuEnabled: true,
                    allowCollapsing: true,
                    expandMode: "rowClick",
                    texts: { groupContinuesMessage: "", groupContinuedMessage: "" }
                },
                loadPanel: { showPane: false, text: null },
                rowAlternationEnabled: false,
                paging: { enabled: true, pageSize: 50 }, // điều chỉnh nếu data nhiều
                pager: { showPageSizeSelector: true, allowedPageSizes: 50, showInfo: true },// điều chỉnh nếu data nhiều
                showBorders: true,
                summary: summary,
                export: (Object.keys(exportConfig)).length > 0 ? exportConfig : {
                    //allowExportSelectedData: true,
                    //enabled: true,
                    //excelFilterEnable: false,
                    //excelWrapTextEnable: false,
                    ////fileName: gConfig.MainObject,
                    //texts: { exportAll: 'Export all', exportSelectedRows: 'Export selected rows', exportTo: 'Export' }
                },
                //masterDetail: {},
                width: "100%",//"inherit"
                height: this.height ? this.height : window.innerHeight - 130, // == null ? "inherit"
                columns: this.columns,
                customizeColumns: tryExecute(this.onCustomizeColumns.bind(this)),
                onKeyDown: tryExecute(this.onKeyDown.bind(this)),
                onEditorPreparing: tryExecute(this.onEditorPreparing.bind(this)),
                onRowUpdating: tryExecute(this.onRowUpdating.bind(this)),
                onRowInserting: tryExecute(this.onRowInserting.bind(this)),
                //onSaved: tryExecute(this.onSaved.bind(this)),
                //onSaving: tryExecute(this.onSaving.bind(this)),
                onCellClick: tryExecute(this.onCellClick.bind(this)),
                //onRowExpanding: tryExecute(this.onRowExpanding.bind(this)),
                onRowInserted: tryExecute(this.onRowInserted.bind(this)),
                onRowPrepared: tryExecute(this.onRowPrepared.bind(this)),
                //onRowUpdated: tryExecute(this.onRowUpdated.bind(this)),
                //onRowRemoving: tryExecute(this.onRowRemoving.bind(this)),
                //onRowRemoved: tryExecute(this.onRowRemoved.bind(this)),
                onToolbarPreparing: tryExecute(this.onToolbarPreparing.bind(this)),
                onEditorPrepared: tryExecute(this.onEditorPrepared.bind(this)),
                onEditingStart: tryExecute(this.onEditingStart.bind(this)),
                onContentReady: tryExecute(this.onContentReady.bind(this)),
                onInitialized: tryExecute(this.onInitialized.bind(this)),
                //onRowValidating: tryExecute(this.onRowValidating.bind(this)),
                onInitNewRow: tryExecute(this.onInitNewRow.bind(this)),
                onContextMenuPreparing: tryExecute(this.onContextMenuPreparing.bind(this)),
                //onDataErrorOccurred: tryExecute(this.onDataErrorOccurred.bind(this))
                onCellPrepared: tryExecute(this.onCellPrepared.bind(this)),
                //onCellHoverChanged: tryExecute(this.onCellHoverChanged.bind(this)),
                //,onRowClick: function (e) {
                //    if (e.rowType == 'group') {
                //        if (e.isExpanded)
                //            e.component.collapseRow(e.key);
                //        else
                //            e.component.expandRow(e.key);
                //    }
                //}
                //editing: {
                //    ...((Object.keys(gridEditorOptions).length > 0) ? gridEditorOptions.edit : defaultEditing.edit)
                //},

                //...(Object.keys(gridEditorOptions).length > 0 ? gridEditorOptions : {})
                ...((Object.keys(gridEditorOptions).length > 0) ? gridEditorOptions : defaultEditing)
            };
            if (!properties.editing.allowAdding && !properties.editing.allowUpdating && !properties.editing.allowDeleting)
                this.isAllowRowMenu = false;
            else
                properties.rowDragging.allowReordering = true;


            if (that.Params)
                if (that.Params.isAllowRowMenu)
                    this.isAllowRowMenu = that.Params.isAllowRowMenu;

            return properties;
        } catch (err) {
            appErrorHandling('Library error: call GetGridOptions was failed.', err);
        }
    };


    showImportPopup(e) {
        //callElementView(url, tabCode, tabName);
        var that = this;
        var popupMGridDetail = $("<div>").appendTo($("#mainPopup")).dxPopup({
            maxWidth: "95%",
            maxHeight: "99%",
            showTitle: true,
            dragEnabled: true,
            resizeEnabled: true,
            deferRendering: true,
            contentTemplate: function (container) {
                //return container;
            },
            closeOnOutsideClick: false,
            onHidden: function (e) {
                $("#mainPopup").children("div:first").remove();
            }
        }).dxPopup("instance");
        popupMGridDetail.show();
    }

};

var MDropDownDataSource = class MDropDownDataSource {
    constructor() {
        this.queryParams = null;
    }
    set setQueryParams(queryParams) {
        this.queryParams = queryParams;
    }
    getDropDownDS(key, ApiMethod, customOptions) {
        var that = this;
        return new DevExpress.data.DataSource({
            key: key,
            store: new DevExpress.data.CustomStore({
                loadMode: "raw",
                key: key,
                cacheRawData: true
            }),
            load: function (loadOptions) {
                var d = $.Deferred();
                var params = {};
                var filter = [];

                params.skip = loadOptions.skip;
                params.take = loadOptions.take;
                params.sort = loadOptions.sort ? JSON.stringify(loadOptions.sort) : "";
                params.totalSummary = loadOptions.totalSummary ? JSON.stringify(loadOptions.totalSummary) : "";
                params.group = loadOptions.group ? JSON.stringify(loadOptions.group) : "";
                params.groupSummary = loadOptions.groupSummary ? JSON.stringify(loadOptions.groupSummary) : "";
                params.requireTotalCount = loadOptions.requireTotalCount;
                if (loadOptions.filter != undefined) {
                    filter[0] = loadOptions.filter;
                    params.filter = JSON.stringify(loadOptions.filter);
                }
                if (that.queryParams != null) {
                    params.queryParams = that.queryParams;
                }
                //If a user typed something in dxAutocomplete, dxSelectBox or dxLookup
                if (loadOptions.searchValue) {
                    if (filter[0] != undefined) {
                        filter[1] = "and";
                        filter[2] = [loadOptions.searchExpr, loadOptions.searchOperation, loadOptions.searchValue];
                    } else if (loadOptions.searchValue) {
                        filter[0] = [loadOptions.searchExpr, loadOptions.searchOperation, loadOptions.searchValue];
                    }
                }
                if (filter.length > 0) {
                    params.filter = JSON.stringify(filter);
                }
                $.ajaxSetup({
                    async: true
                });
                $.getJSON(`${ApiMethod}`, params).done(function (result) {
                    if (result != undefined) {
                        if (result.data != null) {
                            d.resolve(result.data
                                , {
                                    totalCount: result.totalCount,
                                    summary: result.summary
                                }
                            );
                        }
                        else {
                            d.resolve(result);
                        }
                    } else {
                        d.resolve();
                    }
                });
                return d.promise();
            },

            byKey: function (key, ex) {
                var url = null;
                if (typeof key === "object") {
                    key = JSON.stringify(key);
                }
                if (ApiMethod.indexOf("?") > 0)
                    url = `${ApiMethod}&key=${key.toString()}`;
                else
                    url = `${ApiMethod}?key=${key.toString()}`;

                var d = $.Deferred();
                $.get(url)
                    .done(function (result) {
                        if (result != undefined && result.data != null)
                            d.resolve(result.data[0]);
                        else
                            d.resolve(result);
                    });
                return d.promise();

            }
        }
        );
    }
}