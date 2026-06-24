using Microsoft.AspNetCore.Mvc;
using ERPCore.Controllers.Base;
using ERPCore.Models.Migration.Business.HumanResource;

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

        //[HttpGet("{dept}")]
        //public async Task<IActionResult> SLALookup(string dept)
        //{

        //    List<SLA> data = await _BaseRepository.GetListObject(x =>
        //                   x.Dept == dept
        //               );

        //    if (data == null)
        //    {
        //        return Ok(new { success = false, message = "Config not found" });
        //    }

        //    return Ok(new { success = true, data = data });
        //}
    }
}
