using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Wordprocessing;
using System.Reflection;
//using SautinSoft.Document;
using Run = DocumentFormat.OpenXml.Wordprocessing.Run;
using Table = DocumentFormat.OpenXml.Wordprocessing.Table;
using Paragraph = DocumentFormat.OpenXml.Wordprocessing.Paragraph;
//using Syncfusion.DocIO.DLS; //docx to html 
//using Syncfusion.DocIO; //docx to html 
using Syncfusion.Pdf;
using Syncfusion.DocIORenderer;
using Break = DocumentFormat.OpenXml.Wordprocessing.Break;
using Color = DocumentFormat.OpenXml.Wordprocessing.Color;
using Outline = SurveyReportRE.Models.Migration.Business.MasterData.Outline;
using Text = DocumentFormat.OpenXml.Wordprocessing.Text;
using TableRow = DocumentFormat.OpenXml.Wordprocessing.TableRow;
using TableCell = DocumentFormat.OpenXml.Wordprocessing.TableCell;
using Indentation = DocumentFormat.OpenXml.Wordprocessing.Indentation;
using Body = DocumentFormat.OpenXml.Wordprocessing.Body;
using Newtonsoft.Json;
using HtmlToOpenXml;
using RESurveyTool.Models.Models.Parsing;
using RESurveyTool.Common.Models;
using System.Text;
//using OpenHtmlToPdf;
//using AngleSharp.Dom;
//using iText.Kernel.Pdf; html to pdf 
using Document = Microsoft.Office.Interop.Word.Document;
using Microsoft.Office.Interop.Word;
using SurveyReportRE.Models.Migration.Business.Data;
using Org.BouncyCastle.Crypto.Paddings;
using DocumentFormat.OpenXml.Presentation;
using RESurveyTool.Common.Constant;
using System.Dynamic;
using iText.IO.Image;
using Newtonsoft.Json.Linq;
using System.Linq;
using AngleSharp.Text;
using RESurveyTool.Common.Common;
using System.Drawing;
using System.Drawing.Imaging;
using Microsoft.AspNetCore.Http;
using static SkiaSharp.HarfBuzz.SKShaper;
using SurveyReportRE.Models.Migration.Business.Workflow;
using System.Text.RegularExpressions;
using A = DocumentFormat.OpenXml.Drawing;
using PIC = DocumentFormat.OpenXml.Drawing.Pictures;
using DW = DocumentFormat.OpenXml.Drawing.Wordprocessing;
using DocumentFormat.OpenXml.Vml;
using SurveyReportRE.Models.Business.Migration.Config;

namespace SurveyReportRE.Common
{
    public static class WordUtil
    {

        #region Lv 1 - Prepare both static and dynamic before Word process
        public static void GenerateFilesFromDynamic(
            WordHandleConfig wordHandleConfig
            )
        {
            List<OpenXMLOutline> placeholderContentFiles = new List<OpenXMLOutline>();
            // Tạo đường dẫn file
            foreach (var list in wordHandleConfig.RenderDataList)
            {
                if (list.IsDynamic)
                {
                    foreach (dynamic data in list.Data)
                    {
                        foreach (PropertyInfo property in data.GetType().GetProperties())
                        {
                            string fieldName = property.Name;
                            if (fieldName == list.DynamicKey)
                            {
                                object rawValue = property.GetValue(data);
                                if (rawValue != null && rawValue != DBNull.Value)
                                {
                                    byte[] fieldValue = (byte[])rawValue;
                                    List<DynamicOutline> dynamicOutlines = new List<DynamicOutline>();
                                    dynamicOutlines = JsonConvert.DeserializeObject<List<DynamicOutline>>(Encoding.UTF8.GetString(fieldValue));
                                    list.DynamicData.AddRange(dynamicOutlines);
                                }
                            }
                            else
                            {
                                string fieldValue = property.GetValue(data);
                                string placeholder = fieldName.ToLower();
                                dynamic dataGridConfigList = wordHandleConfig.DataGridConfig.Where(f => f.DataField.ToLower() == placeholder).ToList();

                                //bool checkInt = false;
                                //int outlineId = 0;
                                string[] outlineIds = null;
                                try
                                {
                                    //checkInt = int.TryParse(dataGridConfig?.OutlineId.ToString(), out outlineId);
                                    //if (!checkInt)
                                    //{
                                    //dynamic dataGridConfig = wordHandleConfig.DataGridConfig.FirstOrDefault(f => f.DataField.ToLower() == placeholder);
                                    if (dataGridConfigList.Count > 1)
                                    {
                                        outlineIds = wordHandleConfig.DataGridConfig.FirstOrDefault(f => f.DataField.ToLower() == placeholder && f.TabName == list.Header).OutlineId.ToString().Split(',');
                                    }
                                    else
                                    {
                                        outlineIds = wordHandleConfig.DataGridConfig.FirstOrDefault(f => f.DataField.ToLower() == placeholder).OutlineId.ToString().Split(',');
                                    }
                                    //}
                                }
                                catch (Exception ex)
                                {

                                }
                                if (outlineIds != null)
                                {
                                    try
                                    {
                                        dynamic outlineByFieldTable = wordHandleConfig.SurveyOptions.FirstOrDefault(f =>
                                        {
                                            string outlineIdStr = f.OutlineId.ToString();
                                            return outlineIds.Contains(outlineIdStr);
                                        });
                                        if (outlineByFieldTable != null)
                                            list.DynamicData.Add(new DynamicOutline
                                            {
                                                Content = fieldValue,
                                                Outline = new Outline { Content = outlineByFieldTable.Content, Id = outlineByFieldTable.OutlineId, PlaceHolder = outlineByFieldTable.PlaceHolder }
                                            });
                                    }
                                    catch
                                    {

                                    }
                                }
                            }
                        }
                    }
                    List<SurveyOutlineOptions> surveyOutlineOptions = new List<SurveyOutlineOptions>();
                    surveyOutlineOptions.AddRange(JsonConvert.DeserializeObject<List<SurveyOutlineOptions>>(JsonConvert.SerializeObject(wordHandleConfig.SurveyOptions)));

                    list.DynamicData.ForEach(f =>
                    {
                        SurveyOutlineOptions surveyOutlineOption = new SurveyOutlineOptions();

                        if (surveyOutlineOptions.Any(fi => fi.Placeholder == f.Outline.PlaceHolder))
                        {
                            surveyOutlineOption = surveyOutlineOptions.FirstOrDefault(fi => fi.Placeholder == f.Outline.PlaceHolder);
                        }
                        else
                        {
                            surveyOutlineOption = surveyOutlineOptions.FirstOrDefault(fi => fi.OutlineId == f.Outline.Id);
                        }
                        if (surveyOutlineOption != null)
                            f.SurveyOutlineOptions = surveyOutlineOption;
                        if (f.Outline != null)
                        {
                            if (f.Outline.Id > 0)
                            {
                                f.Images = wordHandleConfig.PicturesAttachments.Where(w => w.OutlineId == f.Outline.Id && w.OutlinePlaceholder == f.Outline.PlaceHolder).ToList();
                            }
                            if (!string.IsNullOrEmpty(f.Outline.PlaceHolder))
                            {
                                f.Images = wordHandleConfig.PicturesAttachments.Where(w => w.OutlinePlaceholder == f.Outline.PlaceHolder).ToList();
                            }
                        }
                    }
                    );
                }
                else
                {
                    foreach (dynamic data in list.Data)
                    {
                        foreach (PropertyInfo property in data.GetType().GetProperties())
                        {
                            OpenXMLOutline openXmlOutline = new OpenXMLOutline();


                            string fieldName = property.Name;
                            object rawValue = property.GetValue(data);
                            string fieldValue = rawValue != null && rawValue != DBNull.Value ? rawValue.ToString() : string.Empty;

                            string placeholder = fieldName.ToLower();
                            //string docxFilePath = System.IO.Path.Combine(baseDirectory, nameof(Survey), $"{surveyNo}_{fieldName}.html");

                            dynamic outline = wordHandleConfig.SurveyOptions.FirstOrDefault(w => w.PlaceHolder.ToLower() == placeholder);
                            openXmlOutline.Placeholder = "{{" + placeholder + "}}";
                            openXmlOutline.Content = fieldValue;
                            if (outline != null)
                                openXmlOutline.Images = wordHandleConfig.PicturesAttachments.Where(w => w.OutlineId == outline.Id).ToList(); ;
                            //string docxFilePath = System.IO.Path.Combine(baseDirectory, nameof(Survey), $"{surveyNo}_{fieldName}.docx");

                            placeholderContentFiles.Add(openXmlOutline);
                        }
                    }
                }
            }
            ContentsByPlaceholders(placeholderContentFiles, wordHandleConfig);
        }
        #endregion

        #region Lv 2 - Word Implement static / dynamic logic
        //Update date: 2025-04-22
        public static void ContentsByPlaceholders(
            List<OpenXMLOutline> placeholderContentFiles,
            WordHandleConfig wordHandleConfig
            )
        {
            //File.Copy(templatePath, outputPath, true);
            File.Copy(wordHandleConfig.TemplatePath, wordHandleConfig.WordPrerenderPath, true);

            using (WordprocessingDocument checkTables = WordprocessingDocument.Open(wordHandleConfig.WordPrerenderPath, true))
            {
                if (wordHandleConfig.WordObjectToHandle.Count > 0)
                {
                    foreach (WordObjectToHandle wordObjectToHandle in wordHandleConfig.WordObjectToHandle)
                    {
                        if (wordObjectToHandle.Action == "add" && wordObjectToHandle.ElementType == "table")
                            RenderTableByFirstCellText(checkTables, wordObjectToHandle, wordHandleConfig);
                        if (wordObjectToHandle.Action == "remove" && wordObjectToHandle.ElementType == "table")
                        {
                            if (wordObjectToHandle.Attributes.Count == 0)
                                RemoveTableByFirstCellText(checkTables, wordObjectToHandle);
                            if (wordObjectToHandle.Attributes.Count > 0)
                                RemoveTableByColumnText(checkTables, wordObjectToHandle);
                        }
                    }
                }
            }

            //Update main outline name
            using (WordprocessingDocument checkHeading1 = WordprocessingDocument.Open(wordHandleConfig.WordPrerenderPath, true))
            {
                if (wordHandleConfig.WordObjectToHandle.Count > 0)
                {
                    foreach (WordObjectToHandle wordObjectToHandle in wordHandleConfig.WordObjectToHandle)
                    {
                        DetectAndReplacePlaceholderInHeading1(checkHeading1, wordHandleConfig.SurveyOptions);
                    }
                }
            }


            using (WordprocessingDocument outputDoc = WordprocessingDocument.Open(wordHandleConfig.WordPrerenderPath, true))
            {
                MainDocumentPart mainPart = outputDoc.MainDocumentPart;
                UpdateHeadingWithOptions(outputDoc, wordHandleConfig.SurveyOptions);

                //UpdateHeadingText(outputDoc, "{{safetymanagementoption}}", wingdingsOptions);

                foreach (var item in wordHandleConfig.RenderDataList)
                {///STATIC PART
                    if (!item.IsDynamic)
                    {

                        foreach (OpenXMLOutline placeholderPair in placeholderContentFiles)
                        {
                            // Tìm tất cả các đoạn chứa placeholder
                            var placeholderParagraphs = mainPart.Document.Body.Descendants<Paragraph>()
                                //.Where(p => p.InnerText.Contains(placeholder))
                                .Where(p => p.InnerText.Contains(placeholderPair.Placeholder))
                                .ToList();
                            if (placeholderParagraphs.Count > 0)
                            {
                                foreach (var placeholderParagraph in placeholderParagraphs)
                                {
                                    var placeholderProperties = placeholderParagraph.ParagraphProperties?.CloneNode(true);
                                    placeholderPair.Data = ConvertHtmlToOpenXMLElements(placeholderPair.Content, mainPart);
                                    if (placeholderParagraph.InnerText.Any(a => wordHandleConfig.WordObjectToHandle.Any(f => f.ElementName.ToLower() + "outline" == placeholderParagraph.InnerText)))
                                    {

                                    }
                                    else
                                    {

                                        if (placeholderPair.Data != null)
                                            InnerContentHandle(placeholderPair.Data, placeholderProperties, placeholderParagraph, mainPart);
                                        if (placeholderPair.Images != null)
                                        {
                                            if (placeholderPair.Images.Count > 0)
                                            {
                                                Table imageParagraph = new Table();
                                                if (!placeholderPair.Images.Any(a => a.FullSubDirectory.Contains("Appendix")))
                                                {
                                                    imageParagraph = CreateImageTable(mainPart, placeholderPair.Images);
                                                    placeholderParagraph.InsertAfterSelf(imageParagraph);
                                                }
                                                else
                                                {
                                                    foreach (var image in placeholderPair.Images)
                                                    {
                                                        imageParagraph = CreateImagePerTable(mainPart, image);
                                                        placeholderParagraph.InsertAfterSelf(imageParagraph);
                                                    }
                                                }
                                            }
                                        }
                                        placeholderParagraph.Remove();
                                    }

                                }
                            }

                        }
                    }///DYNAMIC PART
                    else
                    {
                        WordObjectToHandle wordObjectToHandle = new WordObjectToHandle();
                        var dynamicPlaceholderParagraphs = mainPart.Document.Body.Elements<Paragraph>()
                       //.Where(p => p.InnerText.Contains(placeholder))
                       .Where(a =>
                       {
                           List<Text> listParagraphs = a.Descendants<Text>().ToList();
                           string completeOutline = string.Join("", listParagraphs.Select(s => s.InnerText));
                           if (wordHandleConfig.WordObjectToHandle.Any(f => completeOutline.Contains("{{" + f.ElementName.ToLower() + "outline" + "}}")))
                           {
                               wordObjectToHandle = wordHandleConfig.WordObjectToHandle.FirstOrDefault(f => completeOutline.Contains("{{" + f.ElementName.ToLower() + "outline" + "}}"));

                           }
                           return wordHandleConfig.WordObjectToHandle.Any(f => completeOutline.Contains("{{" + f.ElementName.ToLower() + "outline" + "}}"));
                       })
                       .ToList();

                        //Update sub-main outline name
                        foreach (var dynamicPlaceholderParagraph in dynamicPlaceholderParagraphs)
                        {
                            DetectAndReplacePlaceholderInHeading2(outputDoc, item);
                        }
                    }
                }
                RenderRiskGrade(outputDoc, wordHandleConfig.RiskGrading);
                EnableUpdateFieldsOnOpen(outputDoc);
                //RemoveBlankPages(outputDoc);
                HeaderWordCustom(mainPart, wordHandleConfig);
                FixFooterErrors(mainPart, wordHandleConfig);
                mainPart.Document.Save();
            }
            RemoveEmptyPages(wordHandleConfig.WordPrerenderPath);
            //InsertImageAtFixedPosition(wordHandleConfig);
        }
        #endregion

