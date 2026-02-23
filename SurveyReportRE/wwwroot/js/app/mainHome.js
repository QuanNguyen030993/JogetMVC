var callElementView = function (url, code, caption, data) {
    try {
        if (url.length === 0) {
            appNotify({ message: "Page request does not exist.", type: 'info' });
            return false;
        }
        var routes = url.split('/');
        if (["null", "undefined"].indexOf(routes[routes.length - 1]) > -1) {
            appNotify({ message: "Incorrect web link, please contact Admin.", type: 'info' });
            return false;
        }
        $.ajax({
            url: addURLParams(url, { UITabId: code, Caption: caption, Data: data != undefined ? data : {} }),
            headers: { 'Content-Type': 'application/json' },
            type: 'GET'
        }).done(function (data) {
            try {
                addTab(code, caption, data);
            }
            catch (e) {
                appNotify({ message: e.message, type: 'error' });
            }
        }).fail(function (jqXHR, statusText, errorThrown) {
            if (jqXHR.status == 401) {
                //window.location = "/Login";
            }
            else if (jqXHR.status == 403) {
                //$.get("/AccessDenied")
                //    .done(function (result) {
                //        $("<div>").appendTo($("body")).dxPopup({
                //            title: "No permission to view...", width: "30%", height: "50%",
                //            contentTemplate: function () { return $("<div>").append(result); }
                //        }).dxPopup("instance").show();
                //    })
                //    .fail(function (jqXHR, textStatus, errorThrown) {
                //        appNotify({ message: `${errorThrown}. ${jqXHR.responseText}`, type: 'warning' });
                //    });
            }
            else {
                appNotify({ message: `${errorThrown}. ${jqXHR.responseText}`, type: 'warning' });
            }
        }).always(function () {
            //console.log("Go to " + url);
        });
    }
    catch (err) {
        appErrorHandling('Library error: call callElementView was failed.', err);
        return;
    }
}

var replaceElementView = function (url, params, container) {
    try {
        if (url.length === 0) {
            appNotify({ message: "Page request does not exist.", type: 'info' });
            return false;
        }
        var routes = url.split('/');
        if (["null", "undefined"].indexOf(routes[routes.length - 1]) > -1) {
            appNotify({ message: "Incorrect web link, please contact Admin.", type: 'info' });
            return false;
        }
        $.ajax({
            url: addURLParams(url, params),
            headers: { 'Content-Type': 'application/json' },
            type: 'GET'
        }).done(function (data) {
            try {
                container.html(data);
            }
            catch (e) {
                appNotify({ message: e.message, type: 'error' });
            }
        }).fail(function (jqXHR, statusText, errorThrown) {
            if (jqXHR.status == 401) {
                //window.location = "/Login";
            }
            else if (jqXHR.status == 403) {
                //$.get("/AccessDenied")
                //    .done(function (result) {
                //        $("<div>").appendTo($("body")).dxPopup({
                //            title: "No permission to view...", width: "30%", height: "50%",
                //            contentTemplate: function () { return $("<div>").append(result); }
                //        }).dxPopup("instance").show();
                //    })
                //    .fail(function (jqXHR, textStatus, errorThrown) {
                //        appNotify({ message: `${errorThrown}. ${jqXHR.responseText}`, type: 'warning' });
                //    });
            }
            else {
                appNotify({ message: `${errorThrown}. ${jqXHR.responseText}`, type: 'warning' });
            }
        }).always(function () {
            //console.log("Replace " + url);
        });
    }
    catch (err) {
        appErrorHandling('Library error: call callElementView was failed.', err);
        return;
    }
}

