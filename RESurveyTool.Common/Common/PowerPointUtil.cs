//using System;
//using System.IO;
//using System.Linq;
//using DocumentFormat.OpenXml;
//using DocumentFormat.OpenXml.Packaging;
//using P = DocumentFormat.OpenXml.Presentation;
//using A = DocumentFormat.OpenXml.Drawing;
//using C = DocumentFormat.OpenXml.Drawing.Charts;
//using X = DocumentFormat.OpenXml.Spreadsheet;

//class Program
//{
//    static void Main()
//    {
//        string output = "D:\\demo.pptx";
//        string imagePath = "D:\\thumbnail_image003.png"; // đổi sang đường dẫn ảnh của bạn

//        if (File.Exists(output)) File.Delete(output);

//        using (var presDoc = PresentationDocument.Create(output, PresentationDocumentType.Presentation))
//        {
//            // 1) Khởi tạo Presentation
//            var presPart = presDoc.AddPresentationPart();
//            presPart.Presentation = new P.Presentation();

//            // SlideMaster & SlideLayout
//            var slideMasterPart = presPart.AddNewPart<SlideMasterPart>();
//            slideMasterPart.SlideMaster = BuildSimpleSlideMaster();
//            var titleLayout = slideMasterPart.AddNewPart<SlideLayoutPart>("rTitleLayout");
//            titleLayout.SlideLayout = BuildTitleSlideLayout();
//            var contentLayout = slideMasterPart.AddNewPart<SlideLayoutPart>("rContentLayout");
//            contentLayout.SlideLayout = BuildTitleAndContentLayout();

//            // Liên kết layout vào master
//            slideMasterPart.SlideMaster.SlideLayoutIdList = new P.SlideLayoutIdList(
//                new P.SlideLayoutId() { Id = 1U, RelationshipId = slideMasterPart.GetIdOfPart(titleLayout) },
//                new P.SlideLayoutId() { Id = 2U, RelationshipId = slideMasterPart.GetIdOfPart(contentLayout) }
//            );

//            // Thêm SlideIdList vào Presentation
//            presPart.Presentation.SlideIdList = new P.SlideIdList();

//            // 2) Thêm slide tiêu đề
//            var s1 = AddSlideFromLayout(presPart, titleLayout);
//            SetTitleText(s1, "Open XML PowerPoint");
//            SetSubtitleText(s1, "Tạo PPTX thuần .NET: slide, ảnh, chart, reorder");

//            // 3) Thêm slide nội dung + chèn ảnh
//            var s2 = AddSlideFromLayout(presPart, contentLayout);
//            SetTitleText(s2, "Chèn hình ảnh");
//            InsertPicture(s2, imagePath, leftEmu: 1_000_000L, topEmu: 1_500_000L, widthEmu: 4_000_000L, heightEmu: 3_000_000L);

//            // 4) Thêm slide biểu đồ cột
//            var s3 = AddSlideFromLayout(presPart, contentLayout);
//            SetTitleText(s3, "Biểu đồ cột (nhúng Excel)");
//            AddColumnChart(s3,
//                categories: new[] { "Q1", "Q2", "Q3", "Q4" },
//                seriesName: "Doanh thu",
//                values: new double[] { 12.5, 18.2, 15.0, 22.3 },
//                leftEmu: 1_000_000L, topEmu: 1_500_000L, widthEmu: 6_000_000L, heightEmu: 3_500_000L);

//            // 5) Đổi vị trí slide: đưa slide thứ 3 lên vị trí 2 (index 0-based)
//            MoveSlide(presPart, fromIndex: 2, toIndex: 1);

//            // ViewProperties tùy chọn
//            //presPart.Presentation.ViewProperties = new P.ViewProperties(new P.NormalViewProperties());

//            presPart.Presentation.Save();
//        }

//        Console.WriteLine($"Đã tạo: {Path.GetFullPath(output)}");
//    }

//    // ======= BUILD MASTER / LAYOUT TỐI GIẢN =======

//    static P.SlideMaster BuildSimpleSlideMaster()
//    {
//        return new P.SlideMaster(
//            new P.CommonSlideData(new P.ShapeTree(
//                new P.NonVisualGroupShapeProperties(
//                    new P.NonVisualDrawingProperties() { Id = 1U, Name = "" },
//                    new P.NonVisualGroupShapeDrawingProperties(),
//                    new P.ApplicationNonVisualDrawingProperties()
//                ),
//                new P.GroupShapeProperties(new A.TransformGroup()),
//                // Background placeholder
//                new P.Shape(
//                    new P.NonVisualShapeProperties(
//                        new P.NonVisualDrawingProperties() { Id = 2U, Name = "Title Placeholder" },
//                        new P.NonVisualShapeDrawingProperties(new A.ShapeLocks() { NoGrouping = true }),
//                        new P.ApplicationNonVisualDrawingProperties(new P.PlaceholderShape() { Type = P.PlaceholderValues.Title })
//                    ),
//                    new P.ShapeProperties(),
//                    new P.TextBody(
//                        new A.BodyProperties(),
//                        new A.ListStyle(),
//                        new A.Paragraph(new A.EndParagraphRunProperties() { Language = "en-US" })
//                    )
//                )
//            )),
//            new P.ColorMap() { Background1 = A.ColorSchemeIndexValues.Light1, Text1 = A.ColorSchemeIndexValues.Dark1, Background2 = A.ColorSchemeIndexValues.Light2, Text2 = A.ColorSchemeIndexValues.Dark2, Accent1 = A.ColorSchemeIndexValues.Accent1, Accent2 = A.ColorSchemeIndexValues.Accent2, Accent3 = A.ColorSchemeIndexValues.Accent3, Accent4 = A.ColorSchemeIndexValues.Accent4, Accent5 = A.ColorSchemeIndexValues.Accent5, Accent6 = A.ColorSchemeIndexValues.Accent6, Hyperlink = A.ColorSchemeIndexValues.Hyperlink, FollowedHyperlink = A.ColorSchemeIndexValues.FollowedHyperlink }
//        );
//    }

//    static P.SlideLayout BuildTitleSlideLayout()
//    {
//        // Layout có Title + Subtitle
//        return new P.SlideLayout(
//            new P.CommonSlideData(new P.ShapeTree(
//                new P.NonVisualGroupShapeProperties(
//                    new P.NonVisualDrawingProperties() { Id = 1U, Name = "" },
//                    new P.NonVisualGroupShapeDrawingProperties(),
//                    new P.ApplicationNonVisualDrawingProperties()
//                ),
//                new P.GroupShapeProperties(new A.TransformGroup()),
//                TitlePlaceholderShape(2U, "Title 1", P.PlaceholderValues.Title),
//                TitlePlaceholderShape(3U, "Subtitle 2", P.PlaceholderValues.SubTitle)
//            )),
//            new P.ColorMapOverride(new A.MasterColorMapping())
//        );
//    }

//    static P.SlideLayout BuildTitleAndContentLayout()
//    {
//        // Layout có Title + Content
//        return new P.SlideLayout(
//            new P.CommonSlideData(new P.ShapeTree(
//                new P.NonVisualGroupShapeProperties(
//                    new P.NonVisualDrawingProperties() { Id = 1U, Name = "" },
//                    new P.NonVisualGroupShapeDrawingProperties(),
//                    new P.ApplicationNonVisualDrawingProperties()
//                ),
//                new P.GroupShapeProperties(new A.TransformGroup()),
//                TitlePlaceholderShape(2U, "Title 1", P.PlaceholderValues.Title),
//                BodyPlaceholderShape(3U, "Content Placeholder 2")
//            )),
//            new P.ColorMapOverride(new A.MasterColorMapping())
//        );
//    }

//    static P.Shape TitlePlaceholderShape(uint id, string name, P.PlaceholderValues type)
//    {
//        return new P.Shape(
//            new P.NonVisualShapeProperties(
//                new P.NonVisualDrawingProperties() { Id = id, Name = name },
//                new P.NonVisualShapeDrawingProperties(new A.ShapeLocks() { NoGrouping = true }),
//                new P.ApplicationNonVisualDrawingProperties(new P.PlaceholderShape() { Type = type })
//            ),
//            new P.ShapeProperties(),
//            new P.TextBody(
//                new A.BodyProperties(),
//                new A.ListStyle(),
//                new A.Paragraph(new A.Run(new A.Text("")))
//            )
//        );
//    }

