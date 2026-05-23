using ERPCore.Models.Base;
using ERPCore.Models.Models.Parsing;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.SharePoint.WebControls;
using System;

namespace ERPCore.Pages
{
    public class PolicyIssuance_FormModel : PageModel
    {
        //private readonly ILogger<PolicyIssuance_FormModel> _logger;
        public static string ModelName { get; set; } = "";
        private static string Id { get; set; }

        private readonly IBaseRepository<PolicyIssuance> _policyIssuanceRepository;
        private static string Guid { get; set; }

        public PolicyIssuance_FormModel(ILogger<PolicyIssuance_FormModel> logger, IConfiguration configuration, Microsoft.Extensions.Options.IOptionsMonitor<BlobStorageSettings> blobStorageSettings, IHttpContextAccessor httpContextAccessor)
        {
            _policyIssuanceRepository = new BaseRepository<PolicyIssuance>(configuration, httpContextAccessor);
            //_logger = logger;
        }
        public async void OnGet(int? pageNum, string guid)
        {
            if (pageNum != 0)
            {

            }


            //List<PolicyIssuance> policyIssuance = await _policyIssuanceRepository.GetAll();
            //if (policyIssuance != null)
            //{

            //    object policyIssuanceData = policyIssuance.Select(s => s.Id).ToArray();
            //    ViewData["Data"] = Newtonsoft.Json.JsonConvert.SerializeObject(policyIssuanceData);

            //    if (policyIssuance != null)
            //    {
            //    }
            //}

            ModelName = nameof(PolicyIssuance);
            ViewData[nameof(Id)] = pageNum ?? 0;
            ViewData[nameof(Guid)] = guid ?? "";
        }
    }
}
