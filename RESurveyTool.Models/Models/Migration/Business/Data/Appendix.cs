using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using SurveyReportRE.Models.Migration.Base;

namespace SurveyReportRE.Models.Migration.Business.Data
{
    public class Appendix : BaseModel
    {
        public string PlantLayoutContent { get; set; } = "";

    }
}
