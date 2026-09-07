import fs from "node:fs/promises";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputDir = "D:/Source/MySource/JogetMVC/outputs/01a074c8-fc96-7af1-91e2-7c77ff22c6b3";
const previewDir = "D:/Source/MySource/JogetMVC/.tmp-xlsx/previews";
const outputPath = `${outputDir}/TC_Happy_Path_Quotation.xlsx`;
const font = "Arial";
const darkBlue = "#1F4E78";
const mediumBlue = "#D9EAF7";
const paleBlue = "#F3F7FB";
const border = "#D9D9D9";
const darkText = "#202124";

await fs.mkdir(outputDir, { recursive: true });
await fs.mkdir(previewDir, { recursive: true });

const workbook = Workbook.create();
const overview = workbook.worksheets.add("Overview");
const data = workbook.worksheets.add("Test Data");
const steps = workbook.worksheets.add("Test Steps");
const db = workbook.worksheets.add("DB Checks");

function baseSheet(sheet, tabColor) {
  sheet.showGridLines = false;
  sheet.tabColor = tabColor;
}

function titleBlock(sheet, title, subtitle, lastCol) {
  sheet.getRange(`A1:${lastCol}1`).merge();
  sheet.getRange("A1").values = [[title]];
  sheet.getRange("A1").format = {
    font: { name: font, size: 18, bold: true, color: "#000000" },
    verticalAlignment: "center",
  };
  sheet.getRange("A1").format.rowHeight = 28;
  sheet.getRange(`A2:${lastCol}2`).merge();
  sheet.getRange("A2").values = [[subtitle]];
  sheet.getRange("A2").format = {
    font: { name: font, size: 10, italic: true, color: "#595959" },
    wrapText: true,
    verticalAlignment: "center",
  };
  sheet.getRange("A2").format.rowHeight = 28;
  sheet.getRange(`A3:${lastCol}3`).format.borders = {
    bottom: { style: "thin", color: darkBlue },
  };
}

function sectionHeader(sheet, range, text) {
  sheet.getRange(range).merge();
  const anchor = range.split(":")[0];
  sheet.getRange(anchor).values = [[text]];
  sheet.getRange(range).format = {
    fill: mediumBlue,
    font: { name: font, size: 11, bold: true, color: "#000000" },
    verticalAlignment: "center",
  };
  sheet.getRange(range).format.rowHeight = 22;
  sheet.getRange(range).format.borders = { preset: "outside", style: "thin", color: border };
}

function headerStyle(range) {
  range.format = {
    fill: darkBlue,
    font: { name: font, size: 10, bold: true, color: "#FFFFFF" },
    horizontalAlignment: "center",
    verticalAlignment: "center",
    wrapText: true,
    borders: { preset: "all", style: "thin", color: "#FFFFFF" },
  };
  range.format.rowHeight = 28;
}

function bodyStyle(range) {
  range.format = {
    font: { name: font, size: 10, color: darkText },
    verticalAlignment: "top",
    wrapText: true,
    borders: { preset: "all", style: "thin", color: border },
  };
}

// Overview
baseSheet(overview, darkBlue);
titleBlock(
  overview,
  "Test Case Happy Path Quotation",
  "Báo giá tiêu chuẩn qua TS, không referral UW và được khách hàng xác nhận",
  "H",
);
overview.getRange("A5:H5").values = [["Test Case ID", "Module", "Priority", "Scenario", "Workflow", "Expected Final Status", "Test Result", "Tester"]];
headerStyle(overview.getRange("A5:H5"));
overview.getRange("A6:H6").values = [[
  "QUO_HP_001",
  "Quotation",
  "High",
  "New Business",
  "DEMO_FLOW",
  "Quotation Confirmed / Completed",
  "Not Run",
  "",
]];
bodyStyle(overview.getRange("A6:H6"));
overview.getRange("G6").dataValidation = { rule: { type: "list", values: ["Not Run", "Pass", "Fail", "Blocked"] } };
overview.getRange("G6").format.fill = "#FFF2CC";

sectionHeader(overview, "A8:H8", "Mục tiêu");
overview.getRange("A9:H10").merge();
overview.getRange("A9").values = [[
  "Xác nhận một yêu cầu báo giá đi đúng luồng FO → TS → FO → LMKT → FO → khách hàng, không phát sinh return, revise, decline hoặc UW referral, và kết thúc ở trạng thái Completed.",
]];
overview.getRange("A9:H10").format = { font: { name: font, size: 10, color: darkText }, wrapText: true, verticalAlignment: "top", borders: { preset: "outside", style: "thin", color: border } };

