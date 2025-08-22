using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using SurveyReportRE.Controllers.Base;
using SurveyReportRE.Models.Business.Migration.Config;
using SurveyReportRE.Models.Migration.Config;
using System.Dynamic;
namespace SurveyReportRE.Controllers.Config
{
    [Route("api/[controller]/[action]")]
    [ApiController]
    public class FileEncryptController : BaseControllerApi<FileEncrypt>
    {
        private readonly IBaseRepository<FileEncrypt> _BaseRepository;

        public FileEncryptController(IBaseRepository<FileEncrypt> BaseRepository,IHttpContextAccessor httpContextAccessor) : base(BaseRepository,httpContextAccessor)
        {
            _BaseRepository = BaseRepository;
        }

    }
}