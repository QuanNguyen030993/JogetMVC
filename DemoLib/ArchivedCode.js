
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



//View chart diagram archived code

// function removeSelectedNode() {
//     if (!selectedNodeId) {
//         setStatus("No node selected.");
//         return;
//     }

//     const data = getData();
//     data.workflowNodes = (data.workflowNodes || []).filter(n => n.id !== selectedNodeId);
//     data.workflowTransitions = (data.workflowTransitions || []).filter(t =>
//         t.fromNodeId !== selectedNodeId && t.toNodeId !== selectedNodeId
//     );

//     if (data.runtimeState) {
//         if (data.runtimeState.activeNodeId === selectedNodeId) {
//             data.runtimeState.activeNodeId = "";
//         }
//         data.runtimeState.completedNodeIds = (data.runtimeState.completedNodeIds || []).filter(x => x !== selectedNodeId);
//         data.runtimeState.pendingNodeIds = (data.runtimeState.pendingNodeIds || []).filter(x => x !== selectedNodeId);
//     }

//     setData(data);
//     clearSelections();
//     renderWorkflow();
//     setStatus("Deleted node: " + selectedNodeId);
// }

// function removeSelectedTransition() {
//     if (!selectedTransitionKey) {
//         setStatus("No transition selected.");
//         return;
//     }

//     const data = getData();
//     data.workflowTransitions = (data.workflowTransitions || []).filter(t => makeTransitionKey(t) !== selectedTransitionKey);
//     setData(data);
//     const deletedKey = selectedTransitionKey;
//     clearSelections();
//     renderWorkflow();
//     setStatus("Deleted transition: " + deletedKey);
// }

// function simpleAutoLayout(data) {
//     const map = {};
//     const childrenMap = {};

//     (data.workflowNodes || []).forEach(n => {
//         map[n.id] = n;
//         childrenMap[n.id] = [];
//     });

//     (data.workflowNodes || []).forEach(n => {
//         if (n.parentId && childrenMap[n.parentId]) {
//             childrenMap[n.parentId].push(n);
//         }
//     });

//     const roots = (data.workflowNodes || []).filter(n => !n.parentId);
//     const levels = [];
//     const visited = new Set();

//     function dfs(node, level) {
//         if (!node || visited.has(node.id)) return;
//         visited.add(node.id);
//         if (!levels[level]) levels[level] = [];
//         levels[level].push(node);
//         (childrenMap[node.id] || []).forEach(child => dfs(child, level + 1));
//     }

//     roots.forEach(r => dfs(r, 0));

//     levels.forEach((arr, level) => {
//         arr.forEach((node, i) => {
//             node.x = 120 + level * 300;
//             node.y = 120 + i * 180;
//         });
//     });

//     const remain = (data.workflowNodes || []).filter(n => !visited.has(n.id));

//     remain.forEach((n, i) => {
//         n.x = 120;
//         n.y = 120 + (levels.flat().length + i) * 140;
//     });
// }

// function bindConnectionEvent() {
//     instance.bind("connection", function (info, originalEvent) {
//         if (!originalEvent) return;

//         const sourceId = info.sourceId;
//         const targetId = info.targetId;
//         const data = getData();

//         const exists = (data.workflowTransitions || []).some(t =>
//             t.fromNodeId === sourceId &&
//             t.toNodeId === targetId
//         );

//         if (exists) {
//             setStatus("Transition already exists: " + sourceId + " -> " + targetId);
//             return;
//         }

//         const sourceNode = (data.workflowNodes || []).find(n => n.id === sourceId);
//         const targetNode = (data.workflowNodes || []).find(n => n.id === targetId);

//         const actionCode = "ACTION_" + ((data.workflowTransitions || []).length + 1);
//         const actionName = sourceNode && targetNode
//             ? (sourceNode.nodeName + " To " + targetNode.nodeName)
//             : "New Transition";

