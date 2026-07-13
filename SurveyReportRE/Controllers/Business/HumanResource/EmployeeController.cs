using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using ERPCore.Controllers.Base;
using ERPCore.Models.Migration.Business.Config;
using ERPCore.Models.Migration.Business.HumanResource;
using System.Dynamic;
using System.Text.RegularExpressions;
using Microsoft.Data.SqlClient;
using ERPCore.Models.Migration.Config;
using JogetMVC.Models.Models.Request;

[Route("api/[controller]/[action]")]
[ApiController]
public class EmployeeController : BaseControllerApi<Employee>
{
    private readonly IBaseRepository<Employee> _BaseRepository;
    private readonly IBaseRepository<Users> _usersRepository;
    private readonly IBaseRepository<EnumData> _enumDataRepository;
    private readonly IConfiguration _configuration;

    public EmployeeController(IBaseRepository<Employee> BaseRepository, IHttpContextAccessor httpContextAccessor, IConfiguration configuration) : base(BaseRepository, httpContextAccessor)
    {
        _BaseRepository = BaseRepository;
        _configuration = configuration;
        _usersRepository = new BaseRepository<Users>(configuration, httpContextAccessor);
        _enumDataRepository = new BaseRepository<EnumData>(configuration, httpContextAccessor);
    }
    [HttpGet]
    public async Task<IActionResult> GetAssignableByGroup([FromQuery] GetAssignableByGroupRequest request)
    {
        var currentLogin = (User?.Identity?.Name ?? "").Trim();
        EnumData enumData = await _enumDataRepository.GetSingleObject(s => s.Code == request.branchCode);
        if (enumData != null)
        {
        List<Employee> data = await _BaseRepository.GetListObject(l => l.Department == request.group && l.AreaId == enumData.Id);

        if (request.excludeCurrent ?? false)
        {
            data = data.Where(x =>
                !string.Equals(x.AccountName?.Trim(), currentLogin, StringComparison.OrdinalIgnoreCase) 
            ).ToList();
        }
        //data.ForEach(async em => em = await _BaseRepository.ObjectSpecificInclude(em, em => em.UsersFK));
            
        return Ok(new
        {
            success = true,
            data = data
        });
        }
        return Ok(
            new
            {
                success = false,
                data = new Employee()
            }
            );
    }
    [HttpGet("{id}")]
    public async Task<IActionResult> EmployeeLookup(string id)
    {
        var loginName = (User?.Identity?.Name ?? "").Trim().ToLower();

        Employee data = await _BaseRepository.GetSingleObject(x =>
                       x.AccountName == id 
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
    [HttpGet("{id}")]
    public async Task<IActionResult> PersonInChargeLookup(string id)
    {
        var accountList = id
            .Split(',', StringSplitOptions.RemoveEmptyEntries)
            .Select(x => x.Trim().ToLower())
            .ToList();

        var data = await _BaseRepository.GetListObject(x =>
            accountList.Contains(x.AccountName.ToLower())
        );

        if (data == null || !data.Any())
        {
            return Ok(new { success = false, message = "Employee not found" });
        }
                                                 
        // ✅ Ghép FullName thành chuỗi
        var fullNames = string.Join(", ", data.Select(x => x.FullName));
        if (data.Count == 0)
            fullNames = "(Unassigned)";
        return Ok(new
        {
            success = true,
            data = data,
            fullNames = fullNames
        });
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

    //[HttpGet("{dept}")]
    //public async Task<ActionResult<Employee>> AssigneeList(string dept)
    //{
    //    //var requestParams = HttpContext.Request.Query.ToList();
    //    //IDictionary<string, object> dynamicObj = new ExpandoObject { };
    //    //foreach (var item in requestParams)
    //    //{
    //    //    dynamicObj[item.Key] = item.Value;
    //    //}
    //    //var Base = await _BaseRepository.GetAll();

    //    //if (dynamicObj.ContainsKey("key"))
    //    //{
    //    //    var obj = dynamicObj["key"];
    //    //    int result = 0;
    //    //    int.TryParse(obj.ToString(), out result);
    //    //    if (result != 0)
    //    //        Base = await _BaseRepository.GetManyObjectByIdAsync(int.Parse(obj.ToString()));
    //    //    else
    //    //        Base = Base.Where(s => s.FullName.ToString() == (obj.ToString() ?? "")).ToList();


    //    //}
    //    //if (Base == null)
    //    //{
    //    //    return NotFound();
    //    //}
    //    List<Employee> Base = new List<Employee>();
    //    Base = await _BaseRepository.GetListObject(o => o.Department == dept);
    //    return Ok(Base);
    //}

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
        var domainEmailName = _configuration.GetValue<string>("Domain:Email") ?? "";
        var users = await _usersRepository.GetAll();
        var employees = await _BaseRepository.GetAll();
        var branchEnums = await _enumDataRepository.GetAll();

        var employeeByAccount = employees
            .Where(employee => !string.IsNullOrWhiteSpace(employee.AccountName))
            .GroupBy(employee => employee.AccountName.Trim(), StringComparer.OrdinalIgnoreCase)
            .ToDictionary(group => group.Key, group => group.First(), StringComparer.OrdinalIgnoreCase);

        var branchIdByCode = branchEnums
            .Where(item => !string.IsNullOrWhiteSpace(item.Code))
            .GroupBy(item => item.Code.Trim(), StringComparer.OrdinalIgnoreCase)
            .ToDictionary(group => group.Key, group => (long?)group.First().Id, StringComparer.OrdinalIgnoreCase);

        var insertedEmployees = new List<Employee>();
        var updatedEmployees = new List<Employee>();
        var processedAccounts = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var user in users)
        {
            var accountName = ResolveAccountName(user, domainEmailName);
            if (string.IsNullOrWhiteSpace(accountName) || !processedAccounts.Add(accountName))
            {
                continue;
            }

            var branchCode = ResolveBranchCode(user);
            branchIdByCode.TryGetValue(branchCode, out var branchId);

            if (!employeeByAccount.TryGetValue(accountName, out var employee))
            {
                employee = new Employee
                {
                    AccountName = accountName
                };
                ApplyUserToEmployee(employee, user, accountName, branchId, preserveMissingValues: false);
                insertedEmployees.Add(employee);
                employeeByAccount[accountName] = employee;
                continue;
            }

            if (ApplyUserToEmployee(employee, user, accountName, branchId, preserveMissingValues: true))
            {
                updatedEmployees.Add(employee);
            }
        }

        if (insertedEmployees.Count > 0)
        {
            await _BaseRepository.BulkInsertAsync(insertedEmployees);
        }

        if (updatedEmployees.Count > 0)
        {
            await _BaseRepository.BulkUpdateAsync(
                updatedEmployees,
                new[]
                {
                    nameof(Employee.FirstName),
                    nameof(Employee.LastName),
                    nameof(Employee.FullName),
                    nameof(Employee.Department),
                    nameof(Employee.AccountName),
                    nameof(Employee.Email),
                    nameof(Employee.EmailName),
                    nameof(Employee.AreaId),
                    nameof(Employee.UsersId)
                },
                nameof(Employee.Id));
        }

        return Ok(new
        {
            success = true,
            inserted = insertedEmployees.Count,
            updated = updatedEmployees.Count,
            skipped = users.Count - processedAccounts.Count
        });
    }

    private static string ResolveAccountName(Users user, string domainEmailName)
    {
        if (!string.IsNullOrWhiteSpace(user.username))
        {
            return user.username.Trim();
        }

        var email = !string.IsNullOrWhiteSpace(user.mail)
            ? user.mail.Trim()
            : user.userPrincipalName?.Trim() ?? "";

        if (!string.IsNullOrWhiteSpace(domainEmailName) &&
            email.EndsWith(domainEmailName, StringComparison.OrdinalIgnoreCase))
        {
            return email[..^domainEmailName.Length].Trim();
        }

        var atIndex = email.IndexOf('@');
        return (atIndex > 0 ? email[..atIndex] : email).Trim();
    }

    private static string ResolveBranchCode(Users user)
        {
        var branchOu = (user.distinguishedName ?? "")
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .FirstOrDefault(value => value.StartsWith("OU=OU-", StringComparison.OrdinalIgnoreCase));

        var branch = branchOu == null ? "" : branchOu[6..].Trim();
        return branch.ToUpperInvariant() switch
            {
            "SGN" => "HCM",
            "HCM" => "HCM",
            "HN" => "HN",
            _ => branch
        };
    }

    private static string ResolveEmployeeGroup(Users user)
    {
        var departmentOu = (user.distinguishedName ?? "")
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .FirstOrDefault(value =>
                value.StartsWith("OU=", StringComparison.OrdinalIgnoreCase) &&
                !value.StartsWith("OU=OU-", StringComparison.OrdinalIgnoreCase));

        var department = departmentOu == null ? "" : departmentOu[3..].Trim();
        return department.ToUpperInvariant() switch
            {
            "UWRI" => "UW",
            "PM" => "PM",
            "MKT" => "MKT",
            _ => department
        };
            }

    private static bool ApplyUserToEmployee(
        Employee employee,
        Users user,
        string accountName,
        long? branchId,
        bool preserveMissingValues)
    {
        var firstName = user.givenname?.Trim() ?? "";
        var lastName = user.sn?.Trim() ?? "";
        var fullName = user.name?.Trim() ?? "";
        var email = user.mail?.Trim() ?? "";
        var department = ResolveEmployeeGroup(user);

        if (preserveMissingValues)
        {
            firstName = string.IsNullOrWhiteSpace(firstName) ? employee.FirstName : firstName;
            lastName = string.IsNullOrWhiteSpace(lastName) ? employee.LastName : lastName;
            fullName = string.IsNullOrWhiteSpace(fullName) ? employee.FullName : fullName;
            email = string.IsNullOrWhiteSpace(email) ? employee.Email : email;
            department = string.IsNullOrWhiteSpace(department) ? employee.Department : department;
            branchId ??= employee.AreaId;
        }

        var changed =
            !string.Equals(employee.FirstName, firstName, StringComparison.Ordinal) ||
            !string.Equals(employee.LastName, lastName, StringComparison.Ordinal) ||
            !string.Equals(employee.FullName, fullName, StringComparison.Ordinal) ||
            !string.Equals(employee.Department, department, StringComparison.Ordinal) ||
            !string.Equals(employee.AccountName, accountName, StringComparison.OrdinalIgnoreCase) ||
            !string.Equals(employee.Email, email, StringComparison.OrdinalIgnoreCase) ||
            !string.Equals(employee.EmailName, accountName, StringComparison.OrdinalIgnoreCase) ||
            employee.AreaId != branchId ||
            employee.UsersId != user.Id;

        employee.FirstName = firstName;
        employee.LastName = lastName;
        employee.FullName = fullName;
        employee.Department = department;
        employee.AccountName = accountName;
        employee.Email = email;
        employee.EmailName = accountName;
        employee.AreaId = branchId;
        employee.UsersId = user.Id;

        return changed;
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