//    static P.Shape BodyPlaceholderShape(uint id, string name)
//    {
//        return new P.Shape(
//            new P.NonVisualShapeProperties(
//                new P.NonVisualDrawingProperties() { Id = id, Name = name },
//                new P.NonVisualShapeDrawingProperties(new A.ShapeLocks() { NoGrouping = true }),
//                new P.ApplicationNonVisualDrawingProperties(new P.PlaceholderShape() { Index = 1 })
//            ),
//            new P.ShapeProperties(),
//            new P.TextBody(
//                new A.BodyProperties(),
//                new A.ListStyle(),
//                new A.Paragraph(new A.Run(new A.Text("Nội dung...")))
//            )
//        );
//    }

//    // ======= THÊM SLIDE TỪ LAYOUT =======

//    static SlidePart AddSlideFromLayout(PresentationPart presPart, SlideLayoutPart layoutPart)
//    {
//        var slidePart = presPart.AddNewPart<SlidePart>();
//        slidePart.Slide = new P.Slide(
//            new P.CommonSlideData(new P.ShapeTree(
//                new P.NonVisualGroupShapeProperties(
//                    new P.NonVisualDrawingProperties() { Id = 1U, Name = "" },
//                    new P.NonVisualGroupShapeDrawingProperties(),
//                    new P.ApplicationNonVisualDrawingProperties()
//                ),
//                new P.GroupShapeProperties(new A.TransformGroup())
//            )),
//            new P.ColorMapOverride(new A.MasterColorMapping())
//        );

//        slidePart.AddPart(layoutPart);

//        // Thêm vào SlideIdList (thường dùng id tăng dần)
//        var slideIdList = presPart.Presentation.SlideIdList;
//        uint maxId = slideIdList.ChildElements.OfType<P.SlideId>().Select(s => s.Id?.Value ?? 0U).DefaultIfEmpty(255U).Max();
//        uint nextId = maxId + 1;

//        var relId = presPart.GetIdOfPart(slidePart);
//        slideIdList.Append(new P.SlideId() { Id = nextId, RelationshipId = relId });
//        return slidePart;
//    }

//    // ======= SET TEXT CHO TITLE / SUBTITLE =======

//    static void SetTitleText(SlidePart slidePart, string text)
//    {
//        var shapes = slidePart.Slide.Descendants<P.Shape>()
//            .Where(s => s.NonVisualShapeProperties?.ApplicationNonVisualDrawingProperties?.PlaceholderShape?.Type?.Value == P.PlaceholderValues.Title);

//        foreach (var shape in shapes)
//        {
//            var tb = shape.TextBody ?? shape.AppendChild(new P.TextBody(new A.BodyProperties(), new A.ListStyle()));
//            tb.RemoveAllChildren<A.Paragraph>();
//            tb.AppendChild(new A.Paragraph(new A.Run(new A.Text(text))));
//        }
//    }

//    static void SetSubtitleText(SlidePart slidePart, string text)
//    {
//        var shapes = slidePart.Slide.Descendants<P.Shape>()
//            .Where(s => s.NonVisualShapeProperties?.ApplicationNonVisualDrawingProperties?.PlaceholderShape?.Type?.Value == P.PlaceholderValues.SubTitle);

//        foreach (var shape in shapes)
//        {
//            var tb = shape.TextBody ?? shape.AppendChild(new P.TextBody(new A.BodyProperties(), new A.ListStyle()));
//            tb.RemoveAllChildren<A.Paragraph>();
//            tb.AppendChild(new A.Paragraph(new A.Run(new A.Text(text))));
//        }
//    }

//    // ======= CHÈN ẢNH =======

//    static void InsertPicture(SlidePart slidePart, string imagePath, long leftEmu, long topEmu, long widthEmu, long heightEmu)
//    {
//        if (!File.Exists(imagePath)) throw new FileNotFoundException(imagePath);

//        var imagePart = slidePart.AddImagePart(ImagePartType.Jpeg);
//        using (var stream = File.OpenRead(imagePath))
//            imagePart.FeedData(stream);

//        string relId = slidePart.GetIdOfPart(imagePart);

//        var tree = slidePart.Slide.CommonSlideData.ShapeTree;

//        var picId = (uint)(tree.Descendants<P.Picture>().Select(p => p.NonVisualPictureProperties.NonVisualDrawingProperties.Id.Value).DefaultIfEmpty(4U).Max() + 1);

//        var picture = new P.Picture(
//            new P.NonVisualPictureProperties(
//                new P.NonVisualDrawingProperties() { Id = picId, Name = Path.GetFileName(imagePath) },
//                new P.NonVisualPictureDrawingProperties(new A.PictureLocks() { NoChangeAspect = true }),
//                new P.ApplicationNonVisualDrawingProperties()
//            ),
//            new P.BlipFill(
//                new A.Blip() { Embed = relId },
//                new A.Stretch(new A.FillRectangle())
//            ),
//            new P.ShapeProperties(
//                new A.Transform2D(
//                    new A.Offset() { X = leftEmu, Y = topEmu },
//                    new A.Extents() { Cx = widthEmu, Cy = heightEmu }
//                ),
//                new A.PresetGeometry(new A.AdjustValueList()) { Preset = A.ShapeTypeValues.Rectangle }
//            )
//        );

//        tree.Append(picture);
//        slidePart.Slide.Save();
//    }

//    // ======= THÊM BIỂU ĐỒ CỘT (NHÚNG EXCEL) =======

//    static void AddColumnChart(SlidePart slidePart, string[] categories, string seriesName, double[] values,
//        long leftEmu, long topEmu, long widthEmu, long heightEmu)
//    {
//        // 1) Tạo chart part
//        var chartPart = slidePart.AddNewPart<ChartPart>();
//        chartPart.ChartSpace = new C.ChartSpace(new C.EditingLanguage() { Val = "en-US" });
//        chartPart.ChartSpace.Append(new C.RoundedCorners() { Val = false });

//        // 2) Nhúng workbook Excel đơn giản
//        var wbPart = chartPart.AddNewPart<EmbeddedPackagePart>("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
//        using (var ms = new MemoryStream())
//        {
//            BuildWorkbookBytes(ms, categories, seriesName, values);
//            ms.Position = 0;
//            wbPart.FeedData(ms);
//        }

//        string wbRelId = chartPart.GetIdOfPart(wbPart);

//        // 3) Xây chart (dùng tham chiếu tới workbook)
//        var chart = new C.Chart(
//            new C.Title(new C.ChartText(new C.RichText(
//                new A.BodyProperties(),
//                new A.ListStyle(),
//                new A.Paragraph(new A.Run(new A.Text(seriesName)))
//            ))),
//            new C.PlotArea(
//                new C.Layout(),
//                new C.BarChart(
//                    new C.BarDirection() { Val = C.BarDirectionValues.Column },
//                    new C.BarGrouping() { Val = C.BarGroupingValues.Clustered },
//                    BuildSeries(categories, seriesName, values, wbRelId),
//                    new C.AxisId() { Val = 48650112U },
//                    new C.AxisId() { Val = 48672768U }
//                ),
//                BuildCategoryAxis(48650112U),
//                BuildValueAxis(48672768U)
//            ),
//            new C.Legend(new C.LegendPosition() { Val = C.LegendPositionValues.Bottom })
//        );

//        chartPart.ChartSpace.Append(chart);
//        chartPart.ChartSpace.Save();

//        // 4) Đặt chart lên slide (GraphicFrame)
//        var relId = slidePart.GetIdOfPart(chartPart);

//        var graphicFrame = new P.GraphicFrame(
//            new P.NonVisualGraphicFrameProperties(
//                new P.NonVisualDrawingProperties() { Id = 100U, Name = "Chart 1" },
//                new P.NonVisualGraphicFrameDrawingProperties(),
//                new P.ApplicationNonVisualDrawingProperties()
//            ),
//            new P.Transform(new A.Offset() { X = leftEmu, Y = topEmu }, new A.Extents() { Cx = widthEmu, Cy = heightEmu }),
//            new A.Graphic(new A.GraphicData(
//                new C.ChartReference() { Id = relId }
//            )
//            { Uri = "http://schemas.openxmlformats.org/drawingml/2006/chart" })
//        );

//        slidePart.Slide.CommonSlideData.ShapeTree.AppendChild(graphicFrame);
//        slidePart.Slide.Save();
//    }

//    static C.SeriesText BuildSeriesText(string name)
//    {
//        return new C.SeriesText(new C.StringReference(
//            new C.StringCache(
//                new C.PointCount() { Val = 1U },
//                new C.StringPoint() { Index = 0U, NumericValue = new C.NumericValue(name) }
//            )
//        ));
//    }

