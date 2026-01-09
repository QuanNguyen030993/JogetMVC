using ERPCore.Models.Migration.Base;
using System.ComponentModel.DataAnnotations;

namespace ERPCore.Models.Migration.Config
{
    public class HttpRequestAuditLog : BaseModel
    {
        public string TraceId { get; set; }              // HttpContext.TraceIdentifier
        public DateTimeOffset RequestTimeUtc { get; set; }

        // ===== Request =====
        public string Scheme { get; set; }               // http / https
        public string Method { get; set; }               // GET / POST / PUT
        public string Path { get; set; }                 // /api/Survey/GetSingleInclude/9
        public string QueryString { get; set; }          // ?a=1&b=2
        public string FullUrl { get; set; }               // https://host/api/...

        // ===== Routing =====
        public string Controller { get; set; }           // Survey
        public string Action { get; set; }                // GetSingleInclude
        public string RouteValues { get; set; }           // JSON: { id: 9 }

        // ===== Client =====
        public string ClientIp { get; set; }
        public string UserAgent { get; set; }
        public string Referer { get; set; }

        // ===== Authentication =====
        public string UserName { get; set; }              // Context.User.Identity.Name
        public bool IsAuthenticated { get; set; }
        public string AuthenticationType { get; set; }   // Bearer / Cookies / Negotiate
        public string Claims { get; set; }                // JSON nếu cần

        // ===== Request Body =====
        public string ContentType { get; set; }
        public long? ContentLength { get; set; }
        public string RequestBody { get; set; }           // JSON / Form / Raw (optional)

        // ===== Response =====
        public int StatusCode { get; set; }
        public long ElapsedMilliseconds { get; set; }

        // ===== Error =====
        public bool HasException { get; set; }
        public string Exception { get; set; }

        // ===== Extra =====
        public string Source { get; set; }                // MVC / API / Ajax
        public string CustomTags { get; set; }            // JSON: module, feature...
        public string Token { get; set; }
        public string EncryptMethod { get; set; }
    }

}
