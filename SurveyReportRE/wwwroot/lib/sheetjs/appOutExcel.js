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
        //var output = to_json(wb);
        var output = to_csv(wb);
        //var jsonData = JSON.parse(output);
        //var ds = Object.keys(output)[0];
        //var containerTable = document.getElementById('out-import-next');
        //// init hansontable
        //var hot = new Handsontable(containerTable, {
        //    rowHeaders: true,
        //    colHeaders: true,
        //    contextMenu: true,
        //    data: JSON.parse(output)
        //});
        // load excel data, afterChange() will auto submit Save to server
        //hot.loadData(ds);
        // call submit
        //var data = hot.getData();
        var data = JSON.stringify(csvToJSON(output));
        var loadpn = $("<div>").appendTo($("#out-import-next")).dxLoadPanel({ visible: true }).dxLoadPanel("instance");;
        $.ajax({
            url: `${constHostName}api/SaleOrderLineApi/ImportNextSBD`,
            headers: {'Content-Type': 'application/json'},
            type: 'POST',
            data: data,
            success: function (result) {
                var message = "";
                if (result.Valid != "" && result.Valid != undefined)
                    message += `Import SBD Next successfull for CustomerPO: ${result.Valid}`;
                if (result.inValid != "" && result.inValid != undefined)
                    message += `\r\nImport SBD Next failed for CustomerPO: ${result.inValid}`;
                if (result.notFound != "" && result.notFound != undefined)
                    message += `\r\nImport SBD Next, Not found CustomerPO: ${result.notFound}`;

                if (message != "") {
                    loadpn.hide(); 
                    DevExpress.ui.dialog.alert(message, "Import Status");
                }
                else {
                    loadpn.hide();
                    $.each(result, function (i, item) {
                        message += `<p>${i}: ${item}</p><br>`;
                    });
                    try {
                        $("<div>").appendTo($("body")).dxPopup({
                            title: "", width: "60%", height: "80%",
                            contentTemplate: function (container) {
                                return container.css("overflow","auto").append(message);
                            }
                        }).dxPopup("instance").show();
                    }
                    catch (err) {
                        appNotify({ type: "error", message: err.responseText });
                    }

                   
                }         
            },
            error: function (e) {
                loadpn.hide();
                appNotify({ type: "error", message: e.responseText });
            }
        });
    };

    function csvToJSON(csv) {
        var lines = csv.split("\n");
        var result = [];
        for (var i = 1; i < lines.length; i++) {
            var currentline = lines[i].split(",");
            result.push(currentline);
        }

        //return result; //JavaScript object
        return JSON.stringify(result); //JSON
    }
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

