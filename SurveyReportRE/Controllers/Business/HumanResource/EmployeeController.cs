using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using ERPCore.Controllers.Base;
using ERPCore.Models.Migration.Business.Config;
using ERPCore.Models.Migration.Business.HumanResource;
using System.Dynamic;
using System.Text.RegularExpressions;
using Microsoft.Data.SqlClient;

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
    public async Task<IActionResult> GetAssignableByGroup(string group, bool excludeCurrent = true, string keyword = "")
    {
        var currentLogin = (User?.Identity?.Name ?? "").Trim();

        List<Employee> data = await _BaseRepository.GetListObject(l => l.Department == group);

        if (excludeCurrent)
        {
            data = data.Where(x =>
                !string.Equals(x.AccountName?.Trim(), currentLogin, StringComparison.OrdinalIgnoreCase) 
            ).ToList();
        }

        return Ok(new
        {
            success = true,
            data = data.Select(x => new Employee
            {
                Id = x.Id,
                FullName = x.FullName,
                Department = x.Department,
                AccountName = x.AccountName
            })
        });
    }
    [HttpGet("{id}")]
    public async Task<IActionResult> EmployeeLookup(string id)
    {
        var loginName = (User?.Identity?.Name ?? "").Trim().ToLower();

        List<Employee> data = await _BaseRepository.GetListObject(x =>

                       (x.AccountName ?? "").ToLower() == id 
                   );
        //var emp = await _db.Employee
        //    .AsNoTracking()
        //    .Where(x => !x.Deleted && x.Id == id)
        //    .Select(x => new
        //    {
        //        id = x.Id,
        //        employeeCode = x.EmployeeCode,
        //        fullName = x.FullName,
        //        group = x.Group,
        //        displayName = x.FullName + " (" + x.EmployeeCode + ")"
        //    })
        //    .FirstOrDefaultAsync();

        if (data == null)
        {
            return Ok(new { success = false, message = "Employee not found" });
        }

        return Ok(new { success = true, data = data });
    }
    [HttpGet]
    public async Task<IActionResult> GetMyAssigneeProfile()
    {
        var loginName = (User?.Identity?.Name ?? "").Trim().ToLower();

        List<Employee> data = await _BaseRepository.GetListObject(x =>

                       (x.AccountName ?? "").ToLower() == loginName 
                   );
          Employee emp =  data.Select(x => new Employee
            {
                Id = x.Id,
              FullName = x.FullName,
              AccountName = x.AccountName,
              Department = x.Department
            })
            .FirstOrDefault();

        if (emp == null)
        {
            return Ok(new { success = false, message = "Current employee not found" });
        }

        return Ok(new { success = true, data = emp });
    }

    [HttpGet("{dept}")]
    public async Task<ActionResult<Employee>> AssigneeList(string dept)
    {
        //var requestParams = HttpContext.Request.Query.ToList();
        //IDictionary<string, object> dynamicObj = new ExpandoObject { };
        //foreach (var item in requestParams)
        //{
        //    dynamicObj[item.Key] = item.Value;
        //}
        //var Base = await _BaseRepository.GetAll();

        //if (dynamicObj.ContainsKey("key"))
        //{
        //    var obj = dynamicObj["key"];
        //    int result = 0;
        //    int.TryParse(obj.ToString(), out result);
        //    if (result != 0)
        //        Base = await _BaseRepository.GetManyObjectByIdAsync(int.Parse(obj.ToString()));
        //    else
        //        Base = Base.Where(s => s.FullName.ToString() == (obj.ToString() ?? "")).ToList();


        //}
        //if (Base == null)
        //{
        //    return NotFound();
        //}
        List<Employee> Base = new List<Employee>();
        Base = await _BaseRepository.GetListObject(o => o.Department == dept);
        return Ok(Base);
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