//    static OpenXmlElement BuildSeries(string[] categories, string seriesName, double[] values, string wbRelId)
//    {
//        // Chúng ta vừa cung cấp cached data vừa cung cấp DataReference tới workbook nhúng
//        var numCache = new C.NumberingCache(new C.FormatCode("General"), new C.PointCount() { Val = (uint)values.Length });
//        for (uint i = 0; i < values.Length; i++)
//        {
//            numCache.Append(new C.NumericPoint() { Index = i, NumericValue = new C.NumericValue(values[i].ToString(System.Globalization.CultureInfo.InvariantCulture)) });
//        }

//        var strCache = new C.StringCache(new C.PointCount() { Val = (uint)categories.Length });
//        for (uint i = 0; i < categories.Length; i++)
//        {
//            strCache.Append(new C.StringPoint() { Index = i, NumericValue = new C.NumericValue(categories[i]) });
//        }

//        // Giả sử dữ liệu nằm ở Sheet1!A2:A(n+1) (categories) và B2:B(n+1) (values)
//        string catRef = "Sheet1!$A$2:$A$" + (categories.Length + 1);
//        string valRef = "Sheet1!$B$2:$B$" + (values.Length + 1);

//        var ser = new C.BarChartSeries(
//            new C.Index() { Val = 0U },
//            new C.Order() { Val = 0U },
//            new C.SeriesText(new C.StringLiteral(
//                new C.PointCount() { Val = 1U },
//                new C.StringPoint() { Index = 0U, NumericValue = new C.NumericValue(seriesName) }
//            )),
//            new C.CategoryAxisData(
//                new C.StringReference(
//                    new C.Formula(catRef),
//                    strCache
//                )
//            ),
//            new C.Values(
//                new C.NumberReference(
//                    new C.Formula(valRef),
//                    numCache
//                )
//            )
//        );

//        return ser;
//    }

//    static C.CategoryAxis BuildCategoryAxis(uint id)
//    {
//        return new C.CategoryAxis(
//            new C.AxisId() { Val = id },
//            new C.Scaling(new C.Orientation() { Val = C.OrientationValues.MinMax }),
//            new C.AxisPosition() { Val = C.AxisPositionValues.Bottom },
//            new C.TickLabelPosition() { Val = C.TickLabelPositionValues.NextTo },
//            new C.CrossingAxis() { Val = 48672768U },
//            new C.Crosses() { Val = C.CrossesValues.AutoZero },
//            new C.AutoLabeled() { Val = true },
//            new C.LabelAlignment() { Val = C.LabelAlignmentValues.Center },
//            new C.LabelOffset() { Val = 100 }
//        );
//    }

//    static C.ValueAxis BuildValueAxis(uint id)
//    {
//        return new C.ValueAxis(
//            new C.AxisId() { Val = id },
//            new C.Scaling(new C.Orientation() { Val = C.OrientationValues.MinMax }),
//            new C.AxisPosition() { Val = C.AxisPositionValues.Left },
//            new C.MajorGridlines(),
//            new C.NumberingFormat() { FormatCode = "General", SourceLinked = true },
//            new C.TickLabelPosition() { Val = C.TickLabelPositionValues.NextTo },
//            new C.CrossingAxis() { Val = 48650112U },
//            new C.Crosses() { Val = C.CrossesValues.AutoZero },
//            new C.CrossBetween() { Val = C.CrossBetweenValues.Between }
//        );
//    }

//    static void BuildWorkbookBytes(Stream output, string[] categories, string seriesName, double[] values)
//    {
//        using (var doc = SpreadsheetDocument.Create(output, DocumentFormat.OpenXml.SpreadsheetDocumentType.Workbook, true))
//        {
//            var wbPart = doc.AddWorkbookPart();
//            wbPart.Workbook = new X.Workbook();

//            var wsPart = wbPart.AddNewPart<WorksheetPart>();
//            var sheetData = new X.SheetData();

//            // Header
//            var row1 = new X.Row() { RowIndex = 1U };
//            row1.Append(
//                Cell("Category"),
//                Cell(seriesName, isNumber: false)
//            );
//            sheetData.Append(row1);

//            // Data
//            for (int i = 0; i < categories.Length; i++)
//            {
//                var r = new X.Row() { RowIndex = (uint)(i + 2) };
//                r.Append(Cell(categories[i], isNumber: false), Cell(values[i].ToString(System.Globalization.CultureInfo.InvariantCulture), isNumber: true));
//                sheetData.Append(r);
//            }

//            wsPart.Worksheet = new X.Worksheet(sheetData);
//            wsPart.Worksheet.Save();

//            // Sheets
//            var sheets = new X.Sheets();
//            var sheet = new X.Sheet() { Id = wbPart.GetIdOfPart(wsPart), SheetId = 1U, Name = "Sheet1" };
//            sheets.Append(sheet);

//            wbPart.Workbook.Append(sheets);
//            wbPart.Workbook.Save();
//        }
//    }

//    static X.Cell Cell(string value, bool isNumber = false)
//    {
//        if (isNumber)
//            return new X.Cell() { CellValue = new X.CellValue(value), DataType = X.CellValues.Number };
//        return new X.Cell() { CellValue = new X.CellValue(value), DataType = X.CellValues.String };
//    }

//    // ======= ĐỔI VỊ TRÍ SLIDE =======

//    static void MoveSlide(PresentationPart presPart, int fromIndex, int toIndex)
//    {
//        var sldIdList = presPart.Presentation.SlideIdList;
//        var ids = sldIdList.ChildElements.OfType<P.SlideId>().ToList();

//        if (fromIndex < 0 || fromIndex >= ids.Count || toIndex < 0 || toIndex >= ids.Count) return;

//        var item = ids[fromIndex];
//        ids.RemoveAt(fromIndex);
//        ids.Insert(toIndex, item);

//        sldIdList.RemoveAllChildren();
//        foreach (var it in ids) sldIdList.Append(it);
//        presPart.Presentation.Save();
//    }
//}
//using System;
//using System.IO;
//using System.Linq;
//using DocumentFormat.OpenXml;
//using DocumentFormat.OpenXml.Packaging;
//using P = DocumentFormat.OpenXml.Presentation;
//using A = DocumentFormat.OpenXml.Drawing;
//using C = DocumentFormat.OpenXml.Drawing.Charts;
//using X = DocumentFormat.OpenXml.Spreadsheet;

//class Program
//{
//    static void Main()
//    {
//        string input = "D:\\demo.pptx";    // file có sẵn
//        string output = "D:\\output.pptx";     // file tạo mới để chỉnh
//        //string imagePath = "sample.jpg";   // ảnh để chèn

//        if (!File.Exists(input))
//        {
//            Console.WriteLine("Không tìm thấy template.pptx.");
//            return;
//        }
//        File.Copy(input, output, overwrite: true);

//        using (var doc = PresentationDocument.Open(output, true))
//        {
//            var presPart = doc.PresentationPart ?? throw new InvalidOperationException("Thiếu PresentationPart");

//            // 1) Sửa text slide đầu tiên (nếu có title)
//            var firstSlidePart = GetSlidePartAt(presPart, 0);
//            if (firstSlidePart != null)
//            {
//                SetTitleText(firstSlidePart, "Tiêu đề đã chỉnh bằng Open XML");
//                SetSubtitleText(firstSlidePart, "Đây là phụ đề cập nhật");
//            }

//            // 2) Chèn ảnh vào slide 1
//            //if (firstSlidePart != null && File.Exists(imagePath))
//            //{
//            //    InsertPicture(firstSlidePart, imagePath,
//            //        leftEmu: 1_000_000L, topEmu: 1_500_000L,
//            //        widthEmu: 4_000_000L, heightEmu: 3_000_000L);
//            //}

//            //// 3) Thêm 1 slide mới dựa trên layout Title+Content (nếu tìm được)
//            //var contentLayout = FindTitleContentLayout(presPart);
//            //SlidePart newSlide = null;
//            //if (contentLayout != null)
//            //{
//            //    newSlide = AddSlideFromLayout(presPart, contentLayout);
//            //    SetTitleText(newSlide, "Slide biểu đồ");
//            //    // 4) Chèn biểu đồ cột + workbook nhúng
//            //    AddColumnChart(newSlide,
//            //        categories: new[] { "Q1", "Q2", "Q3", "Q4" },
//            //        seriesName: "Doanh thu",
//            //        values: new double[] { 10.2, 13.5, 12.0, 17.8 },
//            //        leftEmu: 1_000_000L, topEmu: 1_500_000L,
//            //        widthEmu: 6_000_000L, heightEmu: 3_500_000L);
//            //}

