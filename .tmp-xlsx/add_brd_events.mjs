import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const inputPath = "D:/Folder drive/Email Notification Template.xlsx";
const outputDir = "D:/Source/MySource/JogetMVC/outputs/01a074c8-fc96-7af1-91e2-7c77ff22c6b3";
const outputPath = `${outputDir}/Email Notification Template - BRD Events Added.xlsx`;

const input = await FileBlob.load(inputPath);
const workbook = await SpreadsheetFile.importXlsx(input);

const additions = {
  Email: [
    ["TS trả báo giá về FO", "FO", "Báo giá", "", ""],
    ["FO/TS chỉnh sửa và gửi lại báo giá", "All PIC", "Báo giá", "", ""],
    ["UW yêu cầu bổ sung thông tin", "MKT-FO", "Báo giá", "", ""],
    ["UW trả báo giá về FO", "MKT-FO", "Báo giá", "", ""],
    ["MKT/MGR trả báo giá về FO để chỉnh sửa", "FO", "Báo giá", "", ""],
    ["Khách hàng từ chối báo giá", "All PIC", "Báo giá", "", ""],
    ["FO/TMIV hủy báo giá", "All PIC", "Báo giá", "", ""],
    ["Báo giá cần ký lại sau khi revise", "MKT-MGR", "Báo giá", "", ""],
    ["FO giao cấp đơn cho TS", "TS", "Cấp đơn", "", ""],
    ["FO bỏ qua TS và gửi trực tiếp PM", "PM", "Cấp đơn", "", ""],
    ["TS chuyển request cấp đơn sang PM", "PM", "Cấp đơn", "", ""],
    ["PM trả request về FO", "FO", "Cấp đơn", "", ""],
    ["PM trả request về TS", "TS", "Cấp đơn", "", ""],
    ["FO/TS chỉnh sửa và gửi lại PM", "PM", "Cấp đơn", "", ""],
    ["FO thu hồi request cấp đơn", "All PIC", "Cấp đơn", "", ""],
    ["TS thu hồi request cấp đơn", "All PIC", "Cấp đơn", "", ""],
    ["Hủy request cấp đơn", "All PIC", "Cấp đơn", "", ""],
    ["Hoàn tất cấp đơn (Issued)", "All PIC", "Cấp đơn", "", ""],
    ["Nhận đủ chứng từ follow up", "All PIC", "Cấp đơn", "", ""],
    ["Đồng bộ Policy No thất bại", "PM", "Cấp đơn", "", ""],
    ["Follow up quá hạn hoặc chưa nhận bản ký", "All PIC", "Cấp đơn", "", ""],
  ],
  Notification: [
    ["TS trả báo giá về FO", "Quotation", "QuotationReturnNotification", "", "", "Bổ sung theo BRD"],
    ["Chỉnh sửa và gửi lại báo giá", "Quotation", "QuotationReviseNotification", "", "", "Bổ sung theo BRD"],
    ["UW yêu cầu bổ sung thông tin", "Quotation", "UWNeedMoreInfoNotification", "", "", "Bổ sung theo BRD"],
    ["UW trả báo giá về FO", "Quotation", "UWReturnNotification", "", "", "Bổ sung theo BRD"],
    ["MKT MGR trả báo giá về FO", "Quotation", "ManagerReturnNotification", "", "", "Bổ sung theo BRD"],
    ["Báo giá cần ký lại sau revise", "Quotation", "QuotationReSignNotification", "", "", "Bổ sung theo BRD"],
    ["Hủy báo giá", "Quotation", "QuotationCancelNotification", "", "", "Bổ sung theo BRD"],
    ["Giao cấp đơn cho TS", "Policy Issuance", "PolicyAssignTSNotification", "", "", "Bổ sung theo BRD"],
    ["Bỏ qua TS và gửi PM", "Policy Issuance", "PolicySubmitPMNotification", "", "", "Bổ sung theo BRD"],
    ["TS chuyển cấp đơn sang PM", "Policy Issuance", "PolicyTSSubmitPMNotification", "", "", "Bổ sung theo BRD"],
    ["PM trả cấp đơn về FO", "Policy Issuance", "PolicyReturnFONotification", "", "", "Bổ sung theo BRD"],
    ["PM trả cấp đơn về TS", "Policy Issuance", "PolicyReturnTSNotification", "", "", "Bổ sung theo BRD"],
    ["Chỉnh sửa và gửi lại cấp đơn", "Policy Issuance", "PolicyReviseNotification", "", "", "Bổ sung theo BRD"],
    ["Thu hồi cấp đơn", "Policy Issuance", "PolicyWithdrawNotification", "", "", "Bổ sung theo BRD"],
    ["Hủy cấp đơn", "Policy Issuance", "PolicyCancelNotification", "", "", "Bổ sung theo BRD"],
    ["Hoàn tất cấp đơn", "Policy Issuance", "PolicyIssuedNotification", "", "", "Bổ sung theo BRD"],
    ["Nhận đủ chứng từ follow up", "Policy Issuance", "FollowUpCompletedNotification", "", "", "Bổ sung theo BRD"],
    ["Đồng bộ Policy No thất bại", "Policy Issuance", "PolicySyncFailedNotification", "", "", "Bổ sung theo BRD"],
    ["Follow up quá hạn", "Policy Issuance", "PolicyFollowUpReminderNotification", "", "", "Bổ sung theo BRD"],
  ],
};

