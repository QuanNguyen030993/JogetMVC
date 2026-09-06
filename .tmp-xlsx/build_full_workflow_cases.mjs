import fs from "node:fs/promises";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const threadDir = "D:/Source/MySource/JogetMVC/outputs/01a074c8-fc96-7af1-91e2-7c77ff22c6b3";
const previewDir = "D:/Source/MySource/JogetMVC/.tmp-xlsx/full-previews";
const outputPath = `${threadDir}/Workflow_Test_Cases_From_BRD.xlsx`;
await fs.mkdir(threadDir, { recursive: true });
await fs.mkdir(previewDir, { recursive: true });

const wb = Workbook.create();
const font = "Arial";
const navy = "#1F4E78";
const blue = "#D9EAF7";
const pale = "#F4F7FA";
const border = "#D9D9D9";
const amber = "#FFF2CC";
const text = "#202124";

function addSheet(name, color) {
  const s = wb.worksheets.add(name);
  s.showGridLines = false;
  s.tabColor = color;
  return s;
}

function addTitle(s, title, subtitle, lastCol) {
  s.getRange(`A1:${lastCol}1`).merge();
  s.getRange("A1").values = [[title]];
  s.getRange("A1").format = { font: { name: font, size: 18, bold: true, color: "#000000" }, verticalAlignment: "center" };
  s.getRange("A1").format.rowHeight = 28;
  s.getRange(`A2:${lastCol}2`).merge();
  s.getRange("A2").values = [[subtitle]];
  s.getRange("A2").format = { font: { name: font, size: 10, italic: true, color: "#595959" }, wrapText: true, verticalAlignment: "center" };
  s.getRange("A2").format.rowHeight = 26;
  s.getRange(`A3:${lastCol}3`).format.borders = { bottom: { style: "thin", color: navy } };
}

function styleHeader(range) {
  range.format = {
    fill: navy,
    font: { name: font, size: 10, bold: true, color: "#FFFFFF" },
    horizontalAlignment: "center",
    verticalAlignment: "center",
    wrapText: true,
    borders: { preset: "all", style: "thin", color: "#FFFFFF" },
  };
  range.format.rowHeight = 30;
}

function styleBody(range) {
  range.format = {
    font: { name: font, size: 10, color: text },
    verticalAlignment: "top",
    wrapText: true,
    borders: { preset: "all", style: "thin", color: border },
  };
}

function stripeRows(s, start, end, lastCol) {
  for (let r = start; r <= end; r += 2) s.getRange(`A${r}:${lastCol}${r}`).format.fill = pale;
}

function applyResultValidation(s, range) {
  s.getRange(range).dataValidation = { rule: { type: "list", values: ["Not Run", "Pass", "Fail", "Blocked"] } };
  s.getRange(range).format.fill = amber;
  s.getRange(range).conditionalFormats.add("containsText", { text: "Pass", format: { fill: "#E2F0D9", font: { color: "#375623", bold: true } } });
  s.getRange(range).conditionalFormats.add("containsText", { text: "Fail", format: { fill: "#FCE4D6", font: { color: "#C00000", bold: true } } });
  s.getRange(range).conditionalFormats.add("containsText", { text: "Blocked", format: { fill: "#F4B183", font: { color: "#7F6000", bold: true } } });
}

function setupCaseSheet(s, title, subtitle, rows) {
  addTitle(s, title, subtitle, "I");
  s.getRange("A5:I5").values = [["Case ID", "Module", "Group", "Scenario", "Expected Result", "Expected Final Status", "Priority", "Test Result", "Tester Note"]];
  styleHeader(s.getRange("A5:I5"));
  if (rows.length) {
    s.getRange(`A6:I${5 + rows.length}`).values = rows.map((r) => [...r, "Not Run", ""]);
    styleBody(s.getRange(`A6:I${5 + rows.length}`));
    stripeRows(s, 6, 5 + rows.length, "I");
    s.getRange(`A6:C${5 + rows.length}`).format.horizontalAlignment = "center";
    s.getRange(`F6:H${5 + rows.length}`).format.horizontalAlignment = "center";
    applyResultValidation(s, `H6:H${5 + rows.length}`);
    s.getRange(`I6:I${5 + rows.length}`).format.fill = amber;
  }
  s.getRange("A:A").format.columnWidth = 18;
  s.getRange("B:B").format.columnWidth = 16;
  s.getRange("C:C").format.columnWidth = 22;
  s.getRange("D:D").format.columnWidth = 46;
  s.getRange("E:E").format.columnWidth = 52;
  s.getRange("F:F").format.columnWidth = 26;
  s.getRange("G:G").format.columnWidth = 12;
  s.getRange("H:H").format.columnWidth = 14;
  s.getRange("I:I").format.columnWidth = 34;
  s.getRange(`6:${5 + rows.length}`).format.rowHeight = 48;
  s.freezePanes.freezeRows(5);
}