//            // 5) Đổi vị trí slide: đưa slide mới (cuối danh sách) lên vị trí 2 (index 1)
//            //if (newSlide != null)
//            //{
//            //    int lastIndex = GetSlideCount(presPart) - 1;
//            //    MoveSlide(presPart, fromIndex: lastIndex, toIndex: 1);
//            //}

//            presPart.Presentation.Save();
//        }

//        Console.WriteLine($"Đã xử lý xong: {Path.GetFullPath(output)}");
//    }

//    // ======= TRỢ GIÚP: LẤY SLIDEPART THEO INDEX =======
//    static SlidePart GetSlidePartAt(PresentationPart presPart, int index)
//    {
//        var sldIds = presPart.Presentation.SlideIdList?.Elements<P.SlideId>().ToList();
//        if (sldIds == null || index < 0 || index >= sldIds.Count) return null;
//        string relId = sldIds[index].RelationshipId;
//        return (SlidePart)presPart.GetPartById(relId);
//    }

//    static int GetSlideCount(PresentationPart presPart)
//        => presPart.Presentation.SlideIdList?.Elements<P.SlideId>().Count() ?? 0;

//    // ======= TÌM SLIDE LAYOUT KIỂU TITLE + CONTENT =======
//    //static SlideLayoutPart FindTitleContentLayout(PresentationPart presPart)
//    //{
//    //    // Ưu tiên layout có cả placeholder Title và Body
//    //    foreach (var sm in presPart.SlideMasterParts)
//    //    {
//    //        foreach (var layout in sm.SlideLayoutParts)
//    //        {
//    //            var shapes = layout.Slide?.CommonSlideData?.ShapeTree?.Elements<P.Shape>();
//    //            if (shapes == null) continue;

//    //            bool hasTitle = shapes.Any(s =>
//    //                s.NonVisualShapeProperties?.ApplicationNonVisualDrawingProperties?.PlaceholderShape?.Type?.Value
//    //                == P.PlaceholderValues.Title);

//    //            bool hasBody = shapes.Any(s =>
//    //                s.NonVisualShapeProperties?.ApplicationNonVisualDrawingProperties?.PlaceholderShape != null &&
//    //                s.NonVisualShapeProperties.ApplicationNonVisualDrawingProperties.PlaceholderShape.Type == null // body thường không set Type
//    //            );

//    //            if (hasTitle && hasBody) return layout;
//    //        }
//    //    }

//    //    // fallback: lấy layout đầu tiên
//    //    return presPart.SlideMasterParts.SelectMany(m => m.SlideLayoutParts).FirstOrDefault();
//    //}

//    // ======= THÊM SLIDE TỪ LAYOUT SẴN =======
//    static SlidePart AddSlideFromLayout(PresentationPart presPart, SlideLayoutPart layoutPart)
//    {
//        var slidePart = presPart.AddNewPart<SlidePart>();
//        slidePart.Slide = new P.Slide(
//            new P.CommonSlideData(new P.ShapeTree(
//                new P.NonVisualGroupShapeProperties(
//                    new P.NonVisualDrawingProperties() { Id = 1U, Name = "" },
//                    new P.NonVisualGroupShapeDrawingProperties(),
//                    new P.ApplicationNonVisualDrawingProperties()
//                ),
//                new P.GroupShapeProperties(new A.TransformGroup())
//            )),
//            new P.ColorMapOverride(new A.MasterColorMapping())
//        );

//        slidePart.AddPart(layoutPart);

//        var slideIdList = presPart.Presentation.SlideIdList ??= new P.SlideIdList();
//        uint maxId = slideIdList.ChildElements.OfType<P.SlideId>()
//                        .Select(s => s.Id?.Value ?? 255U)
//                        .DefaultIfEmpty(255U).Max();
//        uint nextId = maxId + 1;

//        var relId = presPart.GetIdOfPart(slidePart);
//        slideIdList.Append(new P.SlideId() { Id = nextId, RelationshipId = relId });

//        return slidePart;
//    }

//    // ======= SỬA TEXT TITLE / SUBTITLE =======
//    static void SetTitleText(SlidePart slidePart, string text)
//    {
//        var shapes = slidePart.Slide.Descendants<P.Shape>()
//            .Where(s => s.NonVisualShapeProperties?.ApplicationNonVisualDrawingProperties?.PlaceholderShape?.Type?.Value
//                        == P.PlaceholderValues.Title);

//        foreach (var shape in shapes)
//        {
//            var tb = shape.TextBody ?? shape.AppendChild(new P.TextBody(new A.BodyProperties(), new A.ListStyle()));
//            tb.RemoveAllChildren<A.Paragraph>();
//            tb.AppendChild(new A.Paragraph(new A.Run(new A.Text(text))));
//        }
//        slidePart.Slide.Save();
//    }

//    static void SetSubtitleText(SlidePart slidePart, string text)
//    {
//        var shapes = slidePart.Slide.Descendants<P.Shape>()
//            .Where(s => s.NonVisualShapeProperties?.ApplicationNonVisualDrawingProperties?.PlaceholderShape?.Type?.Value
//                        == P.PlaceholderValues.SubTitle);

//        foreach (var shape in shapes)
//        {
//            var tb = shape.TextBody ?? shape.AppendChild(new P.TextBody(new A.BodyProperties(), new A.ListStyle()));
//            tb.RemoveAllChildren<A.Paragraph>();
//            tb.AppendChild(new A.Paragraph(new A.Run(new A.Text(text))));
//        }
//        slidePart.Slide.Save();
//    }

//    //// ======= CHÈN ẢNH =======
//    //static void InsertPicture(SlidePart slidePart, string imagePath, long leftEmu, long topEmu, long widthEmu, long heightEmu)
//    //{
//    //    var imageType = GuessImageType(imagePath);
//    //    var imagePart = slidePart.AddImagePart(imageType);
//    //    using (var fs = File.OpenRead(imagePath)) imagePart.FeedData(fs);

//    //    string relId = slidePart.GetIdOfPart(imagePart);
//    //    var tree = slidePart.Slide.CommonSlideData.ShapeTree;

//    //    uint nextId = NextDrawingId(tree);

//    //    var pic = new P.Picture(
//    //        new P.NonVisualPictureProperties(
//    //            new P.NonVisualDrawingProperties() { Id = nextId, Name = Path.GetFileName(imagePath) },
//    //            new P.NonVisualPictureDrawingProperties(new A.PictureLocks() { NoChangeAspect = true }),
//    //            new P.ApplicationNonVisualDrawingProperties()
//    //        ),
//    //        new P.BlipFill(
//    //            new A.Blip() { Embed = relId },
//    //            new A.Stretch(new A.FillRectangle())
//    //        ),
//    //        new P.ShapeProperties(
//    //            new A.Transform2D(
//    //                new A.Offset() { X = leftEmu, Y = topEmu },
//    //                new A.Extents() { Cx = widthEmu, Cy = heightEmu }
//    //            ),
//    //            new A.PresetGeometry(new A.AdjustValueList()) { Preset = A.ShapeTypeValues.Rectangle }
//    //        )
//    //    );

//    //    tree.Append(pic);
//    //    slidePart.Slide.Save();
//    //}

//    //static ImagePartType GuessImageType(string path)
//    //{
//    //    var ext = Path.GetExtension(path).ToLowerInvariant();
//    //    return ext switch
//    //    {
//    //        ".png" => ImagePartType.Png,
//    //        ".bmp" => ImagePartType.Bmp,
//    //        ".gif" => ImagePartType.Gif,
//    //        ".tiff" => ImagePartType.Tiff,
//    //        ".svg" => ImagePartType.Svg,
//    //        _ => ImagePartType.Jpeg
//    //    };
//    //}

//    static uint NextDrawingId(P.ShapeTree tree)
//    {
//        var allIds = tree.Elements<OpenXmlCompositeElement>()
//            .Select(e =>
//            {
//                uint? id = e.Descendants<P.NonVisualDrawingProperties>()
//                            .FirstOrDefault()?.Id?.Value;
//                return id ?? 0U;
//            })
//            .DefaultIfEmpty(3U);
//        return allIds.Max() + 1;
//    }

//    // ======= BIỂU ĐỒ CỘT + WORKBOOK NHÚNG =======
//    static void AddColumnChart(SlidePart slidePart, string[] categories, string seriesName, double[] values,
//        long leftEmu, long topEmu, long widthEmu, long heightEmu)
//    {
//        var chartPart = slidePart.AddNewPart<ChartPart>();
//        chartPart.ChartSpace = new C.ChartSpace(new C.EditingLanguage() { Val = "en-US" });
//        chartPart.ChartSpace.Append(new C.RoundedCorners() { Val = false });

