/* xlsx.js (C) 2013-present  SheetJS -- http://sheetjs.com */
//var XLSX = require('../../'); // test against development version
//var XLSX = require('xlsx'); // use in production
/*jshint browser:true */
/*global require */
var XW = {
    /* worker message */
    msg: 'xlsx',
    /* worker scripts */
    worker: './lib/sheetjs/xlsxworker.js'
};
var X = XLSX;
var global_wb;
var $gridInstance = $("<div>").addClass("grid").appendTo($("#out"));
var lsReportName = [];
var process_wb = (function () {
    var OUT = document.getElementById('out');
    var HTMLOUT = document.getElementById('htmlout');

    var get_format = (function () {
        var radios = document.getElementsByName("format");
        return function () {
            for (var i = 0; i < radios.length; ++i) if (radios[i].checked || radios.length === 1) return radios[i].value;
        };
    })();

    var to_json = function to_json(workbook) {
        var result = {};
        workbook.SheetNames.forEach(function (sheetName) {
            var roa = X.utils.sheet_to_json(workbook.Sheets[sheetName]);
            if (roa.length) result[sheetName] = roa;
        });
        return JSON.stringify(result, 2, 2);
    };

    var to_csv = function to_csv(workbook) {
        var result = [];
        workbook.SheetNames.forEach(function (sheetName) {
            var csv = X.utils.sheet_to_csv(workbook.Sheets[sheetName]);
            if (csv.length) {
                result.push("SHEET: " + sheetName);
                result.push("");
                result.push(csv);
            }
        });
        return result.join("\n");
    };

    var to_fmla = function to_fmla(workbook) {
        var result = [];
        workbook.SheetNames.forEach(function (sheetName) {
            var formulae = X.utils.get_formulae(workbook.Sheets[sheetName]);
            if (formulae.length) {
                result.push("SHEET: " + sheetName);
                result.push("");
                result.push(formulae.join("\n"));
            }
        });
        return result.join("\n");
    };

    var to_html = function to_html(workbook) {
        HTMLOUT.innerHTML = "";
        workbook.SheetNames.forEach(function (sheetName) {
            var htmlstr = X.write(workbook, { sheet: sheetName, type: 'string', bookType: 'html' });
            HTMLOUT.innerHTML += htmlstr;
        });
        return "";
    };

    var buildApiUri = function (methodName, apiName, sysObjectCode, efName) {
        switch (apiName) {
            case "GridApi":
                return "/api/" + apiName + "/" + methodName + "/" + efName
            case "GridEDQApi":
                return "/api/" + apiName + "/vvvvvvvvvvvvvvvvvvvvvvvvvvvvvv" + methodName + "/" + sysObjectCode
            default:
                return "/api/" + apiName + "/" + methodName
        }
    };

    function readJson() {
        var json;
        $.ajax({
            url: "../js/data/entitylookupconfig.js",
            dataType: "text",
            async: false,
            success: function (data) {
                json = JSON.parse(data);

            }
        });
        return json;
    };

    return function process_wb(wb) {
        global_wb = wb;
        var output = to_json(wb);
        var jsonData = JSON.parse(output);
        var ds = jsonData[Object.keys(jsonData)[0]];
        if ($gridInstance != null)
            $gridInstance.remove();
        $gridInstance = $("<div>").addClass("grid").appendTo($("#out"));
        var gridInstance = $gridInstance.dxDataGrid({
            paging: { enabled: true, pageSize: 10000 }, pager: { showPageSizeSelector: true, showInfo: true },
            filterRow: { visible: true }, groupPanel: { visible: true }, grouping: { autoExpandAll: false },
            editing: { mode: "batch", allowUpdating: true, allowAdding: true, allowDeleting: true },
            dataSource: ds,
            height: "600px",
            scrolling: {
                mode: "virtual"
            },
            export: {
                allowExportSelectedData: true,
                enabled: true,
                excelFilterEnable: false,
                excelWrapTextEnable: false,
                fileName: wb.SheetNames[0],
                texts: { exportAll: 'Export all', exportSelectedRows: 'Export selected rows', exportTo: 'Export' }
            },
            deferRendering: false,
            customizeColumns: function (columns) {
                $.each(columns, function (i, col) {
                    col.caption = col.dataField;
                    var lookup = configImport($('#entityName').val(), col.dataField);
                    if (lookup != null) {
                        col.lookup = lookup;
                    }

                });
                columns.unshift({ dataField: "ImportStatus", width: 200 });
            },
            onToolbarPreparing: function (e) {
                try {
                    var that = this;
                    var dataGrid = e.component;
                    e.toolbarOptions.items.unshift({
                        location: "after",
                        widget: "dxButton",
                        options: {
                            text: "Submit",
                            icon: "arrowup",
                            onClick: function () {
                                var ds = dataGrid.option("dataSource");
                                var apiName = $('#entityName').val() + "Api";
                                var entityName = $('#entityName').val();
                                var url = `${constHostName}api/${apiName}/Import`;
                                var json = readJson();
                                var xlf = document.getElementById('xlf');
                                var objs = $.grep(json, function (x, i) {
                                    return x.entityName == entityName;
                                });
                                if (lsReportName.indexOf(xlf.files[0].name) < 0) {

                                    //if (apiName == "BOMApi") {
                                    //    url = `${constHostName}api/${apiName}/PostImportBOM`
                                    //}
                                    //else if (apiName == "BOMLineApi") {
                                    //    url = `${constHostName}api/${apiName}/PostImportBOMLine`
                                    //}
                                    //else if (apiName == "POMaterialApi") {
                                    //    url = `${constHostName}api/${apiName}/Import`
                                    //}
                                    //else if (apiName == "POMaterialLineApi") {
                                    //    url = `${constHostName}api/${apiName}/Import`
                                    //}
                                    //else if (apiName == "POMaterialPIApi") {
                                    //    url = `${constHostName}api/${apiName}/Import`
                                    //}
                                    //else if (apiName == "POMaterialLineReceiptApi") {
                                    //    url = `${constHostName}api/${apiName}/Import`
                                    //}
                                    //else if (apiName == "CostSheetApi") {
                                    //    url = `${constHostName}api/${apiName}/Import`
                                    //} else if (apiName == "CostSheetLineApi") {
                                    //    url = `${constHostName}api/${apiName}/Import`
                                    //} else if (apiName == "VasCheckListReceiptApi") {
                                    //    url = `${constHostName}api/SaleOrderLineApi/UpdateVasCheckListReceipt`
                                    //}

                                    $.each(ds, function (i, element) {
                                        var item = $.extend(true, {}, element);

                                        $.each(objs, function (j, val) {
                                            var innerValue = dataGrid.getCellElement(i, val.dataField) == null ? "" : dataGrid.getCellElement(i, val.dataField)[0].innerText;
                                            item[val.dataField] = parseInt(innerValue, 10);
                                        });

                                        // .replace("\\\"", "''") -> this command is fixing of special character "
                                        var submitData = JSON.stringify(item).replace("\\\"", "''");
                                        submitData = submitData.replace(/(\r\n|\n|\r)/gm, " ");
                                        $.ajax({
                                            url: url,
                                            headers: { 'Content-Type': 'application/json' },
                                            data: JSON.stringify(submitData),
                                            type: 'POST',
                                            async: false
                                        })
                                            .done(function (values, key) {
                                                //handle success
                                                gridInstance.cellValue(i, "ImportStatus", "Succeeded");
                                            })
                                            .fail(function (error) {
                                                //handle error
                                                gridInstance.cellValue(i, "ImportStatus", error.responseText);
                                            });
                                    });
                                    lsReportName.push(xlf.files[0].name);
                                }
                                else {
                                    alert("File was imported");
                                }
                            },
                        }
                    });
                }
                catch (err) {
                    appErrorHandling('Library error: call onToolbarPreparing was failed.', err);
                    return;
                }
            }
        }).dxDataGrid("instance");
    };
    function configImport(entityName, dataField) {
        var json = readJson();
        var obj = json.find(x => x.entityName == entityName && x.dataField == dataField);
        if (obj != null) {
            var x = {
                valueExpr: obj.valueExpr,
                displayExpr: obj.displayExpr,
                dataSource: {
                    store: DevExpress.data.AspNet.createStore({
                        key: obj.key, loadUrl: `${constHostName}${obj.loadUrl}`
                    })
                }
            }
            return x;
        }
        else
            return null
    };
})();




