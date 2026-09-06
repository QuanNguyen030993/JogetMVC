import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const inputPath = "D:/Source/MySource/JogetMVC/outputs/01a074c8-fc96-7af1-91e2-7c77ff22c6b3/Email Notification Template - BRD Events Added.xlsx";
const outputDir = "D:/Source/MySource/JogetMVC/outputs/01a074c8-fc96-7af1-91e2-7c77ff22c6b3";
const outputPath = `${outputDir}/Email Notification Template - DB Draft.xlsx`;

const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(inputPath));

const quotationTitle = "- Quotation #@@QuotationCode - @@ClientName";
const policyTitle = "- Policy Issuance #@@PolicyIssuanceCode - @@ClientName";

function mailBody(flow, message, action) {
  const isQuotation = flow === "Báo giá";
  const detail = isQuotation
    ? "Quotation ID: @@QuotationCode\nClient: @@ShortName\nProcessed by: @@MakerName"
    : "Policy Issuance ID: @@PolicyIssuanceCode\nClient: @@ShortName\nProcessed by: @@MakerName";
  const linkLabel = isQuotation ? "View quotation" : "View Policy Issuance";
  return [
    "Dear @@RecipientName,",
    "",
    message,
    "",
    detail,
    "Comment: @@Comment",
    "",
    action,
    `${linkLabel}: @@urlCallView`,
    "",
    "Thanks & Best Regards!",
  ].join("\n");
}

const emailDb = new Map([
  ["có request mới từ fo", {
    title: quotationTitle,
    content: mailBody("Báo giá", "A quotation has been submitted for your review and approval.", "Please review the quotation and provide your decision."),
  }],
  ["fo refer uw", {
    title: quotationTitle,
    content: mailBody("Báo giá", "A quotation has been referred to Underwriting for review.", "Please review the quotation and provide your underwriting action."),
  }],
  ["uw xác nhận", {
    title: quotationTitle,
    content: mailBody("Báo giá", "The quotation has been confirmed by Underwriting and is pending your action.", "Please review the risk information and continue processing the quotation."),
  }],
  ["đã gửi báo giá tới khách hàng", {
    title: quotationTitle,
    content: [
      "Dear Valued Client,", "", "Please find the quotation prepared for your review.", "",
      "Quotation ID: @@QuotationCode", "Client: @@ShortName", "",
      "Please review and confirm the quotation using the link below.",
      "View quotation: @@urlCallView", "", "Thanks & Best Regards!",
    ].join("\n"),
  }],
  ["ts trả báo giá về fo", {
    title: quotationTitle,
    content: mailBody("Báo giá", "The Technical Survey task has been completed and routed back to FO.", "Please continue reviewing and processing the quotation."),
  }],
  ["uw trả báo giá về fo", {
    title: quotationTitle,
    content: mailBody("Báo giá", "The quotation has been routed back to FO for review.", "Please check the quotation information and select the appropriate next action."),
  }],
  ["có request mới từ mkt", {
    title: policyTitle,
    content: mailBody("Cấp đơn", "A new Policy Issuance request has been initiated.", "Please review and proceed with the Policy Issuance request."),
  }],
  ["pm phản hồi (submit policy , submit policy follow up)", {
    title: policyTitle,
    content: mailBody("Cấp đơn", "The Project Manager has requested a document follow-up for this Policy Issuance.", "Please check the required documents and provide the signed documents."),
  }],
  ["khách hàng ký trả", {
    title: policyTitle,
    content: mailBody("Cấp đơn", "The client has signed and returned the documents. FO/TS has uploaded the signed documents.", "Please review the documents and complete the task."),
  }],
  ["hoàn tất cấp đơn (issued)", {
    title: policyTitle,
    content: mailBody("Cấp đơn", "The Policy Issuance request is ready for completion.", "Please complete the final Policy Issuance task."),
  }],
]);

