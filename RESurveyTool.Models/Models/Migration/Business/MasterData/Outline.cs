using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using SurveyReportRE.Models.Migration.Base;
using SurveyReportRE.Models.Migration.Config;

namespace SurveyReportRE.Models.Migration.Business.MasterData
{
    public class Outline : BaseModel
    {
        public long? ListStyleId { get; set; }  // Loại của mục
        public long? ParentId { get; set; } 
        public EnumData? ListStyleFK { get; set; }
        public string Content { get; set; } = ""; // Nội dung của mục
        public string FontStyle { get; set; } = ""; // Kiểu chữ (e.g., "Arial", "Times New Roman")
        public int FontSize { get; set; }  // Cỡ chữ
        public string FontColor { get; set; } = ""; // Màu chữ (e.g., "#000000" cho đen)
        public bool IsBold { get; set; }  // In đậm
        public bool IsItalic { get; set; }  // In nghiêng
        public bool IsUnderline { get; set; }  // Gạch chân
        public long? SurveyTypeId { get; set; }
        public EnumData? SurveyTypeEnum { get; set; }
        public string PlaceHolder { get; set; } = "";
    }

}
