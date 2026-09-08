import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const inputPath = "D:/Source/MySource/JogetMVC/outputs/01a074c8-fc96-7af1-91e2-7c77ff22c6b3/Email Notification Template - DB Draft.xlsx";
const outputDir = "D:/Source/MySource/JogetMVC/outputs/01a074c8-fc96-7af1-91e2-7c77ff22c6b3";
const outputPath = `${outputDir}/Email Notification Template - Basic Features Added.xlsx`;

const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(inputPath));
const emailSheet = workbook.worksheets.getItem("Email");
const notificationSheet = workbook.worksheets.getItem("Notification");

const quotationTitle = "- Quotation #@@QuotationCode - @@ClientName";
const policyTitle = "- Policy Issuance #@@PolicyIssuanceCode - @@ClientName";

function mailBody(flow, message, action) {
  const quotation = flow === "Báo giá";
  const details = quotation
    ? "Quotation ID: @@QuotationCode\nClient: @@ShortName\nAssigned by: @@MakerName"
    : "Policy Issuance ID: @@PolicyIssuanceCode\nClient: @@ShortName\nAssigned by: @@MakerName";
  const link = quotation ? "View quotation" : "View Policy Issuance";
  return [
    "Dear @@RecipientName,",
    "",
    message,
    "",
    details,
    "Comment: @@Comment",
    "",
    action,
    `${link}: @@urlCallView`,
    "",
    "Thanks & Best Regards!",
  ].join("\n");
}

const emailRows = [
  ["Tạo request báo giá thành công", "MKT-TS", "Báo giá", quotationTitle,
    mailBody("Báo giá", "A new quotation request has been created successfully.", "Please review the request and continue with the next step.")],
  ["Assign báo giá cho TS", "TS", "Báo giá", quotationTitle,
    mailBody("Báo giá", "A quotation task has been assigned to Technical Survey.", "Please accept the task and review the quotation information.")],
  ["Assign báo giá cho UW", "UW", "Báo giá", quotationTitle,
    mailBody("Báo giá", "A quotation task has been assigned to Underwriting.", "Please accept the task and provide the underwriting decision.")],
  ["Reassign báo giá cho PIC khác", "PIC mới", "Báo giá", quotationTitle,
    mailBody("Báo giá", "A quotation task has been reassigned to you.", "Please accept the task and continue processing the quotation.")],
  ["Tạo request cấp đơn thành công", "TS/PM", "Cấp đơn", policyTitle,
    mailBody("Cấp đơn", "A new Policy Issuance request has been created successfully.", "Please review the request and continue with the next step.")],
  ["Assign cấp đơn cho PM", "PM", "Cấp đơn", policyTitle,
    mailBody("Cấp đơn", "A Policy Issuance task has been assigned to Project Manager.", "Please accept the task and continue processing the request.")],
  ["Reassign cấp đơn cho PIC khác", "PIC mới", "Cấp đơn", policyTitle,
    mailBody("Cấp đơn", "A Policy Issuance task has been reassigned to you.", "Please accept the task and continue processing the request.")],
];

const notificationRows = [
  ["Tạo request báo giá thành công", "Quotation", "QuotationCreateRequestNotification",
    "Quotation @@QuotationCode was created", "A new quotation request was created successfully by @@ModifiedBy.", "Bổ sung tính năng cơ bản"],
  ["Tạo request cấp đơn thành công", "Policy Issuance", "PolicyCreateRequestNotification",
    "Policy Issuance @@PolicyIssuanceCode was created", "A new Policy Issuance request was created successfully by @@ModifiedBy.", "Bổ sung tính năng cơ bản"],
  ["Validate khi tạo request", "Both", "RequestValidationNotification",
    "Request information is incomplete", "The request cannot be created because required or invalid data remains. Please correct the highlighted fields.", "Thông báo tại màn hình, không gửi email"],
  ["Validate trước Submit/Route", "Both", "TransitionValidationNotification",
    "Request cannot be submitted", "The workflow cannot move to the next step because required or invalid data remains. Please correct the highlighted fields.", "Thông báo tại màn hình, không gửi email"],
  ["Validate trước Assign/Reassign", "Both", "AssignmentValidationNotification",
    "PIC assignment is incomplete", "The task cannot be assigned because the PIC or required assignment information is missing or invalid.", "Thông báo tại màn hình, không gửi email"],
  ["Validate trước Return/Withdraw/Cancel", "Both", "ReverseActionValidationNotification",
    "Action information is incomplete", "The action cannot be completed because a required reason, comment, or confirmation is missing.", "Thông báo tại màn hình, không gửi email"],
  ["Assign báo giá cho TS", "Quotation", "QuotationAssignTSNotification",
    "Quotation @@QuotationCode was assigned to TS", "A quotation task was assigned to Technical Survey by @@ModifiedBy. Please accept and process the task.", "Bổ sung tính năng cơ bản"],
  ["Assign báo giá cho UW", "Quotation", "QuotationAssignUWNotification",
    "Quotation @@QuotationCode was assigned to UW", "A quotation task was assigned to Underwriting by @@ModifiedBy. Please accept and process the task.", "Bổ sung tính năng cơ bản"],
  ["Assign cấp đơn cho PM", "Policy Issuance", "PolicyAssignPMNotification",
    "Policy Issuance @@PolicyIssuanceCode was assigned to PM", "A Policy Issuance task was assigned to Project Manager by @@ModifiedBy. Please accept and process the task.", "Bổ sung tính năng cơ bản"],
  ["Reassign tác vụ cho PIC khác", "Both", "ReassignNotification",
    "Workflow task was reassigned", "The workflow task was reassigned to a new PIC by @@ModifiedBy. The new PIC should accept and continue the task.", "Bổ sung tính năng cơ bản"],
];