//        // Workbook nhúng
//        var wbPart = chartPart.AddNewPart<EmbeddedPackagePart>("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
//        using (var ms = new MemoryStream())
//        {
//            BuildWorkbookBytes(ms, categories, seriesName, values);
//            ms.Position = 0;
//            wbPart.FeedData(ms);
//        }
//        string wbRelId = chartPart.GetIdOfPart(wbPart);

//        // Dữ liệu series + cache
//        var ser = BuildSeries(categories, seriesName, values);

//        var chart = new C.Chart(
//            new C.Title(new C.ChartText(new C.RichText(
//                new A.BodyProperties(),
//                new A.ListStyle(),
//                new A.Paragraph(new A.Run(new A.Text(seriesName)))
//            ))),
//            new C.PlotArea(
//                new C.Layout(),
//                new C.BarChart(
//                    new C.BarDirection() { Val = C.BarDirectionValues.Column },
//                    new C.BarGrouping() { Val = C.BarGroupingValues.Clustered },
//                    ser,
//                    new C.AxisId() { Val = 48650112U },
//                    new C.AxisId() { Val = 48672768U }
//                ),
//                BuildCategoryAxis(48650112U),
//                BuildValueAxis(48672768U)
//            ),
//            new C.Legend(new C.LegendPosition() { Val = C.LegendPositionValues.Bottom })
//        );

//        chartPart.ChartSpace.Append(chart);
//        chartPart.ChartSpace.Save();

//        // Đặt chart lên slide
//        var relId = slidePart.GetIdOfPart(chartPart);
//        var graphicFrame = new P.GraphicFrame(
//            new P.NonVisualGraphicFrameProperties(
//                new P.NonVisualDrawingProperties() { Id = 100U, Name = "Chart 1" },
//                new P.NonVisualGraphicFrameDrawingProperties(),
//                new P.ApplicationNonVisualDrawingProperties()
//            ),
//            new P.Transform(new A.Offset() { X = leftEmu, Y = topEmu },
//                            new A.Extents() { Cx = widthEmu, Cy = heightEmu }),
//            new A.Graphic(new A.GraphicData(new C.ChartReference() { Id = relId })
//            { Uri = "http://schemas.openxmlformats.org/drawingml/2006/chart" })
//        );

//        slidePart.Slide.CommonSlideData.ShapeTree.AppendChild(graphicFrame);
//        slidePart.Slide.Save();
//    }

//    static OpenXmlElement BuildSeries(string[] categories, string seriesName, double[] values)
//    {
//        var numCache = new C.NumberingCache(new C.FormatCode("General"),
//            new C.PointCount() { Val = (uint)values.Length });
//        for (uint i = 0; i < values.Length; i++)
//            numCache.Append(new C.NumericPoint() { Index = i, NumericValue = new C.NumericValue(values[i].ToString(System.Globalization.CultureInfo.InvariantCulture)) });

//        var strCache = new C.StringCache(new C.PointCount() { Val = (uint)categories.Length });
//        for (uint i = 0; i < categories.Length; i++)
//            strCache.Append(new C.StringPoint() { Index = i, NumericValue = new C.NumericValue(categories[i]) });

//        // Sheet1!A2:A.. và B2:B..
//        string catRef = $"Sheet1!$A$2:$A${categories.Length + 1}";
//        string valRef = $"Sheet1!$B$2:$B${values.Length + 1}";

//        return new C.BarChartSeries(
//            new C.Index() { Val = 0U },
//            new C.Order() { Val = 0U },
//            new C.SeriesText(new C.StringLiteral(
//                new C.PointCount() { Val = 1U },
//                new C.StringPoint() { Index = 0U, NumericValue = new C.NumericValue(seriesName) }
//            )),
//            new C.CategoryAxisData(new C.StringReference(new C.Formula(catRef), strCache)),
//            new C.Values(new C.NumberReference(new C.Formula(valRef), numCache))
//        );
//    }

//    static C.CategoryAxis BuildCategoryAxis(uint id) => new C.CategoryAxis(
//        new C.AxisId() { Val = id },
//        new C.Scaling(new C.Orientation() { Val = C.OrientationValues.MinMax }),
//        new C.AxisPosition() { Val = C.AxisPositionValues.Bottom },
//        new C.TickLabelPosition() { Val = C.TickLabelPositionValues.NextTo },
//        new C.CrossingAxis() { Val = 48672768U },
//        new C.Crosses() { Val = C.CrossesValues.AutoZero },
//        new C.AutoLabeled() { Val = true },
//        new C.LabelAlignment() { Val = C.LabelAlignmentValues.Center },
//        new C.LabelOffset() { Val = 100 }
//    );

//    static C.ValueAxis BuildValueAxis(uint id) => new C.ValueAxis(
//        new C.AxisId() { Val = id },
//        new C.Scaling(new C.Orientation() { Val = C.OrientationValues.MinMax }),
//        new C.AxisPosition() { Val = C.AxisPositionValues.Left },
//        new C.MajorGridlines(),
//        new C.NumberingFormat() { FormatCode = "General", SourceLinked = true },
//        new C.TickLabelPosition() { Val = C.TickLabelPositionValues.NextTo },
//        new C.CrossingAxis() { Val = 48650112U },
//        new C.Crosses() { Val = C.CrossesValues.AutoZero },
//        new C.CrossBetween() { Val = C.CrossBetweenValues.Between }
//    );

//    static void BuildWorkbookBytes(Stream output, string[] categories, string seriesName, double[] values)
//    {
//        using var doc = SpreadsheetDocument.Create(output, SpreadsheetDocumentType.Workbook, true);
//        var wbPart = doc.AddWorkbookPart();
//        wbPart.Workbook = new X.Workbook();

//        var wsPart = wbPart.AddNewPart<WorksheetPart>();
//        var sheetData = new X.SheetData();

//        // Header
//        var row1 = new X.Row() { RowIndex = 1U };
//        row1.Append(Cell("Category"), Cell(seriesName, isNumber: false));
//        sheetData.Append(row1);

//        // Data
//        for (int i = 0; i < categories.Length; i++)
//        {
//            var r = new X.Row() { RowIndex = (uint)(i + 2) };
//            r.Append(Cell(categories[i], isNumber: false),
//                     Cell(values[i].ToString(System.Globalization.CultureInfo.InvariantCulture), isNumber: true));
//            sheetData.Append(r);
//        }

//        wsPart.Worksheet = new X.Worksheet(sheetData);
//        wsPart.Worksheet.Save();

//        var sheets = new X.Sheets();
//        var sheet = new X.Sheet() { Id = wbPart.GetIdOfPart(wsPart), SheetId = 1U, Name = "Sheet1" };
//        sheets.Append(sheet);

//        wbPart.Workbook.Append(sheets);
//        wbPart.Workbook.Save();
//    }

//    static X.Cell Cell(string value, bool isNumber = false)
//        => isNumber
//           ? new X.Cell() { CellValue = new X.CellValue(value), DataType = X.CellValues.Number }
//           : new X.Cell() { CellValue = new X.CellValue(value), DataType = X.CellValues.String };

//    // ======= ĐỔI VỊ TRÍ SLIDE =======
//    static void MoveSlide(PresentationPart presPart, int fromIndex, int toIndex)
//    {
//        var sldIdList = presPart.Presentation.SlideIdList;
//        var ids = sldIdList.ChildElements.OfType<P.SlideId>().ToList();
//        if (fromIndex < 0 || fromIndex >= ids.Count || toIndex < 0 || toIndex >= ids.Count) return;

//        var item = ids[fromIndex];
//        ids.RemoveAt(fromIndex);
//        ids.Insert(toIndex, item);

//        sldIdList.RemoveAllChildren();
//        foreach (var it in ids) sldIdList.Append(it);
//        presPart.Presentation.Save();
//    }
//}

using System.IO;
using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using P = DocumentFormat.OpenXml.Presentation;
using A = DocumentFormat.OpenXml.Drawing;
using DocumentFormat.OpenXml.Presentation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
//using DocumentFormat.OpenXml.Drawing;
using D = DocumentFormat.OpenXml.Drawing;
using C = DocumentFormat.OpenXml.Drawing.Charts;
//public static class PowerPointUtil
//    {

//    public static void SampleMakeSimple()
//    {
//        const string file = "D:\\one-slide-text.pptx";
//        if (File.Exists(file)) File.Delete(file);

