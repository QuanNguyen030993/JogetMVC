-- =========================================================================
-- NOTIFICATIONTEMPLATE WITH TYPES SEED/INSERT SCRIPT
-- =========================================================================

BEGIN TRANSACTION;
BEGIN TRY
    -- 1. Resolve TypeIds from EnumData
    DECLARE @DefaultId BIGINT;
    DECLARE @AssignId BIGINT;
    DECLARE @SystemId BIGINT;
    DECLARE @PolicyIssuanceId BIGINT;
    DECLARE @QuotationId BIGINT;
    DECLARE @AcceptId BIGINT;
    DECLARE @SuccessId BIGINT;
    DECLARE @FailId BIGINT;
    DECLARE @InitialId BIGINT;
    DECLARE @ReminderId BIGINT;
    DECLARE @AlertId BIGINT;

    SELECT @DefaultId = Id FROM EnumData WHERE Name = 'NotificationType' AND Value = 'Default' AND Deleted = 0;
    SELECT @AssignId = Id FROM EnumData WHERE Name = 'NotificationType' AND Value = 'Assign' AND Deleted = 0;
    SELECT @SystemId = Id FROM EnumData WHERE Name = 'NotificationType' AND Value = 'System' AND Deleted = 0;
    SELECT @PolicyIssuanceId = Id FROM EnumData WHERE Name = 'NotificationType' AND Value = 'PolicyIssuance' AND Deleted = 0;
    SELECT @QuotationId = Id FROM EnumData WHERE Name = 'NotificationType' AND Value = 'Quotation' AND Deleted = 0;
    SELECT @AcceptId = Id FROM EnumData WHERE Name = 'NotificationType' AND Value = 'Accept' AND Deleted = 0;
    SELECT @SuccessId = Id FROM EnumData WHERE Name = 'NotificationType' AND Value = 'Success' AND Deleted = 0;
    SELECT @FailId = Id FROM EnumData WHERE Name = 'NotificationType' AND Value = 'Fail' AND Deleted = 0;
    SELECT @InitialId = Id FROM EnumData WHERE Name = 'NotificationType' AND Value = 'Initial' AND Deleted = 0;
    SELECT @ReminderId = Id FROM EnumData WHERE Name = 'NotificationType' AND Value = 'Reminder' AND Deleted = 0;
    SELECT @AlertId = Id FROM EnumData WHERE Name = 'NotificationType' AND Value = 'Alert' AND Deleted = 0;

    -- 2. Link existing templates to their TypeId
    UPDATE NotificationTemplate SET TypeId = @InitialId WHERE TemplateName = 'InitializeMessage' AND Deleted = 0;
    UPDATE NotificationTemplate SET TypeId = @SystemId WHERE TemplateName = 'OverviewMessageLoading' AND Deleted = 0;

    -- 3. Insert specific templates for all types if they do not exist
    
    -- Default
    IF NOT EXISTS (SELECT 1 FROM NotificationTemplate WHERE TemplateName = 'DefaultNotification' AND Deleted = 0)
    BEGIN
        INSERT INTO NotificationTemplate (
            TemplateName, Title, Content, TypeId, IsActive, Guid, CreatedBy, CreatedDate, ModifiedBy, ModifiedDate, Deleted
        ) VALUES (
            N'DefaultNotification', N'Notification: {0}', N'You have a new update. Please review the system logs or inbox.', @DefaultId, 1, NEWID(), N'quan.nh', GETDATE(), N'', GETDATE(), 0
        );
        PRINT 'Inserted DefaultNotification';
    END

    -- Assign
    IF NOT EXISTS (SELECT 1 FROM NotificationTemplate WHERE TemplateName = 'AssignNotification' AND Deleted = 0)
    BEGIN
        INSERT INTO NotificationTemplate (
            TemplateName, Title, Content, TypeId, IsActive, Guid, CreatedBy, CreatedDate, ModifiedBy, ModifiedDate, Deleted
        ) VALUES (
            N'AssignNotification', N'Task Assigned: {0}', N'A new workflow task has been assigned to you. Please check your inbox and process it.', @AssignId, 1, NEWID(), N'quan.nh', GETDATE(), N'', GETDATE(), 0
        );
        PRINT 'Inserted AssignNotification';
    END

    -- System
    IF NOT EXISTS (SELECT 1 FROM NotificationTemplate WHERE TemplateName = 'SystemNotification' AND Deleted = 0)
    BEGIN
        INSERT INTO NotificationTemplate (
            TemplateName, Title, Content, TypeId, IsActive, Guid, CreatedBy, CreatedDate, ModifiedBy, ModifiedDate, Deleted
        ) VALUES (
            N'SystemNotification', N'System Alert: {0}', N'This is a system-generated alert message. Please contact your IT administrator if you require support.', @SystemId, 1, NEWID(), N'quan.nh', GETDATE(), N'', GETDATE(), 0
        );
        PRINT 'Inserted SystemNotification';
    END

    -- PolicyIssuance
    IF NOT EXISTS (SELECT 1 FROM NotificationTemplate WHERE TemplateName = 'PolicyIssuanceNotification' AND Deleted = 0)
    BEGIN
        INSERT INTO NotificationTemplate (
            TemplateName, Title, Content, TypeId, IsActive, Guid, CreatedBy, CreatedDate, ModifiedBy, ModifiedDate, Deleted
        ) VALUES (
            N'PolicyIssuanceNotification', N'Policy Issuance Update: {0}', N'The policy issuance status has been updated. Please check the details in the system.', @PolicyIssuanceId, 1, NEWID(), N'quan.nh', GETDATE(), N'', GETDATE(), 0
        );
        PRINT 'Inserted PolicyIssuanceNotification';
    END

    -- Quotation
    IF NOT EXISTS (SELECT 1 FROM NotificationTemplate WHERE TemplateName = 'QuotationNotification' AND Deleted = 0)
    BEGIN
        INSERT INTO NotificationTemplate (
            TemplateName, Title, Content, TypeId, IsActive, Guid, CreatedBy, CreatedDate, ModifiedBy, ModifiedDate, Deleted
        ) VALUES (
            N'QuotationNotification', N'Quotation Process: {0}', N'The quotation has transitioned to the next step. Please review and take the necessary actions.', @QuotationId, 1, NEWID(), N'quan.nh', GETDATE(), N'', GETDATE(), 0
        );
        PRINT 'Inserted QuotationNotification';
    END

    -- Accept
    IF NOT EXISTS (SELECT 1 FROM NotificationTemplate WHERE TemplateName = 'AcceptNotification' AND Deleted = 0)
    BEGIN
        INSERT INTO NotificationTemplate (
            TemplateName, Title, Content, TypeId, IsActive, Guid, CreatedBy, CreatedDate, ModifiedBy, ModifiedDate, Deleted
        ) VALUES (
            N'AcceptNotification', N'Request Accepted: {0}', N'The request has been accepted. The workflow will proceed to the next step.', @AcceptId, 1, NEWID(), N'quan.nh', GETDATE(), N'', GETDATE(), 0
        );
        PRINT 'Inserted AcceptNotification';
    END

    -- Success
    IF NOT EXISTS (SELECT 1 FROM NotificationTemplate WHERE TemplateName = 'SuccessNotification' AND Deleted = 0)
    BEGIN
        INSERT INTO NotificationTemplate (
            TemplateName, Title, Content, TypeId, IsActive, Guid, CreatedBy, CreatedDate, ModifiedBy, ModifiedDate, Deleted
        ) VALUES (
            N'SuccessNotification', N'Process Completed Successfully: {0}', N'The process was completed successfully. All steps have been verified.', @SuccessId, 1, NEWID(), N'quan.nh', GETDATE(), N'', GETDATE(), 0
        );
        PRINT 'Inserted SuccessNotification';
    END

    -- Fail
    IF NOT EXISTS (SELECT 1 FROM NotificationTemplate WHERE TemplateName = 'FailNotification' AND Deleted = 0)
    BEGIN
        INSERT INTO NotificationTemplate (
            TemplateName, Title, Content, TypeId, IsActive, Guid, CreatedBy, CreatedDate, ModifiedBy, ModifiedDate, Deleted
        ) VALUES (
            N'FailNotification', N'Process Failed: {0}', N'The process has failed. Please check the details, fix any issues, and try again.', @FailId, 1, NEWID(), N'quan.nh', GETDATE(), N'', GETDATE(), 0
        );
        PRINT 'Inserted FailNotification';
    END

    -- Initial
    IF NOT EXISTS (SELECT 1 FROM NotificationTemplate WHERE TemplateName = 'InitialNotification' AND Deleted = 0)
    BEGIN
        INSERT INTO NotificationTemplate (
            TemplateName, Title, Content, TypeId, IsActive, Guid, CreatedBy, CreatedDate, ModifiedBy, ModifiedDate, Deleted
        ) VALUES (
            N'InitialNotification', N'Initiate WorkflowManagement {0}', N'You have new WorkflowManagement', @InitialId, 1, NEWID(), N'quan.nh', GETDATE(), N'', GETDATE(), 0
        );
        PRINT 'Inserted InitialNotification';
    END

    -- Reminder
    IF NOT EXISTS (SELECT 1 FROM NotificationTemplate WHERE TemplateName = 'ReminderNotification' AND Deleted = 0)
    BEGIN
        INSERT INTO NotificationTemplate (
            TemplateName, Title, Content, TypeId, IsActive, Guid, CreatedBy, CreatedDate, ModifiedBy, ModifiedDate, Deleted
        ) VALUES (
            N'ReminderNotification', N'Pending Task Reminder: {0}', N'This is a reminder that you have a pending task awaiting your action.', @ReminderId, 1, NEWID(), N'quan.nh', GETDATE(), N'', GETDATE(), 0
        );
        PRINT 'Inserted ReminderNotification';
    END

    -- Alert
    IF NOT EXISTS (SELECT 1 FROM NotificationTemplate WHERE TemplateName = 'AlertNotification' AND Deleted = 0)
    BEGIN
        INSERT INTO NotificationTemplate (
            TemplateName, Title, Content, TypeId, IsActive, Guid, CreatedBy, CreatedDate, ModifiedBy, ModifiedDate, Deleted
        ) VALUES (
            N'AlertNotification', N'Action Required: {0}', N'Urgent action is required on this workflow task. Please check the details immediately.', @AlertId, 1, NEWID(), N'quan.nh', GETDATE(), N'', GETDATE(), 0
        );
        PRINT 'Inserted AlertNotification';
    END

    COMMIT TRANSACTION;
    PRINT 'Transaction committed successfully. All Notification Templates with Types configured! ✅';
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    PRINT 'Error occurred, transaction rolled back. ❌';
    THROW;
END CATCH
