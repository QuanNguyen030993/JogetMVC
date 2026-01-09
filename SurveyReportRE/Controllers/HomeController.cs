using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using ERPCore.Common;
using ERPCore.Controllers.Base;
using ERPCore.Models;
using ERPCore.Models.Base;
using ERPCore.Models.Migration.Business.HumanResource;
using ERPCore.Models.Request;
using ERPCore.Pages;
using System.IO;
using System.Transactions;
using static System.Net.Mime.MediaTypeNames;
namespace ERPCore.Controllers
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