const happyCases = [
  ["HP-001", "End to End", "Happy Path", "Qua TS, không referral UW, LMKT ký, khách hàng đồng ý, PI qua TS và PM complete.", "Quotation và Policy Issuance hoàn tất, dữ liệu được liên kết.", "Completed", "High"],
  ["HP-002", "End to End", "Happy Path", "Qua TS, referral UW và UW Approve Risk, sau đó tiếp tục cấp đơn.", "UW result lưu lịch sử; quotation và policy hoàn tất.", "Completed", "High"],
  ["HP-003", "Quotation", "Happy Path", "UW chọn No Need To Refer và trả về FO.", "FO tiếp tục trình LMKT và gửi khách hàng.", "Quotation Confirmed", "Medium"],
  ["HP-004", "Quotation", "Happy Path", "UW referral lên UW Manager, được approve và trả về FO.", "Escalation lưu đủ PIC, comment và quyết định.", "Quotation Confirmed", "High"],
  ["HP-005", "Quotation", "Alternative Happy", "FO Skip TS khi làm quotation.", "FO tự hoàn thiện quotation và tiếp tục các bước phê duyệt.", "Quotation Confirmed", "Medium"],
  ["HP-006", "Policy Issuance", "Alternative Happy", "FO Skip TS và gửi PI trực tiếp PM.", "PM nhận đúng task và chỉ Accept sau khi checklist hợp lệ.", "Completed", "High"],
  ["HP-007", "Quotation", "Alternative Happy", "Endorsement được cấu hình Skip MGR.", "Quotation bỏ qua bước ký MGR theo đúng rule.", "Quotation Confirmed", "Medium"],
  ["HP-008", "Policy Issuance", "Happy Path", "PM Submit Policy và không cần follow-up.", "Policy No được đồng bộ và PI complete.", "Completed", "High"],
  ["HP-009", "Policy Issuance", "Happy Path", "PM Submit but follow up, FO thu thập chứng từ.", "FO gửi, nhận bản ký và submit follow-up về PM.", "Completed", "High"],
  ["HP-010", "Policy Issuance", "Happy Path", "PM Submit but follow up, TS thu thập chứng từ.", "TS gửi, nhận bản ký và submit follow-up về PM.", "Completed", "High"],
  ["HP-011", "Integration", "Happy Path", "Policy No đồng bộ thành công từ Core PA.", "Quotation No và Policy No mapping đúng một hồ sơ.", "Completed", "High"],
  ["HP-012", "Policy Issuance", "Business Rule", "Một quotation tạo đúng một PI request active.", "Không sinh PI trùng cho cùng quotation.", "PI Active", "High"],
];

const assignCases = [
  ["ASN-001", "Quotation", "Assign Accept", "FO Assign TS làm quotation.", "TS nhận task, notification và status TS Pending.", "TS Pending", "High"],
  ["ASN-002", "Quotation", "Assign Accept", "TS Accept quotation task.", "Ghi Accepted Date, owner TS và status TS Process.", "TS Process", "High"],
  ["ASN-003", "Quotation", "Assign Accept", "FO Assign UW referral.", "UW nhận task và notification.", "UW Pending", "High"],
  ["ASN-004", "Quotation", "Assign Accept", "UW Accept referral task.", "Ghi Accepted Date và bắt đầu UW TAT.", "UW Process", "High"],
  ["ASN-005", "Quotation", "Assign Accept", "FO Submit quotation sang LMKT/MGR.", "LMKT nhận task phê duyệt và ký.", "MKT Review", "High"],
  ["ASN-006", "Policy Issuance", "Assign Accept", "FO Assign TS làm Policy Issuance.", "TS nhận task và status TS Pending.", "TS Pending", "High"],
  ["ASN-007", "Policy Issuance", "Assign Accept", "TS Accept Policy Issuance task.", "Ghi Accepted Date và bắt đầu TS TAT.", "TS Process", "High"],
  ["ASN-008", "Policy Issuance", "Assign Accept", "FO hoặc TS Submit PI sang PM.", "PM nhận task và notification.", "PM Pending", "High"],
  ["ASN-009", "Policy Issuance", "Assign Accept", "PM hoàn tất checklist validation rồi Accept.", "PM Accept thành công và bắt đầu PM TAT.", "PM Process", "High"],
  ["ASN-010", "Policy Issuance", "Assign Accept", "PM reassign cho PM PIC khác.", "Owner thay đổi, audit và notification đầy đủ.", "PM Process", "Medium"],
  ["ASN-011", "Common", "Authorization", "Người không đúng role thực hiện Accept.", "Hệ thống từ chối và không đổi owner/status.", "Unchanged", "High"],
  ["ASN-012", "Common", "Concurrency", "Hai người Accept cùng một task gần đồng thời.", "Chỉ một người thành owner; không tạo xử lý trùng.", "In Progress", "High"],
  ["ASN-013", "Common", "TAT", "Assign task và gửi notification.", "Notification Time được lưu đúng thời điểm.", "Pending", "Medium"],
  ["ASN-014", "Common", "TAT", "User Accept task.", "Accepted Date được lưu đúng thời điểm.", "In Progress", "Medium"],
  ["ASN-015", "Common", "TAT", "Tính Gap TAT sau Accept.", "Gap TAT bằng Accept Time trừ Notification Time.", "Calculated", "Medium"],
  ["ASN-016", "Common", "TAT", "Return rồi Accept lại.", "TAT dùng Accepted Date cuối cùng.", "Calculated", "High"],
];

