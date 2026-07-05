# Báo cáo Phân tích Mã nguồn & Đề xuất Refactor/Clean Code cho SurveyReportRE

Dự án [SurveyReportRE](file:///d:/Source/MySource/JogetMVC/SurveyReportRE) là một hệ thống hybrid kết hợp giữa backend **ASP.NET Core 8 (Razor Pages + Web API)** và các frontend module nhỏ viết bằng **React/Vite** ([XYFlow](file:///d:/Source/MySource/JogetMVC/SurveyReportRE/XYFLow), [ITAdmin](file:///d:/Source/MySource/JogetMVC/SurveyReportRE/ITAdmin), [TMIVCom](file:///d:/Source/MySource/JogetMVC/SurveyReportRE/TMIVCom)). 

Dưới đây là phân tích chi tiết về các điểm chưa tối ưu, các lỗi nghiêm trọng (security/build pipeline) và các hướng refactor cụ thể giúp mã nguồn sạch hơn, an toàn và dễ bảo trì hơn.

---

## 1. Các vấn đề Bảo mật Nghiêm trọng (Security Vulnerabilities)

### 🔴 Hardcode định danh người dùng (User Identity Bypass)
- **Vấn đề**: Trong constructor của [BaseControllerApi.cs](file:///d:/Source/MySource/JogetMVC/SurveyReportRE/Controllers/Base/BaseControllerApi.cs#L58-L60), thông tin user được gán cứng là `"quan.nh"` cho mọi request:
  ```csharp
  var newIdentity = new ClaimsIdentity();
  newIdentity.AddClaim(new System.Security.Claims.Claim(newIdentity.NameClaimType, "quan.nh"));
  httpContextAccessor.HttpContext.User = new ClaimsPrincipal(newIdentity);
  ```
  Tương tự, trong [ControllerUtil.cs](file:///d:/Source/MySource/JogetMVC/SurveyReportRE/Common/ControllerUtil.cs#L42-L51), hàm `GetCurrentContextUser` cũng tự động fallback về user gán cứng này nếu ở môi trường Debug.
- **Tác hại**: Bỏ qua hoàn toàn cơ chế xác thực thực tế (Negotiate/Active Directory) trong môi trường phát triển/thử nghiệm, tạo rủi ro lớn nếu đoạn code này vô tình bị đẩy lên production.
- **Đề xuất**: Loại bỏ việc gán cứng danh tính người dùng trong constructor. Sử dụng cơ chế Mock Authentication hoặc Configuration-driven impersonation chỉ giới hạn trong môi trường `Development` và cấu hình qua [appsettings.Development.json](file:///d:/Source/MySource/JogetMVC/SurveyReportRE/appsettings.Development.json) (không đưa vào file code chính).

### 🔴 Nguy cơ SQL Injection qua String Interpolation
- **Vấn đề**: Trong [BaseRepository.cs](file:///d:/Source/MySource/JogetMVC/SurveyReportRE/Repository/BaseRepository.cs#L657-L658) và [Util.cs](file:///d:/Source/MySource/JogetMVC/RESurveyTool.Common/Common/Util.cs#L663-L673), nhiều truy vấn SQL động được ghép chuỗi hoặc nội suy trực tiếp (String Interpolation) thay vì sử dụng tham số hóa (Parameterized Query) của Dapper.
  *Ví dụ:*
  ```csharp
  var sql = $@"SELECT EnumData.* FROM EnumData WITH (NOLOCK) 
              WHERE EnumData.Name = '{name}'";
  ```
  Giá trị `name` này được truyền trực tiếp từ query parameter của API HTTP GET qua các Controller.
- **Tác hại**: Người dùng bên ngoài có thể chèn các mã độc SQL (SQL Injection) để đọc, sửa đổi hoặc xóa dữ liệu trong database.
- **Đề xuất**: Chuyển toàn bộ các câu truy vấn động sang dạng Parameterized Query của Dapper:
  ```csharp
  var sql = @"SELECT EnumData.* FROM EnumData WITH (NOLOCK) 
              WHERE EnumData.Name = @Name";
  var result = await connection.QueryAsync<T>(sql, new { Name = name });
  ```

### 🟡 Hardcode mật khẩu và thông tin nhạy cảm (Sensitive Credentials)
- **Vấn đề**: Trong [appsettings.json](file:///d:/Source/MySource/JogetMVC/SurveyReportRE/appsettings.json#L4-L8), connection string chứa đầy đủ tài khoản/mật khẩu database (`sa`/`password@123`, `jogetprd`/`Tmiv#2021`). Mật khẩu email gửi tin cũng được gán cứng ở dạng plain text (`Password: "Tmiv#202112"`).
- **Tác hại**: Rò rỉ thông tin đăng nhập hệ thống khi mã nguồn được đẩy lên các hệ thống Git chung.
- **Đề xuất**: Sử dụng **User Secrets** khi phát triển ở local và chuyển sang dùng **Environment Variables** (Biến môi trường) hoặc hệ thống quản lý khóa an toàn (như Azure Key Vault, HashiCorp Vault) khi deploy lên server.

---

## 2. Xung đột trong Build Pipeline các dự án React (Build Pipeline Conflict)

- **Vấn đề**: Cả dự án [XYFlow](file:///d:/Source/MySource/JogetMVC/SurveyReportRE/XYFLow/package.json) và [ITAdmin](file:///d:/Source/MySource/JogetMVC/SurveyReportRE/ITAdmin/package.json) đều được cấu hình build ra cùng thư mục tạm `../wwwroot/dist` và sử dụng file script [move-to-wwwroot.js](file:///d:/Source/MySource/JogetMVC/SurveyReportRE/XYFLow/move-to-wwwroot.js) giống hệt nhau:
  1. Xóa thư mục `wwwroot/assets` nếu tồn tại.
  2. Di chuyển thư mục `wwwroot/dist/assets` vào `wwwroot/assets`.
- **Tác hại**: **Ghi đè và triệt tiêu lẫn nhau.** Khi bạn build dự án `XYFlow`, nó sẽ xóa sạch assets của `ITAdmin` và ngược lại. Dự án nào build sau cùng sẽ là dự án duy nhất hoạt động bình thường trên backend.
- **Đề xuất**: Cô lập thư mục build cho từng ứng dụng giống như cách làm của [TMIVCom](file:///d:/Source/MySource/JogetMVC/SurveyReportRE/TMIVCom/move-to-wwwroot.js):
  - Thay đổi `base` và `outDir` trong file cấu hình Vite của từng dự án thành thư mục riêng biệt (ví dụ: `/XYFlow/` và `/ITAdmin/`).
  - Cập nhật script di chuyển file để gom assets vào các thư mục tương ứng trong `wwwroot` (ví dụ: `wwwroot/XYFlow/assets` và `wwwroot/ITAdmin/assets`).

---

## 3. Các vấn đề về Kiến trúc & Thiết kế Code (Code Smell & Architecture)

### 🟡 Khởi tạo Logger thủ công (Manual Logger Instantiation)
- **Vấn đề**: Tại constructor của [BaseControllerApi.cs](file:///d:/Source/MySource/JogetMVC/SurveyReportRE/Controllers/Base/BaseControllerApi.cs#L45) và trong hàm `LogAction` của [ControllerUtil.cs](file:///d:/Source/MySource/JogetMVC/SurveyReportRE/Common/ControllerUtil.cs#L364), dự án đang dùng:
  ```csharp
  using var loggerFactory = LoggerFactory.Create(loggingBuilder => loggingBuilder.AddConsole());
  var logger = loggerFactory.CreateLogger<T>();
  ```
  Cách này tạo mới hoàn toàn một Logging Factory cho mỗi request/hành động, bỏ qua cơ chế Dependency Injection (DI) của ASP.NET Core, gây lãng phí tài nguyên và không đồng bộ với cấu hình Serilog của hệ thống.
- **Đề xuất**: Inject trực tiếp `ILogger<T>` hoặc `ILoggerFactory` qua DI container vào constructor của Controller.

### 🟡 View phình to / Monolithic Razor View
- **Vấn đề**: File [Management.cshtml](file:///d:/Source/MySource/JogetMVC/SurveyReportRE/Pages/Management.cshtml) dài hơn **1400 dòng**, trong đó chứa lượng lớn mã JavaScript inline để cấu hình DevExtreme controls (như `dxDataGrid`, `dxForm`, `dxPopover`). Việc trộn lẫn HTML Helper, Razor directive và hàng trăm dòng JS làm file trở nên rất khó bảo trì và debug.
- **Đề xuất**: Tách phần logic JavaScript ra các file tĩnh riêng biệt (ví dụ: `wwwroot/js/app/management.js`) và chỉ import vào trang Razor Page qua thẻ `<script src="...">`. Hoặc chuyển hướng chuyển dịch các trang quản trị này vào các ứng dụng React để xử lý client-side hoàn toàn.

### 🟡 Nguy cơ tranh chấp luồng (Thread-safety Issue) trong Repository
- **Vấn đề**: Trong [BaseRepository.cs](file:///d:/Source/MySource/JogetMVC/SurveyReportRE/Repository/BaseRepository.cs#L293-L302), các hàm thay đổi môi trường kết nối database (`DbContextEnvironmentChange` và `DbContextJogetEnvironmentChange`) thực hiện gán trị trực tiếp cho thuộc tính **static** `ControllerUtil.tmivEnvironment` và `ControllerUtil.jogetEnvironment`:
  ```csharp
  ControllerUtil.tmivEnvironment = environment;
  ```
- **Tác hại**: Thuộc tính `static` được chia sẻ chung cho toàn bộ ứng dụng (tất cả các request của mọi người dùng). Khi có 2 request đồng thời từ 2 người dùng khác nhau yêu cầu thao tác trên 2 môi trường khác nhau (ví dụ: UAT và Production), việc ghi đè biến static này sẽ dẫn đến việc người dùng này vô tình thực thi câu lệnh SQL trên môi trường của người dùng kia.
- **Đề xuất**: Cấu hình kết nối động (Connection Multiplexing) hoặc đưa thông tin môi trường vào HttpContext/Session/Header của request thay vì lưu trữ ở biến tĩnh toàn cục (`static`).

### 🟡 Hardcode đường dẫn thư mục tuyệt đối
- **Vấn đề**: Trong [Program.cs](file:///d:/Source/MySource/JogetMVC/SurveyReportRE/Program.cs#L114), đường dẫn lưu trữ keys của Data Protection được gán cứng:
  ```csharp
  .PersistKeysToFileSystem(new DirectoryInfo(@"C:\AppKeys\MyApp"))
  ```
  Đường dẫn này mang tính đặc thù Windows và yêu cầu quyền ghi trên ổ C, gây lỗi khi deploy sang máy chủ khác hoặc đóng gói Docker container chạy Linux.
- **Đề xuất**: Chuyển đường dẫn này vào cấu hình `appsettings.json` hoặc sử dụng thư mục tạm dựa trên môi trường của ứng dụng (`Path.Combine(builder.Environment.ContentRootPath, "AppKeys")`).

### 🟡 Mã nguồn chết (Dead Code)
- **Vấn đề**: File [UserIdEnricher.cs](file:///d:/Source/MySource/JogetMVC/SurveyReportRE/Model/UserIdEnricher.cs) định nghĩa một bộ enricher cho Serilog nhưng không hề được đăng ký sử dụng trong cấu hình Logger ở [Program.cs](file:///d:/Source/MySource/JogetMVC/SurveyReportRE/Program.cs). Ngoài ra còn rất nhiều khối lệnh đã bị comment/vô hiệu hóa rải rác ở khắp các file Controller và Repository.
- **Đề xuất**: Dọn dẹp sạch mã nguồn chết, đăng ký Serilog enricher nếu cần hoặc xóa bỏ các file không dùng để giảm thiểu dung lượng dự án.
