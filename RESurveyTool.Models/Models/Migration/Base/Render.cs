//using DocumentFormat.OpenXml.Wordprocessing;
//using DocumentFormat.OpenXml;
////using DocumentFormat.OpenXml.Drawing.Wordprocessing;
////using DocumentFormat.OpenXml.Drawing;

//namespace SurveyReportRE.Models.Migration.Base
//{
//    public static class Render
//    {
//        public static void SimpleExample()
//        {

//            //Paragraph paragraph = new Paragraph();
//            //Run run = new Run();

//            //Text text = new Text("Xin chào! Đây là nội dung đầu tiên trong file Word.");
//            //run.Append(text);
//            //paragraph.Append(run);
//            //body.Append(paragraph);
//        }
//        public static void AddTitle(Body body, string text, string fontName, int fontSize, JustificationValues justification, bool bold = false)
//        {
//            Paragraph paragraph = new Paragraph();
//            Run run = new Run();
//            RunProperties runProperties = new RunProperties();

//            runProperties.Append(new FontSize() { Val = (fontSize * 2).ToString() });
//            runProperties.Append(new RunFonts() { Ascii = fontName });
//            if (bold) runProperties.Append(new Bold());

//            run.Append(runProperties);
//            run.Append(new Text(text));
//            paragraph.Append(new ParagraphProperties(new Justification() { Val = justification }));
//            paragraph.Append(run);
//            body.Append(paragraph);
//        }

//        public static void AddParagraph(Body body, string text, string fontName, int fontSize)
//        {
//            Paragraph paragraph = new Paragraph(new Run(new Text(text)));
//            RunProperties runProperties = new RunProperties();
//            runProperties.Append(new FontSize() { Val = (fontSize * 2).ToString() });
//            runProperties.Append(new RunFonts() { Ascii = fontName });
//            paragraph.GetFirstChild<Run>().PrependChild(runProperties);
//            body.Append(paragraph);
//        }

//        public static void AddImagePlaceholder(Body body)
//        {
//            Paragraph imageParagraph = new Paragraph();
//            Run run = new Run();
//            Drawing drawing = new Drawing(
//                //new Inline(
//                //    new Extent() { Cx = 4000000, Cy = 2000000 }, // Kích thước khung ảnh
//                //    new DocProperties() { Id = 1, Name = "Placeholder Image" },
//                //    new Graphic(
//                //        new GraphicData(
//                //            new DocumentFormat.OpenXml.Drawing.Pictures.Picture(
//                //                new DocumentFormat.OpenXml.Drawing.Pictures.NonVisualPictureProperties(
//                //                    new DocumentFormat.OpenXml.Drawing.Pictures.NonVisualDrawingProperties() { Id = 0, Name = "Image" }),
//                //                new DocumentFormat.OpenXml.Drawing.Pictures.BlipFill(),
//                //                new DocumentFormat.OpenXml.Drawing.Pictures.ShapeProperties()
//                //            )
//                //        )
//                //        { Uri = "http://schemas.openxmlformats.org/drawingml/2006/picture" }
//                //    )
//                //)
//            );
//            run.Append(drawing);
//            imageParagraph.Append(run);
//            body.Append(imageParagraph);
//        }

//        public static void AddInformationTable(Body body)
//        {
//            Table table = new Table();
//            table.Append(new TableProperties(new TableBorders(
//                new TopBorder { Val = new EnumValue<BorderValues>(BorderValues.Single), Size = 4 },
//                new BottomBorder { Val = new EnumValue<BorderValues>(BorderValues.Single), Size = 4 },
//                new LeftBorder { Val = new EnumValue<BorderValues>(BorderValues.Single), Size = 4 },
//                new RightBorder { Val = new EnumValue<BorderValues>(BorderValues.Single), Size = 4 },
//                new InsideHorizontalBorder { Val = new EnumValue<BorderValues>(BorderValues.Single), Size = 4 },
//                new InsideVerticalBorder { Val = new EnumValue<BorderValues>(BorderValues.Single), Size = 4 }
//            )));

//            // Thêm các dòng trong bảng
//            AddTableRow(table, "Date of Visit:", "");
//            AddTableRow(table, "Latitude/ Longitude:", "");
//            AddTableRow(table, "Conferred With:", "XXX Co., Ltd.\nMr./Mrs/Ms.");
//            AddTableRow(table, "General Manager", "");
//            AddTableRow(table, "Accompanied By:", "Tokio Marine Insurance Vietnam Company Limited");
//            AddTableRow(table, "Surveyed By:", "Tokio Marine Insurance Vietnam Company Limited\nChoose an item. | Choose a position");

//            body.Append(table);
//        }

//        public static void AddTableRow(Table table, string cell1Text, string cell2Text)
//        {
//            TableRow tr = new TableRow();
//            TableCell cell1 = new TableCell(new Paragraph(new Run(new Text(cell1Text))));
//            TableCell cell2 = new TableCell(new Paragraph(new Run(new Text(cell2Text))));

//            tr.Append(cell1);
//            tr.Append(cell2);
//            table.Append(tr);
//        }
//    }
//}