var appendChildGridViewInsideAsync = function (childItem, itemElement, className = "MGridOption") {
    return new Promise((resolve, reject) => { // Trả về Promise
        try {
            try {
                const GridClass = window[className]; // Lấy class từ global scope
                if (!GridClass) {
                    throw new Error(`Class ${className} không tìm thấy!`);
                }
                var gridOptionConfig = {
                    filterRefId: childItem.filterRefId,
                    filterRefField: childItem.filterRefField,
                    height: _defaultGridMinHeight
                };
                var mGridOption = new GridClass(childItem.modelName, "User", gridOptionConfig);
                mGridOption.filterRefId = childItem.filterRefId;
                mGridOption.filterRefField = childItem.filterRefField;
                mGridOption.gridEditorOptions = {};
                mGridOption.gridEditorOptions = {
                    editing: childItem.editing
                };
                $(`<div id="dataGrid_${childItem.modelName}_${childItem.filterRefId}" style="min-height: ${_defaultGridMinHeight}px;">`).dxDataGrid(mGridOption.getGridOptions(mGridOption)).appendTo(itemElement);
                const dataGrid = $(`<div id="dataGrid_${childItem.modelName}_${childItem.filterRefId}" style="min-height: ${_defaultGridMinHeight}px;">`).dxDataGrid().dxDataGrid("instance");

                if (dataGrid) {
                    resolve(dataGrid); // Trả về instance
                } else {
                    reject("dxDataGrid instance không tìm thấy!");
                }
            }
            catch (e) {
                appNotify({ message: e.message, type: 'error' });
                reject(e.message); // Trả lỗi khi xử lý trong switch
            }
        } catch (err) {
            appErrorHandling('Library error: call appendChildGridViewInsideAsync was failed.', err);
            reject(err.message);
        }
    });
}

var appendElementViewInside = function (url, params, container, code, typeChild) {
    try {
        if (url.length === 0) {
            appNotify({ message: "Page request does not exist.", type: 'info' });
            return false;
        }
        var routes = url.split('/');
        if (["null", "undefined"].indexOf(routes[routes.length - 1]) > -1) {
            appNotify({ message: "Incorrect web link, please contact Admin.", type: 'info' });
            return false;
        }
        $.ajax({
            url: addURLParams(url, params),
            headers: { 'Content-Type': 'application/json' },
            type: 'GET'
        }).done(function (data) {
            try {
                switch (typeChild) {
                    case "appendTo":
                        var containerDiv = $(`<div id="${code}" style="height: 100%; width: 100%">`); // hardcode -> chỉnh lại
                        containerDiv.html(data);
                        containerDiv.appendTo(container);
                        break;
                    case "append":
                        var containerDiv = $(`<div id="${code}" style="height: 100%; width: 100%">`); // hardcode -> chỉnh lại
                        containerDiv.html(data);
                        container.append(containerDiv);
                        break;
                    default:
                        break;
                }
                return data;
            }
            catch (e) {
                appNotify({ message: e.message, type: 'error' });
            }
        }).fail(function (jqXHR, statusText, errorThrown) {
            if (jqXHR.status == 401) {
                //window.location = "/Login";
            }
            else if (jqXHR.status == 403) {
                //$.get("/AccessDenied")
                //    .done(function (result) {
                //        $("<div>").appendTo($("body")).dxPopup({
                //            title: "No permission to view...", width: "30%", height: "50%",
                //            contentTemplate: function () { return $("<div>").append(result); }
                //        }).dxPopup("instance").show();
                //    })
                //    .fail(function (jqXHR, textStatus, errorThrown) {
                //        appNotify({ message: `${errorThrown}. ${jqXHR.responseText}`, type: 'warning' });
                //    });
            }
            else {
                appNotify({ message: `${errorThrown}. ${jqXHR.responseText}`, type: 'warning' });
            }
        }).always(function () {
            //console.log("Append " + url);
        });
    }
    catch (err) {
        appErrorHandling('Library error: call callElementView was failed.', err);
        return;
    }
}

