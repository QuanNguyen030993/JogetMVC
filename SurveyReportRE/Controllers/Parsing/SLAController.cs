using Microsoft.AspNetCore.Mvc;
using ERPCore.Controllers.Base;

namespace ERPCore.Controllers.Config
{
    [Route("api/[controller]/[action]")]
    [ApiController]
    public class SLAController : BaseControllerApi<SLA>
    {
        private readonly IBaseRepository<SLA> _BaseRepository;
        private readonly IConfiguration _configuration;

        public SLAController(IBaseRepository<SLA> BaseRepository, IConfiguration configuration, IHttpContextAccessor httpContextAccessor) : base(BaseRepository, httpContextAccessor)
        {
            _BaseRepository = BaseRepository;
            _configuration = configuration;

        }

    }
}
