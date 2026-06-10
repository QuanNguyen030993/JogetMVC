using DocumentFormat.OpenXml.Office2013.Excel;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using Serilog;
using ERPCore.Common;
using ERPCore.Controllers.Base;
using ERPCore.ControllerUtil;
using ERPCore.Models.Base;
using ERPCore.Models.Migration.Business.Config;
using ERPCore.Models.Migration.Business.Data;
using ERPCore.Models.Migration.Business.Form;
using ERPCore.Models.Migration.Business.HumanResource;
using ERPCore.Models.Migration.Business.MasterData;
using ERPCore.Models.Migration.Business.Workflow;
using ERPCore.Models.Request;
using ERPCore.Repository;
using Syncfusion.Pdf.Graphics;
using System.Data;
using System.Net;
using ERPCore.Models.Models.Parsing;

[ApiController]
[Route("api/[controller]/[action]")]
public class ResController : BaseControllerApi<Res>
{
    private readonly IBaseRepository<Res> _BaseRepository;
    private readonly IConfiguration configuration;
    private readonly IConfigurationSection path;

    public ResController(IBaseRepository<Res> BaseRepository, IConfiguration config, IHttpContextAccessor httpContextAccessor, ILogger<Res> logger) : base(BaseRepository, httpContextAccessor)
    {
        configuration = config;
        _BaseRepository = BaseRepository;

    }

}