const quotationExceptions = [
  ["QUO-RET-001", "Quotation", "Return", "TS trả FO do thiếu thông tin.", "Task về FO, ghi lý do và giữ dữ liệu đã nhập.", "FO Process", "High"],
  ["QUO-RET-002", "Quotation", "Resubmit", "FO bổ sung rồi gửi lại TS.", "TS nhận vòng xử lý mới; loop count tăng.", "TS Pending", "High"],
  ["QUO-RET-003", "Quotation", "Revise", "FO yêu cầu TS revise quotation.", "Tạo vòng xử lý mới, không ghi đè lịch sử cũ.", "TS Process", "High"],
  ["QUO-RET-004", "Quotation", "Return", "UW chọn Need More Information và trả FO.", "FO nhận yêu cầu bổ sung, UW TAT tạm dừng.", "FO Process", "High"],
  ["QUO-RET-005", "Quotation", "Return", "UW Return sau khi đã Accept.", "Khi gửi lại, UW TAT dùng lần Accept cuối.", "UW Pending", "High"],
  ["QUO-RET-006", "Quotation", "Return", "LMKT/MGR trả FO chỉnh sửa.", "FO nhận task, lý do và bản quotation hiện hành.", "FO Review", "High"],
  ["QUO-REV-001", "Quotation", "Revise", "FO revise trước khi gửi MGR.", "Version tăng và dữ liệu cũ còn trong lịch sử.", "FO Revision", "Medium"],
  ["QUO-REV-002", "Quotation", "Signature", "Quotation đã ký nhưng cần revise và ký lại.", "Bản ký cũ mất hiệu lực; tạo version ký mới.", "MKT Review", "High"],
  ["QUO-CAN-001", "Quotation", "Cancel", "FO cancel khi quotation còn Draft.", "Ghi lý do, đóng workflow và không còn task mở.", "Cancelled", "High"],
  ["QUO-CAN-002", "Quotation", "Cancel", "FO cancel sau khi TS đã xử lý.", "Đóng workflow nhưng giữ dữ liệu và lịch sử TS.", "Cancelled", "High"],
  ["QUO-CAN-003", "Quotation", "Cancel", "FO cancel trong lúc chờ UW.", "UW task bị đóng và các bên liên quan nhận notification.", "Cancelled", "High"],
  ["QUO-DEC-001", "Quotation", "Decline", "UW Decline Risk.", "Lưu quyết định và lý do; không tiếp tục cấp đơn.", "Declined", "High"],
  ["QUO-DEC-002", "Quotation", "Decline", "LMKT/MGR Decline quotation.", "Workflow kết thúc Declined và FO được thông báo.", "Declined", "High"],
  ["QUO-DEC-003", "Quotation", "Client Refusal", "Khách hàng từ chối quotation.", "FO ghi nhận refusal; quotation kết thúc.", "Quotation Refused", "High"],
  ["QUO-DEC-004", "Quotation", "Client Cancel", "Khách hàng không phản hồi và FO cancel.", "Ghi lý do và đóng quotation.", "Cancelled", "Medium"],
  ["QUO-SIGN-001", "Quotation", "Signature", "Ký số quotation thất bại.", "Không chuyển bước; hiển thị lỗi và cho phép thử lại.", "MKT Review", "High"],
  ["QUO-SIGN-002", "Quotation", "Authorization", "Người ký không có quyền hoặc chứng thư không hợp lệ.", "Từ chối ký và ghi audit lỗi.", "MKT Review", "High"],
  ["QUO-SIGN-003", "Quotation", "Signature", "Thay đổi quotation sau khi đã ký.", "Không dùng lại chữ ký cũ cho nội dung mới.", "Revision Required", "High"],
  ["QUO-SIGN-004", "Quotation", "Signature", "Ký lại quotation sau revise.", "Tạo version mới và giữ bản ký cũ trong history.", "FO Review", "High"],
  ["QUO-ATT-001", "Quotation", "Attachment", "Thiếu quotation attachment khi Submit.", "Validation chặn Submit.", "Unchanged", "High"],
  ["QUO-ATT-002", "Quotation", "Attachment", "Số quotation không khớp số file.", "Hiển thị lỗi hoặc tự count theo rule BRD.", "Unchanged", "High"],
  ["QUO-ATT-003", "Quotation", "Attachment", "Request tạo Q1, Q2 nhưng thiếu một file.", "Không gán sai file và báo thiếu rõ ràng.", "TS Process", "Medium"],
  ["QUO-END-001", "Quotation", "Idempotency", "Chạy action kết thúc hai lần.", "Lần hai bị chặn, không tạo log/instance trùng.", "Completed", "High"],
  ["QUO-END-002", "Quotation", "Database", "UI Completed nhưng runtime chưa cập nhật cờ kết thúc.", "CompletedDate có giá trị, IsCompleted = 1.", "Completed", "High"],
];