const emailDraftMessages = new Map([
  ["uw từ chối", ["Underwriting has declined the quotation and returned the request.", "Please review the reason and decide whether to revise or cancel the quotation."]],
  ["báo giá ký hoàn tất", ["The quotation has been signed successfully.", "Please continue with the next business step."]],
  ["báo giá từ chối ký", ["The quotation signature was declined.", "Please review the comment and revise or cancel the quotation."]],
  ["uw cho by pass đơn endorsement (no need to refer)", ["Underwriting has approved bypassing the referral step for this endorsement.", "Please continue processing the quotation."]],
  ["khách hàng xác nhận", ["The client has accepted the quotation.", "Please proceed with Policy Issuance when the required information is complete."]],
  ["fo/ts chỉnh sửa và gửi lại báo giá", ["The quotation has been revised and resubmitted by FO/TS.", "Please review the updated quotation and continue processing."]],
  ["uw yêu cầu bổ sung thông tin", ["Underwriting requires additional information for the quotation.", "Please provide the requested information and resubmit the quotation."]],
  ["mkt/mgr trả báo giá về fo để chỉnh sửa", ["MKT/MGR has returned the quotation to FO for revision.", "Please update the quotation based on the comment and resubmit it."]],
  ["khách hàng từ chối báo giá", ["The client has declined the quotation.", "Please record the client response and close or revise the quotation as appropriate."]],
  ["fo/tmiv hủy báo giá", ["The quotation has been cancelled by FO/TMIV.", "No further action is required unless clarification is needed."]],
  ["báo giá cần ký lại sau khi revise", ["The revised quotation requires a new signature.", "Please review and sign the latest quotation version."]],
  ["pm nhận request", ["The Project Manager has accepted the Policy Issuance request.", "Please review the request and continue processing."]],
  ["mkt nhận đơn ký trả từ pm", ["The signed policy documents have been returned by PM to MKT.", "Please review the documents before sending them to the client."]],
  ["gửi bản ký trả tới khách hàng", ["The policy documents have been sent to the client for signature.", "Please follow up with the client and upload the signed documents when received."]],
  ["fo giao cấp đơn cho ts", ["FO has assigned the Policy Issuance request to TS.", "Please review the request and forward it to PM when ready."]],
  ["fo bỏ qua ts và gửi trực tiếp pm", ["FO has sent the Policy Issuance request directly to PM.", "Please review and process the request."]],
  ["ts chuyển request cấp đơn sang pm", ["TS has completed the review and forwarded the Policy Issuance request to PM.", "Please review and process the request."]],
  ["pm trả request về fo", ["PM has returned the Policy Issuance request to FO for revision.", "Please update the request based on the comment and resubmit it."]],
  ["pm trả request về ts", ["PM has returned the Policy Issuance request to TS for revision.", "Please update the request based on the comment and resubmit it."]],
  ["fo/ts chỉnh sửa và gửi lại pm", ["FO/TS has revised and resubmitted the Policy Issuance request to PM.", "Please review the updated request and continue processing."]],
  ["fo thu hồi request cấp đơn", ["FO has withdrawn the Policy Issuance request.", "Please stop processing until the request is resubmitted."]],
  ["ts thu hồi request cấp đơn", ["TS has withdrawn the Policy Issuance request.", "Please stop processing until the request is resubmitted."]],
  ["hủy request cấp đơn", ["The Policy Issuance request has been cancelled.", "No further action is required unless clarification is needed."]],
  ["nhận đủ chứng từ follow up", ["All required follow-up documents have been received.", "Please verify the documents and continue with Policy Issuance completion."]],
  ["đồng bộ policy no thất bại", ["The Policy Number could not be synchronized.", "Please check the policy data and retry the synchronization."]],
  ["follow up quá hạn hoặc chưa nhận bản ký", ["The Policy Issuance follow-up is overdue or the signed documents have not been received.", "Please follow up with the responsible party and update the request status."]],
]);

const notificationDb = new Map([
  ["initializemessage", ["New Quotation @@QuotationCode has been initialized.", "{{Subject}} - @@QuotationCode"]],
  ["policyissuancenotification", ["Policy Issuance Update: {0}", "PolicyIssuance @@PolicyIssuanceCode has been updated by @@ModifiedBy.\nDetails are as follows:\n<<comment>>"]],
  ["quotationnotification", ["{0} {1} - {2} from {3}", "Quotation @@QuotationCode has been updated by @@ModifiedBy.\nDetails are as follows:\n<<comment>>"]],
  ["successnotification", ["Quotation No: @@QuotationCode was approved by @@ModifiedBy", "The quotation was approved and is pending your action. Please review the quotation details and continue processing."]],
  ["failnotification", ["Quotation No: @@QuotationCode was declined by @@ModifiedBy", "The quotation was declined and is pending your action. Please review the decision and comments."]],
  ["remindernotification", ["Exceeding SLA - @@PolicyIssuanceCode", "The Policy Issuance request has exceeded its SLA and is pending your action. Please review and process the request."]],
  ["clientdenynotification", ["Client Denied {0} {1}", "The client has declined the quotation. Please review the client response and take the appropriate next action."]],
  ["commentnotification", ["New comment", "{0} commented on your {1} {2}"]],
  ["initializepmessage", ["{{Subject}} - @@PolicyIssuanceCode", "New Policy Issuance @@PolicyIssuanceCode has been initialized."]],
]);

