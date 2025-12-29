
const connectionSignR = new signalR.HubConnectionBuilder()
    .withUrl("/fileProcessingHub", {
        transport: signalR.HttpTransportType.WebSockets
    })
    .configureLogging(signalR.LogLevel.Information)
    .build();

connectionSignR.start().then(async function () {
    // if (!_connectionId)
    _connectionId = await connectionSignR.invoke("GetConnectionId");
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

    connectionSignR.on(`LCSubmitRecallVisible_${_connectionId}`, function (responseData) {
        if (responseData.connectionId == _connectionId) {
            if (responseData.buttonType == "Submit") {
                $(`#submitLossControlForm_${responseData.responseData.id}`).dxButton("instance").option("visible", responseData.visibleStatus);
                $(`#submitLossControlForm_${responseData.responseData.id}`).dxButton("instance").option("text", responseData.buttonText);
            }
            if (responseData.buttonType == "Recall") {
                $(`#recallLossControlForm_${responseData.responseData.id}`).dxButton("instance").option("visible", responseData.visibleStatus);
            }
        }
    });
    connectionSignR.on("onlineUsersChanged", (users) => {
        userRender(users);
    });



}).catch(function (err) {
    console.error("SignalR connection failed:", err);
});
connectionSignR.serverTimeoutInMilliseconds = 28800000; // 60s
connectionSignR.keepAliveIntervalInMilliseconds = 10000; // gửi keepalive mỗi 15s
var _fetchTables = ["Client", "Outline", "DataGridConfig"];
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