sectionHeader(overview, "A12:H12", "Điều kiện tiên quyết");
const prereqs = [
  [1, "Tài khoản FO, TS và LMKT đang hoạt động, có role và quyền phù hợp."],
  [2, "WorkflowDefinition DEMO_FLOW đang active và các action trong kịch bản tồn tại trong StepsWorkflow."],
  [3, "Client, Line of Business, sản phẩm, tiền tệ và dữ liệu master cần thiết đã tồn tại."],
  [4, "Quotation template, email template và notification template đã được cấu hình."],
  [5, "Các file kiểm thử đúng định dạng và không vượt giới hạn dung lượng."],
];
overview.getRange("A13:A17").values = prereqs.map((r) => [r[0]]);
overview.getRange("B13:H17").merge(true);
overview.getRange("B13:B17").values = prereqs.map((r) => [r[1]]);
bodyStyle(overview.getRange("A13:H17"));
overview.getRange("A13:A17").format.horizontalAlignment = "center";

sectionHeader(overview, "A19:H19", "Phạm vi và kết quả");
overview.getRange("A20:B23").values = [
  ["Luồng thực hiện", "FO → TS → FO → LMKT → FO → Client Confirmed"],
  ["Ngoài phạm vi", "UW referral, return, revise, cancel và client refusal"],
  ["Điều kiện Pass", "10 trên 10 bước Pass và trạng thái cuối được đồng bộ đúng"],
  ["Nguồn", "BRD Workflow Managermentt v1.0 3 updated.docx; workflow source và dữ liệu WorkflowManagementv2"],
];
overview.getRange("A20:A23").format = { fill: paleBlue, font: { name: font, size: 10, bold: true, color: darkText }, borders: { preset: "all", style: "thin", color: border } };
bodyStyle(overview.getRange("B20:H23"));
overview.getRange("B20:H23").merge(true);

sectionHeader(overview, "A25:H25", "Theo dõi kết quả từ Test Steps");
overview.getRange("A26:D26").values = [["Tổng bước", "Đã chạy", "Pass", "Fail hoặc Blocked"]];
headerStyle(overview.getRange("A26:D26"));
overview.getRange("A27:D27").formulas = [[
  "=COUNTA('Test Steps'!A6:A15)",
  "=COUNTIF('Test Steps'!G6:G15,\"Pass\")+COUNTIF('Test Steps'!G6:G15,\"Fail\")+COUNTIF('Test Steps'!G6:G15,\"Blocked\")",
  "=COUNTIF('Test Steps'!G6:G15,\"Pass\")",
  "=COUNTIF('Test Steps'!G6:G15,\"Fail\")+COUNTIF('Test Steps'!G6:G15,\"Blocked\")",
]];
bodyStyle(overview.getRange("A27:D27"));
overview.getRange("A27:D27").format.horizontalAlignment = "center";
overview.getRange("A:D").format.columnWidth = 18;
overview.getRange("E:F").format.columnWidth = 25;
overview.getRange("G:H").format.columnWidth = 18;
overview.getRange("1:30").format.autofitRows();

// Test Data
baseSheet(data, "#5B9BD5");
titleBlock(data, "Test Data", "Dữ liệu đầu vào cho QUO_HP_001", "F");
data.getRange("A5:F5").values = [["No", "Field", "Test Value", "Required", "Expected Validation", "Actual Value"]];
headerStyle(data.getRange("A5:F5"));
const testData = [
  [1, "Transaction Type", "New Business", "Yes", "Giá trị được chấp nhận", ""],
  [2, "Client", "TC Quotation Happy Client", "Yes", "Client tồn tại và active", ""],
  [3, "Line of Business", "Fire", "Yes", "LoB tồn tại và active", ""],
  [4, "Effective Date", "Ngày hợp lệ trong tương lai", "Yes", "Nhỏ hơn Expiry Date", ""],
  [5, "Expiry Date", "Effective Date cộng 1 năm", "Yes", "Lớn hơn Effective Date", ""],
  [6, "Refer UW", "No", "Yes", "Không tạo UW task", ""],
  [7, "Quotation Quantity", 1, "Yes", "Sinh đúng một quotation code Q1", ""],
  [8, "Request Attachment", "request detail.pdf", "Yes", "Upload thành công", ""],
  [9, "Quotation Document", "quotation Q1.pdf", "Yes", "Lưu đúng quotation Q1", ""],
  [10, "Client Confirmation", "Accepted", "Yes", "Cho phép hoàn tất workflow", ""],
  [11, "Confirmation Attachment", "client confirmation.pdf", "Yes", "Lưu cùng client confirmation", ""],
];
data.getRange("A6:F16").values = testData;
bodyStyle(data.getRange("A6:F16"));
for (let row = 6; row <= 16; row += 2) data.getRange(`A${row}:F${row}`).format.fill = paleBlue;
data.getRange("A6:A16").format.horizontalAlignment = "center";
data.getRange("D6:D16").format.horizontalAlignment = "center";
data.getRange("F6:F16").format.fill = "#FFF2CC";
data.getRange("A:A").format.columnWidth = 7;
data.getRange("B:B").format.columnWidth = 25;
data.getRange("C:C").format.columnWidth = 32;
data.getRange("D:D").format.columnWidth = 12;
data.getRange("E:E").format.columnWidth = 36;
data.getRange("F:F").format.columnWidth = 28;
data.getRange("1:20").format.autofitRows();
data.freezePanes.freezeRows(5);

