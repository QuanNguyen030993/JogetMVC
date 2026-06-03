using ERPCore.Models.Base;
using ERPCore.Models.Models.Parsing;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.SharePoint.WebControls;

namespace ERPCore.Pages
{
    public class Quotation_FormModel : PageModel
    {
        //private readonly ILogger<Quotation_FormModel> _logger;
        public static string ModelName { get; set; } = "";
        private static string Id { get; set; }
        private static string Guid { get; set; }


        public Quotation_FormModel()
        {
            //_quotationRepository = new BaseRepository<Quotation>(configuration, httpContextAccessor);
            //_logger = logger;
        }
        public async void OnGet(int? pageNum, string? guid)
        {
            if (pageNum != 0)
            {

            }


            //List<Quotation> quotation = await _quotationRepository.GetAll();
            //if (quotation != null)
            //{

            //    object quotationData = quotation.Select(s => s.Id).ToArray();
            //    ViewData["Data"] = Newtonsoft.Json.JsonConvert.SerializeObject(quotationData);

            //    if (quotation != null)
            //    {
            //    }
            //}

            ModelName = nameof(Quotation);
            ViewData[nameof(Id)] = pageNum ?? 0;
            ViewData[nameof(Guid)] = guid ?? "";
        }
    }
}
