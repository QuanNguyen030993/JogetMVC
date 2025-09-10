//using DocumentFormat.OpenXml.Wordprocessing;
//using MiniSoftware;
//using SurveyReportRE.Common;
//using SurveyReportRE.Models.Migration.Business.Data;
//using SurveyReportRE.Models.Migration.Business.Form;
//using SurveyReportRE.Models.Migration.Business.MasterData;
//using Outline = SurveyReportRE.Models.Migration.Business.MasterData.Outline;
//using System.Data;
//using Syncfusion.DocIO.DLS;
//using Syncfusion.DocIO;
//using Syncfusion.DocIORenderer;
//using Syncfusion.Pdf;
//using Syncfusion.Pdf.Graphics;
//using System.Net.Http;
//using Syncfusion;
//using DocumentFormat.OpenXml.Office2010.PowerPoint;
//using RESurveyTool.Common.Constant;
//using System.Dynamic;
//using Newtonsoft.Json;
//using SurveyReportRE.Models.Migration.Business.LCForm;
//using Org.BouncyCastle.Crypto.Paddings;

//namespace RESurveyTool.Common.Common
//{
//    public static class PowerPointHelper
//    {
//        //Update date: 2025-04-22
//        //public static MemoryStream GenerateWord(Survey surveyData, string PATH_TEMPLATE, string filePath, string blobPath, string _connectionString, string NO_IMAGE)
//        public static MemoryStream GeneratePowerPoint(LossControl lossControlData, string _connectionString)
//        {
//            try
//            {
//                int maxPictureWidth = ConfigConstant._maxWordPictureWidth;
//                var inputFilePath = "D:\\output-code.pptx";
//                MemoryStream stream = new MemoryStream(PowerPointUtil.CreatePresentation(inputFilePath));

//                //byte[] fileBytes = File.ReadAllBytes(inputFilePath);
//                //var stream = new MemoryStream(fileBytes); //  cứ xem là 1 đường dẫn 

//                string typeError = "FileNotFound";

