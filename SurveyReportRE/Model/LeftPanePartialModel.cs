namespace JogetMVC.Model
{
    public class LeftPanePartialModel
    {
        public string Prefix { get; set; } = QTViewIdHelper.Prefix;
        public string Title { get; set; } = "Your Quotations";
        public string SearchWidth { get; set; } = "210px";
        public string SearchPlaceholder { get; set; } = "Search...";
    }
}
