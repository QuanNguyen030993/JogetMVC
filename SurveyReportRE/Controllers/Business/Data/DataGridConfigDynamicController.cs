using Microsoft.AspNetCore.Mvc;
using SurveyReportRE.Controllers.Base;
using SurveyReportRE.Models.Migration.Business.Data;

[ApiController]
[Route("api/[controller]/[action]")]
public class DataGridConfigDynamicController : BaseControllerApi<DataGridConfigDynamic>
{
    private readonly IBaseRepository<DataGridConfigDynamic> _BaseRepository;
    private readonly IConfiguration configuration;

    public DataGridConfigDynamicController(IBaseRepository<DataGridConfigDynamic> BaseRepository, IConfiguration config,IHttpContextAccessor httpContextAccessor) : base(BaseRepository,httpContextAccessor)
    {
        configuration = config;
        _BaseRepository = BaseRepository;
    }

}

