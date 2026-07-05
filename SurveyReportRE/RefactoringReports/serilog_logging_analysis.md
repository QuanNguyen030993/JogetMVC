# Báo cáo Phân tích & Đánh giá Hệ thống Ghi Log (Serilog) trong SurveyReportRE

Báo cáo này tập trung phân tích sâu vào cơ chế ghi log (logging) hiện tại của hệ thống, chỉ ra các điểm chưa nhất quán, các phản mẫu (anti-pattern) ảnh hưởng đến hiệu năng và đề xuất phương án cải thiện cụ thể.

---

## 1. Các Vấn Đề Ghi Log & Bất Nhất Quán (Logging Inconsistencies)

### 🔴 Khởi tạo lại Serilog liên tục trên mỗi lệnh ghi lỗi (Performance Bottleneck)
- **Vấn đề**: Trong [LoggerUtil.cs](file:///d:/Source/MySource/JogetMVC/RESurveyTool.Common/Common/LoggerUtil.cs#L103-L120), các hàm `LogError` và `LogInfo` thực hiện cấu hình và khởi tạo mới Serilog mỗi khi được gọi:
  ```csharp
  public static void LogError(Exception ex, string message = "", string connection = "")
  {
      _logger = new LoggerConfiguration()
                .MinimumLevel.Information()
                .Enrich.FromLogContext()
                .WriteTo.MSSqlServer(connection, ...)
                .CreateLogger();
      _logger?.Error(ex, message);
  }
  ```
- **Tác hại**: Serilog được thiết kế để cấu hình một lần duy nhất khi khởi động ứng dụng (Singleton). Việc chạy `new LoggerConfiguration().CreateLogger()` cho mỗi dòng log lỗi sẽ tạo ra luồng kết nối database mới, gây **rò rỉ bộ nhớ (memory leaks)**, **cạn kiệt Connection Pool** của Database và làm giảm đáng kể hiệu năng ứng dụng dưới tải cao.

### 🔴 Nuốt lỗi hoàn toàn bằng Catch Block trống (Swallowed Exceptions)
- **Vấn đề**: Hệ thống tồn tại nhiều khối `catch` rỗng, không thực hiện ghi nhận lỗi dưới bất kỳ hình thức nào:
  * Trong [BaseRepository.cs](file:///d:/Source/MySource/JogetMVC/SurveyReportRE/Repository/BaseRepository.cs#L188-L191) khi thực hiện cơ chế fallback dữ liệu:
    ```csharp
    catch (Exception exFrom)
    {
    }
    ```
  * Trong [HttpRequestAuditLogMiddleware.cs](file:///d:/Source/MySource/JogetMVC/SurveyReportRE/Common/HttpRequestAuditLogMiddleware.cs#L305-L308) khi ghi nhật ký audit log vào database thất bại:
    ```csharp
    catch (Exception ex)
    {
    }
    ```
- **Tác hại**: Lỗi xảy ra âm thầm, quản trị viên không thể phát hiện ra hệ thống đang hoạt động sai (ví dụ: Audit Log bị lỗi không ghi được vào DB nhưng hệ thống vẫn chạy bình thường mà không cảnh báo).

### 🟡 Chặn bắt ngoại lệ nhưng không Log (Exceptions Caught without Logging)
- **Vấn đề**: Nhiều vị trí bắt ngoại lệ để trả về mã lỗi HTTP nhưng bỏ qua việc log chi tiết lỗi:
  * Trong [QuotationController.cs](file:///d:/Source/MySource/JogetMVC/SurveyReportRE/Controllers/Business/Data/QuotationController.cs#L1346):
    ```csharp
    catch (Exception ex)
    {
        return BadRequest(new { ... }); // Không ghi log!
    }
    ```
  * Trong [DocumentController.cs](file:///d:/Source/MySource/JogetMVC/SurveyReportRE/Controllers/Business/Data/DocumentController.cs#L250):
    ```csharp
    catch (Exception ex)
    {
        return StatusCode(500, new { message = "Convert failed", detail = ex.Message }); // Không ghi log!
    }
    ```
- **Tác hại**: Gây cực kỳ khó khăn cho việc giám sát lỗi (Monitoring) và debug lỗi sản xuất vì Serilog hoàn toàn trống rỗng trong các tình huống này.

### 🟡 Tiêm Logger nhưng không sử dụng (Unused Injected Loggers)
- **Vấn đề**: Tất cả các Controller kế thừa từ `BaseControllerApi<T>` (ví dụ: [QuotationProcessController.cs](file:///d:/Source/MySource/JogetMVC/SurveyReportRE/Controllers/Business/Data/QuotationProcessController.cs#L44)) đều khai báo tiêm `ILogger<T>` qua constructor nhưng:
  1. Không truyền xuống `base(...)` vì constructor của lớp cha không nhận tham số Logger.
  2. Không lưu trữ vào biến cục bộ của lớp con.
  *Trong khi đó*, [BaseControllerApi.cs](file:///d:/Source/MySource/JogetMVC/SurveyReportRE/Controllers/Base/BaseControllerApi.cs#L45) tự tạo logger riêng bằng cách gọi `LoggerFactory.Create` thủ công (chỉ cấu hình Console).
- **Tác hại**: Làm phình cấu trúc code, gây hiểu lầm cho lập trình viên và bỏ qua cơ chế logging tập trung của Serilog trên môi trường thực tế.

### 🟡 Lỗi Logic Khởi tạo Logger khi `blobPath` Trống
- **Vấn đề**: Tại hàm `LoggerUtil.InitializeLogger` thuộc [LoggerUtil.cs](file:///d:/Source/MySource/JogetMVC/RESurveyTool.Common/Common/LoggerUtil.cs#L42-L44):
  ```csharp
  else
  {
      SelfLog.Enable(msg => File.AppendAllText(Path.Combine(blobPath, "LibLogs", "serilog-errors.txt"), msg));
  ```
  Nhánh `else` được chạy khi `blobPath` bằng **null hoặc rỗng**. Tuy nhiên trong nhánh này lại gọi `Path.Combine(blobPath, ...)` dẫn đến ném ra `ArgumentException` và làm hàm khởi tạo thất bại âm thầm (do nằm trong khối `catch` rỗng).

---

## 2. Hướng Khắc Phục & Đề Xuất Thiết Kế Lại (Remediation Design)

### 1. Đồng bộ cơ chế Dependency Injection (DI) cho Logging
- Chỉnh sửa lớp cơ sở [BaseControllerApi.cs](file:///d:/Source/MySource/JogetMVC/SurveyReportRE/Controllers/Base/BaseControllerApi.cs) nhận trực tiếp `ILogger<BaseControllerApi<T>>` từ DI Container:
  ```csharp
  public class BaseControllerApi<T> : ControllerBase where T : class, new()
  {
      protected readonly ILogger<BaseControllerApi<T>> _logger;
      protected readonly IBaseRepository<T> _BaseRepository;

      public BaseControllerApi(IBaseRepository<T> BaseRepository, ILogger<BaseControllerApi<T>> logger, IHttpContextAccessor httpContextAccessor)
      {
          _BaseRepository = BaseRepository;
          _logger = logger;
          // ...
      }
  }
  ```
- Cập nhật các Controller con để chuyển logger xuống lớp base qua `base(BaseRepository, logger, httpContextAccessor)`.

### 2. Thiết kế lại LoggerUtil thành Singleton
- Không khởi tạo lại `LoggerConfiguration` trong các hàm tĩnh. Thay vào đó, hãy cấu hình Serilog một lần duy nhất tại [Program.cs](file:///d:/Source/MySource/JogetMVC/SurveyReportRE/Program.cs):
  ```csharp
  builder.Host.UseSerilog((context, services, configuration) => configuration
      .ReadFrom.Configuration(context.Configuration)
      .Enrich.FromLogContext());
  ```
- Cập nhật [LoggerUtil.cs](file:///d:/Source/MySource/JogetMVC/RESurveyTool.Common/Common/LoggerUtil.cs) để sử dụng static `Log.Logger` (đã được cấu hình chung bởi host) thay vì tự tạo logger cục bộ:
  ```csharp
  public static void LogError(Exception ex, string message = "")
  {
      Log.Error(ex, message); // Dùng trực tiếp cơ sở hạ tầng Serilog toàn cục
  }
  ```

### 3. Chuẩn hóa Khối Catch và loại bỏ "Nuốt lỗi"
- Đảm bảo mọi khối `catch` bắt buộc phải ghi nhận lỗi vào Serilog trước khi đưa ra quyết định xử lý tiếp theo:
  ```csharp
  catch (Exception ex)
  {
      Log.Error(ex, "Thao tác X bị thất bại.");
      throw; // Hoặc return StatusCode(500);
  }
  ```
- Thay thế việc ghi log file thủ công bằng cách sử dụng File Sink chính thức của Serilog (cấu hình trong `appsettings.json`).
