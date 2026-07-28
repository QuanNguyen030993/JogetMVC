-- =========================================================================
-- MIGRATION SCRIPT: DATAGRIDCONFIG PIC VISIBILITY CORRECTION
-- =========================================================================

BEGIN TRANSACTION;
BEGIN TRY
    -- 1. Ensure all PIC columns for PolicyIssuance (SysTableId = 10062) are HIDDEN (Visible = 0)
    UPDATE DataGridConfig
    SET Visible = 0,
        ModifiedBy = N'quan.nh',
        ModifiedDate = GETDATE()
    WHERE SysTableId = 10062
      AND DataField IN ('picFO', 'picTS', 'picPM');
    PRINT 'Set PolicyIssuance PIC columns to HIDDEN.';

    -- 2. Ensure all PIC columns for Quotation (SysTableId = 10056) are VISIBLE (Visible = 1)
    UPDATE DataGridConfig
    SET Visible = 1,
        ModifiedBy = N'quan.nh',
        ModifiedDate = GETDATE()
    WHERE SysTableId = 10056
      AND DataField IN ('picFO', 'picTS', 'picPM');
    PRINT 'Set Quotation PIC columns to VISIBLE.';

    COMMIT TRANSACTION;
    PRINT 'Transaction committed successfully. Visibility correction completed! ✅';
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    PRINT 'Error occurred, transaction rolled back. ❌';
    THROW;
END CATCH