var setfmt = window.setfmt = function setfmt() { if (global_wb) process_wb(global_wb); };

var b64it = window.b64it = (function () {
    var tarea = document.getElementById('b64data');
    return function b64it() {
        if (typeof console !== 'undefined') console.log("onload", new Date());
        var wb = X.read(tarea.value, { type: 'base64', WTF: false });
        process_wb(wb);
    };
})();

var do_file = (function () {
    var rABS = typeof FileReader !== "undefined" && (FileReader.prototype || {}).readAsBinaryString;
    //var domrabs = document.getElementsByName("userabs")[0];
    //if (!rABS) domrabs.disabled = !(domrabs.checked = false);

    var use_worker = typeof Worker !== 'undefined';
    //var domwork = document.getElementsByName("useworker")[0];
    //if (!use_worker) domwork.disabled = !(domwork.checked = false);

    var xw = function xw(data, cb) {
        var worker = new Worker(XW.worker);
        worker.onmessage = function (e) {
            switch (e.data.t) {
                case 'ready': break;
                case 'e': console.error(e.data.d); break;
                case XW.msg: cb(JSON.parse(e.data.d)); break;
            }
        };
        worker.postMessage({ d: data, b: rABS ? 'binary' : 'array' });
    };

    return function do_file(files) {
        //rABS = domrabs.checked;
        //use_worker = domwork.checked;
        var f = files[0];
        var reader = new FileReader();
        reader.onload = function (e) {
            if (typeof console !== 'undefined') console.log("onload", new Date(), rABS, use_worker);
            var data = e.target.result;
            if (!rABS) data = new Uint8Array(data);
            if (use_worker) xw(data, process_wb);
            else process_wb(X.read(data, { type: rABS ? 'binary' : 'array' }));
        };
        if (rABS) reader.readAsBinaryString(f);
        else reader.readAsArrayBuffer(f);
    };
})();

(function () {
    var drop = document.getElementById('drop');
    if (!drop.addEventListener) return;

    function handleDrop(e) {
        e.stopPropagation();
        e.preventDefault();
        do_file(e.dataTransfer.files);
    }

    function handleDragover(e) {
        e.stopPropagation();
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    }

    drop.addEventListener('dragenter', handleDragover, false);
    drop.addEventListener('dragover', handleDragover, false);
    drop.addEventListener('drop', handleDrop, false);
})();

(function () {
    var xlf = document.getElementById('xlf');
    if (!xlf.addEventListener) return;
    function handleFile(e) { do_file(e.target.files); }
    xlf.addEventListener('change', handleFile, false);
})();