//                //   DataTable surveyQuery = DataUtil.ExecuteStoredProcedureReturn(_connectionString, "usp_Survey_GetData",
//                //        ("@SurveyId", surveyData.Id), ("@Type", 1));
//                //   DataTable posNegQuery = DataUtil.ExecuteStoredProcedureReturn(_connectionString, "usp_Survey_GetData",
//                //       ("@SurveyId", surveyData.Id), ("@Type", 2));
//                //   DataTable managementQuery = DataUtil.ExecuteStoredProcedureReturn(_connectionString, "usp_Survey_GetData",
//                //       ("@SurveyId", surveyData.Id), ("@Type", 5));
//                //   DataTable occupancyDetailQuery = DataUtil.ExecuteStoredProcedureReturn(_connectionString, "usp_Survey_GetData",
//                //       ("@SurveyId", surveyData.Id), ("@Type", 3));
//                //   DataTable occupancyGasDetailQuery = DataUtil.ExecuteStoredProcedureReturn(_connectionString, "usp_Survey_GetData",
//                //       ("@SurveyId", surveyData.Id), ("@Type", 4));
//                //   DataTable conferredByQuery = DataUtil.ExecuteStoredProcedureReturn(_connectionString, "usp_Survey_GetData",
//                //       ("@SurveyId", surveyData.Id), ("@Type", 6));
//                //   DataTable accompaniedByQuery = DataUtil.ExecuteStoredProcedureReturn(_connectionString, "usp_Survey_GetData",
//                //       ("@SurveyId", surveyData.Id), ("@Type", 7));
//                //   DataTable summaryQuery = DataUtil.ExecuteStoredProcedureReturn(_connectionString, "usp_Survey_GetData",
//                //       ("@SurveyId", surveyData.Id), ("@Type", 8));
//                //   DataTable protectionDetailQuery = DataUtil.ExecuteStoredProcedureReturn(_connectionString, "usp_Survey_GetData",
//                //       ("@SurveyId", surveyData.Id), ("@Type", 9));
//                //   DataTable constructionBuildingQuery = DataUtil.ExecuteStoredProcedureReturn(_connectionString, "usp_Survey_GetData",
//                //        ("@SurveyId", surveyData.Id), ("@Type", 10));
//                //   DataTable lossHistoryDetailQuery = DataUtil.ExecuteStoredProcedureReturn(_connectionString, "usp_Survey_GetData",
//                //        ("@SurveyId", surveyData.Id), ("@Type", 11));
//                //   DataTable lossExpValueBrkdwnDetailQuery = DataUtil.ExecuteStoredProcedureReturn(_connectionString, "usp_Survey_GetData",
//                //        ("@SurveyId", surveyData.Id), ("@Type", 12));
//                //   DataTable attachmentPicsQuery = DataUtil.ExecuteStoredProcedureReturn(_connectionString, "usp_Survey_GetData",
//                //        ("@SurveyId", surveyData.Id), ("@Type", 13));
//                //   DataTable surveyOutlineQuery = DataUtil.ExecuteStoredProcedureReturn(_connectionString, "usp_Survey_GetData",
//                //        ("@SurveyId", surveyData.Id), ("@Type", 14));
//                //   DataTable dataGridConfigQuery = DataUtil.ExecuteStoredProcedureReturn(_connectionString, "usp_Survey_GetData",
//                //        ("@SurveyId", surveyData.Id), ("@Type", 15));
//                //   DataTable otherExposuresQuery = DataUtil.ExecuteStoredProcedureReturn(_connectionString, "usp_Survey_GetData",
//                //        ("@SurveyId", surveyData.Id), ("@Type", 16));
//                //   DataTable constructionQuery = DataUtil.ExecuteStoredProcedureReturn(_connectionString, "usp_Survey_GetData",
//                //        ("@SurveyId", surveyData.Id), ("@Type", 17));
//                //   DataTable occupancyQuery = DataUtil.ExecuteStoredProcedureReturn(_connectionString, "usp_Survey_GetData",
//                //       ("@SurveyId", surveyData.Id), ("@Type", 18));
//                //   DataTable surveyEvaluationsQuery = DataUtil.ExecuteStoredProcedureReturn(_connectionString, "usp_Survey_GetData",
//                //      ("@SurveyId", surveyData.Id), ("@Type", 19));
//                //   DataTable sitePicturesQuery = DataUtil.ExecuteStoredProcedureReturn(_connectionString, "usp_Survey_GetData",
//                //      ("@SurveyId", surveyData.Id), ("@Type", 20));
//                //   DataTable extFireExpExposuresQuery = DataUtil.ExecuteStoredProcedureReturn(_connectionString, "usp_Survey_GetData",
//                // ("@SurveyId", surveyData.Id), ("@Type", 21));
//                //   DataTable protectionQuery = DataUtil.ExecuteStoredProcedureReturn(_connectionString, "usp_Survey_GetData",
//                //("@SurveyId", surveyData.Id), ("@Type", 22));


//                return stream;
//            }
//            catch (Exception ex)
//            {
//                //Handler.ErrorException(ex, wordHandleConfig.BlobPath);
//                throw new Exception("PowerPointHelper: " + ex.Message);
//                //return new MemoryStream();
//            }
//            //stream.Seek(0, SeekOrigin.Begin);
//        }
//        public static MiniWordPicture MakeMiniWordPicture(string fullPath, string NO_IMAGE, Int64 width = 375, Int64 height = 257)
//        {
//            bool isPortrait = false;
//            MiniWordPicture miniWordPicture = new MiniWordPicture();
//            miniWordPicture.Path = System.IO.File.Exists(fullPath) ? fullPath : NO_IMAGE;
//            if (System.IO.File.Exists(fullPath))
//                miniWordPicture.Bytes = WordUtil.ImageLoad(fullPath, out isPortrait);
//            miniWordPicture.Width = isPortrait ? (Int64)(width / 2) : width;
//            miniWordPicture.Height = height;
//            return miniWordPicture;
//        }

//    }
//}