//         const transition = {
//             fromNodeId: sourceId,
//             toNodeId: targetId,
//             actionCode: actionCode,
//             actionName: actionName,
//             flowType: (targetNode && targetNode.flowType) || "Both",
//             isReturn: false,
//             isLoop: sourceId === targetId,
//             loopGroup: sourceId === targetId ? ((sourceNode && sourceNode.loopGroup) || "") : "",
//             loopExitMode: sourceId === targetId ? "UserDecision" : "None",
//             maxLoopCount: null,
//             isExitTransition: false,
//             userDecisionLabel: sourceId === targetId ? "Loop" : "",
//             conditionJson: ""
//         };

//         data.workflowTransitions.push(transition);
//         setData(data);

//         setStatus("Added transition: " + sourceId + " -> " + targetId);
//         renderWorkflow();
//     });
// }

// function render() {
//     const data = getData();

//     canvas.innerHTML = "";

//     if (instance) instance.reset();

//     instance = jsPlumb.getInstance({
//         Container: canvas
//     });

//     instance.importDefaults({
//         ConnectionsDetachable: false,
//         ReattachConnections: true
//     });

//     bindConnectionEvent();

//     (data.workflowNodes || []).forEach(function (node) {
//         const el = createNodeElement(node, data.runtimeState || {});
//         canvas.appendChild(el);
//     });

//     (data.workflowNodes || []).forEach(function (node) {
//         registerEndpoints(node.id);
//     });

//     renderTransitions(data);

//     setStatus(
//         "Rendered " +
//         (data.workflowNodes || []).length +
//         " nodes / " +
//         (data.workflowTransitions || []).length +
//         " transitions."
//     );
// }
// function createNodeElement(node, runtimeState) {
//     const el = document.createElement("div");
//     el.id = node.id;
//     el.className = "node";

//     if (node.allowLoop) el.classList.add("allowLoopNode");
//     if (runtimeState?.activeNodeId === node.id) el.classList.add("activeNode");
//     if ((runtimeState?.completedNodeIds || []).includes(node.id)) el.classList.add("completedNode");
//     if ((runtimeState?.pendingNodeIds || []).includes(node.id)) el.classList.add("pendingNode");

//     el.style.left = (node.x ?? 0) + "px";
//     el.style.top = (node.y ?? 0) + "px";

//     el.innerHTML = `
//         <div class="nodeTitle">${node.nodeName || node.id}</div>
//         <div class="nodeMeta">
//             <span class="meta">#${node.orderNo ?? ""}</span>
//             <span class="meta ${normalizeFlowClass(node.flowType)}">${node.flowType || "Both"}</span>
//             ${node.levelNo != null ? `<span class="meta">L${node.levelNo}</span>` : ""}
//             ${node.loopGroup ? `<span class="meta">Loop:${node.loopGroup}</span>` : ""}
//         </div>
//     `;

//     el.addEventListener("click", function (ev) {
//         ev.stopPropagation();
//         clearNodeSelection();
//         el.classList.add("selected");
//         selectedNodeId = node.id;
//         selectedTransitionKey = null;
//         setInfo(node, "NODE");
//     });

//     return el;
// }
// function registerEndpoints(nodeId) {
//     instance.makeSource(nodeId, {
//         filter: ".nodeTitle",
//         anchor: "Continuous",
//         connector: ["Flowchart", { cornerRadius: 10, stub: 24 }],
//         connectorStyle: { stroke: "#64748b", strokeWidth: 2 },
//         maxConnections: -1
//     });

//     instance.makeTarget(nodeId, {
//         anchor: "Continuous",
//         allowLoopback: true
//     });

//     instance.draggable(nodeId, {
//         grid: [12, 12],
//         stop: function () {
//             savePositions();
//         }
//     });
// }
// document.getElementById("btnAutoLayout").addEventListener("click", () => {
//   try {
//     var tmp = JSON.parse(jsonInput.value);
//     (tmp.workflowNodes || []).forEach(n => {
//       n.x = null;
//       n.y = null;
//     });
//     jsonInput.value = JSON.stringify(tmp, null, 2);
//     renderWorkflow({ forceAuto: true });
//   } catch (err) {
//     errorBox.style.display = "block";
//     errorBox.textContent = err && err.stack ? err.stack : String(err);
//   }
// });
// function buildConnectionsFromNodes(nodes) {
//     const edges = [];

//     nodes.forEach(n => {
//         if (n.parentId) {
//             edges.push({
//                 source: n.parentId,
//                 target: n.id
//             });
//         }
//     });

