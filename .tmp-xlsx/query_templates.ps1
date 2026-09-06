$dbConn = New-Object System.Data.SqlClient.SqlConnection 'Server=.\SQLSERVER2016;Database=WorkflowManagementv2;User ID=sa;Password=password@123;Encrypt=False;TrustServerCertificate=True'
$dbConn.Open()

function Read-TemplateRows([string]$sql, [string[]]$columns) {
    $cmd = $dbConn.CreateCommand()
    $cmd.CommandText = $sql
    $reader = $cmd.ExecuteReader()
    $rows = @()
    while ($reader.Read()) {
        $row = [ordered]@{}
        foreach ($column in $columns) {
            $value = $reader[$column]
            $row[$column] = if ($value -is [DBNull]) { $null } else { $value }
        }
        $rows += [pscustomobject]$row
    }
    $reader.Close()
    return $rows
}

$notificationRows = Read-TemplateRows @"
SELECT Id, TemplateName, Title,
       COALESCE(NULLIF(ClearContent,''), Content) AS Content
FROM dbo.NotificationTemplate
WHERE Deleted = 0 AND IsActive = 1
ORDER BY Id
"@ @('Id','TemplateName','Title','Content')

$mailRows = Read-TemplateRows @"
SELECT Id, TemplateName, TemplateMailTitle,
       COALESCE(NULLIF(ClearContent,''), TemplateContent) AS Content
FROM dbo.MailTemplate
WHERE Deleted = 0 AND IsActive = 1
ORDER BY Id
"@ @('Id','TemplateName','TemplateMailTitle','Content')

$dbConn.Close()

[pscustomobject]@{
    NotificationTemplate = $notificationRows
    MailTemplate = $mailRows
} | ConvertTo-Json -Depth 5 -Compress
