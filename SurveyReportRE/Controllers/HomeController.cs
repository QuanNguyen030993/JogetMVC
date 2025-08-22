using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using SurveyReportRE.Common;
using SurveyReportRE.Controllers.Base;
using SurveyReportRE.Models;
using SurveyReportRE.Models.Base;
using SurveyReportRE.Models.Migration.Business.HumanResource;
using SurveyReportRE.Models.Request;
using SurveyReportRE.Pages;
using System.IO;
using System.Transactions;
using static System.Net.Mime.MediaTypeNames;
namespace SurveyReportRE.Controllers
{
    public class FileUploadModel
    {
        public IFormFile File { get; set; }
    }


    [ApiController]
    [Route("api/[controller]")]
    public class HomeController : ControllerBase
    {
        private readonly IConfiguration configuration;
        private IOptionsMonitor<BlobStorageSettings> _blobStorageSettings;

        public HomeController(IConfiguration config, Microsoft.Extensions.Options.IOptionsMonitor<BlobStorageSettings> blobStorageSettings) 
        {
            configuration = config;
            _blobStorageSettings = blobStorageSettings;
        }
    }
}