//     return edges;
// }

// function cloneJson(obj) {
//   return JSON.parse(JSON.stringify(obj));
// }
// var statusBar = document.getElementById("statusBar_@Convert.ToInt32(ViewData["Id"])");
// var infoBox = document.getElementById("infoBox_@Convert.ToInt32(ViewData["Id"])");

// let instance = null;
// let selectedNodeId = null;
// let selectedTransitionKey = null;

// function setStatus(text) {
//     statusBar.textContent = text;
// }

// function setInfo(obj, title) {
//     infoBox.textContent = title + "\n\n" + JSON.stringify(obj, null, 2);
// }
//function normalizeFlowClass(flowType) {
//    if (flowType === "Quotation") return "flow-quotation";
//    if (flowType === "PolicyIssuance" || flowType === "Policy Issuance") return "flow-policy";
//    return "flow-both";
//}
// var def = currentJson.workflowDefinition || {};
// wfCode.textContent = "Workflow: " + safe(def.workflowCode || "-");
// flowType.textContent = "Flow: " + safe(def.flowType || "-");
// currentStep.textContent = "Current: " + safe(currentJson.runtimeState?.activeNodeId || "-");
// layoutMode.textContent = "Layout: " + (useSavedLayout ? "saved x,y" : "auto layout");


// function buildAutoLayout(json) {
//   const nodes = json.workflowNodes || [];
//   const transitions = json.workflowTransitions || [];

//   const nodeMap = new Map(nodes.map(n => [n.id, n]));
//   const graph = new Map();

//   nodes.forEach(n => graph.set(n.id, []));

//   // 🔥 Build graph SAFE (lọc edge gây loop)
//   transitions.forEach(t => {
//     if (!nodeMap.has(t.fromNodeId) || !nodeMap.has(t.toNodeId)) return;

//     // ❌ loại self loop
//     if (t.fromNodeId === t.toNodeId) return;

//     // ❌ loại return / loop
//     if (t.isReturn || t.isLoop) return;

// // ❌ loại backward edge (quan trọng)
// const from = nodeMap.get(t.fromNodeId);
// const to = nodeMap.get(t.toNodeId);
// if ((to.orderNo || 0) <= (from.orderNo || 0)) return;

//     graph.get(t.fromNodeId).push(t.toNodeId);
//   });

//   // 🔥 BFS layer (KHÔNG BAO GIỜ LOOP)
//   const layerMap = new Map();
//   const queue = [];

//   // root = node không có parent hoặc indegree = 0
//   const indegree = new Map();
//   nodes.forEach(n => indegree.set(n.id, 0));

//   graph.forEach((tos, from) => {
//     tos.forEach(to => indegree.set(to, indegree.get(to) + 1));
//   });

//   const roots = nodes.filter(n => indegree.get(n.id) === 0);

//   (roots.length ? roots : nodes.slice(0, 1)).forEach(r => {
//     layerMap.set(r.id, 0);
//     queue.push(r.id);
//   });

//   const visited = new Set();

//   while (queue.length) {
//     const current = queue.shift();
//     if (visited.has(current)) continue;
//     visited.add(current);

//     const currentLayer = layerMap.get(current) || 0;

//     (graph.get(current) || []).forEach(to => {
//       if (!layerMap.has(to)) {
//         layerMap.set(to, currentLayer + 1);
//         queue.push(to);
//       }
//     });
//   }

//   // 🔥 fallback cho node bị cycle / không reachable
//   nodes.forEach(n => {
//     if (!layerMap.has(n.id)) {
//       layerMap.set(n.id, 0); // hoặc max + 1 nếu muốn đẩy xuống cuối
//     }
//   });

// // 🔥 group theo layer
//       const grouped = {};
//       nodes.forEach(n => {
//         const layer = layerMap.get(n.id) || 0;
//         if (!grouped[layer]) grouped[layer] = [];
//         grouped[layer].push(n);
//       });

//       Object.keys(grouped).forEach(layer => {
//         grouped[layer].sort((a, b) => (a.orderNo || 9999) - (b.orderNo || 9999));
//       });

// // 🔥 layout position
//   const startX = 96;
//   const startY = 110;
//   const colGap = 280;
//   const rowGap = 150;