const policyExceptions = [
  ["PI-RET-001", "Policy Issuance", "Return", "PM Return FO do thiếu thông tin.", "Task về FO, ghi lý do và giữ checklist/attachment.", "FO Process", "High"],
  ["PI-RET-002", "Policy Issuance", "Return", "PM Return TS do checklist chưa đủ.", "Task về TS và chỉ rõ line checklist thiếu.", "TS Process", "High"],
  ["PI-RET-003", "Policy Issuance", "Routing", "Request tạo từ TS nhưng PM trả về FO.", "Định tuyến theo rule đã thống nhất; không trả sai owner.", "Need Confirmation", "High"],
  ["PI-RET-004", "Policy Issuance", "Revise", "FO revise request rồi resubmit PM.", "PM nhận phiên bản mới và lịch sử cũ còn nguyên.", "PM Pending", "High"],
  ["PI-RET-005", "Policy Issuance", "Revise", "TS revise request rồi resubmit PM.", "PM nhận task mới và loop count tăng.", "PM Pending", "High"],
  ["PI-RET-006", "Policy Issuance", "Return", "PM Return sau khi đã Accept.", "Đóng khoảng PM TAT hiện tại và trả task đúng người.", "FO or TS Process", "High"],
  ["PI-RET-007", "Policy Issuance", "TAT", "PM Accept lại sau resubmit.", "PM TAT dùng Accepted Date cuối và Submit Date đầu.", "PM Process", "High"],
  ["PI-RET-008", "Policy Issuance", "Version", "Return và resubmit nhiều vòng.", "Không mất attachment, checklist hoặc version trước.", "PM Pending", "High"],
  ["PI-WD-001", "Policy Issuance", "Withdraw", "FO Withdraw khi chưa Assign TS.", "Đóng request, ghi lý do và giữ liên kết quotation.", "Withdrawn", "High"],
  ["PI-WD-002", "Policy Issuance", "Withdraw", "FO Withdraw sau Assign TS nhưng TS chưa Accept.", "Đóng TS task và thông báo cho TS.", "Withdrawn", "High"],
  ["PI-WD-003", "Policy Issuance", "Withdraw", "TS Withdraw trước khi gửi PM.", "Đóng request, ghi lý do và thông báo FO.", "Withdrawn", "High"],
  ["PI-WD-004", "Policy Issuance", "Withdraw", "FO hoặc TS Withdraw khi PM chưa Accept.", "Đóng PM pending task và lưu audit.", "Withdrawn", "High"],
  ["PI-WD-005", "Policy Issuance", "Need Confirmation", "Withdraw khi PM đã Accept.", "Hành vi cần Business xác nhận.", "Need Confirmation", "High"],
  ["PI-WD-006", "Policy Issuance", "Need Confirmation", "Withdraw sau khi Policy đã Submit.", "Hành vi và xử lý Core PA cần Business xác nhận.", "Need Confirmation", "High"],
  ["PI-WD-007", "Policy Issuance", "Validation", "Withdraw không nhập lý do.", "Validation chặn action.", "Unchanged", "High"],
  ["PI-WD-008", "Policy Issuance", "Audit", "Withdraw request.", "Không xóa lịch sử quotation, PI và attachment.", "Withdrawn", "High"],
  ["PI-CAN-001", "Policy Issuance", "Cancel", "Cancel PI do quotation bị hủy.", "PI đóng và giữ liên kết nguồn.", "Cancelled", "High"],
  ["PI-CAN-002", "Policy Issuance", "Cancel", "Cancel PI do quotation hết hiệu lực.", "Ghi lý do và không cho tiếp tục Submit.", "Cancelled", "Medium"],
  ["PI-CAN-003", "Policy Issuance", "Validation", "Tạo PI từ quotation Declined hoặc Cancelled.", "Hệ thống chặn tạo PI.", "Not Created", "High"],
  ["PI-CAN-004", "Policy Issuance", "Duplicate", "Tạo PI thứ hai khi quotation đã có PI active.", "Hệ thống chặn hoặc cảnh báo theo rule một quotation một PI.", "Not Created", "High"],
  ["PI-CHK-001", "Policy Issuance", "Checklist", "PM Accept khi checklist chưa hoàn tất.", "Hệ thống chặn Accept.", "PM Pending", "High"],
  ["PI-CHK-002", "Policy Issuance", "Checklist", "Checklist thiếu một line bắt buộc.", "Chỉ rõ line thiếu và không cho Accept.", "PM Pending", "High"],
  ["PI-SUB-001", "Integration", "Core PA", "Submit Policy khi Core PA không phản hồi.", "Không complete; hiển thị lỗi và cho phép retry an toàn.", "PM Process", "High"],
  ["PI-SUB-002", "Integration", "Core PA", "Quotation No không tồn tại trong Core PA.", "Không tạo mapping sai và hiển thị lỗi.", "PM Process", "High"],
  ["PI-SUB-003", "Integration", "Core PA", "Core PA trả Policy No trùng.", "Chặn mapping trùng và ghi lỗi.", "PM Process", "High"],
  ["PI-SUB-004", "Integration", "Core PA", "Policy No tạo thành công nhưng không sync về workflow.", "Retry/reconcile không tạo policy thứ hai.", "Submit Pending Sync", "High"],
  ["PI-FU-001", "Policy Issuance", "Follow Up", "Submit but follow up nhưng không Assign FO/TS.", "Hệ thống yêu cầu owner trước khi chuyển bước.", "Submit but follow up", "High"],
  ["PI-FU-002", "Policy Issuance", "Follow Up", "Submit follow-up document thiếu attachment.", "Validation chặn Submit.", "Follow Up", "High"],
  ["PI-FU-003", "Policy Issuance", "Follow Up", "Khách hàng chưa gửi bản ký trả.", "Giữ follow-up mở và gửi reminder theo cấu hình.", "Follow Up", "Medium"],
  ["PI-FU-004", "Policy Issuance", "Follow Up", "Follow-up nhiều vòng.", "Mỗi vòng có lịch sử, attachment và thời gian riêng.", "Follow Up", "Medium"],
  ["PI-FU-005", "Policy Issuance", "Validation", "PM Complete khi còn follow-up mở.", "Hệ thống chặn Complete.", "Submit but follow up", "High"],
  ["PI-END-001", "Policy Issuance", "Database", "UI Completed nhưng runtime chưa cập nhật cờ kết thúc.", "CompletedDate có giá trị, IsCompleted = 1.", "Completed", "High"],
  ["PI-END-002", "Policy Issuance", "Idempotency", "Chạy Complete lần hai.", "Lần hai bị chặn, không tạo log/instance trùng.", "Completed", "High"],
];

