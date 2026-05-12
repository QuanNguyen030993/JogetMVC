
//var ListFormat = Quill.import('formats/list');

//class CustomList extends ListFormat {
//    static formats(domNode) {
//        let format = super.formats(domNode);
//        //format.class = domNode.getAttribute('class') || '';
//        return format;
//    }

//    format(name, value) {
//        super.format(name, value);
//        if (name === 'class' && value) {
//            this.domNode.setAttribute('class', value);
//        }
//    }
//}

//Quill.register(CustomList, true);

var _db;
var _cacheCompanyData = null;
    const _dbName = "CompanyDataDB";
    const _storeName = "CompanyData";
var _cacheOutlines = [];
var _allScheme = [];
var fetchTables = ["Outline", "DataGridConfig"];

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
    if (typeof str === "string")
        return !str || str.trim().length === 0;
    else {
    return str === null ? true : false;
    }
}

//function isNullOrEmpty(str) {
//    return str === null || str === undefined || (typeof str === 'string' && str.trim().length === 0);
//}


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
    if (item.outline?.id)
        $(`#imagePreview_${item.surveyId}_${item.outline.id}`).append($imageContainer);
    else
        $(`#imagePreview_${item.surveyId}`).append($imageContainer);
}

//function addLCImagePreviewElement(imagePath, item, $imageContainer) {
//    var imageHeight = 0;
//    var imageWidth = 0;
//    const byteArray = new Uint8Array(item.fileData); // Example byte array for "Hello"
//    const blob = new Blob([byteArray], { type: item.type }); 
//    var fr = new FileReader();
//    fr.readAsArrayBuffer(blob);
//    fr.onload = function (event) {
//        var url = URL.createObjectURL(blob);
//        const img = new Image();
//        img.src = url;
//        img.onload = function () {
//            imageHeight = img.height;
//            imageWidth = img.width;
//            var url = `https://${window.location.host}/api/Attachment/Browse/${item.attachmentGuid}`;
//            const $imageLink = $("<a>")
//                .attr("href", url) // Set href to the image path
//                .attr("target", "_blank") // Open link in a new tab
//                .appendTo($imageContainer);
//            $("<img>")
//                .attr("src", imagePath)
//                .css({ width: imageWidth + 'px', height: imageHeight + 'px', objectFit: 'cover', borderRadius: '5px' })
//                .appendTo($imageLink);
//            if (item.outline?.id)
//                $(`#imagePreview_${item.lossControlId}_${item.outline.id}`).append($imageContainer);
//            else
//                $(`#imagePreview_${item.lossControlId}`).append($imageContainer);
//        };

//    }