const notificationDraft = new Map([
  ["assignnotification", ["New task assigned: {0}", "A workflow task has been assigned to you. Please review the details and take action."]],
  ["acceptnotification", ["Task accepted: {0}", "The assigned workflow task has been accepted by @@ModifiedBy."]],
  ["clientsuccessnotification", ["Client Accepted {0} {1}", "The client has accepted the quotation. Please continue with the next business step."]],
  ["quotationreturnnotification", ["Quotation @@QuotationCode was returned to FO", "The Technical Survey task was returned to FO by @@ModifiedBy.\n<<comment>>"]],
  ["quotationrevisenotification", ["Quotation @@QuotationCode was revised and resubmitted", "The quotation was revised and resubmitted by @@ModifiedBy.\n<<comment>>"]],
  ["uwneedmoreinfonotification", ["Additional information required for Quotation @@QuotationCode", "Underwriting requires additional information for this quotation.\n<<comment>>"]],
  ["uwreturnnotification", ["Quotation @@QuotationCode was returned by UW", "Underwriting returned the quotation to FO for revision.\n<<comment>>"]],
  ["managerreturnnotification", ["Quotation @@QuotationCode was returned for revision", "MKT/MGR returned the quotation to FO for revision.\n<<comment>>"]],
  ["quotationresignnotification", ["Quotation @@QuotationCode requires re-signing", "The revised quotation requires a new signature. Please review the latest version."]],
  ["quotationcancelnotification", ["Quotation @@QuotationCode was cancelled", "The quotation was cancelled by @@ModifiedBy.\n<<comment>>"]],
  ["policyassigntsnotification", ["Policy Issuance @@PolicyIssuanceCode was assigned to TS", "FO assigned the Policy Issuance request to TS. Please review and process the request."]],
  ["policysubmitpmnotification", ["Policy Issuance @@PolicyIssuanceCode was sent to PM", "FO sent the Policy Issuance request directly to PM. Please review and process the request."]],
  ["policytssubmitpmnotification", ["Policy Issuance @@PolicyIssuanceCode was forwarded to PM", "TS forwarded the Policy Issuance request to PM. Please review and process the request."]],
  ["policyreturnfonotification", ["Policy Issuance @@PolicyIssuanceCode was returned to FO", "PM returned the Policy Issuance request to FO for revision.\n<<comment>>"]],
  ["policyreturntsnotification", ["Policy Issuance @@PolicyIssuanceCode was returned to TS", "PM returned the Policy Issuance request to TS for revision.\n<<comment>>"]],
  ["policyrevisenotification", ["Policy Issuance @@PolicyIssuanceCode was revised and resubmitted", "FO/TS revised and resubmitted the Policy Issuance request to PM.\n<<comment>>"]],
  ["policywithdrawnotification", ["Policy Issuance @@PolicyIssuanceCode was withdrawn", "The Policy Issuance request was withdrawn by @@ModifiedBy.\n<<comment>>"]],
  ["policycancelnotification", ["Policy Issuance @@PolicyIssuanceCode was cancelled", "The Policy Issuance request was cancelled by @@ModifiedBy.\n<<comment>>"]],
  ["policyissuednotification", ["Policy Issuance @@PolicyIssuanceCode was completed", "The Policy Issuance request has been completed successfully."]],
  ["followupcompletednotification", ["Follow-up documents received for @@PolicyIssuanceCode", "All required follow-up documents have been received. Please verify the documents and continue processing."]],
  ["policysyncfailednotification", ["Policy Number synchronization failed for @@PolicyIssuanceCode", "The Policy Number could not be synchronized. Please check the policy data and retry."]],
  ["policyfollowupremindernotification", ["Follow-up overdue for @@PolicyIssuanceCode", "The follow-up is overdue or signed documents have not been received. Please take action."]],
]);

function normalize(value) {
  return String(value ?? "").trim().toLocaleLowerCase("vi-VN");
}

const colors = {
  dbFill: "#E2F0D9",
  dbFont: "#375623",
  draftFill: "#FCE4D6",
  draftFont: "#843C0C",
};

