using ERPCore.Models.Migration.Base;

namespace ERPCore.Models.Migration.Config
{
    public class SqlStoredProcedure : BaseModel
    {
        public string Name { get; set; } = "";
        public string Definition { get; set; } = "";
    }
}
