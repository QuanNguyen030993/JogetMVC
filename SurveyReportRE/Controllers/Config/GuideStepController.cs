using Dapper;
using ERPCore.Controllers.Base;
using ERPCore.Models.Migration.Config;
//using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;

namespace ERPCore.Controllers.Config;

[ApiController]
[Route("api/[controller]/[action]")]
public class GuideStepController : BaseControllerApi<GuideStep>
{
    public sealed class GuideDefinition
    {
        public string Id { get; set; } = "";
        public string Key { get; set; } = "";
        public string Title { get; set; } = "";
        public int Version { get; set; } = 1;
        public string Route { get; set; } = "";
        public string Source { get; set; } = "manual";
        public string WikiUrl { get; set; } = "";
        public decimal MaxLoginHours { get; set; }
        public bool AutoStart { get; set; }
        public bool Enabled { get; set; } = true;
        public List<GuideStepDefinition> Steps { get; set; } = [];
    }

    public sealed class GuideStepDefinition
    {
        public string Id { get; set; } = "";
        public string Title { get; set; } = "";
        public string Selector { get; set; } = "";
        public string Placement { get; set; } = "auto";
        public string Content { get; set; } = "";
        public string Format { get; set; } = "html";
        public int WaitTimeout { get; set; } = 5000;
    }

    private readonly IBaseRepository<GuideStep> _BaseRepository;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IConfiguration _configuration;

    public GuideStepController(
        IBaseRepository<GuideStep> BaseRepository,
        IHttpContextAccessor httpContextAccessor,
        IConfiguration configuration) : base(BaseRepository, httpContextAccessor)
    {
        _BaseRepository = BaseRepository;
        _httpContextAccessor = httpContextAccessor;
        _configuration = configuration;
    }