const allCases = [...happyCases, ...assignCases, ...quotationExceptions, ...policyExceptions];

// Create every worksheet before adding cross-sheet formulas.
const overview = addSheet("Overview", navy);
const e2e = addSheet("E2E Happy Path", "#70AD47");
const catalog = addSheet("Scenario Catalog", "#5B9BD5");
const assign = addSheet("Assign Accept", "#8064A2");
const quo = addSheet("Quotation Exceptions", "#C55A11");
const pi = addSheet("Policy Exceptions", "#A61C00");
const db = addSheet("DB Checks", "#7F7F7F");

// Overview
addTitle(overview, "Workflow Test Case Catalog", "Phạm vi từ Quotation đến Policy Issuance theo BRD Workflow Management", "H");
overview.getRange("A5:H5").values = [["Total Cases", "Happy Cases", "Assign Accept", "Quotation Exceptions", "Policy Exceptions", "Need Confirmation", "Pass", "Fail or Blocked"]];
styleHeader(overview.getRange("A5:H5"));
overview.getRange("A6:H6").formulas = [[
  "=COUNTA('Scenario Catalog'!A6:A90)",
  "=COUNTA('Scenario Catalog'!A6:A17)",
  "=COUNTA('Scenario Catalog'!A18:A33)",
  "=COUNTA('Scenario Catalog'!A34:A57)",
  "=COUNTA('Scenario Catalog'!A58:A90)",
  "=COUNTIF('Scenario Catalog'!F6:F90,\"Need Confirmation\")",
  "=COUNTIF('Scenario Catalog'!H6:H90,\"Pass\")",
  "=COUNTIF('Scenario Catalog'!H6:H90,\"Fail\")+COUNTIF('Scenario Catalog'!H6:H90,\"Blocked\")",
]];
styleBody(overview.getRange("A6:H6"));
overview.getRange("A6:H6").format.horizontalAlignment = "center";
overview.getRange("A8:H8").merge();
overview.getRange("A8").values = [["Cấu trúc workbook"]];
overview.getRange("A8:H8").format = { fill: blue, font: { name: font, size: 11, bold: true, color: "#000000" }, borders: { preset: "outside", style: "thin", color: border } };
overview.getRange("A9:B14").values = [
  ["E2E Happy Path", "30 bước từ tạo quotation đến hoàn tất policy."],
  ["Scenario Catalog", "Danh mục toàn bộ happy, assign/accept và exception cases."],
  ["Assign Accept", "Các trường hợp routing, quyền, concurrency và TAT."],
  ["Quotation Exceptions", "Return, revise, cancel, decline, chữ ký và attachment."],
  ["Policy Exceptions", "Return, withdraw, cancel, checklist, Core PA và follow-up."],
  ["DB Checks", "Truy vấn cột cần thiết và các điểm cần Business xác nhận."],
];
styleBody(overview.getRange("A9:H14"));
overview.getRange("B9:H14").merge(true);
overview.getRange("A9:A14").format = { fill: pale, font: { name: font, size: 10, bold: true, color: text }, borders: { preset: "all", style: "thin", color: border } };
overview.getRange("A16:H16").merge();
overview.getRange("A16").values = [["Nguồn"]];
overview.getRange("A16:H16").format = { fill: blue, font: { name: font, size: 11, bold: true, color: "#000000" }, borders: { preset: "outside", style: "thin", color: border } };
overview.getRange("A17:H18").merge();
overview.getRange("A17").values = [["BRD Workflow Managermentt v1.0 3 updated.docx; source workflow; dữ liệu WorkflowManagementv2. Các case Need Confirmation là điểm BRD chưa xác định đủ quy tắc xử lý."]];
overview.getRange("A17:H18").format = { font: { name: font, size: 10, color: text }, wrapText: true, verticalAlignment: "top", borders: { preset: "outside", style: "thin", color: border } };
overview.getRange("A:H").format.columnWidth = 20;
overview.getRange("1:20").format.autofitRows();