//        using var doc = PresentationDocument.Create(file, PresentationDocumentType.Presentation);
//        var presPart = doc.AddPresentationPart();
//        presPart.Presentation = new P.Presentation();

//        // Slide master (tối giản)
//        var master = presPart.AddNewPart<SlideMasterPart>();
//        master.SlideMaster = new P.SlideMaster(
//            new P.CommonSlideData(new P.ShapeTree(
//                new P.NonVisualGroupShapeProperties(
//                    new P.NonVisualDrawingProperties() { Id = 1U, Name = "" },
//                    new P.NonVisualGroupShapeDrawingProperties(),
//                    new P.ApplicationNonVisualDrawingProperties()
//                ),
//                new P.GroupShapeProperties(new A.TransformGroup())
//            )),
//            new P.ColorMap()
//        );

//        // Layout tối giản
//        var layout = master.AddNewPart<SlideLayoutPart>();
//        layout.SlideLayout = new P.SlideLayout(
//            new P.CommonSlideData(new P.ShapeTree(
//                new P.NonVisualGroupShapeProperties(
//                    new P.NonVisualDrawingProperties() { Id = 1U, Name = "" },
//                    new P.NonVisualGroupShapeDrawingProperties(),
//                    new P.ApplicationNonVisualDrawingProperties()
//                ),
//                new P.GroupShapeProperties(new A.TransformGroup())
//            )),
//            new P.ColorMapOverride(new A.MasterColorMapping())
//        );
//        master.SlideMaster.SlideLayoutIdList = new P.SlideLayoutIdList(
//            new P.SlideLayoutId { Id = 1U, RelationshipId = master.GetIdOfPart(layout) }
//        );

//        // Slide duy nhất
//        var slidePart = presPart.AddNewPart<SlidePart>();
//        slidePart.Slide = new P.Slide(
//            new P.CommonSlideData(new P.ShapeTree(
//                new P.NonVisualGroupShapeProperties(
//                    new P.NonVisualDrawingProperties() { Id = 1U, Name = "" },
//                    new P.NonVisualGroupShapeDrawingProperties(),
//                    new P.ApplicationNonVisualDrawingProperties()
//                ),
//                new P.GroupShapeProperties(new A.TransformGroup())
//            )),
//            new P.ColorMapOverride(new A.MasterColorMapping())
//        );
//        slidePart.AddPart(layout);

//        // Thêm SlideIdList và đăng ký slide
//        presPart.Presentation.SlideIdList = new P.SlideIdList();
//        var relId = presPart.GetIdOfPart(slidePart);
//        presPart.Presentation.SlideIdList.Append(new P.SlideId { Id = 256U, RelationshipId = relId });

//        // === Chèn TEXTBOX đơn giản vào slide ===
//        // Vị trí/kích thước dùng EMU (1 inch = 914400 EMU)
//        long x = Inch(1.5), y = Inch(2.0), w = Inch(7.0), h = Inch(1.5);

//        var shape = new P.Shape(
//            new P.NonVisualShapeProperties(
//                new P.NonVisualDrawingProperties() { Id = 2U, Name = "TextBox 1" },
//                new P.NonVisualShapeDrawingProperties(new A.ShapeLocks() { NoGrouping = true }),
//                new P.ApplicationNonVisualDrawingProperties()
//            ),
//            new P.ShapeProperties(
//                new A.Transform2D(
//                    new A.Offset() { X = x, Y = y },
//                    new A.Extents() { Cx = w, Cy = h }
//                ),
//                new A.PresetGeometry(new A.AdjustValueList()) { Preset = A.ShapeTypeValues.Rectangle }
//            ),
//            new P.TextBody(
//                new A.BodyProperties(),
//                new A.ListStyle(),
//                new A.Paragraph(
//                    new A.Run(new A.Text("Xin chào từ Open XML!")),
//                    new A.EndParagraphRunProperties() { Language = "vi-VN" }
//                )
//            )
//        );

//        slidePart.Slide.CommonSlideData.ShapeTree.Append(shape);
//        slidePart.Slide.Save();
//        presPart.Presentation.Save();
//    }

//    static long Inch(double inch) => (long)(inch * 914400); // helper
//}
public class PowerPointUtil
{
    public static byte[] CreatePresentation(string filepath)
    {
        MemoryStream memoryStream = new MemoryStream();
        // Create a presentation at a specified file path. The presentation document type is pptx by default.
        using (var presentationDoc = PresentationDocument.Create(memoryStream, PresentationDocumentType.Presentation))
        {
            //PresentationDocument presentationDoc = PresentationDocument.Create(filepath, PresentationDocumentType.Presentation);
            PresentationPart presentationPart = presentationDoc.AddPresentationPart();
            presentationPart.Presentation = new Presentation();
            CreatePresentationParts(presentationPart);
            presentationPart.Presentation.Save();
        }
        //return presentationDoc;
        return memoryStream.ToArray();
    }

    private static void CreatePresentationParts(PresentationPart presentationPart)
    {
        var SlideMasterId = "rId1";
        var SlideId = "rId2";
        var ThemeId = "rId5";

        SlideMasterIdList slideMasterIdList1 = new SlideMasterIdList(new SlideMasterId() { Id = (UInt32Value)2147483648U, RelationshipId = SlideMasterId });
        SlideIdList slideIdList1 = new SlideIdList(new SlideId() { Id = (UInt32Value)256U, RelationshipId = SlideId });
        SlideSize slideSize1 = new SlideSize() { Cx = 9144000, Cy = 6858000, Type = SlideSizeValues.Screen4x3 };
        NotesSize notesSize1 = new NotesSize() { Cx = 6858000, Cy = 9144000 };
        DefaultTextStyle defaultTextStyle1 = new DefaultTextStyle();

        presentationPart.Presentation.Append(slideMasterIdList1, slideIdList1, slideSize1, notesSize1, defaultTextStyle1);

        SlidePart slidePart1;
        SlideLayoutPart slideLayoutPart1;
        SlideMasterPart slideMasterPart1;
        ThemePart themePart1;

        slidePart1 = CreateSlidePart(presentationPart, SlideId);
        //SetTitleText(slidePart1, "Hello");
        
        slideLayoutPart1 = CreateSlideLayoutPart(slidePart1, SlideMasterId);
        slideMasterPart1 = CreateSlideMasterPart(slideLayoutPart1, SlideMasterId);
        themePart1 = CreateTheme(slideMasterPart1, ThemeId);

        slideMasterPart1.AddPart(slideLayoutPart1, SlideMasterId);
        presentationPart.AddPart(slideMasterPart1, SlideMasterId);
        presentationPart.AddPart(themePart1, ThemeId);
    }
    private static void SetTitleText(SlidePart slidePart, string text)
     {
         var shapes = slidePart.Slide.Descendants<P.Shape>()
             .Where(s => s.NonVisualShapeProperties?.ApplicationNonVisualDrawingProperties?.PlaceholderShape?.Type?.Value
                         == P.PlaceholderValues.Title);

         foreach (var shape in shapes)
         {
             var tb = shape.TextBody ?? shape.AppendChild(new P.TextBody(new A.BodyProperties(), new A.ListStyle()));
             tb.RemoveAllChildren<A.Paragraph>();
             tb.AppendChild(new A.Paragraph(new A.Run(new A.Text(text))));
         }
         slidePart.Slide.Save();
     }
    private static GraphicFrame CreateTable()
    {
        // Declare and instantiate the table
        D.Table table = new D.Table();

        // Define the columns
        D.TableGrid tableGrid = new D.TableGrid();
        tableGrid.Append(new D.GridColumn() { Width = 3124200 });
        tableGrid.Append(new D.GridColumn() { Width = 3124200 });

        // Append the TableGrid to the table
        table.Append(tableGrid);

        // Create the rows and cells
        for (int i = 0; i < 3; i++) // 3 rows
        {
            D.TableRow row = new D.TableRow() { Height = 370840 };
            for (int j = 0; j < 2; j++) // 2 columns
            {
                D.TableCell cell = new D.TableCell();
                D.TextBody body = new D.TextBody(new D.BodyProperties(),
                                                     new D.ListStyle(),
                                                     new D.Paragraph(new D.Run(new D.Text($"Cell {i + 1},{j + 1}"))));
                cell.Append(body);
                cell.Append(new D.TableCellProperties());
                row.Append(cell);
            }
            table.Append(row);
        }

        // Create a GraphicFrame to hold the table
        GraphicFrame frame = new GraphicFrame();
        frame.NonVisualGraphicFrameProperties = new NonVisualGraphicFrameProperties(
            new NonVisualDrawingProperties() { Id = 1026, Name = "Table" },
            new NonVisualGraphicFrameDrawingProperties(),
            new ApplicationNonVisualDrawingProperties());
        frame.Transform = new Transform(new D.Offset() { X = 0L, Y = 0L }, new D.Extents() { Cx = 0L, Cy = 0L });
        frame.Graphic = new D.Graphic(new D.GraphicData(table)
        {
            Uri = "http://schemas.openxmlformats.org/drawingml/2006/table"
        });

        return frame;
    }