//   const SCALE_X = 1.9;   // ← Điều chỉnh để giãn ngang
//   const SCALE_Y = 2.0;   // ← Điều chỉnh để giãn dọc

//   const positions = {};

//   Object.keys(grouped)
//     .map(Number)
//     .sort((a, b) => a - b)
//     .forEach(layer => {
//       const arr = grouped[layer];
//       const totalHeight = (arr.length - 1) * rowGap;
//       const baseY = Math.max(startY, 200 - totalHeight / 2);

//       arr.forEach((n, index) => {
//         positions[n.id] = {
//           x: n.posX ? n.posX * SCALE_X : startX + layer * colGap,
//           y: n.posY ? n.posY * SCALE_Y : baseY + index * rowGap,
//           layer
//         };
//       });
//     });

//   const maxLayer = Math.max(...Object.keys(grouped).map(Number));
//   const maxCount = Math.max(...Object.values(grouped).map(a => a.length));

//   return {
//     positions,
//     grouped,
//     canvasWidth: startX + (maxLayer + 1) * colGap + 300,
//     canvasHeight: Math.max(760, startY + maxCount * rowGap + 260)
//   };
// }


// function renderTransitions(data) {
//     (data.workflowTransitions || []).forEach(function (t) {
//         const style = getTransitionStyle(t);

//         const conn = instance.connect({
//             source: t.fromNodeId,
//             target: t.toNodeId,
//             anchors: t.fromNodeId === t.toNodeId ? ["Top", "Right"] : ["Continuous", "Continuous"],
//             connector: getConnectorConfig(t),
//             paintStyle: style,
//             endpoint: "Dot",
//             endpointStyle: { radius: 4, fill: style.stroke },
//             overlays: [
//                 ["Arrow", { width: 10, length: 10, location: 1, foldback: 0.8 }],
//                 ["Label", {
//                     label: getTransitionLabel(t),
//                     location: 0.5,
//                     cssClass: "aLabel"
//                 }]
//             ]
//         });

//         conn.__transitionData = t;
//         conn.__transitionKey = makeTransitionKey(t);

//         conn.bind("click", function (connection, ev) {
//             if (ev) ev.stopPropagation();
//             selectedTransitionKey = conn.__transitionKey;
//             selectedNodeId = null;
//             clearNodeSelection();
//             // setInfo(t, "TRANSITION");
//             setStatus("Selected transition: " + (t.actionCode || ""));
//         });
//     });
// }

// function savePositions() {
//     const data = getData();
//     (data.workflowNodes || []).forEach(function (n) {
//         const el = document.getElementById(n.id);
//         if (!el) return;

//         n.x = parseInt(el.style.left, 10) || 0;
//         n.y = parseInt(el.style.top, 10) || 0;
//     });
//     setData(data);
//     setStatus("Saved x,y back to workflowNodes.");
// }
// function getTransitionLabel(t) {
//     return t.userDecisionLabel || t.actionName || t.actionCode || "";
// }

// function makeTransitionKey(t) {
//     return [t.fromNodeId, t.toNodeId, t.actionCode || "", t.actionName || ""].join("||");
// }



// function getTransitionStyle(t) {
//     if (t.isExitTransition) {
//         return { stroke: "#7c3aed", strokeWidth: 3, dashstyle: "2 0" };
//     }
//     if (t.isLoop) {
//         return { stroke: "#ea580c", strokeWidth: 3, dashstyle: "4 2" };
//     }
//     if (t.isReturn) {
//         return { stroke: "#dc2626", strokeWidth: 2, dashstyle: "6 3" };
//     }
//     return { stroke: "#64748b", strokeWidth: 2, dashstyle: "2 0" };
// }

// function getConnectorConfig(t) {
//     if (t.fromNodeId === t.toNodeId) {
//         return ["StateMachine", { margin: 6, curviness: 40 }];
//     }
//     if (t.isReturn) {
//         return ["Bezier", { curviness: 90 }];
//     }
//     if (t.isLoop) {
//         return ["Bezier", { curviness: 70 }];
//     }
//     return ["Flowchart", { cornerRadius: 10, stub: 24 }];
// }