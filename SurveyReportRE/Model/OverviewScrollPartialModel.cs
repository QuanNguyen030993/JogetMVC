public class OverviewScrollPartialModel
{
    public string Prefix { get; set; } = JogetMVC.Model.QTViewIdHelper.Prefix;
    public string ModuleCode { get; set; } = JogetMVC.Model.QTViewIdHelper.Prefix;
    public string Id { get; set; } = "";
    public string Guid { get; set; } = "";
    public long? CloneId { get; set; } = 0;
    public string CopyFromGuid { get; set; } = "";
}
