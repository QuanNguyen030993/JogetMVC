
var ListFormat = Quill.import('formats/list');

class CustomList extends ListFormat {
    static formats(domNode) {
        let format = super.formats(domNode);
        //format.class = domNode.getAttribute('class') || '';
        return format;
    }

    format(name, value) {
        super.format(name, value);
        if (name === 'class' && value) {
            this.domNode.setAttribute('class', value);
        }
    }
}

Quill.register(CustomList, true);

var _db;
var _cacheCompanyData = null;
const _dbName = "CompanyDataDB";
const _storeName = "CompanyData";
var _cacheOutlines = [];
var _cacheDataGridConfigs = [];
var _allScheme = [];
var fetchTables = ["Client", "Outline", "DataGridConfig"];
$.ajax({
    url: `api/DataGridConfig/GetAllScheme`,
    method: "GET",
    async: false,
    success: function (dataIn) {
        _cacheDataGridConfigs = dataIn;
    },
    error: function (error) {
        console.error(`Error fetching data from API for table :`, error);
    }
});
function initIndexedDB() {
    const request = indexedDB.open(_dbName, 1);
    request.onupgradeneeded = function (event) {
        _db = event.target.result;
        if (!_db.objectStoreNames.contains(_storeName)) {
            const companiesStore = _db.createObjectStore(_storeName, { keyPath: "id", autoIncrement: true });
            companiesStore.createIndex("table", "table", { unique: true });
            console.log(`Created store: ${_storeName}`);
        }
    };
    var isForceUpdateCacheObject = null;
    request.onsuccess = function (event) {
        _db = event.target.result;
        const transaction = _db.transaction([_storeName], "readonly");
        const store = transaction.objectStore(_storeName);
        const requestStore = store.getAll();
        requestStore.onsuccess = function (eventStore) {
            try {

                _cacheCompanyData = eventStore.target.result;
                var trackingUserCache = new Object();
                trackingUserCache.CacheData = new Object();
                trackingUserCache.CacheData = _cacheCompanyData;
                $.ajax({
                    url: `/api/UsersCache/TrackUserCache`,
                    type: 'POST',
                    contentType: 'application/json',
                    async: false,
                    data: JSON.stringify(JSON.stringify(trackingUserCache)),
                    success: function (response) {
                        isForceUpdateCacheObject = response;
                    },
                    error: function (xhr, status, error) {
                        console.error('Error:', error);
                    }
                });
                if (isForceUpdateCacheObject.forceReloadPage) {
                    $.ajax({
                        url: `/api/UsersCache/ForcePageUpdateFinish`,
                        type: 'POST',
                        contentType: 'application/json',
                        data: JSON.stringify(isForceUpdateCacheObject),
                        success: function (response) {
                            window.location.href = window.location.href
                            console.log("Reloaded page");
                        },
                        error: function (xhr, status, error) {
                            console.error('Error:', error);
                        }
                    });

                }
                if ((_cacheCompanyData.length == 0) || isForceUpdateCacheObject?.forceReloadCache) {
                    if (isForceUpdateCacheObject?.forceReloadCache) _cacheCompanyData = [];
                    const transaction = _db.transaction([_storeName], "readwrite");
                    const store = transaction.objectStore(_storeName);
                    if (isForceUpdateCacheObject?.forceReloadCache) store.clear();
                    $.each(fetchTables, function (tableIndex, table) {
                        $.ajax({
                            url: table === "DataGridConfig" ? `api/${table}/GetAllScheme` : `api/${table}/GetAll`,
                            method: "GET",
                            async: false,
                            success: function (data) {

                                var getObject = { rows: data, table: table };
                                const addRequest = store.add({ rows: data, table: table });
                                addRequest.onsuccess = function (eventAddRequest) {
                                    _cacheCompanyData.push(getObject);
                                    if (table == "DataGridConfig") {
                                        //_cacheDataGridConfigs = getObject.rows;
                                        $.ajax({
                                            url: table === "DataGridConfig" ? `api/${table}/GetAllScheme` : `api/${table}/GetAll`,
                                            method: "GET",
                                            async: false,
                                            success: function (dataIn) {
                                                _cacheDataGridConfigs = dataIn;
                                            },
                                            error: function (error) {
                                                console.error(`Error fetching data from API for table '${table}':`, error);
                                            }
                                        });
                                    }
                                    console.log(`Data for table '${table}' added to IndexedDB.`);
                                    var trackingUserCacheLocal = new Object();
                                    trackingUserCacheLocal.CacheData = new Object();
                                    trackingUserCacheLocal.CacheData = _cacheCompanyData;
                                    $.ajax({
                                        url: `/api/UsersCache/TrackUserCache`,
                                        type: 'POST',
                                        contentType: 'application/json',
                                        async: false,
                                        data: JSON.stringify(JSON.stringify(trackingUserCacheLocal)),
                                        success: function (response) {
                                        },
                                        error: function (xhr, status, error) {
                                            console.error('Error:', error);
                                        }
                                    });
                                };
                                addRequest.onerror = function (event) {
                                    console.error(`Error adding data for table '${table}':`, event.target.errorCode);
                                };


                            },
                            error: function (error) {
                                console.error(`Error fetching data from API for table '${table}':`, error);
                            }
                        });

                    });



                    if (isForceUpdateCacheObject)
                        $.ajax({
                            url: `/api/UsersCache/ForceCacheUpdateFinish`,
                            type: 'POST',
                            contentType: 'application/json',
                            async: false,
                            data: JSON.stringify(isForceUpdateCacheObject),
                            success: function (response) {
                            },
                            error: function (xhr, status, error) {
                                console.error('Error:', error);
                            }
                        });

                }
                if (_cacheCompanyData.length > 0) {
                    $.ajax({
                        url: table === "DataGridConfig" ? `api/${table}/GetAllScheme` : `api/${table}/GetAll`,
                        method: "GET",
                        async: false,
                        success: function (dataIn) {
                            _cacheDataGridConfigs = dataIn;
                        },
                        error: function (error) {
                            console.error(`Error fetching data from API for table '${table}':`, error);
                        }
                    });
                    //_cacheDataGridConfigs = _cacheCompanyData.find(f => f.table == "DataGridConfig").rows;
                }
            }
            catch {

            }
        };

        requestStore.onerror = function (event) {
            console.error("Error fetching data:", event.target.errorCode);
        };
        console.log("IndexedDB initialized.");
    };

    request.onerror = function (event) {
        console.error("Error initializing IndexedDB:", event.target.errorCode);
    };
}
initIndexedDB();

