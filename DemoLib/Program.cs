

//var connection = ConfigurationManager.AppSettings["LogConnection"].Value;
using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Drawing.Diagrams;
using DocumentFormat.OpenXml.Office2010.PowerPoint;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using RESurveyTool.Common.Common;
using SurveyReportRE.Models.Migration.Business.Form;
using System.Configuration;


//Survey survey = new Survey();
//survey.Id = 315;
//survey.SurveyNo = "SVRE.0225.259";
//string PATH_TEMPLATE = "D:\\Source\\MySource\\TMIVReport\\TMIVReport\\SurveyReportRE\\bin\\Debug\\Attachment\\Template\\RE_Survey_Template_20250220.docx";
//string BLOB_PATH = "D:\\Source\\MySource\\TMIVReport\\TMIVReport\\SurveyReportRE\\bin\\Debug\\Attachment";
//string ConnectionString = "Persist Security Info=True;Server=.\\SQLSERVER2022;Database=RESurveyTool;uid=sa;pwd=password@123;Connection Timeout=60;MultipleActiveResultSets=true;TrustServerCertificate=True;";
//string NO_IMAGE = "D:\\Source\\MySource\\TMIVReport\\TMIVReport\\SurveyReportRE\\bin\\Debug\\Attachment\\System\\No_Image_Available.jpg";

string path = "D:\\Example\\Reading.docx";
string OutputPath = "D:\\Example\\Result";
string matchingKeyWord = "CONDITIONS";
string matchingSectionBegin = "{{BeginSection}}";
string matchingSectionEnd = "{{EndSection}}";
bool beginSection = false;
bool endSection = false;    
using (WordprocessingDocument checkTables = WordprocessingDocument.Open(path, true))
{
    MainDocumentPart mainPart = checkTables.MainDocumentPart;
    var body = mainPart.Document.Body;
    var result = new List<(string Heading, List<string> ContentLines)>();
    List<string> contentLines = new List<string>();
    bool startToWrite = false;
    foreach (var table in body.Elements<Table>())
    {
        foreach (var row in table.Elements<TableRow>())
        {
            var cells = row.Elements<TableCell>().ToList();

            for (int i = 0; i < cells.Count - 1; i++)
            {
                string cellText = string.Join("", cells[i].Descendants<Text>().Select(t => t.Text)).Trim();
                if (cellText.Contains(matchingKeyWord)) startToWrite = true;
                if (startToWrite)
                {
                    var rightCell = cells[i + 1];

                    string title = "";
                    var paragraphs = rightCell.Elements<Paragraph>().ToList();
                    foreach (var para in paragraphs)
                    {

                        string checkSectionKeyWord = string.Join("", para.InnerText.Trim()); ;
                        if (checkSectionKeyWord.Contains(matchingSectionBegin)) beginSection = true;
                        if (checkSectionKeyWord.Contains(matchingSectionEnd)) endSection = true;

                        if (beginSection)
                        {
                            bool isBold = para
                           .Descendants<Run>()
                           .Any(r => r.RunProperties?.Bold != null);

                            bool isUnderLine = para
                          .Descendants<Run>()
                          .Any(r => r.RunProperties?.Underline != null);
                        

                            if (isBold || isUnderLine)
                            { 
                                result.Add((title, contentLines)); 
                                contentLines = new List<string>(); 
                                title = string.Join("", para.Descendants<Text>().Select(t => t.Text)); 
                                continue; 
                            }
                            else
                            {
                                string paraText = string.Join("", para.Descendants<Text>().Select(t => t.Text));
                                contentLines.Add(paraText);
                            }
                        }
                        if (endSection) beginSection = false;   
                    }
                    
                    break;
                }
            }
        }
    }
    if (result.Count > 0)
    {

    int noTitleNumber = 1;
    foreach (var item in result)
    {
        string fileName = "";
        if (string.IsNullOrEmpty(item.Heading))
        {
            fileName = $"No_Title_{noTitleNumber}";
            noTitleNumber++;
        }
        else { 
            fileName = item.Heading.Replace("/", " ").Replace(":", ""); 
        }

        if (item.ContentLines.Count > 0)
        {
            string contentLiness = string.Join("\n", item.ContentLines.Where(w => !string.IsNullOrEmpty(w)));
            string directoryFileName = Path.Combine(OutputPath, matchingKeyWord, fileName + ".txt");

            if (!Directory.Exists(Path.Combine(OutputPath, matchingKeyWord)))
            {
                 Directory.CreateDirectory(Path.Combine(OutputPath, matchingKeyWord));
            }
            try
            {
                 File.WriteAllText(directoryFileName, contentLiness);
            }
            catch
            {
            }
        }


    }
    }
    else
    {
        Console.WriteLine("Please put {{BeginSection}} and {{EndSection}} in your document");
    }

}
try
{
    //WordHelper.GenerateWord(survey, PATH_TEMPLATE, nameof(Survey), BLOB_PATH, ConnectionString, NO_IMAGE);

}
catch (Exception ex)
{

}

