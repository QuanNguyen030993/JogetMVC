
namespace SurveyReportRE.Models.Request
{
    public class MenuHierarchy
    {
        public long Id { get; set; }
        public string Name { get; set; } = "";
        public string Caption { get; set; }
        public string Action { get; set; }
        public int? ParentId { get; set; }
        public bool HasItems { get; set; }
        public bool HasPermission { get; set; }
        public int SortOrder { get; set; }
        public string Icon { get; set; } = "";
        public string PageSystem { get; set; } = "";        
    }
}
