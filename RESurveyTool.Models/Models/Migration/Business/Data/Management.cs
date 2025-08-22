using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using SurveyReportRE.Models.Migration.Base;

namespace SurveyReportRE.Models.Migration.Business.Data
{
    public class Management : BaseModel 
    {
        
        public string  HKContent                    { get; set; } = "";
        public string  IrregWorkCtrlContent         { get; set; } = "";
        public string  MaintProgramContent          { get; set; } = "";
        public string  PlantEmgPlanDrillsContent    { get; set; } = "";
        public string  SafetyMgmtContent            { get; set; } = "";
        public string  SmokePolicyContent           { get; set; } = "";
        public string ChemicalStorageSafety { get; set; } = "";
        public string HotWorks { get; set; } = "";
        public byte[]? AdditionalOutline { get; set; }
        public string OperationDetails { get; set; } = "";
    }
}
