using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using ERPCore.Controllers.Base;
using ERPCore.Models.Business.Migration.Config;
using ERPCore.Models.Migration.Config;
using System.Dynamic;
namespace ERPCore.Controllers.Config
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