//string inputPath = "D:\\Source\\MySource\\TMIVReport\\TMIVReport\\SurveyReportRE\\bin\\Debug\\Attachment\\Survey\\SVRE.0225.259.docx";
//string outputPath = "D:\\Source\\MySource\\TMIVReport\\TMIVReport\\SurveyReportRE\\bin\\Debug\\Attachment\\Survey\\SVRE.0225.259_output.docx";
//File.Copy(inputPath, outputPath, true);

//using (WordprocessingDocument checkTables = WordprocessingDocument.Open(outputPath, true))
//{
//    MainDocumentPart mainPart = checkTables.MainDocumentPart;
//    var body = mainPart.Document.Body;
//    foreach (var paragraph in body.Elements<OpenXmlElement>().ToList())
//    {

//        if (paragraph is Table)
//        {
//            var nextElement = paragraph.NextSibling();
//            if (nextElement.InnerText == "")
//            {

//            }
//            //nextElement.Remove();
//        }

//        if (paragraph.InnerText.Contains("Day la noi dung"))
//        {
//            paragraph.Remove();
//            continue;
//        }
//        //if (paragraph.InnerText == "")
//        //{
//        //    paragraph.Remove();
//        //}

//        var descentdants = paragraph.Descendants().ToList();
//        int count = 0;
//        foreach (var item in descentdants)
//        {
//            if (item.LocalName == "tbl")
//            {

//            }
//            if (item.InnerText == "hjshdhasdjasdj")
//            {

//            }
//            if (item.InnerText == "" && item.LocalName == "p")
//            {
//                //item.Remove();
//            }
//            count++;
//        }
//    }


//    checkTables.MainDocumentPart.Document.Save();
//}



//Interop
//// See https://aka.ms/new-console-template for more information
//using Microsoft.Office.Interop.Word;

//Application wordApp = new Application();
//Document wordDoc = null;
//string wordPath = "D:\\Source\\MySource\\TMIVReport\\TMIVReport\\SurveyReportRE\\bin\\Debug\\net8.0\\Attachment\\Survey\\SVRE.1124.122.docx";
//string pdfOutputPath = "D:\\Source\\MySource\\TMIVReport\\TMIVReport\\SurveyReportRE\\bin\\Debug\\net8.0\\Attachment\\Survey\\SVRE.1124.122_Convert.pdf";
//try
//{
//    // Mở tài liệu Word
//    wordDoc = wordApp.Documents.Open(wordPath);

//    // Lưu tài liệu dưới dạng PDF
//    wordDoc.SaveAs(pdfOutputPath, WdSaveFormat.wdFormatPDF);

//}
//catch (Exception ex)
//{

//}
//finally
//{
//    // Đóng tài liệu và ứng dụng Word
//    if (wordDoc != null)
//    {
//        wordDoc.Close(false);
//    }

//    wordApp.Quit();
//}