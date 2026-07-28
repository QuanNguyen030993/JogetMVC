-- =========================================================================
-- MIGRATION SCRIPT: DATAGRIDCONFIG POLICYISSUANCE PIC TYPES CORRECTION
-- =========================================================================

BEGIN TRANSACTION;
BEGIN TRY
    -- 1. Update picFO (12018) for PolicyIssuance: copy types and dropdown configs from Quotation picFO (11774)
    UPDATE target
    SET target.DataType = source.DataType,
        target.FormDataType = source.FormDataType,
        target.EditorOptions = source.EditorOptions,
        target.FormItem = source.FormItem,
        target.ModifiedBy = N'quan.nh',
        target.ModifiedDate = GETDATE()
    FROM DataGridConfig target
    CROSS JOIN (SELECT DataType, FormDataType, EditorOptions, FormItem FROM DataGridConfig WHERE Id = 11774) source
    WHERE target.Id = 12018;
    PRINT 'Updated picFO (12018) types and dropdown configuration.';

    -- 2. Update picTS (12019) for PolicyIssuance: copy types and dropdown configs from Quotation picTS (11776)
    UPDATE target
    SET target.DataType = source.DataType,
        target.FormDataType = source.FormDataType,
        target.EditorOptions = source.EditorOptions,
        target.FormItem = source.FormItem,
        target.ModifiedBy = N'quan.nh',
        target.ModifiedDate = GETDATE()
    FROM DataGridConfig target
    CROSS JOIN (SELECT DataType, FormDataType, EditorOptions, FormItem FROM DataGridConfig WHERE Id = 11776) source
    WHERE target.Id = 12019;
    PRINT 'Updated picTS (12019) types and dropdown configuration.';

    -- 3. Update picPM (12054) for PolicyIssuance: copy types and dropdown configs from Quotation picPM (11778)
    UPDATE target
    SET target.DataType = source.DataType,
        target.FormDataType = source.FormDataType,
        target.EditorOptions = source.EditorOptions,
        target.FormItem = source.FormItem,
        target.ModifiedBy = N'quan.nh',
        target.ModifiedDate = GETDATE()
    FROM DataGridConfig target
    CROSS JOIN (SELECT DataType, FormDataType, EditorOptions, FormItem FROM DataGridConfig WHERE Id = 11778) source
    WHERE target.Id = 12054;
    PRINT 'Updated picPM (12054) types and dropdown configuration.';

    COMMIT TRANSACTION;
    PRINT 'Transaction committed successfully. Types and select box configs updated! ✅';
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    PRINT 'Error occurred, transaction rolled back. ❌';
    THROW;
END CATCH