// E2E Happy Path
addTitle(e2e, "E2E Happy Path", "Full path có TS, UW approval, LMKT ký và Policy follow-up", "I");
e2e.getRange("A5:I5").values = [["Step", "Phase", "Role", "Action Type", "Action", "Expected Result", "Expected Status", "Action Code", "Test Result"]];
styleHeader(e2e.getRange("A5:I5"));
const e2eRows = [
  [1,"Quotation","FO","Create","Tạo quotation request và chọn New Business.","Tạo một quotation record và workflow instance.","Draft",""],
  [2,"Quotation","FO","Input","Nhập dữ liệu và đính kèm request detail.","Dữ liệu và attachment được lưu.","FO Process",""],
  [3,"Quotation","FO","Assign","Assign TS.","TS nhận notification và task pending.","TS Pending","SUBMIT_MAIN_TS"],
  [4,"Quotation","TS","Accept","Accept quotation task.","Ghi owner và Accepted Date; bắt đầu TAT.","TS Process",""],
  [5,"Quotation","TS","Process","Nhập phí, tạo Q1 và đính kèm quotation document.","Tạo đúng một quotation code và version.","TS Process",""],
  [6,"Quotation","TS","Submit","Submit quotation về FO.","FO nhận task; TS Complete Date được ghi.","FO Process","SUBMIT_TS_FO"],
  [7,"Quotation","FO","Review","Kiểm tra quotation và chọn Refer UW.","Referral data được lưu.","FO Process",""],
  [8,"Quotation","FO","Assign","Submit referral sang UW.","UW nhận notification và pending task.","UW Pending","Submit_FO_UW"],
  [9,"Quotation","UW","Accept","Accept UW task.","Ghi UW Accepted Date và bắt đầu UW TAT.","UW Process",""],
  [10,"Quotation","UW","Decision","Approve Risk và trả kết quả FO.","Lưu quyết định, T&C và lịch sử referral.","FO Review",""],
  [11,"Quotation","FO","Review","Áp dụng UW T&C và review bản cuối.","Quotation sẵn sàng trình ký.","FO Review",""],
  [12,"Quotation","FO","Assign","Gửi Asking Signature Approval sang LMKT.","LMKT nhận task phê duyệt.","MKT Review","SUBMIT_FO_LMKT"],
  [13,"Quotation","LMKT","Approve Sign","Approve và ký số quotation.","Tạo bản ký đúng version.","FO Review","LMKT_APPROVED_FO"],
  [14,"Quotation","FO","Send","Gửi quotation đã ký cho khách hàng.","Email và attachment đúng; chờ phản hồi.","Waiting Client Confirmation","SEND_QUOTATION_CLIENT"],
  [15,"Quotation","FO","Confirm","Ghi nhận khách hàng đồng ý và tải bản ký trả.","Lưu confirmation attachment.","Quotation Confirmed","CLIENT_CONFIRMED"],
  [16,"Quotation","System","Complete","Kết thúc quotation.","CompletedDate có giá trị và không còn task mở.","Completed",""],
  [17,"Policy Issuance","FO","Create","Tạo PI từ quotation đã xác nhận.","PI liên kết đúng quotation; không tạo trùng.","FO Process","START_FO"],
  [18,"Policy Issuance","FO","Assign","Assign TS xử lý PI.","TS nhận notification và task pending.","TS Pending",""],
  [19,"Policy Issuance","TS","Accept","Accept PI task.","Ghi Accepted Date và bắt đầu TS TAT.","TS Process",""],
  [20,"Policy Issuance","TS","Checklist","Điền đầy đủ checklist và dữ liệu PI.","Checklist hợp lệ và lưu được attachment.","TS Process",""],
  [21,"Policy Issuance","TS","Submit","Submit PI sang PM.","PM nhận notification và pending task.","PM Pending",""],
  [22,"Policy Issuance","PM","Validate","Kiểm tra checklist trước Accept.","Không còn checklist item bắt buộc bị thiếu.","PM Pending",""],
  [23,"Policy Issuance","PM","Accept","Accept Policy request.","Ghi PM Accepted Date và bắt đầu PM TAT.","PM Process",""],
  [24,"Policy Issuance","PM","Submit","Nhập Quotation No vào Core PA và Submit Policy.","Core PA xử lý thành công.","Submitted",""],
  [25,"Policy Issuance","System","Sync","Đồng bộ Policy No về workflow.","Quotation No và Policy No mapping đúng.","Submit but follow up",""],
  [26,"Policy Issuance","PM","Assign","Assign follow-up cho FO.","FO nhận follow-up task.","Follow Up",""],
  [27,"Policy Issuance","FO","Review Send","Review policy và gửi khách hàng ký.","Email và policy attachment đúng.","Follow Up",""],
  [28,"Policy Issuance","FO","Receive","Nhận bản ký trả từ khách hàng.","Signed-back document được lưu.","Follow Up",""],
  [29,"Policy Issuance","FO","Submit","Submit follow-up document về PM.","PM nhận đủ chứng từ follow-up.","PM Process",""],
  [30,"Policy Issuance","PM","Complete","Complete Policy Issuance.","CompletedDate có giá trị; IsCompleted = 1.","Completed",""],
];
e2e.getRange("A6:I35").values = e2eRows.map((r) => [...r, "Not Run"]);
styleBody(e2e.getRange("A6:I35"));
stripeRows(e2e, 6, 35, "I");
e2e.getRange("A6:D35").format.horizontalAlignment = "center";
e2e.getRange("G6:I35").format.horizontalAlignment = "center";
applyResultValidation(e2e, "I6:I35");
e2e.getRange("A:A").format.columnWidth = 7;
e2e.getRange("B:B").format.columnWidth = 20;
e2e.getRange("C:C").format.columnWidth = 12;
e2e.getRange("D:D").format.columnWidth = 18;
e2e.getRange("E:E").format.columnWidth = 44;
e2e.getRange("F:F").format.columnWidth = 52;
e2e.getRange("G:G").format.columnWidth = 27;
e2e.getRange("H:H").format.columnWidth = 28;
e2e.getRange("I:I").format.columnWidth = 14;
e2e.getRange("6:35").format.rowHeight = 44;
e2e.freezePanes.freezeRows(5);

