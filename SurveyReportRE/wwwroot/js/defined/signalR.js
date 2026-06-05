let signalRMessageCount = 0;

function setSignalRStatus(status) {

    const panel = $("#signalRMonitor");

    panel.removeClass(
        "signalr-connected signalr-reconnecting signalr-disconnected"
    );

    switch (status) {

        case "connected":
            panel.addClass("signalr-connected");
            panel.find(".signalr-text").text("Online");
            break;

        case "reconnecting":
            panel.addClass("signalr-reconnecting");
            panel.find(".signalr-text").text("Reconnecting");
            break;

        default:
            panel.addClass("signalr-disconnected");
            panel.find(".signalr-text").text("Offline");
            break;
    }
}

function signalRBlink() {
    signalRMessageCount++;

    $("#signalRCounter")
        .text(`(${signalRMessageCount})`);

    const panel = $("#signalRMonitor");

    panel.addClass("signalr-blink");

    setTimeout(() => {
        panel.removeClass("signalr-blink");
    }, 1000);
}

function registerSignalREvent(eventName, callback) {

    connectionSignR.on(eventName, function (...args) {

        signalRBlink();

        callback(...args);
    });
}
const connectionSignR = new signalR.HubConnectionBuilder()
    .withUrl("/fileProcessingHub", {
        transport: signalR.HttpTransportType.WebSockets
    })
    .configureLogging(signalR.LogLevel.Information)
    .withAutomaticReconnect()
    .build();
connectionSignR.onreconnecting(function (err) {

    console.warn("SignalR reconnecting", err);

    setSignalRStatus("reconnecting");
});

connectionSignR.onreconnected(async function () {

    console.log("SignalR reconnected");

    try {

        _connectionId =
            await connectionSignR.invoke("GetConnectionId");

        $("#signalRMonitor .signalr-text")
            .text(`Online`);

    } catch (e) {
        console.error(e);
    }

    setSignalRStatus("connected");
});

