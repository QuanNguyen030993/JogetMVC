import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const inputPath = "D:/Source/MySource/JogetMVC/outputs/01a074c8-fc96-7af1-91e2-7c77ff22c6b3/Workflow_Test_Cases_From_BRD.xlsx";
const outputDir = "D:/Source/MySource/JogetMVC/outputs/01a074c8-fc96-7af1-91e2-7c77ff22c6b3";
const outputPath = `${outputDir}/Workflow_Test_Cases_From_BRD_Basic_Features.xlsx`;
const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(inputPath));

const overview = workbook.worksheets.getItem("Overview");
const e2e = workbook.worksheets.getItem("E2E Happy Path");
const catalog = workbook.worksheets.getItem("Scenario Catalog");
const assign = workbook.worksheets.getItem("Assign Accept");

const basicCases = [
  ["BAS-Q-001","Quotation","Basic Function","Tạo quotation request với đầy đủ dữ liệu tối thiểu.","Tạo đúng một quotation record và một workflow instance; mã request không trùng.","Draft","High","Not Run",null],
  ["BAS-Q-002","Quotation","Basic Function","Tại màn hình tạo quotation, bỏ trống trường bắt buộc rồi bấm Validate.","Hiển thị lỗi tại đúng trường; không chuyển bước và không tạo dữ liệu sai.","Unchanged","High","Not Run",null],
  ["BAS-Q-003","Quotation","Basic Function","Sửa toàn bộ lỗi trên form quotation rồi bấm Validate lại.","Hết lỗi validation; dữ liệu hợp lệ được giữ nguyên và cho phép thao tác tiếp.","Validated","High","Not Run",null],
  ["BAS-Q-004","Quotation","Basic Function","Lưu Draft quotation, mở lại và bấm Validate.","Dữ liệu draft được tải đủ; validation dùng giá trị mới nhất đã lưu.","Draft","Medium","Not Run",null],
  ["BAS-Q-005","Quotation","Basic Function","FO bấm Validate trước khi Assign quotation cho TS.","Chỉ cho Assign khi trường bắt buộc và request detail hợp lệ.","FO Process","High","Not Run",null],
  ["BAS-Q-006","Quotation","Basic Function","FO bấm Validate trước khi Route UW, trình LMKT và gửi quotation cho khách hàng.","Mỗi action chặn đúng dữ liệu/attachment còn thiếu và không đổi node khi lỗi.","FO Process","High","Not Run",null],
  ["BAS-P-001","Policy Issuance","Basic Function","Tạo Policy Issuance từ quotation đã Confirmed.","Tạo đúng một PI, liên kết đúng quotation và khởi tạo workflow tại FO.","FO Process","High","Not Run",null],
  ["BAS-P-002","Policy Issuance","Basic Function","Tại màn hình tạo PI, thiếu trường bắt buộc rồi bấm Validate.","Hiển thị lỗi tại đúng trường; không tạo hoặc submit PI chưa hợp lệ.","Unchanged","High","Not Run",null],
  ["BAS-P-003","Policy Issuance","Basic Function","TS bấm Validate checklist và attachment trước khi Submit PI sang PM.","Chỉ rõ checklist/attachment thiếu; task vẫn ở TS khi validation lỗi.","TS Process","High","Not Run",null],
  ["BAS-P-004","Policy Issuance","Basic Function","PM bấm Validate trước Submit Policy sang Core PA.","Chặn submit nếu Quotation No, dữ liệu policy hoặc checklist chưa hợp lệ.","PM Process","High","Not Run",null],
  ["BAS-P-005","Policy Issuance","Basic Function","FO/TS bấm Validate trước Submit chứng từ follow-up về PM.","Chặn submit nếu thiếu signed-back document hoặc thông tin bắt buộc.","Follow Up","High","Not Run",null],
  ["BAS-P-006","Policy Issuance","Basic Function","PM bấm Validate trước Complete Policy Issuance.","Chặn Complete khi còn task mở, follow-up thiếu hoặc Policy No chưa đồng bộ.","PM Process","High","Not Run",null],
];