var appendElementViewInsideAsync = function (url, params, container, code, typeChild) {
    return new Promise((resolve, reject) => { // Trả về Promise
        try {
            if (url.length === 0) {
                appNotify({ message: "Page request does not exist.", type: 'info' });
                reject("Page request does not exist.");
                return;
            }
            var routes = url.split('/');
            if (["null", "undefined"].indexOf(routes[routes.length - 1]) > -1) {
                appNotify({ message: "Incorrect web link, please contact Admin.", type: 'info' });
                reject("Incorrect web link.");
                return;
            }
            $.ajax({
                url: addURLParams(url, params),
                headers: { 'Content-Type': 'application/json' },
                type: 'GET'
            }).done(function (data) {
                try {
                    var containerDiv = $(`<div id="${code}" class="container" style="height: 100%; width: 100%">`);
                    switch (typeChild) {
                        case "appendTo":
                            containerDiv.html(data);
                            containerDiv.appendTo(container);
                            break;
                        case "append":
                            containerDiv.html(data);
                            container.append(containerDiv);
                            break;
                        default:
                            break;
                    }

                    // Tìm và tạo dxForm instance sau khi script thực thi
                    const formInstance = $(`#form_${code}`).dxForm().dxForm("instance");
                    formInstance.option("container", containerDiv);
                    if (formInstance) {
                        resolve(formInstance); // Trả về instance
                    } else {
                        const customError = {
                            status: 500,
                            statusText: "Form Not Found",
                            responseText: `dxForm instance với id "form_${code}" không tìm thấy.`,
                            readyState: 4,
                            responseJSON: {
                                typeMsg: ["popup"],
                                message: [`Không tìm thấy form: form_${code}`]
                            }
                        };
                        reject(customError);
                        //throw new Error("dxForm instance không tìm thấy!");
                    }
                    //resolve(data); // Trả về dữ liệu từ AJAX
                }
                catch (e) {
                    appNotify({ message: e.message, type: 'error' });
                    reject(e.message); // Trả lỗi khi xử lý trong switch
                }
            }).fail(function (jqXHR, statusText, errorThrown) {
                if (jqXHR.status == 401) {
                    //window.location = "/Login";
                } else if (jqXHR.status == 403) {
                    //$.get("/AccessDenied")
                    //    .done(function (result) {
                    //        $("<div>").appendTo($("body")).dxPopup({
                    //            title: "No permission to view...", width: "30%", height: "50%",
                    //            contentTemplate: function () { return $("<div>").append(result); }
                    //        }).dxPopup("instance").show();
                    //    })
                    //    .fail(function (jqXHR, textStatus, errorThrown) {
                    //        appNotify({ message: `${errorThrown}. ${jqXHR.responseText}`, type: 'warning' });
                    //    });
                } else {
                    appNotify({ message: `${errorThrown}. ${jqXHR.responseText}`, type: 'warning' });
                }
                reject(`${errorThrown}. ${jqXHR.responseText}`); // Trả lỗi từ AJAX
            }).always(function () {
                //console.log("Append " + url);
            });
        } catch (err) {
            appErrorHandling('Library error: call callElementView was failed.', err);
            reject(err.message);
        }
    });
};

//var appendElementViewInsideAsync = function (url, params, container, code, typeChild, opt) {
//    opt = opt || {};
//    const useScroll = opt.useScroll !== false; // default true
//    const scrollOptions = opt.scrollOptions || {};

//    return new Promise((resolve, reject) => {
//        try {
//            if (!url || url.length === 0) {
//                appNotify({ message: "Page request does not exist.", type: 'info' });
//                reject("Page request does not exist.");
//                return;
//            }

//            var routes = url.split('/');
//            if (["null", "undefined"].indexOf(routes[routes.length - 1]) > -1) {
//                appNotify({ message: "Incorrect web link, please contact Admin.", type: 'info' });
//                reject("Incorrect web link.");
//                return;
//            }

//            $.ajax({
//                url: addURLParams(url, params),
//                headers: { 'Content-Type': 'application/json' },
//                type: 'GET'
//            })
//                .done(function (data) {
//                    try {
//                        // 1) Root wrapper nằm TRONG popup container (KHÔNG move popup container)
//                        const $root = $(`<div id="${code}_root" style="height:100%;width:100%"></div>`);

//                        // 2) Inner host để chứa html form (để có thể bọc scroll)
//                        let $host = $root;

//                        // 3) Optional: wrap scroll view
//                        let scrollInstance = null;
//                        if (useScroll) {
//                            const $scrollHost = $(`<div id="${code}_scroll" style="height:100%;width:100%"></div>`);
//                            $scrollHost.appendTo($root);

//                            $scrollHost.dxScrollView(Object.assign({
//                                width: "100%",
//                                height: "100%",
//                                useNative: false
//                            }, scrollOptions));

