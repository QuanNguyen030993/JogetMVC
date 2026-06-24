using System.ComponentModel.DataAnnotations;

namespace ERPCore.Models.Request
{
	public class MGridRequest
    {
        public Dictionary<string,int> Ids { get; set; } = new Dictionary<string, int>();
        public string ModelName { get; set; } = "";
        public long? ModelId { get; set; } = 0;

    }
}
