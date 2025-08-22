using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using SurveyReportRE.Models.Migration.Business.Data;
using SurveyReportRE.Models.Migration.Business.Form;
using SurveyReportRE.Models.Migration.Business.MasterData;

namespace SurveyReportRE.Pages
{
    public class Client_FormModel : PageModel
    {
        //private readonly ILogger<Client_FormModel> _logger;
        public static string ModelName { get; set; } = "";
        public static string FKModelName { get; set; } = "";
        public static string SchemeModelName { get; set; } = "";
        private static int Id { get; set; }
        private static int FKId { get; set; } private static string JsonConfig {get;set;} = "";
        private readonly IBaseRepository<Survey> _surveyRepository;

        public Client_FormModel(ILogger<Client_FormModel> logger)
        {
            //_logger = logger;
        }
        public void OnGet(int? pageNum)
        {
            if (pageNum != 0)
            {
                
            }
            ModelName = nameof(Client);
            SchemeModelName = nameof(Client);
            ViewData[nameof(Id)] = pageNum ?? 0;
        }
    }
}