function isValidBase64(input) {
    const base64Regex = /^(?:[A-Za-z0-9+/]{4})*?(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
    return base64Regex.test(input);
}
var appNotify = function (notifyOption, isConfirm) {
    // default options
    switch (notifyOption["type"]) {
        case "info":
            appNotifyInfo(notifyOption["message"], isConfirm);
            break;
        case "success":
            appNotifySuccess(notifyOption["message"], isConfirm);
            break;
        case "warning":
            appNotifyWarning(notifyOption["message"], isConfirm);
            break;
        case "error":
            appNotifyError(notifyOption["message"], isConfirm);
            break;
        default:
    }
}

var appNotifySuccess = function (message, isConfirm) {
    return Swal.fire({
        position: 'top',
        icon: 'success',
        title: message,
        showConfirmButton: isConfirm ?? false,
        timer: _swalPopupDelayTime
    });
}

var appNotifyWarning = function (message, isConfirm, confirmText, cancelText, delayTime) {
    return Swal.fire({
        position: 'top',
        icon: 'warning',
        title: message,
        showCancelButton: isConfirm ?? false,
        showConfirmButton: isConfirm ?? false,
        confirmButtonText: confirmText ?? "OK",
        cancelButtonText: cancelText ?? "Cancel",
        timer: delayTime ?? _swalPopupDelayTime
    });

}

var appNotifyError = function (message, isConfirm, confirmText, cancelText, delayTime) {
    return Swal.fire({
        position: 'top',
        icon: 'error',
        title: 'UI exception ' + message,
        showCancelButton: isConfirm ?? false,
        showConfirmButton: isConfirm ?? false,
        confirmButtonText: confirmText ?? "OK",
        cancelButtonText: cancelText ?? "Cancel",
        timer: delayTime ?? _swalPopupDelayTime
    });
}

var appErrorHandling = function (message, err) {
    if (err != null) {
        if (err == "Unauthorized") {
            window.location = "/Account/Login";
        } else {
            switch (err.status) {
                case 401:
                    window.location = "/Account/Login";
                    break;
                case 400: case 404: case 500:
                    //Nhat bat custom exception
                    if (message != err.responseText) {
                        message = message == null ? err.responseText : message + err.responseText;
                    } else {
                        message = err.responseText;
                    }

                    break;
                default:
                    message = `${err.responseText}. ${err.stack}`;
                    break;
            }
        }
        console.log(err);
        try {
            sendClientErrorLog(message, err);
        }
        catch {

        }
        console.trace();
    }

    try {
        let parsedObject = JSON.parse(message);
        if (parsedObject.typeMsg != undefined) {
            if (parsedObject.typeMsg[0] == "popup") {
                appNotifyWarning(parsedObject.message[0]);
            }
        }
        else
            appNotifyError(message);

    }
    catch { appNotifyError(message); }
}

var appNotifyInfo = function (message, isConfirm) {
    return Swal.fire({
        position: 'top',
        icon: 'info',
        title: message,
        showConfirmButton: isConfirm ?? false,
        timer: 5000
    });
    //DevExpress.ui.notify({
    //    type: "info",
    //    position: {
    //        at: "top",
    //        offset: { x: 100, y: 100 }
    //    },
    //    width: "60%",
    //    closeOnSwipe: false,
    //    closeOnClick: false,
    //    closeOnOutsideClick: true
    //});
}





////Proccess view image end



var $try = function (func) {
    try {
        return func();
    } catch (e) {
        return null;
    }
};



var addURLParams = function (url, data) {
    if (!$.isEmptyObject(data)) {
        url += (url.indexOf('?') >= 0 ? '&' : '?') + $.param(data);
    }
    return url;
}



var tryExecute = function (func, msg) {
    return function (e) {
        try {
            return func(e);
        } catch (e) {
            msg = msg || e.message;
            appErrorHandling(` tryExecute: Exception,  
                              Message: ${msg},
                              Detail: ${e.stack}`);
            console.trace();
        }
    };
}



//var appConvertJsonMsg = function (object) {
//    let str = "";
//    Object.keys(object).forEach(k => {
//        str += k + " " + object[k] + "\r\n";
//    });
//    return str;
//}


function cloneAndCleanObject(obj) {
    // Tạo bản sao sâu (deep copy) của object
    const clonedObject = JSON.parse(JSON.stringify(obj));

    // Hàm đệ quy để tẩy các thuộc tính kết thúc bằng 'FK' và 'Enum'
    function cleanObjectProperties(target) {
        for (const key in target) {
            if (target.hasOwnProperty(key)) {
                if (key.endsWith('FK') || key.endsWith('Enum')) {
                    // Xóa các thuộc tính kết thúc bằng 'FK' hoặc 'Enum'
                    delete target[key];
                } else if (typeof target[key] === 'object' && target[key] !== null) {
                    // Nếu thuộc tính là một object, đệ quy xử lý tiếp
                    cleanObjectProperties(target[key]);
                }
            }
        }
    }

    // Gọi hàm để tẩy các thuộc tính
    cleanObjectProperties(clonedObject);

    return clonedObject;
}

var appReplaceDoubleQuote = function (obj) {
    Object.keys(obj).forEach(function (key) {
        if (typeof obj[key] == "string") {
            var text = obj[key];
            obj[key] = text.replace('"', '\"');
        }
    })
    return obj;
}

var buildApiUrl = function (apiMethod, instanceObject) {
    try {

        var url = null;
        switch (instanceObject.ModelName) {

            default:

                if (apiMethod === "POST") {
                    url = `/api/${instanceObject.ModelName}/InsertData`;
                }
                else if (apiMethod === "GetSingle") {
                    url = `/api/${instanceObject.ModelName}/GetSingle/${instanceObject.id}`;
                }
                else if (apiMethod === "GetFKMany") {
                    url = `/api/${instanceObject.ReferenceModel}/GetFKMany?fkId=${instanceObject.refFieldId}&fkField=${instanceObject.refFieldName}`;
                }
                else if (apiMethod === "CustomQuery") {
                    url = `/api/${instanceObject.ModelName}/ExecuteCustomQuery`;
                }
                else if (apiMethod === "PUT") {
                    url = `/api/${instanceObject.ModelName}/UpdateData`;
                }
                else
                    url = ``;
                break;

        }
        return url;
    } catch (err) {
        appErrorHandling('Library error: call buildApiUrl() was failed.', err);
        return;
    }
}

var buildHttpMethod = function (apiMethod) {
    var httpMethod = apiMethod;
    if (apiMethod === 'CLONE' || apiMethod === 'GETBYID') {
        httpMethod = 'GET';
    }

    return httpMethod;
}

//function hexToBase64(str) {
//    return btoa(String.fromCharCode.apply(null, str.replace(/\r|\n/g, "").replace(/([\da-fA-F]{2}) ?/g, "0x$1 ").replace(/ +$/, "").split(" ")));
//}





function parseHexToIntArray(hexString) {
    // Loại bỏ tiền tố "0x" nếu có
    const cleanHex = hexString.startsWith("0x") ? hexString.slice(2) : hexString;

    // Chia chuỗi hex thành từng cặp byte (2 ký tự) và chuyển thành số nguyên
    const intArray = [];
    for (let i = 0; i < cleanHex.length; i += 2) {
        const byte = cleanHex.slice(i, i + 2); // Lấy từng cặp hex
        intArray.push(parseInt(byte, 16));    // Chuyển từ hex sang số nguyên
    }

    return intArray;
}


//function appRemoveAllChildNodes(parent) {
//    while (parent.firstChild) {
//        parent.removeChild(parent.firstChild);
//    }
//}





function convertArrayParentToChild(array) {
    var map = {};
    for (var i = 0; i < array.length; i++) {
        var obj = array[i];
        obj.children = [];

        map[obj.id] = obj;

        var parent = obj.parentId || '-';
        if (!map[parent]) {
            map[parent] = {
                children: []
            };
        }
        map[parent].children.push(obj);
    }

    const result = [];

    array.forEach(obj => {
        map[obj.id] = obj;
        obj.children = [];
    });

    array.forEach(obj => {
        if (obj.parentId !== null && map[obj.parentId]) {
            map[obj.parentId].children.push(obj);
        } else {
            result.push(obj);
        }
    });
    return result;
}



var initFormSubTab = function (entityName, container, tabTitle, instance) {
    new MGrid(null, $(`<div id ='dataGrid_${entityName}'>`).appendTo(container), new MGridOption(entityName, null, instance), null);
}

function isNullOrEmpty(str) {
    return !str || str.trim().length === 0;
}

//function isNullOrEmpty(str) {
//    return str === null || str === undefined || (typeof str === 'string' && str.trim().length === 0);
//}

function RenderGridElement(_gridConfig, gridInstance) {
    $.each(_gridConfig, function (i, item) {
        item.lookup = null;
        item.mLookup = null;
        if (item.gridVisibleIndex != null || item.gridVisibleIndex != undefined) {
            item.visibleIndex = item.gridVisibleIndex;
            if (item.gridVisibleIndex < 0) {
                item.visible = false;
            }
        }
        else
            item.visibleIndex = item.order;

        if (item.ValidationRules != null) {
            item.validationRules = JSON.parse(item.validationRules);
        }

        if (isNullOrEmpty(item.width)) {
            item.width = _defaultGridFieldWidth;
        }
        if (isNullOrEmpty(item.height)) {
            item.height = _defaultGridFieldHeight;
        }
        if (item.dataType == "enum") {
            byteObjectConvert(item, gridInstance);
            item = selectBoxRemakeOption(item, gridInstance);
        }
        else if (item.dataType == "table") {
            var gridConfig = makeFieldFeatures(item, gridInstance, "grid");
            if (gridConfig.config.displayExp) {
                item.lookup = {
                    dataSource: {
                        key: 'id',
                        store: DevExpress.data.AspNet.createStore({
                            key: "id",
                            loadUrl: `/api/${gridConfig.model}/GetAll`
                        }),
                        paginate: true,
                    },
                    displayExpr: gridConfig.config.displayExp,
                    valueExpr: 'id'
                };

                item.editorType = "dxDropDownBox";
                item.editorOptions = {
                    editorType: "dxDropDownBox",
                    width: "100%",
                    dropDownOptions: {
                        width: _defaultDropDownWidth,
                        height: _defaultDropDownHeight,
                    },
                    showClearButton: true,
                    dataSource: DevExpress.data.AspNet.createStore({
                        key: 'id',
                        loadUrl: `api/${gridConfig.model}/GetAll`,
                        paginate: true
                    }),
                    columns: gridConfig.config.getScheme,
                    contentTemplate: function (e) {
                        const $dataGrid = $("<div>").dxDataGrid({
                            selectionMode: 'all',
                            // remoteOperations: { paging: true, filtering: true, sorting: true, grouping: true, summary: true, groupPaging: true },
                            filterRow: { visible: true },
                            dataSource: e.component.option("dataSource"),
                            columns: e.component.option("columns"),
                            selection: { mode: "single" },
                            scrolling: {
                                mode: 'virtual',
                                preloadEnabled: false,
                                showScrollbar: 'always'
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
                                    e.component.option("displayValue", selectedItems.selectedRowsData[0][gridConfig.config.displayExp]);
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
            else {
                appErrorHandling(" RenderGridElement Exception: No display Expr defined!");
            }
        }
    });

}

function getModelConfig(model, isFilter = true) {
    var modelConfig = [];
    if (_sysTables.length == 0)
        $.ajax({
            url: `/api/SysTable/GetAll`,
            type: 'GET',
            async: false,
            success: function (response) {
                modelConfig = response;
                if (_sysTables.length == 0) {
                    _sysTables = response;
                }
            },
            error: function () {
                appErrorHandling(" Table is not defined!");
            }
        });
    else
        modelConfig = _sysTables;
    if (isFilter)
        return modelConfig.find(f => f.name == model);
    else
        return modelConfig;
}

//function getSchemeConfig() {
//    if (_allScheme.length == 0)
//        $.ajax({
//            url: `/api/DataGridConfig/GetAllScheme`,
//            type: 'GET',
//            async: false,
//            success: function (response) {
//                modelConfig = response;
//                if (_allScheme.length == 0) {
//                    _allScheme = response;
//                }
//            },
//            error: function () {
//                appErrorHandling(" Table is not defined!");
//            }
//        });
//}
//getSchemeConfig();

function addImageToPreview(imagePath, item) {
    var controllerName = item.ModelName ? item.ModelName : "SitePictures";
    //const $imageContainer = $("<div>").css({ position: 'relative', width: '120px', height: '120px', margin: '5px' });
    const $imageContainer = $("<div>").addClass("imagePreviewContainer");
    var url = `https://${window.location.host}/api/Attachment/Browse/${item.attachmentGuid}`;
    // Wrap image in a link element
    const $imageLink = $("<a>")
        .attr("href", url) // Set href to the image path
        .attr("target", "_blank") // Open link in a new tab
        .appendTo($imageContainer);

    // Create img element inside the link
    $("<img>")
        .attr("src", imagePath)
        .css({ width: '100%', height: 'auto', objectFit: 'cover', borderRadius: '5px' })
        .appendTo($imageLink);
    if (item.fileDate) {
        $("<div>")
            .text(`Last updated: ${item.fileDate}`)
            .css({
                fontSize: '11px',
                color: '#666',
                marginTop: '3px',
                textAlign: 'center'
            })
            .appendTo($imageContainer);
    }

    $("<button>")
        .html("&times;") // HTML entity for "x"
        .css({
            position: "absolute",
            top: "5px",
            right: "-25px",
            width: "20px",
            height: "20px",
            borderRadius: "50%",
            backgroundColor: "red",
            color: "white",
            border: "none",
            cursor: "pointer",
            fontSize: "14px",
            lineHeight: "18px",
            textAlign: "center",
            padding: "0"
        })
        .on("click", async function () { // Sử dụng async để xử lý
            try {
                await deleteImageData(item);
                $(this).parent().remove();
            } catch (error) {
            }
        }).appendTo($imageContainer);

    // Add the container to imagePreview
    $(`#imagePreview_${item.surveyId}_${item.outlineId}`).append($imageContainer);


    var descriptionId = `description_${item.surveyId}_${item.outlineId}_${item.attachmentId}`;
    var descriptionWrapper = $(`<div id='${descriptionId}'>`).css({
        width: '100%',
        marginTop: '5px',
        boxSizing: 'border-box',
        fontSize: '12px',
        borderRadius: '4px',
        border: '1px solid #ccc'
    });
    const $descriptionInput = $(`<input>`)
        .attr("type", "text")
        .attr("placeholder", "Enter description...") // Placeholder text
        .css({
            width: '100%',
            boxSizing: 'border-box',
            padding: '5px',
            fontSize: '12px',
            borderRadius: '4px',
            border: '1px solid #ccc'
        })
        .val(item.sitePictureDescription || "")
        .on("change", function () {
            item.sitePictureDescription = $(this).val();
            $.ajax({
                url: `api/Attachment/UpdateNote`,
                type: 'PUT',
                data: {
                    values: JSON.stringify({
                        attachmentNote: item.sitePictureDescription
                    }),
                    key: item.attachmentId
                },
                processData: true,
                success: function (response) {
                    markAccordionAsSaved(descriptionId);
                    //console.log("Description updated successfully!");
                },
                error: function (error) {
                    console.error("Error updating description:", error);
                }
            });
        })
        .on("keydown", function () { clearAccordionHighlight(descriptionId) })
        .appendTo(descriptionWrapper);
    descriptionWrapper.appendTo($imageContainer);
}

function addImagePreviewElement(imagePath, item, $imageContainer) {
    var url = `https://${window.location.host}/api/Attachment/Browse/${item.attachmentGuid}`;
    const $imageLink = $("<a>")
        .attr("href", url) // Set href to the image path
        .attr("target", "_blank") // Open link in a new tab
        .appendTo($imageContainer);
    $("<img>")
        .attr("src", imagePath)
        .css({ width: '100%', height: 'auto', objectFit: 'cover', borderRadius: '5px' })
        .appendTo($imageLink);

    $(`#imagePreview_${item.surveyId}_${item.outline.id}`).append($imageContainer);
}


// Hàm asynchronous để xóa dữ liệu qua AJAX
//async function deleteImageData(attachmentId) {
async function deleteImageData(item) {
    var controllerName = item.ModelName ? item.ModelName : "SitePictures";
    return new Promise((resolve, reject) => {
        $.ajax({
            url: `/api/${controllerName}/DeleteAttachmentData`,
            method: 'DELETE',
            data: { key: item.attachmentId },
            success: function (response) {
                resolve(response);
            },
            error: function (error) {
                reject(error);
            }
        });
    });
}
function uint8ArrayToBase64(byteArray) {
    let binary = '';
    const len = byteArray.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(byteArray[i]);
    }
    return window.btoa(binary); // Chuyển đổi thành chuỗi Base64
}

function base64ToUint8Array(base64) {
    // Kiểm tra và loại bỏ phần "data:image/png;base64," nếu tồn tại
    if (base64.startsWith("data:image")) {
        base64 = base64.split(",")[1]; // Tách lấy phần sau dấu ","
    }

    // Loại bỏ các ký tự không thuộc Base64
    base64 = base64.replace(/[^A-Za-z0-9+/=]/g, '');

    // Chuyển đổi Base64 thành Uint8Array
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}
function createEditor(item, $container, $element, editorOptions) {
    //editorOptions should be main property of control here
    switch (item.editorType) {
        case "dxFileUploader":
            var controllerName = editorOptions.ModelName ? editorOptions.ModelName : "SitePictures";

            if (editorOptions.refFieldId)
                $.ajax({
                    url: `/api/${controllerName}/GetAttachtmentBySurvey?id=${editorOptions.refFieldId}`, // Replace with your actual API
                    method: 'GET',
                    success: function (data) {
                        if (data.length > 0) {
                            const previewId = `#imagePreview_${item.surveyId}_${item.outlineId}`;
                            const $previewWrapper = $(previewId);
                            if ($previewWrapper.find(".previewLoader").length === 0) {
                                const $loadDiv = $("<div>")
                                    .addClass("previewLoader")
                                    .css({ position: "absolute", width: "100%", height: "100%", top: 0, left: 0 })
                                    .appendTo($previewWrapper.css("position", "relative")); // đảm bảo container có position

                                const panel = $("<div>").appendTo($loadDiv);

                                panel.dxLoadPanel({
                                    message: "Image loading...",
                                    visible: true,
                                    shading: true,
                                    shadingColor: "rgba(255,255,255,0.7)",
                                    showPane: true,
                                    closeOnOutsideClick: false,
                                    position: { of: $previewWrapper }
                                });
                            }
                            data = data.filter(f => f.outlineId == editorOptions.outline.id);
                            data.forEach(imageInstance => {
                                imageInstance.outline = editorOptions.outline;
                                var uint8Array = new Uint8Array(imageInstance.fileData);
                                var blob = new Blob([uint8Array], { type: imageInstance.type });
                                var url = URL.createObjectURL(blob);
                                item.attachment = imageInstance;
                                imageInstance.ModelName = controllerName;
                                addImageToPreview(url, imageInstance);
                            });
            
                            $(`#imagePreview_${editorOptions.refFieldId}_${editorOptions.outline.id} .previewLoader`).remove();
                        }
                    }
                });
            editorOptions.uploadTitle = "Images";
            const $imagePreview = $(`<div id='imagePreview_${editorOptions.refFieldId}_${editorOptions.outline.id}' class='imagePreview' style='display: flex; flex-wrap: wrap; gap: 25px;top: 10px'>`).appendTo($container);
            $(`<div id="fileUpload_${editorOptions.ModelName}_${editorOptions.id}">`).dxFileUploader({
                readOnly: editorOptions.isReadOnly ? editorOptions.isReadOnly : false,
                multiple: true,
                accept: "image/*",
                selectButtonText: `Choose ${editorOptions.uploadTitle}`,
                dropZone: $imagePreview,
                labelText: "",
                uploadMode: "instantly",
                uploadUrl: `/api/${controllerName}/AsyncUploadPicture?surveyId=${editorOptions.refFieldId}&outlineId=${editorOptions.outline.id}&outlinePlaceHolder=${encodeURIComponent(editorOptions.outline?.placeHolder)}`,
                showFileList: false,
                onDropZoneEnter: function (e) {
                    //$(e.dropZoneElement).addClass("highlight-drop-zone");
                },
                onDropZoneLeave: function (e) {
                    //$(e.dropZoneElement).removeClass("highlight-drop-zone");
                },
                //onDrop: function (e) {
                //    //console.log("Files dropped:", e.event.dataTransfer.files);
                //},
                onUploadStarted: function (e) {
                    $(`#imagePreview_${editorOptions.refFieldId}_${editorOptions.outline.id}`).css("position", "relative"); // đảm bảo relative
                    $(`#imagePreview_${editorOptions.refFieldId}_${editorOptions.outline.id} .previewLoader`).remove(); // nếu có rồi
                    $("<div>").addClass("previewLoader").appendTo(`#imagePreview_${editorOptions.refFieldId}_${editorOptions.outline.id}`)
                        .dxLoadPanel({
                            message: "Image loading...",
                            visible: true,
                            shading: true,
                            shadingColor: "rgba(255,255,255,0.7)",
                            showPane: true,
                            closeOnOutsideClick: false,
                            position: { of: `#imagePreview_${editorOptions.refFieldId}_${editorOptions.outline.id}` }
                        });                },
                onUploaded: function (e) {
                    $(`#imagePreview_${editorOptions.refFieldId}_${editorOptions.outline.id} .previewLoader`).remove();
                    var response = e.request.response;
                    var responseObject = JSON.parse(response); // truy vấn attachment
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
                        var formData = editorOptions.instanceProps.formInstance.option("formData");
                        var formField = `uploadFile${item.dataField}`;
                        var fileObject = { attachment: e.file, fileName: e.file.name, dataField: item.dataField, modelName: editorOptions.ModelName, outlineId: item.outline.id, outlinePlaceholder: item.outline.placeHolder, outlineGuid: item.outline.guid, fileData: Array.from(byteArray), cacheGuid: responseObject.attachment.guid };
                        if (formData[formField] == null || formData[formField] == undefined) {
                            formData[formField] = [];
                        }
                        formData[formField].push(fileObject);
                        if (editorOptions.id) {
                            fileObject.surveyId = editorOptions.refFieldId;
                            var formObject = new Object();
                            formObject[formField] = formData[formField];
                            editorOptions.instanceProps.formInstance.option("changedFields", formObject);
                        }

                        if (responseObject.attachment.id) {
                            item.attachmentId = responseObject.attachment.id;
                        }

                        if (responseObject.sitePictures) {
                            item.sitePictureId = responseObject.sitePictures.id;
                        }
                        item.ModelName = controllerName;
                        //addImageToPreview(url, item);
                        addImageToPreview(url, responseObject.attachment);
                    }
                }
            }).appendTo($container);
            break;
        case "empty":
            //$element.text(item.label.texts).appendTo($container);
            break;
        case "simple":
            break;
        case "dxTextBox": // Note that cant edit label of the control
            $element.dxTextBox(editorOptions).appendTo($container);
            break;
        case "dxTextArea":
            $element.dxTextArea(editorOptions).appendTo($container);
            break;
        case "dxDiagram":
            break;
        case "dxDataGrid":
            var elementName = editorOptions.ModelName;
            if (editorOptions.name != null || editorOptions.name != undefined) {
                elementName = editorOptions.name;
            }
            editorOptions.gridOptionConfig.height = _defaultGridMinHeight;
            var mGridOption = new MGridOption(editorOptions.ModelName, 'User', editorOptions.gridOptionConfig);
            if (editorOptions.gridOption) {
                if (editorOptions.gridOption.gridEditorOptions) {
                    if (editorOptions.gridOption.gridEditorOptions != null || editorOptions.gridOption.gridEditorOptions != undefined) {
                        containerId = editorOptions.gridOption.mGridDetailOption?.container
                            ? editorOptions.gridOption.mGridDetailOption.container
                            : `dataGrid_${elementName}_${editorOptions.id}`;
                        $(`<div id='${containerId}' style="min-height: ${_defaultGridMinHeight}px;">`).dxDataGrid(editorOptions.gridOption.getGridOptions(editorOptions.gridOption)).appendTo($container);
                    }
                }
                else
                    $(`<div id='dataGrid_${elementName}_${editorOptions.id}' style="min-height: ${_defaultGridMinHeight}px;">`).dxDataGrid(editorOptions.gridOption.getGridOptions()).appendTo($container);
            }
            else
                $(`<div id='dataGrid_${elementName}_${editorOptions.id}' style="min-height: ${_defaultGridMinHeight}px;">`).dxDataGrid(mGridOption.getGridOptions()).appendTo($container);
            break;
        case "dxHtmlEditor":
            DevExpress.Quill.register({
                'modules/better-table': quillBetterTable,
                'formats/custom-list': CustomList
            }, true);
            var editor = createHtmlEditor($container, $element, item, editorOptions);

            break;
        case "dxDateBox":
            $element.dxDateBox({
                ...editorOptions,
                type: "date"
            }).appendTo($container);
            break;
        case "dxCheckBox":
            $element.dxCheckBox({
                value: editorOptions.value,
                onValueChanged: editorOptions.onValueChanged
            }).appendTo($container);
            break;
        case "dxNumberBox":
            $element.dxNumberBox(editorOptions).appendTo($container);
            break;
        case "dxSelectBox":
            editorOptions.searchEnabled = true;
            $element.dxSelectBox(editorOptions).appendTo($container);
            break;
        case "dxTagBox":
            editorOptions.searchEnabled = true;
            $element.dxTagBox(editorOptions).appendTo($container);
            break;
        default:
            console.warn("Unsupported editor type:", item.editorType);
    }
}

function toggleFullScreen(editor, editorElement, item, editorOptions) {
    let popupInstance;
    var titleContent = "";
    if (editorOptions.outline)
        titleContent = editorOptions.outline.content ? editorOptions.outline.content : "Content Editor";
    popupInstance = $("#mainPopup")
        .dxPopup({
            width: "95%",
            height: "95%",
            showTitle: true,
            title: `${titleContent}`,
            dragEnabled: false,
            closeOnOutsideClick: true,
            contentTemplate: function (container) {
                const tempHtmlEditor = createHtmlEditor(container, $("<div>"), item, editorOptions, true);
                return tempHtmlEditor;
            },
            onHiding: function (e) {
                const tempEditorInstance = e.component.content().find(`.dx-htmleditor`).dxHtmlEditor("instance");
                editor.option("value", tempEditorInstance.option("value")); // Cập nhật nội dung
                editorOptions.value = tempEditorInstance.option("value");
                popupInstance = null; // Reset popupInstance
            }
        })
        .dxPopup("instance");
    popupInstance.show();
}

function createHtmlEditor(container, $element, item, editorOptions, isFullscreen = false) {
    var quillInstance;
    var currentRange = new Object;
    currentRange.index = 0;
    var wingdingsChars = [
        { char: "" }, // black point
        { char: "" }, // square
        { char: "" }, // check
        { char: "" }, // square check
        { char: "" }, // square x
        { char: "" }, // square x
        { char: "" },  // right style arrow 
        { char: "" }   // four square
    ];
    var superScriptChars = [
        { char: "²" },
        { char: "³" }
    ];

    var controlId = editorOptions.instanceProps ? editorOptions.instanceProps.refFieldId : editorOptions.id;

    var editor = $element.dxHtmlEditor({
        elementAttr: {
            id: `dxHtmlEditor_${item.dataField}_${controlId}`
        },
        width: isFullscreen ? "100%" : _defaultHtmlEditorWidth,
        height: isFullscreen ? "calc(100% - 20px)" : (editorOptions.isReadOnly ? "100%" : _defaultHtmlEditorHeight),
        value: editorOptions.value,
        readOnly: item.isFieldReadOnly ? true : (editorOptions.isReadOnly || editorOptions.readOnly || false),
        isCodeView: false,
        imageUpload: {
            tabs: ['file', 'url'],
            fileUploadMode: 'base64',
        },
        imageResize: {
            displayStyles: {
                backgroundColor: 'black',
                border: 'none',
                color: 'white'
            },
            modules: ['Resize', 'DisplaySize', 'Toolbar']
        },
        mediaResizing: {
            enabled: true 
        },
        toolbar: {

            items: [

                'undo', 'redo',
                'separator',
                {
                    formatName: "size",
                    formatValues: ['8pt', '9pt', '10pt', '11pt', '12pt', '14pt', '16pt', '18pt', '20pt', '22pt', '24pt', '26pt', '28pt', '36pt', '48pt', '72pt']
                },
                {
                    formatName: 'font',
                    formatValues: ['Asap', 'Wingdings'],
                },
                'separator', 'bold', 'italic', 'strike', 'underline', 'separator',
                'alignLeft', 'alignCenter', 'alignRight', 'alignJustify', 'separator',
                //'orderedList', 'bulletList', 'separator',
                'separator',
                {
                    formatName: "header",
                    formatValues: [false, 1, 2, 3, 4, 5, 6]
                }, 'separator',
                'color', 'background', 'separator',
                'link', 'image', 'separator',
                'clear', 'codeBlock', 'blockquote', 'separator',
                {
                    widget: 'dxButton',
                    options: {
                        hint: 'Insert Table',
                        icon: 'inserttable',
                        onClick: function (e) {
                            var tableModule = editor.dxHtmlEditor("instance").getModule('better-table'); // get module instance
                            tableModule.insertTable(3, 3);
                        }
                    }
                }, {
                    widget: 'dxButton',
                    options: {
                        hint: 'Increase Indent',
                        icon: 'indent',
                        onClick: function () {
                            if (quillInstance) {
                                let range = quillInstance.getSelection();
                                if (range) {
                                    quillInstance.format('indent', '+1'); // Tăng thụt lề
                                }
                            }
                        }
                    }
                },
                {
                    widget: 'dxButton',
                    options: {
                        hint: 'Decrease Indent',
                        icon: 'outdent',
                        onClick: function () {
                            if (quillInstance) {
                                let range = quillInstance.getSelection();
                                if (range) {
                                    quillInstance.format('indent', '-1'); // Giảm thụt lề
                                }
                            }
                        }
                    }
                },
                {
                    widget: "dxDropDownButton",
                    options: {
                        text: "Symbol",
                        showArrowIcon: true,
                        dropDownOptions: { width: 100 },
                        items: wingdingsChars,
                        itemTemplate: function (data) {
                            return $("<div>").text(data.char).css({
                                fontFamily: "Wingdings",
                                fontSize: "24px",
                                //textAlign: "center",
                                cursor: "pointer"
                            });
                        },
                        onItemClick: function (e) {
                            if (quillInstance) {
                                quillInstance.insertText(currentRange.index, e.itemData.char, { font: "Wingdings" });
                            }
                        }
                    }
                },
                {
                    widget: "dxDropDownButton",
                    options: {
                        text: "m²/m³",
                        showArrowIcon: true,
                        dropDownOptions: { width: 100 },
                        items: superScriptChars,
                        itemTemplate: function (data) {
                            return $("<div>").text(data.char).css({
                                fontFamily: "Asap",
                                fontSize: "24px",
                                //textAlign: "center",
                                cursor: "pointer"
                            });
                        },
                        onItemClick: function (e) {
                            if (quillInstance) {
                                quillInstance.insertText(currentRange.index, e.itemData.char, { font: "Asap" });
                            }
                        }
                    }
                },



                //{
                //    widget: 'dxButton',
                //    options: {
                //        hint: 'Ordered List',
                //        icon: 'orderedlist',
                //        onClick: function () {
                //            let range = quillInstance.getSelection();
                //            if (range) {
                //                //quillInstance.format('list', 'ordered'); // Áp dụng danh sách có số
                //                quillInstance.format('style', 'my-custom-ordered'); // Thêm class
                //            }
                //        }
                //    }
                //},
                //{
                //    widget: 'dxButton',
                //    options: {
                //        hint: 'Bullet List',
                //        icon: 'bulletlist',
                //        onClick: function () {
                //            let range = quill.getSelection();
                //            if (range) {
                //                //quillInstance.format('list', 'bullet'); // Áp dụng danh sách chấm
                //                quillInstance.format('style', 'my-custom-bullet'); // Thêm class
                //            }
                //        }
                //    }
                //},
                'separator', {
                    name: "fullscreen",
                    widget: "dxButton",
                    visible: isFullscreen ? false : true,
                    options: {
                        text: "Full Screen",
                        onClick: function () {
                            toggleFullScreen(editor.dxHtmlEditor("instance"), editor, item, editorOptions); // Gọi hàm xử lý toggle full screen
                        }
                    }
                }, {
                    name: "codeView",
                    location: "before",
                    widget: "dxButton",
                    options: {
                        text: "Code View",
                        onClick: function (e) {
                            toggleCodeView(editor.dxHtmlEditor("instance"), e.component);
                        }
                    }
                }
            ]
        },
        onInitialized: function (e) {
            quillInstance = e.component;
            quillInstance.on("selection-change", function (range) {
                if (range) {
                    currentRange = range;
                }
            });

            lockTabPanel(e.element, editorOptions.isReadOnly);
        },
        customizeModules: function (cfg) {
            cfg.table = false;
            cfg['better-table'] = { operationMenu: [] };
        },
        onFocusOut: function () {
            currentRange = quillInstance.getSelection();
        },
        onValueChanged: function (e) {
            if (item.instanceProps?.formInstance) {
                item.instanceProps.formInstance.updateData(item.dataField, e.value);
            }
            editorOptions.value = e.value;
        }
    }).appendTo(container);

    return editor;
}

function toggleCodeView(editor, button) {
    const contentContainer = editor.element().find(".dx-htmleditor-content");
    var isCodeView = editor.option("isCodeView");
    if (isCodeView) {
        const code = contentContainer.val();
        editor.option("value", code);
        const newContent = $("<div>")
            .addClass("dx-htmleditor-content ql-editor")
            .attr("contenteditable", "true")
            .html(editor.option("value")); // Đưa HTML vào nội dung

        contentContainer.replaceWith(newContent);
        button.option("text", "Code View");
    } else {
        const htmlContent = editor.option("value");
        //const prettyContent = Prism.highlight(htmlContent, Prism.languages.html, "html");
        const textarea = $("<textarea>").addClass("dx-htmleditor-content ql-editor").val(htmlContent);
        contentContainer.replaceWith(textarea);
        button.option("text", "Text View");
    }
    editor.option("isCodeView", !isCodeView);
}

function RenderFormElement(_gridConfig, itemsArray, formInstanceProps) {

    if (_cacheCompanyData)
        if (_cacheCompanyData.some(f => f.table == "Outline"))
            _cacheOutlines = _cacheCompanyData.find(f => f.table == "Outline").rows;
    //if (_cacheOutlines.length > 0) {
    //    formInstanceProps.Outline = formInstanceProps.Outline.concat(_cacheOutlines);
    //}
    if (formInstanceProps.outlineForm) {
        if (formInstanceProps.outlineForm.surveyTypeId) {
            _cacheOutlines = _cacheOutlines.filter(f => f.surveyTypeId == formInstanceProps.outlineForm.surveyTypeId);
        }
    }
    var _formConfig = formInstanceProps.gridInstanceConfig.map(item => {
        var validationRules = [];
        if (item != null && item != undefined)
            if (item.validationRules != null && item.validationRules != undefined && item.validationRules != "") {
                try {
                    if (typeof item.validationRules === "string")
                        validationRules = JSON.parse(item.validationRules);
                    else
                        validationRules = item.validationRules
                    validationRules.forEach(rule => {
                        if (rule.type === "custom" && typeof rule.validationCallback === "string") {
                            rule.validationCallback = eval("(" + rule.validationCallback + ")");
                        }
                        return rule;
                    });
                }
                catch {

                }
            }
        //item.visible = true;
        if (item.formVisibleIndex != null || item.formVisibleIndex != undefined) {
            item.order = item.formVisibleIndex;
        }
        else
            item.order = item.order;
        if (item.order == -1) item.visible = false;
        item.validationRules = validationRules
        item.editorType = item.formDataType;
        item.calculatedDisplayField = item.dataField;
        item.width = isNullOrEmpty(item.formWidth) ? _defaultFormFieldWidth : (!item.formWidth.includes("%") ? parseInt(item.formWidth) : item.formWidth);
        item.height = isNullOrEmpty(item.formHeight) ? _defaultFormFieldHeight : (!item.formHeight.includes("%") ? parseInt(item.formHeight) : item.formHeight);
        if (!(typeof item.editorOptions === "object") && !(item.editorOptions == null)) {

            const decodedBytes = Uint8Array.from(atob(item.editorOptions), c => c.charCodeAt(0));
            const decodedString = new TextDecoder("utf-8").decode(decodedBytes);
            try {
                const jsonObject = JSON.parse(decodedString);
                Object.keys(jsonObject).forEach(key => {
                    const value = jsonObject[key];
                    if (jsonObject[key] in variableMapping) {
                        jsonObject[key] = variableMapping[jsonObject[key]];
                    }
                });

                item.editorOptionsConfig = jsonObject;
            }
            catch {
            }
        }
        if (item.formItem != null)
            if (!(typeof item.formItem === "object") && !(item.formItem == null)) {
                const decodedBytes = Uint8Array.from(atob(item.formItem), c => c.charCodeAt(0));
                const decodedString = new TextDecoder("utf-8").decode(decodedBytes);
                try {
                    const jsonObject = JSON.parse(decodedString);
                    Object.keys(jsonObject).forEach(key => {
                        const value = jsonObject[key];
                        if (jsonObject[key] in variableMapping) {
                            jsonObject[key] = variableMapping[jsonObject[key]];
                        }
                    });

                    item.formItemConfig = jsonObject;
                }
                catch {
                }
            }
        if (item.formItemConfig) {
            if (item.formItemConfig.outline) {
                const outlineIds = item.formItemConfig.outline.id.split(',').map(id => id.trim());
                const outlineObj = _cacheOutlines.find(outline =>
                    outlineIds.includes(outline.id.toString())
                )
                item.outlineObject = outlineObj;
            }
        }
        return item;
    });

    formInstanceProps.fieldConfigs = sortObjectArray(_formConfig);

    //formInstanceProps.fieldByOutline = _formConfig
    //    .filter(item => item.formItemConfig && item.formItemConfig.outline)
    //    .map(item => {
    //        const outlineIds = item.formItemConfig.outline.id.split(',').map(id => id.trim());
    //        const outlineObj = formInstanceProps.Outline.filter(outline =>
    //            outlineIds.includes(outline.id.toString())
    //        )

    //        //outline static by surveyType
    //        return {
    //            dataField: item.dataField,
    //            //outlineId: item.formItemConfig.outline.id,
    //            outlineInstance: item.outlineObject
    //        };
    //    });

    formInstanceProps.fieldByEnum = _formConfig
        .filter(item => item.formItemConfig && item.formItemConfig.enum)
        .map(item => {
            return {
                dataField: item.dataField,
                enum: item.formItemConfig.enum,
                //dataSource: dataSourceEnum(item, formInstanceProps)
            };
        });


    if (formInstanceProps.outlineForm.isOutlineDynamic) {
        if (formInstanceProps.formOptions.Params.additionalOutline != null) {
            //outline dynamic not by surveyType
            var additionalsOutline = parseParamsByteArrAsObject(formInstanceProps.formOptions.Params.additionalOutline);
            var listfieldConfig = additionalsOutline.map(m => { return { dataGridConfig: convertKeysToLowerFirstChar(m.DataGridConfig), outline: convertKeysToLowerFirstChar(m.OutlineDynamic) } });
            formInstanceProps.dynamicOutline = listfieldConfig.map(item => {
                return {
                    dataField: item.dataGridConfig.dataField,
                    //outline: item.outline.id,
                    outlineInstance: item.outline
                };
            });
        }

    }

    formInstanceProps.fieldByOutlineGroup = _formConfig
        .filter(item => item.formGroupName?.includes("AccordionGroup"))
        .map(item => {
            const groupName = item.formGroupName.split("@")[1];
            const groupItem = itemsArray.find(arrayItem =>
                arrayItem.itemType === "group" && arrayItem.name === groupName
            );
            var outlineMatch = new Object();
            if (groupItem) {
                if (groupItem.formItem)
                    outlineMatch = _cacheOutlines.find(outline => groupItem.formItem.outline?.id.includes(outline.id));
            }

            return {
                dataField: item.dataField,
                outlineId: outlineMatch ? outlineMatch?.id : null,
                outlineObject: outlineMatch
            };
        });



    var tabIndexNumber = 1;
    $.each(formInstanceProps.fieldConfigs, function (i, item) {
        var additionalEditorOptions = new Object();
        if (item.editorOptionsConfig) {
            additionalEditorOptions = item.editorOptionsConfig;
        }
        item.formItem = item.formItemConfig;
        if (item.editorType == "dxTextArea") {
            itemsArray.push({
                validationRules: item.validationRules,
                dataField: item.dataField,
                editorType: item.editorType,
                editorOptions: {
                    minHeight: item.height >= _defaultTextAreaHeight ? parseInt(item.height) : _defaultTextAreaHeight,
                    tabIndex: tabIndexNumber,
                    onFocusIn: function (e) { //not required
                        //e.component.option("autoResizeEnabled", true);
                        //e.component.option("maxHeight", 150);
                    },
                    onFocusOut: function (e) { //not reuuired
                        //e.component.option("autoResizeEnable
                        //e.component.option("autoResizeEnabled", false);
                    },
                    height: item.height >= _defaultTextAreaHeight ? parseInt(item.height) : _defaultTextAreaHeight,
                    width: item.width >= _defaultTextAreaWidth ? parseInt(item.width) : _defaultTextAreaWidth,
                    value: item.defaultValue ?? "",
                    ...additionalEditorOptions
                },
                label: { location: formInstanceProps.labelLocation, text: item.caption, visible: true },
                formGroupName: item.formGroupName,
                formItem: item.formItem,
                outlineObject: item.outlineObject,
                visible: item.visible
            });
        }
        else if (item.editorType == "dxSelectBox") {
            itemsArray.push(selectBoxRemakeOption(item, formInstanceProps, tabIndexNumber, additionalEditorOptions));
        }
        else if (item.editorType == "dxList") {
            itemsArray.push({
                formGroupName: item.formGroupName,
                dataField: item.dataField,
                editorType: "dxTextBox",
                editorOptions: {
                    tabIndex: tabIndexNumber,
                    width: item.width,
                    heigth: item.height,
                    showClearButton: true,
                    value: item.defaultValue ?? "",
                    ...additionalEditorOptions
                },
                label: { location: formInstanceProps.labelLocation, text: item.caption, visible: true },
                formItem: item.formItem,
                validationRules: item.validationRules,
                outlineObject: item.outlineObject,
                visible: item.visible
            });
        }
        else if (item.editorType == "dxMultiDataGrid") {
            var model = "Users";
            var mDropDownDS = new MDropDownDataSource();
            dataSource = mDropDownDS.getDropDownDS('id', `api/${model}/DropDownLookUp`);
            itemsArray.push({
                validationRules: item.validationRules,
                formGroupName: item.formGroupName,
                dataField: item.dataField,
                editorType: "dxDropDownBox",
                label: { location: formInstanceProps.labelLocation, text: item.caption, visible: true },
                formItem: item.formItem,
                editorOptions: {
                    showClearButton: true,
                    tabIndex: tabIndexNumber,
                    width: _defaultFormFieldWidth,
                    dropDownOptions: {
                        width: _defaultDropDownWidth,
                        height: _defaultDropDownHeight,
                    },
                    //valueExpr: "id",
                    //displayExpr: "username",
                    //columns: ["mail", "username"],
                    dataSource: dataSource,//configData.dataSource,
                    onOpened: function (e) {
                        formInstanceProps.moreActionOpenDropDown(e, dataSource, item);
                    },
                    contentTemplate: function (e) {
                        const $dataGrid = $("<div>").dxDataGrid({
                            selectionMode: 'all',
                            // remoteOperations: { paging: true, filtering: true, sorting: true, grouping: true, summary: true, groupPaging: true },
                            filterRow: { visible: true },
                            dataSource: e.component.option("dataSource"),
                            columns: e.component.option("columns"),
                            selection: { mode: "multiple" },
                            valueExpr: "id",
                            scrolling: {
                                mode: 'virtual',
                                preloadEnabled: false,
                                showScrollbar: 'always'
                            },
                            width: "100%",
                            height: "100%",
                            allowItemDeleting: false,
                            showSelectionControls: true,
                            sorting: {
                                mode: 'multiple',
                            },
                            onContentReady: function (e) {
                                e.component.option("selectedRowKeys", getGrantSurvey(formInstanceProps.id));
                            },
                            onSelectionChanged: function (selectedItems) {
                                var keys = selectedItems.selectedRowKeys,
                                    hasSelection = keys.length;
                                if (hasSelection) {
                                    e.component.selectedItem = selectedItems.selectedRowsData;
                                    e.component.option("displayValue", selectedItems.selectedRowsData[0]);
                                    e.component.option("value", keys);
                                    formInstanceProps.moreActionFromSelectedChangeDropDown(selectedItems, item, formInstanceProps.formInstance);
                                }
                            },

                            columnAutoWidth: true,
                            customizeColumns: function (columns) {
                            },
                        });

                        //var dtGrid = $dataGrid.dxDataGrid("instance");
                        //e.component.on("valueChanged", function (args) {
                        //    dtGrid.selectRows(args.value, false);
                        //    if (args.value != null) {
                        //        e.component.close();
                        //    }
                        //});
                        return $dataGrid;
                    },
                    ...additionalEditorOptions
                },
                outlineObject: item.outlineObject,
                visible: item.visible
            });
        }
        else if (item.editorType == "dxDropDownBox") {
            var configData = makeFieldFeatures(item, null, "form");
            itemsArray.push({
                validationRules: item.validationRules,
                formGroupName: item.formGroupName,
                dataField: item.dataField,
                editorType: "dxDropDownBox",
                label: { location: formInstanceProps.labelLocation, text: item.caption, visible: true },
                formItem: item.formItem,
                editorOptions: {
                    showClearButton: true,
                    tabIndex: tabIndexNumber,
                    width: _defaultFormFieldWidth,
                    dropDownOptions: {
                        width: _defaultDropDownWidth,
                        height: _defaultDropDownHeight,
                    },
                    valueExpr: "id",
                    displayExpr: configData.config.displayExp,
                    dataSource: configData.dataSource,
                    columns: configData.config.getScheme,
                    onOpened: function (e) {
                        formInstanceProps.moreActionOpenDropDown(e, configData.dataSource, item);
                    },
                    contentTemplate: function (e) {
                        const $dataGrid = $("<div>").dxDataGrid({
                            selectionMode: 'all',
                            // remoteOperations: { paging: true, filtering: true, sorting: true, grouping: true, summary: true, groupPaging: true },
                            filterRow: { visible: true },
                            dataSource: e.component.option("dataSource"),
                            columns: e.component.option("columns"),
                            selection: { mode: "single" },
                            valueExpr: "id",
                            scrolling: {
                                mode: 'virtual',
                                preloadEnabled: false,
                                showScrollbar: 'always'
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
                                    e.component.option("displayValue", selectedItems.selectedRowsData[0][configData.config.displayExp]);
                                    e.component.option("value", keys[0]);
                                    formInstanceProps.moreActionFromSelectedChangeDropDown(selectedItems, item, formInstanceProps.formInstance);
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
                    },
                    ...additionalEditorOptions
                },
                outlineObject: item.outlineObject,
                visible: item.visible
            });
        }
        else if (item.editorType == "dxDataGrid") {
        }
        else if (item.editorType == "dxDateBox") {
            itemsArray.push({
                formGroupName: item.formGroupName,
                dataField: item.dataField,
                editorType: item.editorType,
                editorOptions: {
                    tabIndex: tabIndexNumber,
                    width: item.width,
                    heigth: item.height,
                    showClearButton: true,
                    value: item.defaultValue ?? "",
                    displayFormat: dateFormatter,
                    acceptCustomValue: false, // according to typing date
                    //onFocusIn: function (e) {
                    //    e.component.option("opened", true);
                    //},
                    ...additionalEditorOptions
                },
                label: { location: formInstanceProps.labelLocation, text: item.caption, visible: true },
                formItem: item.formItem,
                validationRules: item.validationRules,
                outlineObject: item.outlineObject,
                visible: item.visible

            });
        }
        else {
            itemsArray.push({
                formGroupName: item.formGroupName,
                dataField: item.dataField,
                editorType: item.editorType,
                editorOptions: {
                    tabIndex: tabIndexNumber,
                    width: item.width,
                    heigth: item.height,
                    showClearButton: true,
                    value: item.defaultValue ?? "",
                    ...additionalEditorOptions
                },
                label: { location: formInstanceProps.labelLocation, text: item.caption, visible: true },
                formItem: item.formItem,
                validationRules: item.validationRules,
                visible: item.visible,
                outlineObject: item.outlineObject,
                visible: item.visible
            });
        }
        tabIndexNumber++;
    });
    var templateItem = new Object();

    if (itemsArray.length > 0)
        templateItem = _.cloneDeep(itemsArray.find(x => x.editorOptions !== undefined && x.editorType === "dxHtmlEditor"));

    if (formInstanceProps.outlineForm.isOutlineDynamic) {
        if (formInstanceProps.formOptions.Params) {
            if (formInstanceProps.formOptions.Params.additionalOutline != null) {

                formInstanceProps.formOptions.Params.additionalOutline = parseParamsByteArrAsObject(formInstanceProps.formOptions.Params.additionalOutline);
                $.each(formInstanceProps.formOptions.Params.additionalOutline, function (outlineIndex, outlineItem) {
                    var createItems = _.cloneDeep(templateItem);
                    createItems.editorOptions.value = outlineItem.Content;
                    createItems.dataField = outlineItem.DataGridConfig.DataField;
                    createItems.editorType = outlineItem.DataGridConfig.FormDataType;
                    createItems.label = { ...templateItem.label };
                    createItems.label.text = outlineItem.Outline.Content;
                    if (createItems.formItem != null || createItems.formItem != undefined) {
                        createItems.formItem.outline = outlineItem.Outline;
                        createItems.formItem.outline.outlineOptions = outlineItem.SurveyOutlineOptions;
                        createItems.formItem.outline.id = outlineItem.OutlineDynamic.Id;
                        createItems.formItem.outlineDynamic = outlineItem.OutlineDynamic;
                        createItems.formItem.outlineDynamic.outlineOptions = outlineItem.SurveyOutlineOptions;
                    }
                    itemsArray.push(createItems);
                });
            }
        }
    }

    if (formInstanceProps.isAllowAddOutline || formInstanceProps.isAllowAddOutline == null || formInstanceProps.isAllowAddOutline == undefined) {
        var outlineTitle = "ADD OUTLINE";
        if (formInstanceProps.formOptions)
            if (formInstanceProps.formOptions.addOutlineTitle) outlineTitle = formInstanceProps.formOptions.addOutlineTitle;
        var id = 0;
        var surveyId = 0;
        var jsonConfig = {};
        var dataForm = null;
        var addOutLine = {
            itemType: "button",
            alignment: "left",
            name: "addOutline",
            //dataField: "__addOutline__",
            //editorType: "dxButton",
            buttonOptions: {
                height: _defaultButtonHeight,
                width: "100%",
                text: outlineTitle,
                onClick: function (e) {
                    var popupInstance = $(`#outlinePopup`).dxPopup({
                        width: "70%",
                        height: "70%",
                        showTitle: true,
                        title: outlineTitle,
                        dragEnabled: false,
                        closeOnOutsideClick: true,
                        contentTemplate: function (container) {
                            var content = $("<div>").appendTo(container);
                            if (formInstanceProps?.outlineForm?.surveyTypeId)
                                jsonConfig.surveyTypeId = formInstanceProps?.outlineForm?.surveyTypeId;
                            if (formInstanceProps?.id)
                                jsonConfig.mainId = formInstanceProps?.id;
                            if (formInstanceProps?.refFieldId) {
                                surveyId = formInstanceProps?.refFieldId;
                                jsonConfig.surveyId = formInstanceProps?.refFieldId;
                            }
                            if (formInstanceProps?.Outline.length > 0) {
                                //jsonConfig.parentOutlineId = formInstanceProps?.Outline.find(f => formInstanceProps?.ModelName.toUpperCase() == f.content.replace(' ', '') && f.surveyTypeId == formInstanceProps?.outlineForm?.surveyTypeId).id;
                            }
                            if (_cacheOutlines.length > 0)
                                jsonConfig.parentOutlineId = _cacheOutlines.find(f => formInstanceProps?.ModelName.toLowerCase() == f.placeHolder.toLowerCase() && f.surveyTypeId == formInstanceProps?.outlineForm?.surveyTypeId).id;
                            var passingParams = { UITabId: `Outline_Form_${surveyId}_${id}`, refPageNum: surveyId, pageNum: id, jsonConfig: JSON.stringify(jsonConfig) };

                            appendElementViewInsideAsync(`/Business/MasterData/Outline_Form`, passingParams, content, `Outline_Form_${surveyId}_${id}`, "appendTo").then(data => {
                                dataForm = data;

                            })
                                .catch(error => {
                                    try {
                                        sendClientErrorLog("Lỗi khi tải dữ liệu:", error);
                                    }
                                    catch {
                                    }
                                    console.error("Lỗi khi tải dữ liệu:", error);
                                });


                            //$("<div>").dxScrollView({
                            //    height: "100%",
                            //    width: "100%",
                            //    showScrollbar: "always",
                            //    useNative: false,
                            //    direction: "both",
                            //    contentTemplate: function (scrollViewContent) {
                            //        return scrollViewContent;
                            //    }
                            //}).appendTo(container);


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
                                text: "Create",
                                onClick() {
                                    //var outlineForm = $(`#Outline_Form_${surveyId}_${id}`).dxForm().dxForm("instance");
                                    var passingParams = {};
                                    passingParams.Survey = {};
                                    passingParams.Outline = {};
                                    passingParams.MasterId = jsonConfig.mainId;


                                    var formData = dataForm.option('formData');
                                    //requestPassingData.Management = formData;

                                    if (formData != null)
                                        passingParams.Outline = formData;
                                    if (surveyId != 0)
                                        passingParams.Survey.Id = surveyId;

                                    if (!formData.hasOwnProperty('content') || !formData.content || formData.content.trim() === "") {
                                        appNotifyWarning("Outline content cannot be empty!");
                                    }
                                    else {
                                        $.ajax({
                                            url: 'api/Survey/AddCustomOutline',
                                            headers: { 'Content-Type': 'application/json' },
                                            type: 'POST',
                                            data: JSON.stringify(passingParams)
                                            , success: function (response) {
                                                appNotifySuccess("Outline created success! Please refresh your survey. ");
                                            },
                                            error: function (err) {
                                                appNotifyError("Outline created fail!");
                                            }
                                        });
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
            },
            editorOptions: {
                height: _defaultButtonHeight,
                width: "100%"
            },
        };
        if (!formInstanceProps.isReadOnly)
            itemsArray.push(addOutLine);
    }


    $.each(itemsArray, function (i, item) {
        var editorOptions = { ...item.editorOptions };
        if (formInstanceProps.isReadOnly)
            item.readOnly = formInstanceProps.isReadOnly;
        item.instanceProps = formInstanceProps;
        if (item.formItem != null || item.formItem != undefined) {
            if (item.formItem.outline) {
                if (!item.formItem.isPreload) {
                    if (isAccordionGroupSupportControls(item, editorOptions, formInstanceProps)) {
                        item.template = function (data, itemElement) {
                            //doubleClickDefaultPlaceHolderToText(editorOptions, data, item);
                            editorOptions.onInitialized = function (e) {
                                e.component.option("value", data.component.option("formData")[item.dataField]);
                                $(e.element).on("dblclick", function () {
                                    e.component.option("value", e.component.option("placeholder"));
                                });
                            }
                            editorOptions.onValueChanged = function (e) {
                                data.component.updateData(item.dataField, e.value);
                            };

                            createAccordionField(item, itemElement, editorOptions, formInstanceProps);
                        }
                        item.label.visible = false;
                    }
                }
                else {
                    if (item.editorType == "dxHtmlEditor") {
                        item.editorOptions.readOnly = item.readOnly;

                    }
                }
            }
            if (item.formItem.groupName) {
                item.formGroupName = `FormGroup@${item.formItem.groupName}`;
            }
        }
        else {
            item.editorOptions = { ...editorOptions };
            if (isAccordionGroupSupportControls(item, item.editorOptions, formInstanceProps)) {
                if (item.editorType == "dxHtmlEditor")
                    item.template = function (data, itemElement) {
                        //doubleClickDefaultPlaceHolderToText(editorOptions, data, item);
                        item.editorOptions.onValueChanged = function (e) {
                            data.component.updateData(item.dataField, e.value);
                        };
                        var childProps = customChildProps(item.editorOptions, formInstanceProps); //Field lẻ không nhóm
                        if (!childProps.value) {
                            childProps.value = getHtmlEditorBeforeRender(item, formInstanceProps);
                        }
                        if (formInstanceProps.isReadOnly)
                            childProps.readOnly = formInstanceProps.isReadOnly;
                        createEditor(item, itemElement, $("<div>"), childProps);
                    }
            }
        }
    });
}
async function handlePaste(gridInstance, event, gridInstanceConfig) {
    //await navigator.clipboard.readText().then(text => {
    //    var rows = text.split("\r\n");
    //    var dataRowIndex = gridInstanceConfig.focusData.rowIndex;
    //    rows.forEach((row, index) => {
    //        if (row.trim() === "") return;
    //        var cells = row.split("\t");
    //        $.each(cells, function (cIndex, cData) {
    //            if (cIndex > 0) {
    //                var nextColumnName = gridInstanceConfig.columns[gridInstanceConfig.focusData.columnIndex + cIndex].dataField;
    //                gridInstance.cellValue(dataRowIndex, nextColumnName, cells[cIndex]);
    //            }
    //            else
    //                gridInstance.cellValue(dataRowIndex, gridInstanceConfig.focusData.column.name, cells[cIndex]);
    //        });
    //        dataRowIndex++;
    //    });
    //});
}

function fetchConfigurationData(model, typeScheme = null) {
    var sysTableConfig = [];
    var getScheme = [];
    var displayExp;
    var itemConfig = new Object();
    // Fetch toolbarItemsConfig
    itemConfig = getModelConfig(model);
    sysTableConfig = itemConfig;
    //if (_cacheDataGridConfigs.length > 0) ///Đưa cache ngay chỗ này
    //    getScheme = _cacheDataGridConfigs.filter(f => f.sysTableFK.name == model);
    //else {
    var url = `/api/${model}/GetScheme`;
    if (typeScheme != null || typeScheme != undefined)
        url = typeScheme == "User" ? `/api/${model}/GetScheme` : `/api/${model}/GetSystemScheme`;
    // Fetch getScheme
    $.ajax({
        url: url,
        type: 'GET',
        async: false,
        success: function (response) {
            getScheme = response;
        },
        error: function (err) {
            console.warn(` AppUtilsFetchSchemeException: Scheme is not defined or controller ${model} not exist!`);
        }
    });
    //}
    // Tìm displayExpr dựa vào model trong toolbarItemsConfig
    var displayExp = "name";
    if (itemConfig != null || itemConfig != undefined) {
        if (itemConfig.displayExpr)
            displayExp = itemConfig.displayExpr;
    }

    return {
        sysTableConfig,
        getScheme,
        displayExp
    };
}

function makeBasicDataSource(instance, isForm = false) {
    var checkCustomQueryByModel = null;
    if (_sysTables) {
        checkCustomQueryByModel = _sysTables.find(f => f.name == instance.ModelName);
    }
    if (!isForm) {

        let filter = null;
        if (instance.filterRefId != null && instance.filterRefField != null) {
            filter = [instance.filterRefField, "=", instance.filterRefId];
        }

        if (instance.filterRefField2 != null) {
            if (filter) {
                if (instance.filterRefId2 == null)
                    filter = [
                        filter, "and", [instance.filterRefField2, "=", null]
                    ];
                else
                    filter = [
                        filter, "and", [instance.filterRefField2, "=", instance.filterRefId2]
                    ];
            }
        }

        if (checkCustomQueryByModel != null || checkCustomQueryByModel != undefined) {
            if (checkCustomQueryByModel.customQuery != "" && checkCustomQueryByModel.customQuery != null && checkCustomQueryByModel.customQuery != undefined) {

                return new DevExpress.data.DataSource({
                    load: function () {
                        return $.ajax({
                            url: `/api/${instance.ModelName}/ExecuteCustomQuery`,
                            method: "POST",
                            contentType: "application/json",
                            data: JSON.stringify(checkCustomQueryByModel.customQuery)
                        });
                    }
                });
            }
            else {
                return new DevExpress.data.DataSource({
                    filter: filter,
                    store: DevExpress.data.AspNet.createStore({
                        key: "id",
                        loadUrl: `/api/${instance.ModelName}/GetAll`,
                        updateUrl: `/api/${instance.ModelName}/UpdateData`,
                        insertUrl: `/api/${instance.ModelName}/InsertData`,
                        deleteUrl: `/api/${instance.ModelName}/DeleteData`
                    })
                });
            }
        }
        else {
            return new DevExpress.data.DataSource({
                filter: filter,
                store: DevExpress.data.AspNet.createStore({
                    key: "id",
                    loadUrl: `/api/${instance.ModelName}/GetAll`,
                    updateUrl: `/api/${instance.ModelName}/UpdateData`,
                    insertUrl: `/api/${instance.ModelName}/InsertData`,
                    deleteUrl: `/api/${instance.ModelName}/DeleteData`
                })
            });
        }
    }
    else {
        let filter = null;
        filter = ["id", "=", instance.id];
        if (checkCustomQueryByModel != null || checkCustomQueryByModel != undefined) {
            if (checkCustomQueryByModel.customQuery == "" || checkCustomQueryByModel.customQuery == null || checkCustomQueryByModel.customQuery == undefined)
                return new DevExpress.data.CustomStore({
                    load: function () {
                        if (instance.isQuery) {
                            if (instance.refFieldName && !instance.isChildForeignKey)
                                instance.callApi('GetFKMany', null, null);
                            else
                                instance.callApi('GetSingle', null, null);

                        }
                    }
                });
            else {
                checkCustomQueryByModel.filter = filter;
                return new DevExpress.data.CustomStore({
                    load: function (loadOptions) {
                        instance.callApi('CustomQuery', checkCustomQueryByModel, null);
                        //return $.ajax({
                        //    url: `/api/${instance.ModelName}/ExecuteCustomQuery`,
                        //    method: "POST",
                        //    contentType: "application/json",
                        //    data: JSON.stringify(checkCustomQueryByModel.customQuery)
                        //});
                    }
                });
            }
        }
    }
}

function groupItemsByFormGroupName(items) {
    const groupedItems = items.reduce((groups, item) => {
        if (item.formGroupName != null || item.formGroupName != undefined) {
            if (item.formGroupName.startsWith("AccordionGroup@")) {
                const groupName = item.formGroupName.split("@")[1];
                if (!groups[groupName]) {
                    groups[groupName] = [];
                }
                groups[groupName].push(item);
            }
            if (item.formGroupName.startsWith("FormGroup@")) {
                const groupName = item.formGroupName.split("@")[1];
                if (!groups[groupName]) {
                    groups[groupName] = [];
                }
                groups[groupName].push(item);
            }
        }
        //else if (item.itemType === "button") {
        //    if (!groups["button"]) {
        //        groups["button"] = [];
        //    }
        //    groups["button"].push(item);
        //}
        return groups;
    }, {});

    for (const groupName in groupedItems) {
        groupedItems[groupName].sort((a, b) => a.order - b.order);
    }

    return groupedItems;
}

function groupItemsByFormGroupNameNonChild(items) {
    const groupedItems = items.reduce((groups, item) => {
        if (item.formGroupName != null && item.formGroupName !== undefined) {
            if (item.formGroupName.startsWith("AccordionGroup@") || item.formGroupName.startsWith("FormGroup@")) {
                const groupName = item.formGroupName.split("@")[1];
                if (!groups[groupName]) {
                    groups[groupName] = [];
                }
                groups[groupName].push(item);
            }
        }
        return groups;
    }, {});

    for (const groupName in groupedItems) {
        groupedItems[groupName].sort((a, b) => a.order - b.order);
    }

    const groupedItemsSet = new Set(
        Object.values(groupedItems).flat() // Lấy toàn bộ phần tử đã được nhóm
    );

    const remainingItems = items.filter(item => !groupedItemsSet.has(item));

    return {
        groupedItems,
        remainingItems
    };
}



function makeFieldFeatures(item, obj, type) {
    var model = item.dataField.replace(/\b(\w+)Id\b/g, (match, p1) => {
        return p1.charAt(0).toUpperCase() + p1.slice(1);
    });

    if (item.mappingFieldFK != null || item.mappingFieldFK != undefined) {
        model = item.mappingFieldFK.name;
    }
    var config = new Object();
    var dataSource = null;
    if (type == "grid") {
        config = fetchConfigurationData(model, obj.gridType);
        dataSource = makeBasicDataSource(obj);
    }
    if (type == "form") {
        config = fetchConfigurationData(model);
        var mDropDownDS = new MDropDownDataSource();
        dataSource = mDropDownDS.getDropDownDS('id', `api/${model}/DropDownLookUp`);
    }
    ////item.calculateDisplayValue = gridInstance.GridConfig.displayExpr,
    $.each(config.getScheme, function (schIndex, schCol) {
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
    return {
        config, dataSource, model
    };
}


function createAccordionGroup(item, $itemElement, formInstanceProps) {
    var formField = $("<div>");
    var accordionId = `accordion_${formInstanceProps.id}_${item.name}`;
    var outlineObject = null
    var outlineChildPrefix = "";

    //if (formInstanceProps.Outline != null)
    //    outlineObject = formInstanceProps.Outline.find(f => item.caption.includes(f.content));
    if (item.formItem) {

        if (item.formItem.outlineDynamic == null || item.formItem.outlineDynamic == undefined) {
            outlineObject = _cacheOutlines.find(f => {
                const outlineIds = item.formItem.outline.id.split(",").map(id => id.trim());
                return outlineIds.includes(f.id.toString());
            });

        }
        else {
            if (formInstanceProps.formOptions)
                if (formInstanceProps.formOptions.prefixChildOutline) outlineChildPrefix = formInstanceProps.formOptions.prefixChildOutline;
            outlineObject = item.formItem.outlineDynamic;
            outlineObject.content = item.formItem.outlineDynamic.Content;
        }
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


    if (outlineObject != null || outlineObject != undefined) {
        var accordionElement = $("<div>").dxAccordion({
            dataSource: [
                { title: outlineChildPrefix + outlineObject.content, items: item.items, outline: outlineObject, formInstanceProps: formInstanceProps, accordionKey: item.name ? item.name : "" }
            ],
            deferRendering: true,
            collapsible: true,
            multiple: true,
            animationDuration: 300,
            selectedIndex: -1,
            //onItemClick: function (e) {
            //    e.event.stopImmediatePropagation();
            //    e.event.stopPropagation();
            //    return false;
            //},
            itemTitleTemplate: function (itemData) {
                const outerContainer = $(`<div style='display:flex'>`).addClass("outer-container");
                $(`<div id='title_${accordionId}'><strong>${itemData.title}</strong></div>`)
                    .appendTo(outerContainer).on("click", function (e) {
                        e.stopPropagation();
                    });

                if (formInstanceProps.outlineForm)
                    if (formInstanceProps.outlineForm.isOutlineChecked) {
                        const radioContainer = $("<div style='display:flex'>").addClass("custom-radio-button").on("click", function (e) {
                            e.stopPropagation();
                        });
                        createRadioGroup({
                            title: itemData.title
                        }, radioContainer, outlineObject, formInstanceProps, itemData);

                        const deleteOutlineContainer = $("<div style='display:flex ;padding-left: 20px;margin-top: -4px;'>").addClass("custom-radio-button").on("click", function (e) {
                            e.stopPropagation();
                        });

                        createDeleteOutline({
                            title: itemData.title
                        }, deleteOutlineContainer, outlineObject, formInstanceProps, itemData);

                        radioContainer.appendTo(outerContainer);
                        deleteOutlineContainer.appendTo(outerContainer);
                    }
                return outerContainer;
            },
            itemTemplate: function (itemData, index, $contentElement) {
                $.each(itemData.items, function (iIndex, itemChild) {


                    //doubleClickDefaultPlaceHolderToText(itemChild.editorOptions, that.formInstance, itemChild)
                    itemChild.editorOptions.onInitialized = function (e) {
                        $(e.element).on("dblclick", function () {
                            e.component.option("value", e.component.option("placeholder"));
                        });
                    }
                    itemChild.editorOptions.value = formInstanceProps.formInstance.option("formData")[itemChild.dataField],
                        itemChild.editorOptions.onValueChanged = function (e) {
                            formInstanceProps.formInstance.updateData(itemChild.dataField, e.value);
                        }
                    itemChild.outline = itemData.outline;
                    //var childProps = { ...itemChild, ...itemChild.editorOptions };

                    //if (itemChild.editorType == 'dxDataGrid' || itemChild.editorType == 'dxFileUploader') {
                    //    childProps.gridConfig = itemChild.gridConfig;
                    //    childProps.gridOptionConfig = itemChild.gridOptionConfig;
                    //    childProps.id = itemChild.id;
                    //    childProps.ModelName = itemChild.ModelName;
                    //}
                    var childProps = customChildProps(itemChild, formInstanceProps); //Field nhóm accordion
                    itemChild.instanceProps = childProps.instanceProps;

                    if (itemChild.label.visible)
                        if (itemChild.editorType != "empty")
                            $(`<span class='dx-label'>${itemChild.label.text}: </span >`).appendTo($contentElement);
                        else
                            $(`<div class='dx-label'>`).html(itemChild.label.text).appendTo($contentElement);
                    itemChild.inputAttr = {
                        'aria-label': itemChild.label.text
                    };
                    createEditor(itemChild, $contentElement, formField, childProps);
                });
            }
        }).appendTo($itemElement);
        var accordionInstance = accordionElement.dxAccordion("instance");
        accordionInstance.repaint();
    }
}

function createAccordionField(item, $itemElement, editorOptions, formInstanceProps) { // a field by a dxAccordion
    var outlineObject = null
    var masterId = formInstanceProps.id;
    if (formInstanceProps.refFieldId) {
        masterId = formInstanceProps.refFieldId;
    }
    var accordionId = `accordion_${masterId}_${item.dataField}`;
    var outlineChildPrefix = "";
    if (item.formItem != null) {
        if (item.formItem.outline) {
            if (item.formItem.outlineDynamic == null || item.formItem.outlineDynamic == undefined) {
                //outlineObject = formInstanceProps.Outline.find(f => {
                //    const outlineIds = item.formItem.outline.id.split(",").map(id => id.trim());
                //    return outlineIds.includes(f.id.toString());
                //});

                outlineObject = item.outlineObject;
            }
            else {
                if (formInstanceProps.formOptions)
                    if (formInstanceProps.formOptions.prefixChildOutline) {
                        outlineChildPrefix = formInstanceProps.formOptions.prefixChildOutline;
                    }
                outlineObject = convertKeysToLowerFirstChar(item.formItem.outlineDynamic);
                outlineObject.content = item.formItem.outlineDynamic.Content;
            }
            if (outlineObject != null || outlineObject != undefined) {
                var accordionElement = $("<div>").dxAccordion({
                    dataSource: [
                        { title: outlineChildPrefix + outlineObject.content, dataField: item.dataField, type: item.editorType, outline: outlineObject, fieldInstance: item, formInstanceProps: formInstanceProps }
                    ],
                    collapsible: true,
                    deferRendering: true,
                    multiple: true,  // Cho phép chỉ mở một mục tại một thời điểm
                    animationDuration: 300,
                    selectedIndex: -1,
                    itemTitleTemplate: function (itemData) {
                        const outerContainer = $(`<div id='${accordionId}' style='display:flex'>`).addClass("outer-container");
                        $(`<div id='title_${accordionId}'><strong>${itemData.title}</strong></div>`)
                            .appendTo(outerContainer).on("click", function (e) {
                                e.stopPropagation();
                            });


                        if (formInstanceProps.outlineForm) {
                            if (formInstanceProps.outlineForm.isOutlineChecked) {
                                const radioContainer = $("<div style='display:flex'>").addClass("custom-radio-button").on("click", function (e) {
                                    e.stopPropagation();
                                });
                                createRadioGroup({
                                    title: itemData.title
                                }, radioContainer, outlineObject, formInstanceProps, itemData);
                                radioContainer.appendTo(outerContainer);
                            }

                            if (formInstanceProps.outlineForm.isAllowRemoveOutline && item.formItem.outlineDynamic) {
                                const deleteOutlineContainer = $("<div style='display:flex;padding-left: 20px;margin-top: -4px;'>").addClass("custom-radio-button").on("click", function (e) {
                                    e.stopPropagation();
                                });
                                createDeleteOutline({
                                    title: itemData.title
                                }, deleteOutlineContainer, outlineObject, formInstanceProps, itemData);
                                deleteOutlineContainer.appendTo(outerContainer);
                            }
                        }
                        return outerContainer;
                    },
                    itemTemplate: function (itemData, index, $contentElement) {
                        editorOptions.outline = itemData.outline;
                        editorOptions.label = { visible: false };
                        editorOptions.parentItem = itemData.fieldInstance;
                        var childProps = customChildProps(editorOptions, formInstanceProps); //Field lẻ Accordion
                        itemData.fieldInstance.instanceProps = childProps.instanceProps;
                        var editorElement = $("<div>");
                        //createEditor(itemData.fieldInstance, $contentElement, $("<div>"), childProps);
                        createEditor(itemData.fieldInstance, $contentElement, editorElement, childProps);
                        var defaultImageUploader = { ...editorOptions };
                        defaultImageUploader.editorType = "dxFileUploader";
                        defaultImageUploader.outline = itemData.outline;
                        var imageChildProps = customChildProps(defaultImageUploader, formInstanceProps);
                        var imageFieldInstance = { ...itemData.fieldInstance };
                        imageFieldInstance.editorType = "dxFileUploader";
                        imageFieldInstance.outline = itemData.outline;
                        createEditor(imageFieldInstance, $contentElement, $("<div>"), imageChildProps);
                    }
                }).appendTo($itemElement);
                var accordionInstance = accordionElement.dxAccordion("instance");
                accordionInstance.repaint();

            }
        }
    }
    else {

    }
}

function createAccordionFieldMore(item, $itemElement, editorOptions, formInstanceProps, moreControl) { // a field by a dxAccordion
    var outlineObject = null
    if (item.formItem != null) {
        if (item.formItem.outline) {
            if (item.formItem.outlineDynamic == null || item.formItem.outlineDynamic == undefined) {
                //outlineObject = formInstanceProps.Outline.find(f => {
                //    const outlineIds = item.formItem.outline.id.split(",").map(id => id.trim());
                //    return outlineIds.includes(f.id.toString());
                //});
                outlineObject = item.outlineObject;
            }
            else {
                outlineObject = item.formItem.outlineDynamic;
                outlineObject.content = item.formItem.outlineDynamic.Content;
            }
            if (outlineObject != null || outlineObject != undefined) {
                var accordionElement = $("<div>").dxAccordion({
                    dataSource: [
                        { title: outlineObject.content, dataField: item.dataField, type: item.editorType, outline: outlineObject, fieldInstance: item }
                    ],
                    collapsible: true,
                    deferRendering: true,
                    multiple: true,  // Cho phép chỉ mở một mục tại một thời điểm
                    animationDuration: 300,
                    selectedIndex: -1,
                    itemTitleTemplate: function (itemData) {
                        const outerContainer = $("<div style='display:flex'>").addClass("outer-container");
                        $(`<div><strong>${itemData.title}</strong></div>`)
                            .appendTo(outerContainer).on("click", function (e) {
                                e.stopPropagation();
                            });


                        if (formInstanceProps.outlineForm)
                            if (formInstanceProps.outlineForm.isOutlineChecked) {
                                const radioContainer = $("<div style='display:flex'>").addClass("custom-radio-button").on("click", function (e) {
                                    e.stopPropagation();
                                });
                                createRadioGroup({
                                    title: itemData.title
                                }, radioContainer, outlineObject, formInstanceProps, itemData);

                                radioContainer.appendTo(outerContainer);
                            }
                        return outerContainer;
                    },
                    itemTemplate: function (itemData, index, $contentElement) {
                        editorOptions.outline = itemData.outline;
                        editorOptions.label = { visible: false };
                        editorOptions.parentItem = itemData.fieldInstance;
                        var childProps = customChildProps(editorOptions, formInstanceProps); //Field lẻ Accordion
                        itemData.fieldInstance.instanceProps = childProps.instanceProps;
                        createEditor(itemData.fieldInstance, $contentElement, $("<div>"), childProps);
                        var defaultImageUploader = { ...editorOptions };
                        defaultImageUploader.editorType = "dxFileUploader";
                        defaultImageUploader.outline = itemData.outline;
                        var imageChildProps = customChildProps(defaultImageUploader, formInstanceProps);
                        var imageFieldInstance = { ...itemData.fieldInstance };
                        imageFieldInstance.editorType = "dxFileUploader";
                        imageFieldInstance.outline = itemData.outline;
                        createEditor(imageFieldInstance, $contentElement, $("<div>"), imageChildProps);
                        if (moreControl) {
                            var moreControlOptions = { ...editorOptions };
                            moreControlOptions.editorType = moreControl.editorType;
                            moreControlOptions.outline = itemData.outline;
                            moreControlOptions.height = itemData.height;
                            var controlChildProps = customChildProps(moreControlOptions, formInstanceProps);
                            var controlFieldInstance = { ...itemData.fieldInstance };
                            controlFieldInstance.editorType = moreControl.editorType;
                            controlFieldInstance.outline = itemData.outline;
                            createEditor(controlFieldInstance, $contentElement, $("<div>"), controlChildProps);
                        }
                    }
                }).appendTo($itemElement);
                var accordionInstance = accordionElement.dxAccordion("instance");
                accordionInstance.repaint();
            }
        }
    }
    else {

    }
}
function customChildProps(editorOptions, instanceProps) {
    var childProps = { ...editorOptions, ...editorOptions.editorOptions };
    if (editorOptions.editorType == 'dxDataGrid' || editorOptions.editorType == 'dxFileUploader') {
        editorOptions.label.visible = false;
        if (instanceProps.refFieldId != null || instanceProps.refFieldId != undefined)
            childProps.refFieldId = instanceProps.refFieldId;
        if (instanceProps.refFieldName != null || instanceProps.refFieldName != undefined)
            childProps.refFieldName = instanceProps.refFieldName;
        if (editorOptions.ModelName != null || editorOptions.ModelName != undefined)
            childProps.ModelName = editorOptions.ModelName;
        else
            childProps.ModelName = instanceProps.ModelName;
        if (instanceProps.id)
            if (instanceProps.id != null || instanceProps.id != undefined)
                childProps.id = instanceProps.id;
    }
    if (editorOptions.parentItem) {
        childProps.value = instanceProps.formInstance.option("formData")[editorOptions.parentItem.dataField];
    }
    if (instanceProps.isReadOnly)
        childProps.isReadOnly = instanceProps.isReadOnly;
    childProps.instanceProps = instanceProps;
    childProps.gridConfig = editorOptions.gridConfig;
    childProps.gridOptionConfig = editorOptions.gridOptionConfig;
    childProps.width = editorOptions.width;
    childProps.height = editorOptions.height;
    if (editorOptions.value)
        childProps.value = editorOptions.value;
    if (editorOptions.outline)
        if (editorOptions.outline.id)
            if (editorOptions.outline.id != null || editorOptions.outline.id != undefined) {
                //childProps.outlineId = editorOptions.outline.id;
                childProps.outline = editorOptions.outline;
                if (editorOptions.outline.placeHolder)
                    childProps.placeholder = editorOptions.outline.placeHolder;
            }
    return childProps;
}

function createRadioGroup(titleData, radioContainer, outlineObject, formInstanceProps, itemData) {
    var selectedValue = 1;
    if (outlineObject.outlineOptions) {
        if (outlineObject.outlineOptions) {
            selectedValue = outlineObject.outlineOptions.OptionValue;
        }

    }
    else {
        if (formInstanceProps.outlineForm) {
            if (formInstanceProps.outlineForm.outlineOptions)
                if (formInstanceProps.outlineForm.outlineOptions.length > 0) {
                    selectedValue = formInstanceProps.outlineForm.outlineOptions.find(f => f.outlineId == outlineObject.id)?.optionValue;
                }
        }
    }
    const groupName = `group_${titleData.title}_${outlineObject.id}_${formInstanceProps.id}`;
    const radioOptions = [
        { text: "Yes", value: 1 },
        { text: "No", value: 0 },
        { text: "N/A", value: -1 },
    ];

    radioOptions.forEach(option => {
        const id = `${groupName}_${option.text}_${outlineObject.id}_${formInstanceProps.id}`;


        const inputControl = $("<input>")
            .attr({
                type: "radio",
                id: id,
                name: groupName,
                checked: option.value == selectedValue ? true : false
            })
            //.addClass("custom-radio-button")   
            .ready(function () {
                var outlineOptionsObject = { outlineId: outlineObject.id, optionValue: 1 };
                if (formInstanceProps.OutlineList == null || formInstanceProps.OutlineList == undefined)
                    formInstanceProps.OutlineList = [];
                formInstanceProps.OutlineList.push(outlineOptionsObject);
            })
            .on("change", function () {
                var outlineOptionsObject = { outlineId: outlineObject.id, optionValue: option.value };
                var formData = formInstanceProps.formInstance.option("formData");
                var formField = `outlineOptions_${itemData.outline.id}`;
                if (formData[formField] == null || formData[formField] == undefined) {
                    formData[formField] = new Object();
                }
                formData[formField] = outlineOptionsObject;
                if (formInstanceProps.id) {
                    var formObject = new Object();
                    formObject[formField] = formData[formField];
                    formInstanceProps.formInstance.option("changedFields", formObject);
                }
                var controlId = itemData.fieldInstance.id != null ? itemData.fieldInstance.id : formInstanceProps.id;
                var editor = $(`#dxHtmlEditor_${itemData.fieldInstance.dataField}_${controlId}`).dxHtmlEditor().dxHtmlEditor("instance");
                if (editor != null) {
                    if (option.value == -1) {
                        editor.option("readOnly", true);
                        editor.option("value", "");
                    } else if (option.value == 0) {
                        editor.option("readOnly", false);
                        editor.option("value", "Nil");
                    }
                    else {
                        if (formInstanceProps.isReadOnly)
                            editor.option("readOnly", true);
                        else
                            editor.option("readOnly", false);
                    }
                }
                else {
                    itemData.fieldInstance.isFieldReadOnly = false;
                    if (option.value == 0 || option.value == -1) {
                        itemData.fieldInstance.isFieldReadOnly = true;
                    }
                    else {
                        if (formInstanceProps.isReadOnly)
                            itemData.fieldInstance.isFieldReadOnly = true;
                        else
                            itemData.fieldInstance.isFieldReadOnly = false;
                    }
                }
            })
            .appendTo(radioContainer);



        $("<label>")
            .attr("for", id)
            .addClass("radio-label")
            .text(option.text)
            .appendTo(radioContainer);
        return radioContainer;
    });
}



function createDeleteOutline(titleData, deleteContainer, outlineObject, formInstanceProps, itemData) {
    if (outlineObject.outlineOptions) {
        if (outlineObject.outlineOptions) {
            selectedValue = outlineObject.outlineOptions.OptionValue;
        }

    }
    else {
        if (formInstanceProps.outlineForm) {
            if (formInstanceProps.outlineForm.outlineOptions)
                if (formInstanceProps.outlineForm.outlineOptions.length > 0) {
                    selectedValue = formInstanceProps.outlineForm.outlineOptions.find(f => f.outlineId == outlineObject.id).optionValue;
                }
        }
    }
    //const groupName = `group_${titleData.title}_${outlineObject.id}_${formInstanceProps.id}`;


    $(`<div id='renameOutline_${outlineObject.id}_${formInstanceProps.id}'>`).dxButton({
        icon: "edit", // icon bút chì - biểu tượng rename
        elementAttr: {
            title: "Rename" // Tooltip khi hover
        },
        height: 30,
        width: 40,
        disabled: formInstanceProps.isReadOnly,
        onContentReady: function (e) {
            $(e.element).find(".dx-button-content").removeClass("dx-button-content").css({
                marginTop: "5px",
            });
        },
        onClick: function (e) {
            var id = 0;
            var surveyId = 0;
            var jsonConfig = {};
            var dataForm = null;
            var popupInstance = $(`#outlinePopup`).dxPopup({
                width: "70%",
                height: "70%",
                showTitle: true,
                title: "RENAME OUTLINE",
                dragEnabled: false,
                closeOnOutsideClick: true,
                contentTemplate: function (container) {
                    var content = $("<div>").appendTo(container);
                    if (formInstanceProps?.outlineForm?.surveyTypeId)
                        jsonConfig.surveyTypeId = formInstanceProps?.outlineForm?.surveyTypeId;
                    if (formInstanceProps?.id)
                        jsonConfig.mainId = formInstanceProps?.id;
                    if (formInstanceProps?.refFieldId) {
                        surveyId = formInstanceProps?.refFieldId;
                        jsonConfig.surveyId = formInstanceProps?.refFieldId;
                    }
                    if (formInstanceProps?.Outline.length > 0) {
                        //jsonConfig.parentOutlineId = formInstanceProps?.Outline.find(f => formInstanceProps?.ModelName.toUpperCase() == f.content.replace(' ', '') && f.surveyTypeId == formInstanceProps?.outlineForm?.surveyTypeId).id;
                    }
                    if (_cacheOutlines.length > 0)
                        jsonConfig.parentOutlineId = _cacheOutlines.find(f => formInstanceProps?.ModelName.toUpperCase() == f.content.replace(' ', '') && f.surveyTypeId == formInstanceProps?.outlineForm?.surveyTypeId).id;
                    var passingParams = { UITabId: `Outline_Form_${surveyId}_${id}`, refPageNum: surveyId, pageNum: id, jsonConfig: JSON.stringify(jsonConfig) };

                    appendElementViewInsideAsync(`/Business/MasterData/Outline_Form`, passingParams, content, `Outline_Form_${surveyId}_${id}`, "appendTo").then(data => {
                        dataForm = data;

                    })
                        .catch(error => {
                            try {
                                sendClientErrorLog("Lỗi khi tải dữ liệu:", error);
                            }
                            catch {
                            }
                            console.error("Lỗi khi tải dữ liệu:", error);
                        });


                    //$("<div>").dxScrollView({
                    //    height: "100%",
                    //    width: "100%",
                    //    showScrollbar: "always",
                    //    useNative: false,
                    //    direction: "both",
                    //    contentTemplate: function (scrollViewContent) {
                    //        return scrollViewContent;
                    //    }
                    //}).appendTo(container);


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
                        text: "Change",
                        onClick() {
                            //var outlineForm = $(`#Outline_Form_${surveyId}_${id}`).dxForm().dxForm("instance");
                            var passingParams = {};
                            passingParams.Survey = {};
                            passingParams.Outline = {};
                            passingParams.MasterId = jsonConfig.mainId;

                            var formData = dataForm.option('formData');
                            //requestPassingData.Management = formData;

                            if (formData != null) {
                                passingParams.Outline = formData;
                                if (outlineObject) {
                                    passingParams.Outline.placeHolder = outlineObject.placeHolder;
                                    passingParams.Outline.id = outlineObject.id;
                                }
                            }
                            if (surveyId != 0)
                                passingParams.Survey.Id = surveyId;

                            $.ajax({
                                url: 'api/Survey/RenameCustomOutline',
                                headers: { 'Content-Type': 'application/json' },
                                type: 'POST',
                                data: JSON.stringify(passingParams)
                                , success: function (response) {
                                    appNotifySuccess("Outline renamed success! Please refresh your survey. ");
                                },
                                error: function (err) {
                                    appNotifyError("Outline renamed fail!");
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


        }
    }).appendTo(deleteContainer);


    $(`<div id='deleteOutline_${outlineObject.id}_${formInstanceProps.id}'>`).dxButton({
        icon: "close", // icon mặc định của DevExtreme (biểu tượng X)
        elementAttr: {
            title: "Remove" // Tooltip khi hover vào
        },
        height: 30,
        width: 40,
        disabled: formInstanceProps.isReadOnly,
        onContentReady: function (e) {
            $(e.element).find(".dx-button-content").removeClass("dx-button-content").css({
                marginTop: "5px",
            });
        },
        onClick: function (e) {
            var popupBox = appNotifyWarning("Are you sure to remove this outline?", true);
            e.event.stopPropagation();
            popupBox.then((result) => {
                if (result.isConfirmed) {
                    $.ajax({
                        url: `api/${formInstanceProps.ModelName}/DeleteOutline/${formInstanceProps.id}/${outlineObject.id}`,
                        type: 'GET',
                        async: false,
                        success: function (response) {
                            appNotifySuccess("Outline removed! Please refresh your survey");
                        },
                        error: function () {
                        }
                    });
                }
                else {
                }
            });


        }
    }).appendTo(deleteContainer);

    //const inputControl = $("<input>")
    //    .attr({
    //        type: "radio",
    //        id: id,
    //        name: groupName,
    //        checked: option.value == selectedValue ? true : false
    //    })
    //    //.addClass("custom-radio-button")   
    //    .ready(function () {
    //        var outlineOptionsObject = { outlineId: outlineObject.id, optionValue: 1 };
    //        if (formInstanceProps.OutlineList == null || formInstanceProps.OutlineList == undefined)
    //            formInstanceProps.OutlineList = [];
    //        formInstanceProps.OutlineList.push(outlineOptionsObject);
    //    })
    //    .on("change", function () {
    //        var outlineOptionsObject = { outlineId: outlineObject.id, optionValue: option.value };
    //        var formData = formInstanceProps.formInstance.option("formData");
    //        var formField = `outlineOptions_${itemData.outline.id}`;
    //        if (formData[formField] == null || formData[formField] == undefined) {
    //            formData[formField] = new Object();
    //        }
    //        formData[formField] = outlineOptionsObject;
    //        if (formInstanceProps.id) {
    //            var formObject = new Object();
    //            formObject[formField] = formData[formField];
    //            formInstanceProps.formInstance.option("changedFields", formObject);
    //        }
    //        var editor = $(`#dxHtmlEditor_${itemData.fieldInstance.dataField}_${itemData.fieldInstance.id}`).dxHtmlEditor().dxHtmlEditor("instance");
    //        if (editor != null) {
    //            if (option.value == -1) {
    //                editor.option("readOnly", true);
    //                editor.option("value", "");
    //            } else if (option.value == 0) {
    //                editor.option("readOnly", false);
    //                editor.option("value", "Nil");
    //            }
    //            else {
    //                if (formInstanceProps.isReadOnly)
    //                    editor.option("readOnly", true);
    //                else
    //                    editor.option("readOnly", false);
    //            }
    //        }
    //        else {
    //            itemData.fieldInstance.isFieldReadOnly = false;
    //            if (option.value == 0 || option.value == -1) {
    //                itemData.fieldInstance.isFieldReadOnly = true;
    //            }
    //            else {
    //                if (formInstanceProps.isReadOnly)
    //                    itemData.fieldInstance.isFieldReadOnly = true;
    //                else
    //                    itemData.fieldInstance.isFieldReadOnly = false;
    //            }
    //        }
    //    })
    //    .appendTo(deleteContainer);
    return deleteContainer;
}


function isAccordionGroupSupportControls(item, props, formInstanceProps) {
    if (item.editorType == "dxTextArea" || item.editorType == "dxHtmlEditor") {
        if (!props.value) {
            if (item.formItem)
                if (item.formItem.isPreload)
                    props.value = getHtmlEditorBeforeRender(item, formInstanceProps)
        }
        return true;
    }
    else
        return false;
}


//itemChild.editorOptions.onInitialized = function (e) {
//    $(e.element).on("dblclick", function () {
//        e.component.option("value", e.component.option("placeholder"));
//    });
//}
//itemChild.editorOptions.value = that.formInstance.option("formData")[itemChild.dataField],
//    itemChild.editorOptions.onValueChanged = function (e) {
//        that.formInstance.updateData(itemChild.dataField, e.value);
//    }
//doubleClickDefaultPlaceHolderToText(itemChild.editorOptions, that.formInstance, itemChild)
function doubleClickDefaultPlaceHolderToText(editorOptions, data, item) {
    editorOptions.onInitialized = function (e) {
        e.component.option("value", data.component.option("formData")[item.dataField]);
        $(e.element).on("dblclick", function () {
            e.component.option("value", e.component.option("placeholder"));
        });
    }
    editorOptions.onValueChanged = function (e) {
        data.component.updateData(item.dataField, e.value);
    };
}

function dataSourceEnum(item, gridInstance) {
    const dataSourceLookup = DevExpress.data.AspNet.createStore({
        key: 'id',
        loadUrl: `api/${gridInstance.ModelName}/EnumLookup?refField=${item.formItemConfig.enum}&enumName=${item.formItemConfig.enum}`,
        insertUrl: `api/${gridInstance.ModelName}/UpdateEnum`,
        paginate: true
    });

    $.ajax({
        url: `api/${gridInstance.ModelName}/EnumLookup?refField=${item.formItemConfig.enum}&enumName=${item.formItemConfig.enum}`,
        method: "GET",
        dataType: "json",
        async: false,
        success: function (data) {
            item.formItemConfig.enumDataArray = data.map(item => {
                return {
                    id: item.id,
                    key: `${item.key}`
                }
            });
        }
    })

    //dataSourceLookup.load().done((data) => item.formItemConfig.enumDataArray = data.map(it => {
    //    return {
    //        id: it.id,
    //        key: `${it.key}`
    //    }
    //}));
    return dataSourceLookup;
}

function flattenItems(items) {
    let result = [];
    $.each(items, function (itemIndex, item) {
        if (item.items && Array.isArray(item.items)) {
            result = result.concat(flattenItems(item.items));
        } else {
            result.push(item);
        }
    });

    return result;
}

function selectBoxRemakeOption(item, gridInstance, index, addtionalOptions) {
    var itemArr = [];
    var dataSourceLookup = new Object();
    if (item.formItem) {
        if (item.formItem.enum) {
            //itemArr = item.formItem.enumDataArray;
            dataSourceLookup = dataSourceEnum(item, gridInstance);
            itemArr = item.formItem.enumDataArray;
            //dataSourceLookup.load().done((data) => itemArr = data.map(it => {
            //    return {
            //        id: it.id,
            //        key: `${it.key}`
            //    }
            //}));
        }
        else {
            dataSourceLookup = DevExpress.data.AspNet.createStore({
                key: 'id',
                loadUrl: `api/${gridInstance.ModelName}/EnumLookup?refField=${item.dataField}`,
                insertUrl: `api/${gridInstance.ModelName}/UpdateEnum`,
                paginate: true
            });

            $.ajax({
                url: `api/${gridInstance.ModelName}/EnumLookup?refField=${item.dataField}`,
                method: "GET",
                dataType: "json",
                async: false,
                success: function (data) {
                    itemArr = data.map(item => {
                        return {
                            id: item.id,
                            key: `${item.key}`
                        }
                    });
                }
            })
        }
    }
    else {
        dataSourceLookup = DevExpress.data.AspNet.createStore({
            key: 'id',
            loadUrl: `api/${gridInstance.ModelName}/EnumLookup?refField=${item.dataField}`,
            insertUrl: `api/${gridInstance.ModelName}/UpdateEnum`,
            paginate: true
        });

        $.ajax({
            url: `api/${gridInstance.ModelName}/EnumLookup?refField=${item.dataField}`,
            method: "GET",
            dataType: "json",
            async: false,
            success: function (data) {
                itemArr = data.map(item => {
                    return {
                        id: item.id,
                        key: `${item.key}`
                    }
                });
            }
        })
    }




    var dataSource = new DevExpress.data.DataSource({
        store: {
            data: itemArr,
            type: 'array',
            key: 'id',
        },
    });

    item.lookup = { //Search Bar data
        dataSource: dataSourceLookup,
        displayExpr: 'key',
        valueExpr: 'id',
        searchEnabled: true,
        showClearButton: true
    };
    //item.onSelectionChanged = function (e) {

    //};

    item.editorType = "dxSelectBox";
    item.editorOptions = {
        editorType: "dxSelectBox",
        //dropDownOptions : { minWidth: 200 },
        dataSource: dataSource,
        valueExpr: 'id',
        displayExpr: 'key',
        searchEnabled: true,
        width: 300,
        acceptCustomValue: true,
        onValueChanged: function (e) { // handle after select
            if (gridInstance.moreActionFromSelectedChangeSelectBox)
                gridInstance.moreActionFromSelectedChangeSelectBox(e, item, gridInstance);
            else {
                if (e.value) {
                    // Cập nhật giá trị vào cell
                    gridInstance.component.cellValue(
                        gridInstance.row.rowIndex,
                        item.dataField,
                        e.value
                    );
                } else {
                    // Xóa giá trị trong cell
                    gridInstance.component.cellValue(
                        gridInstance.row.rowIndex,
                        item.dataField,
                        null
                    );
                }
                //gridInstance.component.saveEditData();
            }
        },
        onCustomItemCreating: function (e) {
            //var dataSource = dataSourceLookup;
            e.customItem = {}; //Avoid lib error
            e.text = $.trim(e.text);
            var itemSearch = $try(function () { return dataSource._items.find(x => x.key === e.text) });
            if (itemSearch != null) {
                var selectedItem = $try(function () { return e.component.option("selectedItem") });
                if (selectedItem != null) {
                    e.customItem = itemSearch.key;
                    gridInstance.component.cellValue(gridInstance.row.rowIndex, item.dataField, itemSearch.id);
                    return e.customItem;
                }
            } else {
                const newValue = e.text;
                if (newValue) {
                    $(function () {
                        var dialog = DevExpress.ui.dialog.confirm("No selection matching your search, do you want to add new it?");
                        dialog.done(function (confirm) {
                            if (confirm == true) {
                                const newItem = { key: newValue, mappingField: item.dataField, sysTableId: item.sysTableId };
                                //e.customItem = dataSource.store().insert(newItem)
                                //    .then(() => dataSource.load())
                                //    .then(() => newItem)
                                //    .catch((error) => {
                                //        throw error;
                                //    });
                                if (dataSourceLookup != null) {
                                    e.customItem = dataSourceLookup.insert(newItem).then(dataSourceLookup.load().done(function (data) {
                                        itemArr = data.map(item => {
                                            return {
                                                id: item.id,
                                                key: `${item.key}`
                                            }
                                        });
                                        dataSource._items = itemArr;
                                        dataSource._store._array = itemArr;
                                        dataSource.reload();
                                        gridInstance.component.refresh();
                                    }));

                                }
                            }
                        });
                    })
                }
            }
            return e.customItem;
        },
    };
    if (addtionalOptions) {
        item.editorOptions.acceptCustomValue = (addtionalOptions.acceptCustomValue != undefined || addtionalOptions.acceptCustomValue != null) ? addtionalOptions.acceptCustomValue : true;
        item.editorOptions.searchEnabled = (addtionalOptions.searchEnabled != undefined || addtionalOptions.searchEnabled != null) ? addtionalOptions.searchEnabled : true;
    }
    return item;
    //});
}

function byteObjectConvert(item, instanceProps) {
    if (item.formItem != null) {
        if (!(typeof item.formItem === "object") && !(item.formItem == null)) {
            const decodedBytes = Uint8Array.from(atob(item.formItem), c => c.charCodeAt(0));
            const decodedString = new TextDecoder("utf-8").decode(decodedBytes);
            try {
                const jsonObject = JSON.parse(decodedString);
                Object.keys(jsonObject).forEach(key => {
                    const value = jsonObject[key];
                    if (jsonObject[key] in variableMapping) {
                        jsonObject[key] = variableMapping[jsonObject[key]];
                    }
                });

                item.formItemConfig = jsonObject;
                item.formItem = jsonObject;
            }
            catch {
            }
        }
        if (item.formItemConfig && item.formItemConfig.outline)
            item.outlineId = item.formItemConfig.outline.id;
        if (item.formItemConfig && item.formItemConfig.enum) {
            item.enum = item.formItemConfig.enum;
            //item.dataSource = dataSourceEnum(item, instanceProps);
        }
    }
}

function getWordingContent(item) {
    var wordingContent = "";

    $.ajax({
        url: `api/Wording/GetDefaultByField?fieldName=${item.dataField}`,
        type: 'GET',
        async: false,
        success: function (response) {
            wordingContent = response.wordingContent;
        },
        error: function () {
        }
    });
    return wordingContent;
}

function getGrantSurvey(surveyId) {
    var grantSurveyList = [];

    $.ajax({
        url: `api/Survey/GetGrantSurveyList/${surveyId}`,
        type: 'GET',
        async: false,
        success: function (response) {
            grantSurveyList = JSON.parse(response);
        },
        error: function () {
        }
    });
    return grantSurveyList;
}

function makeDropDownBoxOptions(e, model, placeholder, valueExpr, displayExpr) {
    var mDropDownDS = new MDropDownDataSource();
    e.editorType = "dxDropDownBox";
    //e.acceptCustomValue = true;
    //e.searchEnabled = true;
    var dataSource = mDropDownDS.getDropDownDS('id', `api/${model}/DropDownLookUp`);
    e.editorOptions.acceptCustomValue = e.editorOptions.acceptCustomValue ?? true;
    e.editorOptions.searchEnabled = e.editorOptions.searchEnabled ?? true;
    e.editorOptions.dropDownOptions = {
        width: _defaultGridDropDownOptionsWidth,
        height: _defaultGridDropDownOptionsHeight,
    };
    e.editorOptions.valueExpr = valueExpr;
    e.editorOptions.displayExpr = displayExpr;
    e.editorOptions.placeholder = placeholder;
    e.editorOptions.dataSource = dataSource;
    e.editorOptions.contentTemplate = function (e) {
    };


    //e.editorOptions = {
    //    acceptCustomValue: false,
    //    searchEnabled: true,
    //    width: _defaultFormFieldWidth,
    //    dropDownOptions: {
    //        width: _defaultGridDropDownOptionsWidth,
    //        height: _defaultGridDropDownOptionsHeight,
    //    },
    //    valueExpr: valueExpr,
    //    displayExpr: displayExpr,
    //    placeholder: placeholder,
    //    dataSource: dataSource,
    //    contentTemplate: function (e) {
    //    },
    //}

}

function getHtmlEditorBeforeRender(item, formInstanceProps) {
    var content = "";
    $.ajax({
        url: `api/${formInstanceProps.ModelName}/GetHtmlString?id=${formInstanceProps.id}&fieldName=${item.dataField}`,
        type: 'GET',
        async: false,
        success: function (response) {
            content = response;
        },
        error: function () {
        }
    });
    return content;
}
function lockTabPanel(element, isLocked) {
    if (isLocked) {
        element.addClass("locked-tabpanel");
    } else {
        element.removeClass("locked-tabpanel");
    }
}

function checkConnection(url, timeout = 5000) {
    return new Promise((resolve, reject) => {
        try {
            const xhr = new XMLHttpRequest();
            xhr.open('HEAD', url, true); // Dùng HEAD thay vì GET
            xhr.timeout = timeout;

            xhr.onload = function () {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve("online"); // Kết nối thành công
                } else if (xhr.status === 401 || xhr.status === 403) {
                    resolve("warning"); // Không được ủy quyền hoặc từ chối
                } else if (xhr.status === 404) {
                    resolve("offline"); // Không tìm thấy
                } else {
                    resolve("offline"); // Lỗi khác
                }
            };

            xhr.onerror = function (e, status) {
                resolve("warning");
            };

            xhr.ontimeout = function (to) {
                resolve("offline");
            };

            xhr.send();
        }
        catch {

        }
    });
}

function updateButtonStatus(buttonId, className) {
    const button = document.getElementById(buttonId);
    if (!button) return;
    button.classList.remove('online', 'warning', 'offline');
    button.classList.add(className);
}

function generateGUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

function outlineCheckLogic(item, formInstanceProps) {
    var outlineObject = new Object();
    if (item.formItem.outlineDynamic == null || item.formItem.outlineDynamic == undefined) {
        outlineObject = formInstanceProps.Outline.find(f => {
            const outlineIds = item.formItem.outline.id.split(",").map(id => id.trim());
            return outlineIds.includes(f.id.toString());
        });
    }
    else {
        outlineObject = item.formItem.outlineDynamic;
        outlineObject.outlineDynamic = item.formItem.outlineDynamic;
        outlineObject.content = item.formItem.outlineDynamic.Content;
        outlineObject.outlineOptions = item.formItem.outlineDynamic.outlineOptions;
    }
    return outlineObject;
}

function parseParamsByteArrAsObject(additionalOutline) {
    const byteArray = Uint8Array.from(atob(additionalOutline), c => c.charCodeAt(0));
    const decodedString = new TextDecoder("utf-8").decode(byteArray);
    const jsonObject = JSON.parse(decodedString);
    return jsonObject;
}

function convertKeysToLowerFirstChar(obj) {
    const newObj = {};

    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const newKey = key.charAt(0).toLowerCase() + key.slice(1);
            newObj[newKey] = obj[key];
        }
    }

    return newObj;
}
function convertToTitleCase(str) {
    if (!str) return ""; // Kiểm tra nếu chuỗi rỗng

    return str
        .toLowerCase() // Chuyển toàn bộ chuỗi về chữ thường
        .split(" ")    // Tách chuỗi thành mảng các từ
        .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Viết hoa chữ cái đầu mỗi từ
        .join(" ");    // Ghép lại thành chuỗi
}
function convertKeysToUpperFirstChar(obj) {
    const newObj = {};

    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const newKey = key.charAt(0).toUpperCase() + key.slice(1);
            newObj[newKey] = obj[key];
        }
    }

    return newObj;
}

function dataSourceMoveRow(row, rowIndex, groupIndex, direction, gridInstance, isFormGroup = false) {
    rowIndex = row.data.rowOrder;
    var dataSource = gridInstance.getDataSource();
    var groupRows = gridInstance.getVisibleRows().filter(m => m.rowType == "group");
    var groupFilterIndex = groupRows.findIndex(f => f.rowIndex === groupIndex);
    var items = [];
    if (isFormGroup) {
        items = dataSource._items[groupFilterIndex].items;
        var firstRowOfGroupIndex = dataSource._items[groupFilterIndex].rowIndex;
        if (items.every(item => !item.rowOrder || item.rowOrder === 0)) {
            for (let i = 0; i < items.length; i++) {
                items[i].rowOrder = i;
            }
        }
    }
    else
        items = dataSource._items;

    var dataFilter = items.find(f => f.rowOrder === rowIndex);
    var dataFilterIndex = items.findIndex(f => f.rowOrder === rowIndex);
    var targetIndex = direction === "up" ? rowIndex - 1 : rowIndex + 1;
    var dataTargetFilter = items.find(f => f.rowOrder === targetIndex);
    var targetDataFilterIndex = items.findIndex(f => f.rowOrder === targetIndex);
    if (isFormGroup) {
        if (direction === "up" && dataFilterIndex === 0) return; //Bound of group
        if (direction === "down" && dataFilterIndex === items.length - 1) return; //Bound of group
    }
    else {
        if (direction === "up" && dataFilterIndex === -1) return; //Bound of group
        if (direction === "down" && dataFilterIndex === items.length) return; //Bound of group
    }
    var tempRow = items[dataFilterIndex];
    items[dataFilterIndex] = dataTargetFilter;
    items[targetDataFilterIndex] = tempRow;
    gridInstance.saveEditData();
    var rows = gridInstance.getVisibleRows().filter(m => m.rowType == "data");

    $.each(rows, function (_, row) {
        dataSource.store().update(row.data.id, { rowOrder: row.dataIndex })
            .then()
            .catch(error => console.error("Error updating rowOrder:", error));
    });
    return items;
}

function moveGroupRow(rowIndex, direction, gridInstance) {
    var dataSource = gridInstance.getDataSource();
    var groupRows = gridInstance.getVisibleRows().filter(m => m.rowType == "group");
    var dataFilter = groupRows.find(f => f.rowIndex === rowIndex);
    var dataFilterIndex = groupRows.findIndex(f => f.rowIndex === rowIndex);
    var targetIndex = direction === "up" ? (rowIndex - (groupRows[dataFilter.key - 1].data.items.length) - 1) : rowIndex + (dataFilter.data.items.length + 1);
    var dataTargetFilter = groupRows.find(f => f.rowIndex === (targetIndex  ));
    var targetDataFilterIndex = groupRows.findIndex(f => f.rowIndex === targetIndex);
    if (direction === "up" && dataFilterIndex === 0) return;
    if (direction === "down" && dataFilterIndex === groupRows.length - 1) return; 
    if (dataTargetFilter) if (dataTargetFilter.data.key === 999) return;
    if (!dataTargetFilter || targetDataFilterIndex < 0) return;
    $.each(dataFilter.data.items, function (childIndex, childItem) {
        dataSource.store().update(childItem.id, { sideOrder: targetDataFilterIndex })
            .then()
            .catch(error => console.error("Error updating rowOrder:", error));
    });

    $.each(dataTargetFilter.data.items, function (childIndex, childItem) {
        dataSource.store().update(childItem.id, { sideOrder: dataFilterIndex })
            .then()
            .catch(error => console.error("Error updating rowOrder:", error));
    });
    var rows = gridInstance.getVisibleRows().filter(m => m.rowType == "group");
    return groupRows;
}

function findPreviousGroupIndex(cellElement) {
    // Lấy dòng hiện tại
    const currentRowElement = $(cellElement).closest("tr");

    // Lấy danh sách tất cả các dòng trong bảng
    const allRows = currentRowElement.closest("tbody").find("tr");

    // Duyệt ngược để tìm dòng nhóm trước đó
    const previousGroupElement = currentRowElement.prevAll("tr.dx-group-row").first();

    if (previousGroupElement.length) {
        // Trả về index của dòng nhóm trong danh sách tất cả các dòng
        return allRows.index(previousGroupElement);
    }

    // Nếu không tìm thấy dòng nhóm trước đó, trả về -1
    return -1;
}

function customDataSourceRecalculate(gridInstance) {
    const dataSource = gridInstance.getDataSource();
    if (dataSource._items) {
        dataSource._items.forEach(item => {
            item.originSideName = item.sideName;
            item.sideName = `${item.sideOrder}. ${item.sideName}`;
        });
    }
}
function disableCellClick(e) {
    e.element.find(".dx-datagrid-group-closed, .dx-datagrid-group-opened").remove();
    e.element.find(".dx-datagrid.dx-row").remove();
    e.element.find('td.dx-command-expand.dx-datagrid-group-space.dx-datagrid-expand.dx-selection-disabled').on("click", function (eC) {
        eC.stopPropagation();
    })
}
function participantListColumnsProcess(columns, gridInstance, that) {
    
    $.each(columns, function (i, col) {
        //if (col.dataField === "sideName") {
        if (col.dataField === "sideOrder") {
            //customDataSourceRecalculate(gridInstance);
            participantListColRemake(col, gridInstance, that);
        }
    });
}
function participantListColRemake(col, gridInstance, that) {
    col.allowGrouping = true;
    col.groupIndex = 0;
    col.allowSorting = true;
    col.sortOrder = "asc";
    //col.sortOrder = undefined;
    col.groupCellTemplate = function (element, options) {
        const allRows = gridInstance.getVisibleRows();
        var groupRowsForDisplay = allRows.find(m => m.rowType == "group" && m.key == options.displayValue);
         const $container = $("<div>")
        .css({
            display: "flex",
            alignItems: "center",
            gap: "10px"
        })
        .on("click", function (e) {
            e.stopPropagation(); 
        })
            .appendTo(element);
        if (groupRowsForDisplay) {

        $("<span>")
            //.text(options.displayValue + ". " + groupRowsForDisplay.data?.items[0]?.sideName)// + ". " + )
            .text(groupRowsForDisplay.data?.items[0]?.sideName)// + ". " + )
                .css({
                    "margin-right": "10px", // Tạo khoảng cách giữa span và nút
                    "vertical-align": "middle" // Căn giữa nội dung nếu cần
                })
                .appendTo($container);

            $("<div>").dxButton({
                text: "Add member",
                onClick: function (e) {
                    e.event.stopPropagation();
                    if (gridInstance) {
                        var passingParams = new FormData();
                        const newGroup = {
                            sideName: options.data.items[0]?.sideName,
                            sideOrder: options.data.items[0]?.sideOrder,
                            personName: "",
                            personDepartment: "",
                            sideId: that.filterRefId2,
                            surveyId: that.filterRefId,
                            rowOrder: 0
                        };

                        // Gán giá trị vào FormData
                        passingParams.append("values", JSON.stringify(newGroup));

                        $.ajax({
                            url: 'api/ParticipantList/InsertData',
                            processData: false, // Để không xử lý FormData thành chuỗi
                            contentType: false, // Để jQuery tự động thêm Content-Type phù hợp
                            type: 'POST',
                            async: false,
                            data: passingParams,
                            success: function (response) {
                            },
                            error: function (err) {
                            }
                        });
                        dataSource.reload();
                        //dataSource.store().insert(newGroup)
                        //    .then(() => )
                        //    .catch(error => console.error("Error adding group:", error));
                        gridInstance.refresh();
                    }
                }
            }).css({
                "display": "inline-block", // Hiển thị nút trên cùng dòng
                "margin-left": "10px" // Tạo khoảng cách giữa nút và span
            }).appendTo($container);
            if (options.data.items[0]?.sideName != "Tokio Marine Insurance Vietnam Company Limited") {
                // Thêm nút Move Up
                $("<div>").dxButton({
                    text: "Move group up",
                    onClick: function (e) {
                        e.event.stopPropagation();
                        const rows = gridInstance.getVisibleRows();
                        var groupRows = rows.filter(m => m.rowType == "group");
                        if (groupRows) {
                            //const rowIndex = groupRows.find(row => row.data.key === options.displayValue);
                            //if (rowIndex.rowIndex > 0) {
                                groupRows = moveGroupRow(groupRowsForDisplay.rowIndex, "up", gridInstance);
                                gridInstance.refresh();
                            //}
                        }
                    }
                }).css({
                    "display": "inline-block",
                    "margin-left": "10px"
                }).appendTo($container);

                // Thêm nút Move Down
                $("<div>").dxButton({
                    text: "Move group down",
                    onClick: function (e) {
                        e.event.stopPropagation();
                        const rows = gridInstance.getVisibleRows();
                        var groupRows = rows.filter(m => m.rowType == "group");
                        if (groupRows) {
                            //const rowIndex = groupRows.find(row => row.data.key === options.displayValue);
                            //if (rowIndex.rowIndex >= 0) {
                                groupRows = moveGroupRow(groupRowsForDisplay.rowIndex, "down", gridInstance);
                                gridInstance.refresh();
                            //}
                        }
                    }
                }).css({
                    "display": "inline-block",
                    "margin-left": "10px"
                }).appendTo($container);
            }
        }
    };
}

function addMoveButtonsToCell(e) {
    // Tạo nút Move Up
    $("<a>")
        .addClass("fa fa-arrow-up")
        .css({ marginRight: "5px", cursor: "pointer", color: "#337ab7" })
        .on("click", function () {
            const groupIndex = findPreviousGroupIndex(e.cellElement);
            dataSourceMoveRow(e, e.rowIndex - 1, groupIndex, "up", e.component, true);
            e.component.refresh();
        })
        .appendTo(e.cellElement);

    // Tạo nút Move Down
    $("<a>")
        .addClass("fa fa-arrow-down")
        .css({ marginRight: "35%", cursor: "pointer", color: "#337ab7" })
        .on("click", function () {
            const groupIndex = findPreviousGroupIndex(e.cellElement);
            dataSourceMoveRow(e, e.rowIndex - 1, groupIndex, "down", e.component, true);
            e.component.refresh();
        })
        .appendTo(e.cellElement);
}
function jsonToTable(jsonData, fieldsToShow = []) {
    const table = $("<table>").css({
        width: "100%",
        borderCollapse: "collapse",
    });

    // Tạo header của bảng
    const headerRow = $("<tr>").appendTo(table);
    ["Field", "Value"].forEach((header) => {
        $("<th>")
            .text(header)
            .css({
                border: "1px solid #ccc",
                padding: "5px",
                backgroundColor: "#f5f5f5",
                textAlign: "left",
            })
            .appendTo(headerRow);
    });

    function processObject(obj, parentKey = "") {
        for (const key in obj) {
            const value = obj[key];
            const fullKey = parentKey ? `${parentKey}.${key}` : key;

            // Kiểm tra nếu chỉ cần hiển thị các field được định nghĩa
            if (fieldsToShow.length > 0 && !fieldsToShow.includes(fullKey)) continue;

            const row = $("<tr>").appendTo(table);
            $("<td>")
                .text(fullKey)
                .css({
                    border: "1px solid #ccc",
                    padding: "5px",
                })
                .appendTo(row);
            $("<td>")
                .text(
                    typeof value === "object"
                        ? JSON.stringify(value, null, 2)
                        : value
                )
                .css({
                    border: "1px solid #ccc",
                    padding: "5px",
                })
                .appendTo(row);
        }
    }

    processObject(jsonData);

    return table;
}

function markupStatusCSS(container, options, control = null) {
    const status = options.displayValue; // Giá trị trạng thái
    const statusText = {
        Pending: "Pending",
        Recall: "Recall",
        Waiting: "Waiting",
        Draft: "Draft",
        Checking: "Checking",
        Done: "Done"
    };

    const colors = {
        Pending: "#ffc107", // Vàng
        Draft: "#ffc107", // Vàng
        Recall: "#dc3545", // Đỏ
        Waiting: "#17a2b8", // Xanh dương
        Checking: "#17a2b8", // Xanh dương
        Done: "#28a745" // Xanh lá
    };

    const color = colors[statusText[status]] || "#ffffff"; // Mặc định là trắng nếu không khớp
    if (options.displayValue) {
        var contentDiv = $("<div>")
            .text(options.displayValue)
            .css({
                backgroundColor: color,
                color: "#fff",
                textAlign: "center",
                padding: "5px",
                borderRadius: "5px",
                fontWeight: "bold"
            });
        if (control != null) {
            contentDiv.appendTo(control);
            control.appendTo(container);
        }
        else
            contentDiv.appendTo(container);
    }

}

function sendClientErrorLog(message, err) {
    const errorLog = {
        message: typeof message === 'string' ? message : JSON.stringify(message),
        url: window.location.href,
        userAgent: navigator.userAgent,
        errorBrowserDetails: err ? {
            status: err?.status || null,
            responseText: err?.responseText || null,
            stack: err?.stack || null
        } : {},
        time: new Date().toISOString()
    };
    $.ajax({
        url: '/api/ClientBrowserError/LogClientError',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(errorLog),
        success: function () {
            console.log("Error logged to server");
        },
        error: function () {
            console.warn("Failed to log error to server");
        }
    });
}

function parseDateTime(dateStr) {
    const parts = dateStr.split(/[- :T]/);
    return new Date(
        parseInt(parts[0]),      // year
        parseInt(parts[1]) - 1,  // month (0-based)
        parseInt(parts[2]),      // day
        parseInt(parts[3]),      // hour
        parseInt(parts[4]),      // minute
        parseInt(parts[5])     // second
    );
}

function UserGuideExceptionHandle(xhr) {
    var typeError = xhr.getResponseHeader("X-Error-Type");
    var errorMessage = xhr.getResponseHeader("X-Error-Message");
    if (typeError == "FileNotFound") errorMessage = "Please try Update Report once!";
    if (typeError == "InternalError") errorMessage = "Document is processing, please try again later.";
    appNotifyWarning(errorMessage);
}
function makePopup(sizePopup, title) {
    var idSizePopup = "";
    var width = "";
    var height = "";
    switch (sizePopup) {
        case "small":
            idSizePopup = "#inputTextPopup";
            width = "50%";
            height = "50%";
            break;
        case "medium":
            idSizePopup = "#outlinePopup";
            width = "70%";
            height = "70%";
            break;
        case "large":
            idSizePopup = "#mainPopup";
            width = "95%";
            height = "99%";
            break;
        default:
            idSizePopup = "";
            break;
    }


    var popupInstance = $(idSizePopup).dxPopup({
        width: width,
        height: height,
        showTitle: true,
        title: title,
        dragEnabled: false,
        closeOnOutsideClick: true,
        contentTemplate: function (container) {
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
    return popupInstance;
}

function passIdCustomQuery(query, objectId, objectField) {
    return query.toLowerCase().replace("@" + objectField.toLowerCase(), objectId)
}

function markAccordionAsChanged(accordionId) {
    const safeId = accordionId.replace(/([:.()\[\],])/g, "\\$1");
    const $title = $(`#${safeId}`);
    //const $title = $(`#${accordionId}`);
    $title.css({
        border: "2px solid orange",
        boxShadow: "0 0 6px rgba(255, 165, 0, 0.5)",
        borderRadius: "4px",
        padding: "4px"
    });
}

function markAccordionAsSaved(accordionId) {
    const $title = $(`#${accordionId}`);
    $title.css({
        border: "2px solid green",
        boxShadow: "0 0 4px rgba(0, 128, 0, 0.5)",
        borderRadius: "5px"
    });
}

function clearAccordionHighlight(accordionId) {
    const $title = $(`#${accordionId}`);
    $title.css({
        border: "",
        boxShadow: "",
        borderRadius: "",
        padding: ""
    });
}

function sortObjectArray(objectArr) {
    return objectArr.sort(function (a, b) {
        return a.order - b.order;
    });
}

function buildGroupedData(rawData, groupField, groupSortField) {
    const grouped = {};

    rawData.forEach(item => {
        const key = item[groupField];
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(item);
    });

    const result = [];

    Object.entries(grouped)
        .sort((a, b) => {
            const orderA = a[1][0][groupSortField] ?? 0;
            const orderB = b[1][0][groupSortField] ?? 0;
            return orderA - orderB;
        })
        .forEach(([key, items]) => {
            result.push({ isGroup: true, groupKey: key, groupData: items[0] }); // dòng nhóm giả
            result.push(...items); // các dòng dữ liệu thực
        });

    return result;
}
