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
using ERPCore.Models.Migration.Business.Social;
using Microsoft.AspNetCore.SignalR;

[ApiController]
[Route("api/[controller]/[action]")]
public class SectionCommentNoteController : BaseControllerApi<SectionCommentNote>
{
    private readonly IBaseRepository<SectionCommentNote> _BaseRepository;
    private readonly IConfiguration configuration;
    private readonly IConfigurationSection path;
    private static string DOMAIN_NAME = "";
    public SectionCommentNoteController(IBaseRepository<SectionCommentNote> BaseRepository, IConfiguration config, IHttpContextAccessor httpContextAccessor, ILogger<SectionCommentNote> logger) : base(BaseRepository, httpContextAccessor)
    {
        configuration = config;
        _BaseRepository = BaseRepository;

        DOMAIN_NAME = configuration.GetSection("Domain:DCServer").Value;
    }
    [HttpPost]
    public override async Task<IActionResult> InsertData([FromForm] InsertFormCollection form)
    {
        var entity = new SectionCommentNote();
        JsonConvert.PopulateObject(form.values, entity);
        entity = await _BaseRepository.InsertData(entity);
        ControllerHelper.SignalRResponse( "R_ItemSubmitted", new { type = "Quotation" }, ControllerUtil.GetCurrentContextUser(_httpContextAccessor, configuration), DOMAIN_NAME);
        return Ok(entity);
    }
}