connectionSignR.onclose(function () {

    console.error("SignalR disconnected");

    setSignalRStatus("disconnected");
});
connectionSignR.start().then(async function () {
    // if (!_connectionId)
    setSignalRStatus("connected");

    _connectionId =
        await connectionSignR.invoke("GetConnectionId");

    $("#signalRMonitor .signalr-text")
        .text(`Online`);
    connectionSignR.on(`LCReportFeature_${_connectionId}`, function (responseData) {
        if (responseData.connectionId == _connectionId) {
            if (responseData.isCreate) {
                appNotifySuccess(`LossControl created !`, false);
                removeTab("LossControl");
                callElementView(`/Business/LCForm/LossControl_Form/${responseData.responseData.id}`, `form_LossControl_Form_${responseData.responseData.id}`, `LossControl ${responseData.responseData.lossControlNo}`);
                $(`#copyLossControlForm_${responseData.responseData.id}`).dxButton("instance").option("visible", responseData.copyVisibleStatus);
                $(`#previewLossControlForm_${responseData.responseData.id}`).dxButton("instance").option("text", responseData.pdfButtonText);

            }
            else {
                $(`#copyLossControlForm_${responseData.responseData.id}`).dxButton("instance").option("visible", responseData.copyVisibleStatus);
                $(`#previewLossControlForm_${responseData.responseData.id}`).dxButton("instance").option("text", responseData.pdfButtonText);
            }
        }
    });
    connectionSignR.on("onlineUsersChanged", (users) => {
        signalRBlink();
        userRender(users);
    });
    connectionSignR.on(`sectionRender_${_connectionId}`, (responseData) => {
        debugger
        signalRBlink();
        const idx = window.QuotationPage.state.quotes.findIndex(x => x.id === responseData.data.id);
        window.QuotationPage.state.quotes[idx] = { ...responseData.data };

        var globalLoadPanel = $("#loadingPopup").dxLoadPanel({
            shadingColor: "rgba(0,0,0,0.4)",
            visible: false,
            showIndicator: true,
            showPane: false,
            shading: true,
            closeOnOutsideClick: false,
            position: { of: `#qt-form${_role}` }
            // onShown: function () {
            //     setTimeout(function () {
            //         appLoadPanel.hide();
            //     }, 3000);
            // }
        });
        globalLoadPanel.dxLoadPanel("instance").hide();
    });

    connectionSignR.on("NotificationCountUpdated", function (count) {
        signalRBlink();

        updateNotification(count);
    });
    connectionSignR.on("NotificationUpdated", function (items) {
        signalRBlink();
        updateNotification(items.length);
    });
    connectionSignR.on("NotificationReceive", function (items) {
        signalRBlink();

        reloadNotifications();
        showPopupNotification(items.title,
            items.message);
    });
    connectionSignR.on("ItemSubmitted", function (items) {
        signalRBlink();
        //if (items.data.type === "Quotation") {
                    // Call the reload function for quotation components
                    if (window.reloadQuotationComponents) {
                        window.reloadQuotationComponents();
                    }
                //}
        //alert("Submitted");
    });

    connectionSignR.on("R_InitializeLoading", function (responseData) {
        signalRBlink();
        if (responseData.connectionId == _connectionId) {
            makeMiniLoadingPanel(responseData.payload.tabName, responseData.payload.subTabName);
            renderBrowserLoading(responseData);
        }
    });
    connectionSignR.on("R_OverviewLoading", function (responseData) {
        signalRBlink();
        if (responseData.connectionId == _connectionId) {
            renderBrowserLoading(responseData);
            //progressValue = responseData.lossControlData.progressvalue;
            //if (responseData.lossControlData.progressvalue == 100) {
            //    $(`#saveLossControlForm_${_id}`).dxButton("instance").option("disabled", false);
            //    submitButtonSignalRVisible();
            //    // tabValidationCheck();


            //    $.each(_formInstances, function (formIndex, focusForm) {
            //        focusForm.instance.option('changedFields', {});
            //    })

            //    // var focusForm = _formInstances.find(f => f.formName == focusTabName);
            //    // focusForm.instance.option('changedFields', {}); 
            //    //  if (focusForm)
            //    // subTabValidationCheck(focusForm.formName);
            //}
            //$(`#form_LossControl_Form_${responseData.lossControlData.data.id}_progressBar`).dxBarGauge("instance").option("values", [responseData.lossControlData.progressvalue]);
            //$(`#form_LossControl_Form_${responseData.lossControlData.data.id}_progressBar`).dxBarGauge("instance").option("customStatus", responseData.lossControlData.type);

            //var height = $(".main-header.wrapper").height();
            //const $el = $(`[aria-controls="form_LossControl_Form_${_id}"]`);
            //if ($(window).scrollTop() > height) {
            //    $(`[aria-controls="form_LossControl_Form_${_id}"]`)
            //        .css({
            //            position: "fixed",
            //            zIndex: "100",
            //            left: "43%",
            //            transition: "opacity 0.5s ease",
            //            opacity: 1
            //        });
            //}
            //if ((responseData.lossControlData.progressvalue == 100) && ($el.css("position") === "fixed")) {
            //    setTimeout(() => {
            //        $el.css({
            //            opacity: 0,
            //        });
            //    }, 500);
            //    setTimeout(() => {
            //        $el.css({
            //            position: "inherit",
            //            left: "43%",
            //            zIndex: "100",
            //            opacity: 1,
            //        });
            //    }, 1000);
            //}
            //if (responseData.errorMsg) {
            //    $(`#saveLossControlForm_${responseData.lossControlData.data.id}`).dxButton("instance").option("disabled", false);
            //    $(`#form_LossControl_Form_${responseData.lossControlData.data.id}_progressBar`).dxBarGauge("instance").option("customStatus", responseData.lossControlData.type);
            //    appErrorHandling(responseData.errorMsg);
            //    // tabValidationCheck();
            //    var focusForm = _formInstances.find(f => f.formName == focusTabName);
            //    //  if (focusForm)
            //    // subTabValidationCheck(focusForm.formName);
            //}
        }
    });
}).catch(function (err) {
    console.error("SignalR connection failed:", err);
});
connectionSignR.serverTimeoutInMilliseconds = 28800000; // 60s
connectionSignR.keepAliveIntervalInMilliseconds = 10000; // gửi keepalive mỗi 15s
var _fetchTables = [ "Outline", "DataGridConfig"];
var _cacheDataGridConfigs = [];

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