        #region Lv 3 - Detail for each component process

        private static void RenderTableByFirstCellText(WordprocessingDocument wordDoc, WordObjectToHandle cellTextToMatch, WordHandleConfig wordHandleConfig)
        {
            // Tìm dữ liệu RenderData dựa trên ElementName
            RenderData renderData = wordHandleConfig.RenderDataList.FirstOrDefault(f => f.Header == cellTextToMatch.ElementName);
            if (renderData == null) return;

            // Tìm tất cả các bảng trong tài liệu
            var tables = wordDoc.MainDocumentPart.Document.Body.Elements<Table>().ToList();
            bool isRenderElement = false;
            foreach (var table in tables)
            {
                var firstRow = table.Elements<TableRow>().FirstOrDefault();

                if (firstRow != null)
                {
                    // Lấy các ô trong dòng đầu tiên
                    var cells = firstRow.Elements<TableCell>().ToList();

                    if (cells.Count > 1) // Kiểm tra có ít nhất 2 ô
                    {
                        // Lấy nội dung ô đầu tiên và ô thứ hai
                        string firstCellText = string.Join("", cells[0].Descendants<Text>().Select(t => t.Text));
                        string secondCellText = string.Join("", cells[1].Descendants<Text>().Select(t => t.Text));

                        // Kiểm tra điều kiện: ô đầu tiên khớp với ElementName và ô thứ hai khớp với PlaceHolder
                        if (firstCellText.Contains(cellTextToMatch.ElementName) && secondCellText.Contains(cellTextToMatch.PlaceHolder))
                        {

                            var rowsToClear = table.Elements<TableRow>().Where(row =>
                            {
                                var rowCells = row.Elements<TableCell>().ToList();
                                if (rowCells.Count > 1)
                                {
                                    string cell2Text = string.Join("", rowCells[1].Descendants<Text>().Select(t => t.Text));
                                    return cell2Text.Contains(cellTextToMatch.PlaceHolder);
                                }
                                return false;
                            }).ToList();
                            foreach (var row in rowsToClear)
                            {
                                table.RemoveChild(row);
                                //foreach (var cell in row.Elements<TableCell>())
                                //{
                                //    if (cell.InnerText.Contains(cellTextToMatch.ElementName)) continue;
                                //    var texts = cell.Descendants<Text>().ToList();
                                //    foreach (var text in texts)
                                //    {
                                //        text.Text = ""; // Clear nội dung text
                                //    }
                                //}
                            }
                            // Thêm dữ liệu mới vào bảng
                            foreach (var item in renderData.Data)
                            {
                                TableRow Tblrow = new TableRow();
                                if (item.IsData == 0)
                                {
                                    string renderElement = "";
                                    if (!isRenderElement) { renderElement = cellTextToMatch.ElementName; isRenderElement = true; }
                                    Tblrow = CreateTableParticipantRow(new List<string> { renderElement, item.PersonName ?? "", "" }, isBold: true, cellTextToMatch);
                                }
                                else
                                {
                                    // Render các dòng dữ liệu
                                    Tblrow = CreateTableParticipantRow(new List<string>
                                        {
                                            "",
                                            item.PersonName ?? "",
                                            item.PersonDepartment ?? ""
                                        }, isBold: false, cellTextToMatch);
                                }
                                table.Append(Tblrow);
                            }

                            // Lưu tài liệu sau khi chỉnh sửa
                            MergeColumnsIfBold(table, 1, 2);
                            MergeColumn(table, 0, cellTextToMatch);
                            wordDoc.MainDocumentPart.Document.Save();

                            return; // Dừng tìm kiếm sau khi render thành công
                        }
                    }
                }
            }
        }
        private static void RemoveTableByFirstCellText(WordprocessingDocument wordDoc, WordObjectToHandle cellTextToMatch)
        {
            var tables = wordDoc.MainDocumentPart.Document.Body.Elements<Table>().ToList();

            foreach (var table in tables)
            {
                var firstRow = table.Elements<TableRow>().FirstOrDefault();
                var firstCell = firstRow?.Elements<TableCell>().FirstOrDefault();

                if (firstCell != null)
                {
                    string cellText = string.Join(" ", firstCell.Descendants<Text>().Select(t => t.Text));

                    if (cellText.Contains(cellTextToMatch.ElementName))
                    {
                        table.Remove(); // Xóa bảng
                    }
                }
            }
            // Lưu tài liệu sau khi xóa bảng
            wordDoc.MainDocumentPart.Document.Save();
        }
        private static void DetectAndReplacePlaceholderInHeading1(
   WordprocessingDocument wordDoc, List<dynamic> surveyOutlineOptions,
   string Level = "Heading1")//,
        {
            List<dynamic> parentOutlines = new List<dynamic>();
            parentOutlines = surveyOutlineOptions.Where(w => w.IsParent == "1" && !string.IsNullOrEmpty(w.PlaceHolder)).ToList();

            var body = wordDoc.MainDocumentPart.Document.Body;
            //var paragraphsToRemove = new List<Paragraph>();
            // Duyệt qua tất cả các Paragraph trong Body
            foreach (var paragraph in body.Elements<Paragraph>())
            {
                var paragraphProperties = paragraph.ParagraphProperties;
                if (paragraphProperties?.ParagraphStyleId?.Val != null &&
                    paragraphProperties.ParagraphStyleId.Val.Value == Level)
                {
                    List<Text> listParagraphs = paragraph.Descendants<Text>().ToList();
                    string outlineTitle = string.Join("", listParagraphs.Select(s => s.InnerText)).ToLower();
                    if (surveyOutlineOptions.Any(a => outlineTitle.Contains(a.PlaceHolder.ToLower())))
                    {
                        var matchedOption = parentOutlines.FirstOrDefault(a => outlineTitle.Contains(a.PlaceHolder.ToLower() + "_placeholder"));

                        if (matchedOption != null)
                        {

                            //var newRun = new Run(
                            //    new RunProperties(new Bold(), new Color() { Val = "0000FF" }),
                            //    new Text(matchedOption.Content)
                            //);
                            if (matchedOption.MainEnable)
                            {
                                paragraph.RemoveAllChildren<Run>();
                                //var newRun = CreateStyledRun(matchedOption.Content, "0000FF", true, "28");
                                var newRun = CreateStyledRun(matchedOption.Content, ConfigConstant._heading1ColorHex, true, "28");
                                paragraph.AppendChild(newRun);
                            }
                            else
                            {
                                DeletePageByPlaceholder(body, matchedOption.PlaceHolder + "_Placeholder", paragraph); //?
                            }
                        }
                    }
                }
            }

            // Lưu thay đổi vào tài liệu
            wordDoc.MainDocumentPart.Document.Save();
        }

        private static void DetectAndReplacePlaceholderInHeading2(
    WordprocessingDocument wordDoc,
    RenderData renderData)
        {
            var body = wordDoc.MainDocumentPart.Document.Body;
            var paragraphsToRemove = new List<Paragraph>();
            // Duyệt qua tất cả các Paragraph trong Body
            foreach (var paragraph in body.Elements<Paragraph>())
            {
                Paragraph returnParagraph = paragraph;
                // Kiểm tra nếu đoạn văn là Heading 2
                var paragraphProperties = paragraph.ParagraphProperties;
                if (paragraphProperties?.ParagraphStyleId?.Val != null &&
                    paragraphProperties.ParagraphStyleId.Val.Value == renderData.OutlineLevel)
                {
                    List<Text> listParagraphs = paragraph.Descendants<Text>().ToList();
                    string outlineString = string.Join("", listParagraphs.Select(s => s.InnerText));
                    string renderHeaderString = renderData.Header.ToLower();
                    // Kiểm tra nội dung Placeholder
                    if (string.Join("", listParagraphs.Select(s => s.InnerText)).Contains("{{" + renderData.Header.ToLower() + "outline" + "}}"))
                    {
                        AddDynamicOutlineToWord(wordDoc.MainDocumentPart, paragraph, renderData);

                    }
                }
            }

            // Đoạn này can thiệp vào xóa paragraph xem nó xóa được không 
            wordDoc.MainDocumentPart.Document.Save();
        }


        public static void UpdateHeadingWithOptions(
        WordprocessingDocument wordDoc,
        List<dynamic> outlineSurveyQuerys)
        {

            List<SurveyReportRE.Models.Migration.Business.MasterData.Outline> outlines = new List<SurveyReportRE.Models.Migration.Business.MasterData.Outline>();
            List<SurveyReportRE.Models.Migration.Business.Data.SurveyOutlineOptions> outlineOptions = new List<Models.Migration.Business.Data.SurveyOutlineOptions>();
            if (outlineSurveyQuerys.Count > 0)
            {
                outlines.AddRange(JsonConvert.DeserializeObject<List<SurveyReportRE.Models.Migration.Business.MasterData.Outline>>(JsonConvert.SerializeObject(outlineSurveyQuerys)));
                outlineOptions.AddRange(JsonConvert.DeserializeObject<List<SurveyReportRE.Models.Migration.Business.Data.SurveyOutlineOptions>>(JsonConvert.SerializeObject(outlineSurveyQuerys)));
            }

            string placeholder = "yesnonaoption";
            // Lấy tất cả các đoạn văn trong tài liệu
            var paragraphs = wordDoc.MainDocumentPart.Document.Body.Elements<Paragraph>();
            foreach (var paragraph in paragraphs)
            {
                var contents = paragraph
                        .Descendants<Run>()
                        .Where(run => !run.Descendants<DocumentFormat.OpenXml.Wordprocessing.FieldCode>().Any()) // Bỏ qua Run chứa FieldCode
                        .SelectMany(run => run.Descendants<Text>())
                        .Select(t => t.Text);

                foreach (var content in contents)
                {
                    if (paragraph.InnerText.Contains(placeholder))
                    {
                        if (outlines.Any(a => a.Content.ToString().Contains(content.Trim())))//paragraph.InnerText.Replace(placeholder, "").Trim()))
                        {
                            SurveyReportRE.Models.Migration.Business.MasterData.Outline outL = outlines.FirstOrDefault(a => a.Content.ToString().Contains(content.Trim()));
                            var checkOutline = outlineOptions.FirstOrDefault(a => a.OutlineId == outL.Id);
                            if (checkOutline != null)
                                foreach (var run in paragraph.Elements<Run>()) // Duyệt qua tất cả các Run trong đoạn
                                {
                                    var text = run.GetFirstChild<Text>();
                                    if (text != null && text.Text.Contains(placeholder)) // Kiểm tra nếu Run chứa placeholder
                                    {

                                        text.Text = text.Text.Replace(placeholder, ""); // Thay thế placeholder
                                        //AddSymbolWithText(paragraph, checkOutline.OptionValue ?? 0);
                                    }
                                }
                        }
                    }
                }

            }
            wordDoc.MainDocumentPart.Document.Save();
        }



        private static void InnerContentHandle(OpenXmlElement[] data, OpenXmlElement? placeholderProperties, Paragraph placeholderParagraph, MainDocumentPart mainPart)
        {
            foreach (var element in data)
            {
                if (element is Table table)
                {
                    EnsureTableAndCellBorders(table);
                }

                if (element is Paragraph newParagraph)
                {
                    EnsureNoSpacing(newParagraph);
                    if (placeholderProperties != null)
                    {
                        newParagraph.PrependChild(placeholderProperties.CloneNode(true));
                    }

                    var drawings = newParagraph.Descendants<Drawing>(); // Inner content drawing handle if need
                    foreach (var item in drawings)
                    {
                        CheckPortraitOrResize(mainPart, item);
                    }

                }
                DefaultFontEnsure(element);
                //if (element is Header newHeading)
                //{

                //}
                //if (element is UpdateFieldsOnOpen updateFieldsOnOpen)
                //{

                //}

                placeholderParagraph.InsertBeforeSelf(element.CloneNode(true));
            }
        }

