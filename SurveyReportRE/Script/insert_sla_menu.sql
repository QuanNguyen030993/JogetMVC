-- =========================================================================
-- SLA AND MENU INSERT SCRIPT FOR UW, PM, FO, LMKT
-- =========================================================================

BEGIN TRANSACTION;
BEGIN TRY
    -- 1. Get parent SLA menu ID
    DECLARE @ParentId INT;
    SELECT @ParentId = Id FROM Menu WHERE Name = 'SLA' AND ParentId IS NULL AND Deleted = 0;

    IF @ParentId IS NULL
    BEGIN
        PRINT 'Parent SLA menu not found!';
        ROLLBACK TRANSACTION;
        RETURN;
    END

    -- 2. Insert Child Menus
    -- SLA UW
    IF NOT EXISTS (SELECT 1 FROM Menu WHERE ParentId = @ParentId AND Caption = 'SLA UW' AND Deleted = 0)
    BEGIN
        INSERT INTO Menu (
            Name, Caption, Action, ParentId, Icon, ActionUri, Active, Area, Controller,
            CreatedBy, CreatedDate, IsMobile, Parameter, SortOrder, PageSystem, Deleted,
            DeletedBy, DeletedDate, Guid, ModifiedBy, ModifiedDate
        ) VALUES (
            'SLA', 'SLA UW', NULL, @ParentId, NULL, '/Config/SLA_Form/UW', 1, NULL, NULL,
            'quan.nh', GETDATE(), NULL, NULL, 2, NULL, 0, '', NULL, NEWID(), '', GETDATE()
        );
        PRINT 'Inserted menu SLA UW';
    END

    -- SLA PM
    IF NOT EXISTS (SELECT 1 FROM Menu WHERE ParentId = @ParentId AND Caption = 'SLA PM' AND Deleted = 0)
    BEGIN
        INSERT INTO Menu (
            Name, Caption, Action, ParentId, Icon, ActionUri, Active, Area, Controller,
            CreatedBy, CreatedDate, IsMobile, Parameter, SortOrder, PageSystem, Deleted,
            DeletedBy, DeletedDate, Guid, ModifiedBy, ModifiedDate
        ) VALUES (
            'SLA', 'SLA PM', NULL, @ParentId, NULL, '/Config/SLA_Form/PM', 1, NULL, NULL,
            'quan.nh', GETDATE(), NULL, NULL, 3, NULL, 0, '', NULL, NEWID(), '', GETDATE()
        );
        PRINT 'Inserted menu SLA PM';
    END

    -- SLA FO
    IF NOT EXISTS (SELECT 1 FROM Menu WHERE ParentId = @ParentId AND Caption = 'SLA FO' AND Deleted = 0)
    BEGIN
        INSERT INTO Menu (
            Name, Caption, Action, ParentId, Icon, ActionUri, Active, Area, Controller,
            CreatedBy, CreatedDate, IsMobile, Parameter, SortOrder, PageSystem, Deleted,
            DeletedBy, DeletedDate, Guid, ModifiedBy, ModifiedDate
        ) VALUES (
            'SLA', 'SLA FO', NULL, @ParentId, NULL, '/Config/SLA_Form/FO', 1, NULL, NULL,
            'quan.nh', GETDATE(), NULL, NULL, 4, NULL, 0, '', NULL, NEWID(), '', GETDATE()
        );
        PRINT 'Inserted menu SLA FO';
    END

    -- SLA LMKT
    IF NOT EXISTS (SELECT 1 FROM Menu WHERE ParentId = @ParentId AND Caption = 'SLA LMKT' AND Deleted = 0)
    BEGIN
        INSERT INTO Menu (
            Name, Caption, Action, ParentId, Icon, ActionUri, Active, Area, Controller,
            CreatedBy, CreatedDate, IsMobile, Parameter, SortOrder, PageSystem, Deleted,
            DeletedBy, DeletedDate, Guid, ModifiedBy, ModifiedDate
        ) VALUES (
            'SLA', 'SLA LMKT', NULL, @ParentId, NULL, '/Config/SLA_Form/LMKT', 1, NULL, NULL,
            'quan.nh', GETDATE(), NULL, NULL, 5, NULL, 0, '', NULL, NEWID(), '', GETDATE()
        );
        PRINT 'Inserted menu SLA LMKT';
    END

    -- 3. Insert default SLA entries for FO and LMKT
    -- FO: WAIT_SUBMIT_DAY
    IF NOT EXISTS (SELECT 1 FROM SLA WHERE Dept = 'FO' AND Code = 'WAIT_SUBMIT_DAY' AND Deleted = 0)
    BEGIN
        INSERT INTO SLA (
            Dept, Attributes, Code, Value, DecimalValue, FromDate, ToDate, Duration, Guid,
            CreatedBy, CreatedDate, ModifiedBy, ModifiedDate, Deleted, DeletedBy, DeletedDate, BooleanValue
        ) VALUES (
            'FO', 
            N'{"fields":[{"name":"waitingDay","label":"Số ngày nộp đơn","control":"number","required":true,"min":0,"max":30,"value":5}],"calculation":{"type":"manual","unit":"day"}}',
            'WAIT_SUBMIT_DAY', '5', 5, NULL, NULL, NULL, NEWID(),
            'quan.nh', GETDATE(), '', GETDATE(), 0, NULL, NULL, 0
        );
        PRINT 'Inserted SLA record for FO';
    END

    -- LMKT: WAIT_LMKT_PROCESS
    IF NOT EXISTS (SELECT 1 FROM SLA WHERE Dept = 'LMKT' AND Code = 'WAIT_LMKT_PROCESS' AND Deleted = 0)
    BEGIN
        INSERT INTO SLA (
            Dept, Attributes, Code, Value, DecimalValue, FromDate, ToDate, Duration, Guid,
            CreatedBy, CreatedDate, ModifiedBy, ModifiedDate, Deleted, DeletedBy, DeletedDate, BooleanValue
        ) VALUES (
            'LMKT', 
            N'{"fields":[{"name":"processDay","label":"Số ngày xử lý LMKT","control":"number","required":true,"min":0,"max":30,"value":7}],"calculation":{"type":"manual","unit":"day"}}',
            'WAIT_LMKT_PROCESS', '7', 7, NULL, NULL, NULL, NEWID(),
            'quan.nh', GETDATE(), '', GETDATE(), 0, NULL, NULL, 0
        );
        PRINT 'Inserted SLA record for LMKT';
    END

    COMMIT TRANSACTION;
    PRINT 'Transaction committed successfully. Menu & SLA items configured! ✅';
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    PRINT 'Error occurred, transaction rolled back. ❌';
    THROW;
END CATCH