    [HttpGet]
    public async Task<IActionResult> GetGuides()
    {
        await using var connection = new SqlConnection(_BaseRepository._connectionString);
        var steps = (await connection.QueryAsync<GuideStep>(@"
            SELECT *
            FROM dbo.GuideStep WITH (NOLOCK)
            WHERE Deleted = 0 AND IsEnabled = 1
            ORDER BY GuideKey, StepNumber, Id")).ToList();
        
        var accountName = ControllerUtil.ControllerUtil.GetCurrentContextUser(_httpContextAccessor, _configuration)?.Trim() ?? "";
        var totalLoginHours = await connection.QuerySingleOrDefaultAsync<decimal?>(@"
            SELECT TotalLoginHours
            FROM dbo.UsersCache WITH (NOLOCK)
            WHERE AccountName = @AccountName AND Deleted = 0", new { AccountName = accountName }) ?? 0;

        var guides = steps
            .GroupBy(item => item.GuideKey, StringComparer.OrdinalIgnoreCase)
            .Select(group =>
            {
                var first = group.First();
                return new
                {
                    id = first.GuideKey,
                    key = first.GuideKey,
                    title = first.GuideTitle,
                    version = first.GuideVersion,
                    route = first.Route,
                    source = first.SourceType,
                    wikiUrl = first.WikiUrl,
                    maxLoginHours = first.MaxLoginHours,
                    autoStart = first.AutoStart,
                    enabled = first.IsEnabled,
                    isEligible = first.MaxLoginHours <= 0 || totalLoginHours < first.MaxLoginHours,
                    steps = group.OrderBy(item => item.StepNumber).Select(item => new
                    {
                        id = item.Guid.ToString(),
                        title = item.StepTitle,
                        selector = item.Selector,
                        placement = item.Placement,
                        content = item.Content,
                        format = item.ContentFormat,
                        waitTimeout = item.WaitTimeoutMs
                    })
                };
            })
            .ToList();

        return Ok(new
        {
            success = true,
            data = guides,
            totalLoginHours
        });
    }

    [HttpPost]
    public async Task<IActionResult> SaveGuide([FromBody] GuideDefinition guide)
    {
        if (!await CanManageGuidesAsync()) return Forbid();

        guide.Key = (guide.Key ?? "").Trim();
        guide.Title = (guide.Title ?? "").Trim();
        guide.Route = (guide.Route ?? "").Trim();
        guide.Source = (guide.Source ?? "manual").Trim();
        guide.WikiUrl = (guide.WikiUrl ?? "").Trim();
        guide.Steps ??= [];
        if (string.IsNullOrWhiteSpace(guide.Key) || string.IsNullOrWhiteSpace(guide.Title) || guide.Steps.Count == 0)
            return BadRequest(new { success = false, message = "Guide key, title and at least one step are required." });

        if (guide.Key.Length > 100 || guide.Title.Length > 255 || guide.Route.Length > 500)
            return BadRequest(new { success = false, message = "Guide metadata exceeds the supported length." });


        var accountName = ControllerUtil.ControllerUtil.GetCurrentContextUser(_httpContextAccessor, _configuration)?.Trim() ?? "";
        await using var connection = new SqlConnection(_BaseRepository._connectionString);
        await connection.OpenAsync();
        await using var transaction = await connection.BeginTransactionAsync();
        try
        {
            await connection.ExecuteAsync(@"
                UPDATE dbo.GuideStep
                SET Deleted = 1, DeletedBy = @UserName, DeletedDate = GETDATE(), ModifiedDate = GETDATE()
                WHERE GuideKey = @GuideKey AND Deleted = 0",
                new { UserName = accountName, GuideKey = guide.Key }, transaction);

            const string insertSql = @"
                INSERT INTO dbo.GuideStep
                ([Guid], GuideKey, GuideTitle, GuideVersion, Route, SourceType, WikiUrl,
                 MaxLoginHours, AutoStart, StepNumber, StepTitle, Selector, Placement,
                 Content, ContentFormat, WaitTimeoutMs, IsEnabled,
                 CreatedBy, CreatedDate, ModifiedBy, ModifiedDate, Deleted)
                VALUES
                (NEWID(), @GuideKey, @GuideTitle, @GuideVersion, @Route, @SourceType, @WikiUrl,
                 @MaxLoginHours, @AutoStart, @StepNumber, @StepTitle, @Selector, @Placement,
                 @Content, @ContentFormat, @WaitTimeoutMs, @IsEnabled,
                 @UserName, GETDATE(), @UserName, GETDATE(), 0);";

            for (var index = 0; index < guide.Steps.Count; index++)
            {
                var step = guide.Steps[index];
                step.Format = NormalizeContentFormat(step.Format);
                await connection.ExecuteAsync(insertSql, new
                {
                    GuideKey = guide.Key,
                    GuideTitle = guide.Title,
                    GuideVersion = Math.Max(1, guide.Version),
                    guide.Route,
                    SourceType = guide.Source,
                    guide.WikiUrl,
                    MaxLoginHours = Math.Max(0, guide.MaxLoginHours),
                    guide.AutoStart,
                    StepNumber = index + 1,
                    StepTitle = step.Title ?? $"Step {index + 1}",
                    Selector = step.Selector ?? "",
                    Placement = step.Placement ?? "auto",
                    Content = step.Content ?? "",
                    ContentFormat = step.Format,
                    WaitTimeoutMs = Math.Clamp(step.WaitTimeout, 0, 30000),
                    IsEnabled = guide.Enabled,
                    UserName = accountName
                }, transaction);
            }

            var savedStepCount = await connection.ExecuteScalarAsync<int>(@"
                SELECT COUNT(*)
                FROM dbo.GuideStep
                WHERE GuideKey = @GuideKey AND Deleted = 0",
                new { GuideKey = guide.Key }, transaction);

            if (savedStepCount != guide.Steps.Count)
                throw new InvalidOperationException("The saved guide step count does not match the submitted data.");

            await transaction.CommitAsync();
            guide.Id = guide.Key;
            return Ok(new { success = true, data = guide, savedStepCount });
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    private static string NormalizeContentFormat(string? format)
    {
        return string.Equals(format?.Trim(), "markdown", StringComparison.OrdinalIgnoreCase)
            ? "markdown"
            : "html";
    }

    [HttpDelete("{guideKey}")]
    public async Task<IActionResult> DeleteGuide(string guideKey)
    {
        if (!await CanManageGuidesAsync()) return Forbid();

        var accountName = ControllerUtil.ControllerUtil.GetCurrentContextUser(_httpContextAccessor, _configuration)?.Trim() ?? "";
        await using var connection = new SqlConnection(_BaseRepository._connectionString);
        var affected = await connection.ExecuteAsync(@"
            UPDATE dbo.GuideStep
            SET Deleted = 1, DeletedBy = @UserName, DeletedDate = GETDATE(), ModifiedDate = GETDATE()
            WHERE GuideKey = @GuideKey AND Deleted = 0",
            new { UserName = accountName, GuideKey = guideKey });
        return Ok(new { success = true, affected });
    }

    private async Task<bool> CanManageGuidesAsync()
    {
        var accountName = ControllerUtil.ControllerUtil.GetCurrentContextUser(_httpContextAccessor, _configuration)?.Trim() ?? "";
        if (string.IsNullOrWhiteSpace(accountName)) return false;
        if (ControllerUtil.ControllerUtil.IsSuperUser(_configuration, accountName)) return true;

        await using var connection = new SqlConnection(_BaseRepository._connectionString);
        return await connection.ExecuteScalarAsync<bool>(@"
            SELECT CASE WHEN EXISTS
            (
                SELECT 1
                FROM dbo.Employee employee WITH (NOLOCK)
                LEFT JOIN dbo.Roles role WITH (NOLOCK) ON role.Id = employee.SystemRolesId
                WHERE employee.AccountName = @AccountName
                  AND employee.Deleted = 0
                  AND
                  (
                      UPPER(ISNULL(employee.Department, N'')) = N'IT'
                      OR UPPER(ISNULL(role.RoleName, N'')) IN (N'IT', N'ADMIN', N'SUPERUSER')
                  )
            ) THEN 1 ELSE 0 END", new { AccountName = accountName });
    }
}
