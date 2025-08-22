using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using SurveyReportRE.Controllers.Base;
using SurveyReportRE.Models.Migration.Business.Config;
using SurveyReportRE.Models.Migration.Business.HumanResource;
using System.Dynamic;
using System.Text.RegularExpressions;

[Route("api/[controller]/[action]")]
[ApiController]
public class EmployeeController : BaseControllerApi<Employee>
{
    private readonly IBaseRepository<Employee> _BaseRepository;
    private readonly IBaseRepository<Users> _usersRepository;
    private readonly IConfiguration _configuration;

    public EmployeeController(IBaseRepository<Employee> BaseRepository, IHttpContextAccessor httpContextAccessor, IConfiguration configuration) : base(BaseRepository, httpContextAccessor)
    {
        _BaseRepository = BaseRepository;
        _configuration = configuration;
        _usersRepository = new BaseRepository<Users>(configuration, httpContextAccessor);
    }

    [HttpGet]
    public override async Task<ActionResult<Employee>> DropDownLookup()
    {
        var requestParams = HttpContext.Request.Query.ToList();
        IDictionary<string, object> dynamicObj = new ExpandoObject { };
        foreach (var item in requestParams)
        {
            dynamicObj[item.Key] = item.Value;
        }
        var Base = await _BaseRepository.GetAll();

        if (dynamicObj.ContainsKey("key"))
        {
            var obj = dynamicObj["key"];
            int result = 0;
            int.TryParse(obj.ToString(), out result);
            if (result != 0)
                Base = await _BaseRepository.GetManyObjectByIdAsync(int.Parse(obj.ToString()));
            else
                Base = Base.Where(s => s.FullName.ToString() == (obj.ToString() ?? "")).ToList();


        }
        if (Base == null)
        {
            return NotFound();
        }

        return Ok(Base);
    }


    [HttpGet]
    public async Task<IActionResult> EmployeeUpdate(string? adminUser, string? passWord)
    {
        var domainEmailName = _BaseRepository._baseConfiguration.GetSection("Domain:Email").Value;
        List<Users> users = new List<Users>();
        users = await _usersRepository.GetAll();
        //users = users.Where(w => Regex.IsMatch(w.name, @"\sRE$")).ToList();
        users = users.Where(w => w.department == "RE").ToList();

        List<Employee> employees = new List<Employee>();
        employees = await _BaseRepository.GetAll();

        if (users
            .Any(user =>
                !employees.Any(emp =>
                    user.mail.Replace(domainEmailName, "") == emp.AccountName)))
        {
            List<Employee> newEmployees = users
            .Where(user =>
                !employees.Any(emp =>
                    user.mail.Replace(domainEmailName, "") == emp.AccountName))
            .Select(user => new Employee
            {
                FullName = user.name,
                Department = "Risk Engineering",
                AccountName = user.mail.Replace(domainEmailName, ""),
                Email = user.mail,
                UsersId = user.Id
            })
            .ToList();


            foreach (var newEmployee in newEmployees)
            {
                await _BaseRepository.InsertData(newEmployee);
            }
        }

        return Ok();
    }
    [HttpPost]
    public override async Task<object> DropDownLookupCustomQuery([FromBody] string query)
    {
        object Base = await _BaseRepository.ExecuteCustomQuery(query);
        var requestParams = HttpContext.Request.Query.ToList();
        IDictionary<string, object> dynamicObj = new ExpandoObject { };
        foreach (var item in requestParams)
        {
            dynamicObj[item.Key] = item.Value;
        }

        if (dynamicObj.ContainsKey("key"))
        {
            var obj = dynamicObj["key"];
            string result = obj.ToString();
            if (!string.IsNullOrEmpty(result))
            {
                var list = Base as List<Dictionary<string, object>>;
                if (list != null)
                {
                    var filtered = list
                        .Where(d => d.ContainsKey("accountName") && d["accountName"] != null && d["accountName"].ToString() == result)
                        .ToList();

                    Base = filtered;
                }
            }
        }
        else
        {
            Base = await _BaseRepository.GetAll();
        }

        if (Base == null)
        {
            return NotFound();
        }

        return Ok(Base);
    }

}
