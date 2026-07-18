-- =========================================================================
-- NOTIFICATIONTEMPLATE SEED/INSERT SCRIPT
-- =========================================================================

BEGIN TRANSACTION;
BEGIN TRY
    -- 1. Insert InitializeMessage if it does not exist
    IF NOT EXISTS (SELECT 1 FROM NotificationTemplate WHERE TemplateName = 'InitializeMessage' AND Deleted = 0)
    BEGIN
        INSERT INTO NotificationTemplate (
            TemplateName, Title, Content, IsActive, Guid, CreatedBy, CreatedDate, ModifiedBy, ModifiedDate, Deleted
        ) VALUES (
            N'InitializeMessage', 
            N'Initiate WorkflowManagement {0}', 
            N'You have new WorkflowManagement', 
            1, NEWID(), N'quan.nh', GETDATE(), N'', GETDATE(), 0
        );
        PRINT 'Inserted NotificationTemplate: InitializeMessage';
    END
    ELSE
    BEGIN
        PRINT 'NotificationTemplate InitializeMessage already exists.';
    END

    -- 2. Insert OverviewMessageLoading if it does not exist
    IF NOT EXISTS (SELECT 1 FROM NotificationTemplate WHERE TemplateName = 'OverviewMessageLoading' AND Deleted = 0)
    BEGIN
        INSERT INTO NotificationTemplate (
            TemplateName, Title, Content, IsActive, Guid, CreatedBy, CreatedDate, ModifiedBy, ModifiedDate, Deleted
        ) VALUES (
            N'OverviewMessageLoading', 
            N'Initiate WorkflowManagement', 
            N'Please wait...', 
            1, NEWID(), N'quan.nh', GETDATE(), N'', GETDATE(), 0
        );
        PRINT 'Inserted NotificationTemplate: OverviewMessageLoading';
    END
    ELSE
    BEGIN
        PRINT 'NotificationTemplate OverviewMessageLoading already exists.';
    END

    COMMIT TRANSACTION;
    PRINT 'Transaction committed successfully. Notification templates configured! ✅';
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    PRINT 'Error occurred, transaction rolled back. ❌';
    THROW;
END CATCH
