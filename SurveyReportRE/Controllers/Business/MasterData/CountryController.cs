using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using ERPCore.Controllers.Base;
using ERPCore.Models.Migration.Business.MasterData;
using ERPCore.Models.Request;
using System.Dynamic;
using ERPCore.Common;
using ERPCore.ControllerUtil;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Spreadsheet;
using ERPCore.Models.Models.Parsing;
using System.Globalization;
using System.Reflection;

[ApiController]
[Route("api/[controller]/[action]")]
public class CountryController : BaseControllerApi<Country>
{
    private readonly IBaseRepository<Country> _BaseRepository;
    private readonly IBaseRepository<Utility> _utilityRepository;
    private readonly IConfiguration configuration;

    public CountryController(IBaseRepository<Country> BaseRepository, IConfiguration config, IHttpContextAccessor httpContextAccessor) : base(BaseRepository, httpContextAccessor)
    {
        configuration = config;
        _BaseRepository = BaseRepository;
    }

}