const assignCases = [
  ["ASN-017","Common","Assign Accept","Bấm Assign nhưng chưa chọn PIC.","Hiển thị lỗi bắt buộc; không tạo task, không gửi notification và không đổi status.","Unchanged","High","Not Run",null],
  ["ASN-018","Common","Assign Accept","Assign task cho PIC inactive hoặc tài khoản bị khóa.","Hệ thống từ chối; owner và trạng thái hiện tại giữ nguyên.","Unchanged","High","Not Run",null],
  ["ASN-019","Common","Assign Accept","Assign task cho PIC không đúng role hoặc department của node.","Danh sách không cho chọn hoặc backend từ chối; không tạo assignment sai quyền.","Unchanged","High","Not Run",null],
  ["ASN-020","Common","Assign Accept","Reassign task sau khi PIC cũ đã Accept.","Owner chuyển đúng PIC mới; lưu người reassign, thời gian, lý do và lịch sử owner cũ.","In Progress","High","Not Run",null],
  ["ASN-021","Common","Assign Accept","Bấm Assign hai lần liên tiếp hoặc gửi lại cùng request.","Chỉ có một task active và một owner; không tạo notification hoặc log trùng.","Pending","High","Not Run",null],
  ["ASN-022","Common","Assign Accept","Assign thành công cho PIC hợp lệ.","Tạo task pending, gửi đúng một notification/mail và lưu Notification Time.","Pending","High","Not Run",null],
];

function existingIds(sheet) {
  return new Set(sheet.getUsedRange().values.map((row) => String(row?.[0] ?? "").trim()).filter(Boolean));
}

const catalogIds = existingIds(catalog);
const catalogAdditions = [...basicCases, ...assignCases].filter((row) => !catalogIds.has(row[0]));
if (catalogAdditions.length) {
  for (let row = 91; row <= 90 + catalogAdditions.length; row += 1) {
    catalog.getRange(`A${row}:I${row}`).copyFrom(catalog.getRange("A90:I90"), "all");
  }
  catalog.getRange(`A91:I${90 + catalogAdditions.length}`).values = catalogAdditions;
}

const assignIds = existingIds(assign);
const assignAdditions = assignCases.filter((row) => !assignIds.has(row[0]));
if (assignAdditions.length) {
  for (let row = 22; row <= 21 + assignAdditions.length; row += 1) {
    assign.getRange(`A${row}:I${row}`).copyFrom(assign.getRange("A21:I21"), "all");
  }
  assign.getRange(`A22:I${21 + assignAdditions.length}`).values = assignAdditions;
}

const oldE2e = e2e.getRange("A6:I35").values;
const injections = new Map([
  [2,["Quotation","FO","Validate","Bấm Validate dữ liệu quotation trước khi Assign TS.","Không còn trường bắt buộc hoặc request detail bị thiếu.","FO Process",null,"Not Run"]],
  [5,["Quotation","TS","Validate","Bấm Validate phí, quotation document và dữ liệu trước khi Submit về FO.","Lỗi hiển thị đúng trường; không submit khi dữ liệu chưa hợp lệ.","TS Process",null,"Not Run"]],
  [7,["Quotation","FO","Validate","Bấm Validate referral data trước khi Route sang UW.","Referral reason, comment và attachment bắt buộc hợp lệ.","FO Process",null,"Not Run"]],
  [11,["Quotation","FO","Validate","Bấm Validate quotation version và attachment trước khi trình LMKT ký.","Chỉ trình ký bản quotation mới nhất và đủ tài liệu.","FO Review",null,"Not Run"]],
  [13,["Quotation","FO","Validate","Bấm Validate chữ ký và email attachment trước khi gửi khách hàng.","Bản ký đúng version; người nhận và attachment hợp lệ.","FO Review",null,"Not Run"]],
  [20,["Policy Issuance","TS","Validate","Bấm Validate checklist và attachment trước khi Submit PI sang PM.","Không còn checklist item hoặc attachment bắt buộc bị thiếu.","TS Process",null,"Not Run"]],
  [23,["Policy Issuance","PM","Validate","Bấm Validate dữ liệu trước khi Submit Policy sang Core PA.","Quotation No, policy data và checklist hợp lệ trước khi gọi Core PA.","PM Process",null,"Not Run"]],
  [29,["Policy Issuance","PM","Validate","Bấm Validate toàn bộ điều kiện trước khi Complete PI.","Policy No đã đồng bộ, follow-up hoàn tất và không còn task mở.","PM Process",null,"Not Run"]],
]);

const expandedE2e = [];
for (let index = 0; index < oldE2e.length; index += 1) {
  const originalStep = index + 1;
  const original = [...oldE2e[index]];
  expandedE2e.push(original);
  if (injections.has(originalStep)) expandedE2e.push([null, ...injections.get(originalStep)]);
}
expandedE2e.forEach((row, index) => { row[0] = index + 1; });

const e2eExtraCount = expandedE2e.length - oldE2e.length;
for (let row = 36; row <= 35 + e2eExtraCount; row += 1) {
  e2e.getRange(`A${row}:I${row}`).copyFrom(e2e.getRange("A35:I35"), "all");
}
e2e.getRange(`A6:I${5 + expandedE2e.length}`).values = expandedE2e;