setupCaseSheet(catalog, "Scenario Catalog", "Toàn bộ trường hợp lấy từ flow BRD và các điểm kiểm tra liên quan", allCases);

setupCaseSheet(assign, "Assign Accept", "Routing, authorization, concurrency và TAT", assignCases);

setupCaseSheet(quo, "Quotation Exceptions", "Return, revise, cancel, decline, ký số và attachment", quotationExceptions);

setupCaseSheet(pi, "Policy Exceptions", "Return, withdraw, cancel, checklist, Core PA và follow-up", policyExceptions);

// DB Checks and questions
addTitle(db, "DB Checks", "Các truy vấn chỉ chọn cột cần thiết", "D");
db.getRange("A5:D5").values = [["No", "Purpose", "SQL", "Expected Result"]];
styleHeader(db.getRange("A5:D5"));
const dbRows = [
  [1,"Kiểm tra workflow instance","SELECT TOP 1 Id, Guid, RecordGuid, WorkflowDefinitionId, CurrentStep, CurrentOwnerRoleCode, LastActionCode, StartedDate, CompletedDate, IsCompleted, IsCancelled\nFROM InstanceWorkflow\nWHERE RecordGuid = @RecordGuid\nORDER BY Id DESC;","CurrentStep, owner, action và cờ kết thúc khớp UI."],
  [2,"Kiểm tra action của case","SELECT Id, WorkflowDefinitionId, ActionCode, FromNodeId, ToNodeId, StatusId, StatusName, IsReturn, IsEnd, IsActive\nFROM StepsWorkflow\nWHERE WorkflowDefinitionId = @WorkflowDefinitionId\n  AND ActionCode = @ActionCode;","Action tồn tại, active và route đúng node."],
  [3,"Kiểm tra CurrentStep","SELECT Id, Code, WorkflowDefinitionId, IsActive, LastActionCode\nFROM WorkflowInstanceNode\nWHERE WorkflowDefinitionId = @WorkflowDefinitionId\n  AND Code = @CurrentStep;","CurrentStep thuộc đúng definition và node active."],
  [4,"Kiểm tra instance trùng","SELECT RecordGuid, WorkflowDefinitionId, COUNT(*) AS InstanceCount\nFROM InstanceWorkflow\nWHERE RecordGuid = @RecordGuid\nGROUP BY RecordGuid, WorkflowDefinitionId;","Một record không có instance active trùng."],
  [5,"Kiểm tra end action","SELECT Id, ActionCode, StatusName, IsEnd, ToNodeId\nFROM StepsWorkflow\nWHERE WorkflowDefinitionId = @WorkflowDefinitionId\n  AND ActionCode IN ('CLIENT_CONFIRMED','CLIENT_REFUSED','LMKT_DECLINED');","Action kết thúc phải đưa runtime về trạng thái phù hợp."],
  [6,"Kiểm tra template tham chiếu","SELECT Id, ActionCode, NotificationTemplateId, MailTemplateId\nFROM StepsWorkflow\nWHERE WorkflowDefinitionId = @WorkflowDefinitionId\n  AND IsActive = 1;","Template ID được tham chiếu phải tồn tại."],
];
db.getRange("A6:D11").values = dbRows;
styleBody(db.getRange("A6:D11"));
stripeRows(db, 6, 11, "D");
db.getRange("A6:A11").format.horizontalAlignment = "center";
db.getRange("C6:C11").format.font = { name: "Consolas", size: 9, color: text };
db.getRange("A:A").format.columnWidth = 7;
db.getRange("B:B").format.columnWidth = 30;
db.getRange("C:C").format.columnWidth = 96;
db.getRange("D:D").format.columnWidth = 48;
db.getRange("6:11").format.rowHeight = 100;
db.getRange("A13:D13").merge();
db.getRange("A13").values = [["Điểm cần Business xác nhận"]];
db.getRange("A13:D13").format = { fill: blue, font: { name: font, size: 11, bold: true, color: "#000000" }, borders: { preset: "outside", style: "thin", color: border } };
db.getRange("A14:D14").values = [["No", "Topic", "Question", "Impact"]];
styleHeader(db.getRange("A14:D14"));
const questions = [
  [1,"Withdraw","Có cho withdraw sau PM Accept không?","Quyền action, TAT và trạng thái kết thúc."],
  [2,"Withdraw","Có cho withdraw sau khi đã Submit Policy/Core PA không?","Cần xác định thao tác hủy trên Core PA."],
  [3,"Client Confirm","FO ghi nhận thay khách hàng hay khách hàng có tài khoản thao tác?","Actor, quyền và audit log."],
  [4,"Skip MGR","Tiêu chí quotation/endorsement nào được skip MGR?","Condition của transition và test data."],
  [5,"PM Return","Request tạo từ TS nhưng PM return thì về TS hay FO?","Đích route và owner."],
  [6,"Cancel Withdraw","Cancel và Withdraw của PI có phải hai trạng thái khác nhau?","Status, báo cáo và khả năng reopen."],
  [7,"Re-sign","Bản ký cũ được đánh dấu invalid hay chỉ lưu version history?","Document version và audit."],
  [8,"One to One","Một quotation một PI được chặn cứng hay chỉ cảnh báo?","Validation và duplicate handling."],
];
db.getRange("A15:D22").values = questions;
styleBody(db.getRange("A15:D22"));
stripeRows(db, 15, 22, "D");
db.getRange("A15:A22").format.horizontalAlignment = "center";
db.getRange("15:22").format.rowHeight = 48;
db.freezePanes.freezeRows(5);