// Test Steps
baseSheet(steps, "#70AD47");
titleBlock(steps, "Test Steps", "Thực hiện tuần tự từ bước 1 đến bước 10", "H");
steps.getRange("A5:H5").values = [["Step", "Role", "Action", "Expected Result", "Expected Status", "Action Code", "Test Result", "Tester Note"]];
headerStyle(steps.getRange("A5:H5"));
const testSteps = [
  [1, "FO", "Đăng nhập, mở chức năng tạo Quotation và chọn New Business.", "Màn hình tạo mới hiển thị đúng quyền FO; trường bắt buộc và vùng attachment sẵn sàng nhập.", "Draft", "", "Not Run", ""],
  [2, "FO", "Nhập dữ liệu khách hàng, sản phẩm, thời hạn bảo hiểm; đính kèm request detail.pdf và lưu.", "Tạo đúng một quotation record, sinh mã tham chiếu, lưu dữ liệu và attachment; không tạo workflow trùng.", "FO Process", "", "Not Run", ""],
  [3, "FO", "Chọn xử lý qua TS và Submit To TS.", "Task chuyển TS; status TS Pending; người liên quan nhận notification.", "TS Pending", "SUBMIT_MAIN_TS", "Not Run", ""],
  [4, "TS", "Mở task, kiểm tra dữ liệu, nhập phí, chọn số quotation là 1 và tạo Q1.", "TS xem đủ dữ liệu; hệ thống tạo đúng một quotation code Q1 và tài liệu tương ứng.", "TS Process", "", "Not Run", ""],
  [5, "TS", "Đính kèm quotation Q1.pdf và Submit To FO.", "Task về FO; status FO Process; dữ liệu và file TS nhập không bị mất.", "FO Process", "SUBMIT_TS_FO", "Not Run", ""],
  [6, "FO", "Review, xác nhận Refer UW là No và gửi Asking Signature Approval đến LMKT.", "Task chuyển LMKT; status MKT Review; không tạo UW task.", "MKT Review", "SUBMIT_FO_LMKT", "Not Run", ""],
  [7, "LMKT", "Kiểm tra quotation và chọn Approved Return to FO; hoàn tất ký theo cấu hình.", "Bản ký được lưu đúng version; task quay lại FO và có notification.", "FO Review", "LMKT_APPROVED_FO", "Not Run", ""],
  [8, "FO", "Kiểm tra bản đã duyệt và Send Quotation to Client.", "Email đúng người nhận, subject và attachment; chuyển Waiting Client Confirmation.", "Waiting Client Confirmation", "SEND_QUOTATION_CLIENT", "Not Run", ""],
  [9, "FO", "Ghi nhận khách hàng đồng ý, chọn Client Confirmed và tải client confirmation.pdf.", "Xác nhận và attachment được lưu; không còn task xử lý mở.", "Quotation Confirmed", "CLIENT_CONFIRMED", "Not Run", ""],
  [10, "FO", "Mở lại quotation, audit log, dashboard và danh sách tìm kiếm.", "Hiển thị Completed; lịch sử đủ actor, action, thời gian; không chạy lại action kết thúc.", "Completed", "", "Not Run", ""],
];
steps.getRange("A6:H15").values = testSteps;
bodyStyle(steps.getRange("A6:H15"));
for (let row = 6; row <= 15; row += 2) steps.getRange(`A${row}:H${row}`).format.fill = paleBlue;
steps.getRange("A6:B15").format.horizontalAlignment = "center";
steps.getRange("E6:G15").format.horizontalAlignment = "center";
steps.getRange("G6:G15").dataValidation = { rule: { type: "list", values: ["Not Run", "Pass", "Fail", "Blocked"] } };
steps.getRange("G6:G15").format.fill = "#FFF2CC";
steps.getRange("H6:H15").format.fill = "#FFF2CC";
steps.getRange("G6:G15").conditionalFormats.add("containsText", { text: "Pass", format: { fill: "#E2F0D9", font: { color: "#375623", bold: true } } });
steps.getRange("G6:G15").conditionalFormats.add("containsText", { text: "Fail", format: { fill: "#FCE4D6", font: { color: "#C00000", bold: true } } });
steps.getRange("G6:G15").conditionalFormats.add("containsText", { text: "Blocked", format: { fill: "#F4B183", font: { color: "#7F6000", bold: true } } });
steps.getRange("A:A").format.columnWidth = 7;
steps.getRange("B:B").format.columnWidth = 10;
steps.getRange("C:C").format.columnWidth = 44;
steps.getRange("D:D").format.columnWidth = 53;
steps.getRange("E:E").format.columnWidth = 24;
steps.getRange("F:F").format.columnWidth = 28;
steps.getRange("G:G").format.columnWidth = 14;
steps.getRange("H:H").format.columnWidth = 32;
steps.getRange("1:20").format.autofitRows();
steps.freezePanes.freezeRows(5);

