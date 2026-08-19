namespace ERPCore.Models.Models.Parsing
{
    public class DigisignCallbackResult
    {
        public string JobId { get; set; } = default!;
        public string Status { get; set; } = default!;
        public string? FileName { get; set; }
        public string? ContentType { get; set; }
        public string? FileBase64 { get; set; }
        public object? Metadata { get; set; }
        public string? Error { get; set; }
        public DateTime ConvertedAt { get; set; } = DateTime.UtcNow;
    }
}
