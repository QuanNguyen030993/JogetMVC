-- =========================================================================
-- ENUMDATA NOTIFICATION TYPE INSERT SCRIPT
-- =========================================================================

BEGIN TRANSACTION;
BEGIN TRY
    -- 1. Insert Accept if not exists
    IF NOT EXISTS (SELECT 1 FROM EnumData WHERE Name = 'NotificationType' AND Value = 'Accept' AND Deleted = 0)
    BEGIN
        INSERT INTO EnumData (
            Name, SysTableId, SysTableName, [Key], MappingField, Value, EnumOrder, Deleted,
            CreatedBy, CreatedDate, ModifiedBy, ModifiedDate, Guid, Code
        ) VALUES (
            'NotificationType', NULL, NULL, '', '', 'Accept', 0, 0,
            'quan.nh', GETDATE(), '', GETDATE(), NEWID(), ''
        );
        PRINT 'Inserted EnumData: Accept';
    END
    ELSE
    BEGIN
        PRINT 'EnumData Accept already exists.';
    END

    -- 2. Insert Success if not exists
    IF NOT EXISTS (SELECT 1 FROM EnumData WHERE Name = 'NotificationType' AND Value = 'Success' AND Deleted = 0)
    BEGIN
        INSERT INTO EnumData (
            Name, SysTableId, SysTableName, [Key], MappingField, Value, EnumOrder, Deleted,
            CreatedBy, CreatedDate, ModifiedBy, ModifiedDate, Guid, Code
        ) VALUES (
            'NotificationType', NULL, NULL, '', '', 'Success', 0, 0,
            'quan.nh', GETDATE(), '', GETDATE(), NEWID(), ''
        );
        PRINT 'Inserted EnumData: Success';
    END
    ELSE
    BEGIN
        PRINT 'EnumData Success already exists.';
    END

    -- 3. Insert Fail if not exists
    IF NOT EXISTS (SELECT 1 FROM EnumData WHERE Name = 'NotificationType' AND Value = 'Fail' AND Deleted = 0)
    BEGIN
        INSERT INTO EnumData (
            Name, SysTableId, SysTableName, [Key], MappingField, Value, EnumOrder, Deleted,
            CreatedBy, CreatedDate, ModifiedBy, ModifiedDate, Guid, Code
        ) VALUES (
            'NotificationType', NULL, NULL, '', '', 'Fail', 0, 0,
            'quan.nh', GETDATE(), '', GETDATE(), NEWID(), ''
        );
        PRINT 'Inserted EnumData: Fail';
    END
    ELSE
    BEGIN
        PRINT 'EnumData Fail already exists.';
    END

    -- 4. Insert Initial if not exists
    IF NOT EXISTS (SELECT 1 FROM EnumData WHERE Name = 'NotificationType' AND Value = 'Initial' AND Deleted = 0)
    BEGIN
        INSERT INTO EnumData (
            Name, SysTableId, SysTableName, [Key], MappingField, Value, EnumOrder, Deleted,
            CreatedBy, CreatedDate, ModifiedBy, ModifiedDate, Guid, Code
        ) VALUES (
            'NotificationType', NULL, NULL, '', '', 'Initial', 0, 0,
            'quan.nh', GETDATE(), '', GETDATE(), NEWID(), ''
        );
        PRINT 'Inserted EnumData: Initial';
    END
    ELSE
    BEGIN
        PRINT 'EnumData Initial already exists.';
    END

    -- 5. Insert Reminder if not exists
    IF NOT EXISTS (SELECT 1 FROM EnumData WHERE Name = 'NotificationType' AND Value = 'Reminder' AND Deleted = 0)
    BEGIN
        INSERT INTO EnumData (
            Name, SysTableId, SysTableName, [Key], MappingField, Value, EnumOrder, Deleted,
            CreatedBy, CreatedDate, ModifiedBy, ModifiedDate, Guid, Code
        ) VALUES (
            'NotificationType', NULL, NULL, '', '', 'Reminder', 0, 0,
            'quan.nh', GETDATE(), '', GETDATE(), NEWID(), ''
        );
        PRINT 'Inserted EnumData: Reminder';
    END
    ELSE
    BEGIN
        PRINT 'EnumData Reminder already exists.';
    END

    -- 6. Insert Alert if not exists
    IF NOT EXISTS (SELECT 1 FROM EnumData WHERE Name = 'NotificationType' AND Value = 'Alert' AND Deleted = 0)
    BEGIN
        INSERT INTO EnumData (
            Name, SysTableId, SysTableName, [Key], MappingField, Value, EnumOrder, Deleted,
            CreatedBy, CreatedDate, ModifiedBy, ModifiedDate, Guid, Code
        ) VALUES (
            'NotificationType', NULL, NULL, '', '', 'Alert', 0, 0,
            'quan.nh', GETDATE(), '', GETDATE(), NEWID(), ''
        );
        PRINT 'Inserted EnumData: Alert';
    END
    ELSE
    BEGIN
        PRINT 'EnumData Alert already exists.';
    END

    COMMIT TRANSACTION;
    PRINT 'Transaction committed successfully. EnumData NotificationType items configured! ✅';
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    PRINT 'Error occurred, transaction rolled back. ❌';
    THROW;
END CATCH
