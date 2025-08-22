using DocumentFormat.OpenXml.Wordprocessing;
using MiniSoftware;
using SurveyReportRE.Common;
using SurveyReportRE.Models.Migration.Business.Data;
using SurveyReportRE.Models.Migration.Business.Form;
using SurveyReportRE.Models.Migration.Business.MasterData;
using Outline = SurveyReportRE.Models.Migration.Business.MasterData.Outline;
using System.Data;
using Syncfusion.DocIO.DLS;
using Syncfusion.DocIO;
using Syncfusion.DocIORenderer;
using Syncfusion.Pdf;
using Syncfusion.Pdf.Graphics;
using System.Net.Http;
using Syncfusion;
using DocumentFormat.OpenXml.Office2010.PowerPoint;
using RESurveyTool.Common.Constant;
using System.Dynamic;
using Newtonsoft.Json;

namespace RESurveyTool.Common.Common
{
    public static class WordHelper
    {
        //Update date: 2025-04-22
        //public static MemoryStream GenerateWord(Survey surveyData, string PATH_TEMPLATE, string filePath, string blobPath, string _connectionString, string NO_IMAGE)
        public static MemoryStream GenerateWord(Survey surveyData, WordHandleConfig wordHandleConfig, string _connectionString)
        {
            try
            {


                int maxPictureWidth = ConfigConstant._maxWordPictureWidth;
                var stream = new MemoryStream(); //  cứ xem là 1 đường dẫn 
                //WordHandleConfig wordHandleConfig = new WordHandleConfig();

                //string positiveContent = "";
                //string negativeContent = "";


                DataTable surveyQuery = DataUtil.ExecuteStoredProcedureReturn(_connectionString, "usp_Survey_GetData",
                     ("@SurveyId", surveyData.Id), ("@Type", 1));
                DataTable posNegQuery = DataUtil.ExecuteStoredProcedureReturn(_connectionString, "usp_Survey_GetData",
                    ("@SurveyId", surveyData.Id), ("@Type", 2));
                DataTable managementQuery = DataUtil.ExecuteStoredProcedureReturn(_connectionString, "usp_Survey_GetData",
                    ("@SurveyId", surveyData.Id), ("@Type", 5));
                DataTable occupancyDetailQuery = DataUtil.ExecuteStoredProcedureReturn(_connectionString, "usp_Survey_GetData",
                    ("@SurveyId", surveyData.Id), ("@Type", 3));
                DataTable occupancyGasDetailQuery = DataUtil.ExecuteStoredProcedureReturn(_connectionString, "usp_Survey_GetData",
                    ("@SurveyId", surveyData.Id), ("@Type", 4));
                DataTable conferredByQuery = DataUtil.ExecuteStoredProcedureReturn(_connectionString, "usp_Survey_GetData",
                    ("@SurveyId", surveyData.Id), ("@Type", 6));
                DataTable accompaniedByQuery = DataUtil.ExecuteStoredProcedureReturn(_connectionString, "usp_Survey_GetData",
                    ("@SurveyId", surveyData.Id), ("@Type", 7));
                DataTable summaryQuery = DataUtil.ExecuteStoredProcedureReturn(_connectionString, "usp_Survey_GetData",
                    ("@SurveyId", surveyData.Id), ("@Type", 8));
                DataTable protectionDetailQuery = DataUtil.ExecuteStoredProcedureReturn(_connectionString, "usp_Survey_GetData",
                    ("@SurveyId", surveyData.Id), ("@Type", 9));
                DataTable constructionBuildingQuery = DataUtil.ExecuteStoredProcedureReturn(_connectionString, "usp_Survey_GetData",
                     ("@SurveyId", surveyData.Id), ("@Type", 10));
                DataTable lossHistoryDetailQuery = DataUtil.ExecuteStoredProcedureReturn(_connectionString, "usp_Survey_GetData",
                     ("@SurveyId", surveyData.Id), ("@Type", 11));
                DataTable lossExpValueBrkdwnDetailQuery = DataUtil.ExecuteStoredProcedureReturn(_connectionString, "usp_Survey_GetData",
                     ("@SurveyId", surveyData.Id), ("@Type", 12));
                DataTable attachmentPicsQuery = DataUtil.ExecuteStoredProcedureReturn(_connectionString, "usp_Survey_GetData",
                     ("@SurveyId", surveyData.Id), ("@Type", 13));
                DataTable surveyOutlineQuery = DataUtil.ExecuteStoredProcedureReturn(_connectionString, "usp_Survey_GetData",
                     ("@SurveyId", surveyData.Id), ("@Type", 14));
                DataTable dataGridConfigQuery = DataUtil.ExecuteStoredProcedureReturn(_connectionString, "usp_Survey_GetData",
                     ("@SurveyId", surveyData.Id), ("@Type", 15));
                DataTable otherExposuresQuery = DataUtil.ExecuteStoredProcedureReturn(_connectionString, "usp_Survey_GetData",
                     ("@SurveyId", surveyData.Id), ("@Type", 16));
                DataTable constructionQuery = DataUtil.ExecuteStoredProcedureReturn(_connectionString, "usp_Survey_GetData",
                     ("@SurveyId", surveyData.Id), ("@Type", 17));
                DataTable occupancyQuery = DataUtil.ExecuteStoredProcedureReturn(_connectionString, "usp_Survey_GetData",
                    ("@SurveyId", surveyData.Id), ("@Type", 18));
                DataTable surveyEvaluationsQuery = DataUtil.ExecuteStoredProcedureReturn(_connectionString, "usp_Survey_GetData",
                   ("@SurveyId", surveyData.Id), ("@Type", 19));
                DataTable sitePicturesQuery = DataUtil.ExecuteStoredProcedureReturn(_connectionString, "usp_Survey_GetData",
                   ("@SurveyId", surveyData.Id), ("@Type", 20));
                DataTable extFireExpExposuresQuery = DataUtil.ExecuteStoredProcedureReturn(_connectionString, "usp_Survey_GetData",
              ("@SurveyId", surveyData.Id), ("@Type", 21));
                DataTable protectionQuery = DataUtil.ExecuteStoredProcedureReturn(_connectionString, "usp_Survey_GetData",
             ("@SurveyId", surveyData.Id), ("@Type", 22));







                //string output = Path.Combine(wordHandleConfig.BlobPath, wordHandleConfig.MainProcessPathFolder, $"{surveyData.SurveyNo}_PreRender.docx");
                wordHandleConfig.WordPrerenderPath = Path.Combine(wordHandleConfig.BlobPath, wordHandleConfig.MainProcessPathFolder, $"{surveyData.SurveyNo}_PreRender.docx");
                var pathExport = System.IO.Path.Combine(wordHandleConfig.BlobPath, wordHandleConfig.MainProcessPathFolder);
                if (!Directory.Exists(pathExport))
                    Directory.CreateDirectory(pathExport);
                var pathExportFile = System.IO.Path.Combine(wordHandleConfig.BlobPath, wordHandleConfig.MainProcessPathFolder, $"{surveyData.SurveyNo}.docx");
                var pathHtmlFile = System.IO.Path.Combine(wordHandleConfig.BlobPath, wordHandleConfig.MainProcessPathFolder, $"{surveyData.SurveyNo}.html");
                var pathPdfFile = System.IO.Path.Combine(wordHandleConfig.BlobPath, wordHandleConfig.MainProcessPathFolder, $"{surveyData.SurveyNo}.pdf");



                //List<dynamic> preRenderListObject = new List<dynamic>();
                List<dynamic> occupancyDetailQuerys = new List<dynamic>();
                List<dynamic> occupancyGasDetailQuerys = new List<dynamic>();
                List<dynamic> conferredByQuerys = new List<dynamic>();
                List<dynamic> accompaniedByQuerys = new List<dynamic>();
                //List<dynamic> accompanied2ndByQuerys = new List<dynamic>();
                List<dynamic> summaryQuerys = new List<dynamic>();
                List<dynamic> protectionDetailQuerys = new List<dynamic>();
                List<dynamic> cBA = new List<dynamic>();
                List<dynamic> lossHistoryDetailQuerys = new List<dynamic>();
                List<dynamic> lossExpValueBrkdwnDetailQuerys = new List<dynamic>();
                List<dynamic> attachmentPicsQuerys = new List<dynamic>();
                List<dynamic> surveyOutlineQuerys = new List<dynamic>();
                List<dynamic> dataGridConfigQuerys = new List<dynamic>();
                List<dynamic> otherExposuresQuerys = new List<dynamic>();
                List<dynamic> constructionQuerys = new List<dynamic>();
                List<dynamic> occupancyQuerys = new List<dynamic>();
                List<dynamic> surveySummaryGrading = new List<dynamic>();
                List<dynamic> sitePicturesQuerys = new List<dynamic>();
                List<WordObjectToHandle> wordObjectToHandles = new List<WordObjectToHandle>();


                if (conferredByQuery.Rows.Count > 0)
                {
                    List<object> columnProperties = new List<object>();
                    columnProperties.Add(new { ColumnIndex = 0, ColumnProperty = new TableCellWidth { Width = "1.1" } });
                    columnProperties.Add(new { ColumnIndex = 1, ColumnProperty = new TableCellWidth { Width = "2.21" } });
                    columnProperties.Add(new { ColumnIndex = 2, ColumnProperty = new TableCellWidth { Width = "3.92" } });
                    wordObjectToHandles.Add(new WordObjectToHandle()
                    {
                        ElementType = "table",
                        ElementName = "Conferred With",
                        PlaceHolder = "conferredwith",
                        Action = "add",
                        Attributes = columnProperties,  // inch
                    });
                    foreach (DataRow row in conferredByQuery.Rows)
                    {
                        dynamic obj = new
                        {
                            PersonName = row.Field<string>("PersonName") ?? "",
                            PersonDepartment = row.Field<string>("PersonDepartment") ?? "",
                            //GroupHeader = row.Field<string>("GroupHeader") ?? "",
                            IsData = row.Field<Int32>("IsData")
                        };
                        conferredByQuerys.Add(obj);
                    }


                    RenderData renderData = new RenderData();
                    renderData.Header = "Conferred With";
                    renderData.Data.AddRange(conferredByQuerys);
                    wordHandleConfig.RenderDataList.Add(renderData);
                }


                if (accompaniedByQuery.Rows.Count == 0)
                {
                    wordObjectToHandles.Add(new WordObjectToHandle()
                    {
                        ElementType = "table",
                        ElementName = "Accompanied By",
                        Action = "remove"
                    });
                }
                else
                {
                    List<object> columnProperties = new List<object>();
                    columnProperties.Add(new { ColumnIndex = 0, ColumnProperty = new TableCellWidth { Width = "1" } });
                    columnProperties.Add(new { ColumnIndex = 1, ColumnProperty = new TableCellWidth { Width = "2.21" } });
                    columnProperties.Add(new { ColumnIndex = 2, ColumnProperty = new TableCellWidth { Width = "3.92" } });
                    wordObjectToHandles.Add(new WordObjectToHandle()
                    {
                        ElementType = "table",
                        ElementName = "Accompanied By",
                        PlaceHolder = "accompaniedby",
                        Action = "add",
                        Attributes = columnProperties,//inch
                    });
                    foreach (DataRow row in accompaniedByQuery.Rows)
                    {
                        dynamic obj = new
                        {
                            PersonName = row.Field<string>("PersonName") ?? "",
                            PersonDepartment = row.Field<string>("PersonDepartment") ?? "",
                            //GroupHeader = row.Field<string>("GroupHeader") ?? "",
                            IsData = row.Field<Int32>("IsData")
                        };
                        accompaniedByQuerys.Add(obj);
                    }


                    RenderData renderData = new RenderData();
                    renderData.Header = "Accompanied By";
                    renderData.Data.AddRange(accompaniedByQuerys);
                    wordHandleConfig.RenderDataList.Add(renderData);
                }

                if (lossHistoryDetailQuery.Rows.Count == 0)
                {
                    wordObjectToHandles.Add(new WordObjectToHandle()
                    {
                        ElementType = "table",
                        ElementName = "Claim No.",
                        Action = "remove"
                    });
                }
                else
                {

                    foreach (DataRow row in lossHistoryDetailQuery.Rows)
                    {
                        dynamic obj = new
                        {
                            ClaimNo = row.Field<string>("ClaimNo") ?? "",
                            LossDate = row.Field<string>("LossDate") ?? "",
                            LossDescriptions = row.Field<string>("LossDescriptions") ?? "",
                            TotalLoss = row.Field<string>("TotalLoss") ?? ""
                        };
                        lossHistoryDetailQuerys.Add(obj);
                    }
                }

                if (lossExpValueBrkdwnDetailQuery.Rows.Count == 0)
                {
                    List<object> columnProperties = new List<object>();
                    columnProperties.Add(new { ColumnIndex = 1 });
                    wordObjectToHandles.Add(new WordObjectToHandle()
                    {
                        ElementType = "table",
                        ElementName = "Interest insured",
                        Action = "remove",
                        Attributes = columnProperties
                    });
                    wordObjectToHandles.Add(new WordObjectToHandle()
                    {
                        ElementType = "table",
                        ElementName = "Interest insured",
                        Action = "remove",
                        Attributes = columnProperties
                    });
                }
                else
                {
                    foreach (DataRow row in lossExpValueBrkdwnDetailQuery.Rows)
                    {
                        dynamic obj = new
                        {
                            RowNo = row.Field<Int64>("RowNo").ToString(),
                            PMLPercent = row.Field<string>("PMLPercent") ?? "",
                            PML = row.Field<decimal>("PML"),
                            ValueBrkdwnInterest = row.Field<string>("ValueBrkdwnInterest") ?? "",
                            ValueBrkdwnSum = row.Field<decimal>("ValueBrkdwnSum"),
                        };
                        lossExpValueBrkdwnDetailQuerys.Add(obj);
                    }
                }



                dynamic surveySource = null;
                if (surveyQuery.Rows.Count > 0)
                {
                    DataRow firstRow = surveyQuery.Rows[0];
                    surveySource = new
                    {
                        EastArea = firstRow.Field<string>("EastArea"),
                        EastContent = firstRow.Field<string>("EastContent"),
                        FactoryName = firstRow.Field<string>("FactoryName"),
                        NorthArea = firstRow.Field<string>("NorthArea"),
                        NorthContent = firstRow.Field<string>("NorthContent"),
                        SouthArea = firstRow.Field<string>("SouthArea"),
                        SouthContent = firstRow.Field<string>("SouthContent"),
                        WestArea = firstRow.Field<string>("WestArea"),
                        WestContent = firstRow.Field<string>("WestContent"),
                        FooterContent = firstRow.Field<string>("FooterContent"),
                        LossHistoryContent = firstRow.Field<string>("LossHistoryContent"),
                        SumSI = firstRow.Field<decimal>("SumSI"),
                        TotalPML = firstRow.Field<decimal>("TotalPML"),
                    };

                    RenderData renderData = new RenderData();
                    renderData.Header = "OVERVIEW";
                    renderData.Data.Add(new
                    {//Lưu ý các Content chỉ dành cho các từ trùng cho Layout hoặc Construction
                        ProductionProcessContent = firstRow.Field<string>("ProductionProcessContent") ?? "",
                        PublicFireBrigade = firstRow.Field<string>("PublicFireBrigade") ?? "",
                        MaintenanceProgram = firstRow.Field<string>("MaintenanceProgram") ?? "",
                        SpecialHazardContent = firstRow.Field<string>("SpecialHazardContent") ?? "",
                        ConstructionContent = firstRow.Field<string>("ConstructionContent") ?? "",
                        LayoutContent = firstRow.Field<string>("LayoutContent") ?? "",
                        FireSpreadRisk = firstRow.Field<string>("FireSpreadRisk") ?? "",
                        PlantLayoutContent = firstRow.Field<string>("PlantLayoutContent") ?? "",
                        ValueBrkdwnContent = firstRow.Field<string>("ValueBrkdwnContent") ?? "",
                        PMLContent = firstRow.Field<string>("PMLContent") ?? "",


                        //Comment in when Warehouse golive -2025-05-28

                        BuildingConditions = firstRow.Field<string>("BuildingConditions") ?? "",
                        Utilities = firstRow.Field<string>("Utilities") ?? "",
                        StorageConditions = firstRow.Field<string>("StorageConditions") ?? "",
                        FireProtection = firstRow.Field<string>("FireProtection") ?? "",
                        LightingProtection = firstRow.Field<string>("LightingProtection") ?? "",
                        SecurityControl = firstRow.Field<string>("SecurityControl") ?? "",



                        ConstructionBuildingPivot = firstRow.Field<string>("ConstructionBuildingPivot")
                    });
                    wordHandleConfig.RenderDataList.Add(renderData);

                    renderData = new RenderData();
                    renderData.Header = "REOpinion";
                    renderData.Data.Add(new
                    {
                        REOpinion = firstRow.Field<string>("REOpinion"),
                        LossHistoryContent = firstRow.Field<string>("LossHistoryContent"),
                    });
                    wordHandleConfig.RenderDataList.Add(renderData);

                }


                if (managementQuery.Rows.Count > 0)
                {
                    DataRow firstRow = managementQuery.Rows[0];
                    RenderData renderData = new RenderData();
                    renderData.IsDynamic = true;
                    renderData.Header = "MANAGEMENT";
                    renderData.IsCheck = true;
                    renderData.OutlineLevel = "Heading2";
                    renderData.DynamicKey = "AdditionalOutline";
                    renderData.Data.Add(new
                    {
                        SafetyMgmtContent = firstRow["SafetyMgmtContent"].ToString(),
                        PlantEmgPlanDrillsContent = firstRow["PlantEmgPlanDrillsContent"].ToString(),
                        SmokePolicyContent = firstRow["SmokePolicyContent"].ToString(),
                        IrregWorkCtrlContent = firstRow["IrregWorkCtrlContent"].ToString(),
                        MaintProgramContent = firstRow["MaintProgramContent"].ToString(),
                        HKContent = firstRow["HKContent"].ToString(),
                        AdditionalOutline = firstRow["AdditionalOutline"],

                        //Comment in when Warehouse golive -2025-05-28
                        OperationDetails = firstRow["OperationDetails"].ToString(),
                    });
                    wordHandleConfig.RenderDataList.Add(renderData);
                    wordObjectToHandles.Add(new WordObjectToHandle()
                    {
                        ElementType = "outline",
                        ElementName = "MANAGEMENT",
                        Action = "add",
                        IsDynamicOutline = true
                    });
                }

                if (otherExposuresQuery.Rows.Count > 0)
                {
                    DataRow firstRow = otherExposuresQuery.Rows[0];
                    RenderData renderData = new RenderData();
                    renderData.IsDynamic = true;
                    renderData.Header = "OTHEREXPOSURES";
                    renderData.OutlineLevel = "Heading2";
                    renderData.DynamicKey = "AdditionalOutline";
                    renderData.Data.Add(new
                    {
                        NaturalHazardPicContent = firstRow.Field<string>("NaturalHazardPicContent") ?? "",
                        Security = firstRow.Field<string>("Security") ?? "",
                        AdditionalOutline = firstRow["AdditionalOutline"]
                    });
                    wordHandleConfig.RenderDataList.Add(renderData);
                    wordObjectToHandles.Add(new WordObjectToHandle()
                    {
                        ElementType = "outline",
                        ElementName = "OTHEREXPOSURES",
                        Action = "add",
                        IsDynamicOutline = true
                    });
                }

                if (constructionQuery.Rows.Count > 0)
                {
                    DataRow firstRow = constructionQuery.Rows[0];
                    RenderData renderData = new RenderData();
                    renderData.IsDynamic = true;
                    renderData.Header = "CONSTRUCTION";
                    renderData.OutlineLevel = "Heading2";
                    renderData.DynamicKey = "AdditionalOutline";
                    renderData.Data.Add(new
                    {
                        AdditionalOutline = firstRow["AdditionalOutline"]
                    });
                    wordHandleConfig.RenderDataList.Add(renderData);
                    wordObjectToHandles.Add(new WordObjectToHandle()
                    {
                        ElementType = "outline",
                        ElementName = "CONSTRUCTION",
                        Action = "modify",
                        IsDynamicOutline = true
                    });
                }

                if (surveyData.SurveyTypeEnum?.Key == "Warehouse")
                {

                    if (protectionQuery.Rows.Count > 0)
                    {
                        DataRow firstRow = protectionQuery.Rows[0];
                        RenderData renderData = new RenderData();
                        renderData.IsDynamic = true;
                        renderData.Header = "PROTECTION";
                        renderData.OutlineLevel = "Heading2";
                        renderData.DynamicKey = "AdditionalOutline";
                        renderData.Data.Add(new
                        {
                            AdditionalOutline = firstRow["AdditionalOutline"]
                        });
                        wordHandleConfig.RenderDataList.Add(renderData);
                        wordObjectToHandles.Add(new WordObjectToHandle()
                        {
                            ElementType = "outline",
                            ElementName = "PROTECTION",
                            Action = "modify",
                            IsDynamicOutline = true
                        });
                    }

                    if (extFireExpExposuresQuery.Rows.Count > 0)
                    {
                        DataRow firstRow = extFireExpExposuresQuery.Rows[0];
                        RenderData renderData = new RenderData();
                        renderData.IsDynamic = true;
                        renderData.Header = "EXTFIREEXPEXPOSURES";
                        renderData.OutlineLevel = "Heading2";
                        renderData.DynamicKey = "AdditionalOutline";
                        renderData.Data.Add(new
                        {
                            NaturalHazardPicContent = firstRow.Field<string>("NaturalHazardPicContent") ?? "",
                            SurroundingAreas = firstRow.Field<string>("SurroundingAreas") ?? "",
                            AdditionalOutline = firstRow["AdditionalOutline"]
                        });
                        wordHandleConfig.RenderDataList.Add(renderData);
                        wordObjectToHandles.Add(new WordObjectToHandle()
                        {
                            ElementType = "outline",
                            ElementName = "EXTFIREEXPEXPOSURES",
                            Action = "add",
                            IsDynamicOutline = true
                        });
                    }
                }

                if (occupancyQuery.Rows.Count > 0)
                {
                    DataRow firstRow = occupancyQuery.Rows[0];
                    RenderData renderData = new RenderData();
                    renderData.IsDynamic = true;
                    renderData.Header = "OCCUPANCY";
                    //renderData.Alignment = JustificationValues.Center;
                    if (surveyData.SurveyTypeEnum?.Key == "Factory")
                    renderData.Indent = "0";
                    //renderData.Indent= "1282";
                    renderData.OutlineLevel = surveyData.SurveyTypeEnum?.Key == "Factory" ? "ListParagraph" : "Heading2";
                    renderData.DynamicKey = "AdditionalOutline";
                    renderData.Data.Add(new
                    {
                        AdditionalOutline = firstRow["AdditionalOutline"]//,
                                                                         //SubAttributes = firstRow["SubAttributes"]
                    });
                    wordHandleConfig.RenderDataList.Add(renderData);
                    wordObjectToHandles.Add(new WordObjectToHandle()
                    {
                        ElementType = "outline",
                        ElementName = "OCCUPANCY",
                        Action = "modify",
                        IsDynamicOutline = true
                    });
                }

                if (summaryQuery.Rows.Count > 0)
                {
                    DataRow firstRow = summaryQuery.Rows[0];
                    RenderData renderData = new RenderData();
                    renderData.Header = "SUMMARY";
                    renderData.Data.Add(new
                    {
                        CompanyIntroduction = firstRow.Field<string>("CompanyIntroduction"),
                        OperationsDetail = firstRow.Field<string>("OperationsDetail"),
                        RecentModifications = firstRow.Field<string>("RecentModifications"),
                        ExpansionPlan = firstRow.Field<string>("ExpansionPlan")
                    });
                    wordHandleConfig.RenderDataList.Add(renderData);
                }

                foreach (DataRow row in surveyOutlineQuery.Rows)
                {
                    dynamic obj = new
                    {
                        Id = row.Field<Int64>("OutlineId"),
                        Content = row.Field<string>("Content").ToString(),
                        PlaceHolder = row.Field<string>("Placeholder").ToString(),
                        IsParent = row.Field<int>("IsParent").ToString(),
                        OptionValue = row.Field<Int32>("OptionValue"),
                        SurveyId = row.Field<Int64>("SurveyId"),
                        OutlineId = row.Field<Int64>("OutlineId"),
                        MainEnable = row.Field<Boolean?>("MainEnable")
                    };
                    surveyOutlineQuerys.Add(obj);
                }

                foreach (DataRow row in dataGridConfigQuery.Rows)
                {
                    dynamic obj = new
                    {
                        OutlineId = row.Field<string>("OutlineId"),
                        DataField = row.Field<string>("DataField"),
                        TabName = row.Field<string>("TabName")
                    };
                    dataGridConfigQuerys.Add(obj);
                }

                if (constructionBuildingQuery.Rows.Count == 0)
                {
                    List<object> columnProperties = new List<object>();
                    columnProperties.Add(new { ColumnIndex = 1 });
                    wordObjectToHandles.Add(new WordObjectToHandle()
                    {
                        ElementType = "table",
                        ElementName = "Name Of Building",
                        Action = "remove",
                        Attributes = columnProperties
                    });
                }
                else
                {
                    foreach (DataRow row in constructionBuildingQuery.Rows)
                    {
                        dynamic obj = new
                        {
                            Ar = row.Field<string>("Area") ?? "",
                            No = row.Field<Int64>("RowNum"),
                            H = row.Field<string>("Height") ?? "",
                            P = row.Field<string>("Pillars") ?? "",
                            O = row.Field<string>("Occupancy") ?? "",
                            NOfBuilding = row.Field<string>("NameOfBuilding") ?? "",
                            ColB = row.Field<string>("ColumnBeam") ?? "",
                            ConstBuildNo = row.Field<string>("ConstructionBuildingNo") ?? "",
                            NoFloors = row.Field<string>("NumberOfFloors") ?? "",
                            NoStories = row.Field<string>("NumberOfStories") ?? "",
                            Rf = row.Field<string>("Roof") ?? "",
                            Wl = row.Field<string>("Wall") ?? "",
                            YBt = row.Field<string>("YearBuilt") ?? ""
                        };
                        cBA.Add(obj);
                    }
                }

                foreach (DataRow row in attachmentPicsQuery.Rows)
                {
                    dynamic obj = new
                    {
                        Id = row.Field<Int64>("Id"),
                        AttachmentId = row.Field<Int64>("AttachmentId"),
                        SubDirectory = row.Field<string>("SubDirectory") ?? "",
                        AttachmentNote = row.Field<string>("SitePicturesContent") ?? "",
                        OutlinePlaceholder = row.Field<string>("OutlinePlaceholder") ?? "",
                        Image = MakeMiniWordPicture(System.IO.Path.Combine(wordHandleConfig.BlobPath, row.Field<string>("SubDirectory") ?? ""), wordHandleConfig.NoImagePath),
                        OutlineId = row.Field<Int64>("OutlineId"),
                        FullSubDirectory = System.IO.Path.Combine(wordHandleConfig.BlobPath, row.Field<string>("SubDirectory") ?? ""),
                        Outline = row.Field<string>("Outline")
                    };
                    if (obj.Image.Bytes != null)
                    attachmentPicsQuerys.Add(obj);
                }


                foreach (DataRow row in sitePicturesQuery.Rows)
                {
                    dynamic obj = new
                    {
                        Id = row.Field<Int64>("Id"),
                        AttachmentId = row.Field<Int64>("AttachmentId"),
                        SubDirectory = row.Field<string>("SubDirectory") ?? "",
                        AttachmentNote = row.Field<string>("SitePicturesContent") ?? "",
                        Image = MakeMiniWordPicture(System.IO.Path.Combine(wordHandleConfig.BlobPath, row.Field<string>("SubDirectory") ?? ""), wordHandleConfig.NoImagePath),
                        OutlineId = row.Field<Int64>("OutlineId"),
                        FullSubDirectory = System.IO.Path.Combine(wordHandleConfig.BlobPath, row.Field<string>("SubDirectory") ?? ""),
                        Outline = row.Field<string>("Outline")
                    };
                    if (obj.Image.Bytes != null)
                        sitePicturesQuerys.Add(obj);
                }


                string processOverviewImagePath = "";
                MiniWordPicture? overViewImage = null;
                if (attachmentPicsQuerys.Any(w => w.Outline == "OVERVIEW" && w.AttachmentId == surveyData.OverViewAttachmentId))
                {
                    //Attachment attachment = attachmentsReturn.First(w => w.OutlineFK.Content == "OVERVIEW");
                    processOverviewImagePath = attachmentPicsQuerys.Where(w => w.Outline == "OVERVIEW" && w.AttachmentId == surveyData.OverViewAttachmentId).First().FullSubDirectory;
                    string noImagePath = Path.Combine(wordHandleConfig.BlobPath, wordHandleConfig.NoImagePath);
                    if (System.IO.File.Exists(processOverviewImagePath))
                        overViewImage = new MiniWordPicture() { Path = processOverviewImagePath, Width = ConfigConstant._overViewPictureWidth, Height = ConfigConstant._overViewPictureHeight };
                    else
                        overViewImage = new MiniWordPicture() { Path = noImagePath, Width = ConfigConstant._overViewPictureWidth, Height = ConfigConstant._overViewPictureHeight };
                }
                IDictionary<string, object> dynamicObj = new ExpandoObject { };
                //dynamic gradings = new { };
                if (surveyEvaluationsQuery.Rows.Count > 0)
                {
                    DataRow firstRow = surveyEvaluationsQuery.Rows[0];
                    wordHandleConfig.RiskGrading["overallgrading"] = new { data = firstRow.Field<string>("Overall"), color = firstRow.Field<string>("OverallColor") };
                    wordHandleConfig.RiskGrading["managementgrading"] = new { data = firstRow.Field<string>("Management"), color = firstRow.Field<string>("ManagementColor") };
                    wordHandleConfig.RiskGrading["constructiongrading"] = new { data = firstRow.Field<string>("Construction"), color = firstRow.Field<string>("ConstructionColor") };
                    wordHandleConfig.RiskGrading["occupancygrading"] = new { data = firstRow.Field<string>("Occupancy"), color = firstRow.Field<string>("OccupancyColor") };
                    wordHandleConfig.RiskGrading["protectiongrading"] = new { data = firstRow.Field<string>("Protection"), color = firstRow.Field<string>("ProtectionColor") };
                    wordHandleConfig.RiskGrading["exposuregrading"] = new { data = firstRow.Field<string>("ExtFireExpExposures"), color = firstRow.Field<string>("ExtFireExpExposuresColor") };
                    wordHandleConfig.RiskGrading["naturalhazardgrading"] = new { data = firstRow.Field<string>("OtherExposures"), color = firstRow.Field<string>("OtherExposuresColor") };
                    wordHandleConfig.RiskGrading["lossestimategrading"] = new { data = firstRow.Field<string>("LossExpValueBrkdwn"), color = firstRow.Field<string>("LossExpValueBrkdwnColor") };
                    wordHandleConfig.RiskGrading["losshistorygrading"] = new { data = firstRow.Field<string>("LossHistory"), color = firstRow.Field<string>("LossHistoryColor") };


                    object statusData = new object();
                    statusData = JsonConvert.DeserializeObject(firstRow.Field<string>("StatusList"));
                    wordHandleConfig.RiskGrading["statuslist"] = new { data = statusData, color = "" };
                }


                wordHandleConfig.PicturesAttachments = attachmentPicsQuerys;
                wordHandleConfig.SurveyOptions = surveyOutlineQuerys;
                wordHandleConfig.WordObjectToHandle = wordObjectToHandles;
                wordHandleConfig.DataGridConfig = dataGridConfigQuerys;
                wordHandleConfig.FooterContent = surveyData.ClientName;
                //Update date: 2025-04-22
                WordUtil.GenerateFilesFromDynamic(
                    //wordHandleConfig.TemplatePath,
                    //wordHandleConfig.MainProcessPathFolder,
                    //wordHandleConfig.WordPrerenderPath,
                    //surveyData.SurveyNo,
                    wordHandleConfig
                    );





                foreach (DataRow row in occupancyDetailQuery.Rows)
                {
                    dynamic obj = new
                    {
                        Quantity = row.Field<string>("Quantity") ?? "",
                        InstalledPosition = row.Field<string>("InstalledPosition") ?? "",
                        TechnicalSpec = row.Field<string>("TechnicalSpec") ?? "",
                        UtilityTypeId = row.Field<long?>("UtilityTypeId"),
                        UtilityType = row.Field<string?>("UtilityType"),
                        SurveyId = row.Field<long?>("SurveyId"),
                        Capacity = row.Field<string>("Capacity") ?? "",
                        IndGasSupCategoryTypeId = row.Field<long?>("IndGasSupCategoryTypeId"),
                    };
                    occupancyDetailQuerys.Add(obj);
                }
                foreach (DataRow row in protectionDetailQuery.Rows)
                {
                    dynamic obj = new
                    {
                        FirefightingEquipment = row.Field<string>("FirefightingEquipment") ?? "",
                        Availability = row.Field<string>("Availability") ?? "",
                        CoverAreasRemarks = row.Field<string>("CoverAreasRemarks") ?? ""
                    };
                    protectionDetailQuerys.Add(obj);
                }


                foreach (DataRow row in occupancyGasDetailQuery.Rows)
                {
                    dynamic obj = new
                    {
                        Quantity = row.Field<string>("Quantity") ?? "",
                        InstalledPosition = row.Field<string>("InstalledPosition") ?? "",
                        TechnicalSpec = row.Field<string>("TechnicalSpec") ?? "",
                        UtilityTypeId = row.Field<long?>("UtilityTypeId"),
                        SurveyId = row.Field<long?>("SurveyId"),
                        Capacity = row.Field<string>("Capacity") ?? "",
                        IndGasSupCategoryTypeId = row.Field<long?>("IndGasSupCategoryTypeId"),
                        IndGasSupCategoryType = row.Field<string?>("IndGasSupCategoryType")
                    };
                    occupancyGasDetailQuerys.Add(obj);
                }





                string totalsi = surveySource.SumSI.ToString();
                string totalpml = surveySource.TotalPML.ToString();

                //if (posNegQuery.Rows.Count > 0)
                //{
                //    DataRow firstRow = posNegQuery.Rows[0];

                //    positiveContent = firstRow["PositiveContent"].ToString();
                //    negativeContent = firstRow["NegativeContent"].ToString();
                //}
                //if (surveyData.PosNegAspects.Any(f => f.PosNegTypeEnum.Name == "Positive"))
                // positiveContent = surveyData.PosNegAspects.FirstOrDefault(f => f.PosNegTypeEnum.Name == "Positive").PosNegContent;
                //if (surveyData.PosNegAspects.Any(f => f.PosNegTypeEnum.Name == "Negative"))
                // negativeContent = surveyData.PosNegAspects.FirstOrDefault(f => f.PosNegTypeEnum.Name == "Negative").PosNegContent;
                dynamic value = new
                {
                    cBA = cBA.ToArray(),
                    clientname = surveyData.ClientName,
                    locationaddress = surveyData.LocationAddress,
                    dateofvisit = surveyData.DateOfVisit?.ToLongDateString(),
                    lattitudelongitude = surveyData.LatitudeLongitude,
                    conferredwithcompany = surveyData.CompanyName,
                    totalsi = totalsi,
                    totalpml = totalpml,
                    sitepicture = sitePicturesQuerys.ToArray(),
                    levbr = lossExpValueBrkdwnDetailQuerys.ToArray(),
                    eastarea = surveySource.EastArea,
                    eastcontent = surveySource.EastContent,
                    factoryname = surveySource.FactoryName,
                    northarea = surveySource.NorthArea,
                    northcontent = surveySource.NorthContent,
                    southarea = surveySource.SouthArea,
                    southcontent = surveySource.SouthContent,
                    westarea = surveySource.WestArea,
                    westcontent = surveySource.WestContent,
                    footercontent = surveySource.FooterContent,
                    ptcpconferred = conferredByQuerys.ToArray(),
                    ownership = surveyData.Ownership,
                    occupancy = surveyData.Occupancy,
                    surveyedpremises = surveyData.SurveyedPremises,
                    surveyedby = surveyData.SurveyedBy,
                    surveyedbydept = surveyData.Department,
                    lhdetail = lossHistoryDetailQuerys.ToArray(),
                    managementsentence = "",
                    constructionsentence = "",
                    occupancysentence = "",
                    protectionsentence = "",
                    exposuresentence = "",
                    naturalhazardsentence = "",
                    lossestimatesentence = "",
                    losshistorysentence = "",
                    overviewattachment = overViewImage ?? null,
                    occupancydetails = occupancyDetailQuerys.ToArray(),
                    occupancygasdetails = occupancyGasDetailQuerys.ToArray(),
                    protectiondetails = protectionDetailQuerys.ToArray()

                };
                MiniWord.SaveAsByTemplate(pathExportFile, wordHandleConfig.WordPrerenderPath, value);


                MiniWord.SaveAsByTemplate(stream, wordHandleConfig.WordPrerenderPath, value);
                return stream;
            }
            catch (Exception ex)
            {
                Handler.ErrorException(ex, wordHandleConfig.BlobPath);
                throw new Exception("WordHelper: " + ex.Message);
                //return new MemoryStream();
            }
            //stream.Seek(0, SeekOrigin.Begin);
        }
        public static MiniWordPicture MakeMiniWordPicture(string fullPath, string NO_IMAGE, Int64 width = 375, Int64 height = 257)
        {
            bool isPortrait = false;
            MiniWordPicture miniWordPicture = new MiniWordPicture();
            miniWordPicture.Path = System.IO.File.Exists(fullPath) ? fullPath : NO_IMAGE;
            if (System.IO.File.Exists(fullPath))
                miniWordPicture.Bytes = WordUtil.ImageLoad(fullPath, out isPortrait);
            miniWordPicture.Width = isPortrait ? (Int64)(width / 2) : width;
            miniWordPicture.Height = height;
            return miniWordPicture;
        }

    }
}