//}


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
        case "dxImageUploader":
            var controllerName = "Document";

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
            var $imagePreview = $(`<div id='imagePreview_${editorOptions.refFieldId}_${editorOptions.outline.id}' class='imagePreview' style='display: flex; flex-wrap: wrap; gap: 25px;top: 10px'>`).appendTo($container);
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
                        });
                },
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
        case "dxFileUploader":
            {

                var items = new Object();
                items.moduleName = editorOptions?.moduleName || item.moduleName;
                items.sectionName = editorOptions?.sectionName || item.sectionName;
                items.code = editorOptions?.code || item.code;
                items.specificFolder = editorOptions?.specificFolder || item.specificFolder;
                renderDxFileUploader(items, $container, {
                    controllerName: "Document",
                    uploadTitle: "Files",
                    uploadUrl: "/api/Attachment/AsyncUploadFile",
                    accept: "*/*"
                });
                //loadDxFileUploaderAttachments(item, "Document", items);
            }
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
                        $(`<div id='${containerId}' style="min-height: ${_defaultGridMinHeight}px;">`).dxDataGrid(editorOptions.gridOption.makeGridOptions(editorOptions.gridOption)).appendTo($container);
                    }
                }
                else
                    $(`<div id='dataGrid_${elementName}_${editorOptions.id}' style="min-height: ${_defaultGridMinHeight}px;">`).dxDataGrid(editorOptions.gridOption.makeGridOptions()).appendTo($container);
            }
            else
                $(`<div id='dataGrid_${elementName}_${editorOptions.id}' style="min-height: ${_defaultGridMinHeight}px;">`).dxDataGrid(mGridOption.makeGridOptions()).appendTo($container);
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

    var defaultOnValueChanged = function (e) {
        if (item.instanceProps?.formInstance) {
            item.instanceProps.formInstance.updateData(item.dataField, e.value);
        }
        editorOptions.value = e.value;
    };

    if (item.customEditorOptions) {
        if (editorOptions.onValueChanged)
            defaultOnValueChanged = editorOptions.onValueChanged;
    }

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
        onValueChanged: defaultOnValueChanged
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
        //const result = {};
        //Object.keys(item).forEach(key => {
        //    if (key in item) {
        //        result[key] = item[key];
        //    }
        //});
        item = ObjectPopulateKey(item);


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
        item.width = isNullOrEmpty(item.formWidth) ? _defaultFormFieldWidth : (!(item.formWidth?.includes("%")) ? parseInt(item.formWidth) : item.formWidth);
        item.height = isNullOrEmpty(item.formHeight) ? _defaultFormFieldHeight : (!(item.formHeight?.includes("%")) ? parseInt(item.formHeight) : item.formHeight);
        if (!(typeof item.editorOptions === "object") && !(item.editorOptions == null)) {

            const decodedBytes = Uint8Array.from(atob(item.editorOptions), c => c.charCodeAt(0));
            const decodedString = new TextDecoder("utf-8").decode(decodedBytes);
            try {
                const jsonObject = JSON.parse(decodedString);
                Object.keys(jsonObject).forEach(key => {
                    const value = jsonObject[key];
                    if (key.startsWith("on")) {
                        var scriptFunctionHandle = jsonObject[key].replace("##id", formInstanceProps.id).replace("##datafield", item.dataField);
                        jsonObject[key] = Function("e", scriptFunctionHandle);
                    }
                    else {
                        if (jsonObject[key] in variableMapping) {
                            jsonObject[key] = variableMapping[jsonObject[key]];
                        }
                    }
                });

                item.editorOptionsConfig = jsonObject;
            }
            catch (exception) {
                console.log(exception);
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
        if (formInstanceProps.formOptions?.fieldTemplate) {
            if (item.dataField == formInstanceProps.formOptions?.fieldTemplate.fieldName) {
                item.template = formInstanceProps.formOptions?.fieldTemplate.template
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
        var customEditorOptions = false;
        var customFormItem = false;
        if (item.editorOptionsConfig) {
            additionalEditorOptions = item.editorOptionsConfig;
            customEditorOptions = true;
        }
        item.formItem = item.formItemConfig;
        var itemOptions = {};


        if (item.editorType == "dxTextArea") {
            itemOptions = ObjectPopulateKey(item);
            //itemOptions = {
            //    validationRules: item.validationRules,
            //    dataField: item.dataField,
            //    editorType: item.editorType,
            //    customEditorOptions: customEditorOptions,
            //    editorOptions: {
            //        //minHeight: item.height >= _defaultTextAreaHeight ? parseInt(item.height) : _defaultTextAreaHeight,
            //        tabIndex: tabIndexNumber,
            //        onFocusIn: function (e) { //not required
            //            //e.component.option("autoResizeEnabled", true);
            //            //e.component.option("maxHeight", 150);
            //        },
            //        onFocusOut: function (e) { //not reuuired
            //            //e.component.option("autoResizeEnable
            //            //e.component.option("autoResizeEnabled", false);
            //        },
            //        //height: item.height >= _defaultTextAreaHeight ? parseInt(item.height) : _defaultTextAreaHeight,
            //        height: (item.height != null || item.height != '' || item.height != undefined) ? ((item.height !== '' && !isNaN(parseFloat(item.height)) && isFinite(item.height)) ? parseInt(item.height) : item.height.replace("%", "") / 100 * 47) : _defaultTextAreaHeight,
            //        //width: item.width >= _defaultTextAreaWidth ? parseInt(item.width) : _defaultTextAreaWidth,
            //        width: (item.width != null || item.width != '' || item.width != undefined) ? ((item.width !== '' && !isNaN(parseFloat(item.width)) && isFinite(item.width)) ? parseInt(item.width) : item.width) : _defaultTextAreaWidth,
            //        value: item.defaultValue ?? "",
            //        ...additionalEditorOptions
            //    },
            //    label: { location: formInstanceProps.labelLocation, text: item.caption, visible: true },
            //    formGroupName: item.formGroupName,
            //    formItem: item.formItem,
            //    outlineObject: item.outlineObject,
            //    visible: item.visible
            //};
            itemOptions.customEditorOptions = customEditorOptions;
            itemOptions.editorOptions = {
                tabIndex: tabIndexNumber,
                onFocusIn: function (e) { //not required
                },
                onFocusOut: function (e) { //not required
                },
                height: (item.height != null || item.height != '' || item.height != undefined) ? ((item.height !== '' && !isNaN(parseFloat(item.height)) && isFinite(item.height)) ? parseInt(item.height) : item.height.replace("%", "") / 100 * 47) : _defaultTextAreaHeight,
                width: (item.width != null || item.width != '' || item.width != undefined) ? ((item.width !== '' && !isNaN(parseFloat(item.width)) && isFinite(item.width)) ? parseInt(item.width) : item.width) : _defaultTextAreaWidth,
                value: item.defaultValue ?? "",
                ...additionalEditorOptions
            };
            itemOptions.label = {
                location: formInstanceProps.labelLocation, text: item.caption, visible: true, template: function (text) { }
            };

            if ((itemOptions.editorOptions.height !== '' && !isNaN(parseFloat(itemOptions.editorOptions.height)) && isFinite(itemOptions.editorOptions.height)))
                itemOptions.editorOptions.minHeight = item.height >= _defaultTextAreaHeight ? parseInt(item.height) : _defaultTextAreaHeight;
        }
        else if (item.editorType == "dxSelectBox") {
            itemOptions = selectBoxRemakeOption(item, formInstanceProps, tabIndexNumber, additionalEditorOptions);
        }
        else if (item.editorType == "dxList") {
            itemOptions = {
                formGroupName: item.formGroupName,
                dataField: item.dataField,
                editorType: "dxTextBox",
                customEditorOptions: customEditorOptions,
                editorOptions: {
                    tabIndex: tabIndexNumber,
                    width: item.width,
                    heigth: item.height,
                    showClearButton: true,
                    value: item.defaultValue ?? "",
                    ...additionalEditorOptions
                },
                label: { location: formInstanceProps.labelLocation, text: item.caption, visible: true, template: function (text) { } },
                formItem: item.formItem,
                validationRules: item.validationRules,
                outlineObject: item.outlineObject,
                visible: item.visible
            };
        }
        else if (item.editorType == "dxMultiDataGrid") {
            var model = "Users";
            var mDropDownDS = new MDropDownDataSource();
            dataSource = mDropDownDS.getDropDownDS('Id', `api/${model}/DropDownLookUp`);
            itemOptions = {
                validationRules: item.validationRules,
                formGroupName: item.formGroupName,
                dataField: item.dataField,
                editorType: "dxDropDownBox",
                label: { location: formInstanceProps.labelLocation, text: item.caption, visible: true },
                formItem: item.formItem,
                customEditorOptions: customEditorOptions,
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
            };
        }
        else if (item.editorType == "dxDropDownBox") {
            var configData = makeFieldFeatures(item, null, "form");
            itemOptions = {
                validationRules: item.validationRules,
                formGroupName: item.formGroupName,
                dataField: item.dataField,
                editorType: "dxDropDownBox",
                label: { location: formInstanceProps.labelLocation, text: item.caption, visible: true, template: function (text) { } },
                formItem: item.formItem,
                customEditorOptions: customEditorOptions,
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
            };
        }
        else if (item.editorType == "dxDataGrid") {
        }
        else if (item.editorType == "dxDateBox") {
            itemOptions = {
                formGroupName: item.formGroupName,
                dataField: item.dataField,
                editorType: item.editorType,
                customEditorOptions: customEditorOptions,
                editorOptions: {
                    tabIndex: tabIndexNumber,
                    width: item.width,
                    heigth: item.height,
                    showClearButton: true,
                    value: item.defaultValue ?? "",
                    //onValueChanged: function (e) {
                    //    let localDate = e.value; // This is in the user's local time
                    //    if (localDate instanceof Date) {
                    //        localDate.setHours(localDate.getHours() + 7); // Add 7 hours for GMT+7
                    //    }
                    //    //stringToUtcDate(e.value);
                    //},
                    displayFormat: dateFormatter,
                    dateSerializationFormat: "yyyy-MM-ddTHH:mm:ss",
                    acceptCustomValue: false, // according to typing date
                    //onFocusIn: function (e) {
                    //    e.component.option("opened", true);
                    //},
                    ...additionalEditorOptions
                },
                label: { location: formInstanceProps.labelLocation, text: item.caption, visible: true, template: function (text) { } },
                formItem: item.formItem,
                validationRules: item.validationRules,
                outlineObject: item.outlineObject,
                visible: item.visible

            };
        }
        else {
            itemOptions = {
                formGroupName: item.formGroupName,
                dataField: item.dataField,
                editorType: item.editorType,
                customEditorOptions: customEditorOptions,
                editorOptions: {
                    tabIndex: tabIndexNumber,
                    width: item.width,
                    heigth: item.height,
                    showClearButton: true,
                    value: item.defaultValue ?? "",
                    ...additionalEditorOptions
                },
                label: { location: formInstanceProps.labelLocation, text: item.caption, visible: true, template: function (text) {  } },
                formItem: item.formItem,
                validationRules: item.validationRules,
                visible: item.visible,
                outlineObject: item.outlineObject,
                visible: item.visible,

            };
        }
        itemOptions.template = item.template;
        itemsArray.push(itemOptions);
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

    //if (formInstanceProps.isAllowAddOutline || formInstanceProps.isAllowAddOutline == null || formInstanceProps.isAllowAddOutline == undefined) {
    //    var outlineTitle = "ADD OUTLINE";
    //    if (formInstanceProps.formOptions)
    //        if (formInstanceProps.formOptions.addOutlineTitle) outlineTitle = formInstanceProps.formOptions.addOutlineTitle;
    //    var id = 0;
    //    var surveyId = 0;
    //    var jsonConfig = {};
    //    var dataForm = null;
    //    var addOutLine = {
    //        itemType: "button",
    //        alignment: "left",
    //        name: "addOutline",
    //        //dataField: "__addOutline__",
    //        //editorType: "dxButton",
    //        buttonOptions: {
    //            height: _defaultButtonHeight,
    //            width: "100%",
    //            text: outlineTitle,
    //            onClick: function (e) {
    //                var popupInstance = $(`#outlinePopup`).dxPopup({
    //                    width: "70%",
    //                    height: "70%",
    //                    showTitle: true,
    //                    title: outlineTitle,
    //                    dragEnabled: false,
    //                    closeOnOutsideClick: true,
    //                    contentTemplate: function (container) {
    //                        var content = $("<div>").appendTo(container);
    //                        if (formInstanceProps?.outlineForm?.surveyTypeId)
    //                            jsonConfig.surveyTypeId = formInstanceProps?.outlineForm?.surveyTypeId;
    //                        if (formInstanceProps?.id)
    //                            jsonConfig.mainId = formInstanceProps?.id;
    //                        if (formInstanceProps?.refFieldId) {
    //                            surveyId = formInstanceProps?.refFieldId;
    //                            jsonConfig.surveyId = formInstanceProps?.refFieldId;
    //                        }
    //                        if (formInstanceProps?.Outline.length > 0) {
    //                            //jsonConfig.parentOutlineId = formInstanceProps?.Outline.find(f => formInstanceProps?.ModelName.toUpperCase() == f.content.replace(' ', '') && f.surveyTypeId == formInstanceProps?.outlineForm?.surveyTypeId).id;
    //                        }
    //                        if (_cacheOutlines.length > 0)
    //                            jsonConfig.parentOutlineId = _cacheOutlines.find(f => formInstanceProps?.ModelName.toLowerCase() == f.placeHolder.toLowerCase() && f.surveyTypeId == formInstanceProps?.outlineForm?.surveyTypeId).id;
    //                        var passingParams = { UITabId: `Outline_Form_${surveyId}_${id}`, refPageNum: surveyId, pageNum: id, jsonConfig: JSON.stringify(jsonConfig) };

    //                        appendElementViewInsideAsync(`/Business/MasterData/Outline_Form`, passingParams, content, `Outline_Form_${surveyId}_${id}`, "appendTo").then(data => {
    //                            dataForm = data;

    //                        })
    //                            .catch(error => {
    //                                try {
    //                                    sendClientErrorLog("Lỗi khi tải dữ liệu:", error);
    //                                }
    //                                catch {
    //                                }
    //                                console.error("Lỗi khi tải dữ liệu:", error);
    //                            });


    //                        //$("<div>").dxScrollView({
    //                        //    height: "100%",
    //                        //    width: "100%",
    //                        //    showScrollbar: "always",
    //                        //    useNative: false,
    //                        //    direction: "both",
    //                        //    contentTemplate: function (scrollViewContent) {
    //                        //        return scrollViewContent;
    //                        //    }
    //                        //}).appendTo(container);


    //                        return container;
    //                    },
    //                    onHiding: function (e) {

    //                    }
    //                    , toolbarItems: [{
    //                        widget: 'dxButton',
    //                        toolbar: 'bottom',
    //                        location: 'after',
    //                        options: {
    //                            stylingMode: 'contained',
    //                            type: 'normal',
    //                            text: "Create",
    //                            onClick() {
    //                                //var outlineForm = $(`#Outline_Form_${surveyId}_${id}`).dxForm().dxForm("instance");
    //                                var passingParams = {};
    //                                passingParams.Survey = {};
    //                                passingParams.Outline = {};
    //                                passingParams.MasterId = jsonConfig.mainId;


    //                                var formData = dataForm.option('formData');
    //                                //requestPassingData.Management = formData;

    //                                if (formData != null)
    //                                    passingParams.Outline = formData;
    //                                if (surveyId != 0)
    //                                    passingParams.Survey.Id = surveyId;

    //                                if (!formData.hasOwnProperty('content') || !formData.content || formData.content.trim() === "") {
    //                                    appNotifyWarning("Outline content cannot be empty!");
    //                                }
    //                                else {
    //                                    $.ajax({
    //                                        url: 'api/Survey/AddCustomOutline',
    //                                        headers: { 'Content-Type': 'application/json' },
    //                                        type: 'POST',
    //                                        data: JSON.stringify(passingParams)
    //                                        , success: function (response) {
    //                                            appNotifySuccess("Outline created success! Please refresh your survey. ");
    //                                        },
    //                                        error: function (err) {
    //                                            appNotifyError("Outline created fail!");
    //                                        }
    //                                    });
    //                                }
    //                                popupInstance.hide();
    //                            },
    //                        },
    //                    }, {
    //                        widget: 'dxButton',
    //                        toolbar: 'bottom',
    //                        location: 'after',
    //                        options: {
    //                            stylingMode: 'contained',
    //                            type: 'normal',
    //                            text: "Close",
    //                            onClick() {
    //                                popupInstance.hide();
    //                            },
    //                        },
    //                    }]
    //                }).dxPopup("instance");
    //                popupInstance.show();
    //            }
    //        },
    //        editorOptions: {
    //            height: _defaultButtonHeight,
    //            width: "100%"
    //        },
    //    };
    //    if (!formInstanceProps.isReadOnly)
    //        itemsArray.push(addOutLine);
    //}


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
                            //if (!item.customEditorOptions)
                            //editorOptions.onValueChanged = function (e) {
                            //    data.component.updateData(item.dataField, e.value);
                            //};

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
                        //if (!item.customEditorOptions)
                        //item.editorOptions.onValueChanged = function (e) {
                        //    data.component.updateData(item.dataField, e.value);
                        //};
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

function getDxKind(obj) {
    if (!obj) return "null";

    if (obj instanceof DevExpress.data.DataSource) {
        const store = obj.store?.();
        return `DataSource`;
    }
    if (obj instanceof DevExpress.data.CustomStore) {
        const store = obj.store?.();
        return `CustomStore`;
    }

    if (Array.isArray(obj)) return "Array";

    const name = obj?.constructor?.name || "Unknown";

    if (name === "CustomStore") return "CustomStore";
    if (name === "ArrayStore") return "ArrayStore";
    if (name === "LocalStore") return "LocalStore";
    if (name === "ODataStore") return "ODataStore";

    return name;
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
        obj.customQuery = config.sysTableConfig.customQuery;
        dataSource = makeBasicDataSource(obj, false, true);
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

                        //createDeleteOutline({
                        //    title: itemData.title
                        //}, deleteOutlineContainer, outlineObject, formInstanceProps, itemData);

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
                                //createDeleteOutline({
                                //    title: itemData.title
                                //}, deleteOutlineContainer, outlineObject, formInstanceProps, itemData);
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



//function createDeleteOutline(titleData, deleteContainer, outlineObject, formInstanceProps, itemData) {
//    if (outlineObject.outlineOptions) {
//        if (outlineObject.outlineOptions) {
//            selectedValue = outlineObject.outlineOptions.OptionValue;
//        }

//    }
//    else {
//        if (formInstanceProps.outlineForm) {
//            if (formInstanceProps.outlineForm.outlineOptions)
//                if (formInstanceProps.outlineForm.outlineOptions.length > 0) {
//                    selectedValue = formInstanceProps.outlineForm.outlineOptions.find(f => f.outlineId == outlineObject.id).optionValue;
//                }
//        }
//    }
//    //const groupName = `group_${titleData.title}_${outlineObject.id}_${formInstanceProps.id}`;


//    $(`<div id='renameOutline_${outlineObject.id}_${formInstanceProps.id}'>`).dxButton({
//        icon: "edit", // icon bút chì - biểu tượng rename
//        elementAttr: {
//            title: "Rename" // Tooltip khi hover
//        },
//        height: 30,
//        width: 40,
//        disabled: formInstanceProps.isReadOnly,
//        onContentReady: function (e) {
//            $(e.element).find(".dx-button-content").removeClass("dx-button-content").css({
//                marginTop: "5px",
//            });
//        },
//        onClick: function (e) {
//            var id = 0;
//            var surveyId = 0;
//            var jsonConfig = {};
//            var dataForm = null;
//            var popupInstance = $(`#outlinePopup`).dxPopup({
//                width: "70%",
//                height: "70%",
//                showTitle: true,
//                title: "RENAME OUTLINE",
//                dragEnabled: false,
//                closeOnOutsideClick: true,
//                contentTemplate: function (container) {
//                    var content = $("<div>").appendTo(container);
//                    if (formInstanceProps?.outlineForm?.surveyTypeId)
//                        jsonConfig.surveyTypeId = formInstanceProps?.outlineForm?.surveyTypeId;
//                    if (formInstanceProps?.id)
//                        jsonConfig.mainId = formInstanceProps?.id;
//                    if (formInstanceProps?.refFieldId) {
//                        surveyId = formInstanceProps?.refFieldId;
//                        jsonConfig.surveyId = formInstanceProps?.refFieldId;
//                    }
//                    if (formInstanceProps?.Outline.length > 0) {
//                        //jsonConfig.parentOutlineId = formInstanceProps?.Outline.find(f => formInstanceProps?.ModelName.toUpperCase() == f.content.replace(' ', '') && f.surveyTypeId == formInstanceProps?.outlineForm?.surveyTypeId).id;
//                    }
//                    if (_cacheOutlines.length > 0)
//                        jsonConfig.parentOutlineId = _cacheOutlines.find(f => formInstanceProps?.ModelName.toUpperCase() == f.content.replace(' ', '') && f.surveyTypeId == formInstanceProps?.outlineForm?.surveyTypeId).id;
//                    var passingParams = { UITabId: `Outline_Form_${surveyId}_${id}`, refPageNum: surveyId, pageNum: id, jsonConfig: JSON.stringify(jsonConfig) };

//                    appendElementViewInsideAsync(`/Business/MasterData/Outline_Form`, passingParams, content, `Outline_Form_${surveyId}_${id}`, "appendTo").then(data => {
//                        dataForm = data;

//                    })
//                        .catch(error => {
//                            try {
//                                sendClientErrorLog("Lỗi khi tải dữ liệu:", error);
//                            }
//                            catch {
//                            }
//                            console.error("Lỗi khi tải dữ liệu:", error);
//                        });


//                    //$("<div>").dxScrollView({
//                    //    height: "100%",
//                    //    width: "100%",
//                    //    showScrollbar: "always",
//                    //    useNative: false,
//                    //    direction: "both",
//                    //    contentTemplate: function (scrollViewContent) {
//                    //        return scrollViewContent;
//                    //    }
//                    //}).appendTo(container);


//                    return container;
//                },
//                onHiding: function (e) {

//                }
//                , toolbarItems: [{
//                    widget: 'dxButton',
//                    toolbar: 'bottom',
//                    location: 'after',
//                    options: {
//                        stylingMode: 'contained',
//                        type: 'normal',
//                        text: "Change",
//                        onClick() {
//                            //var outlineForm = $(`#Outline_Form_${surveyId}_${id}`).dxForm().dxForm("instance");
//                            var passingParams = {};
//                            passingParams.Survey = {};
//                            passingParams.Outline = {};
//                            passingParams.MasterId = jsonConfig.mainId;

//                            var formData = dataForm.option('formData');
//                            //requestPassingData.Management = formData;

//                            if (formData != null) {
//                                passingParams.Outline = formData;
//                                if (outlineObject) {
//                                    passingParams.Outline.placeHolder = outlineObject.placeHolder;
//                                    passingParams.Outline.id = outlineObject.id;
//                                }
//                            }
//                            if (surveyId != 0)
//                                passingParams.Survey.Id = surveyId;

//                            $.ajax({
//                                url: 'api/Survey/RenameCustomOutline',
//                                headers: { 'Content-Type': 'application/json' },
//                                type: 'POST',
//                                data: JSON.stringify(passingParams)
//                                , success: function (response) {
//                                    appNotifySuccess("Outline renamed success! Please refresh your survey. ");
//                                },
//                                error: function (err) {
//                                    appNotifyError("Outline renamed fail!");
//                                }
//                            });
//                            popupInstance.hide();
//                        },
//                    },
//                }, {
//                    widget: 'dxButton',
//                    toolbar: 'bottom',
//                    location: 'after',
//                    options: {
//                        stylingMode: 'contained',
//                        type: 'normal',
//                        text: "Close",
//                        onClick() {
//                            popupInstance.hide();
//                        },
//                    },
//                }]
//            }).dxPopup("instance");
//            popupInstance.show();


//        }
//    }).appendTo(deleteContainer);


//    $(`<div id='deleteOutline_${outlineObject.id}_${formInstanceProps.id}'>`).dxButton({
//        icon: "close", // icon mặc định của DevExtreme (biểu tượng X)
//        elementAttr: {
//            title: "Remove" // Tooltip khi hover vào
//        },
//        height: 30,
//        width: 40,
//        disabled: formInstanceProps.isReadOnly,
//        onContentReady: function (e) {
//            $(e.element).find(".dx-button-content").removeClass("dx-button-content").css({
//                marginTop: "5px",
//            });
//        },
//        onClick: function (e) {
//            var popupBox = appNotifyWarning("Are you sure to remove this outline?", true);
//            e.event.stopPropagation();
//            popupBox.then((result) => {
//                if (result.isConfirmed) {
//                    $.ajax({
//                        url: `api/${formInstanceProps.ModelName}/DeleteOutline/${formInstanceProps.id}/${outlineObject.id}`,
//                        type: 'GET',
//                        async: false,
//                        success: function (response) {
//                            appNotifySuccess("Outline removed! Please refresh your survey");
//                        },
//                        error: function () {
//                        }
//                    });
//                }
//                else {
//                }
//            });


//        }
//    }).appendTo(deleteContainer);

//    //const inputControl = $("<input>")
//    //    .attr({
//    //        type: "radio",
//    //        id: id,
//    //        name: groupName,
//    //        checked: option.value == selectedValue ? true : false
//    //    })
//    //    //.addClass("custom-radio-button")   
//    //    .ready(function () {
//    //        var outlineOptionsObject = { outlineId: outlineObject.id, optionValue: 1 };
//    //        if (formInstanceProps.OutlineList == null || formInstanceProps.OutlineList == undefined)
//    //            formInstanceProps.OutlineList = [];
//    //        formInstanceProps.OutlineList.push(outlineOptionsObject);
//    //    })
//    //    .on("change", function () {
//    //        var outlineOptionsObject = { outlineId: outlineObject.id, optionValue: option.value };
//    //        var formData = formInstanceProps.formInstance.option("formData");
//    //        var formField = `outlineOptions_${itemData.outline.id}`;
//    //        if (formData[formField] == null || formData[formField] == undefined) {
//    //            formData[formField] = new Object();
//    //        }
//    //        formData[formField] = outlineOptionsObject;
//    //        if (formInstanceProps.id) {
//    //            var formObject = new Object();
//    //            formObject[formField] = formData[formField];
//    //            formInstanceProps.formInstance.option("changedFields", formObject);
//    //        }
//    //        var editor = $(`#dxHtmlEditor_${itemData.fieldInstance.dataField}_${itemData.fieldInstance.id}`).dxHtmlEditor().dxHtmlEditor("instance");
//    //        if (editor != null) {
//    //            if (option.value == -1) {
//    //                editor.option("readOnly", true);
//    //                editor.option("value", "");
//    //            } else if (option.value == 0) {
//    //                editor.option("readOnly", false);
//    //                editor.option("value", "Nil");
//    //            }
//    //            else {
//    //                if (formInstanceProps.isReadOnly)
//    //                    editor.option("readOnly", true);
//    //                else
//    //                    editor.option("readOnly", false);
//    //            }
//    //        }
//    //        else {
//    //            itemData.fieldInstance.isFieldReadOnly = false;
//    //            if (option.value == 0 || option.value == -1) {
//    //                itemData.fieldInstance.isFieldReadOnly = true;
//    //            }
//    //            else {
//    //                if (formInstanceProps.isReadOnly)
//    //                    itemData.fieldInstance.isFieldReadOnly = true;
//    //                else
//    //                    itemData.fieldInstance.isFieldReadOnly = false;
//    //            }
//    //        }
//    //    })
//    //    .appendTo(deleteContainer);
//    return deleteContainer;
//}


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
    var isSameUsing = false;
    var loadUrl = `api/${gridInstance.ModelName}/EnumLookup?refField=${item.formItemConfig.enum}&enumName=${item.formItemConfig.enum}`;
    if (item.formItemConfig.isSameUsing)
        loadUrl = `api/${gridInstance.ModelName}/EnumLookup?refField=${item.formItemConfig.enum}&enumName=${item.formItemConfig.enum}&isSameUsing=${item.formItemConfig.isSameUsing}`;
    const dataSourceLookup = DevExpress.data.AspNet.createStore({
        key: 'id',
        //loadUrl: `api/${gridInstance.ModelName}/EnumLookup?refField=${item.formItemConfig.enum}&enumName=${item.formItemConfig.enum}`,
        loadUrl: loadUrl,
        insertUrl: `api/${gridInstance.ModelName}/UpdateEnum`,
        paginate: true
    });

    $.ajax({
        //url: `api/${gridInstance.ModelName}/EnumLookup?refField=${item.formItemConfig.enum}&enumName=${item.formItemConfig.enum}`,
        url: loadUrl,
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
    item.editorOptions = makeSelectBoxEditorOptions(dataSource,true, gridInstance, dataSourceLookup);
    
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
        //.toLowerCase() // Chuyển toàn bộ chuỗi về chữ thường
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
    var dataTargetFilter = groupRows.find(f => f.rowIndex === (targetIndex));
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
function LCparticipantListColumnsProcess(columns, gridInstance, that) {

    $.each(columns, function (i, col) {
        //if (col.dataField === "sideName") {
        if (col.dataField === "sideOrder") {
            //customDataSourceRecalculate(gridInstance);
            LCparticipantListColRemake(col, gridInstance, that);
        }
    });
}
function LCparticipantListColRemake(col, gridInstance, that) {
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
                            lossControlId: that.filterRefId,
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

function customCommandButtonCell(e) {
    $(`<a class="dx-link dx-link-edit">`)
       //.addClass("fa fa-arrow-up")
        .text("Edit JSON")
        .css({ marginRight: "5px", cursor: "pointer", color: "#337ab7" })
        .on("click", function () {
            callElementView(`/Business/Workflow/WorkflowDefinition_Form/${e.key}`, `WorkflowDenifition_Form_${e.key}`, `WorkflowDenifition ${e.data.workflowCode}`);
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

function sendClientErrorLog(message, err, additionalDetails = {}) {

    if (window.ErrorFailLogCount <= _errorFailLogCountMax && err?.status != 200) {
        const errorLog = new Object();
        errorLog.Message = typeof message === 'string' ? message : JSON.stringify(message),
            errorLog.Url = window.location.href,
            errorLog.UserAgent = navigator.userAgent,
        errorLog.Time = new Date().toISOString();
            errorLog.ErrorBrowserDetails = new Object();
        if (err) {
            errorLog.ErrorBrowserDetails.Status = err?.status || null;
            errorLog.ErrorBrowserDetails.ResponseText = err?.responseText || null;
            errorLog.ErrorBrowserDetails.Stack = err?.stack || null;
            errorLog.ErrorBrowserDetails.FileName = additionalDetails.fileName || err?.fileName || null;
            errorLog.ErrorBrowserDetails.LineNumber = additionalDetails.lineNumber || err?.lineNumber || null;
            errorLog.ErrorBrowserDetails.ColumnNumber = additionalDetails.columnNumber || err?.columnNumber || null;
            errorLog.ErrorBrowserDetails.FunctionName = additionalDetails.functionName || null;
            errorLog.ErrorBrowserDetails.ErrorType = additionalDetails.errorType || 'http_error';
            errorLog.ErrorBrowserDetails.Context = JSON.stringify(additionalDetails.context) || JSON.stringify(getPageContext());
            errorLog.ErrorBrowserDetails.BreadcrumbTrails = additionalDetails?.breadcrumbTrail ?? [];// || getBreadcrumbTrail();
        }
        else {

            errorLog.ErrorBrowserDetails.ErrorType = additionalDetails.errorType || 'unknown';
            errorLog.ErrorBrowserDetails.FileName = additionalDetails.fileName || null;
            errorLog.ErrorBrowserDetails.LineNumber = additionalDetails.lineNumber || null;
            errorLog.ErrorBrowserDetails.ColumnNumber = additionalDetails.columnNumber || null;
            errorLog.ErrorBrowserDetails.FunctionName = additionalDetails.functionName || null;
            errorLog.ErrorBrowserDetails.Context = JSON.stringify(additionalDetails.context) || JSON.stringify(getPageContext());
            errorLog.ErrorBrowserDetails.BreadcrumbTrails = additionalDetails?.breadcrumbTrail ?? [];// || getBreadcrumbTrail();
        }

       
        ajaxPost('/api/ClientBrowserError/LogClientError', errorLog, {
            onSuccess: function (response) {
            },
            onError: function (err) {
                    window.ErrorFailLogCount++;
            }
        });
    }
    //$.ajax({
    //    url: '/api/ClientBrowserError/LogClientError',
    //    type: 'POST',
    //    contentType: 'application/json',
    //    data: JSON.stringify({ model: JSON.stringify( errorLog )}),
    //    success: function () {
    //        console.log("Error logged to server");
    //    },
    //    error: function () {
    //        console.warn("Failed to log error to server");
    //    }
    //});
}

// Helper functions for error context
function getPageContext() {
    try {
        return {
            title: document.title,
            url: window.location.href,
            referrer: document.referrer,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
        };
    } catch (e) {
        return { error: 'Failed to get page context: ' + e.message };
    }
}

function getBreadcrumbTrail() {
    try {
        // Simple breadcrumb based on recent clicks (you can enhance this)
        const trail = JSON.parse(localStorage.getItem('errorBreadcrumb') || '[]');
        return trail.slice(-10); // Last 10 actions
    } catch (e) {
        return [];
    }
}

function addBreadcrumb(action) {
    try {
        const trail = JSON.parse(localStorage.getItem('errorBreadcrumb') || '[]');
        trail.push({
            action: action,
            timestamp: new Date().toISOString(),
            url: window.location.href
        });
        if (trail.length > 20) trail.shift(); // Keep only last 20
        localStorage.setItem('errorBreadcrumb', JSON.stringify(trail));
    } catch (e) {
        // Ignore
    }
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
//function stringToUtcDate(stringDate) {
//    const date = new Date(stringDate);
//    var resultDate = date;
//    if (stringDate)
//        if (stringDate.slice(-1) === "Z") {
//            // getTimezoneOffset() returns minutes, so multiply by 60000 for milliseconds
//            const offsetMinutes = date.getTimezoneOffset();
//            const utcDate = new Date(date.getTime() + (-1 * offsetMinutes * 60 * 1000));
//            resultDate = new Date(utcDate.getTime() + (7 * 60 * 60 * 1000));
//        }
//    //return date; // Return the original date if it's not UTC
//    return resultDate;
//}

const tabClickEvent = function (e, eTabName, eTab, callback) {
    var eTabNameR = eTabName;
    var eTabR = eTab;
    if (e != null) {
        eTabR = e.itemIndex;
        eTabNameR = e.itemData.entity;
        if (callback != null || callback != undefined)
            callback(e.itemData.entity);
    }
    else {
        if (callback != null || callback != undefined)
            callback(eTabName);
    }
    return { eTabNameR, eTabR };
}
function formatNumber(num) {
    return num < 10 ? '0' + num : num.toString();
}
//function formatDate(timeStampString, format) {
//    var d = new Date(timeStampString),
//        month = '' + (d.getMonth() + 1),
//        day = '' + d.getDate(),
//        year = d.getFullYear();

//    if (month.length < 2)
//        month = '0' + month;
//    if (day.length < 2)
//        day = '0' + day;

//    return [day, month, year].join('-');
//}
function tabValidationCheck(checkFields, tabs, id, connectionId, entityName) {
    if (id && _cacheDataGridConfigs) {
        $.each(tabs, function (tabIndex, tabItem) {
            var timeoutCount = 200;
            if (tabItem.validateCheck) {
                checkFields = _cacheDataGridConfigs.filter(f => f.sysTableFK?.name == tabItem.entity).map(m => m.dataField)
                if (checkFields.length > 0) {

                    $.ajax({
                        url: `/api/${entityName}/Render${entityName}TabNotCompleted/${surveyData.id}/${tabItem.entity}/${connectionId}`,
                        headers: { 'Content-Type': 'application/json' },
                        type: 'POST',
                        data: JSON.stringify(checkFields),
                        success: function (response) {
                        },
                        error: function (err) {
                        }
                    });
                }
            }
        });
    }
}

function fieldPictureFeature($fieldContainer, itemElement, object, info, folder) {
    var fixFrameSize = "width:400px;height:300px";
    var imgSizeObject = { width: '100%', height: '200px', objectFit: 'cover', borderRadius: '5px' };
    var imgContainerSizeObject = { position: 'relative', width: '100%', height: '100%', margin: '5px' };
    const $container = $(`<div style="display:flex; width:800px">`)
        .appendTo($fieldContainer);

    const innerPreviewContent = $(`<div>
    
    <img loading="lazy" style="padding-bottom:50px" src="https://cdn.prod.website-files.com/65faa2691a34b9fe3f9dd039/65faa9182c784424ecf41a18_Cloud%20Upload.svg" alt="" class="icon-1x1-medium align-center">
     </div>
    <div> <label for="filepond--browser-gowe03lre" id="filepond--drop-label-gowe03lre">Drag &amp; Drop your files or <span class="filepond--label-action" tabindex="0">Browse</span></label> 

    </div>

    `)
    const previewId1NoHash = `imagePreview_${object.id}_first`;
    const previewId2NoHash = `imagePreview_${object.id}_second`;
    const previewId1 = `#${previewId1NoHash}`;
    const previewId2 = `#${previewId2NoHash}`;
    const $frameImage1 = $(`<div id='image${folder}Preview_${object.id}_first' class="imageLCPreview" width='50%'>`)
        .appendTo($container);
    const $frameImage2 = $(`<div id='image${folder}Preview_${object.id}_second' class="imageLCPreview"  width='50%'>`)
        .appendTo($container);
    const $imagePreview1 = $(`<div id='${previewId1NoHash}' class='dx-fileuploader' style='display:block;${fixFrameSize}' >`)
        .appendTo($frameImage1);
    const $imagePreview2 = $(`<div id='${previewId2NoHash}' class='dx-fileuploader' style='display:block;${fixFrameSize}'>`)
        .appendTo($frameImage2);



    const firstText = $(`<div style="font-family: Asap; font-size: 35px; font-weight: bold;">1</div>`);
    const secondText = $(`<div style="font-family: Asap; font-size: 35px; font-weight: bold;">2</div>`);

    firstText.appendTo($frameImage1);
    secondText.appendTo($frameImage2);

    $.ajax({
        url: `/api/Attachment/GetLCPicAttachment/${object.guid}/${folder}`, // Replace with your actual API
        method: 'GET',
        success: async function (imageInstances) {

            $.each(imageInstances, function (imageIndex, imageInstance) {
                if (imageInstance != null || imageInstance != undefined) {
                    if (imageInstance.id != 0) {
                        var uint8Array = new Uint8Array(imageInstance.fileData);
                        var blob = new Blob([uint8Array], { type: imageInstance.type });
                        var url = URL.createObjectURL(blob);
                        imageInstance.guid = imageInstance.attachmentGuid;
                        imageInstance.id = imageInstance.attachmentId;
                        imageInstance.request = new Object();
                        imageInstance.request.response = JSON.stringify({ attachment: imageInstance });
                        imageInstance.url = url;
                        makeLCPreviewPictureObject(imageInstance, imgContainerSizeObject, imgSizeObject, $imagePreview1, $imagePreview2);

                        $(`${previewId1} .previewLoader`).remove();
                        $(`${previewId2} .previewLoader`).remove();
                    }
                }

            });

        }
    });
    var fileUploadId1 = `<div id="fileUpload_LCGoodPractices_${object.id}_1">`
    var fileUploadId2 = `<div id="fileUpload_LCGoodPractices_${object.id}_2">`

    var fileUploader1 = $(fileUploadId1).dxFileUploader({
        dropZone: $imagePreview1,
        name: "files",
        labelText: "",
        accept: "image/*",
        selectButtonText: `Choose Image 1`,
        uploadMode: "instantly",
        uploadUrl: `/api/${folder}/UpdateMultiplePicture`,
        uploadHeaders: {
            "Record-Guid": object.guid,
            "Folder": folder,
            "RowOrder": 1
        },
        multiple: false,
        showFileList: false,
        onDropZoneEnter: function (e) {
            //$(e.dropZoneElement).addClass("highlight-drop-zone");
        },
        onDropZoneLeave: function (e) {
            //$(e.dropZoneElement).removeClass("highlight-drop-zone");
        },
        onUploadStarted: function (e) {
            $(previewId1).css("position", "relative"); // đảm bảo relative
            $(`${previewId1} .previewLoader`).remove(); // nếu có rồi
            $("<div>").addClass("previewLoader").appendTo(previewId1)
                .dxLoadPanel({
                    message: "Image loading...",
                    visible: true,
                    shading: true,
                    shadingColor: "rgba(255,255,255,0.7)",
                    showPane: true,
                    closeOnOutsideClick: false,
                    position: { of: previewId1 }
                });
        },
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
                    e.url = url;
                    e.fileData = fr.result;
                    makeLCPreviewPictureObject(e, imgContainerSizeObject, imgSizeObject, $imagePreview1, $imagePreview2)
                    $(`${previewId1} .previewLoader`).remove();
                }

            }
        }
    }).appendTo($frameImage1);

    var fileUploader2 = $(fileUploadId2).dxFileUploader({
        dropZone: $imagePreview2,
        name: "files",
        labelText: "",
        multiple: false,
        accept: "image/*",
        selectButtonText: `Choose Image 2`,
        uploadMode: "instantly",
        uploadUrl: `/api/${folder}/UpdateMultiplePicture`,
        uploadHeaders: {
            "Record-Guid": object.guid,
            "Folder": folder,
            "RowOrder": 2
        },
        showFileList: false,
        onUploadStarted: function (e) {
            $(`${previewId2}`).css("position", "relative"); // đảm bảo relative
            $(`${previewId2} .previewLoader`).remove(); // nếu có rồi
            $("<div>").addClass("previewLoader").appendTo(previewId2)
                .dxLoadPanel({
                    message: "Image loading...",
                    visible: true,
                    shading: true,
                    shadingColor: "rgba(255,255,255,0.7)",
                    showPane: true,
                    closeOnOutsideClick: false,
                    position: { of: previewId2 }
                });
        },
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
                    e.url = url;
                    e.fileData = fr.result;
                    makeLCPreviewPictureObject(e, imgContainerSizeObject, imgSizeObject, $imagePreview1, $imagePreview2)
                    $(`${previewId2} .previewLoader`).remove();
                }

            }
        }
    }).appendTo($frameImage2);

    //}).css({
    //    display: "flex",
    //    marginRight: "10%",
    //}).appendTo(itemElement);

    $("<div>")
        .text("Supported formats: JPG, PNG, GIF")
        .css({
            fontSize: "12px",
            color: "gray",
            whiteSpace: "nowrap"
        })
        .appendTo(itemElement);
    $("<div>")
        .text("Minimum image size recommended: > 1MB, dimension: 1200 x 800")
        .css({
            fontSize: "12px",
            color: "red",
            whiteSpace: "nowrap"
        })
        .appendTo(itemElement);

    $container.appendTo(itemElement);
    return itemElement;
}

function ObjectPopulateKey(item, caseConvert = false, fromSource = false) {
    var cloneItems = {};
    Object.keys(item).forEach(key => {
        if (key in item) {
            if (!caseConvert)
                cloneItems[key] = item[key];
            else {
                if (!fromSource)
                    cloneItems[convertToTitleCase(key)] = item[key];
                else {
                    cloneItems[key] = item[convertToTitleCase(key)];
                }
            }
        }
    });
    return cloneItems;
}


function fieldMultiplePictureFeature($fieldContainer, itemElement, object, info, folder) {

    var fileUploadId = `<div id="fileUpload_LC${folder}_${object.id}">`
    var imgContainerSizeObject = { position: 'relative', width: '400px', height: '300px', margin: '5px' };
    var imgSizeObject = { width: '100%', height: '200px', objectFit: 'cover', borderRadius: '5px' };
    const $container = $(`<div style="display:flex; width:100%">`)
        .appendTo($fieldContainer);
    var idPreviewImageId = `imagePreview_${object.id}_${folder}`;
    const $frameImage = $(`<div id='${idPreviewImageId}' class="imagePreview" width='100%'>`)
        .appendTo($container);
    const previewId = `#imagePreview_${object.id}_${folder}`;
    $.ajax({
        url: `/api/Attachment/GetLCPicAttachment/${object.guid}/${folder}`, // Replace with your actual API
        method: 'GET',
        success: async function (data) {
            if (data.length > 0) {
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
                data.forEach(imageInstance => {
                    var uint8Array = new Uint8Array(imageInstance.fileData);
                    var blob = new Blob([uint8Array], { type: imageInstance.type });
                    var url = URL.createObjectURL(blob);
                    imageInstance.guid = imageInstance.attachmentGuid;
                    imageInstance.id = imageInstance.attachmentId;
                    imageInstance.request = new Object();
                    imageInstance.request.response = JSON.stringify({ attachment: imageInstance });
                    imageInstance.url = url;
                    makeLCPreviewPictureObject(imageInstance, imgContainerSizeObject, imgSizeObject, $frameImage, null, "33%");
                });

                $(`#${idPreviewImageId} .previewLoader`).remove();
            }
        }
    });


    var fileUploader = $(fileUploadId).dxFileUploader({
        dropZone: $frameImage,
        name: "files",
        labelText: "",
        accept: "image/*",
        selectButtonText: `Choose Image`,
        uploadMode: "instantly",
        uploadUrl: `/api/${folder}/UpdateMultiplePicture`,
        uploadHeaders: {
            "Record-Guid": info.guid,
            "Folder": folder
        },
        multiple: true,
        showFileList: false,
        onDropZoneEnter: function (e) {
            //$(e.dropZoneElement).addClass("highlight-drop-zone");
        },
        onDropZoneLeave: function (e) {
            //$(e.dropZoneElement).removeClass("highlight-drop-zone");
        },
        onUploadStarted: function (e) {
            $(`#imagePreview_${object.id}_${folder}`).css("position", "relative"); // đảm bảo relative
            $(`#imagePreview_${object.id}_${folder} .previewLoader`).remove(); // nếu có rồi
            $("<div>").addClass("previewLoader").appendTo(`#imagePreview_${object.id}_${folder}`)
                .dxLoadPanel({
                    message: "Image loading...",
                    visible: true,
                    shading: true,
                    shadingColor: "rgba(255,255,255,0.7)",
                    showPane: true,
                    closeOnOutsideClick: false,
                    position: { of: `#imagePreview_${object.id}_${folder}` }
                });
        },
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
                    e.url = url;
                    e.fileData = fr.result;
                    makeLCPreviewPictureObject(e, imgContainerSizeObject, imgSizeObject, $frameImage, null, "33%");

                    $(`#${idPreviewImageId} .previewLoader`).remove();
                }

            }
        }
    }).appendTo($frameImage);


    //}).css({
    //    display: "flex",
    //    marginRight: "10%",
    //}).appendTo(itemElement);

    $("<div>")
        .text("Supported formats: JPG, PNG, GIF")
        .css({
            fontSize: "12px",
            color: "gray",
            whiteSpace: "nowrap"
        })
        .appendTo(itemElement);
    $("<div>")
        .text("Minimum image size recommended: > 1MB, dimension: 1200 x 800")
        .css({
            fontSize: "12px",
            color: "red",
            whiteSpace: "nowrap"
        })
        .appendTo(itemElement);

    $container.appendTo(itemElement);
    return itemElement;
}
function makeLookupGrid(config) {
    const {
        container,
        dropdownControl = null,
        instanceProps = null,
        dataSource = [],
        columns = [],

        width = "100%",
        height = "100%",
        gridHeight = "85%",
        scrollHeight = "100%",
        scrollWidth = "100%",

        keyExpr = "id",
        selectionMode = "single",
        showSelectionControls = true,
        filterRowVisible = true,
        pagingEnabled = true,
        pageSize = 10,
        pagerVisible = true,
        columnAutoWidth = true,

        topPanelBuilder = null,
        onSelectionChanged = null,
        onValueChanged = null,
        onGridReady = null,
        gridOptions = {},

        closeDropdownOnValueChanged = true,
        closeDropdownOnSelect = true,
        defaultSelectionHandler = null
    } = config || {};

    const $host = container.empty();
    $host.css({
        width,
        height,
        overflow: "hidden"
    });

    const $scrollView = $("<div>").css({
        width: scrollWidth,
        height: scrollHeight
    });

    const $content = $("<div>").css({
        width: "100%",
        height: "100%"
    });

    const context = {
        container: $host,
        content: $content,
        dropdownControl,
        instanceProps,
        dataSource,
        columns,
        keyExpr,
        config
    };

    function internalDefaultSelectionHandler(e) {
        const hasSelection = e?.selectedRowKeys?.length > 0;
        if (!hasSelection) return;

        const selectedKey = e.selectedRowKeys[0];
        const selectedRow = e.selectedRowsData?.[0] || null;

        if (typeof defaultSelectionHandler === "function") {
            defaultSelectionHandler(e, {
                ...context,
                selectedKey,
                selectedRow
            });
        } else if (dropdownControl?.component) {
            dropdownControl.component.option("value", selectedKey);
            if (closeDropdownOnSelect) dropdownControl.component.close();
        }
    }

    function selectionHandlerWrapper(e) {
        if (typeof onSelectionChanged === "function") {
            const result = onSelectionChanged(e, {
                ...context,
                defaultHandler: internalDefaultSelectionHandler
            });
            if (result === false) return;
        }

        internalDefaultSelectionHandler(e);
    }

    let $topPanel = null;
    if (typeof topPanelBuilder === "function") {
        $topPanel = topPanelBuilder(context);
        if ($topPanel) $content.append($topPanel);
    }

    const $grid = $("<div>");
    $content.append($grid);

    $scrollView.append($content);
    $host.append($scrollView);

    $scrollView.dxScrollView({
        width: scrollWidth,
        height: scrollHeight,
        useNative: false
    });

    const scrollInstance = $scrollView.dxScrollView("instance");

    const baseGridOptions = {
        dataSource,
        keyExpr,
        columns,
        filterRow: { visible: filterRowVisible },
        selection: { mode: selectionMode },
        showSelectionControls,
        width: "100%",
        height: gridHeight,
        paging: { enabled: pagingEnabled, pageSize },
        pager: { visible: pagerVisible },
        onSelectionChanged: selectionHandlerWrapper,
        columnAutoWidth
    };

    $grid.dxDataGrid($.extend(true, {}, baseGridOptions, gridOptions));
    const gridInstance = $grid.dxDataGrid("instance");

    const result = {
        container: $host,
        content: $content,
        topPanel: $topPanel,
        scrollView: scrollInstance,
        scrollElement: $scrollView,
        component: $grid,
        grid: gridInstance,

        reload: function () {
            gridInstance.getDataSource().reload();
        },
        load: function () {
            gridInstance.getDataSource().load();
        },
        setFilter: function (filterExpr) {
            const ds = gridInstance.getDataSource();
            ds.filter(filterExpr);
            ds.load();
        },
        clearFilter: function () {
            const ds = gridInstance.getDataSource();
            ds.filter(null);
            ds.load();
        },
        setGridHeight: function (newHeight) {
            gridInstance.option("height", newHeight);
            gridInstance.updateDimensions();
            scrollInstance.update();
        },
        setContainerHeight: function (newHeight) {
            $host.css("height", newHeight);
            scrollInstance.update();
            gridInstance.updateDimensions();
        }
    };

    if (dropdownControl?.component) {
        dropdownControl.component.on("valueChanged", function (args) {
            if (typeof onValueChanged === "function") {
                onValueChanged(args, {
                    ...context,
                    grid: gridInstance,
                    result
                });
            }

            if (closeDropdownOnValueChanged && args.value != null) {
                dropdownControl.component.close();
            }
        });
    }

    if (typeof onGridReady === "function") {
        onGridReady({
            ...context,
            grid: gridInstance,
            result
        });
    }

    return result;
}

//Dropdown config
function makeTheWorkflowGrid(instanceItems, dropdownControl, instanceProps, container, onSelectionChanged = null, sizeOptions = {}) {
    return makeLookupGrid({
        container: container,
        dropdownControl: dropdownControl,
        instanceProps: instanceProps,
        dataSource: instanceItems.editorOptions.dataSource,
        keyExpr: "id",

        width: sizeOptions.width || "100%",
        height: sizeOptions.height || "100%",
        gridHeight: sizeOptions.gridHeight || "85%",
        scrollHeight: sizeOptions.scrollHeight || "100%",

        columns: [
            { dataField: "workflowCode", caption: "Workflow Code", width: 160 },
            { dataField: "workflowName", caption: "Workflow Name", minWidth: 220 },
            {
                caption: "Preview",
                width: 120,
                alignment: "center",
                allowFiltering: false,
                allowSorting: false,
                cellTemplate: function (cellElement, cellInfo) {
                    const row = cellInfo.data || {};
                    const previewId = "wfPreview_" + row.id;

                    const $badge = $("<div>")
                        .attr("id", previewId)
                        .text("Hover preview")
                        .css({
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "6px 10px",
                            borderRadius: "999px",
                            background: "#eff6ff",
                            color: "#1d4ed8",
                            border: "1px solid #bfdbfe",
                            cursor: "pointer",
                            fontSize: "12px",
                            fontWeight: 600
                        });

                    $(cellElement).append($badge);

                    const $popoverContent = $("<div>").css({
                        width: "440px",
                        height: "280px",
                        padding: "8px"
                    });

                    const $popover = $("<div>").appendTo(cellElement).dxPopover({
                        target: "#" + previewId,
                        showEvent: "mouseenter",
                        hideEvent: "mouseleave",
                        width: 460,
                        height: 320,
                        position: "right",
                        shading: false,
                        closeOnOutsideClick: false,
                        contentTemplate: function (contentEl) {
                            $(contentEl).append($popoverContent);
                        },
                        onShowing: function () {
                            renderWorkflowMiniPreview(
                                $popoverContent,
                                row
                            );
                        }
                    }).dxPopover("instance");

                    // giữ popover khi rê chuột sang vùng popup
                    $badge.on("mouseenter", function () {
                        $popover.show();
                    });
                }
            }
        ],

        defaultSelectionHandler: function (e, ctx) {
            if (!ctx.selectedRow) return;
            ctx.dropdownControl.component.option("value", ctx.selectedKey);
            ctx.dropdownControl.component.close();
        },

        onSelectionChanged: function (e, ctx) {
            if (typeof onSelectionChanged === "function") {
                return onSelectionChanged(e, ctx);
            }
        },

        gridOptions: {
            allowItemDeleting: false,
            hoverStateEnabled: true
        }
    });
}

function renderWorkflowMiniPreview(container, rowData) {
    const $container = $(container);
    $container.empty();
    let nodes = [];

    try {
        //if (typeof workflowNodesJson === "string") {
        //    nodes = JSON.parse(workflowNodesJson || "[]");
        //} else if (Array.isArray(workflowNodesJson)) {
        //    nodes = workflowNodesJson;
        //}

    } catch (e) {
        $container.html(`<div style="padding:10px;color:#b91c1c;">Invalid workflow JSON</div>`);
        return;
    }

    //if (!Array.isArray(nodes) || nodes.length === 0) {
    //    $container.html(`<div style="padding:10px;color:#64748b;">No workflow nodes</div>`);
    //    return;
    //}


    const $wrap = $(`<div></div>`).css({
        position: "relative",
        width: "1000" + "px",
        height: "1000" + "px",
        background: "#fff",
        border: "1px solid #dbe2ea",
        borderRadius: "10px",
        overflow: "hidden"
    //    position: "absolute",
    //    right:"25%",
    //    top: "110px",
    //    bottom: "14px",
    //    width: "70%",
    //    background: "#fff",
    //    border: "1px solid var(--border)",
    //    borderRadius:"16px",
    //boxShadow: "0 14px 40px rgba(0, 0, 0, .18)",
    //padding: "10px 10px 8px",
    //zIndex: "35"

    });
    var passingParams = { UITabId: `form_DrawCanvas_Form_${rowData.id}`, pageNum: rowData.id };
        appendElementViewInside(`/Business/Workflow/DrawCanvas_Form/${rowData.id}`, passingParams, $wrap, `form_DrawCanvas_Form`, "appendTo");


    $container.append($wrap);
}
function makeTheClientLocationGrid(instanceItems, dropdownControl, instanceProps, container, onSelectionChanged = null, sizeOptions = {}) {
    return makeLookupGrid({
        container: container,
        dropdownControl: dropdownControl,
        instanceProps: instanceProps,
        dataSource: instanceItems.editorOptions.dataSource,
        keyExpr: "id",

        width: sizeOptions.width || "100%",
        height: sizeOptions.height || "100%",
        gridHeight: sizeOptions.gridHeight || "85%",
        scrollHeight: sizeOptions.scrollHeight || "100%",

        columns: [
            { dataField: "clientCode", caption: "Client Code" },
            { dataField: "englishName", caption: "English Name" },
            { dataField: "vietnameseName", caption: "Vietnamese Name" },
            { dataField: "clientType", caption: "Client Type" }
        ],

        topPanelBuilder: function () {
            const $panel = $('<div style="display:flex;padding:10px;align-items:center;gap:10px;"></div>');
            $('<div style="padding-right:10px;">Branch code:</div>').appendTo($panel);
            $('<div class="branch-radio-host"></div>').appendTo($panel);
            return $panel;
        },

        onGridReady: function (ctx) {
            const $radioHost = ctx.result.topPanel.find(".branch-radio-host");

            $radioHost.dxRadioGroup({
                dataSource: [
                    { id: 20, key: "Ha Noi" },
                    { id: 10, key: "Ho Chi Minh" }
                ],
                valueExpr: "id",
                displayExpr: "key",
                layout: "horizontal",
                onValueChanged: function (e) {
                    const ds = ctx.grid.getDataSource();
                    ds.filter(["branchId", "=", e.value]);
                    ds.load();
                }
            });
        },

        defaultSelectionHandler: function (e, ctx) {
            if (!ctx.selectedRow) return;

            ctx.dropdownControl.component.option("value", ctx.selectedKey);

            // ctx.instanceProps.formInstance.updateData("clientName", ctx.selectedRow.clientName || "");
            // ctx.instanceProps.formInstance.updateData("locationAddress", ctx.selectedRow.clientAddress || "");
            // ctx.instanceProps.formInstance.updateData("clientCode", ctx.selectedRow.clientCode || "");
            // ctx.instanceProps.formInstance.updateData("locationId", ctx.selectedRow.locationId || 0);

            ctx.dropdownControl.component.close();
        },

        onSelectionChanged: function (e, ctx) {
            if (typeof onSelectionChanged === "function") {
                return onSelectionChanged(e, ctx);
            }
        },

        gridOptions: {
            allowItemDeleting: false
        }
    });
}


function makeLCPreviewPictureObject(imageInstance, imgContainerSizeObject, imgSizeObject, $imagePreview1, $imagePreview2, defaultMargin = "0%") {
    // Use .then() to handle the result asynchronously
    var arrayBuffer = imageInstance.fileData;
    var byteArray = new Uint8Array(arrayBuffer);
    var blob = new Blob([byteArray], { type: "image/*" });
    var url = URL.createObjectURL(blob);
    var img = new Image();
    img.src = url;
    img.onload = function () {
        if (img.height > img.width) {
            imgSizeObject.width = "30%";
            imgSizeObject.marginLeft = defaultMargin == "0%" ? "0%" : "33%";
        }
        else {
            imgSizeObject.marginLeft = "0%";
            imgSizeObject.width = "100%";
        }
        var response = imageInstance.request.response;
        var responseObject = JSON.parse(response); // truy vấn attachment
        var thumbUrl = `https://${window.location.host}/api/Attachment/Browse/${responseObject.attachment.guid}`;
        const $imageContainer = $("<div>").css(imgContainerSizeObject);
        const $imageLink = $("<a>")
            .attr("href", thumbUrl)
            .attr("target", "_blank")
            .appendTo($imageContainer);

        $("<img>")
            .attr("src", imageInstance.url)
            .attr("loading", "lazy")
            .css(imgSizeObject)
            .appendTo($imageLink);

        $("<button>")
            .html("&times;") // HTML entity for "x"
            .css({
                position: "absolute",
                top: "5px",
                right: "5px",
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
                    responseObject.attachmentId = responseObject.attachment?.id ?? 0;
                    responseObject.key = responseObject.attachment?.id ?? 0;
                    await deleteImageData(responseObject);
                    $(this).parent().remove();
                } catch (error) {
                }
            }).appendTo($imageContainer);
        var descriptionId = `description_${responseObject.attachment.id}_${responseObject.attachment.id}`;
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
            .val(responseObject.attachment.attachmentNote || "")
            .on("change", function () {
                responseObject.attachment.attachmentNote = $(this).val();
                $.ajax({
                    url: `api/Attachment/UpdateNote`,
                    type: 'PUT',
                    data: {
                        values: JSON.stringify({
                            attachmentNote: responseObject.attachment.attachmentNote
                        }),
                        key: responseObject.attachment.id
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
        if (responseObject.attachment.rowOrder > 0)
            $imageContainer.appendTo(responseObject.attachment.rowOrder == 1 ? $imagePreview1 : $imagePreview2);
        else
            $imageContainer.appendTo($imagePreview1);
    };

}


function userRender(users) {
    menuCountNotify("UserSession", users);
    const tbody = document.getElementById("tbody");
    if (tbody == null) return;
    const countEl = document.getElementById("count");
    if (countEl == null) return;
    countEl.textContent = users.length;
    tbody.innerHTML = "";
    if (!users || users.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4">No one online</td></tr>`;
        return;
    }
    for (const u of users) {
        const tr = document.createElement("tr");
        tr.innerHTML = `
                    <td>${escapeHtml(u.user)}</td>
                    <td>${escapeHtml(u.authType)}</td>
                    <td>${u.connections}</td>
                    <td>${escapeHtml(u.lastSeen)}</td>
                    <td>${escapeHtml(u.connectionId)}</td>
                `;
        tbody.appendChild(tr);
    }
} function escapeHtml(s) {
    return (s ?? "").toString()
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function menuCountNotify(menuName, object)
{
    switch (menuName) {
        case "UserSession":
            {
                var notifyElement = $(`[data-name=Count_UserSession]`);
                notifyElement.css({ "display": "block" });
                notifyElement.text(object.length);
                break;
            }

        default:
            break;
    }

}




function showNotificationDot() {
    const $icon = $("#notificationBtn");
    $icon.addClass("has-notification");
    // $icon.find(".notification-dot").show();
    $(".notif-count").show();
}
function hideNotificationDot() {
    const $icon = $("#notificationBtn");
    $icon.removeClass("has-notification");
    // $icon.find(".notification-dot").hide();
    $(".notif-count").hide();
}
function updateNotification(count) {
    if (count > 0) {
        showNotificationDot();
        $(".notif-count").text(count)
    } else {
        hideNotificationDot();
    }
}

// ====== reload + refresh UI ======
async function reloadNotifications(take = 30) {
    const qs = $.param({
        filter: JSON.stringify(["receivedBy", "=", _loginUser]),
        paging: 1,
        skip: 0,
        take: take,
        orderBy: "CreatedDate",
        orderDir: "desc"
    });
    ajaxGet("/api/Notification/GetAll", qs)
        .then(ids => {
            try {
                ids = ids.map(id => {
                    if (id.url != "{}" && id.url != "" && id.url != undefined && id.url != null) {
                        id.url = JSON.parse(id.url);
                    }
                    else {
                        id.url = "";
                    }

                    ; return id;
                });
                const res = ids;
                _notif.items = res || [];
                refreshNotifUI();
            } catch (e) {
                console.error(e);
            }


        }).promise();

}



function showPopupNotification(title, body) {
    if (Notification.permission !== 'granted') {
        Notification.requestPermission();
    } else {
        const options = {
            body: body,
            dir: 'ltr'//,
            // image: 'image.jpg'
        };
        const notification = new Notification(title, options);

        notification.onclick = function () {
            window.open('https://www.google.com');
        };
    }
}

function flashNotificationDot() {
    const $icon = $("#notificationBtn");
    showNotificationDot();
    $icon.removeClass("has-notification");
    setTimeout(() => $icon.addClass("has-notification"), 50);
}
function RenderElementV2(_viewConfig, searchFormControls, objectIds, callback) {
    var filterExpr = null;
    var _filterWidth = 150;
    var _filterHeight = 30;
    var _enumWidth = 300;
    var _enumHeight = 500;
    var _entityWidth = 600;
    var _entityHeight = 500;
    var _isFirstLoad = true;
    $.each(_viewConfig, function (i, item) {
        if (item.Type == "dxDateBox") {
            searchFormControls.push({
                elementAttr: { id: item.ElementName },
                dataField: item.ElementName,
                editorType: item.Type,
                editorOptions: {
                    width: _filterWidth,
                    showClearButton: true
                },
                label: { location: "left", text: item.Caption },
                validationRules: [{
                    type: "custom",
                    reevaluate: true,
                    validationCallback: function (options) {
                        var toDate = searchForm.getEditor("toDateDateDateBox");
                        var fromDate = searchForm.getEditor("fromDateDateBox");
                        var toDateValue = "";
                        var fromDateValue = "";

                        if (toDate && toDate.option('value'))
                            toDateValue = toDate.option('value');
                        if (fromDate && fromDate.option('value'))
                            fromDateValue = fromDate.option('value');

                        if (toDateValue && fromDateValue)
                            if (toDateValue < fromDateValue) {
                                // if (options.value < 0) {
                                // options.rule.message = "To Date cannot be earlier than From Date.";
                                return false;
                                // }
                            }
                        return true;
                    }, message: "To date cannot be earlier than from date.",
                }]
            });
        }
        if (item.Type == "Enum") {
            var elements = appGetElementsByName(item.FilterField);
            searchFormControls.push({
                dataField: item.ElementName,
                editorType: "dxDropDownBox",
                label: { location: "left", text: item.Caption },
                editorOptions: {
                    dropDownOptions: {
                        width: _enumWidth
                    },
                    width: _filterWidth,
                    valueExpr: "value",
                    displayExpr: "caption",
                    dataSource: new DevExpress.data.ArrayStore({
                        data: elements,
                        key: "value"
                    }),
                    columns: [
                        { dataField: "code", caption: "Mã" }
                        , { dataField: "caption", caption: "Tên" }
                    ],
                    contentTemplate: function (e) {
                        const $dataGrid = $("<div>").dxDataGrid({
                            dataSource: e.component.option("dataSource"),
                            columns: e.component.option("columns"),
                            selection: { mode: "multiple" },
                            onSelectionChanged: function (selectedItems) {
                                e.component.selectedItem = selectedItems.selectedRowsData;
                                const keys = selectedItems.selectedRowKeys;
                                e.component.option("value", selectedItems.selectedRowsData.map(obj => obj.caption).join(','));
                            }
                        });
                        return $dataGrid;
                    }
                }
            });
        }
        //if (item.Type == "table") {
       
        //}
        if (item.Type == "dxTextBox") {
            searchFormControls.push({
                dataField: item.ElementName,
                editorType: item.Type,
                editorOptions: {
                    width: _filterWidth,
                    showClearButton: true
                },
                label: { location: "left", text: item.Caption }
            });
        }
    });


    $(`#${objectIds.buttonId}`).dxButton({
        height: 30,
        width: 200,
        text: "Submit",
        onClick: function (e) {

            $.ajax({
                url: `/api/${objectIds.controllerId}/ExecuteCustomQuery`,
                type: "POST",
                headers: { 'Content-Type': 'application/json' },
                data: JSON.stringify(callback(_viewConfig)),
                success: function (data) {
                    $(`#${objectIds.gridId}`).dxDataGrid("instance").refresh();
                },
                error: function (error) {
                    console.error("Error loading data:", error);
                }
            });
        }
    }).addClass("custom-search-custom");
}
function normalizeSpaces(s) {
    return (s || "").replace(/\s+/g, " ").trim();
}

// escape các ký tự nhạy cảm nếu sau này bạn lỡ dùng .html()
// (hiện mình dùng .text() nên đã an toàn, nhưng keep cho chắc)
function safeText(s) {
    return (s ?? "").toString();
}

/**
 * Parse theo format:
 *   "FieldName - Label (note)"
 *   "FieldName - Label"
 *   "Label (note)"
 *   "Label"
 *
 * Output:
 *   top:  FieldName (nếu có)
 *   title: Label (phần chính)
 *   note: note (không gồm ngoặc)
 */
function parseLabelSmart(input) {
    const raw = normalizeSpaces(safeText(input));

    // 1) ưu tiên tách theo " - " (có spaces 2 bên)
    let top = "";
    let rest = raw;

    const dash = " - ";
    const idxDash = raw.indexOf(dash);
    if (idxDash > -1) {
        top = normalizeSpaces(raw.substring(0, idxDash));
        rest = normalizeSpaces(raw.substring(idxDash + dash.length));
    }

    // 2) tách note theo ngoặc cuối cùng: "... (note)"
    // Cho phép label có ngoặc giữa câu, nhưng note lấy ngoặc ở cuối.
    let title = rest;
    let note = "";

    const m = rest.match(/^(.*)\(([^()]*)\)\s*$/); // note ở cuối
    if (m) {
        title = normalizeSpaces(m[1]);
        note = normalizeSpaces(m[2]);
    }

    // fallback nếu title rỗng
    if (!title && top) {
        title = top;
        top = "";
    }

    return { top, title, note };
}

/**
 * Inline template: 3 dòng tối đa
 * - top (field name) nhỏ & mờ hơn
 * - title (label chính) đậm
 * - note (trong ngoặc) nhỏ hơn
 */
function labelTpl(text) {
    const { top, title, note } = parseLabelSmart(text);
    return function (_, $label) {
        // wrapper
        const $wrap = $("<div>").css({
            whiteSpace: "normal",   // cho phép xuống dòng
            lineHeight: "1.2"
        });
        //$("<div>")
        //    .text(top)
        //    .css({
        //        fontWeight: "600",
        //        display: "block"
        //    })
        //    .appendTo($wrap);
        // title (dòng 1)
        $("<div>")
            .text(top)
            .css({
                fontWeight: "600",
                display: "block"
            })
            .appendTo($wrap);

        // note (dòng 2)
        if (title) {
            $("<div>")
                .text(`(${title})`)
                .css({
                    fontSize: "11px",
                    opacity: "0.75",
                    display: "block"
                })
                .appendTo($wrap);
        }

        $label.append($wrap);
    };
}
function popupStandardContentByScroll(customContainer) {
    var scrollView = $("<div>");
    customContainer.appendTo(scrollView);

    scrollView.dxScrollView({
        width: "100%",
        height: "100%",
        useNative: false 
    });
    return scrollView;
}
    // =========================
    // ajaxCore (base engine)
    // =========================

function ajaxCore(method, url, {
    routeParam = null,   // ví dụ dept cho route: /{dept}
    query = null,        // object => query string
    body = null,         // object => JSON body
    headers = {},        // custom headers (merge)
    dataType = "json",
    timeout = 30000,
    cache = false,
    processData = false,
    // callbacks (optional)
    onSuccess = null,
    onError = null,
    onFinally = null,

    // hook (optional)
    beforeSend = null
} = {}) {

    const fullUrl = (routeParam !== null && routeParam !== undefined)
        ? `${url}?${routeParam}`
        : url;

    const m = (method || "GET").toUpperCase();
    const isGet = m === "GET";
    const isPut = m === "PUT";

    // NOTE: theo style bạn đang dùng: set 'Content-Type' trong headers cho POST JSON
    const finalHeaders = { ...headers };
    if (!isGet) {
        // nếu user chưa set thì auto set
        if (!finalHeaders["Content-Type"] && !finalHeaders["content-type"]) {
            finalHeaders["Content-Type"] = "application/json";
        }


    }
    else {
        if (routeParam && typeof routeParam === "object") {
            for (const [k, v] of Object.entries(query)) {
                if (v === null || v === undefined) continue;
                finalHeaders[headerPrefix + k] = String(v);
            }
        }
    }

    var ajaxOptions = {
        url: fullUrl,
        type: m,
        dataType,
        timeout,
        cache,
        processData: processData,
        // GET => query, POST => JSON.stringify(body)
        data: isGet ? (query || {}) : (body == null ? null : (isPut ? body : JSON.stringify(body))),


        //Should not use in PUT method
        //headers: finalHeaders,
        //contentType: isGet ? undefined : "application/json; charset=utf-8",

        beforeSend: (xhr) => {
            try { beforeSend?.(xhr); } catch { }
        }
    };

    if (!isPut) {

        // nếu không phải GET thì thêm contentType JSON
        if (!isGet) {
            ajaxOptions.contentType = "application/json; charset=utf-8";
        }

        if (finalHeaders) {
            ajaxOptions.headers = finalHeaders;
        }
    }

    const jqxhr = $.ajax(ajaxOptions);

    // callbacks + promise bridge
    jqxhr
        .done((res, textStatus, xhr) => {
            try { onSuccess?.(res, { url: fullUrl, method: m, textStatus, xhr }); } catch (e) {
                try { sendClientErrorLog?.("onSuccess callback error", e); } catch { }
            }
        })
        .fail((xhr, textStatus, errorThrown) => {
            const errInfo = {
                url: fullUrl,
                method: m,
                textStatus,
                errorThrown,
                status: xhr?.status,
                responseText: xhr?.responseText,
                breadcrumbTrail: JSON.stringify(body),
                xhr
            };

            try { onError?.(errInfo); } catch (e) {
                try { sendClientErrorLog?.("onError callback error", e); } catch { }
            }

            try { sendClientErrorLog?.("AJAX ERROR", errInfo); } catch { }
        })
        .always(() => {
            try { onFinally?.(); } catch { }
        });

    return jqxhr; // jqXHR = Promise-like
}



    // =========================
    // ajaxGet (optional wrapper)
    // =========================
    function ajaxGet(url, routeParamOrQuery = null, maybeQuery = null, opt = {}) {
        let routeParam = null;
        let query = {};

        if (typeof routeParamOrQuery === "string" || typeof routeParamOrQuery === "number") {
            routeParam = routeParamOrQuery;
            query = maybeQuery || {};
        } else if (routeParamOrQuery && typeof routeParamOrQuery === "object") {
            query = routeParamOrQuery;
        }

        return ajaxCore("GET", url, { routeParam, query, ...opt });
    }



    // =========================
    // ajaxPost (EDIT theo code bạn đưa)
    // - set headers: { 'Content-Type': 'application/json' }
    // - data: JSON.stringify(data)
    // - có callback success/error
    // - trả promise
    // =========================
    function ajaxPost(url, data = {}, opt = {}) {
        return ajaxCore("POST", url, {
            body: data,
            headers: { "Content-Type": "application/json", ...(opt.headers || {}) },

            // forward callbacks/hook
            onSuccess: opt.onSuccess,
            onError: opt.onError,
            onFinally: opt.onFinally,
            beforeSend: opt.beforeSend,

            // misc
            dataType: opt.dataType || "json",
            timeout: opt.timeout || 30000,
            cache: opt.cache ?? false
        });
    }

    function ajaxPut(url, data = {}, opt = {}) {
    return ajaxCore("PUT", url, {
        body: data,
        processData: true,
        // forward callbacks/hook
        onSuccess: opt.onSuccess,
        onError: opt.onError,
        onFinally: opt.onFinally,
        beforeSend: opt.beforeSend,
        timeout: opt.timeout || 30000,
        cache: opt.cache ?? false
    });
}

// =========================
// Usage đúng theo ví dụ của bạn
// =========================
// quotationData.StageDept = "FO";
// ajaxPost("/api/Quotation/CreateQuotation", quotationData, {
//     onSuccess: (response) => { console.log("OK", response); },
//     onError: (err) => { console.log("ERR", err); },
//     onFinally: () => { console.log("DONE"); }
// })
// .done(r => console.log("done:", r))
// .fail(x => console.log("fail:", x?.responseText))
// .always(() => console.log("always"));
function getRenderedGridWidth(grid) {
    const el = grid.element().get(0);
    return Math.ceil(el.getBoundingClientRect().width);
}

// (optional) lấy scrollbar width để trừ nếu cần
function getScrollbarWidth() {
    const div = document.createElement("div");
    div.style.width = "100px";
    div.style.height = "100px";
    div.style.overflow = "scroll";
    div.style.position = "absolute";
    div.style.top = "-9999px";
    document.body.appendChild(div);
    const sw = div.offsetWidth - div.clientWidth;
    document.body.removeChild(div);
    return sw;
}

function stretchColumnsEvenly(e, opts) {
    const grid = e.component;

    // chặn loop: chỉ chạy 1 lần mỗi lifecycle
    const flagKey = "_stretched_evenly";
    if (grid.__internalFlags?.[flagKey]) return;
    grid.__internalFlags = grid.__internalFlags || {};
    grid.__internalFlags[flagKey] = true;

    const renderedWidth = getRenderedGridWidth(grid);

    const targetWidth = opts?.targetWidth ?? window.innerWidth - _widthMenuWidth - _rightWindowPadding;
    const minWidthEach = opts?.minWidthEach ?? 120;
    const excludeFields = new Set(opts?.excludeFields ?? []); // vd ["_command", "Select", "Buttons"]

    // nếu bạn muốn ép grid width như bạn đang làm
    if (renderedWidth > targetWidth) {
        grid.option("width", targetWidth);
        grid.updateDimensions();
    }

    // width cuối cùng sau khi set option width
    const finalWidth = getRenderedGridWidth(grid);

    // visible columns
    const cols = grid.getVisibleColumns().filter(c => !c.command); // loại command column (edit/delete/buttons)
    const stretchCols = cols.filter(c => !excludeFields.has(c.dataField));

    if (!stretchCols.length) return;

    // trừ scrollbar nếu có vertical scroll
    const sw = getScrollbarWidth();
    const hasVScroll = grid.getScrollable && grid.getScrollable().scrollHeight() > grid.getScrollable().clientHeight();
    const available = finalWidth - (hasVScroll ? sw : 0);

    // nếu bạn có cột fixed width muốn giữ, tính tổng width fixed trước
    const fixedSum = cols
        .filter(c => excludeFields.has(c.dataField))
        .reduce((sum, c) => sum + (c.width || 0), 0);

    const free = Math.max(0, available - fixedSum);

    const evenW = Math.max(minWidthEach, Math.floor(free / stretchCols.length));

    grid.beginUpdate();
    try {
        stretchCols.forEach(c => {
            // dùng visibleIndex / index chuẩn
            grid.columnOption(c.index, "width", evenW);
        });
    } finally {
        grid.endUpdate();
        // update lại layout
        grid.updateDimensions();
    }
}


function newKey() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return String(Date.now()) + "_" + Math.random().toString(16).slice(2);
}


function entryTemplate() {
    return {
        _key: newKey(),
        to: null,
        notes: ""
    };
}
function upsertPicByDept(jsonText, deptKey, picName) {
    // 1) Normalize input
    deptKey = (deptKey || "").trim();
    picName = (picName || "").trim();

    if (!deptKey) throw new Error("deptKey is empty.");
    if (!picName) throw new Error("picName is empty.");

    // 2) Parse JSON safely
    let obj = {};
    if (jsonText && String(jsonText).trim()) {
        try {
            const parsed = JSON.parse(jsonText);
            if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) obj = parsed;
        } catch {
            // JSON lỗi => reset để tránh crash
            obj = {};
        }
    }

    // 3) Upsert (insert/update)
    obj[deptKey] = picName;

    // 4) Return string JSON
    return JSON.stringify(obj);
}


// wwwroot/js/app/attachmentUtil.js
// Requires: jQuery + DevExtreme

window.AttachmentUtil = (function () {

    function _safe(obj, path, fallback) {
        try {
            return path.split(".").reduce((o, k) => (o ? o[k] : undefined), obj) ?? fallback;
        } catch { return fallback; }
    }

    function _extOf(name) {
        const s = (name || "").trim();
        const idx = s.lastIndexOf(".");
        return idx >= 0 ? s.substring(idx + 1).toLowerCase() : "";
    }

    //function iconByExt(ext) {
    //    ext = (ext || "").toLowerCase();
    //        console.log(ext);
    //    switch (ext) {
    //        case "not found": return "Not Found";
    //        case "pdf": return "📕";
    //        case "xls":
    //        case "xlsx":
    //        case "csv": return "📗";
    //        case "doc":
    //        case "docx": return "📘";
    //        case "ppt":
    //        case "pptx": return "📙";
    //        case "msg":
    //        case "eml": return "✉️";
    //        case "xml":
    //        case "json": return "🧾";
    //        case "zip":
    //        case "rar":
    //        case "7z": return "🗜️";
    //        case "png":
    //        case "jpg":
    //        case "jpeg":
    //        case "gif":
    //        case "bmp":
    //        case "webp": return "🖼️";
    //        default: return "📎";
    //    }
    //}

    function formatBytes(bytes) {
        const n = Number(bytes || 0);
        if (n < 1024) return n + " B";
        const kb = n / 1024;
        if (kb < 1024) return kb.toFixed(1) + " KB";
        const mb = kb / 1024;
        if (mb < 1024) return mb.toFixed(1) + " MB";
        const gb = mb / 1024;
        return gb.toFixed(1) + " GB";
    }

    function getFormInstance(formSelector) {
        return $(formSelector).dxForm("instance");
    }

    function getKeyAndValues(formSelector, keyField) {
        const form = getFormInstance(formSelector);
        const formData = form?.option("formData") || {};
        const key = keyField ? formData?.[keyField] : (formData?.id ?? formData?.Id);
        return {
            key,
            values: JSON.stringify(formData) // đúng ý bạn: values change là JSON.stringify
        };
    }

    async function apiUpload({ insertUrl, file, key, values, extraFormData, headers }) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("key", key);
        fd.append("values", values);

        if (extraFormData && typeof extraFormData === "object") {
            Object.keys(extraFormData).forEach(k => fd.append(k, extraFormData[k]));
        }

        const res = await fetch(insertUrl, {
            method: "POST",
            body: fd,
            headers: headers || undefined
        });

        if (!res.ok) {
            const msg = await res.text().catch(() => "");
            throw new Error(msg || ("Upload failed: " + res.status));
        }

        return await res.json().catch(() => ({}));
    }

    async function apiList({ listUrl, key, headers }) {
        if (!listUrl) return [];
        const url = typeof listUrl === "function" ? listUrl(key) : listUrl;
        const res = await fetch(url, { method: "GET", headers: headers || undefined });
        if (!res.ok) return [];
        return await res.json().catch(() => []);
    }

    async function apiDelete({ deleteUrl, id, headers }) {
        if (!deleteUrl) return true;
        const url = typeof deleteUrl === "function" ? deleteUrl(id) : deleteUrl;
        const res = await fetch(url, { method: "DELETE", headers: headers || undefined });
        if (!res.ok) {
            const msg = await res.text().catch(() => "");
            throw new Error(msg || "Delete failed");
        }
        return true;
    }

    function normalizeItem(raw, map) {
        // map: { id, fileName, extension, size, downloadUrl }
        // có thể truyền string path, hoặc function
        const get = (rule) => {
            if (!rule) return undefined;
            if (typeof rule === "function") return rule(raw);
            if (typeof rule === "string") return _safe(raw, rule, undefined);
            return undefined;
        };

        const fileName = get(map?.fileName) ?? raw.fileName ?? raw.FileName ?? raw.name;
        const extension = get(map?.extension) ?? raw.extension ?? raw.Extension ?? _extOf(fileName);
        const size = get(map?.size) ?? raw.size ?? raw.fileSize ?? raw.FileSize;
        const downloadUrl = get(map?.downloadUrl) ?? raw.downloadUrl ?? raw.DownloadUrl ?? raw.url;

        return {
            id: get(map?.id) ?? raw.id ?? raw.Id ?? raw.attachmentId,
            fileName,
            extension,
            size,
            downloadUrl,
            raw
        };
    }

    function renderAttachmentList($host, store, options) {
        // options: { onDownload, onDelete }
        return $host.dxList({
            dataSource: store,
            height: 260,
            noDataText: "No attachments",
            itemTemplate: function (itemData) {
                const name = itemData.fileName || "Unnamed";
                const ext = itemData.extension || _extOf(name);
                const size = itemData.size || 0;

                const $item = $("<div style='display:flex;align-items:center;gap:10px;padding:6px 4px;'>");

                $("<div style='width:32px;font-size:20px;text-align:center;'>")
                    .text(getIconByExt(ext))
                    .appendTo($item);

                const $mid = $("<div style='flex:1;min-width:0;'>").appendTo($item);
                $("<div style='font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;'>")
                    .text(name)
                    .appendTo($mid);

                $("<div style='opacity:.75;font-size:12px;'>")
                    .text((ext ? ext.toUpperCase() : "FILE") + " • " + formatBytes(size))
                    .appendTo($mid);

                const $actions = $("<div style='display:flex;gap:6px;'>").appendTo($item);

                $("<div>").dxButton({
                    icon: "download",
                    stylingMode: "contained",
                    hint: "Download",
                    onClick: function () { options?.onDownload?.(itemData); }
                }).appendTo($actions);

                //$("<div>").dxButton({
                //    icon: "trash",
                //    stylingMode: "outlined",
                //    hint: "Delete",
                //    onClick: function () { options?.onDelete?.(itemData); }
                //}).appendTo($actions);

                $("<div>").dxButton({
                    icon: "trash",
                    hint: "Delete",
                    stylingMode: "outlined",
                    onClick: async function (ev) {
                        ev.event?.stopPropagation?.();

                        if (!id) {
                            DevExpress.ui.notify("Missing id", "warning", 2000);
                            return;
                        }

                        try {
                            const res = await fetch(`/api/Document/DeleteDocumentData?id=${encodeURIComponent(id)}`, {
                                method: "GET"
                            });

                            if (!res.ok) throw new Error("Delete failed");

                            // animation slide đóng item
                            $item.css({
                                overflow: "hidden",
                                maxHeight: $item.outerHeight() + "px",
                                opacity: 1,
                                transform: "translateX(0)",
                                transition: "max-height .22s ease, opacity .18s ease, margin .22s ease, padding .22s ease, transform .22s ease"
                            });

                            requestAnimationFrame(() => {
                                $item.css({
                                    opacity: 0,
                                    transform: "translateX(24px)",
                                    maxHeight: "0px",
                                    marginTop: "0px",
                                    marginBottom: "0px",
                                    paddingTop: "0px",
                                    paddingBottom: "0px",
                                    borderWidth: "0px"
                                });
                            });

                            setTimeout(() => {
                                $item.remove();
                                DevExpress.ui.notify("Deleted", "success", 1200);

                                if (typeof onDeleted === "function") {
                                    onDeleted(x, { skipReload: true });
                                }
                            }, 240);

                        } catch (err) {
                            DevExpress.ui.notify(err.message || "Delete error", "error", 2500);
                        }
                    }
                }).appendTo($actions);
                return $item;
            }
        }).dxList("instance");
    }

    /**
     * Init attachment control inside a container
     * cfg = {
     *   formSelector: "#formMKT",
     *   hostSelector: "#attHost",                 // nơi render uploader + list
     *   keyField: "id",                           // field name trong formData
     *   apis: { insertUrl, listUrl(key), deleteUrl(id) },
     *   map: { id, fileName, extension, size, downloadUrl },
     *   uploader: { multiple, allowedFileExtensions, maxFileSize, uploadMode },
     *   extraFormData: () => ({...}) | object,
     *   headers: () => ({...}) | object,
     *   onUploaded: (result, file) => {},
     * }
     */
    function init(cfg) {
        const formSelector = cfg.formSelector;

        // NEW: ưu tiên hostElement
        const $host = cfg.hostElement ? $(cfg.hostElement) : $(cfg.hostSelector);

        if ($host.length === 0) throw new Error("Attachment host not found");
        $host.empty();
        const $uploader = $("<div class='att-uploader'>").appendTo($host);
        const $listWrap = $("<div class='att-list' style='margin-top:10px;'>").appendTo($host);

        const store = new DevExpress.data.ArrayStore({ key: "id", data: [] });

        const listInstance = renderAttachmentList($listWrap, store, {
            onDownload: (item) => {
                const url = item.downloadUrl;
                if (url) window.open(url, "_blank");
                else DevExpress.ui.notify("No downloadUrl", "warning", 2000);
            },
            onDelete: async (item) => {
                const id = item.id;
                if (!id) return DevExpress.ui.notify("Missing attachment id", "warning", 2500);

                const headers = typeof cfg.headers === "function" ? cfg.headers() : cfg.headers;

                try {
                    await apiDelete({ deleteUrl: cfg.apis?.deleteUrl, id, headers });
                    store.remove(id);
                    store.load();
                    DevExpress.ui.notify("Deleted", "success", 1200);
                } catch (e) {
                    DevExpress.ui.notify(e.message || "Delete error", "error", 3000);
                }
            }
        });

        async function reload() {
            const payload = getKeyAndValues(formSelector, cfg.keyField);
            if (!payload.key) return;

            const headers = typeof cfg.headers === "function" ? cfg.headers() : cfg.headers;

            const data = await apiList({ listUrl: cfg.apis?.listUrl, key: payload.key, headers });
            const normalized = (data || [])
                .map(x => normalizeItem(x, cfg.map))
                .filter(x => x.id != null);

            store.clear();
            normalized.forEach(x => store.insert(x));
            await store.load();
        }

        $uploader.dxFileUploader({
            selectButtonText: "Upload files",
            labelText: "",
            multiple: cfg.uploader?.multiple ?? true,
            accept: "*/*",
            uploadMode: "instantly",
            showFileList: true,
            allowedFileExtensions: cfg.uploader?.allowedFileExtensions ?? undefined,
            maxFileSize: cfg.uploader?.maxFileSize ?? undefined,

            uploadFile: async function (file) {
                const payload = getKeyAndValues(formSelector, cfg.keyField);
                if (!payload.key) {
                    DevExpress.ui.notify("Missing key (formData.id)", "warning", 2500);
                    throw new Error("Missing key");
                }

                const extraFormData = typeof cfg.extraFormData === "function" ? cfg.extraFormData() : cfg.extraFormData;
                const headers = typeof cfg.headers === "function" ? cfg.headers() : cfg.headers;

                try {
                    const result = await apiUpload({
                        insertUrl: cfg.apis?.insertUrl,
                        file,
                        key: payload.key,
                        values: payload.values,
                        extraFormData,
                        headers
                    });

                    cfg.onUploaded?.(result, file);

                    // Nếu API trả về item => insert ngay, không thì reload
                    const inserted = normalizeItem(result, cfg.map);
                    if (inserted.id != null) {
                        try { store.insert(inserted); await store.load(); } catch { await reload(); }
                    } else {
                        await reload();
                    }

                    DevExpress.ui.notify("Uploaded: " + file.name, "success", 1000);
                } catch (e) {
                    DevExpress.ui.notify(e.message || ("Upload error: " + file.name), "error", 3500);
                    throw e;
                }
            }
        });

        // expose reload for caller
        const api = {
            reload,
            listInstance,
            store,
            getKeyAndValues: () => getKeyAndValues(formSelector, cfg.keyField)
        };

        // initial load
        reload();
        return api;
    }

    return {
        init,
        //iconByExt,
        formatBytes,
        getKeyAndValues
    };
})();

function getIconByExt(ext) {
    ext = (ext || "").toLowerCase();
    if (ext === "not found on server") return "!";
    if (ext === "pdf") return "📕";
    if (ext === "xls" || ext === "xlsx" || ext === "csv") return "📗";
    if (ext === "doc" || ext === "docx") return "📘";
    if (ext === "ppt" || ext === "pptx") return "📙";
    if (ext === "msg" || ext === "eml") return "✉️";
    if (ext === "xml" || ext === "json") return "🧾";
    if (ext === "zip" || ext === "rar" || ext === "7z") return "🗜️";
    if (["png", "jpg", "jpeg", "gif", "bmp", "webp"].includes(ext)) return "🖼️";
    return "📎";
}

function getExt(fileName) {
    const s = (fileName || "");
    const i = s.lastIndexOf(".");
    return i >= 0 ? s.substring(i + 1) : "";
}

function formatBytes(bytes) {
    const n = Number(bytes || 0);
    if (n < 1024) return n + " B";
    const kb = n / 1024;
    if (kb < 1024) return kb.toFixed(1) + " KB";
    const mb = kb / 1024;
    if (mb < 1024) return mb.toFixed(1) + " MB";
    const gb = mb / 1024;
    return gb.toFixed(1) + " GB";
}

function getCurrentEditorOptions(editorOptions) {
    const form = $(`#${editorOptions.moduleName}-form${editorOptions.sectionName}`).dxForm("instance");
    if (!form) return null;
    return form.option("formData");
}
function getDxFileUploaderIds(sectionName) {
    return {
        uploaderId: `fileUpload_${sectionName}`,
        previewId: `attList_${sectionName}`
    };
}
function showUploaderLoader(idControlElement, message) {
    const $element = $(idControlElement);
    if (!$element.length) return;

    $(`${idControlElement} .previewLoader`).remove();

    const $loadDiv = $("<div>")
        .addClass("previewLoader")
        .css({
            position: "absolute",
            width: "100%",
            height: "100%",
            top: 0,
            left: 0
        })
        .appendTo($element.css("position", "relative"));

    $("<div>").appendTo($loadDiv).dxLoadPanel({
        message: message || "File loading...",
        visible: true,
        shading: true,
        shadingColor: "rgba(255,255,255,0.7)",
        showPane: true,
        closeOnOutsideClick: false,
        position: { of: idControlElement }
    });
}

function hideUploaderLoader(idControlElement) {
    $(`${idControlElement} .previewLoader`).remove();
}
function renderDxFileUploader(editorOptions, $container, options) {
    const controlId = `${editorOptions.moduleName}_${editorOptions.sectionName}`;
    options = options || {};
    const controllerName = options.controllerName || "Document";
    const currentOptions = getCurrentEditorOptions(editorOptions) || {};

    const ids = getDxFileUploaderIds(controlId);
    const uploaderId = ids.uploaderId;
    const previewId = ids.previewId;
    const idControlElement = `#${uploaderId}`;

    const uploadTitle = currentOptions.uploadTitle || options.uploadTitle || "Files";

    $(`#${previewId}`).remove();
    $(`#${uploaderId}`).remove();
    
    //const $preview =  $(`<div id="${previewId}" style="display:flex;flex-wrap:wrap;gap:25px;top:10px"></div>`)
    const $preview = $(`<div id="${previewId}" class="att-preview"></div>`)
        .appendTo($container);
    $(`<div id="${uploaderId}"></div>`)
        .appendTo($container)
        .dxFileUploader({
            readOnly: !!currentOptions.isReadOnly,
            multiple: true,
            accept: options.accept || "*/*",
            selectButtonText: `Upload ${uploadTitle}`,
            dropZone: `#${previewId}`,
            labelText: "",
            uploadMode: "instantly",
            uploadUrl: options.uploadUrl || `/api/Attachment/AsyncUploadFile`,
            showFileList: false,
            uploadHeaders: {
               //Only use for static string
            },
            onInitialized: function (e) {
                //updateDxFileUploaderHeaders(editorOptions);
            },
            onUploadStarted: function (e) {
                showUploaderLoader(idControlElement, "File loading...");
            },
            uploadFile: function (file) {
                const opts = resolveUploadOptions(controlId, editorOptions);
                return uploadFileAjax(file, {
                    url: "/api/Attachment/AsyncUploadFile",
                    ...opts
                });
               
            },
            onUploaded: function (e) {
                hideUploaderLoader(idControlElement);

                loadDxFileUploaderAttachments(controlId, controllerName, editorOptions)
            }
        });

    loadDxFileUploaderAttachments(controlId, controllerName, editorOptions);
}

//function updateDxFileUploaderHeaders(editorOptions) {
    
//    const controlIdIn = `${editorOptions.moduleName}_${editorOptions.sectionName}`;
//    const currentOptions = getCurrentEditorOptions(editorOptions);
//    if (!currentOptions) return;

//    const { uploaderId } = getDxFileUploaderIds(controlIdIn);
//    const uploader = $(`#${uploaderId}`).dxFileUploader("instance");
//    if (!uploader) return;
//    uploader.option("uploadHeaders", {
//        RecordGuid: currentOptions.guid || "",
//        Folder: editorOptions.sectionName || sectionName
//    });

//    uploader.option("readOnly", !!currentOptions.isReadOnly);
//    uploader.option("selectButtonText", `Upload ${currentOptions.uploadTitle || "Files"}`);
//}



function createAttachmentItem(x, onDeleted) {
    const fileName = x.fileName || x.FileName || x.name || "Unnamed";
    const ext = (x.extension || x.Extension || getExt(fileName)).toLowerCase();
    const size = x.size || x.fileSize || x.FileSize || 0;
    const downloadUrl = x.downloadUrl || x.DownloadUrl || x.url;
    const id = x.id || x.Id || x.attachmentId;
    const $item = $("<div>")
        .addClass("att-item")
        .css({
            opacity: 0,
            transform: "translateY(8px)",
            transition: "opacity .18s ease, transform .18s ease"
        });

    $("<div>")
        .addClass("att-ico")
        .text(getIconByExt(ext))
        .appendTo($item);

    const $meta = $("<div>").addClass("att-meta").appendTo($item);

    $("<div>")
        .addClass("att-name")
        .attr("title", fileName)
        .text(fileName)
        .appendTo($meta);

    $("<div>")
        .addClass("att-sub")
        .text((ext ? ext.toUpperCase() : "FILE") + " • " + formatBytes(size))
        .appendTo($meta);

    const $actions = $("<div>").addClass("att-actions").appendTo($item);

    $("<div>").dxButton({
        icon: "download",
        hint: "Download",
        stylingMode: "contained",
        onClick: function (ev) {
            ev.event?.stopPropagation?.();
            if (downloadUrl) {
                window.open(downloadUrl, "_blank");
            } else {
                DevExpress.ui.notify("No download url", "warning", 2000);
            }
        }
    }).appendTo($actions);

    $("<div>").dxButton({
        icon: "trash",
        hint: "Delete",
        stylingMode: "outlined",
        onClick: async function (ev) {
            ev.event?.stopPropagation?.();

            if (!id) {
                DevExpress.ui.notify("Missing id", "warning", 2000);
                return;
            }

            try {
                const res = await fetch(`/api/Document/DeleteDocumentData?id=${encodeURIComponent(id)}`, {
                    method: "GET"
                });

                if (!res.ok) throw new Error("Delete failed");

                DevExpress.ui.notify("Deleted", "success", 1200);
                if (typeof onDeleted === "function") {
                    onDeleted(x);
                }
            } catch (err) {
                DevExpress.ui.notify(err.message || "Delete error", "error", 2500);
            }
        }
    }).appendTo($actions);

    $item.css("cursor", downloadUrl ? "pointer" : "default");
    $item.on("click", async function (ev) {
        if (ext === "xlsx" || ext === "xls") {
            //libreConvert(id);
            openExcelPreviewPopup(id);
        }
        if (ext === "docx" || ext === "doc")
            openWordPreviewPopup(id);
        if (ext === "jpg" || ext === "jpeg" || ext === "png")
            openImagePreviewPopup(id);

        //if (ext === "docx")
        //    openWordMammothPopup(id);
    });

    return $item;
}
function renderAttachmentListLazy(list, attList_Host, options) {
    options = options || {};

    const batchSize = options.batchSize || 8;
    const delay = options.delay || 0;
    const onDeleted = options.onDeleted;

    if (!attList_Host || attList_Host.length === 0) return;

    attList_Host.empty();

    if (!list || list.length === 0) {
        attList_Host.html("<div style='opacity:.7;padding:6px 2px;'>No attachments</div>");
        return;
    }

    let index = 0;
    let cancelled = false;

    const token = Date.now() + "_" + Math.random().toString(36).slice(2);
    attList_Host.data("lazyRenderToken", token);

    function appendBatch() {
        if (cancelled) return;
        if (attList_Host.data("lazyRenderToken") !== token) return;

        const frag = document.createDocumentFragment();
        const itemsToAnimate = [];

        for (let i = 0; i < batchSize && index < list.length; i++, index++) {
            const $item = createAttachmentItem(list[index], onDeleted);
            frag.appendChild($item[0]);
            itemsToAnimate.push($item);
        }

        attList_Host[0].appendChild(frag);

        requestAnimationFrame(() => {
            itemsToAnimate.forEach(($item, idx) => {
                setTimeout(() => {
                    $item.css({
                        opacity: 1,
                        transform: "translateY(0)"
                    });
                }, idx * 20);
            });
        });

        if (index < list.length) {
            if (delay > 0) {
                setTimeout(() => requestAnimationFrame(appendBatch), delay);
            } else {
                requestAnimationFrame(appendBatch);
            }
        }
    }

    appendBatch();

    return {
        cancel: function () {
            cancelled = true;
        }
    };
}
function loadDxFileUploaderAttachments(sectionName, controllerName, editorOptions) {
    const currentOptions = getCurrentEditorOptions(editorOptions);
    if (!currentOptions || !currentOptions.guid) return;
    var controllId = `${editorOptions.moduleName}_${editorOptions.sectionName}`;
    const { uploaderId, previewId } = getDxFileUploaderIds(controllId);
    const idControlElement = `#${uploaderId}`;
    showUploaderLoader(idControlElement, "File loading...");
    $.ajax({
        url: `/api/${controllerName}/GetByKey?recordGuid=${currentOptions.guid}&folder=${currentOptions.sectionName ? (editorOptions.moduleName + '_' + currentOptions.sectionName + (editorOptions?.specificFolder ? '_' + editorOptions?.specificFolder : '')) : sectionName}`,
        method: "GET",
        success: function (data) {
            const $preview = $(`#${previewId}`);
            renderAttachmentListLazy(data, $preview, {
                batchSize: 6,
                delay: 16,
                onDeleted: function () {
                    loadDxFileUploaderAttachments(sectionName, controllerName, editorOptions);
                }
            });

            hideUploaderLoader(idControlElement);
        },
        error: function () {
            hideUploaderLoader(idControlElement);
        }
    });
}

function buildFolder(latestOptions, sectionName) {
    //return (latestOptions?.sectionName || sectionName) +
    return (latestOptions.moduleName == 'qt' ? `Quotation` : `PolicyIssuance`) +
        (latestOptions?.code ? `\\${latestOptions.code}` : "");
}
function uploadFileAjax(file, options) {
    const url = options.url;
    const guid = options.guid || "";
    const folder = options.folder || "";
    const sectionName = options.section || "";

    const formData = new FormData();
    formData.append("file", file);

    return $.ajax({
        url: url,
        method: "POST",
        data: formData,
        processData: false,
        contentType: false,
        beforeSend: function (xhr) {

            if (guid) {
                xhr.setRequestHeader("RecordGuid", guid);
            }

            if (folder) {
                xhr.setRequestHeader("Folder", folder);
            }

            if (window.appToken) {
                xhr.setRequestHeader("Authorization", "Bearer " + window.appToken);
            }
            if (sectionName) {
                xhr.setRequestHeader("SectionName", sectionName);
            }

        }
    });

}

function resolveUploadOptions(sectionName,editorOptions) {
    const latestOptions = getCurrentEditorOptions(editorOptions) || {};
    latestOptions.moduleName = editorOptions?.moduleName;
    if (editorOptions?.code)
        latestOptions.code = editorOptions?.code;
    if (editorOptions?.specificFolder) {
        latestOptions.code = `${editorOptions?.code}\\${editorOptions?.specificFolder}`;
        sectionName = `${sectionName}_${editorOptions?.specificFolder}`
    }
    return {
        guid: latestOptions.guid || "",
        folder: buildFolder(latestOptions, sectionName) || "",
        section: sectionName
    };

}

function getJson(url, data) {
    return $.ajax({
        url: url,
        type: "GET",
        data: data || {},
        dataType: "json"
    });
}


// Global error handlers for detailed JavaScript error tracing
window.addEventListener('error', function(event) {
    const errorInfo = {
        message: event.message,
        fileName: event.filename,
        lineNumber: event.lineno,
        columnNumber: event.colno,
        stack: event.error?.stack,
        errorType: 'uncaught'
    };
    sendClientErrorLog(event.message, null, errorInfo);
});

window.addEventListener('unhandledrejection', function(event) {
    const errorInfo = {
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack,
        errorType: 'unhandled_promise'
    };
    sendClientErrorLog(event.reason?.message || 'Unhandled promise rejection', null, errorInfo);
});

// Override console.error to also log to server
const originalConsoleError = console.error;
console.error = function(...args) {
    // Call original
    originalConsoleError.apply(console, args);
    
    // Log to server
    const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
    sendClientErrorLog('Console Error: ' + message, null, { errorType: 'console_error' });
};

// Track user actions for breadcrumb
$(document).on('click', '[id], button, a', function() {
    const element = $(this);
    const id = element.attr('id') || element.attr('class') || element.prop('tagName');
    addBreadcrumb('click: ' + id);
});

$(document).on('submit', 'form', function() {
    addBreadcrumb('submit: ' + ($(this).attr('id') || 'form'));
});
       

function getDefaultPicByDept(deptKey, dataForm) {
    if (!deptKey) return null;
    if (!dataForm.pIC) return null;
    PIC_MAP = JSON.parse(dataForm.pIC || "{}");
    return PIC_MAP[deptKey] || null;
}



function makeSelectBoxEditorOptions(dataSource, acceptCustomValue = false ,gridInstance = null, dataSourceLookup = null) {
    return {
        editorType: "dxSelectBox",
        //dropDownOptions : { minWidth: 200 },
        //items: dataSource,
        dataSource: dataSource,
        valueExpr: 'id',
        displayExpr: 'value',
        searchEnabled: true,
        width: 300,
        acceptCustomValue: acceptCustomValue,
        onValueChanged: function (e) { // handle after select
            if (gridInstance != null) {
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
    }
}





function renderBranchOverlay(currentDept) {
    const formState = buildFormState();
    const choices = getNextChoices(currentDept, formState);

    if (!choices.length) {
        DevExpress.ui.notify("No valid route - please complete required fields", "warning", 1600);
        return;
    }

    const $canvas = $("#branchOverlay .branchCanvas");
    const $svg = $canvas.find("svg").first();

    // clear
    $svg.find("path").remove();
    $canvas.find(".bnode").remove();

    const nodeSize = 52;
    const xRootNode = 14;
    const xChoiceNode = 182;

    const xRootLine = 40;
    const xJ = 110;
    const xRightLine = 200;

    const canvasH = Math.max(140, choices.length * 70);
    $canvas.css("height", canvasH + "px");
    $svg.attr("viewBox", `0 0 260 ${canvasH}`);

    const yJ = canvasH / 2;
    const rootTop = Math.round(yJ - nodeSize / 2);

    $canvas.append(
        `<div class="bnode root current"
                      style="left:${xRootNode}px; top:${rootTop}px;"
                      title="Current role: ${currentDept}">
                    ${currentDept}
                 </div>`
    );

    const topPad = 14;
    const bottomPad = 14;
    const yMin = topPad + nodeSize / 2;
    const yMax = canvasH - bottomPad - nodeSize / 2;

    let ys;
    if (choices.length === 1) ys = [yJ];
    else if (choices.length === 2) ys = [yJ - 30, yJ + 30];
    else ys = choices.map((_, i) => yMin + i * ((yMax - yMin) / (choices.length - 1)));

    const addPath = (d) => $svg.append(`<path d="${d}" stroke="rgba(0,0,0,.22)" stroke-width="2" fill="none" />`);

    if (choices.length === 1) {
        addPath(`M${xRootLine} ${yJ} L${xRightLine} ${yJ}`);
    } else {
        addPath(`M${xRootLine} ${yJ} L${xJ} ${yJ}`);
        addPath(`M${xJ} ${ys[0]} L${xJ} ${ys[ys.length - 1]}`);
        ys.forEach(y => addPath(`M${xJ} ${y} L${xRightLine} ${y}`));
    }

    choices.forEach((dept, i) => {
        const yChoice = ys[i];
        const top = Math.round(yChoice - nodeSize / 2);
        const id = `route_${dept}`;

        $canvas.append(
            `<div id="${id}" class="bnode choice" style="left:${xChoiceNode}px; top:${top}px;" title="Route to ${dept}">${dept}</div>`
        );

        $(`#${id}`).off("click").on("click", () => routeTo(dept));
    });
}
function getValueByPath(obj, path) {
    if (!obj || !path) return undefined;
    return path.split(".").reduce((acc, key) => acc?.[key], obj);
}

function normalizeValueByDataType(value, dataType) {
    switch ((dataType || "").toLowerCase()) {
        case "boolean":
            if (typeof value === "boolean") return value;
            if (typeof value === "string") {
                const v = value.trim().toLowerCase();
                if (v === "true") return true;
                if (v === "false") return false;
            }
            return Boolean(value);

        case "number":
        case "int":
        case "decimal":
            if (value === null || value === undefined || value === "") return null;
            return Number(value);

        case "string":
            if (value === null || value === undefined) return "";
            return String(value);

        case "date":
        case "datetime":
            if (!value) return null;
            const d = new Date(value);
            return isNaN(d.getTime()) ? null : d;

        default:
            return value;
    }
}

function compareValues(left, operator, right, dataType) {
    const op = (operator || "").trim();

    if (dataType === "date" || dataType === "datetime") {
        const leftTime = left instanceof Date ? left.getTime() : null;
        const rightTime = right instanceof Date ? right.getTime() : null;

        switch (op) {
            case "=":
            case "==":
                return leftTime === rightTime;
            case "!=":
            case "<>":
                return leftTime !== rightTime;
            case ">":
                return leftTime > rightTime;
            case "<":
                return leftTime < rightTime;
            case ">=":
                return leftTime >= rightTime;
            case "<=":
                return leftTime <= rightTime;
            default:
                return false;
        }
    }

    switch (op) {
        case "=":
        case "==":
            return left === right;

        case "!=":
        case "<>":
            return left !== right;

        case ">":
            return left > right;

        case "<":
            return left < right;

        case ">=":
            return left >= right;

        case "<=":
            return left <= right;

        case "contains":
            if (Array.isArray(left)) return left.includes(right);
            return String(left ?? "").toLowerCase().includes(String(right ?? "").toLowerCase());

        case "notcontains":
            if (Array.isArray(left)) return !left.includes(right);
            return !String(left ?? "").toLowerCase().includes(String(right ?? "").toLowerCase());

        case "startswith":
            return String(left ?? "").toLowerCase().startsWith(String(right ?? "").toLowerCase());

        case "endswith":
            return String(left ?? "").toLowerCase().endsWith(String(right ?? "").toLowerCase());

        case "in":
            if (!Array.isArray(right)) return false;
            return right.includes(left);

        case "notin":
            if (!Array.isArray(right)) return false;
            return !right.includes(left);

        case "isnull":
            return left === null || left === undefined || left === "";

        case "isnotnull":
            return !(left === null || left === undefined || left === "");

        default:
            return false;
    }
}

function evaluateConditionRule(condition, formData) {
    if (!condition || typeof condition !== "object") return false;
    if (!condition.field) return true;
    const type = (condition.type || "").toLowerCase();
    const source = (condition.source || "").toLowerCase();

    //if (type !== "rule") return false;
    //if (source !== "payload") return false;

    const field = condition.field;
    const operator = condition.operator;
    const dataType = (condition.dataType || "").toLowerCase();
    const expectedValueRaw = condition.value;
    var actualValueRaw = null;
 
        actualValueRaw = getValueByPath(formData, field);


    const actualValue = normalizeValueByDataType(actualValueRaw, dataType);
    const expectedValue = normalizeValueByDataType(expectedValueRaw, dataType);

    return compareValues(actualValue, operator, expectedValue, dataType);
}

function openBranchOverlay(currentDept) {
    //const currentDept = stageDept || focusDept || "FO";
    renderBranchOverlay(currentDept);
    $("#branchOverlay").show();
}


async function libreConvert(id) {
    //const fileRes = await fetch(`/api/Document/LibreConvert/${id}`);
    //get file
    $.ajax({
        url: `/api/Document/LibreConvert/${id}`,
        method: "GET",
        xhrFields: {
            withCredentials: true,
            responseType: "blob"
        },
        success: function (blob) {
            const popup = makePopup("large", "Res");

            popup.option({
                width: "80vw",
                height: "90vh",
                title: "Word Preview",
                contentTemplate(container) {
                   
                    $("<iframe>")
                        .attr("id", `pdfViewer_${id}`)
                        .attr("src", "")
                        .css({
                            width: "100%",
                            height: "600px",
                            border: "1px solid #ccc"
                        })
                        .appendTo(container);
                    const fileURL = URL.createObjectURL(blob);
                    $(`#pdfViewer_${id}`).attr("src", fileURL);
                   
                }
            });

            popup.show();
            
            //const url = window.URL.createObjectURL(blob);
            //const tabName = `pdfPreviewTab_${id}`;
            //const existingTab = window.open('', tabName);

            //if (existingTab) {
            //    existingTab.location.href = url;
            //} else {
            //    window.open(url, tabName);
            //}

            //window.URL.revokeObjectURL(url);
        },
        error: function (xhr, status, error) {
            appNotifyWarning("Call Libre fail!.");
        }
    });

}

async function openExcelPreviewPopup(id) {
    var popupInstance = makePopup("large", "Res");
    popupInstance.option({
        width: "90vw",
        height: "90vh",
        showTitle: true,
        title: "Excel Preview",
        dragEnabled: true,
        resizeEnabled: true,
        contentTemplate: function (container) {
            const $container = $(container);

            const $wrapper = $("<div>").css({
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden"
            }).appendTo($container);

            const $toolbar = $("<div>").css({
                padding: "8px 12px",
                borderBottom: "1px solid #ddd",
                display: "flex",
                gap: "8px",
                alignItems: "center",
                flexShrink: 0
            }).appendTo($wrapper);

            const $sheetSelect = $("<div>").css({
                width: "260px"
            }).appendTo($toolbar);

            const $body = $("<div>").attr("id", "excelPreviewBody").css({
                flex: 1,
                overflow: "auto",
                padding: "12px",
                background: "#fff"
            }).appendTo($wrapper);

            $body.html("<div style='padding:20px'>Loading...</div>");

            (async function () {
                try {
                    const fileRes = await fetch(`/api/Document/StreamDocument?id=${id}`);
                   
                    const arrayBuffer = await fileRes.arrayBuffer();

                    // 4. đọc workbook
                    const workbook = XLSX.read(arrayBuffer, {
                        type: "array",
                        cellStyles: true,
                        cellDates: true
                    });

                    function renderSheet(sheetName) {
                        const sheet = workbook.Sheets[sheetName];
                        if (!sheet) return;

                        // HTML cơ bản từ SheetJS
                        let html = XLSX.utils.sheet_to_html(sheet, {
                            editable: false
                        });

                        $body.html(`
                            <div class="excel-html-wrap" style="overflow:auto;width:100%;height:100%">
                                ${html}
                            </div>
                        `);

                        // style tăng trải nghiệm nhìn giống grid hơn
                        $body.find("table").css({
                            borderCollapse: "collapse",
                            width: "max-content",
                            minWidth: "100%",
                            background: "#fff"
                        });

                        $body.find("th, td").css({
                            border: "1px solid #dcdcdc",
                            padding: "6px 10px",
                            whiteSpace: "nowrap",
                            verticalAlign: "middle"
                        });

                        $body.find("tr:nth-child(even)").css({
                            background: "#fafafa"
                        });
                    }

                    // 5. dropdown chọn sheet
                    $sheetSelect.dxSelectBox({
                        dataSource: workbook.SheetNames,
                        value: workbook.SheetNames[0],
                        placeholder: "Select sheet",
                        onValueChanged: function (e) {
                            renderSheet(e.value);
                        }
                    });

                    // render sheet đầu tiên
                    renderSheet(workbook.SheetNames[0]);

                } catch (err) {
                    console.error(err);
                    $body.html(`<div style="padding:20px;color:red;">${err.message}</div>`);
                }
            })();
        }
    });

    popupInstance.show();
}
async function openWordPreviewPopup(id) {
    const popup = makePopup("large", "Res");

    popup.option({
        width: "80vw",
        height: "90vh",
        title: "Word Preview",
        contentTemplate(container) {
            const $host = $("<div>")
                .css({
                    width: "100%",
                    height: "100%",
                    overflow: "auto",
                    padding: 20,
                    background: "#f5f6f8"
                })
                .html("Loading...")
                .appendTo(container);

            fetch(`/api/Document/StreamDocument?id=${id}`)
                .then(r => {
                    if (!r.ok) throw new Error(`Load file thất bại: ${r.status}`);
                    return r.blob();
                })
                .then(blob => {
                    const docEl = $("<div>")
                        .css({
                            background: "#fff",
                            padding: 40,
                            margin: "0 auto",
                            maxWidth: 900,
                            boxShadow: "0 4px 20px rgba(0,0,0,0.1)"
                        })[0];

                    $host.empty().append(docEl);

                    return docx.renderAsync(blob, docEl, null, {
                        className: "docx",
                        inWrapper: true,
                        breakPages: true
                    });
                })
                .catch(err => {
                    console.error(err);
                    $host.html(`<div style="padding:20px;color:red;">${err.message}</div>`);
                });
        }
    });

    popup.show();
}

async function openImagePreviewPopup(id) {
    const popup = makePopup("large", "Res");
    popup.option({
        width: "80vw",
        height: "90vh",
        title: "Image Preview",
        contentTemplate(container) {
            var scrollContent = popupStandardContentByScroll($("<img>")
                .attr("src", `/api/Document/StreamDocument?id=${id}`)
                .css({ width: '100%', height: 'auto', objectFit: 'cover', borderRadius: '5px' }));
            scrollContent.appendTo(container);
        }
    });
    popup.show();
}
function makePopupWithScroll($element,$size,$label) {
    const popup = makePopup($size, $label);
    popup.option({
        width: "80vw",
        height: "90vh",
        contentTemplate(container) {
            var scrollContent = popupStandardContentByScroll($element);
            scrollContent.appendTo(container);
        }
    });
    return popup;
}

async function openWordMammothPopup(id) {
    const popup = makePopup("large", "Res");
    popup.option({
        width: "70vw",
        height: "85vh",
        title: "Word Text Preview",
        contentTemplate(container) {
            const $host = $("<div>").css({
                width: "100%",
                height: "100%",
                overflow: "auto",
                padding: "20px",
                background: "#fff",
                lineHeight: "1.6",
                fontFamily: "Calibri, Arial"
            }).html("Loading...").appendTo(container);

            (async () => {
                try {
                    // 1. fetch binary từ API của bạn

                    const res = await fetch(`/api/Document/StreamDocument?id=${id}`);
                    if (!res.ok) throw new Error(`Load file thất bại: ${res.status}`);

                    const arrayBuffer = await res.arrayBuffer();

                    // 2. convert docx → HTML
                    const result = await mammoth.convertToHtml({ arrayBuffer });

                    // 3. render HTML
                    $host.html(result.value);

                    // 4. log warning nếu có
                    if (result.messages && result.messages.length) {
                        console.warn("Mammoth warnings:", result.messages);
                    }

                } catch (err) {
                    console.error(err);
                    $host.html(`<div style="color:red;">${err.message}</div>`);
                }
            })();
        }
    });

    popup.show();
}


function openMessageDialog(item) {

    const createdText = fmtTimeLocal(item.createdDate);
    const title = escapeHtml(item.title || "Message");
    // ưu tiên message; nếu bạn có field khác như item.body/item.content thì thay ở đây
    const body = escapeHtml(item.message || "");
    var popup = makePopup("small", "Title")

    popup.option("contentTemplate", function (container) {
        return `
        <div class="msg-meta">
          ${createdText ? `Subject date: ${createdText}` : ""}
        </div>
        <div class="msg-body">${body || "(empty)"}</div>
      `;
    });
    popup.show();
}