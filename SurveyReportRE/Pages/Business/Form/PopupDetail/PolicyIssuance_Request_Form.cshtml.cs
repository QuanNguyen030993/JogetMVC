using ERPCore.Models.Base;
using ERPCore.Models.Models.Parsing;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.RazorPages;


namespace ERPCore.Pages
{
    public class PolicyIssuance_Request_FormModel : PageModel
    {
        //private readonly ILogger<PolicyIssuance_FormModel> _logger;
        public static string ModelName { get; set; } = "";
        private static string Id { get; set; }

        private readonly IBaseRepository<PolicyIssuance> _PolicyIssuanceRepository;

        public PolicyIssuance_Request_FormModel(ILogger<PolicyIssuance_Request_FormModel> logger, IConfiguration configuration, Microsoft.Extensions.Options.IOptionsMonitor<BlobStorageSettings> blobStorageSettings, IHttpContextAccessor httpContextAccessor)
        {
            _PolicyIssuanceRepository = new BaseRepository<PolicyIssuance>(configuration, httpContextAccessor);
            //_logger = logger;
        }
        public async void OnGet(int? pageNum)
        {
            if (pageNum != 0)
            {

            }
            ModelName = nameof(PolicyIssuance);
            ViewData[nameof(Id)] = pageNum ?? 0;
        }
    }
}