function normalize(value) {
  return String(value ?? "").trim().toLocaleLowerCase("vi-VN");
}

function absoluteLastRow(address) {
  const match = String(address).match(/[A-Z]+(\d+)$/i);
  if (!match) throw new Error(`Không xác định được dòng cuối của vùng ${address}`);
  return Number(match[1]);
}

const summary = {};
for (const [sheetName, candidates] of Object.entries(additions)) {
  const sheet = workbook.worksheets.getItem(sheetName);
  const used = sheet.getUsedRange();
  const values = used.values;
  const existingEvents = new Set(values.map((row) => normalize(row?.[0])).filter(Boolean));
  const missing = candidates
    .filter((row) => !existingEvents.has(normalize(row[0])))
    .map((row) => row.map((value) => value === "" ? null : value));
  const lastRow = absoluteLastRow(used.address);

  if (missing.length > 0) {
    const endRow = lastRow + missing.length;
    const lastColumn = sheetName === "Email" ? "E" : "F";
    for (let row = lastRow + 1; row <= endRow; row += 1) {
      sheet.getRange(`A${row}:${lastColumn}${row}`).copyFrom(
        sheet.getRange(`A${lastRow}:${lastColumn}${lastRow}`),
        "all",
      );
    }
    sheet.getRange(`A${lastRow + 1}:${lastColumn}${endRow}`).values = missing;
    const addedRange = sheet.getRange(`A${lastRow + 1}:${lastColumn}${endRow}`);
    addedRange.format.fill = "#FFF2CC";
    addedRange.format.font = { color: "#7F6000" };
    addedRange.format.wrapText = true;
    addedRange.format.verticalAlignment = "center";
    addedRange.format.borders = { preset: "all", style: "thin", color: "#D6B656" };
    addedRange.format.autofitRows();
    if (sheetName === "Notification") {
      sheet.getRange(`C${lastRow + 1}:C${endRow}`).format.wrapText = false;
    }

    summary[sheetName] = { added: missing.length, range: `A${lastRow + 1}:${lastColumn}${endRow}` };
  } else {
    summary[sheetName] = { added: 0, range: null };
  }
}

await fs.mkdir(outputDir, { recursive: true });
const exported = await SpreadsheetFile.exportXlsx(workbook);
await exported.save(outputPath);

const emailPreview = await workbook.render({
  sheetName: "Email",
  range: "A14:E37",
  scale: 1,
  format: "png",
});
await fs.writeFile(`${outputDir}/Email-BRD-added-preview.png`, new Uint8Array(await emailPreview.arrayBuffer()));
const notificationPreview = await workbook.render({
  sheetName: "Notification",
  range: "A18:F40",
  scale: 1,
  format: "png",
});
await fs.writeFile(`${outputDir}/Notification-BRD-added-preview.png`, new Uint8Array(await notificationPreview.arrayBuffer()));

const verify = await workbook.inspect({
  kind: "region",
  sheetId: "Email",
  range: "A14:E40",
  maxChars: 12000,
});
const verifyNotification = await workbook.inspect({
  kind: "region",
  sheetId: "Notification",
  range: "A18:F45",
  maxChars: 12000,
});
const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 50 },
  summary: "final formula error scan",
  maxChars: 4000,
});

console.log(JSON.stringify({ outputPath, summary }, null, 2));
console.log(verify.ndjson);
console.log(verifyNotification.ndjson);
console.log(errors.ndjson);
