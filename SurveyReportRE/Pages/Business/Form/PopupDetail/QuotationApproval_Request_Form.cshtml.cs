using ERPCore.Models.Base;
using ERPCore.Models.Models.Parsing;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.SharePoint.WebControls;

namespace ERPCore.Pages
{
    public class QuotationApproval_Request_FormModel : PageModel
    {
        public static string ModelName { get; set; } = "";
        private static string Id { get; set; }

        public QuotationApproval_Request_FormModel(ILogger<QuotationApproval_Request_FormModel> logger, IConfiguration configuration, Microsoft.Extensions.Options.IOptionsMonitor<BlobStorageSettings> blobStorageSettings, IHttpContextAccessor httpContextAccessor)
        {
        }
        public async void OnGet(int? pageNum)
        {
            if (pageNum != 0)
            {

            }
            ModelName = nameof(Quotation);
            ViewData[nameof(Id)] = pageNum ?? 0;
        }
    }
}