//                            scrollInstance = $scrollHost.dxScrollView("instance");

//                            // content() là nơi nhét html vào
//                            $host = $(scrollInstance.content());
//                        }

//                        // 4) Create view containerDiv và nhét HTML
//                        const $containerDiv = $(`<div id="${code}" class="container" style="height:100%;width:100%"></div>`);
//                        $containerDiv.html(data);
//                        $host.append($containerDiv);

//                        // 5) Append root vào container theo typeChild
//                        // NOTE: typeChild "appendTo" của bạn nghĩa là containerDiv.appendTo(container)
//                        // Nhưng giờ mình append $root vào container để không bị detach/move sai
//                        switch (typeChild) {
//                            case "appendTo":
//                            case "append":
//                            default:
//                                container.append($root);
//                                break;
//                        }

//                        // 6) Init dxForm scoped trong containerDiv (đừng query global)
//                        const $form = $containerDiv.find(`#form_${code}`);
//                        if ($form.length === 0) {
//                            const customError = {
//                                status: 500,
//                                statusText: "Form Not Found",
//                                responseText: `dxForm instance với id "form_${code}" không tìm thấy.`,
//                                readyState: 4,
//                                responseJSON: {
//                                    typeMsg: ["popup"],
//                                    message: [`Không tìm thấy form: form_${code}`]
//                                }
//                            };
//                            reject(customError);
//                            return;
//                        }

//                        // Nếu HTML đã init dxForm sẵn thì instance có thể đã tồn tại:
//                        let formInstance = $form.dxForm("instance");
//                        if (!formInstance) {
//                            $form.dxForm();                 // init nếu chưa có
//                            formInstance = $form.dxForm("instance");
//                        }

//                        // gắn containerDiv cho logic cũ của bạn
//                        formInstance.option("container", $containerDiv);

//                        // update scroll layout nếu có
//                        if (scrollInstance) scrollInstance.update();

//                        resolve({
//                            root: $root,                 // cái bạn return ra popup
//                            containerDiv: $containerDiv, // nơi chứa html
//                            formInstance: formInstance,
//                            scrollInstance: scrollInstance
//                        });

//                    } catch (e) {
//                        appNotify({ message: e.message, type: 'error' });
//                        reject(e);
//                    }
//                })
//                .fail(function (jqXHR, statusText, errorThrown) {
//                    if (jqXHR.status == 401) {
//                        // window.location = "/Login";
//                    } else if (jqXHR.status == 403) {
//                        // ...
//                    } else {
//                        appNotify({ message: `${errorThrown}. ${jqXHR.responseText}`, type: 'warning' });
//                    }
//                    reject(`${errorThrown}. ${jqXHR.responseText}`);
//                });

//        } catch (err) {
//            appErrorHandling('Library error: call callElementView was failed.', err);
//            reject(err);
//        }
//    });
//};




var apiInvokeRequest = function (url, method, dataTypeOptions, options, functionCall, values, asyncStatus) {
    $.ajax({
        url: url,
        method: method,
        dataType: dataTypeOptions,
        ...options,
        data: values,
        async: asyncStatus ? true : false,
        success: function (data) {
            if (functionCall !== null || functionCall !== undefined) {
                functionCall(data);
            }
        },
        error: function (xhr, status, error) {
            console.log(error);
        }
    });
}


//function closeTab() {
//    var li = $("#tablist > ul").find("[tabindex = '0']");
//    var panelId = li.remove().attr("aria-controls");
//    $("#" + panelId).remove();
//    $("#tablist").tabs("refresh");
//}



function initTabs() {
    $("#tablist").tabs({
        activate: function (event, ui) {
            try {
                var $tabContent = ui.newPanel;
                var dataGrid = $try(function () {
                    return $tabContent.find("[id^='dataGrid_']").dxDataGrid("instance");
                });

                if (dataGrid != null) {
                    //dataGrid.option("height", "100%");
                    //dataGrid.refresh();
                }
            } catch (err) {
                appErrorHandling('Library error: call onTabActivate was failed.', err);
                return;
            }
        }
    });
}