const lavenderFill = "#E4DFEC";
const lavenderFont = "#403151";
const newCatalogStart = 91;
const newCatalogEnd = 90 + catalogAdditions.length;
if (catalogAdditions.length) {
  const range = catalog.getRange(`A${newCatalogStart}:I${newCatalogEnd}`);
  range.format.fill = lavenderFill;
  range.format.font = {color: lavenderFont};
  range.format.wrapText = true;
  range.format.verticalAlignment = "top";
  range.format.rowHeight = 48;
}
const newAssignStart = 22;
const newAssignEnd = 21 + assignAdditions.length;
if (assignAdditions.length) {
  const range = assign.getRange(`A${newAssignStart}:I${newAssignEnd}`);
  range.format.fill = lavenderFill;
  range.format.font = {color: lavenderFont};
  range.format.wrapText = true;
  range.format.verticalAlignment = "top";
  range.format.rowHeight = 48;
}

const e2eLastRow = 5 + expandedE2e.length;
for (let row = 6; row <= e2eLastRow; row += 1) {
  const actionType = String(e2e.getRange(`D${row}`).values[0][0] ?? "");
  if (actionType === "Validate") {
    const range = e2e.getRange(`A${row}:I${row}`);
    range.format.fill = lavenderFill;
    range.format.font = {color: lavenderFont};
  }
  e2e.getRange(`A${row}:I${row}`).format.rowHeight = 42;
}

const catalogLastRow = 90 + catalogAdditions.length;
overview.getRange("A6:H6").formulas = [[
  `=COUNTA('Scenario Catalog'!A6:A${catalogLastRow})`,
  "=COUNTA('Scenario Catalog'!A6:A17)",
  `=COUNTA('Scenario Catalog'!A18:A33)+COUNTA('Scenario Catalog'!A${91 + basicCases.length}:A${catalogLastRow})`,
  "=COUNTA('Scenario Catalog'!A34:A57)",
  "=COUNTA('Scenario Catalog'!A58:A90)",
  `=COUNTIF('Scenario Catalog'!F6:F${catalogLastRow},"Need Confirmation")`,
  `=COUNTIF('Scenario Catalog'!H6:H${catalogLastRow},"Pass")`,
  `=COUNTIF('Scenario Catalog'!H6:H${catalogLastRow},"Fail")+COUNTIF('Scenario Catalog'!H6:H${catalogLastRow},"Blocked")`,
]];
overview.getRange("B9").values = [[`${expandedE2e.length} bước từ tạo quotation đến hoàn tất policy, gồm Validate tại các điểm chuyển bước.`]];
overview.getRange("B10").values = [["Danh mục happy, basic create/validate, assign/accept và exception cases."]];

workbook.recalculate();

const checks = [];
checks.push((await workbook.inspect({kind:"region",sheetId:"Overview",range:"A5:H10",maxChars:6000})).ndjson);
checks.push((await workbook.inspect({kind:"region",sheetId:"E2E Happy Path",range:`A5:I${e2eLastRow}`,maxChars:10000})).ndjson);
checks.push((await workbook.inspect({kind:"region",sheetId:"Scenario Catalog",range:`A88:I${catalogLastRow}`,maxChars:12000})).ndjson);
checks.push((await workbook.inspect({kind:"region",sheetId:"Assign Accept",range:`A18:I${newAssignEnd}`,maxChars:9000})).ndjson);
const errors = await workbook.inspect({
  kind:"match",
  searchTerm:"#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!",
  options:{useRegex:true,maxResults:100},
  summary:"final formula error scan",
  maxChars:4000,
});

await fs.mkdir(outputDir,{recursive:true});
const previews = [
  ["Overview","A1:H17","Testcase-basic-overview.png"],
  ["E2E Happy Path","A5:I18","Testcase-basic-e2e.png"],
  ["Scenario Catalog",`A88:I${catalogLastRow}`,"Testcase-basic-catalog.png"],
  ["Assign Accept",`A18:I${newAssignEnd}`,"Testcase-basic-assign.png"],
];
for (const [sheetName,range,fileName] of previews) {
  const preview = await workbook.render({sheetName,range,scale:1,format:"png"});
  await fs.writeFile(`${outputDir}/${fileName}`,new Uint8Array(await preview.arrayBuffer()));
}
const exported = await SpreadsheetFile.exportXlsx(workbook);
await exported.save(outputPath);

console.log(JSON.stringify({outputPath,catalogAdded:catalogAdditions.length,assignAdded:assignAdditions.length,e2eSteps:expandedE2e.length,catalogLastRow},null,2));
checks.forEach((value) => console.log(value));
console.log(errors.ndjson);