// DB Checks
baseSheet(db, "#A5A5A5");
titleBlock(db, "DB Checks", "Các truy vấn chỉ chọn cột cần thiết", "D");
db.getRange("A5:D5").values = [["No", "Purpose", "SQL", "Expected Result"]];
headerStyle(db.getRange("A5:D5"));
const dbChecks = [
  [
    1,
    "Kiểm tra instance cuối workflow",
    "SELECT TOP 1 Id, Guid, RecordGuid, WorkflowDefinitionId, CurrentStep, CurrentOwnerRoleCode, LastActionCode, StartedDate, CompletedDate, IsCompleted, IsCancelled\nFROM InstanceWorkflow\nWHERE RecordGuid = @QuotationGuid\nORDER BY Id DESC;",
    "LastActionCode = CLIENT_CONFIRMED; CompletedDate có giá trị; IsCompleted = 1; IsCancelled = 0.",
  ],
  [
    2,
    "Kiểm tra action cấu hình",
    "SELECT Id, ActionCode, FromNodeId, ToNodeId, StatusId, StatusName, IsReturn, IsEnd, IsActive\nFROM StepsWorkflow\nWHERE WorkflowDefinitionId = @WorkflowDefinitionId\n  AND ActionCode IN ('SUBMIT_MAIN_TS','SUBMIT_TS_FO','SUBMIT_FO_LMKT','LMKT_APPROVED_FO','SEND_QUOTATION_CLIENT','CLIENT_CONFIRMED')\nORDER BY SortOrder;",
    "Trả đúng 6 action của happy path; action active và FromNodeId/ToNodeId đúng thứ tự nghiệp vụ.",
  ],
  [
    3,
    "Kiểm tra CurrentStep thuộc definition",
    "SELECT Id, Code, WorkflowDefinitionId, IsActive, LastActionCode\nFROM WorkflowInstanceNode\nWHERE WorkflowDefinitionId = @WorkflowDefinitionId\n  AND Code = @CurrentStep;",
    "CurrentStep tồn tại trong cùng WorkflowDefinition và node đang active.",
  ],
];
db.getRange("A6:D8").values = dbChecks;
bodyStyle(db.getRange("A6:D8"));
db.getRange("A6:A8").format.horizontalAlignment = "center";
db.getRange("C6:C8").format.font = { name: "Consolas", size: 9, color: darkText };
db.getRange("A6:D6").format.fill = paleBlue;
db.getRange("A8:D8").format.fill = paleBlue;
db.getRange("A:A").format.columnWidth = 7;
db.getRange("B:B").format.columnWidth = 28;
db.getRange("C:C").format.columnWidth = 95;
db.getRange("D:D").format.columnWidth = 45;
db.getRange("6:8").format.rowHeight = 105;
db.freezePanes.freezeRows(5);

for (const sheet of [overview, data, steps, db]) {
  const used = sheet.getUsedRange();
  if (used) used.format.verticalAlignment = "top";
}

const overviewCheck = await workbook.inspect({
  kind: "table",
  range: "Overview!A1:H27",
  include: "values,formulas",
  tableMaxRows: 30,
  tableMaxCols: 10,
});
console.log("OVERVIEW_CHECK");
console.log(overviewCheck.ndjson);

const stepsCheck = await workbook.inspect({
  kind: "table",
  range: "Test Steps!A5:H15",
  include: "values,formulas",
  tableMaxRows: 15,
  tableMaxCols: 10,
});
console.log("STEPS_CHECK");
console.log(stepsCheck.ndjson);

const errorCheck = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!",
  options: { useRegex: true, maxResults: 100 },
  summary: "final formula error scan",
});
console.log("ERROR_CHECK");
console.log(errorCheck.ndjson);

for (const sheetName of ["Overview", "Test Data", "Test Steps", "DB Checks"]) {
  const preview = await workbook.render({ sheetName, autoCrop: "all", scale: 1, format: "png" });
  const safeName = sheetName.replaceAll(" ", "_");
  await fs.writeFile(`${previewDir}/${safeName}.png`, new Uint8Array(await preview.arrayBuffer()));
}

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);
console.log(`OUTPUT ${outputPath}`);
