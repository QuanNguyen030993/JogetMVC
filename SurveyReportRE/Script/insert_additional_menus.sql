-- =========================================================================
-- ADDITIONAL MENUS FOR QUOTATION AND POLICYISSUANCE
-- =========================================================================

BEGIN TRANSACTION;
BEGIN TRY
    -- 1. Get Parent IDs for Quotation and PolicyIssuance menus
    DECLARE @QuotationParentId INT;
    DECLARE @PolicyIssuanceParentId INT;

    SELECT @QuotationParentId = Id FROM Menu WHERE Name = 'Quotation' AND ParentId IS NULL AND Deleted = 0;
    SELECT @PolicyIssuanceParentId = Id FROM Menu WHERE Name = 'PolicyIssuance' AND ParentId IS NULL AND Deleted = 0;

    -- Fallback if parents are not found by Name and NULL ParentId
    IF @QuotationParentId IS NULL SET @QuotationParentId = 1656;
    IF @PolicyIssuanceParentId IS NULL SET @PolicyIssuanceParentId = 1663;

    PRINT 'Quotation Parent ID: ' + CAST(@QuotationParentId AS VARCHAR);
    PRINT 'PolicyIssuance Parent ID: ' + CAST(@PolicyIssuanceParentId AS VARCHAR);

    -- ==========================================
    -- 2. INSERT CHILD MENUS FOR QUOTATION
    -- ==========================================

    -- Renew Inbox
    IF NOT EXISTS (SELECT 1 FROM Menu WHERE ParentId = @QuotationParentId AND Caption = 'Renew Inbox' AND Deleted = 0)
    BEGIN
        INSERT INTO Menu (
            Name, Caption, Action, ParentId, Icon, ActionUri, Active, Area, Controller,
            CreatedBy, CreatedDate, IsMobile, Parameter, SortOrder, PageSystem, Deleted,
            DeletedBy, DeletedDate, Guid, ModifiedBy, ModifiedDate
        ) VALUES (
            'RenewQuotation', 'Renew Inbox', NULL, @QuotationParentId, NULL, '/Business/Form/RenewQuotation', 1, 'api', 'Quotation',
            'quan.nh', GETDATE(), NULL, NULL, 7, 'Management', 0, '', NULL, NEWID(), '', GETDATE()
        );
        PRINT 'Inserted menu: Renew Inbox';
    END

    -- Team Request (Quotation)
    IF NOT EXISTS (SELECT 1 FROM Menu WHERE ParentId = @QuotationParentId AND Caption = 'Team Request' AND Deleted = 0)
    BEGIN
        INSERT INTO Menu (
            Name, Caption, Action, ParentId, Icon, ActionUri, Active, Area, Controller,
            CreatedBy, CreatedDate, IsMobile, Parameter, SortOrder, PageSystem, Deleted,
            DeletedBy, DeletedDate, Guid, ModifiedBy, ModifiedDate
        ) VALUES (
            'QuotationTeamRequest', 'Team Request', NULL, @QuotationParentId, NULL, '/Business/Form/QuotationTeamRequest', 1, 'api', 'Quotation',
            'quan.nh', GETDATE(), NULL, NULL, 8, 'Management', 0, '', NULL, NEWID(), '', GETDATE()
        );
        PRINT 'Inserted menu: Quotation - Team Request';
    END

    -- Submitted Request (Quotation)
    IF NOT EXISTS (SELECT 1 FROM Menu WHERE ParentId = @QuotationParentId AND Caption = 'Submitted Request' AND Deleted = 0)
    BEGIN
        INSERT INTO Menu (
            Name, Caption, Action, ParentId, Icon, ActionUri, Active, Area, Controller,
            CreatedBy, CreatedDate, IsMobile, Parameter, SortOrder, PageSystem, Deleted,
            DeletedBy, DeletedDate, Guid, ModifiedBy, ModifiedDate
        ) VALUES (
            'QuotationSubmittedRequest', 'Submitted Request', NULL, @QuotationParentId, NULL, '/Business/Form/QuotationSubmittedRequest', 1, 'api', 'Quotation',
            'quan.nh', GETDATE(), NULL, NULL, 9, 'Management', 0, '', NULL, NEWID(), '', GETDATE()
        );
        PRINT 'Inserted menu: Quotation - Submitted Request';
    END


    -- ==========================================
    -- 3. INSERT CHILD MENUS FOR POLICYISSUANCE
    -- ==========================================

    -- Move the former Quotation Signed-back page to PolicyIssuance.
    UPDATE Menu
    SET
        Name = 'SignedBackPolicyIssuance',
        ParentId = @PolicyIssuanceParentId,
        ActionUri = '/Business/Form/SignedBackPolicyIssuance',
        Controller = 'PolicyIssuance',
        SortOrder = 6,
        ModifiedDate = GETDATE()
    WHERE Name = 'SignedBackQuotation'
      AND Deleted = 0;

    -- Signed-back Inbox (PolicyIssuance)
    IF NOT EXISTS (SELECT 1 FROM Menu WHERE ParentId = @PolicyIssuanceParentId AND Name = 'SignedBackPolicyIssuance' AND Deleted = 0)
    BEGIN
        INSERT INTO Menu (
            Name, Caption, Action, ParentId, Icon, ActionUri, Active, Area, Controller,
            CreatedBy, CreatedDate, IsMobile, Parameter, SortOrder, PageSystem, Deleted,
            DeletedBy, DeletedDate, Guid, ModifiedBy, ModifiedDate
        ) VALUES (
            'SignedBackPolicyIssuance', 'Signed-back Inbox', NULL, @PolicyIssuanceParentId, NULL, '/Business/Form/SignedBackPolicyIssuance', 1, 'api', 'PolicyIssuance',
            'quan.nh', GETDATE(), NULL, NULL, 6, 'Management', 0, '', NULL, NEWID(), '', GETDATE()
        );
        PRINT 'Inserted menu: PolicyIssuance - Signed-back Inbox';
    END

    -- Follow up Document
    IF NOT EXISTS (SELECT 1 FROM Menu WHERE ParentId = @PolicyIssuanceParentId AND Caption = 'Follow up Document' AND Deleted = 0)
    BEGIN
        INSERT INTO Menu (
            Name, Caption, Action, ParentId, Icon, ActionUri, Active, Area, Controller,
            CreatedBy, CreatedDate, IsMobile, Parameter, SortOrder, PageSystem, Deleted,
            DeletedBy, DeletedDate, Guid, ModifiedBy, ModifiedDate
        ) VALUES (
            'FollowUpDocument', 'Follow up Document', NULL, @PolicyIssuanceParentId, NULL, '/Business/Form/FollowUpDocument', 1, 'api', 'PolicyIssuance',
            'quan.nh', GETDATE(), NULL, NULL, 6, '[]', 0, '', NULL, NEWID(), '', GETDATE()
        );
        PRINT 'Inserted menu: Follow up Document';
    END

    -- Team Request (PolicyIssuance)
    IF NOT EXISTS (SELECT 1 FROM Menu WHERE ParentId = @PolicyIssuanceParentId AND Caption = 'Team Request' AND Deleted = 0)
    BEGIN
        INSERT INTO Menu (
            Name, Caption, Action, ParentId, Icon, ActionUri, Active, Area, Controller,
            CreatedBy, CreatedDate, IsMobile, Parameter, SortOrder, PageSystem, Deleted,
            DeletedBy, DeletedDate, Guid, ModifiedBy, ModifiedDate
        ) VALUES (
            'PolicyIssuanceTeamRequest', 'Team Request', NULL, @PolicyIssuanceParentId, NULL, '/Business/Form/PolicyIssuanceTeamRequest', 1, 'api', 'PolicyIssuance',
            'quan.nh', GETDATE(), NULL, NULL, 7, '[]', 0, '', NULL, NEWID(), '', GETDATE()
        );
        PRINT 'Inserted menu: PolicyIssuance - Team Request';
    END

    -- Submitted Request (PolicyIssuance)
    IF NOT EXISTS (SELECT 1 FROM Menu WHERE ParentId = @PolicyIssuanceParentId AND Caption = 'Submitted Request' AND Deleted = 0)
    BEGIN
        INSERT INTO Menu (
            Name, Caption, Action, ParentId, Icon, ActionUri, Active, Area, Controller,
            CreatedBy, CreatedDate, IsMobile, Parameter, SortOrder, PageSystem, Deleted,
            DeletedBy, DeletedDate, Guid, ModifiedBy, ModifiedDate
        ) VALUES (
            'PolicyIssuanceSubmittedRequest', 'Submitted Request', NULL, @PolicyIssuanceParentId, NULL, '/Business/Form/PolicyIssuanceSubmittedRequest', 1, 'api', 'PolicyIssuance',
            'quan.nh', GETDATE(), NULL, NULL, 8, '[]', 0, '', NULL, NEWID(), '', GETDATE()
        );
        PRINT 'Inserted menu: PolicyIssuance - Submitted Request';
    END

    COMMIT TRANSACTION;
    PRINT 'Transaction committed successfully. All menus inserted! ✅';
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    PRINT 'Error occurred, transaction rolled back. ❌';
    THROW;
END CATCH
