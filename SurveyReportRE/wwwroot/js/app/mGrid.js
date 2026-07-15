var MGrid = class MGrid {
    constructor(gridConfig, container, mGridOption) {
        try {
            this.ImportType = "default";
            this.refKey = 0;
            this.refField = "Id";
            this.refOperator = "=";
            //= Bằng <> Khác > Lớn hơn >= Lớn hơn hoặc bằng < Nhỏ hơn <= Nhỏ hơn hoặc bằng
            //contains Chuỗi có chứa notcontains Chuỗi không chứa startswith Bắt đầu với endswith Kết thúc với
            //! Phủ định and Và or Hoặc
            this.isAllowRowMenu = true;
            this.isBulkMode = false; // NEW
            // Layout editor mode properties
            this.isEditLayoutMode = false;
            this.gridIndexVisible = {}; // Stores visible column indexes
            this.originalColumnOrder = []; // Stores original column order
            //Note: 
            //refField correct in best practices column
            if (mGridOption) {
                if (mGridOption.mGridDetailOption != null || mGridOption.mGridDetailOption != undefined)
                    this.mGridDetailOption = mGridOption.mGridDetailOption;
                referenceMaking(this, mGridOption);
                if (mGridOption.isAllowRowMenu != null || mGridOption.isAllowRowMenu != undefined)
                    this.isAllowRowMenu = mGridOption.isAllowRowMenu;
                if (mGridOption.allowBuildOption != null || mGridOption.allowBuildOption != undefined)
                    this.allowBuildOption = mGridOption.allowBuildOption;
                if (mGridOption.gridEditorOptions != null || mGridOption.gridEditorOptions != undefined)
                    this.gridEditorOptions = mGridOption.gridEditorOptions;
                if (mGridOption.enableEditLayoutMode != null || mGridOption.enableEditLayoutMode != undefined)
                    this.enableEditLayoutMode = mGridOption.enableEditLayoutMode;
                if(mGridOption.ModelName != null || mGridOption.ModelName != undefined)
                    this.overrideGetUrl = `api/${mGridOption.ModelName}/GetAll`;
                if (mGridOption.overrideGetUrl != null || mGridOption.overrideGetUrl != undefined)
                    this.overrideGetUrl = mGridOption.overrideGetUrl;
                this.enableEditLayoutMode = true;
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

    //renderGrid() {
    //    try {
    //        var that = this;
    //        // Set reference to MGrid instance for MGridOption to use
    //        this.mGridOption.mGridInstance = this;

    //        if (!that.mGridOption.allowBuildOption)
    //            this.component = this.container.dxDataGrid(that.mGridOption.makeGridOptions(null)).dxDataGrid("instance");
    //        else
    //            this.component = this.container.dxDataGrid(that.mGridOption.makeGridOptions(that.mGridOption)).dxDataGrid("instance");

    //        // Initialize grid index visible
    //        this.updateGridIndexVisible();
    //        return this.component;
    //    } catch (err) {
    //        appErrorHandling('Library error: call renderGrid was failed.', err);
    //    }
    //};

    renderGrid() {

        try {

            var that = this;

            // Set reference
            this.mGridOption.mGridInstance = this;

            var buildOptionPromise =
                !that.mGridOption.allowBuildOption
                    ? that.mGridOption.makeGridOptions(null)
                    : that.mGridOption.makeGridOptions(that.mGridOption);

            buildOptionPromise.then(gridOptions => {

                if (!gridOptions)
                    return;

                this.component = this.container
                    .dxDataGrid(gridOptions)
                    .dxDataGrid("instance");

                // Initialize grid index visible
                this.updateGridIndexVisible();

                // Attach Excel paste listener
                this.container.on("paste", (htmlEvent) => {
                    const clipboardData = htmlEvent.originalEvent.clipboardData || window.clipboardData;
                    const pastedData = clipboardData.getData("text");
                    if (!pastedData) return;
                    
                    const rows = pastedData.split(/\r?\n/).map(row => row.split("\t"));
                    if (rows.length === 0 || (rows.length === 1 && rows[0].length === 1 && rows[0][0] === "")) return;
                    
                    const gridInstance = this.component;
                    const lastCell = this.mGridOption.focusData;
                    if (!lastCell || lastCell.rowIndex === undefined) return;
                    
                    htmlEvent.preventDefault();
                    
                    const visibleColumns = gridInstance.getVisibleColumns();
                    const startColIndex = visibleColumns.findIndex(c => c.dataField === lastCell.column.dataField);
                    if (startColIndex === -1) return;
                    
                    gridInstance.beginUpdate();
                    
                    for (let r = 0; r < rows.length; r++) {
                        const rowData = rows[r];
                        const targetRowIndex = lastCell.rowIndex + r;
                        if (rowData.length === 1 && rowData[0] === "" && r === rows.length - 1) continue;
                        
                        for (let c = 0; c < rowData.length; c++) {
                            const val = rowData[c];
                            const targetColIndex = startColIndex + c;
                            if (targetColIndex >= visibleColumns.length) continue;
                            
                            const col = visibleColumns[targetColIndex];
                            if (col && col.allowEditing !== false && col.dataField) {
                                let typedVal = val;
                                if (col.dataType === "number") {
                                    typedVal = val === "" ? null : Number(val);
                                } else if (col.dataType === "boolean") {
                                    typedVal = val.toLowerCase() === "true" || val === "1" || val.toLowerCase() === "yes";
                                }
                                gridInstance.cellValue(targetRowIndex, col.dataField, typedVal);
                            }
                        }
                    }
                    
                    gridInstance.endUpdate();
                });

            }).catch(err => {

                appErrorHandling(
                    'Library error: renderGrid async failed.',
                    err
                );
            });

        }
        catch (err) {

            appErrorHandling(
                'Library error: call renderGrid was failed.',
                err
            );
        }
    }

    /**
     * Toggle edit layout mode - enables/disables column reordering
     */
    toggleEditLayoutMode() {
        try {
            this.isEditLayoutMode = !this.isEditLayoutMode;

            if (this.component) {
                this.component.option('allowColumnReordering', this.isEditLayoutMode);
                this.component.option('allowColumnResizing', this.isEditLayoutMode);
                this.component.option(
                    'columnResizingMode',
                    this.isEditLayoutMode ? 'widget' : 'nextColumn'
                );

                if (this.isEditLayoutMode) {
                    this.container.addClass('mgrid-edit-layout-mode');

                    // highlight nhẹ toàn grid
                    this.component.element().css({
                        transition: "all 0.2s ease"
                    });

                    appNotifyInfo('Layout edit mode ON');
                } else {
                    this.container.removeClass('mgrid-edit-layout-mode');

                    this.component.element().css({
                        transition: ""
                    });

                    this.saveLayoutConfiguration();
                    appNotifyInfo('Layout saved');
                }
            }

            return this.isEditLayoutMode;

        } catch (err) {
            appErrorHandling('toggleEditLayoutMode error', err);
        }
    }
    /**
     * Update gridIndexVisible based on current visible columns order from array elements
     */
    updateGridIndexVisible() {
        try {
            if (!this.component) return;

            // Get columns from the component's column array (actual order in DOM)
            const columns = this.component.option('columns');
            this.gridIndexVisible = {};

            // Filter visible columns and assign index based on their position in the array
            let visibleIndex = 0;
            columns.forEach((col, arrayIndex) => {
                if (col && col.dataField && col.visible !== false) {
                    this.gridIndexVisible[col.dataField] = visibleIndex;
                    visibleIndex++ * 100;
                }
            });

            //console.log('Grid Index Visible Updated from array order:', this.gridIndexVisible);
        } catch (err) {
            appErrorHandling('Library error: call updateGridIndexVisible was failed.', err);
        }
    }

    /**
     * Get current gridIndexVisible configuration
     */
    getGridIndexVisible() {
        return this.gridIndexVisible;
    }

    /**
     * Set gridIndexVisible and apply column order
     */
    setGridIndexVisible(indexConfig) {
        try {
            if (!this.component || !indexConfig) return;
            this.gridIndexVisible = indexConfig;
            var columns = this.component.getVisibleColumns();
            var arrangeCols = {};
            var count = 1;
            columns.forEach(f => {
                arrangeCols[f.dataField] = count * 100;
                count++;
            });

            indexConfig = arrangeCols;
            this.gridIndexVisible = indexConfig;
            this.component.refresh();
        } catch (err) {
            appErrorHandling('Library error: call setGridIndexVisible was failed.', err);
        }
    }

    /**
     * Save layout configuration to localStorage and server
     */
    saveLayoutConfiguration() {
        try {
            this.setGridIndexVisible(this.gridIndexVisible)
            //const configKey = `mgrid_layout_${this.mGridOption.ModelName}`;
            //const layoutConfig = {
            //    gridIndexVisible: this.gridIndexVisible,
            //    timestamp: new Date().toISOString()
            //};
            //localStorage.setItem(configKey, JSON.stringify(layoutConfig));
            //console.log('Layout configuration saved to localStorage:', configKey);

            // Save to server via API
            this.saveLayoutToServer(this.gridIndexVisible);
        } catch (err) {
            appErrorHandling('Library error: call saveLayoutConfiguration was failed.', err);
        }
    }

    /**
     * Save layout configuration to server (database)
     */
    saveLayoutToServer(gridVisibleIndexConfig) {
        var passingObject = new Object();
        passingObject.Ids = gridVisibleIndexConfig;
        passingObject.ModelName = this.mGridOption.ModelName;
        passingObject.ModelId = this.mGridOption.ModelId;
        try {
            $.ajax({
                url: '/api/DataGridConfig/UpdateGridVisibleIndex',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(passingObject),
                success: function (result) {
                    if (result.success) {
                        appNotifyInfo(`Grid layout saved successfully (${result.updatedCount} columns updated)`);
                        //console.log('Layout configuration saved to server:', result);
                    } else {
                        console.warn('Server response:', result);
                    }
                },
                error: function (err) {
                    console.error('Failed to save layout to server:', err);
                    appErrorHandling('Failed to save grid layout to server', err);
                }
            });
        } catch (err) {
            appErrorHandling('Library error: call saveLayoutToServer was failed.', err);
        }
    }

    /**
     * Load layout configuration from server
     */
    loadLayoutFromServer(sysTableId = null) {
        try {
            const url = sysTableId
                ? `/api/DataGridConfig/GetGridVisibleIndex?sysTableId=${sysTableId}`
                : '/api/DataGridConfig/GetGridVisibleIndex';

            $.ajax({
                url: url,
                method: 'GET',
                dataType: 'json',
                success: function (result) {
                    if (result.success && result.data) {
                        this.setGridIndexVisible(result.data);
                        appNotifyInfo(`Grid layout loaded from server (${result.count} columns)`);
                        //console.log('Layout configuration loaded from server:', result.data);
                    } else {
                        //console.warn('No layout configuration found on server');
                    }
                }.bind(this),
                error: function (err) {
                    console.error('Failed to load layout from server:', err);
                    // Continue with localStorage fallback
                }
            });
        } catch (err) {
            appErrorHandling('Library error: call loadLayoutFromServer was failed.', err);
        }
    }

    /**
     * Load layout configuration from localStorage and server
     */
    loadLayoutConfiguration() {
        try {
            // First try to load from server
            this.loadLayoutFromServer();

            // Fallback to localStorage if server load fails
            const configKey = `mgrid_layout_${this.mGridOption.ModelName}`;
            const savedConfig = localStorage.getItem(configKey);

            if (savedConfig) {
                const layoutConfig = JSON.parse(savedConfig);
                if (layoutConfig.gridIndexVisible) {
                    this.setGridIndexVisible(layoutConfig.gridIndexVisible);
                    //console.log('Layout configuration loaded from localStorage:', configKey);
                }
            }
        } catch (err) {
            appErrorHandling('Library error: call loadLayoutConfiguration was failed.', err);
        }
    }

    /**
     * Reset layout to default configuration
     */
    resetLayoutToDefault() {
        try {
            const configKey = `mgrid_layout_${this.mGridOption.ModelName}`;
            localStorage.removeItem(configKey);

            if (this.component) {
                this.component.refresh();
                this.updateGridIndexVisible();
                appNotifyInfo('Grid layout reset to default');
            }
        } catch (err) {
            appErrorHandling('Library error: call resetLayoutToDefault was failed.', err);
        }
    }

    toggleBulkMode() {
        try {
            this.isBulkMode = !this.isBulkMode;

            if (this.component) {
                if (this.isBulkMode) {
                    this.component.option("selection", {
                        mode: "multiple",
                        showCheckBoxesMode: "always"
                    });

                    appNotifyInfo("Bulk mode enabled");
                } else {
                    this.component.clearSelection();

                    this.component.option("selection", {
                        mode: "single"
                    });

                    appNotifyInfo("Bulk mode disabled");
                }
            }

            return this.isBulkMode;
        } catch (err) {
            appErrorHandling("Error toggleBulkMode", err);
        }
    }

    getSelectedRows() {
        if (!this.component) return [];
        return this.component.getSelectedRowsData();
    }

    executeBulkDelete() {
        const rows = this.getSelectedRows();

        if (!rows || rows.length === 0) {
            appNotifyInfo("No rows selected");
            return;
        }

        var that = this;

        var dialog = DevExpress.ui.dialog.confirm(
            `Delete ${rows.length} records?`
        );

        dialog.done(function (confirm) {
            if (!confirm) return;

            const ids = rows.map(x => x.id);

            $.ajax({
                url: `api/${that.mGridOption.ModelName}/BulkDelete`,
                method: "POST",
                contentType: "application/json",
                data: JSON.stringify(ids),
                success: function () {
                    that.component.refresh();
                    appNotifyInfo("Bulk delete success");
                },
                error: function (err) {
                    appErrorHandling("Bulk delete failed", err);
                }
            });
        });
    }


};
var MGridOption = class MGridOption {
    constructor(modelName, gridType, gridConfig) {
        this.editors = {};
        this.ModelName = modelName;
        if (gridConfig) {
            this.mGridDetailOption = gridConfig;
            referenceMaking(this, gridConfig);
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
                                if (editor.NAME == "dxDropDownBox" && value != null) {
                                    if (editor.selectedItem != null) {
                                        var selectedData = editor.selectedItem[0];
                                        $.each(this.desFieldNames, function (i, dFieldName) {
                                            var selectedValue = selectedData[dFieldName.DrFieldName];
                                            //if (selectedValue == undefined)
                                            //    selectedValue = dFieldName.DrFieldName;
                                            newData[dFieldName.FieldName] = selectedValue;
                                        });
                                    }
                                }
                                // select box
                                else if (editor.NAME == "dxSelectBox" && editor.option("displayValue") != null && value != null) {
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
                icon: "refresh",
                onClick: function () {
                    dtGrid.refresh();
                }
            }
        });

        if (_isSuperUser) {
            // Add Edit Layout button (always visible)
            e.toolbarOptions.items.unshift({
                location: "after",
                widget: "dxButton",
                options: {
                    text: 'Edit Layout',
                    icon: "edit",
                    onClick: function () {
                        if (that.mGridInstance) {
                            that.mGridInstance.toggleEditLayoutMode();
                            // Update button appearance
                            if (that.mGridInstance.isEditLayoutMode) {
                                $(this).dxButton('instance').option('type', 'success');
                                $(this).dxButton('instance').option('text', 'Exit Layout Edit');
                            } else {
                                $(this).dxButton('instance').option('type', 'default');
                                $(this).dxButton('instance').option('text', 'Edit Layout');
                            }
                        }
                    }
                }
            });
            // Bulk Mode Toggle Button
            e.toolbarOptions.items.unshift({
                location: "after",
                widget: "dxButton",
                options: {
                    text: "Bulk Mode",
                    icon: "check",
                    onClick: function () {
                        if (that.mGridInstance) {
                            let isOn = that.mGridInstance.toggleBulkMode();

                            const btn = $(this).dxButton("instance");

                            if (isOn) {
                                btn.option({
                                    type: "success",
                                    text: "Exit Bulk Mode"
                                });
                            } else {
                                btn.option({
                                    type: "default",
                                    text: "Bulk Mode"
                                });
                            }
                        }
                    }
                }
            });
            // Bulk Delete Button
            e.toolbarOptions.items.unshift({
                location: "after",
                widget: "dxButton",
                options: {
                    text: "Delete Selected",
                    icon: "trash",
                    onClick: function () {
                        if (that.mGridInstance) {
                            that.mGridInstance.executeBulkDelete();
                        }
                    }
                }
            });
        }
        if (this.GridConfig)
            if (this.GridConfig.sysTableConfig.toolbarItemsConfig) {
                var gridToolBarConfig = tryParseJSON((this.GridConfig.sysTableConfig.toolbarItemsConfig),"toolbarItemsConfig Problem");
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
    onRowPrepared(e) {
        if (e.rowType === "data") {
            if (e.data.isView != null)
                if (!e.data.isView) {
                    if (_isSuperUser == "true")
                        e.rowElement
                            .attr("style", `
                        opacity: 0.4 !important;
                        pointer-events: none !important;
                    `);
                    else
                        e.rowElement
                            .attr("style", `display: none;`);
                }
        }
    }
    onRowUpdating(e) { }
    onRowInserting(e) { }
    onSaved(e) { }
    onSaving(e) { }
    onRowRemoving(e) { }
    onRowRemoved(e) { }
    onSelectionChanged(e) { }
    hyperLinkCode(columns, moduleName, controllerName, propertyName, specificLinkField = null) {
        $.each(columns, function (i, col) {
            if (col.dataField == (specificLinkField != null ? specificLinkField : "Code")) {
                col.cellTemplate = function (container, options) {
                    var selectedValue = options.data[propertyName];
                    $('<a>').addClass('dx-link dx-link-edit')
                        .text(options.text)
                        .css({ color: "#337ab7", textDecoration: "underline", cursor: "pointer" })
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

        const grid = e.component;


        const gridElement = grid.element().get(0);
        const hostElement = gridElement?.parentElement;
        const hostStyle = hostElement ? window.getComputedStyle(hostElement) : null;
        const hostHorizontalPadding = hostStyle
            ? (parseFloat(hostStyle.paddingLeft) || 0) + (parseFloat(hostStyle.paddingRight) || 0)
            : 0;
        const targetWidth = Math.floor(
            (hostElement?.clientWidth || gridElement?.clientWidth || window.innerWidth) - hostHorizontalPadding
        );


        const cols =
            grid.getVisibleColumns()
                .filter(c => !c.command);



        const totalDefault =
            cols.length *
            _defaultGridFieldWidth;



        // Only grids with too few columns are stretched to fill their actual form.
        if (targetWidth > 0 && totalDefault < targetWidth * 0.85) {

            stretchColumnsEvenly(e, {

                targetWidth,

                defaultWidth:
                    _defaultGridFieldWidth,

                excludeFields: [],
                fillRatio: 0.85

            });

        }


        // Load saved layout configuration
        if (!this.layoutConfigurationLoaded && this.loadLayoutConfiguration) {
            this.layoutConfigurationLoaded = true;
            this.loadLayoutConfiguration();
        }
    }

    onInitialized(e) {
        var that = this;
        that.dataGrid = e.component;

        // Set up column reordering handler
        var gridInstance = e.component;
        var originalOnOptionChanged = gridInstance.option('onOptionChanged');

        gridInstance.on('optionChanged', function (eventArgs) {
            if (eventArgs.name === 'columns' && that.isEditLayoutMode) {
                // Delay update to ensure all column movements are processed
                setTimeout(function () {
                    that.updateGridIndexVisible();
                }, 100);
            }

            if (typeof originalOnOptionChanged === 'function') {
                originalOnOptionChanged(eventArgs);
            }
        });
    }

    //    onRowValidating(e) {
    //    }

    onCellPrepared(e) {
        try {
            var that = this
            if (e.rowType === "data" && e.column.command && e.column.command != "drag" && e.column.command != "select") {
                if (_isSuperUser == "true") {
                    if (e.data.isView != null) {
                        visibleCommentButtonCell(e, that);
                    }
                }
            }
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
        if (that.refField) {
            info.data[that.refField] = that.refKey;
        }
        info.data[this.refField] = this.refKey;
        if (this.refKey2 != null || this.refKey2 != undefined)
            info.data[this.refField2] = this.refKey2;
    }



    async makeGridOptions(mGridConfigInstance = null) {
        var that = this;
        that.fromGrid = true;
        return fetchConfigurationData(that.ModelName, that.gridType, that).then(fetchConfig => {
            try {
                this.isAllowRowMenu = true;
                var summary = new Object();
                var gridEditorOptions = {};

                that.customQuery = fetchConfig?.sysTableConfig?.customQuery ?? "";
                var gridDataSource = makeBasicDataSource(that, false, that.customQuery != "" ? true : false);
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


                this.GridConfig = fetchConfig;//getModelConfig(that.ModelName, false);
                if (that.gridType == "User")
                    this.GridConfig = fetchConfig;// getModelConfig(that.ModelName);
                this.ModelId = fetchConfig.sysTableConfig?.id || 0;

                if (mGridConfigInstance) {
                    if (mGridConfigInstance.gridEditorOptions != null || mGridConfigInstance.gridEditorOptions != undefined)
                        gridEditorOptions = mGridConfigInstance.gridEditorOptions;
                }
                else {
                    try {
                        if (this.GridConfig)
                            gridEditorOptions = this.GridConfig.gridEditorOptions ? tryParseJSON(this.GridConfig.gridEditorOptions, "Grid Editors Options Problem") : {};
                        if (this.GridConfig?.sysTableConfig)
                            gridEditorOptions = this.GridConfig?.sysTableConfig?.gridEditorOptions ? tryParseJSON(this.GridConfig?.sysTableConfig?.gridEditorOptions, "Grid Editors Options Problem") : {};
                    }
                    catch {

                    }
                }
                if (this.gridEditorOptions != null || this.gridEditorOptions != undefined)
                    gridEditorOptions = this.gridEditorOptions;
                var defaultEditing = new Object();
                var exportConfig = new Object();
                if (fetchConfig.sysTableConfig) {
                    try {
                        exportConfig = JSON.parse(fetchConfig.sysTableConfig.export);
                    }
                    catch {

                    }
                }

                var defaultSelection = { mode: "single" };
                var selection = {};
                if (that.Params?.selection) {
                    selection = that.Params?.selection;
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
                    columnAutoWidth: false,
                    showColumnLines: true,
                    columnChooser: { allowSearch: true, enabled: true },
                    columnFixing: { enabled: true },
                    sorting: { mode: 'multiple' },
                    //rowDragging: {
                    //    allowReordering: false,
                    //    onReorder: function (e) {
                    //        const gridInstance = e.component;
                    //        const dataSource = gridInstance.getDataSource();

                    //        let visibleRows = gridInstance.getVisibleRows();

                    //        const fromIndex = dataSource._items.findIndex((item) => item.id === e.itemData.id);
                    //        const toIndex = dataSource._items.findIndex((item) => item.id === visibleRows[e.toIndex].data.id);

                    //        const movedItem = dataSource._items.splice(fromIndex, 1)[0];
                    //        dataSource._items.splice(toIndex, 0, movedItem);

                    //        const updatedData = dataSource._items.map((item, index) => ({
                    //            id: item.id,
                    //            rowOrder: index + 1
                    //        }));
                    //        $.each(updatedData, function (_, row) {
                    //            dataSource.store().update(row.id, { rowOrder: row.rowOrder })
                    //                .then(() => {
                    //                })
                    //                .catch(error => console.error("Error updating rowOrder:", error));
                    //        });

                    //        dataSource.reload().then(() => {
                    //            gridInstance.refresh();
                    //        });
                    //    }
                    //},
                    rowDragging: null,
                    keyExpr: (gridDataSource instanceof DevExpress.data.DataSource || gridDataSource instanceof DevExpress.data.CustomStore) ? null : (fetchConfig?.keyExpr ?? "id"),
                    //scrolling: { mode: 'infinite', showScrollbar: 'always' },
                    scrolling: {
                        mode: 'standard',
                        rowRenderingMode: 'virtual',
                        useNative: true,
                        showScrollbar: 'always'
                    },
                    filterRow: { visible: true },
                    headerFilter: { visible: true, allowSearch: true },
                    remoteOperations: fetchConfig?.sysTableConfig?.customQuery == "OnSystem" ? { paging: false, sorting: false, filtering: false } : null,
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
                    paging: { enabled: true, pageSize: 50 },
                    pager: {
                        visible: true,
                        allowedPageSizes: [25, 50, 100, 200],
                        showPageSizeSelector: true,
                        showNavigationButtons: true,
                        showInfo: true
                    },
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
                    masterDetail: this.masterDetail,
                    width: "100%",
                    height: this.height ? this.height : window.innerHeight - 130, // == null ? "inherit"
                    columns: this.columns,
                    customizeColumns: tryExecute(this.onCustomizeColumns.bind(this)),
                    onKeyDown: tryExecute(this.onKeyDown.bind(this)),
                    onEditorPreparing: tryExecute(this.onEditorPreparing.bind(this)),
                    onRowUpdating: tryExecute(this.onRowUpdating.bind(this)),
                    onRowInserting: tryExecute(this.onRowInserting.bind(this)),
                    onSaved: tryExecute(this.onSaved.bind(this)),
                    onSaving: tryExecute(this.onSaving.bind(this)),
                    onCellClick: tryExecute(this.onCellClick.bind(this)),
                    //onRowExpanding: tryExecute(this.onRowExpanding.bind(this)),
                    onRowInserted: tryExecute(this.onRowInserted.bind(this)),
                    onRowPrepared: tryExecute(this.onRowPrepared.bind(this)),
                    //onRowUpdated: tryExecute(this.onRowUpdated.bind(this)),
                    onRowRemoving: tryExecute(this.onRowRemoving.bind(this)),
                    onRowRemoved: tryExecute(this.onRowRemoved.bind(this)),
                    onSelectionChanged: tryExecute(this.onSelectionChanged.bind(this)),
                    onToolbarPreparing: tryExecute(this.onToolbarPreparing.bind(this)),
                    onEditorPrepared: tryExecute(this.onEditorPrepared.bind(this)),
                    onEditingStart: tryExecute(this.onEditingStart.bind(this)),
                    onContentReady: tryExecute(this.onContentReady.bind(this)),
                    onInitialized: tryExecute(this.onInitialized.bind(this)),
                    //onRowValidating: tryExecute(this.onRowValidating.bind(this)),
                    onInitNewRow: tryExecute(this.onInitNewRow.bind(this)),
                    makeGridOptions: tryExecute(this.makeGridOptions.bind(this)),
                    onContextMenuPreparing: tryExecute(this.onContextMenuPreparing.bind(this)),
                    //onDataErrorOccurred: tryExecute(this.onDataErrorOccurred.bind(this))
                    onCellPrepared: tryExecute(this.onCellPrepared.bind(this)),
                    selection: (Object.keys(selection).length > 0) ? selection : defaultSelection,
                    //onCellHoverChanged: tryExecute(this.onCellHoverChanged.bind(this)),
                    onRowClick: tryExecute(this.onRowClick.bind(this)),
                    //editing: {
                    //    ...((Object.keys(gridEditorOptions).length > 0) ? gridEditorOptions.edit : defaultEditing.edit)
                    //},

                    //...(Object.keys(gridEditorOptions).length > 0 ? gridEditorOptions : {})
                    ...((Object.keys(gridEditorOptions).length > 0) ? gridEditorOptions : defaultEditing)
                };

                if (!properties.editing.allowAdding && !properties.editing.allowUpdating && !properties.editing.allowDeleting)
                    this.isAllowRowMenu = false;
                //else
                //    properties.rowDragging.allowReordering = true;


                if (that.Params)
                    if (that.Params.isAllowRowMenu)
                        this.isAllowRowMenu = that.Params.isAllowRowMenu;
                return properties;

            } catch (err) {
                appErrorHandling('Library error: call GetGridOptions was failed.', err);
            }
        });
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
    onRowClick(e) {
        if (e.rowType == 'group') {
            if (e.isExpanded)
                e.component.collapseRow(e.key);
            else
                e.component.expandRow(e.key);
        }
    }
};

var MDropDownDataSource = class MDropDownDataSource {
    //Performance check query in need
    constructor() {
        this.queryParams = null;
    }
    setQueryParams(queryParams) {
        this.queryParams = queryParams;
    }

    getDropDownDS(key, ApiMethod, customOptions) {
        var that = this;

        return new DevExpress.data.CustomStore({
            key: key,
            loadMode: "raw",
            load: function (loadOptions) {
                var d = $.Deferred();
                var params = structuredClone(customOptions);
                var filter = [];
                //params.skip = customOptions.skip;
                //params.take = customOptions.take;
                params.sort = loadOptions.sort ? JSON.stringify(loadOptions.sort) : "";
                params.totalSummary = loadOptions.totalSummary ? JSON.stringify(loadOptions.totalSummary) : "";
                params.group = loadOptions.group ? JSON.stringify(loadOptions.group) : "";
                params.groupSummary = loadOptions.groupSummary ? JSON.stringify(loadOptions.groupSummary) : "";
                params.requireTotalCount = loadOptions.requireTotalCount;
                if (loadOptions.filter != undefined) {
                    filter[0] = loadOptions.filter;
                    params.key = JSON.stringify(loadOptions.filter);
                }

                if (that.queryParams != null) {
                    params.queryParams = that.queryParams;
                }

                if (loadOptions.searchValue) {
                    if (filter[0] != undefined) {
                        filter[1] = "and";
                        filter[2] = [loadOptions.searchExpr, loadOptions.searchOperation, loadOptions.searchValue];
                    } else {
                        filter[0] = [loadOptions.searchExpr, loadOptions.searchOperation, loadOptions.searchValue];
                    }
                }

                if (filter.length > 0) {
                    params.filter = JSON.stringify(filter);
                }
                $.getJSON(ApiMethod.replace("DropDownLookUp", "GetAll"), params)
                    .done(function (result) {
                        if (result != undefined) {
                            if (result.data != null) {
                                d.resolve(result.data, {
                                    totalCount: result.totalCount,
                                    summary: result.summary
                                });
                            } else {
                                d.resolve(result);
                            }
                        } else {
                            d.resolve([]);
                        }
                    })
                    .fail(function (xhr) {
                        d.reject(xhr);
                    });

                return d.promise();
            },

            byKey: function (value) {
                var url = null;
                if (typeof value === "object") {
                    value = JSON.stringify(value);
                }

                if (ApiMethod.indexOf("?") > 0)
                    url = `${ApiMethod}&key=${encodeURIComponent(value)}`;
                else
                    url = `${ApiMethod}?key=${encodeURIComponent(value)}`;

                var d = $.Deferred();

                $.get(url)
                    .done(function (result) {
                        if (result != undefined && result.data != null)
                            d.resolve(result.data[0]);
                        else if (Array.isArray(result))
                            d.resolve(result[0]);
                        else
                            d.resolve(result);
                        //return Array.isArray(result) ? result[0] : result;
                    })
                    .fail(function (xhr) {
                        d.reject(xhr);
                    });

                return d.promise();
            }
        });
    }
}
function referenceMaking(item, gridConfig) {
    if (gridConfig.refKey != null || gridConfig.refKey != undefined)
        item.refKey = gridConfig.refKey;
    if (gridConfig.refOperator != null || gridConfig.refOperator != undefined)
        item.refOperator = gridConfig.refOperator;
    if (gridConfig.refField != null || gridConfig.refField != undefined)
        item.refField = gridConfig.refField;
    if (gridConfig.refKey2 != undefined)
        item.refKey2 = gridConfig.refKey2;
    if (gridConfig.refOperator2 != null || gridConfig.refOperator2 != undefined)
        item.refOperator2 = gridConfig.refOperator2;
    if (gridConfig.refField2 != undefined)
        item.refField2 = gridConfig.refField2;
}
