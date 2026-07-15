namespace ERPCore.Models.Request
{
    public sealed class BulkUpdateRequest<TItem>
    {
        public List<TItem> Items { get; set; } = new();
        public List<string> UpdateFields { get; set; } = new();
    }

    public sealed class BulkDeleteRequest
    {
        public List<long> Ids { get; set; } = new();

        // Delete softly by default. Set true only when the test must remove rows physically.
        public bool HardDelete { get; set; }
    }
}