    private static SlidePart CreateSlidePart(PresentationPart presentationPart, string SlideId)
    {
        SlidePart slidePart1 = presentationPart.AddNewPart<SlidePart>(SlideId);
        slidePart1.Slide = new Slide(
                new CommonSlideData(
                    new ShapeTree(
                        new P.NonVisualGroupShapeProperties(
                            new P.NonVisualDrawingProperties() { Id = (UInt32Value)1U, Name = "" },
                            new P.NonVisualGroupShapeDrawingProperties(),
                            new ApplicationNonVisualDrawingProperties()),
                        new GroupShapeProperties(new D.TransformGroup()),
                        new P.Shape(
                            new P.NonVisualShapeProperties(
                                new P.NonVisualDrawingProperties() { Id = (UInt32Value)2U, Name = "Title 1" },
                                new P.NonVisualShapeDrawingProperties(new D.ShapeLocks() { NoGrouping = true }),
                                new ApplicationNonVisualDrawingProperties(new PlaceholderShape())),
                            new P.ShapeProperties(),
                            new P.TextBody(
                                new D.BodyProperties(),
                                new D.ListStyle(),
                                
                                new D.Paragraph(new A.Run(new A.Text("Xin chào từ Open XML!")), new D.EndParagraphRunProperties() { Language = "en-US" }))))),
                new ColorMapOverride(new D.MasterColorMapping()));

        //new P.TextBody(
        //       new A.BodyProperties(),
        //       new A.ListStyle(),
        //       new A.Paragraph(
        //           new A.Run(new A.Text("Xin chào từ Open XML!")),
        //           new A.EndParagraphRunProperties() { Language = "vi-VN" }
        //       )
        //   )
        // Sanity check
        if (slidePart1.Slide.CommonSlideData == null)
            throw new InvalidOperationException("CreateSlide: CommonSlideData is null");
        if (slidePart1.Slide.CommonSlideData.ShapeTree == null)
            throw new InvalidOperationException("CreateSlide: ShapeTree is null");
        // Append the GraphicFrame to the SlidePart
        var frame = CreateTable();
        slidePart1.Slide.CommonSlideData.ShapeTree.AppendChild(frame);
        // Save the slide part
        slidePart1.Slide.Save();

        return slidePart1;
    }

    private static SlideLayoutPart CreateSlideLayoutPart(SlidePart slidePart1, string SlideMasterId)
    {
        SlideLayoutPart slideLayoutPart1 = slidePart1.AddNewPart<SlideLayoutPart>(SlideMasterId);
        SlideLayout slideLayout = new SlideLayout(
        new CommonSlideData(new ShapeTree(
          new P.NonVisualGroupShapeProperties(
          new P.NonVisualDrawingProperties() { Id = (UInt32Value)1U, Name = "" },
          new P.NonVisualGroupShapeDrawingProperties(),
          new ApplicationNonVisualDrawingProperties()),
          new GroupShapeProperties(new D.TransformGroup()),
          new P.Shape(
          new P.NonVisualShapeProperties(
            new P.NonVisualDrawingProperties() { Id = (UInt32Value)2U, Name = "" },
            new P.NonVisualShapeDrawingProperties(new D.ShapeLocks() { NoGrouping = true }),
            new ApplicationNonVisualDrawingProperties(new PlaceholderShape())),
          new P.ShapeProperties(),
          new P.TextBody(
            new D.BodyProperties(),
            new D.ListStyle(),
            new D.Paragraph(new D.EndParagraphRunProperties()))))),
        new ColorMapOverride(new D.MasterColorMapping()));
        slideLayoutPart1.SlideLayout = slideLayout;
        return slideLayoutPart1;
    }

    private static SlideMasterPart CreateSlideMasterPart(SlideLayoutPart slideLayoutPart1, string SlideMasterId)
    {
        SlideMasterPart slideMasterPart1 = slideLayoutPart1.AddNewPart<SlideMasterPart>(SlideMasterId);
        SlideMaster slideMaster = new SlideMaster(
        new CommonSlideData(new ShapeTree(
          new P.NonVisualGroupShapeProperties(
          new P.NonVisualDrawingProperties() { Id = (UInt32Value)1U, Name = "" },
          new P.NonVisualGroupShapeDrawingProperties(),
          new ApplicationNonVisualDrawingProperties()),
          new GroupShapeProperties(new D.TransformGroup()),
          new P.Shape(
          new P.NonVisualShapeProperties(
            new P.NonVisualDrawingProperties() { Id = (UInt32Value)2U, Name = "Title Placeholder 1" },
            new P.NonVisualShapeDrawingProperties(new D.ShapeLocks() { NoGrouping = true }),
            new ApplicationNonVisualDrawingProperties(new PlaceholderShape() { Type = PlaceholderValues.Title })),
          new P.ShapeProperties(),
          new P.TextBody(
            new D.BodyProperties(),
            new D.ListStyle(),
            new D.Paragraph())))),
        new P.ColorMap() { Background1 = D.ColorSchemeIndexValues.Light1, Text1 = D.ColorSchemeIndexValues.Dark1, Background2 = D.ColorSchemeIndexValues.Light2, Text2 = D.ColorSchemeIndexValues.Dark2, Accent1 = D.ColorSchemeIndexValues.Accent1, Accent2 = D.ColorSchemeIndexValues.Accent2, Accent3 = D.ColorSchemeIndexValues.Accent3, Accent4 = D.ColorSchemeIndexValues.Accent4, Accent5 = D.ColorSchemeIndexValues.Accent5, Accent6 = D.ColorSchemeIndexValues.Accent6, Hyperlink = D.ColorSchemeIndexValues.Hyperlink, FollowedHyperlink = D.ColorSchemeIndexValues.FollowedHyperlink },
        new SlideLayoutIdList(new SlideLayoutId() { Id = (UInt32Value)2147483649U, RelationshipId = SlideMasterId }),
        new TextStyles(new TitleStyle(), new BodyStyle(), new OtherStyle()));
        slideMasterPart1.SlideMaster = slideMaster;

        return slideMasterPart1;
    }

