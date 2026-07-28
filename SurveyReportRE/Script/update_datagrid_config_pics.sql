-- =========================================================================
-- MIGRATION SCRIPT: DATAGRIDCONFIG PIC COLUMNS FOR QUOTATION & POLICYISSUANCE
-- =========================================================================

BEGIN TRANSACTION;
BEGIN TRY
    -- 1. Create backup table and backup existing rows if not already backed up
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'DataGridConfig_Backup_July2026')
    BEGIN
        CREATE TABLE DataGridConfig_Backup_July2026 (
            OriginalId BIGINT,
            AllowGrouping BIT,
            AllowHeaderFiltering BIT,
            Caption NVARCHAR(255),
            DataField NVARCHAR(255),
            DataType NVARCHAR(255),
            SysTableId INT,
            FormDataType NVARCHAR(255),
            [Order] INT,
            GridVisibleIndex INT,
            Visible BIT,
            CreatedBy NVARCHAR(255),
            CreatedDate DATETIME2,
            Deleted BIT,
            Guid UNIQUEIDENTIFIER
        );
        PRINT 'Created backup table DataGridConfig_Backup_July2026.';
    END

    -- Backup the target rows if they are not already in the backup table
    INSERT INTO DataGridConfig_Backup_July2026 (
        OriginalId, AllowGrouping, AllowHeaderFiltering, Caption, DataField, DataType, SysTableId, FormDataType, [Order], GridVisibleIndex, Visible, CreatedBy, CreatedDate, Deleted, Guid
    )
    SELECT Id, AllowGrouping, AllowHeaderFiltering, Caption, DataField, DataType, SysTableId, FormDataType, [Order], GridVisibleIndex, Visible, CreatedBy, CreatedDate, Deleted, Guid
    FROM DataGridConfig
    WHERE Id IN (12018, 12019, 11774, 11776, 11778)
      AND Id NOT IN (SELECT OriginalId FROM DataGridConfig_Backup_July2026);
    PRINT 'Backed up existing grid configuration rows.';

    -- 2. Update existing rich PIC columns (picFO, picTS, picPM from QuotationTmp/10066) to Quotation/10056
    UPDATE DataGridConfig
    SET SysTableId = 10056,
        Visible = 1,
        ModifiedBy = N'quan.nh',
        ModifiedDate = GETDATE()
    WHERE Id IN (11774, 11776, 11778);
    PRINT 'Updated rich PIC columns (11774, 11776, 11778) to Quotation (SysTableId = 10056).';

    -- 3. Update existing simple string PIC columns (picFO, picTS from Quotation/10056) to PolicyIssuance/10062 and HIDE them
    UPDATE DataGridConfig
    SET SysTableId = 10062,
        Visible = 0,
        ModifiedBy = N'quan.nh',
        ModifiedDate = GETDATE()
    WHERE Id IN (12018, 12019);
    PRINT 'Updated simple PIC columns (12018, 12019) to PolicyIssuance (SysTableId = 10062) and set to HIDDEN.';

    -- 4. Insert new picPM column for PolicyIssuance/10062 as HIDDEN if it does not exist
    IF NOT EXISTS (SELECT 1 FROM DataGridConfig WHERE SysTableId = 10062 AND DataField = 'picPM' AND Deleted = 0)
    BEGIN
        INSERT INTO DataGridConfig (
            AllowGrouping, AllowHeaderFiltering, Caption, DataField, DataType, FormGroupName, GridGroupName, 
            SysTableId, Note, FormDataType, [Order], CalculateFilterExpression, FormVisibleIndex, GridVisibleIndex, 
            Visible, ValidationRules, DefaultValue, Fixed, FixedPosition, CSSClass, CreatedBy, CreatedDate, 
            Deleted, Guid, ModifiedBy, ModifiedDate
        ) VALUES (
            1, 1, N'PM', N'picPM', N'string', N'', N'', 
            10062, N'', N'dxTextBox', 1200, N'', NULL, 1200, 
            0, N'', N'', 0, N'', N'', N'quan.nh', GETDATE(), 
            0, NEWID(), N'', GETDATE()
        );
        PRINT 'Inserted HIDDEN picPM column for PolicyIssuance (SysTableId = 10062).';
    END
    ELSE
    BEGIN
        PRINT 'picPM column for PolicyIssuance already exists.';
    END

    COMMIT TRANSACTION;
    PRINT 'Transaction committed successfully. DataGridConfig updated! ✅';
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    PRINT 'Error occurred, transaction rolled back. ❌';
    THROW;
END CATCH
