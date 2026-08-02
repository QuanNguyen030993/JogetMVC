-- =========================================================================
-- MIGRATION SCRIPT: BASIC USER GUIDE DATA FOR MANAGEMENT CONSOLE
-- =========================================================================

BEGIN TRANSACTION;
BEGIN TRY
    DECLARE @GuideKey NVARCHAR(100) = N'guide-management-walkthrough';
    DECLARE @GuideTitle NVARCHAR(255) = N'Management Console Walkthrough';
    DECLARE @Route NVARCHAR(500) = N'/Management';
    DECLARE @CreatedBy NVARCHAR(100) = N'quan.nh';
    DECLARE @Version INT = 1;

    -- 1. Remove any old steps for this guide if they exist
    DELETE FROM dbo.GuideStep
    WHERE GuideKey = @GuideKey;
    PRINT 'Cleared old steps for guide: ' + @GuideKey;

    -- 2. Insert new steps
    
    -- Step 1: Welcome
    INSERT INTO dbo.GuideStep (
        Guid, GuideKey, GuideTitle, GuideVersion, Route, SourceType, WikiUrl,
        MaxLoginHours, AutoStart, StepNumber, StepTitle, Selector, Placement,
        Content, ContentFormat, WaitTimeoutMs, IsEnabled,
        CreatedBy, CreatedDate, ModifiedBy, ModifiedDate, Deleted
    ) VALUES (
        NEWID(), @GuideKey, @GuideTitle, @Version, @Route, N'manual', N'',
        0, 1, 1, N'Welcome to Management Console', N'', N'center',
        N'<h3>Welcome to Workflow Management</h3><p>This console is your central hub for managing workflow requests. Let us show you around the key features.</p>',
        N'html', 1000, 1, @CreatedBy, GETDATE(), @CreatedBy, GETDATE(), 0
    );
    PRINT 'Inserted step 1: Welcome';

    -- Step 2: Environment Indicator
    INSERT INTO dbo.GuideStep (
        Guid, GuideKey, GuideTitle, GuideVersion, Route, SourceType, WikiUrl,
        MaxLoginHours, AutoStart, StepNumber, StepTitle, Selector, Placement,
        Content, ContentFormat, WaitTimeoutMs, IsEnabled,
        CreatedBy, CreatedDate, ModifiedBy, ModifiedDate, Deleted
    ) VALUES (
        NEWID(), @GuideKey, @GuideTitle, @Version, @Route, N'manual', N'',
        0, 1, 2, N'Environment Indicator', N'#environmentLabel', N'bottom',
        N'<p>This badge shows your current system environment (e.g. <b>UAT</b> or <b>Production</b>). Hovering over it displays active database connection details.</p>',
        N'html', 1000, 1, @CreatedBy, GETDATE(), @CreatedBy, GETDATE(), 0
    );
    PRINT 'Inserted step 2: Environment Indicator';

    -- Step 3: SignalR Online Dot
    INSERT INTO dbo.GuideStep (
        Guid, GuideKey, GuideTitle, GuideVersion, Route, SourceType, WikiUrl,
        MaxLoginHours, AutoStart, StepNumber, StepTitle, Selector, Placement,
        Content, ContentFormat, WaitTimeoutMs, IsEnabled,
        CreatedBy, CreatedDate, ModifiedBy, ModifiedDate, Deleted
    ) VALUES (
        NEWID(), @GuideKey, @GuideTitle, @Version, @Route, N'manual', N'',
        0, 1, 3, N'SignalR Online Status', N'#signalRMonitor', N'bottom',
        N'<p>Shows your real-time synchronization state. A green dot indicates you are online and will receive instant updates without refreshing.</p>',
        N'html', 1000, 1, @CreatedBy, GETDATE(), @CreatedBy, GETDATE(), 0
    );
    PRINT 'Inserted step 3: SignalR Dot';

    -- Step 4: Add New Button
    INSERT INTO dbo.GuideStep (
        Guid, GuideKey, GuideTitle, GuideVersion, Route, SourceType, WikiUrl,
        MaxLoginHours, AutoStart, StepNumber, StepTitle, Selector, Placement,
        Content, ContentFormat, WaitTimeoutMs, IsEnabled,
        CreatedBy, CreatedDate, ModifiedBy, ModifiedDate, Deleted
    ) VALUES (
        NEWID(), @GuideKey, @GuideTitle, @Version, @Route, N'manual', N'',
        0, 1, 4, N'Initiate New Request', N'#btnNew', N'bottom',
        N'<p>Click this button to create a new workflow request (such as a <b>Quotation</b> or <b>Policy Issuance</b>).</p>',
        N'html', 1000, 1, @CreatedBy, GETDATE(), @CreatedBy, GETDATE(), 0
    );
    PRINT 'Inserted step 4: Add New Button';

    -- Step 5: Notifications Center Bell
    INSERT INTO dbo.GuideStep (
        Guid, GuideKey, GuideTitle, GuideVersion, Route, SourceType, WikiUrl,
        MaxLoginHours, AutoStart, StepNumber, StepTitle, Selector, Placement,
        Content, ContentFormat, WaitTimeoutMs, IsEnabled,
        CreatedBy, CreatedDate, ModifiedBy, ModifiedDate, Deleted
    ) VALUES (
        NEWID(), @GuideKey, @GuideTitle, @Version, @Route, N'manual', N'',
        0, 1, 5, N'Notification Center', N'#notificationBtn', N'bottom',
        N'<p>Click the bell icon to view recent system alerts, task assignments, and read status updates for your requests.</p>',
        N'html', 1000, 1, @CreatedBy, GETDATE(), @CreatedBy, GETDATE(), 0
    );
    PRINT 'Inserted step 5: Notification Bell';

    -- Step 6: User Profile & Role Settings
    INSERT INTO dbo.GuideStep (
        Guid, GuideKey, GuideTitle, GuideVersion, Route, SourceType, WikiUrl,
        MaxLoginHours, AutoStart, StepNumber, StepTitle, Selector, Placement,
        Content, ContentFormat, WaitTimeoutMs, IsEnabled,
        CreatedBy, CreatedDate, ModifiedBy, ModifiedDate, Deleted
    ) VALUES (
        NEWID(), @GuideKey, @GuideTitle, @Version, @Route, N'manual', N'',
        0, 1, 6, N'User Account & Settings', N'#userAccountTrigger', N'bottom',
        N'<p>Click your username profile here to select your active workflow role, adjust preferences (theme/dark mode), and sign out.</p>',
        N'html', 1000, 1, @CreatedBy, GETDATE(), @CreatedBy, GETDATE(), 0
    );
    PRINT 'Inserted step 6: User Account Trigger';

    -- Step 7: UI Tour Launcher
    INSERT INTO dbo.GuideStep (
        Guid, GuideKey, GuideTitle, GuideVersion, Route, SourceType, WikiUrl,
        MaxLoginHours, AutoStart, StepNumber, StepTitle, Selector, Placement,
        Content, ContentFormat, WaitTimeoutMs, IsEnabled,
        CreatedBy, CreatedDate, ModifiedBy, ModifiedDate, Deleted
    ) VALUES (
        NEWID(), @GuideKey, @GuideTitle, @Version, @Route, N'manual', N'',
        0, 1, 7, N'Interactive Help', N'#tmivTourGuideLauncher', N'bottom',
        N'<p>You can restart this interactive guide at any time by clicking this map signs icon.</p>',
        N'html', 1000, 1, @CreatedBy, GETDATE(), @CreatedBy, GETDATE(), 0
    );
    PRINT 'Inserted step 7: Tour Launcher';

    COMMIT TRANSACTION;
    PRINT 'Transaction committed successfully. Management Guide Steps configured! ✅';
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    PRINT 'Error occurred, transaction rolled back. ❌';
    THROW;
END CATCH