var tabFormatButtonClass = 'fa fa-times close-tab-btn';
var addTab = function (code, tabTitle = '...', tabContent) {
    try {
        var $tabs = $("#tablist");
        const tabExisted = $tabs.find(`#${code}_content_wrapper`).length;
        if (!tabExisted) {
            createNewTabElement(code, tabTitle, $tabs, tabContent);
        }
        else {
        }
        var tabIndex = $tabs.find(`#${code}_content_wrapper`).index() - 1;
        $tabs.tabs("option", "active", tabIndex);
        $tabs.find(`#${code}`).html(tabContent);
    } catch (err) {
        appErrorHandling('Library error: call addTab was failed.', err);
    }
};

var createNewTabElement = function (code, tabTitle = '...', $tabs, tabContent) {
    const li = $(`
                <li id="${code}_li_tab" class="expand-ltr">
                    <div id="${code}_tab" style="display: flex;float: left;"><a href="#${code}" style="padding: 7px;">${tabTitle}</a> 
                    <div id="${code}_progressBar" style="position: relative; display: inline-block;padding: 5px;">
                    </div>
                    <div id="${code}_progressSuccessIcon" style="display: none;margin-left: -22px;margin-top: 6px;padding-right: 10px;">
                         <i class="fa fa-check-circle" aria-hidden="true"></i>
                    </div>
                    <div id="${code}_progressErrorIcon" style="display: none;margin-left: -22px;margin-top: 6px;padding-right: 10px;">
                         <i class="fa fa-times-circle" aria-hidden="true"></i>
                    </div>
                    <span id="${code}_closeTab" class='${tabFormatButtonClass}' data-code="${code}_closeTab"></span><div>
                </li>
            `);//.attr("aria-controls", code);
    //<span id="${code}_progressBar" style="padding: 5px;"></span>
    var $divContentWrapper = $(`<div id="${code}_content_wrapper" class="content-wrapper">`);
    var $tabContainer = $(`<div id="${code}">`);
    $tabContainer.appendTo($divContentWrapper);
    $tabs.find(".ui-tabs-nav").append(li);
    //var $contentDiv = $(`<div></div>`).html(tabContent);
    //$contentDiv.appendTo($tabContainer);
    $tabs.append($divContentWrapper);
    $tabs.tabs("refresh");
}

var removeTab = function (activeId) {
    try {
        var li = $("#tablist > ul").find("[tabindex = '0']");
        var panelId = li.remove().attr("aria-controls");
        $("#" + panelId).remove();



        var tabIndex = ($("#" + activeId).index()) - 1;
        if (tabIndex >= 0) {
            $("#tablist").tabs("option", "active", tabIndex);
        }
            $("#tablist").tabs("refresh");
    } catch (err) {
        appErrorHandling('Library error: call removeTab was failed.', err);
        return;
    }
};

var nativeRemoveTab = function($tabDivId){
    $tabDivId.animate({
        width: '0px',
        opacity: '0'
    }, 220);
    setTimeout(function () {
        var $li = $tabDivId.closest("li");
        var panelId = $li.attr("aria-controls");
        $li.remove();

        if (panelId) {
            $("#" + panelId).remove();
            $(`#${panelId}_content_wrapper`).remove();
            document.body.classList.remove("hasRightPanel");
            $("#rightCommentDock").hide();
            document.documentElement.style.setProperty("--collapsed-form-mr", "-26%");
        }
        $("#tablist").tabs("refresh");
    }, 150); // === duration animate
}

var setTabName = function (name, code) {
    try {
        var li = $("#tablist > ul").find("[tabindex = '0']");
        if (li.length > 0) {
            var a = li.find("a");
            //set tab name
            if (name == null)
                a.text("undefine");
            else
                a.text(name);

            //set href
            a[0].setAttribute("href", `#${code}`);
            //set aria-controls
            li[0].setAttribute("aria-controls", code);
            //set div id
            var div = $("#tablist").find(`[aria-hidden = 'false']`);
            div[0].setAttribute("id", code);
        }
    } catch (err) {
        appErrorHandling('Library error: call setTabName was failed.', err);
        return;
    }
};

