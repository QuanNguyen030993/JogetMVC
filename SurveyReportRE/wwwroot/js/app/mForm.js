var MForm = class MForm {

    //constructor(id, gcConfig, numberSequence, cloneUrl, colCount) {
    constructor(id, childGridConfig, formConfig, formOptions) {
        try {
            this.id = id;
            this.isQuery = id == 0 ? false : true;
            this.isChildForeignKey = false;
            this.isAllowAddOutline = false;
            this.isOutlineDynamic = false;
            if (childGridConfig) {
                this.childGridConfig = childGridConfig;
            }
            this.colCount = 2;
            this.labelLocation = "left";
            this.outlineForm = { isUse: false, isOutlineChecked: false, isOutlineDynamic: false };
            this.isReadOnly = false;
            if (formConfig) {
                if (formConfig.isChildForeignKey != null || formConfig.isChildForeignKey != undefined) {
                    this.isChildForeignKey = formConfig.isChildForeignKey;
                }

                if (formConfig.fieldsFilterByTab != null || formConfig.fieldsFilterByTab != undefined) {
                    this.fieldsFilterByTab = formConfig.fieldsFilterByTab;
                }
                this.allowFormActionButton = true;
                if (formConfig.allowFormActionButton != null || formConfig.allowFormActionButton != undefined) {
                    this.allowFormActionButton = formConfig.allowFormActionButton;
                }
                if (formConfig.colCount != null || formConfig.colCount != undefined) {
                    this.colCount = formConfig.colCount;
                }
                if (formConfig.defaultTextAreaHeight != null || formConfig.defaultTextAreaHeight != undefined) {
                    this.defaultTextAreaHeight = formConfig.defaultTextAreaHeight;
                } if (formConfig.defaultTextAreaWidth != null || formConfig.defaultTextAreaWidth != undefined) {
                    this.defaultTextAreaWidth = formConfig.defaultTextAreaWidth;
                }
                if (formConfig.labelLocation != null || formConfig.labelLocation != undefined) {
                    this.labelLocation = formConfig.labelLocation;
                }
                if (formConfig.refFieldId != null || formConfig.refFieldId != undefined) {
                    this.refFieldId = formConfig.refFieldId;
                }
                if (formConfig.refFieldName != null || formConfig.refFieldName != undefined) {
                    this.refFieldName = formConfig.refFieldName;
                }
                if (formConfig.sameRefKeyAsId != null || formConfig.sameRefKeyAsId != undefined) {
                    this.sameRefKeyAsId = formConfig.sameRefKeyAsId;
                }
                if (formConfig.outlineForm != null || formConfig.outlineForm != undefined) {
                    this.outlineForm = formConfig.outlineForm;
                }
                if (formConfig.isAllowAddOutline != null || formConfig.isAllowAddOutline != undefined) {
                    this.isAllowAddOutline = formConfig.isAllowAddOutline;
                }
                //if (formConfig.isOutlineDynamic != null || formConfig.isOutlineDynamic != undefined) {
                //    this.isOutlineDynamic = formConfig.isOutlineDynamic;
                //}
                if (formConfig.isReadOnly != null || formConfig.isReadOnly != undefined) {
                    this.isReadOnly = formConfig.isReadOnly;
                }
            }
            this.formInstance = null;
            this.toolbarInstance = null;
            this.orgFormData = null;
            this.tabInstance = null;
            this.isBindingData = true;
            this.isReadonlyAllEditors = false;
            this.SchemeModelName = formConfig.schemeBasedOn ? formConfig.schemeBasedOn : formConfig.originModelName;
            this.ModelName = formConfig.originModelName;
            this.ReferenceModel = formConfig.originModelName;
            var formElement = $(`#form_${formConfig.formElementName}_${this.id}`);
            if (this.refFieldId != null || this.refFieldId != undefined)
                formElement = $(`#form_${formConfig.formElementName}_${this.refFieldId}_${this.id}`);
            if (this.sameRefKeyAsId)
                formElement = $(`#form_${formConfig.formElementName}_${this.refFieldId}`);
            if (formOptions != null || formOptions != undefined) 
                this.formOptions = formOptions;
            else
                this.formOptions = new MFormOption();

            this.container = formElement;
            if (formConfig != null || formConfig != undefined) {
                this.tabCode = formConfig.tabCode ? formConfig.tabCode : 'form_' + this.ModelName + `_Form_${this.id}`;;
                this.cloneUrl = formConfig.cloneUrl ? formConfig.cloneUrl : "";
                this.tabName = formConfig.tabName ? formConfig.tabName : this.ModelName;
            }
            //render form
            this.renderForm(this.container);

            return this;
        } catch (err) {
            appErrorHandling('Library error: call new MForm instance was failed.', err);
            return;
        }
    }

    initDataNewForm() {
        var that = this;
        var newRowdata = {};

        var listFieldHasDefaultValue = that.fieldConfigs.filter(
            value => value.defaultValue
        );

        $(listFieldHasDefaultValue).each(function (i, field) {
            newRowdata[`${field.dataField}`] = Function(field.defaultValue);
        });

        try {
            if (that.formInstance)
                that.formInstance.option("formData", newRowdata);
        }
        catch {

        }

    }

    customFormOrgData(data) {
        return data;
    }
    //init form in Edit mode

    initDataEditForm(data) {
        try {
            var that = this;
            if (data != undefined) {
                // update jquery ui tabs title
                if (that.container != null) {//&& document.getElementById(`${that.ModelName}_${that.id}`) != null) {
                    if (that.tabCode != null) {
                    } else {
                    }
                }
                var formD = that.customFormOrgData(data);
                // cache form data
                that.orgFormData = JSON.parse(JSON.stringify(formD));;

                // binding form data
                this.isBindingData = true;


                if (that.formInstance)
                    that.formInstance.option("formData", formD);


                this.isBindingData = false;

            }

        }
        catch (err) {
            appErrorHandling('Library error: call MForm.initDataEditForm() was failed.', err);
            return;
        }
    }


    loadData() {
        try {
            var that = this;
            var store = makeBasicDataSource(that, true);
            store.load();


        } catch (err) {
            appErrorHandling('Library error: call MForm.loadData() was failed.', err);
            return;
        }
    }



    //buildHttpMethod(apiMethod) {
    //    var httpMethod = apiMethod;
    //    if (apiMethod === 'CLONE' || apiMethod === 'GETBYID') {
    //        httpMethod = 'GET';
    //    }

    //    return httpMethod;
    //}

    callApi(apiMethod, dataInput, isClose) {
        try {
            var that = this;
            var efName = this.ModelName;
            var url = buildApiUrl(apiMethod, that);
            var dataVar = null;
            //var httpMethod = this.buildHttpMethod(apiMethod);
            if (dataInput) {
                dataVar = { values: dataInput.values };
                if (dataInput.key) {
                    dataVar = { key: dataInput.key, values: dataInput.values };
                }
            }
            var ajaxOptions = {
                url: url,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
                },
                type: (apiMethod == "GetSingle") || (apiMethod == "GetFKMany") ? "GET" : apiMethod,
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
                complete: function () {
                    //không chèn thông báo tại đây
                    //appLoadingPanel.hide(); // hide loading...
                }
            };

            apiMethod = (apiMethod == "GetSingle") || (apiMethod == "GetFKMany") ? "GET" : apiMethod;
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

    //after call API successfully start
    getSuccess(data) {
        var that = this;
        if (this.id > 0 && data != null) {
            that.orgFormData = data;
            // Workflow permission checking
            that.initDataEditForm(data);
        }
    }

    postSuccess(data) {
        var that = this;
        const nameKey = Object.keys(data).find(key => key.toLowerCase().endsWith("name"));
        this.id = data.id;
        this.guid = data.guid;
        this.formInstance.repaint();
        this.toolbarInstance = this.initFormToolbar(this.formInstance);
        if (this.container != null) {//&& document.getElementById(`${this.config.MainObject}_0`)) {
            this.cloneUrl = this.cloneUrl.replace("/0", `/${this.id}`);
            this.tabCode = this.tabCode + `_${this.id}`;
            setTabName(this.ModelName + " " + data[nameKey], this.ModelName + "_" + this.id);

        }
        appNotifySuccess(`${that.ModelName} added`, false);
        this.refreshForm();
    }

    putSuccess(data) {
        var that = this;
        appNotifySuccess(`${that.ModelName} updated`, false);
    }

    deleteSuccess(data) {
    }

    //cloneSuccess(data) {
    //}

    //after call API successfully end
    validateForm(form) {
        try {
            return form.validate();
        } catch (err) {
            appErrorHandling('Library error: call MForm.validateForm() was failed.', err);
            return;
        }
    }

    //render html elements
    renderForm(formElement) {
        try {
            ////create html start
            var that = this;
            //this.getContainer();
            var $scrollElement = $(`<div id='${that.ModelName}ScrollView'/>`).appendTo(this.container);
            this.Outline = null;
            if (this.outlineForm) {
                var outline = []
                if (this.outlineForm.surveyTypeId) {
                    if (_cacheModels.includes(that.SchemeModelName)) {
                        const cachedData = JSON.parse(sessionStorage.getItem(`${that.SchemeModelName}_${that.id}`));
                        if (cachedData == null) {
                            //$.ajax({
                            //    url: `api/Outline/GetFKMany?fkId=${this.outlineForm.surveyTypeId}&fkField=SurveyTypeId`,
                            //    type: 'GET',
                            //    async: false,
                            //    success: function (response) {
                            //        outline = response;
                            //    },
                            //    error: function (exception) {
                            //    }
                            //});

                            $.ajax({
                                url: `api/OutlineDynamic/GetFKMany?fkId=${this.outlineForm.surveyTypeId}&fkField=SurveyTypeId`,
                                type: 'GET',
                                async: false,
                                success: function (response) {
                                    outline.concat(response);
                                },
                                error: function (exception) {
                                }
                            });
                            sessionStorage.setItem(`${that.SchemeModelName}_${that.id}`, JSON.stringify(outline));
                        }
                        outline = JSON.parse(sessionStorage.getItem(`${that.SchemeModelName}_${that.id}`));
                    }
                    else {
                        //$.ajax({
                        //    url: `api/Outline/GetFKMany?fkId=${this.outlineForm.surveyTypeId}&fkField=SurveyTypeId`,
                        //    type: 'GET',
                        //    async: false,
                        //    success: function (response) {
                        //        outline = response;
                        //    },
                        //    error: function (exception) {
                        //    }
                        //});

                        $.ajax({
                            url: `api/OutlineDynamic/GetFKMany?fkId=${this.outlineForm.surveyTypeId}&fkField=SurveyTypeId`,
                            type: 'GET',
                            async: false,
                            success: function (response) {
                                outline.concat(response);
                            },
                            error: function (exception) {
                            }
                        });
                    }
                }
                else {
                    console.log(`${this.ModelName} is missing Survey Type`);
                }
                this.Outline = outline;
            }


            var itemsConfig = this.buildFormItem(); //should not do the same time.

            this.formInstance = formElement.dxForm({
                colCount: this.colCount,
                items: itemsConfig,
                height: "inherit",
                elementAttr: {
                    class: "dExForm",
                    id: this.id
                },
                readOnly: this.isReadOnly,
                changedFields: {},
                config: this,
                labelLocation: that.labelLocation,
                customizeItem: tryExecute(this.customizeForm.bind(this)),
                customFormOrgData: tryExecute(this.customFormOrgData.bind(this)),
                onContentReady: tryExecute(this.onContentReady.bind(this)),
                renderTabFormElement: tryExecute(this.renderTabFormElement.bind(this)),
                groupingLayout: tryExecute(this.groupingLayout.bind(this)),
                onFieldDataChanged: tryExecute(function (e) {
                    var that = this;
                    if (that.isBindingData) {
                        return;
                    }
                    const changedFields = e.component.option("changedFields");
                    const currentItem = this.formInstance.itemOption(e.dataField);
                    if (e.value !== e.previousValue) {
                        changedFields[e.dataField] = e.value;
                        if (that.fieldByOutlineGroup.length > 0) {
                            var outlineObject = that.fieldByOutlineGroup.find(f => f.dataField == e.dataField);
                            //changedFields[e.dataField + "_outlineId"] = outlineObject.outlineInstance[0];
                            changedFields[e.dataField + "_outlineId"] = outlineObject.outlineInstance;
                        }
                        if (that.dynamicOutline) {
                            var outlineObject = that.dynamicOutline.find(f => f.dataField == e.dataField);
                            if (outlineObject)
                                changedFields[e.dataField + "_outlineId"] = outlineObject.outlineInstance;
                            else if (currentItem.outlineObject)
                                changedFields[e.dataField + "_outlineId"] = currentItem.outlineObject;
                        }
                        else if (currentItem) {
                            if (currentItem.outlineObject)
                            changedFields[e.dataField + "_outlineId"] = currentItem.outlineObject;
                        }
                    } else {
                        delete changedFields[e.dataField];
                    }
                    markAccordionAsChanged(`accordion_${that.refFieldId}_${e.dataField}`);
                    // Cập nhật lại changedFields trong dxForm
                    e.component.option("changedFields", changedFields);
                }.bind(this))
            }).dxForm("instance");
            if (this.formInstance)
                this.formInstance.option("config", this);
            this.toolbarInstance = this.initFormToolbar(this.formInstance);
            //$formElement.find(".dx-tabpanel-container").css("height", `100%`);
            if (that.id > 0)
                this.loadData();
            else
                this.initDataNewForm();
        } catch (err) {
            appErrorHandling('Library error: call MForm.renderForm() was failed.', err);
            return;
        }
    }


    doSaveData(isClose) {
        try {
            var that = this;
            var form = that.formInstance;
            var result = that.validateForm(form);
            if (result == null || result.isValid) {
                var formData = form.option('formData');
                $.each(that.fieldConfigs, function (i, f) {
                    formData[f.calculatedDisplayField] = $try(function () {

                        var formField = form.getEditor(f.dataField);
                        if (formField != null || formField != undefined)
                            return form.getEditor(f.dataField).option('value');
                        else
                            return formData[f.dataField];
                    }) || "";
                });

                var id = formData["id"];
                this.orgFormData = formData;
                //delete formData["Guid"];
                var data = new Object();;
                if (id == null || id == undefined) {
                    delete formData["id"];
                    data.values = JSON.stringify(appReplaceDoubleQuote(formData));
                    that.callApi('POST', data, isClose);
                } else {
                    data.key = formData["id"];
                    data.values = JSON.stringify(appReplaceDoubleQuote(formData));
                    that.callApi('PUT', data, isClose);
                }
            }
        } catch (err) {
            appErrorHandling('Library error: call MForm.doSaveData() was failed.', err);
            return;
        }
    }

    //override it to define item layout
    customizeItemLayout() {
        var itemLayout = [];
        return itemLayout;
    }

    renderTabFormElement(_formConfig, itemsArray, formInstance) {
        if (formInstance.formOptions.ChildConfig) {
            $.each(formInstance.formOptions.ChildConfig, function (childIndex, childItem) {
                itemsArray.push({
                    colSpan: childItem.colSpan,
                    itemType: "tabbed",
                    tabs: [
                        {
                            title: childItem.title,
                            items: [{
                                template: function (data, itemElement) {
                                    eval(childItem.appendView);
                                }
                            }]
                        }
                    ],
                });
            });
        }
    }

    groupingLayout(_formConfig, itemsArray, formInstance) {
        var groupedItems = groupItemsByFormGroupName(itemsArray);
        var itemsArrayGroup = itemsArray.filter(f => f.itemType === "group");
        const outlineAdd = itemsArray.find(f => f.name === "addOutline");
        if (itemsArrayGroup.length > 0) {
            itemsArrayGroup.forEach(group => {
                if (groupedItems[group.name]) {
                    group.items = groupedItems[group.name];
                }
                //if (groupedItems["button"]) {
                //    group.items = groupedItems["button"];
                //}
            });
            if (outlineAdd != null || outlineAdd != undefined)
                itemsArrayGroup.push(outlineAdd);
            return itemsArrayGroup;
        }
        else return itemsArray;
    }

    //get item from customizeItemLayout()
    //build form items with scraffold
    buildFormItem() {
        try {
            var that = this;
            var menu = _menus.find(f => f.name == this.ModelName);
            if (menu != null || menu != undefined) {
                this.cloneUrl = menu.action + `_Form/${this.id}`;
            }
            var getScheme = [];
            //if (_cacheDataGridConfigs.length > 0)
            //    getScheme = _cacheDataGridConfigs.filter(f => f.sysTableFK.name == that.SchemeModelName);
            //else {
                $.ajax({
                    url: `api/DataGridConfig/GetAllScheme`,
                    method: "GET",
                    async: false,
                    success: function (dataIn) {
                        getScheme = dataIn.filter(f => f.sysTableFK.name == that.SchemeModelName);;
                    },
                    error: function (error) {
                        console.error(`Error fetching data from API for table :`, error);
                    }
                });
            //}
            //if (_cacheModels.includes(that.SchemeModelName)) {
            //    getScheme = _allScheme.filter(f => f.sysTableFK.name == that.SchemeModelName);
            //}
            //else {
            //    $.ajax({
            //        url: `/api/${that.SchemeModelName}/GetScheme`,
            //        type: 'GET',
            //        async: false,
            //        success: function (response) {
            //            getScheme = response;
            //        },
            //        error: function () {
            //        }
            //    });
            //}

            if (that.fieldsFilterByTab != undefined || that.fieldsFilterByTab != null) {
                getScheme = getScheme.filter(f => f.formGroupName == `Tab@${that.fieldsFilterByTab}`);
            }
            this.gridInstanceConfig = getScheme;
            var itemLayout = that.customizeItemLayout();
            RenderFormElement(getScheme, itemLayout, this);
            that.renderTabFormElement(getScheme, itemLayout, that);
            itemLayout = that.groupingLayout(getScheme, itemLayout, that);

            return itemLayout;
        } catch (err) {
            appErrorHandling('Library error: call MForm.buildFormItem() was failed.', err);
            return;
        }
    }

    moreActionOpenDropDown(e, dataSource, field) { }

    moreActionFromSelectedChangeDropDown(item, field, formInstance) { }

    dateBoxAttributeOverride(item) { }

    customizeToolbar() {
        try {
            var that = this;
            var items = [{
                name: 'btnSave',
                index: 0,
                location: 'after',
                widget: 'dxButton',
                locateInMenu: 'auto',
                disabled: this.isReadonlyAllEditors,
                options: {
                    type: 'success',
                    //disabled: true, tạm tắt
                    text: 'Save',
                    width: 100,
                    tabIndex: 100,
                    elementAttr: { role: 'SaveBtn', id: `btnSave_${that.ModelName}` },
                    visible: true,
                    onClick: function () {
                        that.doSaveData(false);

                    }
                }
            },
            {
                name: 'btnCancel',
                index: 1,
                location: 'after',
                widget: 'dxButton',
                locateInMenu: 'auto',
                options: {
                    type: 'default',
                    text: 'Cancel',
                    width: 100,
                    tabIndex: 200,
                    elementAttr: { role: 'CancelBtn', id: `btnCancel_${that.ModelName}` },
                    onClick: function () {
                        that.closeForm();
                    }
                }
            },
            //{
            //    name: 'btnDelete',
            //    index: 2,
            //    location: 'after',
            //    widget: 'dxButton',
            //    locateInMenu: 'auto',
            //    disabled: this.isReadonlyAllEditors,
            //    options: {
            //        type: 'danger',
            //        text: 'Delete',
            //        width: constBtnW,
            //        elementAttr: { role: 'DeleteBtn' },
            //        visible: this.config.AllowDeleting,
            //        onClick: function () {
            //            var result = DevExpress.ui.dialog.confirm("Are you sure you want to delete this record?", "Confirm delete");
            //            result.done(function (dialogResult) {
            //                if (dialogResult)
            //                    that.callApi('DELETE', null, true);
            //            });
            //        }
            //    }
            //},
            {
                name: 'btnRefresh',
                index: 3,
                location: 'after',
                widget: 'dxButton',
                options: {
                    type: 'default',
                    icon: 'refresh',
                    onClick: function () {
                        that.refreshForm();
                    }
                }
            }//,
                //{
                //    name: 'btnClone',
                //    index: 4,
                //    location: 'after',
                //    widget: 'dxButton',
                //    disabled: this.isReadonlyAllEditors,
                //    options: {
                //        type: 'default',

                //        icon: 'unselectall',
                //        visible: true,
                //        onClick: function () {
                //            that.callApi('CLONE', null, false);
                //        }
                //    }
                //}
            ];
            //if that.id == 0 remove btnClone, btnDelete, btnRefresh
            var itemsFiltered = null;
            if (that.id === 0) {
                itemsFiltered = items.filter(
                    function (it) {
                        return it.name !== 'btnClone' && it.name !== 'btnDelete' && it.name !== 'btnRefresh';
                    }
                );
            } else {
                itemsFiltered = items;
            }
            return itemsFiltered;
        } catch (err) {
            appErrorHandling('Library error: call MForm.customizeToolbar() was failed.', err);
            return;
        }
    }


    //override it to customize form items, by field
    customizeForm(item) {
    }

    initFormToolbar(formInstance) {
        var that = this;
        if (that.allowFormActionButton) {
            //var headerbox = formInstance.element().find(".dx-item.dx-box-item").first();
            var headerbox = formInstance.element().find(".dx-box-flex.dx-box.dx-widget.dx-visibility-change-handler.dx-collection").first();

            var toolbarItems = $(`<div id="${that.ModelName}Toolbar" class="dExFormToolBar"'/>`)
                .dxToolbar({
                    items: that.allowFormActionButton ? this.customizeToolbar() : [],
                    width: "100%",
                    onInitialized: tryExecute(function (e) {
                        var that = this;
                        //if (that.formPermissions.buttons.length > 0) {
                        //    var toolbarItems = e.component.option("items");
                        //    $.each(toolbarItems, function (index, it) {
                        //        if ($.inArray(it.name, that.formPermissions.butt  ons) < 0) {
                        //            it.options.disabled = true;
                        //        }
                        //    });
                        //    e.component.option("items", toolbarItems);
                        //}
                    }.bind(this))
                })
            // Nếu muốn đổi xuống dưới thì là appendTo(headerbox)
            var $toolbarElement = headerbox.prepend(toolbarItems);
            return toolbarItems.dxToolbar('instance');
            // Nếu muốn đổi xuống dưới thì là  return $toolbarElement.dxToolbar('instance');
        }
    }

    onContentReady(e) {
    }

    //getContainer() {
    //    //using for debug only
    //    if (this.container == null) {
    //        console.log('Cannot find Tab container!');
    //        this.container = document.getElementsByTagName('main');
    //    }
    //}

    closeForm(efName) {
        removeTab(efName);
    }

    refreshForm() {
        var that = this;
        callElementView(`${that.cloneUrl}`, `${that.tabCode}`, `${that.tabName}`);
    }


    moreActionFromSelectedChangeSelectBox(e, field) {

    }


};
var MFormOption = class MFormOption {
    constructor(params, childConfig) {
        if (params != null || params != undefined) {
            this.Params = params;
        }
        if (childConfig != null || childConfig != undefined) {
            this.ChildConfig = childConfig;
        }
    }
}