        private static void RenderRiskGrade(
     WordprocessingDocument wordDoc,
     IDictionary<string, object> gradings
 )
        {
            var tables = wordDoc.MainDocumentPart.Document.Body.Elements<Table>();
            string gradingHardCode = "grading";
            var rowsToRemove = new List<TableRow>();
            var properties = (IDictionary<string, object>)gradings;
            dynamic statusProperties = properties.FirstOrDefault(f => f.Key == "statuslist").Value;
            if (statusProperties != null)
            {
                JArray riskGrades = statusProperties.data as JArray;
                //string[] riskGrades = { "Excellent", "Good", "Average", "Marginal", "Poor" };
                foreach (var table in tables)
                {
                    foreach (var row in table.Elements<TableRow>())
                    {
                        foreach (var cell in row.Elements<TableCell>())
                        {
                            var paragraphs = cell.Elements<Paragraph>();

                            foreach (var paragraph in paragraphs)
                            {
                                string text = string.Join(" ", paragraph.Descendants<Text>().Select(t => t.Text));
                                if (text.Contains(gradingHardCode))
                                {
                                    KeyValuePair<string, object> property = properties.FirstOrDefault(f => f.Key.Contains(text.Replace("{{", "").Replace("}}", "").Trim()));
                                    string placeholder = $"{property.Key}"; // Tạo placeholder từ tên thuộc tính
                                    if (property.Value == null) continue;
                                    dynamic grade = property.Value;
                                    string gradeName = property.Key; // Tên phần (ví dụ: "management")
                                    if (grade != null)
                                    {
                                        string colorHex = grade.color;
                                        if (string.IsNullOrEmpty(grade.data))
                                        {
                                            rowsToRemove.Add(row); continue;
                                        }
                                        if (text.Contains(placeholder)) // Nếu ô chứa placeholder
                                        {
                                            var originalParagraphProperties = paragraph.ParagraphProperties?.CloneNode(true);
                                            var originalRuns = paragraph.Elements<Run>()
                                                .Select(run => new
                                                {
                                                    Text = string.Join("", run.Descendants<Text>().Select(t => t.Text)),
                                                    RunProperties = run.RunProperties?.CloneNode(true)
                                                }).ToList();
                                            paragraph.RemoveAllChildren();

                                            foreach (var riskGrade in riskGrades.Select(item => (string)item["Key"]).ToArray())
                                            {
                                                Run run;
                                                if (riskGrade == grade.data) // Nếu là từ cần đánh dấu
                                                {
                                                    run = CreateStyledRun(riskGrade, colorHex, true); // Màu đỏ và in đậm
                                                }
                                                else
                                                {
                                                    run = CreateStyledRun(riskGrade, "000000", false); // Màu đen, không in đậm
                                                }
                                                if (originalRuns.Any())
                                                {
                                                    var originalRun = originalRuns.FirstOrDefault();
                                                    if (originalRun?.RunProperties != null)
                                                    {
                                                        run.PrependChild(originalRun.RunProperties.CloneNode(true));
                                                    }
                                                }

                                                paragraph.AppendChild(run);
                                                if (riskGrade != riskGrades.Select(item => (string)item["Key"]).ToArray().Last())
                                                {
                                                    paragraph.AppendChild(new Run(new Text(" / ")));
                                                }
                                            }
                                            if (originalParagraphProperties != null)
                                            {
                                                paragraph.PrependChild(originalParagraphProperties.CloneNode(true));
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                foreach (var rowToRemove in rowsToRemove)
                {
                    rowToRemove.Remove();
                }
                wordDoc.MainDocumentPart.Document.Save();
            }
        }

        public static void EnableUpdateFieldsOnOpen(WordprocessingDocument wordDoc)
        {
            // Lấy DocumentSettingsPart (phần Settings của tài liệu)
            var settingsPart = wordDoc.MainDocumentPart.GetPartsOfType<DocumentSettingsPart>().FirstOrDefault();

            if (settingsPart == null)
            {
                // Nếu không tồn tại Settings, thêm mới DocumentSettingsPart
                settingsPart = wordDoc.MainDocumentPart.AddNewPart<DocumentSettingsPart>();
                settingsPart.Settings = new DocumentFormat.OpenXml.Wordprocessing.Settings();
            }

            // Tạo đối tượng UpdateFieldsOnOpen
            var updateFields = new UpdateFieldsOnOpen
            {
                Val = new DocumentFormat.OpenXml.OnOffValue(true) // Đặt là true để cập nhật fields khi mở
            };

            // Thêm vào phần Settings của tài liệu
            settingsPart.Settings.PrependChild(updateFields);
            settingsPart.Settings.Save(); // Lưu thay đổi vào tài liệu
        }

        private static void HeaderWordCustom(MainDocumentPart mainPart, WordHandleConfig wordHandleConfig)
        {
            var headerParts = mainPart.HeaderParts.ToList();

            foreach (var headerPart in headerParts)
            {

                // 1. Tạo HeaderPart nếu chưa có

                // 2. Thêm ảnh vào HeaderPart
                var headerImagePart = headerPart.AddImagePart(ImagePartType.Png);
                using (var stream = new FileStream(System.IO.Path.Combine(wordHandleConfig.BlobPath, wordHandleConfig.LogoWordPath), FileMode.Open))
                {
                    headerImagePart.FeedData(stream);
                }
                string headerImgRelId = headerPart.GetIdOfPart(headerImagePart);

                // 3. Tính kích thước ảnh
                long widthEmuH, heightEmuH;
                using (var img = Image.FromFile(System.IO.Path.Combine(wordHandleConfig.BlobPath, wordHandleConfig.LogoWordPath)))
                {
                    float dpiX = img.HorizontalResolution;
                    float dpiY = img.VerticalResolution;
                    widthEmuH = (long)(img.Width / dpiX * ConfigConstant._inchToEmu);
                    heightEmuH = (long)(img.Height / dpiY * ConfigConstant._inchToEmu);
                }

                // 4. Vị trí ảnh: top-right (ví dụ X = 15cm, Y = 1cm)
                //long xOffsetH = (long)(16.3 * ConfigConstant._cmToEmu); // 1cm = 360000 EMU
                //long yOffsetH = (long)(1 * ConfigConstant._cmToEmu);
                //long offsetR1cm = -1080000;
                long offsetR1cm = (long)(-3 * ConfigConstant._cmToEmu); //-3cm 
                //long offsetT1cm = 360000;
                long offsetT1cm = (long)(1 * ConfigConstant._cmToEmu); //1cm
                // 5. Tạo Drawing
                var headerDrawing = new Drawing(
                    new DW.Anchor(
                        new DW.SimplePosition() { X = 0L, Y = 0L },
                        //new DW.HorizontalPosition(new DW.PositionOffset(offset1cm.ToString()))
                        //{ RelativeFrom = DW.HorizontalRelativePositionValues.Page },
                        //new DW.VerticalPosition(new DW.PositionOffset(offset1cm.ToString()))
                        //{ RelativeFrom = DW.VerticalRelativePositionValues.Page },
                        new DW.HorizontalPosition(
                                new DW.PositionOffset(offsetR1cm.ToString()) // sát mép phải
                            )
                        {
                            RelativeFrom = DW.HorizontalRelativePositionValues.RightMargin
                        },
                        new DW.VerticalPosition(
                                new DW.PositionOffset(offsetT1cm.ToString()) // sát mép trên
                            )
                        {
                            RelativeFrom = DW.VerticalRelativePositionValues.TopMargin
                        },

                        new DW.Extent() { Cx = widthEmuH, Cy = heightEmuH },
                        new DW.EffectExtent() { LeftEdge = 0L, TopEdge = 0L, RightEdge = 0L, BottomEdge = 0L },
                        new DW.WrapNone(),
                        new DW.DocProperties() { Id = (UInt32Value)2U, Name = "Header Image" },
                        new DW.NonVisualGraphicFrameDrawingProperties(
                            new A.GraphicFrameLocks() { NoChangeAspect = true }),
                        new A.Graphic(
                            new A.GraphicData(
                                new PIC.Picture(
                                    new PIC.NonVisualPictureProperties(
                                        new PIC.NonVisualDrawingProperties() { Id = 0U, Name = "HeaderPicture" },
                                        new PIC.NonVisualPictureDrawingProperties()),
                                    new PIC.BlipFill(
                                        new A.Blip() { Embed = headerImgRelId },
                                        new A.Stretch(new A.FillRectangle())),
                                    new PIC.ShapeProperties(
                                        new A.Transform2D(
                                            new A.Offset() { X = 0, Y = 0 },
                                            new A.Extents() { Cx = widthEmuH, Cy = heightEmuH }),
                                        new A.PresetGeometry(new A.AdjustValueList()) { Preset = A.ShapeTypeValues.Rectangle })
                                )
                            )
                            { Uri = "http://schemas.openxmlformats.org/drawingml/2006/picture" }
                        )
                    )
                    {
                        DistanceFromTop = 0U,
                        DistanceFromBottom = 0U,
                        DistanceFromLeft = 0U,
                        DistanceFromRight = 0U,
                        SimplePos = false,
                        RelativeHeight = 0U,
                        BehindDoc = false,
                        Locked = false,
                        LayoutInCell = true,
                        AllowOverlap = true
                    }
                );

                // 6. Gắn vào headerPart
                var headerParagraph = new Paragraph(new Run(headerDrawing));
                headerPart.Header = new Header();
                headerPart.Header.Append(headerParagraph);
                headerPart.Header.Save();
            }
            // 7. Gán HeaderReference cho các SectionProperties
            //foreach (var section in mainPart.Document.Descendants<SectionProperties>())
            //{
            //    section.RemoveAllChildren<HeaderReference>();
            //    section.AppendChild(new HeaderReference()
            //    {
            //        Type = HeaderFooterValues.Default,
            //        Id = headerRelId
            //    });
            //}
            foreach (var section in mainPart.Document.Descendants<SectionProperties>())
            {
                var pageMargin = section.GetFirstChild<PageMargin>();
                if (pageMargin == null)
                {
                    pageMargin = new PageMargin();
                    section.PrependChild(pageMargin);
                }

                pageMargin.Header = (UInt32Value)ConfigConstant._inchToTwip;

                if (pageMargin.Top == null || pageMargin.Top < ConfigConstant._headerMarginTop)
                    pageMargin.Top = (Int32Value?)ConfigConstant._headerMarginTop;

                var pageSize = section.GetFirstChild<PageSize>();

                double width = pageSize?.Width;
                double height = pageSize?.Height;

                if (pageMargin == null)
                {
                    pageMargin = new PageMargin();
                    section.PrependChild(pageMargin);
                }
                var headerRef = section.Elements<HeaderReference>()
                         .FirstOrDefault(h => h.Type == HeaderFooterValues.Default);
                if (width > height)
                {
                }
            }
        }
        private static void FixFooterErrors(MainDocumentPart mainPart, WordHandleConfig wordHandleConfig)
        {
            var footerParts = mainPart.FooterParts.ToList();

            foreach (var footerPart in footerParts)
            {
                if (footerPart.RootElement == null || !footerPart.RootElement.Any())
                {
                    // Xóa footer bị lỗi hoặc rỗng
                    mainPart.DeletePart(footerPart);
                }
                var imagePart = footerPart.AddImagePart(ImagePartType.Png);
                using (var stream = new FileStream(System.IO.Path.Combine(wordHandleConfig.BlobPath, wordHandleConfig.LabelWordPath), FileMode.Open))
                {
                    imagePart.FeedData(stream);
                }
                string relId = footerPart.GetIdOfPart(imagePart);
                long widthEmu = 0;
                long heightEmu = 0;
                using (var img = Image.FromFile(System.IO.Path.Combine(wordHandleConfig.BlobPath, wordHandleConfig.LabelWordPath)))
                {
                    float dpiX = img.HorizontalResolution;
                    float dpiY = img.VerticalResolution;
                    widthEmu = (long)((img.Width) / dpiX * ConfigConstant._inchToEmu);
                    heightEmu = (long)((img.Height) / dpiY * ConfigConstant._inchToEmu);
                }


                // Toạ độ: bottom-right (ví dụ X = 13cm, Y = 25cm)
                long xOffset = (long)(ConfigConstant._footerLabelXOffset * ConfigConstant._cmToEmu);
                long yOffset = (long)(ConfigConstant._footerLabelYOffset * ConfigConstant._cmToEmu);

                var element = new Drawing(
                    new DW.Anchor(
                        new DW.SimplePosition() { X = 0L, Y = 0L },
                        new DW.HorizontalPosition(
                            new DW.PositionOffset(xOffset.ToString()))
                        { RelativeFrom = DW.HorizontalRelativePositionValues.Page },
                        new DW.VerticalPosition(
                            new DW.PositionOffset(yOffset.ToString()))
                        { RelativeFrom = DW.VerticalRelativePositionValues.Page },
                        new DW.Extent() { Cx = widthEmu, Cy = heightEmu },
                        new DW.EffectExtent()
                        {
                            LeftEdge = 0L,
                            TopEdge = 0L,
                            RightEdge = 0L,
                            BottomEdge = 0L
                        },
                        new DW.WrapNone(),
                        new DW.DocProperties() { Id = (UInt32Value)1U, Name = "Fixed Image" },
                        new DW.NonVisualGraphicFrameDrawingProperties(
                            new A.GraphicFrameLocks() { NoChangeAspect = true }),
                        new A.Graphic(
                            new A.GraphicData(
                                new PIC.Picture(
                                    new PIC.NonVisualPictureProperties(
                                        new PIC.NonVisualDrawingProperties() { Id = 0U, Name = "TMIVConfidential" },
                                        new PIC.NonVisualPictureDrawingProperties()),
                                    new PIC.BlipFill(
                                        new A.Blip() { Embed = relId },
                                        new A.Stretch(new A.FillRectangle())),
                                    new PIC.ShapeProperties(
                                        new A.Transform2D(
                                            new A.Offset() { X = 0, Y = 0 },
                                            new A.Extents() { Cx = widthEmu, Cy = heightEmu }),
                                        new A.PresetGeometry(new A.AdjustValueList()) { Preset = A.ShapeTypeValues.Rectangle })
                                )
                            )
                            { Uri = "http://schemas.openxmlformats.org/drawingml/2006/picture" }
                        )
                    )
                    {
                        DistanceFromTop = 0U,
                        DistanceFromBottom = 0U,
                        DistanceFromLeft = 0U,
                        DistanceFromRight = 0U,
                        SimplePos = false,
                        RelativeHeight = 0U,
                        BehindDoc = false,
                        Locked = false,
                        LayoutInCell = true,
                        AllowOverlap = true
                    }
                );
                //var line3 = new Paragraph();
                //var line4 = new Paragraph();
                //
                //
                //var line1 = new Paragraph();
                //ParagraphProperties pPr = new ParagraphProperties(
                //    new Tabs(
                //        new DocumentFormat.OpenXml.Wordprocessing.TabStop() { Val = TabStopValues.Center, Position = 4320 },    // 3 inch
                //        new DocumentFormat.OpenXml.Wordprocessing.TabStop() { Val = TabStopValues.Right, Position = 8640 }      // 6 inch (tùy page width)
                //    ),
                //    new Justification() { Val = JustificationValues.Left }
                //);
                //line1.Append(pPr);
                //Run runLeft3 = new Run(new Text(""));
                //Run runLeft = new Run(new Text(wordHandleConfig.FooterContent));
                //Paragraph line2 = new Paragraph(
                //    new ParagraphProperties(
                //        new Justification() { Val = JustificationValues.Center }
                //    )
                //);
                //
                //Run runPrefix = new Run(
                //    new RunProperties(
                //        new RunFonts() { Ascii = ConfigConstant._defaultFont, HighAnsi = ConfigConstant._defaultFont },
                //        new FontSize() { Val = ConfigConstant._defaultSize }
                //    ),
                //    new Text(ConfigConstant._prefixPageLabel + ":")
                //);
                //
                //Run runPageField = new Run(
                //    new RunProperties(
                //        new RunFonts() { Ascii = ConfigConstant._defaultFont, HighAnsi = ConfigConstant._defaultFont },
                //        new FontSize() { Val = ConfigConstant._defaultSize }
                //    ),
                //    new FieldChar() { FieldCharType = FieldCharValues.Begin },
                //    new FieldCode(" PAGE "),
                //    new FieldChar() { FieldCharType = FieldCharValues.Separate },
                //    new Text("1"), // placeholder
                //new FieldChar() { FieldCharType = FieldCharValues.End }
                //);
                //// Assume textBox is your TextBox instance // Define a new shape properties instance
                //ShapeProperties shapeProperties = new ShapeProperties(); 
                // 
                //line3.Append(runLeft3);
                //line1.Append(runLeft);
                //line1.Append(new Run(element));
                //line2.Append(runPrefix);
                //line2.Append(runPageField);
                //Paragraph imageParagraph = new Paragraph();
                //imageParagraph.Append(new Run(element));

                //RunProperties pageFontProps = new RunProperties(
                //new RunFonts() { Ascii = ConfigConstant._defaultFont, HighAnsi = ConfigConstant._defaultFont },  // Font Asap
                //new FontSize() { Val = ConfigConstant._defaultSize } // 10pt (20 half-point)
                //);
                //
                //if (footerPart.Footer == null)
                //{
                //    footerPart.Footer = new Footer();
                //}
                //
                //
                footerPart.Footer = new Footer();
                //footerPart.Footer.Append(line1);
                //footerPart.Footer.Append(line3);
                //footerPart.Footer.Append(line2);

                Paragraph imageParagraph = new Paragraph();
                imageParagraph.Append(new Run(element));
                footerPart.Footer.Append(imageParagraph);


                string footerPartId = mainPart.GetIdOfPart(footerPart);
                foreach (var section in mainPart.Document.Descendants<SectionProperties>())
                {
                    //section.RemoveAllChildren<FooterReference>();
                    section.AppendChild(new FooterReference() { Type = HeaderFooterValues.Default, Id = footerPartId });
                }
            }
        }

        public static void RemoveEmptyPages(string filePath)
        {
            using (WordprocessingDocument doc = WordprocessingDocument.Open(filePath, true))
            {
                Body body = doc.MainDocumentPart.Document.Body;
                var paragraphs = body.Elements<Paragraph>().ToList();

                for (int i = 0; i < paragraphs.Count; i++)
                {
                    var currentParagraph = paragraphs[i];

                    var pageBreak = currentParagraph.Descendants<Break>().FirstOrDefault(b => b.Type == BreakValues.Page);

                    if (pageBreak != null)
                    {
                        bool hasContentAfterBreak = paragraphs.Skip(i + 1)
                            .Any(p => p.Descendants<Run>().Any());

                        if (!hasContentAfterBreak)
                        {
                            pageBreak.Remove();
                        }
                    }
                    var sectionBreak = currentParagraph.Elements<ParagraphProperties>()
               .SelectMany(pp => pp.Elements<SectionProperties>())
               .FirstOrDefault();

                    if (sectionBreak != null)
                    {
                        bool hasContentAfterSectionBreak = paragraphs.Skip(i + 1).Any(p => p.Descendants<Run>().Any());
                        if (!hasContentAfterSectionBreak)
                        {
                            currentParagraph.Remove(); // Xóa luôn cả Paragraph chứa `Section Break`
                        }
                    }
                }



                doc.MainDocumentPart.Document.Save();
            }
        }

        private static void RemoveTableByColumnText(WordprocessingDocument wordDoc, WordObjectToHandle cellTextToMatch)
        {
            dynamic cellColumnIndexObject = cellTextToMatch.Attributes.FirstOrDefault();
            int columnIndex = cellColumnIndexObject.ColumnIndex;
            var tables = wordDoc.MainDocumentPart.Document.Body.Elements<Table>().ToList();

            foreach (var table in tables)
            {
                var firstRow = table.Elements<TableRow>().FirstOrDefault();
                if (firstRow == null) continue;

                var cells = firstRow.Elements<TableCell>().ToList();

                if (cells.Count > columnIndex)
                {
                    string cellText = string.Join(" ", cells[columnIndex].Descendants<Text>().Select(t => t.Text));

                    if (cellText.Contains(cellTextToMatch.ElementName))
                    {
                        table.Remove();
                    }
                }
            }

            // Lưu tài liệu sau khi xóa bảng
            wordDoc.MainDocumentPart.Document.Save();
        }

        #endregion

        #region Lv 4 - Sub task process base on 3
        private static void AddDynamicOutlineToWord(
                MainDocumentPart mainDocumentPart,
         Paragraph paragraph,
        RenderData renderData)
        {
            //var body = mainDocumentPart.Document.Body;
            var clonedParagraphs = CloneParagraphMultipleTimes(paragraph, mainDocumentPart, renderData);
            InsertClonedParagraphsAfter(paragraph, clonedParagraphs);

            //CleanUpParagraphBeforeRemove(paragraph);
            paragraph.Remove();

        }

        private static void DeletePageByPlaceholder(Body body, string placeholder,Paragraph checkParagraph)
        {
            var paragraphs = body.Elements<Paragraph>().ToList();

            for (int i = 0; i < paragraphs.Count; i++)
            {
                var paragraph = paragraphs[i];
                var paragraphText = string.Join("", paragraph.Descendants<Text>().Select(t => t.Text));
                var checkParagraphText = string.Join("", checkParagraph.Descendants<Text>().Select(t => t.Text));

                //if (paragraphText.Contains(placeholder))
                if (object.ReferenceEquals(checkParagraph, paragraph))
                {
                    var elementsToRemove = new List<OpenXmlElement>();

                    // Tìm SectionProperties trước đoạn này
                    OpenXmlElement sectionBefore = null;
                    for (int j = i - 1; j >= 0; j--)
                    {
                        var prevParagraph = paragraphs[j];
                        if (prevParagraph.GetFirstChild<ParagraphProperties>()?.GetFirstChild<SectionProperties>() != null)
                        {
                            sectionBefore = prevParagraph;
                            break;
                        }
                    }

                    // Thu thập đoạn chứa placeholder
                    elementsToRemove.Add(paragraph);

                    // Tiếp tục thu thập cho đến khi gặp SectionProperties (và bao gồm nó)
                    for (int j = i + 1; j < paragraphs.Count; j++)
                    {
                        var currentParagraph = paragraphs[j];
                        var sectProps = currentParagraph.GetFirstChild<ParagraphProperties>()?.GetFirstChild<SectionProperties>();
                        elementsToRemove.Add(currentParagraph);

                        if (sectProps != null)
                        {
                            break; // stop and include this section
                        }
                    }
                    foreach (var element in elementsToRemove)
                    {
                        // nếu element chứa SectionProperties thì chỉ xóa nếu nó là phần tử cuối (page break)
                        var paraProps = element.GetFirstChild<ParagraphProperties>();
                        var sectProps = paraProps?.ChildElements;
                        bool isContainSession = false;
                        if (sectProps != null)
                        {
                            foreach (var item in sectProps)
                            {
                                if (item is SectionProperties)
                                {
                                    isContainSession = true;
                                    break;
                                }
                            }
                            if (isContainSession && (checkParagraphText != "{{Appendix_Placeholder}}"))
                            {
                                continue;

                            }

                            // Nếu đoạn này chứa page break thì chỉ xoá page break, không xoá cả đoạn
                            body.RemoveChild(element);
                            if (placeholder == "LossExpValueBrkdwn_Placeholder")
                            {
                            }
                        }
                    }
                    return;
                }
            }

            //Comment out code date: 2025 - 05 - 28
            //var body = wordDoc.MainDocumentPart.Document.Body;
            //var paragraphs = body.Elements<Paragraph>().ToList();

            //for (int i = 0; i < paragraphs.Count; i++)
            //{
            //    var paragraph = paragraphs[i];
            //    var paragraphText = string.Join("", paragraph.Descendants<Text>().Select(t => t.Text));

            //    if (paragraphText.Contains(placeholder))
            //    {
            //        var elementsToRemove = new List<OpenXmlElement>();

            //        // Tìm SectionProperties trước đoạn này
            //        OpenXmlElement sectionBefore = null;
            //        for (int j = i - 1; j >= 0; j--)
            //        {
            //            var prevParagraph = paragraphs[j];
            //            if (prevParagraph.GetFirstChild<ParagraphProperties>()?.GetFirstChild<SectionProperties>() != null)
            //            {
            //                sectionBefore = prevParagraph;
            //                break;
            //            }
            //        }

            //        // Thu thập các đoạn cần xóa
            //        elementsToRemove.Add(paragraph);
            //        for (int j = i + 1; j < paragraphs.Count; j++)
            //        {
            //            var currentParagraph = paragraphs[j];

            //            // Dừng khi gặp SectionProperties (để tránh xóa cấu trúc trang)
            //            if (currentParagraph.GetFirstChild<ParagraphProperties>()?.GetFirstChild<SectionProperties>() != null)
            //                break;

            //            elementsToRemove.Add(currentParagraph);
            //        }

            //        // Xóa chỉ các phần tử nội dung, nhưng giữ lại SectionProperties
            //        foreach (var element in elementsToRemove)
            //        {
            //            if (!(element is Paragraph p && p.GetFirstChild<ParagraphProperties>()?.GetFirstChild<SectionProperties>() != null))
            //            {
            //                body.RemoveChild(element);
            //            }
            //        }

            //        // Lưu thay đổi
            //        wordDoc.MainDocumentPart.Document.Save();
            //        return;
            //    }
            //}
        }

        #endregion

        #region Lv 5 - Sub task process on 4

        private static List<Tuple<Paragraph, Paragraph, Table, Run, OpenXmlElement[]>> CloneParagraphMultipleTimes(Paragraph sourceParagraph, MainDocumentPart mainDocumentPart, RenderData renderData)
        {
            var clonedParagraphs = new List<Tuple<Paragraph, Paragraph, Table, Run, OpenXmlElement[]>>();

            foreach (var item in renderData.DynamicData)
            {
                OpenXmlElement[] openXmlElements = ConvertHtmlToOpenXMLElements(item.Content, mainDocumentPart);
                //foreach (Paragraph openElement in openXmlElements)
                //{
                //    openElement.ParagraphProperties = new ParagraphProperties(
                //    new Indentation() { Left = renderData.Indent });
                //}
                foreach (var element in openXmlElements)
                {
                    if (element is Table tableElement)
                    {
                        EnsureTableAndCellBorders((Table)element);
                    }
                    if (element is Paragraph newParagraph)
                    {
                        ((Paragraph)element).ParagraphProperties = newParagraph.ParagraphProperties ?? new ParagraphProperties(
                        new Indentation() { Left = renderData.Indent });
                    }
                }

                foreach (var element in openXmlElements)
                {
                    foreach (var run in element.Descendants<Run>())
                    {
                        DefaultFontEnsure(run);
                        //var runProperties = run.RunProperties ?? new RunProperties();
                        //var runFonts = runProperties.RunFonts ?? new RunFonts();

                        //if (!IsWindingsFont(runFonts))
                        //{
                        //    runFonts.Ascii = ConfigConstant._defaultFont;
                        //    runFonts.HighAnsi = ConfigConstant._defaultFont;
                        //}

                        //runProperties.RunFonts = runFonts;
                        //run.RunProperties = runProperties;
                    }
                }


                //var plainTextRun = new Run(text);
                Run plainTextRun = new Run();
                plainTextRun = new Run(openXmlElements);
                Paragraph innerParagraph;
                //innerParagraph = new Paragraph(new ParagraphProperties());
                innerParagraph = new Paragraph(new ParagraphProperties(
                                     //new ParagraphStyleId() { Val = "No Spacing" },
                                     new SpacingBetweenLines() //{ After = "0" }
                                     ));
                //innerParagraph.ParagraphProperties.SpacingBetweenLines.AfterLines = 0;
                //innerParagraph.ParagraphProperties.SpacingBetweenLines.BeforeLines = 0;
                innerParagraph.ParagraphProperties.SpacingBetweenLines.Line = ConfigConstant._dynamicSpaceBetweenLines;
                innerParagraph.AppendChild(plainTextRun);


                var headingParagraph = (Paragraph)sourceParagraph.CloneNode(true);
                headingParagraph.RemoveAllChildren<Run>();

                var newRun = new Run();
                newRun = CreateStyledRun(item.Outline.Content, "000000", true);

                Table tableImg = new Table();
                headingParagraph.AppendChild(newRun);
                if (renderData.IsCheck)
                {
                    var checkOutline = item.SurveyOutlineOptions;
                }
                if (item.Images.Count > 0)
                {
                    if (!item.Images.Any(a => a.FullSubDirectory.Contains("Appendix")))
                    {
                        tableImg = CreateImageTable(mainDocumentPart, item.Images);
                    }
                    else
                    {
                        foreach (var image in item.Images)
                        {
                            tableImg = CreateImagePerTable(mainDocumentPart, image);
                        }
                    }
                    //tableImg = CreateImageTable(mainDocumentPart, item.Images);
                }
                clonedParagraphs.Add(new Tuple<Paragraph, Paragraph, Table, Run, OpenXmlElement[]>(headingParagraph, innerParagraph, tableImg, plainTextRun, openXmlElements));
            }
            return clonedParagraphs;
        }

        private static void InsertClonedParagraphsAfter(
    Paragraph referenceParagraph,
    List<Tuple<Paragraph, Paragraph, Table, Run, OpenXmlElement[]>> paragraphsToInsert)
        {
            foreach (var paragraph in paragraphsToInsert)
            {
                if (paragraph.Item1 != null)
                {
                    referenceParagraph.InsertAfterSelf(paragraph.Item1);
                    referenceParagraph = paragraph.Item1;
                }
                if (paragraph.Item2 != null)
                {
                    if (paragraph.Item5.Length > 0)
                    {
                        if (paragraph.Item3 != null)
                            paragraph.Item2.AppendChild(paragraph.Item3);
                        referenceParagraph.InsertAfterSelf(paragraph.Item2);
                        referenceParagraph = paragraph.Item2;

                    }
                }
            }
        }

        #endregion







        // Update comment: 2025-05-21
        //private static Run CreateTextBoxRun(string content, long widthEmu, long heightEmu)
        //{
        //    return new Run(new Drawing(
        //        new DW.Inline(
        //            new DW.Extent() { Cx = widthEmu, Cy = heightEmu },
        //            new DW.EffectExtent(),
        //            new DW.DocProperties() { Id = 1U, Name = "TextBox" },
        //            new DW.NonVisualGraphicFrameDrawingProperties(),
        //            new A.Graphic(
        //                new A.GraphicData(
        //                    new A.Shape(
        //                        new A.NonVisualShapeProperties(
        //                            new A.NonVisualDrawingProperties() { Id = 1U, Name = "MyShape" },
        //                            new A.NonVisualShapeDrawingProperties()
        //                        ),
        //                        new A.ShapeProperties(
        //                            new A.Transform2D(
        //                                new A.Offset() { X = 0L, Y = 0L },
        //                                new A.Extents() { Cx = widthEmu, Cy = heightEmu }
        //                            ),
        //                            new A.PresetGeometry(new A.AdjustValueList()) { Preset = A.ShapeTypeValues.Rectangle },
        //                            new A.SolidFill(new A.RgbColorModelHex() { Val = "FBEAEA" }), // nền hồng nhạt
        //                            new A.Outline(new A.SolidFill(new A.RgbColorModelHex() { Val = "FF0000" })) // viền đỏ
        //                        ),
        //                        new A.TextBody(
        //                            new A.BodyProperties(),
        //                            new A.ListStyle(),
        //                            new A.Paragraph(
        //                                new A.Run(
        //                                    new A.RunProperties() { Language = "en-US", FontSize = 1400 }, // 14pt
        //                                    new A.Text(content)
        //                                )
        //                            )
        //                        )
        //                    )
        //                )
        //                { Uri = "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" }
        //            )
        //        )
        //    ));
        //}

        #region Demo Concatenate Page
        public static void AppendDocument(MainDocumentPart mainPart, string inputFile)
        {
            using (WordprocessingDocument inputDoc = WordprocessingDocument.Open(inputFile, false))
            {
                Body inputBody = inputDoc.MainDocumentPart.Document.Body;
                foreach (var element in inputBody.Elements())
                {
                    var clonedElement = element.CloneNode(true);
                    //ReplaceImageIds(mainPart, inputDoc.MainDocumentPart, clonedElement);
                    mainPart.Document.Body.Append(clonedElement);
                    //mainPart.Document.Body.Append(element.CloneNode(true));
                }

                CopyStylesNumberingAndImages(mainPart, inputDoc.MainDocumentPart);
            }
        }
        #endregion


        #region Tool
        //private static OpenXmlElement[] GetContentElementsFromFile(string filePath, MainDocumentPart destMainPart)
        private static OpenXmlElement[] ConvertHtmlToOpenXMLElements(string htmlContent, MainDocumentPart destMainPart)
        {
            HtmlConverter converter = new HtmlConverter(destMainPart);
            //if (File.Exists(filePath))
            //{
            //    string htmlContent = File.ReadAllText(filePath);
            //    string htmlContent = filePath;
            //    // Chuyển đổi HTML sang danh sách các phần tử OpenXML
            //    var elements = converter.Parse(htmlContent).ToArray();

            //    // Nếu HTML chứa hình ảnh, xử lý nhúng hình ảnh vào tài liệu (nếu cần)
            //    foreach (var element in elements)
            //    {
            //        ReplaceImageIds(destMainPart, null, element);
            //    }
            //    return elements;
            //}
            var elements = converter.Parse(htmlContent).ToArray();
            if (!string.IsNullOrEmpty(htmlContent))
            {
                foreach (var element in elements)
                {
                    ReplaceImageIds(destMainPart, null, element);
                }
            }
            return elements;
        }
        private static void CopyStylesNumberingAndImages(MainDocumentPart destMainPart, MainDocumentPart sourceMainPart)
        {
            if (sourceMainPart.StyleDefinitionsPart != null)
            {
                if (destMainPart.StyleDefinitionsPart == null)
                    destMainPart.AddNewPart<StyleDefinitionsPart>();

                destMainPart.StyleDefinitionsPart.FeedData(sourceMainPart.StyleDefinitionsPart.GetStream());
            }

            if (sourceMainPart.NumberingDefinitionsPart != null)
            {
                if (destMainPart.NumberingDefinitionsPart == null)
                    destMainPart.AddNewPart<NumberingDefinitionsPart>();

                destMainPart.NumberingDefinitionsPart.FeedData(sourceMainPart.NumberingDefinitionsPart.GetStream());
            }
            foreach (var embeddedPart in sourceMainPart.Parts.Where(p => p.OpenXmlPart is EmbeddedObjectPart))
            {
                var destEmbeddedPart = destMainPart.AddNewPart<EmbeddedObjectPart>(embeddedPart.OpenXmlPart.ContentType);
                destEmbeddedPart.FeedData(embeddedPart.OpenXmlPart.GetStream());
            }
        }

        public static Drawing MakeNewDrawingObject(long newWidthEmu, long newHeightEmu, string fullSubDirectory, string imagePartId)
        {
            return new Drawing(
                    new DocumentFormat.OpenXml.Drawing.Wordprocessing.Inline( //Khung bên ngoài
                        new DocumentFormat.OpenXml.Drawing.Wordprocessing.Extent() { Cx = newWidthEmu, Cy = newHeightEmu },
                        new DocumentFormat.OpenXml.Drawing.Wordprocessing.DocProperties()
                        {
                            Id = (UInt32Value)1U,
                            Name = "Picture"
                        },
                        new DocumentFormat.OpenXml.Drawing.Graphic(
                            new DocumentFormat.OpenXml.Drawing.GraphicData(
                                new DocumentFormat.OpenXml.Drawing.Pictures.Picture(
                                    new DocumentFormat.OpenXml.Drawing.Pictures.NonVisualPictureProperties(
                                        new DocumentFormat.OpenXml.Drawing.Pictures.NonVisualDrawingProperties()
                                        {
                                            Id = (UInt32Value)0U,
                                            Name = fullSubDirectory
                                        },
                                        new DocumentFormat.OpenXml.Drawing.Pictures.NonVisualPictureDrawingProperties()
                                    ),
                                    new DocumentFormat.OpenXml.Drawing.Pictures.BlipFill(
                                        new DocumentFormat.OpenXml.Drawing.Blip()
                                        {
                                            Embed = imagePartId,
                                            CompressionState = DocumentFormat.OpenXml.Drawing.BlipCompressionValues.Print
                                        },
                                        new DocumentFormat.OpenXml.Drawing.Stretch(
                                            new DocumentFormat.OpenXml.Drawing.FillRectangle()
                                        )
                                    ),
                                    new DocumentFormat.OpenXml.Drawing.Pictures.ShapeProperties(
                                        new DocumentFormat.OpenXml.Drawing.Transform2D(
                                            new DocumentFormat.OpenXml.Drawing.Offset() { X = 0L, Y = 0L }, // ảnh bên trong 
                                            new DocumentFormat.OpenXml.Drawing.Extents() { Cx = newWidthEmu, Cy = newHeightEmu }//,
                                            //new DocumentFormat.OpenXml.Drawing.Rotation() {  = 5400000 } // Xoay 90 độ (90 * 60000)
                                        ),
                                        new DocumentFormat.OpenXml.Drawing.PresetGeometry(
                                            new DocumentFormat.OpenXml.Drawing.AdjustValueList()
                                        )
                                        { Preset = DocumentFormat.OpenXml.Drawing.ShapeTypeValues.Rectangle }
                                    )
                                )
                            )
                            { Uri = "http://schemas.openxmlformats.org/drawingml/2006/picture" }
                        )
                    )
                );
        }

        //public static void ConvertDocxToHtml(string htmlPath, string docxPath, string serial) Sautinsoft
        //{
        //    DocumentCore.SetLicense(serial);
        //    DocumentCore dc = DocumentCore.Load(htmlPath);
        //    dc.Save(docxPath);
        //}

        //public static void SyncfusionConvertDocxToHtml(string htmlPath, string docxPath)
        //{
        //    // Tạo một tài liệu Word mới
        //    FileStream fileStreamPath = new FileStream(htmlPath, FileMode.Open, FileAccess.Read, FileShare.ReadWrite);
        //    //Opens an existing document from file system through constructor of WordDocument class
        //    using (WordDocument document = new WordDocument(fileStreamPath, FormatType.Html))
        //    {
        //        //Saves the Word document to MemoryStream
        //        MemoryStream stream = new MemoryStream();
        //        document.Save(stream, FormatType.Docx);
        //        File.WriteAllBytes(docxPath, stream.ToArray());
        //        document.Close();
        //    }
        //}

        public static MemoryStream CheckImgAndRotate(Image img, out bool isPortrait)
        {
            isPortrait = false;
            MemoryStream memoryStream = new MemoryStream();
            int orientationId = ConfigConstant._orientationExifId; // Mã Exif cho Orientation
            int orientation = 0;
            if (Array.IndexOf(img.PropertyIdList, orientationId) > -1)
            {
                orientation = img.GetPropertyItem(orientationId).Value[0];
                if (orientation == 6 || orientation == 8) // 6 = 90 độ, 8 = 270 độ
                {
                    isPortrait = true;
                }
            }

            RotateFlipType rotateType = RotateFlipType.RotateNoneFlipNone;

            if (isPortrait)
            {
                if (orientation == 6)
                    rotateType = RotateFlipType.Rotate90FlipNone;
                if (orientation == 8)
                rotateType = RotateFlipType.Rotate270FlipNone;
            }
            //else if (angle == 180)
            //    rotateType = RotateFlipType.Rotate180FlipNone;
            //else if (angle == 270)
            //    rotateType = RotateFlipType.Rotate270FlipNone;

            // Xoay ảnh
            img.RotateFlip(rotateType);
            img.Save(memoryStream, ImageFormat.Jpeg); // Lưu ảnh vào stream dưới dạng JPEG
            memoryStream.Position = 0; // Đặt lại con trỏ về đầu stream để đọc dữ liệu
            return memoryStream;
        }


        public static byte[] ImageLoad(string FullSubDirectory, out bool isPortrait)
        {
            isPortrait = false;
            MemoryStream memoryStream = new MemoryStream();
            memoryStream = CheckImgAndRotate(Image.FromFile(FullSubDirectory),out isPortrait);
            //using (Image img = Image.FromFile(FullSubDirectory))
            //{
            //    //int orientationId = 0x0112; // Mã Exif cho Orientation
            //    int orientationId = ConfigConstant._orientationExifId; // Mã Exif cho Orientation

            //    if (Array.IndexOf(img.PropertyIdList, orientationId) > -1)
            //    {
            //        int orientation = img.GetPropertyItem(orientationId).Value[0];
            //        if (orientation == 6 || orientation == 8) // 6 = 90 độ, 8 = 270 độ
            //        {
            //            isPortrait = true;
            //        }
            //    }

            //    RotateFlipType rotateType = RotateFlipType.RotateNoneFlipNone;

            //    if (isPortrait)
            //        rotateType = RotateFlipType.Rotate90FlipNone;
            //    //else if (angle == 180)
            //    //    rotateType = RotateFlipType.Rotate180FlipNone;
            //    //else if (angle == 270)
            //    //    rotateType = RotateFlipType.Rotate270FlipNone;

            //    // Xoay ảnh
            //    img.RotateFlip(rotateType);
            //    img.Save(memoryStream, ImageFormat.Jpeg); // Lưu ảnh vào stream dưới dạng JPEG
            //    memoryStream.Position = 0; // Đặt lại con trỏ về đầu stream để đọc dữ liệu
            //}
            return memoryStream.ToArray();
        }

        public static List<SurveyMemoWorkflow> ExtractTocLines(string filePath)
        {
            var tocLines = new List<SurveyMemoWorkflow>();
            List<Paragraph> tocParas = new List<Paragraph>();
            using (WordprocessingDocument doc = WordprocessingDocument.Open(filePath, false))
            {
                var body = doc.MainDocumentPart.Document.Body;

                // Tìm tất cả các đoạn văn có chứa "TOC" trong text
                tocParas = body.Descendants<Paragraph>()
                    .Where(p => p.Descendants<Text>()
                        .Any(t => t.Text != null && t.Text.Contains("TOC")))
                    .ToList();
                var tocParagraphs = body.Descendants<Paragraph>()
            .Where(p => p.ParagraphProperties != null &&
                        p.ParagraphProperties.ParagraphStyleId != null &&
                        p.ParagraphProperties.ParagraphStyleId.Val.Value.StartsWith("TOC"))
            .ToList();

                foreach (var p in tocParagraphs)
                {
                    string fullText = string.Concat(p.Descendants<Text>().Select(t => t.Text)).Trim();

                    //// Tách trang (thường được render như "....1" hoặc "Title.............3")
                    string page = "";
                    //string title = fullText;

                    //// Cắt từ cuối chuỗi nếu có số
                    //var match = System.Text.RegularExpressions.Regex.Match(fullText, @"(.*?)(\d+)$");
                    //if (match.Success)
                    //{
                    //    title = match.Groups[1].Value.TrimEnd('.', ' ');
                    //    page = match.Groups[2].Value;
                    //}

                    //var style = p.ParagraphProperties.ParagraphStyleId.Val.Value;
                    //try
                    //{
                    //int level = int.Parse(style.Replace("TOC", "")); // TOC1 -> 1, TOC2 -> 2

                    //tocLines.Add(new SurveyMemoWorkflow
                    //{
                    //    OutlineName = title,
                    //    OutlineOrder = level.ToString()//,
                    //    //PageNumber = page
                    //});

                    //}
                    //catch
                    //{
                    //    continue;
                    //}
                    var match = System.Text.RegularExpressions.Regex.Match(fullText, @"^([A-Za-z0-9\.]+?)\.(.+)$");
                    if (match.Success)
                    {
                        string rawTitle = match.Groups[0].Value.TrimEnd('.', ' ');
                        //page = match.Groups[2].Value;

                        // Tách OutlineOrder + OutlineName từ rawTitle
                        // Giả định định dạng: [OutlineOrder] [Tên đề mục]
                        var orderMatch = System.Text.RegularExpressions.Regex.Match(rawTitle, @"^(([A-Za-z0-9]+\.){1,3})(.+)$");
                        if (orderMatch.Success)
                        {


                            string outlineOrder = orderMatch.Groups[1].Value.Trim();
                            string outlineName = orderMatch.Groups[3].Value.Trim();
                            var pageMatch = Regex.Match(outlineName, @"^(.+?)(\d+)$");

                            if (pageMatch.Success)
                            {
                                outlineName = pageMatch.Groups[1].Value.Trim();
                                page = pageMatch.Groups[2].Value.Trim();
                                tocLines.Add(new SurveyMemoWorkflow
                                {
                                    OutlineName = outlineName,
                                    OutlineOrder = outlineOrder,
                                    OutlinePage = page
                                });
                            }


                        }
                        else
                        {
                            // fallback nếu không match OutlineOrder
                            tocLines.Add(new SurveyMemoWorkflow
                            {
                                OutlineName = rawTitle,
                                OutlineOrder = "",
                                OutlinePage = page
                            });
                        }
                    }
                }
            }
            return tocLines;
        }

        public static void ConvertPDF(string wordPath, string pdfOutputPath)
        {
            //Reference HTML to PDF
            //using (WordprocessingDocument wordDocument = WordprocessingDocument.Open(wordPath, false))
            //{
            //    try
            //    {
            //        using (var pdfWriter = new iText.Kernel.Pdf.PdfWriter(pdfOutputPath))
            //        using (var pdfDocument = new iText.Kernel.Pdf.PdfDocument(pdfWriter))
            //        using (var document = new iText.Layout.Document(pdfDocument))
            //        {
            //            foreach (var paragraph in wordDocument.MainDocumentPart.Document.Body.Elements<Paragraph>())
            //            {
            //                // Đọc nội dung văn bản từ Paragraph
            //                string text = paragraph.InnerText.Trim();

            //                // Nếu đoạn văn có nội dung, thêm nó vào tài liệu PDF
            //                if (!string.IsNullOrWhiteSpace(text))
            //                {
            //                    // Tạo Paragraph trong PDF
            //                    var pdfParagraph = new iText.Layout.Element.Paragraph(text);

            //                    // Tuỳ chỉnh định dạng nếu cần (ví dụ: font, kích thước chữ)
            //                    pdfParagraph.SetFontSize(12); // Cỡ chữ 12
            //                                                  //pdfParagraph.SetFont(iText.IO.Font.Constants.StandardFonts.HELVETICA); // Font Helvetica

            //                    // Thêm Paragraph vào tài liệu PDF
            //                    document.Add(pdfParagraph);
            //                }
            //            }
            //        }

            //    }
            //    catch
            //    (Exception ex)
            //    {

            //    }
            //}


            //PDF Convert not very well
            //using (FileStream docStream = new FileStream(wordPath, FileMode.Open, FileAccess.Read))
            //{

            //    DocIORenderer render = new DocIORenderer();
            //    using (WordDocument wordDocument = new WordDocument(docStream, FormatType.Automatic))
            //    {
            //        wordDocument.UpdateTableOfContents();
            //        Syncfusion.Pdf.PdfDocument pdfDocument = render.ConvertToPDF(wordDocument);
            //        using (FileStream pdfStream = new FileStream(pdfOutputPath, FileMode.Create, FileAccess.Write))
            //        {
            //            pdfDocument.Save(pdfStream);
            //        }
            //    }
            //}



            //Standard PDF converter
            Application wordApp = new Application();
            Document wordDoc = null;

            try
            {
                wordDoc = wordApp.Documents.Open(wordPath, ConfirmConversions: false, ReadOnly: true, Visible: false);
                wordDoc.SaveAs(pdfOutputPath, WdSaveFormat.wdFormatPDF);

            }
            catch (Exception ex)
            {
                Handler.ErrorException(ex, "");
            }
            finally
            {
                if (wordDoc != null)
                {
                    wordDoc.Close(false);
                    System.Runtime.InteropServices.Marshal.ReleaseComObject(wordDoc);
                }

                wordApp.Quit();
                System.Runtime.InteropServices.Marshal.ReleaseComObject(wordApp);
            }


        }

        public static void AddPageBreak(WordprocessingDocument doc)
        {
            var paragraph = new DocumentFormat.OpenXml.Wordprocessing.Paragraph(new Run(new Break() { Type = BreakValues.Page }));
            doc.MainDocumentPart.Document.Body.Append(paragraph);
        }
        //Add Images by replace Id 
        public static void ReplaceImageIds(MainDocumentPart destMainPart, MainDocumentPart sourceMainPart, OpenXmlElement element)
        {
            try
            {
                var imageElements = element.Descendants<Drawing>();

                foreach (var drawing in imageElements)
                {
                    var blip = drawing.Descendants<DocumentFormat.OpenXml.Drawing.Blip>().FirstOrDefault();
                    if (blip != null)
                    {
                        string embedId = blip.Embed?.Value ?? "";
                        if (string.IsNullOrEmpty(embedId))
                        {
                            var sourceImagePart = (ImagePart)sourceMainPart.GetPartById(embedId);
                            var destImagePart = destMainPart.AddImagePart(sourceImagePart.ContentType);

                            using (var stream = sourceImagePart.GetStream())
                            {
                                destImagePart.FeedData(stream);
                            }

                            blip.Embed.Value = destMainPart.GetIdOfPart(destImagePart);
                        }
                    }
                }
            }
            catch
            {

            }
        }
        private static Table CreateImageTable(MainDocumentPart mainDocumentPart, List<dynamic> images)
        {
            // Kiểm tra đầu vào
            if (images == null || images.Count == 0)
                throw new ArgumentException("The images list cannot be null or empty.");
            long inchToEmu = ConfigConstant._inchToEmu; // 1 inch = 914400 EMU

            // Tạo bảng
            Table table = new Table();
            TableWidth tableWidth = new TableWidth() { Width = (ConfigConstant._outlineTablePictureWidthInch * (inchToEmu * ConfigConstant._inchToTwip) * ConfigConstant._outlinePicturePerRow).ToString(), Type = TableWidthUnitValues.Dxa };

            TableProperties tableProperties = new TableProperties(new TableIndentation { Width = ConfigConstant._leftTableIndent, Type = TableWidthUnitValues.Dxa });
            tableProperties.TableLayout = new TableLayout { Type = TableLayoutValues.Fixed };
            tableProperties.Append(tableWidth);
            table.AppendChild(tableProperties);

            double maxImageWidthInchesL = ConfigConstant._outlinePictureWidthInchL;
            double maxImageHeightInchesL = ConfigConstant._outlinePictureHeightInchL;

            double maxImageWidthInchesP = ConfigConstant._outlinePictureWidthInchP;
            double maxImageHeightInchesP = ConfigConstant._outlinePictureHeightInchP;


            double maxImageWidthInchesPlantLayout = ConfigConstant._plantLayoutPictureWidth;
            double maxImageHeightInchesPlantLayout = ConfigConstant._plantLayoutPictureHeight;


            // Hàng hiện tại (ảnh và ghi chú)
            TableRow currentImageRow = null;
            TableRow currentTextRow = null;
            int currentColumnCount = 0;

            foreach (var image in images)
            {
                // Kiểm tra file tồn tại
                if (!File.Exists(image.FullSubDirectory))
                    continue;

                // Nếu cần bắt đầu hàng mới
                if (currentColumnCount == 0)
                {
                    currentImageRow = new TableRow();
                    currentTextRow = new TableRow();
                }
                long maxWidthEmuL = (long)(maxImageWidthInchesL * inchToEmu);
                long maxHeightEmuL = (long)(maxImageHeightInchesL * inchToEmu);
                long maxWidthEmuP = (long)(maxImageWidthInchesP * inchToEmu);
                long maxHeightEmuP = (long)(maxImageHeightInchesP * inchToEmu);
                long maxWidthEmuPL = (long)(maxImageWidthInchesPlantLayout * inchToEmu);
                long maxHeightEmuPL = (long)(maxImageHeightInchesPlantLayout * inchToEmu);
                // Tạo ô ảnh
                TableCell imageCell = new TableCell();
                //TableCellProperties imageCellProperties = new TableCellProperties(
                //    new TableCellWidth() { Type = TableWidthUnitValues.Dxa, Width = (maxWidthEmuL / inchToEmu * ConfigConstant._inchToTwip).ToString() }, // Width in twips
                //    new TableCellVerticalAlignment() { Val = TableVerticalAlignmentValues.Center }
                //);
                long newWidthEmu, newHeightEmu;

                using (Image img = Image.FromFile(image.FullSubDirectory))
                {
                    bool isPortrait = false;
                    MemoryStream memoryStream = new MemoryStream();
                    memoryStream = CheckImgAndRotate(img, out isPortrait);
                    //int orientationId = ConfigConstant._orientationExifId; // Mã Exif cho Orientation
                    string imagePartId = "img" + Guid.NewGuid().ToString().Replace("-", "");
                    ImagePart imagePart = mainDocumentPart.AddImagePart(ImagePartType.Jpeg, imagePartId);
                    if (isPortrait || img.Height > img.Width) // Ảnh dọc
                    {
                        newWidthEmu = maxWidthEmuP;
                        newHeightEmu = maxHeightEmuP;
                    }
                    else // Ảnh ngang
                    {
                        newWidthEmu = maxWidthEmuL;
                        newHeightEmu = maxHeightEmuL;
                    }

                    //if (image.FullSubDirectory.Contains("Appendix"))
                    //{
                    //    newWidthEmu = maxWidthEmuPL;
                    //    newHeightEmu = maxHeightEmuPL;
                    //    tableProperties.TableIndentation = new TableIndentation { Width = (int)(ConfigConstant._leftPlantLayoutTableIndent * ConfigConstant._inchToTwip), Type = TableWidthUnitValues.Dxa };
                    //    tableProperties.TableWidth = new TableWidth() { Width = (ConfigConstant._plantLayoutTablePictureWidthInch * (inchToEmu * ConfigConstant._inchToTwip) * 3).ToString(), Type = TableWidthUnitValues.Dxa };
                    //}
                    imagePart.FeedData(memoryStream);
                    Drawing imageDrawing = MakeNewDrawingObject(newWidthEmu, newHeightEmu, System.IO.Path.GetFileName(image.FullSubDirectory), imagePartId);

                    Paragraph imageParagraph = new Paragraph(
                        new ParagraphProperties(
                            new Justification() { Val = JustificationValues.Center } // Căn giữa hình ảnh
                        ),
                        new Run(imageDrawing) // Thêm Drawing vào Paragraph
                    );

                    //imageCell.Append(new Paragraph(new Run(imageDrawing)));
                    imageCell.Append(imageParagraph);
                    currentImageRow.Append(imageCell);


                    TableCell textCell = new TableCell();
                    Paragraph textParagraph = new Paragraph(CreateStyledRun(image.AttachmentNote ?? string.Empty, "000000", false))
                    {
                        ParagraphProperties = new ParagraphProperties(
                   new Justification() { Val = JustificationValues.Center }
                     )
                    };
                    textCell.Append(textParagraph);
                    currentTextRow.Append(textCell);

                }
                // Tăng cột hiện tại
                currentColumnCount++;

                // Nếu đã đủ 3 cột, thêm hàng vào bảng và reset bộ đếm
                if (currentColumnCount == ConfigConstant._outlinePicturePerRow)
                {
                    table.Append(currentImageRow);
                    table.Append(currentTextRow);
                    currentColumnCount = 0;
                }
            }

            // Thêm hàng cuối cùng nếu chưa đủ 3 cột
            if (currentColumnCount > 0)
            {
                table.Append(currentImageRow);
                table.Append(currentTextRow);
            }

            return table;
        }
        private static Table CreateImagePerTable(MainDocumentPart mainDocumentPart, dynamic image)
        {
            // Kiểm tra đầu vào
            if (image == null)
                throw new ArgumentException("The images list cannot be null or empty.");
            long inchToEmu = ConfigConstant._inchToEmu; // 1 inch = 914400 EMU

            // Tạo bảng
            Table table = new Table();
            TableWidth tableWidth = new TableWidth() { Width = (ConfigConstant._outlineTablePictureWidthInch * (inchToEmu * ConfigConstant._inchToTwip) * ConfigConstant._outlinePicturePerRow).ToString(), Type = TableWidthUnitValues.Dxa };

            TableProperties tableProperties = new TableProperties(new TableIndentation { Width = ConfigConstant._leftTableIndent, Type = TableWidthUnitValues.Dxa });
            tableProperties.TableLayout = new TableLayout { Type = TableLayoutValues.Fixed };
            tableProperties.Append(tableWidth);
            table.AppendChild(tableProperties);

            double maxImageWidthInchesL = ConfigConstant._outlinePictureWidthInchL;
            double maxImageHeightInchesL = ConfigConstant._outlinePictureHeightInchL;

            double maxImageWidthInchesP = ConfigConstant._outlinePictureWidthInchP;
            double maxImageHeightInchesP = ConfigConstant._outlinePictureHeightInchP;


            double maxImageWidthInchesPlantLayout = ConfigConstant._plantLayoutPictureWidth;
            double maxImageHeightInchesPlantLayout = ConfigConstant._plantLayoutPictureHeight;


            // Hàng hiện tại (ảnh và ghi chú)
            TableRow currentImageRow = null;
            TableRow currentTextRow = null;
            int currentColumnCount = 0;

            // Kiểm tra file tồn tại
            if (!File.Exists(image.FullSubDirectory))
                return null;

            // Nếu cần bắt đầu hàng mới
            if (currentColumnCount == 0)
            {
                currentImageRow = new TableRow();
                currentTextRow = new TableRow();
            }
            long maxWidthEmuL = (long)(maxImageWidthInchesL * inchToEmu);
            long maxHeightEmuL = (long)(maxImageHeightInchesL * inchToEmu);
            long maxWidthEmuP = (long)(maxImageWidthInchesP * inchToEmu);
            long maxHeightEmuP = (long)(maxImageHeightInchesP * inchToEmu);
            long maxWidthEmuPL = (long)(maxImageWidthInchesPlantLayout * inchToEmu);
            long maxHeightEmuPL = (long)(maxImageHeightInchesPlantLayout * inchToEmu);
            // Tạo ô ảnh
            TableCell imageCell = new TableCell();
            //TableCellProperties imageCellProperties = new TableCellProperties(
            //    new TableCellWidth() { Type = TableWidthUnitValues.Dxa, Width = (maxWidthEmuL / inchToEmu * ConfigConstant._inchToTwip).ToString() }, // Width in twips
            //    new TableCellVerticalAlignment() { Val = TableVerticalAlignmentValues.Center }
            //);
            long newWidthEmu = 0, newHeightEmu = 0;

            using (Image img = Image.FromFile(image.FullSubDirectory))
            {
                bool isPortrait = false;
                MemoryStream memoryStream = new MemoryStream();
                memoryStream = CheckImgAndRotate(img, out isPortrait);
                int orientationId = ConfigConstant._orientationExifId; // Mã Exif cho Orientation
                string imagePartId = "img" + Guid.NewGuid().ToString().Replace("-", "");
                ImagePart imagePart = mainDocumentPart.AddImagePart(ImagePartType.Jpeg, imagePartId);
                //if (isPortrait || img.Height > img.Width) // Ảnh dọc
                //{
                //    newWidthEmu = maxWidthEmuP;
                //    newHeightEmu = maxHeightEmuP;
                //}
                //else // Ảnh ngang
                //{
                //    newWidthEmu = maxWidthEmuL;
                //    newHeightEmu = maxHeightEmuL;
                //}

                if (image.FullSubDirectory.Contains("Appendix"))
                {
                    newWidthEmu = maxWidthEmuPL;
                    newHeightEmu = maxHeightEmuPL;
                    tableProperties.TableIndentation = new TableIndentation { Width = (int)(ConfigConstant._leftPlantLayoutTableIndent * ConfigConstant._inchToTwip), Type = TableWidthUnitValues.Dxa };
                    tableProperties.TableWidth = new TableWidth() { Width = (ConfigConstant._plantLayoutTablePictureWidthInch * (inchToEmu * ConfigConstant._inchToTwip) * 3).ToString(), Type = TableWidthUnitValues.Dxa };
                }
                imagePart.FeedData(memoryStream);
                Drawing imageDrawing = MakeNewDrawingObject(newWidthEmu, newHeightEmu, System.IO.Path.GetFileName(image.FullSubDirectory), imagePartId);

                Paragraph imageParagraph = new Paragraph(
                    new ParagraphProperties(
                        new Justification() { Val = JustificationValues.Center } // Căn giữa hình ảnh
                    ),
                    new Run(imageDrawing) // Thêm Drawing vào Paragraph
                );

                //imageCell.Append(new Paragraph(new Run(imageDrawing)));
                imageCell.Append(imageParagraph);
                currentImageRow.Append(imageCell);


                TableCell textCell = new TableCell();
                Paragraph textParagraph = new Paragraph(CreateStyledRun(image.AttachmentNote ?? string.Empty, "000000", false))
                {
                    ParagraphProperties = new ParagraphProperties(
               new Justification() { Val = JustificationValues.Center }
                 )
                };
                textCell.Append(textParagraph);
                currentTextRow.Append(textCell);

            }
            // Tăng cột hiện tại
            currentColumnCount++;

            // Nếu đã đủ 3 cột, thêm hàng vào bảng và reset bộ đếm
            if (currentColumnCount == ConfigConstant._outlinePicturePerRow)
            {
                table.Append(currentImageRow);
                table.Append(currentTextRow);
                currentColumnCount = 0;
            }

            // Thêm hàng cuối cùng nếu chưa đủ 3 cột
            if (currentColumnCount > 0)
            {
                table.Append(currentImageRow);
                table.Append(currentTextRow);
            }

            return table;
        }



        private static void DefaultFontEnsure(OpenXmlElement openXmlElement)
        {
            foreach (var run in openXmlElement.Descendants<Run>())
            {
                var runProperties = run.RunProperties ?? new RunProperties();
                var runFonts = runProperties.RunFonts ?? new RunFonts();

                if (!IsWindingsFont(runFonts))
                {
                    runFonts.Ascii = ConfigConstant._defaultFont;
                    runFonts.HighAnsi = ConfigConstant._defaultFont;
                }

                runProperties.RunFonts = runFonts;
                run.RunProperties = runProperties;
            }
        }



        private static bool IsWindingsFont(RunFonts runFonts)
        {
            if (runFonts == null) return false;
            return ConfigConstant.windingsFonts.Contains(runFonts.Ascii) || ConfigConstant.windingsFonts.Contains(runFonts.HighAnsi);
        }









        //Add simple text Run example
        //private static void MergeContentIntoHeadingPlainText(Paragraph headingParagraph, string content)
        //{

        //    Run newRun = new Run(
        //        new RunProperties(new Color() { Val = "000000" }),
        //        new Text(" " + content)
        //    );


        //    headingParagraph.AppendChild(newRun);
        //}



        //private static Run CreateWingdingsRun(string symbol)
        //{
        //    return new Run(
        //        new RunProperties(
        //            new RunFonts() { Ascii = "Wingdings", HighAnsi = "Wingdings" },
        //            new FontSize() { Val = "22" },
        //            new Color() { Val = "FFA500" }// Font size = 11pt (OpenXML yêu cầu x2)
        //        ),
        //        new Text(symbol)
        //    );
        //}

        //Update date: 2025-04-22



        private static void MergeColumn(Table table, int columnIndex, WordObjectToHandle wordObjectToHandle)
        {
            TableRow[] rows = table.Elements<TableRow>().ToArray();
            if (rows.Length > 0)
            {
                for (int i = 0; i < rows.Length; i++)
                {
                    var firstCol = rows[i];
                    var cells = firstCol.Elements<TableCell>().ToList();
                    var cell = cells[columnIndex];

                    var cellAProperties = new TableCellProperties();
                    cellAProperties.VerticalMerge = new VerticalMerge
                    {
                        Val = i == 0 ? MergedCellValues.Restart : MergedCellValues.Continue //Restart is begin merging, continue is in merge progress
                    };

                    var filteredObject = AttributesFilterProcess(wordObjectToHandle, 0, "ColumnIndex", "ColumnProperty", "Width");

                    //var filteredObject = wordObjectToHandle.Attributes
                    //  .Where(obj =>
                    //  {
                    //      var property = obj.GetType().GetProperty("ColumnIndex");
                    //      return property != null && (int)property.GetValue(obj) == 0;
                    //  })
                    //  .Select(obj =>
                    //  {
                    //      var columnProperty = obj.GetType().GetProperty("ColumnProperty")?.GetValue(obj);
                    //      double width = double.Parse(((TableCellWidth)columnProperty).Width);
                    //      return new TableCellWidth
                    //      {
                    //          Type = TableWidthUnitValues.Dxa,
                    //          Width = columnProperty.GetType().GetProperty("Width") != null ? (width * ConfigConstant._inchToTwip).ToString() : "0",
                    //      };
                    //  })
                    //  .FirstOrDefault();

                    cellAProperties.AppendChild(filteredObject);

                    cell.AppendChild(cellAProperties);
                    if (i == 0)
                    {
                        var paragraphs = cell.Elements<Paragraph>().ToList();
                        foreach (var paragraph in paragraphs)
                        {
                            var runs = paragraph.Elements<Run>().ToList();
                            foreach (var run in runs)
                            {
                                var runProperties = run.GetFirstChild<RunProperties>();
                                if (runProperties != null)
                                {
                                    var bold = runProperties.GetFirstChild<Bold>();
                                    if (bold != null)
                                    {
                                        bold.Remove();
                                    }
                                }

                                var textElement = run.Elements<Text>().FirstOrDefault();
                                if (textElement != null)
                                {
                                    textElement.Text += " :";
                                }
                            }
                        }
                    }
                }
            }
        }

        private static void MergeColumnsIfBold(Table table, int columnIndex1, int columnIndex2)
        {
            TableRow[] rows = table.Elements<TableRow>().ToArray();
            if (rows.Length > 0)
            {
                for (int i = 0; i < rows.Length; i++)
                {
                    var firstCol = rows[i];
                    var cells = firstCol.Elements<TableCell>().ToList();

                    // Đảm bảo hàng có đủ số cột để xử lý
                    if (cells.Count <= Math.Max(columnIndex1, columnIndex2))
                        continue;

                    var cell1 = cells[columnIndex1];
                    var cell2 = cells[columnIndex2];

                    // Kiểm tra nếu ô thứ 2 có văn bản in đậm
                    var paragraphs = cell1.Elements<Paragraph>().ToList();
                    bool isBoldDetected = false;

                    foreach (var paragraph in paragraphs)
                    {
                        var runs = paragraph.Elements<Run>().ToList();
                        foreach (var run in runs)
                        {
                            var runProperties = run.GetFirstChild<RunProperties>();
                            if (runProperties != null)
                            {
                                var bold = runProperties.GetFirstChild<Bold>();
                                if (bold != null) // Nếu phát hiện văn bản in đậm
                                {
                                    isBoldDetected = true;
                                    break;
                                }
                            }
                        }
                        if (isBoldDetected)
                            break;
                    }

                    if (isBoldDetected)
                    {
                        // Merge cột thứ 2 và thứ 3
                        var cell1Properties = new TableCellProperties();
                        cell1Properties.AppendChild(new HorizontalMerge
                        {
                            Val = MergedCellValues.Restart // Bắt đầu merge
                        });
                        cell1.AppendChild(cell1Properties);

                        var cell2Properties = new TableCellProperties();
                        cell2Properties.AppendChild(new HorizontalMerge
                        {
                            Val = MergedCellValues.Continue // Tiếp tục merge
                        });
                        cell2.AppendChild(cell2Properties);
                    }
                }
            }
        }

        private static TableCellWidth AttributesFilterProcess(WordObjectToHandle wordObjectToHandle, int filterIndex, string indexProperty, string focusMainProperty, string childProperty)
        {

            var filteredObject = wordObjectToHandle.Attributes
              .Where(obj =>
              {
                  var property = obj.GetType().GetProperty(indexProperty);
                  return property != null && (int)property.GetValue(obj) == filterIndex;
              })
              .Select(obj =>
              {
                  var columnProperty = obj.GetType().GetProperty(focusMainProperty)?.GetValue(obj);
                  double width = double.Parse(((TableCellWidth)columnProperty).Width);
                  return new TableCellWidth
                  {
                      Type = TableWidthUnitValues.Dxa,
                      Width = columnProperty.GetType().GetProperty(childProperty) != null ? (width * ConfigConstant._inchToTwip).ToString() : "0",
                  };
              })
              .FirstOrDefault();
            return filteredObject;
        }

        private static TableRow CreateTableParticipantRow(List<string> cellValues, bool isBold, WordObjectToHandle wordObjectToHandle)
        {
            var row = new TableRow();
            int count = 0;
            foreach (var value in cellValues)
            {
                var paragraphProperties = new ParagraphProperties
                {
                    SpacingBetweenLines = new SpacingBetweenLines
                    {
                        Before = "140" // 7pt = 140 twips (1pt = 20 twips)
                    }
                };
                var paragraph = new Paragraph(paragraphProperties);
                paragraph.Append(CreateStyledRun(value, "000000", isBold));
                var cell = new TableCell(paragraph);
                if (count > 0)
                {
                    var filteredObject = AttributesFilterProcess(wordObjectToHandle, count, "ColumnIndex", "ColumnProperty", "Width");
                    cell.AppendChild(filteredObject);
                }
                row.Append(cell);
                count++;
            }
            return row;
        }

        private static Run CreateStyledRun(string text, string colorHex, bool isBold, string fontSize = "")
        {
            if (string.IsNullOrEmpty(fontSize)) fontSize = ConfigConstant._defaultSize;
            var runProperties = new RunProperties(
                new RunFonts() { Ascii = ConfigConstant._defaultFont, HighAnsi = ConfigConstant._defaultFont },
                new Color() { Val = colorHex }
                , new FontSize() { Val = fontSize }
            );

            if (isBold)
            {
                runProperties.Bold = new Bold();
            }

            return new Run(runProperties, new Text(text));
        }

        private static void EnsureTableAndCellBorders(Table table)
        {
            int MaxTableWidth = ConfigConstant._maxTableWidth; // Đơn vị trong OpenXML là Twips (1pt = 20 Twips)

            TableProperties tblProperties = table.GetFirstChild<TableProperties>();
            if (tblProperties == null)
            {
                tblProperties = new TableProperties();
                table.PrependChild(tblProperties);
            }

            if (tblProperties.TableBorders == null)
            {
                tblProperties.TableBorders = new TableBorders(
                    new TopBorder { Val = BorderValues.Single, Size = 0 },
                    new BottomBorder { Val = BorderValues.Single, Size = 0 },
                    new LeftBorder { Val = BorderValues.Single, Size = 0 },
                    new RightBorder { Val = BorderValues.Single, Size = 0 },
                    new InsideHorizontalBorder { Val = BorderValues.Single, Size = 0 },
                    new InsideVerticalBorder { Val = BorderValues.Single, Size = 0 }
                );
            }

            TableWidth tblWidth = tblProperties.GetFirstChild<TableWidth>();
            if (tblWidth == null || int.TryParse(tblWidth.Width, out int width) && width > MaxTableWidth * 20)
            {
                tblProperties.TableWidth = new TableWidth
                {
                    Width = (MaxTableWidth * 20).ToString(),
                    Type = TableWidthUnitValues.Dxa
                };
            }

            // Đảm bảo mỗi ô trong bảng có viền
            foreach (var row in table.Elements<TableRow>())
            {
                foreach (var cell in row.Elements<TableCell>())
                {
                    EnsureCellBorders(cell);
                }
            }
        }

        private static void EnsureCellBorders(TableCell cell)
        {
            TableCellProperties cellProperties = cell.GetFirstChild<TableCellProperties>();
            if (cellProperties == null)
            {
                cellProperties = new TableCellProperties();
                cell.PrependChild(cellProperties);
            }

            if (cellProperties.TableCellBorders == null)
            {
                cellProperties.TableCellBorders = new TableCellBorders(
                    new TopBorder { Val = BorderValues.Single, Size = 0 },
                    new BottomBorder { Val = BorderValues.Single, Size = 0 },
                    new LeftBorder { Val = BorderValues.Single, Size = 0 },
                    new RightBorder { Val = BorderValues.Single, Size = 0 }
                );
            }
        }



        private static void EnsureNoSpacing(Paragraph paragraph)
        {
            if (paragraph.ParagraphProperties == null)
            {
                paragraph.ParagraphProperties = new ParagraphProperties();
            }

            paragraph.ParagraphProperties.SpacingBetweenLines = new SpacingBetweenLines
            {
                Before = "0",
                After = "0",
            };
        }

        public static void CheckPortraitOrResize(MainDocumentPart mainPart, Drawing oldDrawing)
        {
            var blip = oldDrawing.Descendants<DocumentFormat.OpenXml.Drawing.Blip>().FirstOrDefault();
            if (blip == null || blip.Embed == null) return;

            string embedId = blip.Embed.Value;

            var imagePart = mainPart.GetPartById(embedId) as ImagePart;
            if (imagePart == null) return;

            using var imageStream = imagePart.GetStream(FileMode.Open, FileAccess.Read);
            using var originalImage = Image.FromStream(imageStream);

            MemoryStream ms = new MemoryStream();
            bool isPortrait;
            ms = CheckImgAndRotate(originalImage, out isPortrait);

            // 5. Original picture size
            //long widthEmu = (long)(originalImage.Width / originalImage.HorizontalResolution * ConfigConstant._inchToEmu);
            //long heightEmu = (long)(originalImage.Height / originalImage.VerticalResolution * ConfigConstant._inchToEmu);

            long widthEmu = 0, heightEmu = 0;
            //Resize
            var inline = oldDrawing.Descendants<DocumentFormat.OpenXml.Drawing.Wordprocessing.Inline>().FirstOrDefault();
            if (inline != null)
            {
                var extent = inline.Extent;
                widthEmu = extent.Cx;
                heightEmu = extent.Cy;
                if (extent != null)
                {
                    if (isPortrait)
                    {
                        extent.Cx = heightEmu;
                        extent.Cy = widthEmu;
                    }
                }
                var extents = oldDrawing.Descendants<DocumentFormat.OpenXml.Drawing.Extents>().FirstOrDefault();
                if (extents != null)
                {
                    if (isPortrait)
                    {
                        extents.Cx = heightEmu;
                        extents.Cy = widthEmu;
                    }
                }

                var transforms = oldDrawing.Descendants<DocumentFormat.OpenXml.Drawing.Transform2D>().FirstOrDefault();
                if (transforms != null)
                {
                    if (isPortrait)
                    {
                        transforms.Rotation = ConfigConstant._transform2D90Deg;// hoặc FlipVertical = true
                    }
                }
            }
        }
        #endregion

    }
}
public class WordObjectToHandle
{
    public string ElementType { get; set; } = "";
    public string ElementName { get; set; } = "";
    public string Action { get; set; } = "";
    public string PlaceHolder { get; set; } = "";
    public bool IsDynamicOutline { get; set; } = false;
    public List<object> Attributes { get; set; } = new List<object>();

}

public class WordHandleConfig
{
    public string WordPrerenderPath { get; set; } = "";
    public string WordRenderPath { get; set; } = "";
    public string BlobPath { get; set; } = "";
    public string MainProcessPathFolder { get; set; } = "";
    public string NoImagePath { get; set; } = "";
    public string LabelWordPath { get; set; } = "";
    public string LogoWordPath { get; set; } = "";
    public string TemplatePath { get; set; } = "";
    public string FooterContent { get; set; } = "";
    public List<WordObjectToHandle> WordObjectToHandle { get; set; } = new List<WordObjectToHandle>();
    public List<RenderData> RenderDataList { get; set; } = new List<RenderData>();
    public List<dynamic> SurveyOptions { get; set; } = new List<dynamic>();
    public List<dynamic> PicturesAttachments { get; set; } = new List<dynamic>();
    public List<dynamic> DataGridConfig { get; set; } = new List<dynamic>();
    public IDictionary<string, object> RiskGrading { get; set; } = new ExpandoObject();
}

public class RenderData
{
    public string Header { get; set; } = "";
    public string Indent { get; set; } = "562";
    public string OutlineLevel { get; set; } = "";
    public bool IsCheck { get; set; } = false;
    public List<dynamic> Data { get; set; } = new List<dynamic>();
    public List<DynamicOutline> DynamicData { get; set; } = new List<DynamicOutline>();
    public bool IsDynamic { get; set; } = false;
    public string DynamicKey { get; set; } = "";
    public JustificationValues Alignment { get; set; } = JustificationValues.Left;
}



//using WordprocessingDocument package = WordprocessingDocument.Create(stream, WordprocessingDocumentType.Document);

//MainDocumentPart mainPart = package.MainDocumentPart;
//if (mainPart == null)
//{
//    mainPart = package.AddMainDocumentPart();
//    new Document(new Body()).Save(mainPart);
//}

//mainPart.Document.Save();
////byte[] returnByteArray = new byte[] { };
////if (System.IO.File.Exists(filePath))
////{
////    byte[] byteArray = System.IO.File.ReadAllBytes(filePath);
////    stream.Write(byteArray, 0, (int)byteArray.Length);
////    using (WordprocessingDocument wordDoc = WordprocessingDocument.Open(stream, true))
////    {
////        wordDoc.MainDocumentPart.Document = new Document();
////        Body body = wordDoc.MainDocumentPart.Document.AppendChild(new Body());
////        Paragraph para = body.AppendChild(new Paragraph());
////        Run run = para.AppendChild(new Run());
////        run.AppendChild(new Text(ajaxData));
////        wordDoc.MainDocumentPart.Document.Save();
////    }
////    System.IO.File.WriteAllBytes(filePath, stream.ToArray());
////}
////else
////{
//    //using (WordprocessingDocument wordDocument = WordprocessingDocument.Create(filePath, WordprocessingDocumentType.Document))
//    using (WordprocessingDocument wordDocument = WordprocessingDocument.Create(stream, WordprocessingDocumentType.Document))
//    {
//        MainDocumentPart mainPart = wordDocument.AddMainDocumentPart();
//        mainPart.Document = new Document();
//        Body body = new Body();

//    // Thêm tiêu đề
//    Render.AddTitle(body, "UNDERWRITING SURVEY REPORT", "Arial", 16, JustificationValues.Center);
//    Render.AddTitle(body, surveyData.CompanyName, "Arial", 18, JustificationValues.Center, true);

//    // Thêm trường địa chỉ
//    Render.AddParagraph(body, $"Address: {surveyData.LocationAddress}", "Arial", 12);

//    //Thêm khung cho hình ảnh
//    //Render.AddImagePlaceholder(body);

//    // Thêm bảng thông tin
//    //Render.AddInformationTable(body);



//    mainPart.Document.Append(body);
//    }
////}