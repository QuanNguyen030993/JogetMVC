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
using ERPCore.Models.Models.Parsing;
using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;
using ERPCore.ControllerUtil;

[Route("api/[controller]/[action]")]
[ApiController]
public class EmployeeController : BaseControllerApi<Employee>
{
    private static readonly IReadOnlyDictionary<string, string> SelfServiceRoles =
        new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["FO"] = "Front Office",
            ["TS"] = "Technical Services",
            ["PM"] = "Product Management",
            ["UW"] = "Underwriting",
            ["LMKT"] = "Leader Marketting",
            ["IT"] = "Admin"
        };

    public sealed class UpdateMyRoleRequest
    {
        public string Role { get; set; } = "";
    }

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
        request.excludeCurrent = false; // test
        var currentLogin = (User?.Identity?.Name ?? "").Trim();
        EnumData enumData = await _enumDataRepository.GetSingleObject(s => s.Code == request.branchCode);
        if (enumData != null)
        {
        List<Employee> data = await _BaseRepository.GetListObject(l => l.Department == request.group && l.AreaId == enumData.Id);

        if (request.excludeCurrent ?? false)
        {
            data = data.Where(x =>
                !string.Equals(x.EmailName?.Trim(), currentLogin, StringComparison.OrdinalIgnoreCase) 
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
            .Select(x => x.Trim().ToLowerInvariant())
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Distinct(StringComparer.OrdinalIgnoreCase)
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

    [HttpGet]
    public async Task<IActionResult> GetMyRoleSettings()
    {
        var employee = await GetCurrentEmployeeAsync();
        if (employee == null)
            return NotFound(new { success = false, message = "Current employee was not found." });

        return Ok(new
        {
            success = true,
            data = new
            {
                employee.Id,
                employee.FullName,
                employee.AccountName,
                role = employee.Department,
                roles = SelfServiceRoles.Select(item => new
                {
                    code = item.Key,
                    description = item.Value
                })
            }
        });
    }

    [HttpPost]
    public async Task<IActionResult> UpdateMyRole([FromBody] UpdateMyRoleRequest request)
    {
        var role = request?.Role?.Trim().ToUpperInvariant() ?? "";
        //if (!SelfServiceRoles.ContainsKey(role))
        //{
        //    return BadRequest(new
        //    {
        //        success = false,
        //        message = "Role must be one of: FO, TS, PM, UW, LMKT."
        //    });
        //}

        var employee = await GetCurrentEmployeeAsync();
        if (employee == null)
            return NotFound(new { success = false, message = "Current employee was not found." });

        employee.Department = role;
        await _BaseRepository.UpdateData(
            employee,
            JsonConvert.SerializeObject(new { Department = role }),
            employee.Id,
            "Id");

        return Ok(new
        {
            success = true,
            message = "Role setting was saved.",
            data = new { role, description = SelfServiceRoles[role] }
        });
    }

    private async Task<Employee?> GetCurrentEmployeeAsync()
    {
        var accountName = ControllerUtil.GetCurrentContextUser(_httpContextAccessor, _configuration)?.Trim();
        if (string.IsNullOrWhiteSpace(accountName))
            return null;

        return await _BaseRepository.GetSingleObject(employee => employee.AccountName == accountName);
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
    public async Task<IActionResult> EmployeeUpdate(string? adminUser, string? passWord, string? connectionId)
    {
        var initiatorUserName = ControllerUtil.GetCurrentContextUser(_httpContextAccessor, _configuration);

        _ = Task.Run(async () =>
        {
            try
            {
                await SendProgress(connectionId, 5, "Initializing Employee Sync...");

                var claims = new List<System.Security.Claims.Claim> { new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.Name, initiatorUserName) };
                var identity = new System.Security.Claims.ClaimsIdentity(claims, "mock");
                var principal = new System.Security.Claims.ClaimsPrincipal(identity);
                var mockContext = new DefaultHttpContext { User = principal };
                var mockAccessor = new MockHttpContextAccessor { HttpContext = mockContext };

                var bgEmployeeRepo = new BaseRepository<Employee>(_configuration, mockAccessor);
                var bgUsersRepo = new BaseRepository<Users>(_configuration, mockAccessor);
                var bgEnumRepo = new BaseRepository<EnumData>(_configuration, mockAccessor);

                await SendProgress(connectionId, 15, "Fetching users and employees from database...");
                var domainEmailName = _configuration.GetValue<string>("Domain:Email") ?? "";
                var users = await bgUsersRepo.GetAll();
                var employees = await bgEmployeeRepo.GetAll();
                var branchEnums = await bgEnumRepo.GetAll();

                await SendProgress(connectionId, 25, "Analyzing database differences...");
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

                int totalToInsert = insertedEmployees.Count;
                int totalToUpdate = updatedEmployees.Count;
                int totalOperations = totalToInsert + totalToUpdate;
                int processedCount = 0;

                if (totalOperations == 0)
                {
                    await SendProgress(connectionId, 100, "Employee database is already up to date.", isComplete: true);
                    return;
                }

                await SendProgress(connectionId, 30, $"Syncing database: {totalToInsert} to insert, {totalToUpdate} to update...");

                int batchSize = 100;
                
                // Batch inserts
                for (int i = 0; i < totalToInsert; i += batchSize)
                {
                    var batch = insertedEmployees.Skip(i).Take(batchSize).ToList();
                    await bgEmployeeRepo.BulkInsertAsync(batch);
                    processedCount += batch.Count;

                    int progress = 30 + (int)(processedCount * 65.0 / totalOperations);
                    await SendProgress(connectionId, progress, $"Inserting: {processedCount}/{totalOperations}...");
                }

                // Batch updates
                for (int i = 0; i < totalToUpdate; i += batchSize)
                {
                    var batch = updatedEmployees.Skip(i).Take(batchSize).ToList();
                    await bgEmployeeRepo.BulkUpdateAsync(
                        batch,
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
                    processedCount += batch.Count;

                    int progress = 30 + (int)(processedCount * 65.0 / totalOperations);
                    await SendProgress(connectionId, progress, $"Updating: {processedCount}/{totalOperations}...");
                }

                await SendProgress(connectionId, 100, $"Completed! {totalToInsert} inserted, {totalToUpdate} updated.", isComplete: true);
            }
            catch (Exception ex)
            {
                Serilog.Log.Error(ex, "EmployeeUpdate background execution failed.");
                await SendProgress(connectionId, 100, $"Error: {ex.Message}", isError: true);
            }
        });

        return Ok(new { success = true, message = "Employee update initiated..." });
    }

    private async Task SendProgress(string? connectionId, int progressvalue, string subTabContent, bool isComplete = false, bool isError = false)
    {
        if (string.IsNullOrEmpty(connectionId)) return;

        var result = new SignalRResult
        {
            status = isComplete ? "complete" : (isError ? "error" : "saving ..."),
            tabName = "Employee Update",
            subTabContent = subTabContent,
            progressvalue = progressvalue,
            type = isComplete ? "complete" : (isError ? "error" : "inprogress")
        };

        try
        {
            if (FileProcessingHub._hubContext != null)
            {
                await FileProcessingHub._hubContext.Clients.Client(connectionId).SendAsync("R_OverviewLoading", new { payload = result, connectionId = connectionId });
            }
        }
        catch (Exception ex)
        {
            Serilog.Log.Error(ex, "Failed to send SignalR progress update.");
        }
    }

    public class MockHttpContextAccessor : IHttpContextAccessor
    {
        public HttpContext? HttpContext { get; set; }
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
            "MKT" => "?",
            _ => "?"
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