const overviewCheck = await wb.inspect({ kind: "table", range: "Overview!A1:H18", include: "values,formulas", tableMaxRows: 20, tableMaxCols: 10 });
console.log("OVERVIEW");
console.log(overviewCheck.ndjson);
const hpCheck = await wb.inspect({ kind: "table", range: "E2E Happy Path!A5:I35", include: "values,formulas", tableMaxRows: 35, tableMaxCols: 10, maxChars: 9000 });
console.log("E2E");
console.log(hpCheck.ndjson);
const catalogCheck = await wb.inspect({ kind: "table", range: `Scenario Catalog!A5:I${5 + allCases.length}`, include: "values,formulas", tableMaxRows: 8, tableMaxCols: 10, maxChars: 5000 });
console.log("CATALOG");
console.log(catalogCheck.ndjson);
const errors = await wb.inspect({ kind: "match", searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!", options: { useRegex: true, maxResults: 200 }, summary: "formula error scan" });
console.log("ERRORS");
console.log(errors.ndjson);

for (const name of ["Overview", "E2E Happy Path", "Scenario Catalog", "Assign Accept", "Quotation Exceptions", "Policy Exceptions", "DB Checks"]) {
  const preview = await wb.render({ sheetName: name, autoCrop: "all", scale: 1, format: "png" });
  await fs.writeFile(`${previewDir}/${name.replaceAll(" ", "_")}.png`, new Uint8Array(await preview.arrayBuffer()));
}

const out = await SpreadsheetFile.exportXlsx(wb);
await out.save(outputPath);
console.log(`OUTPUT ${outputPath}`);