    private static ThemePart CreateTheme(SlideMasterPart slideMasterPart1, string ThemeId)
    {
        ThemePart themePart1 = slideMasterPart1.AddNewPart<ThemePart>(ThemeId);
        D.Theme theme1 = new D.Theme() { Name = "Office Theme" };

        D.ThemeElements themeElements1 = new D.ThemeElements(
        new D.ColorScheme(
          new D.Dark1Color(new D.SystemColor() { Val = D.SystemColorValues.WindowText, LastColor = "000000" }),
          new D.Light1Color(new D.SystemColor() { Val = D.SystemColorValues.Window, LastColor = "FFFFFF" }),
          new D.Dark2Color(new D.RgbColorModelHex() { Val = "1F497D" }),
          new D.Light2Color(new D.RgbColorModelHex() { Val = "EEECE1" }),
          new D.Accent1Color(new D.RgbColorModelHex() { Val = "4F81BD" }),
          new D.Accent2Color(new D.RgbColorModelHex() { Val = "C0504D" }),
          new D.Accent3Color(new D.RgbColorModelHex() { Val = "9BBB59" }),
          new D.Accent4Color(new D.RgbColorModelHex() { Val = "8064A2" }),
          new D.Accent5Color(new D.RgbColorModelHex() { Val = "4BACC6" }),
          new D.Accent6Color(new D.RgbColorModelHex() { Val = "F79646" }),
          new D.Hyperlink(new D.RgbColorModelHex() { Val = "0000FF" }),
          new D.FollowedHyperlinkColor(new D.RgbColorModelHex() { Val = "800080" }))
        { Name = "Office" },
          new D.FontScheme(
          new D.MajorFont(
          new D.LatinFont() { Typeface = "Calibri" },
          new D.EastAsianFont() { Typeface = "" },
          new D.ComplexScriptFont() { Typeface = "" }),
          new D.MinorFont(
          new D.LatinFont() { Typeface = "Calibri" },
          new D.EastAsianFont() { Typeface = "" },
          new D.ComplexScriptFont() { Typeface = "" }))
          { Name = "Office" },
          new D.FormatScheme(
          new D.FillStyleList(
          new D.SolidFill(new D.SchemeColor() { Val = D.SchemeColorValues.PhColor }),
          new D.GradientFill(
            new D.GradientStopList(
            new D.GradientStop(new D.SchemeColor(new D.Tint() { Val = 50000 },
              new D.SaturationModulation() { Val = 300000 })
            { Val = D.SchemeColorValues.PhColor })
            { Position = 0 },
            new D.GradientStop(new D.SchemeColor(new D.Tint() { Val = 37000 },
             new D.SaturationModulation() { Val = 300000 })
            { Val = D.SchemeColorValues.PhColor })
            { Position = 35000 },
            new D.GradientStop(new D.SchemeColor(new D.Tint() { Val = 15000 },
             new D.SaturationModulation() { Val = 350000 })
            { Val = D.SchemeColorValues.PhColor })
            { Position = 100000 }
            ),
            new D.LinearGradientFill() { Angle = 16200000, Scaled = true }),
          new D.NoFill(),
          new D.PatternFill(),
          new D.GroupFill()),
          new D.LineStyleList(
          new D.Outline(
            new D.SolidFill(
            new D.SchemeColor(
              new D.Shade() { Val = 95000 },
              new D.SaturationModulation() { Val = 105000 })
            { Val = D.SchemeColorValues.PhColor }),
            new D.PresetDash() { Val = D.PresetLineDashValues.Solid })
          {
              Width = 9525,
              CapType = D.LineCapValues.Flat,
              CompoundLineType = D.CompoundLineValues.Single,
              Alignment = D.PenAlignmentValues.Center
          },
          new D.Outline(
            new D.SolidFill(
            new D.SchemeColor(
              new D.Shade() { Val = 95000 },
              new D.SaturationModulation() { Val = 105000 })
            { Val = D.SchemeColorValues.PhColor }),
            new D.PresetDash() { Val = D.PresetLineDashValues.Solid })
          {
              Width = 9525,
              CapType = D.LineCapValues.Flat,
              CompoundLineType = D.CompoundLineValues.Single,
              Alignment = D.PenAlignmentValues.Center
          },
          new D.Outline(
            new D.SolidFill(
            new D.SchemeColor(
              new D.Shade() { Val = 95000 },
              new D.SaturationModulation() { Val = 105000 })
            { Val = D.SchemeColorValues.PhColor }),
            new D.PresetDash() { Val = D.PresetLineDashValues.Solid })
          {
              Width = 9525,
              CapType = D.LineCapValues.Flat,
              CompoundLineType = D.CompoundLineValues.Single,
              Alignment = D.PenAlignmentValues.Center
          }),
          new D.EffectStyleList(
          new D.EffectStyle(
            new D.EffectList(
            new D.OuterShadow(
              new D.RgbColorModelHex(
              new D.Alpha() { Val = 38000 })
              { Val = "000000" })
            { BlurRadius = 40000L, Distance = 20000L, Direction = 5400000, RotateWithShape = false })),
          new D.EffectStyle(
            new D.EffectList(
            new D.OuterShadow(
              new D.RgbColorModelHex(
              new D.Alpha() { Val = 38000 })
              { Val = "000000" })
            { BlurRadius = 40000L, Distance = 20000L, Direction = 5400000, RotateWithShape = false })),
          new D.EffectStyle(
            new D.EffectList(
            new D.OuterShadow(
              new D.RgbColorModelHex(
              new D.Alpha() { Val = 38000 })
              { Val = "000000" })
            { BlurRadius = 40000L, Distance = 20000L, Direction = 5400000, RotateWithShape = false }))),
          new D.BackgroundFillStyleList(
          new D.SolidFill(new D.SchemeColor() { Val = D.SchemeColorValues.PhColor }),
          new D.GradientFill(
            new D.GradientStopList(
            new D.GradientStop(
              new D.SchemeColor(new D.Tint() { Val = 50000 },
                new D.SaturationModulation() { Val = 300000 })
              { Val = D.SchemeColorValues.PhColor })
            { Position = 0 },
            new D.GradientStop(
              new D.SchemeColor(new D.Tint() { Val = 50000 },
                new D.SaturationModulation() { Val = 300000 })
              { Val = D.SchemeColorValues.PhColor })
            { Position = 0 },
            new D.GradientStop(
              new D.SchemeColor(new D.Tint() { Val = 50000 },
                new D.SaturationModulation() { Val = 300000 })
              { Val = D.SchemeColorValues.PhColor })
            { Position = 0 }),
            new D.LinearGradientFill() { Angle = 16200000, Scaled = true }),
          new D.GradientFill(
            new D.GradientStopList(
            new D.GradientStop(
              new D.SchemeColor(new D.Tint() { Val = 50000 },
                new D.SaturationModulation() { Val = 300000 })
              { Val = D.SchemeColorValues.PhColor })
            { Position = 0 },
            new D.GradientStop(
              new D.SchemeColor(new D.Tint() { Val = 50000 },
                new D.SaturationModulation() { Val = 300000 })
              { Val = D.SchemeColorValues.PhColor })
            { Position = 0 }),
            new D.LinearGradientFill() { Angle = 16200000, Scaled = true })))
          { Name = "Office" });

        theme1.Append(themeElements1);
        theme1.Append(new D.ObjectDefaults());
        theme1.Append(new D.ExtraColorSchemeList());

        themePart1.Theme = theme1;
        return themePart1;
    }
    private static void AddChartToSlide(SlidePart slidePart)
    {
        // Thêm ChartPart
        ChartPart chartPart = slidePart.AddNewPart<ChartPart>();
        string chartRelId = slidePart.GetIdOfPart(chartPart);

        chartPart.ChartSpace = new C.ChartSpace();
        chartPart.ChartSpace.AppendChild(new C.EditingLanguage() { Val = "en-US" });

        // Tạo biểu đồ đơn giản
        var chart = new C.Chart();

        var plotArea = new C.PlotArea();
        plotArea.AppendChild(new C.Layout());

        var barChart = new C.BarChart(
            new C.BarDirection() { Val = C.BarDirectionValues.Column },
            new C.BarGrouping() { Val = C.BarGroupingValues.Clustered },
            new C.VaryColors() { Val = false });

        var series = new C.BarChartSeries(
            new C.Index() { Val = (UInt32Value)0U },
            new C.Order() { Val = (UInt32Value)0U },
            new C.SeriesText(new C.StringReference() { Formula = new C.Formula("Series 1") }),
            new C.CategoryAxisData(
                new C.StringLiteral(
                    new C.PointCount() { Val = 3U },
                    new C.StringPoint() { Index = 0U, NumericValue = new C.NumericValue("A") },
                    new C.StringPoint() { Index = 1U, NumericValue = new C.NumericValue("B") },
                    new C.StringPoint() { Index = 2U, NumericValue = new C.NumericValue("C") })
            ),
            new C.Values(
                new C.NumberLiteral(
                    new C.PointCount() { Val = 3U },
                    new C.NumericPoint() { Index = 0U, NumericValue = new C.NumericValue("10") },
                    new C.NumericPoint() { Index = 1U, NumericValue = new C.NumericValue("20") },
                    new C.NumericPoint() { Index = 2U, NumericValue = new C.NumericValue("30") })
            )
        );

        barChart.Append(series);
        plotArea.Append(barChart);
        chart.Append(plotArea);
        chart.Append(new C.PlotVisibleOnly() { Val = true });

        chartPart.ChartSpace.Append(chart);
        chartPart.ChartSpace.Save(); // ⚠ Bắt buộc

        // Thêm biểu đồ vào slide thông qua GraphicFrame
        var graphicFrame = new GraphicFrame(
            new NonVisualGraphicFrameProperties(
                new NonVisualDrawingProperties() { Id = 5U, Name = "Chart 1" },
                new NonVisualGraphicFrameDrawingProperties(),
                new ApplicationNonVisualDrawingProperties()),
            new Transform(
                new D.Offset() { X = 1_000_000L, Y = 1_000_000L },
                new D.Extents() { Cx = 5_000_000L, Cy = 4_000_000L }),
            new D.Graphic(new D.GraphicData(
                new C.ChartReference() { Id = chartRelId })
            {
                Uri = "http://schemas.openxmlformats.org/drawingml/2006/chart"
            }));

        // Append chart vào ShapeTree
        slidePart.Slide.CommonSlideData.ShapeTree.AppendChild(graphicFrame);
        slidePart.Slide.Save(); // ⚠ Cực kỳ quan trọng
    }


}