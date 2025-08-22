using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RESurveyTool.Common.Constant
{
    public static class ConfigConstant
    {
        public static int _maxWordPictureWidth = GetConfigValue("_maxWordPictureWidth", 600);
        public static int _maxTableWidth = GetConfigValue("_maxTableWidth", 600);
        public static int _overViewPictureWidth = GetConfigValue("_overViewPictureWidth", 528);
        public static int _overViewPictureHeight = GetConfigValue("_overViewPictureHeight", 384);
        public static int _orientationExifId = GetConfigValue("_orientationExifId", 0x0112);
        public static int _transform2D90Deg = GetConfigValue("_transform2D90Deg", 5400000);

        public static double _outlinePictureHeightInchL = GetConfigValue("_outlinePictureHeightInchL", 1.8);
        public static double _outlinePictureWidthInchL = GetConfigValue("_outlinePictureWidthInchL", 2.4);
        public static double _outlinePictureHeightInchP = GetConfigValue("_outlinePictureHeightInchP", 1.8);
        public static double _outlinePictureWidthInchP  = GetConfigValue("_outlinePictureWidthInchP", 1.21);
        public static double _plantLayoutPictureWidth = GetConfigValue("_plantLayoutPictureWidth", 9.5);
        public static double _plantLayoutPictureHeight = GetConfigValue("_plantLayoutPictureHeight", 4.5);
        public static double _footerLabelXOffset = GetConfigValue("_footerLabelXOffset", 16);
        public static double _footerLabelYOffset = GetConfigValue("_footerLabelYOffset", 27.2);
        public static long _inchToEmu = GetConfigValue("_inchToEmu", 914400L);
        public static long _dpiToEmu = GetConfigValue("_dpiToEmu", 720000L);
        public static long _cmToEmu = GetConfigValue("_cmToEmu", 360000L);
        public static long _headerMarginTop = GetConfigValue("_headerMarginTop", 2000L);
        public static long _inchToTwip = GetConfigValue("_inchToTwip", 1440L); //Dxa
        public static double _outlineTablePictureWidthInch = GetConfigValue("_outlineTablePictureWidthInch", 3.0);
        public static double _plantLayoutTablePictureWidthInch = GetConfigValue("_plantLayoutTablePictureWidthInch", 9.5);
        public static double _leftPlantLayoutTableIndent = GetConfigValue("_leftPlantLayoutTableIndent", 0.7);
        public static double _outlinePicturePerRow = GetConfigValue("_outlinePicturePerRow", 3.0);
        public static int _leftTableIndent = GetConfigValue("_leftTableIndent", -800);
        public static string _defaultFont = GetConfigValue("_defaultFont", "Asap");
        public static string _defaultSize = GetConfigValue("_defaultSize", "22");
        public static string _prefixPageLabel = GetConfigValue("_prefixPageLabel", "");
        public static string _dynamicSpaceBetweenLines = GetConfigValue("_dynamicSpaceBetweenLines", "0.9");
        public static string _heading1ColorHex = GetConfigValue("_heading1ColorHex", "0070C0");
        public static string[] windingsFonts = GetConfigValue("windingsFonts", "Wingdings,Wingdings 2,Wingdings 3,Webdings").Split(',');

        //public const string _logConnection = "Integrated Security=True;Server=.\\SQLSERVER2022;Database=RESurveyToolLog;uid=sa;pwd=password@123";
        public static string _logConnection = ConfigurationManager.ConnectionStrings["LogConnection"].ConnectionString;

        private static int GetConfigValue(string key, int defaultValue)
        {
            return int.TryParse(ConfigurationManager.AppSettings[key], out int result) ? result : defaultValue;
        }

        private static long GetConfigValue(string key, long defaultValue)
        {
            return long.TryParse(ConfigurationManager.AppSettings[key], out long result) ? result : defaultValue;
        }

        private static double GetConfigValue(string key, double defaultValue)
        {
            return double.TryParse(ConfigurationManager.AppSettings[key], out double result) ? result : defaultValue;
        }

        private static string GetConfigValue(string key, string defaultValue)
        {
            return ConfigurationManager.AppSettings[key] ?? defaultValue;
        }
    }
}
