import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";
const wb = await SpreadsheetFile.importXlsx(await FileBlob.load("D:/Source/MySource/JogetMVC/outputs/01a074c8-fc96-7af1-91e2-7c77ff22c6b3/Email Notification Template - BRD Events Added.xlsx"));
const s = wb.worksheets.getItem("Notification");
console.log("used", s.getUsedRange().address);
console.log(JSON.stringify(s.getRange("A18:F40").values));
const style = await wb.inspect({kind:"computedStyle", sheetId:"Notification", range:"A22:F24", maxChars:8000});
console.log(style.ndjson);