function normalize(value) {
  return String(value ?? "").trim().toLocaleLowerCase("vi-VN");
}

function absoluteLastRow(address) {
  const match = String(address).match(/[A-Z]+(\d+)$/i);
  if (!match) throw new Error(`Unable to resolve the last row from ${address}`);
  return Number(match[1]);
}

function appendUnique(sheet, candidates, lastColumn, templateRow, rowHeight) {
  const used = sheet.getUsedRange();
  const existing = new Set(used.values.map((row) => normalize(row?.[0])).filter(Boolean));
  const missing = candidates.filter((row) => !existing.has(normalize(row[0])));
  if (missing.length === 0) return {added: 0, range: null};

  const lastRow = absoluteLastRow(used.address);
  const startRow = lastRow + 1;
  const endRow = lastRow + missing.length;
  for (let row = startRow; row <= endRow; row += 1) {
    sheet.getRange(`A${row}:${lastColumn}${row}`).copyFrom(
      sheet.getRange(`A${templateRow}:${lastColumn}${templateRow}`),
      "all",
    );
  }
  sheet.getRange(`A${startRow}:${lastColumn}${endRow}`).values = missing;
  const addedRange = sheet.getRange(`A${startRow}:${lastColumn}${endRow}`);
  addedRange.format.fill = "#E4DFEC";
  addedRange.format.font = {color: "#403151"};
  addedRange.format.wrapText = true;
  addedRange.format.verticalAlignment = "top";
  addedRange.format.borders = {preset: "all", style: "thin", color: "#A69BB8"};
  addedRange.format.rowHeight = rowHeight;
  if (sheet.name === "Notification") {
    sheet.getRange(`C${startRow}:C${endRow}`).format.wrapText = false;
  }
  return {added: missing.length, range: `A${startRow}:${lastColumn}${endRow}`};
}

const emailResult = appendUnique(emailSheet, emailRows, "E", 37, 72);
const notificationResult = appendUnique(notificationSheet, notificationRows, "F", 40, 60);

workbook.recalculate();

const emailCheck = await workbook.inspect({
  kind: "region", sheetId: "Email", range: "A34:E50", maxChars: 12000,
});
const notificationCheck = await workbook.inspect({
  kind: "region", sheetId: "Notification", range: "A37:F55", maxChars: 12000,
});
const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!",
  options: {useRegex: true, maxResults: 100},
  summary: "final formula error scan",
  maxChars: 4000,
});

await fs.mkdir(outputDir, {recursive: true});
const emailPreview = await workbook.render({sheetName: "Email", range: "A35:E45", scale: 1, format: "png"});
await fs.writeFile(`${outputDir}/Email-basic-features-preview.png`, new Uint8Array(await emailPreview.arrayBuffer()));
const notificationPreview = await workbook.render({sheetName: "Notification", range: "A39:F51", scale: 1, format: "png"});
await fs.writeFile(`${outputDir}/Notification-basic-features-preview.png`, new Uint8Array(await notificationPreview.arrayBuffer()));

const exported = await SpreadsheetFile.exportXlsx(workbook);
await exported.save(outputPath);

console.log(JSON.stringify({outputPath, emailResult, notificationResult}, null, 2));
console.log(emailCheck.ndjson);
console.log(notificationCheck.ndjson);
console.log(errors.ndjson);
