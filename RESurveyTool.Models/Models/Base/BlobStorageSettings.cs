namespace ERPCore.Models.Base
{
    public class BlobStorageSettings
    {
        public string Path { get; set; } = "";
        public string DeployPath { get; set; } = "";
        public string TemplateFolder { get; set; } = "";
        public string AskingSignature { get; set; } = "";
        public string Sign { get; set; } = "";
        public string QuotationAttachmentFolder { get; set; } = "";
        public string PolicyIssuanceAttachmentFolder { get; set; } = "";
    }
}
