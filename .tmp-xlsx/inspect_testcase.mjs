import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const inputPath = "D:/Source/MySource/JogetMVC/outputs/01a074c8-fc96-7af1-91e2-7c77ff22c6b3/Workflow_Test_Cases_From_BRD.xlsx";
const previewDir = "D:/Source/MySource/JogetMVC/.tmp-xlsx/testcase-previews";
const wb = await SpreadsheetFile.importXlsx(await FileBlob.load(inputPath));
await fs.mkdir(previewDir, {recursive: true});
const summary = await wb.inspect({kind:"workbook,sheet,table", maxChars:10000, tableMaxRows:8, tableMaxCols:16, tableMaxCellChars:160});
console.log(summary.ndjson);
for (const sheet of wb.worksheets.items) {
  const used = sheet.getUsedRange();
  console.log(sheet.name, used?.address);
  if (used) {
    const region = await wb.inspect({kind:"region", sheetId:sheet.name, range:used.address, maxChars:12000});
    console.log(region.ndjson);
  }
  const preview = await wb.render({sheetName:sheet.name, autoCrop:"all", scale:1, format:"png"});
  await fs.writeFile(`${previewDir}/${sheet.name.replaceAll(/[^A-Za-z0-9_-]/g,"_")}.png`, new Uint8Array(await preview.arrayBuffer()));
}
console.log("SCENARIO_LAST", JSON.stringify(wb.worksheets.getItem("Scenario Catalog").getRange("A75:I90").values));
console.log("ASSIGN_ALL", JSON.stringify(wb.worksheets.getItem("Assign Accept").getRange("A5:I21").values));
console.log("OVERVIEW_FORMULAS", JSON.stringify(wb.worksheets.getItem("Overview").getRange("A5:H6").formulas));
