//using ERPCore.Models.Base;
//using ERPCore.Models.Models.Parsing;
//using Microsoft.AspNetCore.Http;
//using Microsoft.AspNetCore.Mvc.RazorPages;
//using Microsoft.SharePoint.WebControls;

//namespace ERPCore.Pages
//{
//    public class Quotation_MKT_FormModel : PageModel
//    {
//        //private readonly ILogger<Quotation_FormModel> _logger;
//        public static string ModelName { get; set; } = "";
//        private static string Id { get; set; }

//        private readonly IBaseRepository<Quotation> _quotationRepository;

//        public Quotation_MKT_FormModel(ILogger<Quotation_MKT_FormModel> logger, IConfiguration configuration, Microsoft.Extensions.Options.IOptionsMonitor<BlobStorageSettings> blobStorageSettings, IHttpContextAccessor httpContextAccessor)
//        {
//            _quotationRepository = new BaseRepository<Quotation>(configuration, httpContextAccessor);
//            //_logger = logger;
//        }
//        public async void OnGet(int? pageNum)
//        {
//            if (pageNum != 0)
//            {

//            }

//            ModelName = nameof(Quotation);
//            ViewData[nameof(Id)] = pageNum ?? 0;
//        }
//    }
//}