const emailSheet = workbook.worksheets.getItem("Email");
const emailValues = emailSheet.getRange("A2:E37").values;
let emailDbCount = 0;
let emailDraftCount = 0;
for (let index = 0; index < emailValues.length; index += 1) {
  const rowNumber = index + 2;
  const [eventName, , flow, currentTitle, currentContent] = emailValues[index];
  const key = normalize(eventName);
  let template = emailDb.get(key);
  let sourceType = "db";
  if (!template) {
    const draft = emailDraftMessages.get(key);
    if (!draft) continue;
    template = {
      title: flow === "Báo giá" ? quotationTitle : policyTitle,
      content: mailBody(flow, draft[0], draft[1]),
    };
    sourceType = "draft";
  }

  const nextTitle = String(currentTitle ?? "").trim() ? currentTitle : template.title;
  const nextContent = String(currentContent ?? "").trim() ? currentContent : template.content;
  emailSheet.getRange(`D${rowNumber}:E${rowNumber}`).values = [[nextTitle, nextContent]];
  const cells = emailSheet.getRange(`D${rowNumber}:E${rowNumber}`);
  cells.format.fill = sourceType === "db" ? colors.dbFill : colors.draftFill;
  cells.format.font = { color: sourceType === "db" ? colors.dbFont : colors.draftFont };
  cells.format.wrapText = true;
  cells.format.verticalAlignment = "top";
  emailSheet.getRange(`A${rowNumber}:E${rowNumber}`).format.rowHeight = 72;
  if (sourceType === "db") emailDbCount += 1; else emailDraftCount += 1;
}

const notificationSheet = workbook.worksheets.getItem("Notification");
const notificationValues = notificationSheet.getRange("A10:F40").values;
let notificationDbCount = 0;
let notificationDraftCount = 0;
for (let index = 0; index < notificationValues.length; index += 1) {
  const rowNumber = index + 10;
  const code = normalize(notificationValues[index][2]);
  const currentTitle = notificationValues[index][3];
  const currentContent = notificationValues[index][4];
  let template = notificationDb.get(code);
  let sourceType = "db";
  if (!template) {
    template = notificationDraft.get(code);
    sourceType = "draft";
  }
  if (!template) continue;

  const nextTitle = String(currentTitle ?? "").trim() ? currentTitle : template[0];
  const nextContent = String(currentContent ?? "").trim() ? currentContent : template[1];
  notificationSheet.getRange(`D${rowNumber}:E${rowNumber}`).values = [[nextTitle, nextContent]];
  const cells = notificationSheet.getRange(`D${rowNumber}:E${rowNumber}`);
  cells.format.fill = sourceType === "db" ? colors.dbFill : colors.draftFill;
  cells.format.font = { color: sourceType === "db" ? colors.dbFont : colors.draftFont };
  cells.format.wrapText = true;
  cells.format.verticalAlignment = "top";
  notificationSheet.getRange(`A${rowNumber}:F${rowNumber}`).format.rowHeight = 60;
  if (sourceType === "db") notificationDbCount += 1; else notificationDraftCount += 1;
}

await fs.mkdir(outputDir, { recursive: true });
const exported = await SpreadsheetFile.exportXlsx(workbook);
await exported.save(outputPath);

const emailCheck = await workbook.inspect({
  kind: "region",
  sheetId: "Email",
  range: "A2:E37",
  maxChars: 12000,
});
const notificationCheck = await workbook.inspect({
  kind: "region",
  sheetId: "Notification",
  range: "A9:F40",
  maxChars: 12000,
});
const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!",
  options: { useRegex: true, maxResults: 100 },
  summary: "final formula error scan",
  maxChars: 4000,
});

const emailPreview = await workbook.render({sheetName: "Email", range: "A14:E24", scale: 1, format: "png"});
await fs.writeFile(`${outputDir}/Email-DB-draft-preview.png`, new Uint8Array(await emailPreview.arrayBuffer()));
const notificationPreview = await workbook.render({sheetName: "Notification", range: "A9:F25", scale: 1, format: "png"});
await fs.writeFile(`${outputDir}/Notification-DB-draft-preview.png`, new Uint8Array(await notificationPreview.arrayBuffer()));

console.log(JSON.stringify({
  outputPath,
  email: {dbBased: emailDbCount, drafted: emailDraftCount},
  notification: {dbBased: notificationDbCount, drafted: notificationDraftCount},
}, null, 2));
console.log(emailCheck.ndjson);
console.log(notificationCheck.ndjson);
console.log(errors.ndjson);
