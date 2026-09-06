USE [WorkflowManagementv2]
GO

IF COL_LENGTH('dbo.MailTemplate', 'ClearContent') IS NULL
BEGIN
    ALTER TABLE dbo.MailTemplate ADD ClearContent NVARCHAR(MAX) NULL;
END
GO

IF COL_LENGTH('dbo.NotificationTemplate', 'ClearContent') IS NULL
BEGIN
    ALTER TABLE dbo.NotificationTemplate ADD ClearContent NVARCHAR(MAX) NULL;
END
GO
