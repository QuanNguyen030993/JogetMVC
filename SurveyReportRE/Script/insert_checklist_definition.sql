-- =========================================================================
-- CHECKLISTDEFINITION SEED/INSERT SCRIPT
-- =========================================================================

BEGIN TRANSACTION;
BEGIN TRY
    -- 1. Alter NeedToCheck column to avoid truncation error (default was nvarchar(120))
    PRINT 'Altering NeedToCheck column to nvarchar(2000)...';
    ALTER TABLE CheckListDefinition ALTER COLUMN NeedToCheck NVARCHAR(2000) NULL;

    -- 2. Clear existing checklist items (optional, but ensures clean sequence start)
    PRINT 'Deleting existing CheckListDefinition records...';
    DELETE FROM CheckListDefinition;

    -- 3. Insert new checklist items
    PRINT 'Inserting new CheckListDefinition records...';
    
    -- Row 1
    INSERT INTO CheckListDefinition (
        SequenceNo, [Checkpoint], NeedToCheck, Guid, CreatedBy, CreatedDate, ModifiedBy, ModifiedDate, Deleted
    ) VALUES (
        1, N'Policy No', N'FA000539', NEWID(), 'quan.nh', GETDATE(), '', GETDATE(), 0
    );

    -- Row 2
    INSERT INTO CheckListDefinition (
        SequenceNo, [Checkpoint], NeedToCheck, Guid, CreatedBy, CreatedDate, ModifiedBy, ModifiedDate, Deleted
    ) VALUES (
        2, N'The Insured', N'NON - Korean/Chinese/Taiwanese', NEWID(), 'quan.nh', GETDATE(), '', GETDATE(), 0
    );

    -- Row 3
    INSERT INTO CheckListDefinition (
        SequenceNo, [Checkpoint], NeedToCheck, Guid, CreatedBy, CreatedDate, ModifiedBy, ModifiedDate, Deleted
    ) VALUES (
        3, N'Occupation', 
        N'Occupation NOT involving:
- Furniture, Wood working, Textile, Garment, Shoes and Leather
- Paper/carton packaging
- Risk Grade 6 (as Paint, oil & gas...)
- Open yard storage
- Standalone warehouse (New business)
- Resorts in middle of Vietnam', 
        NEWID(), 'quan.nh', GETDATE(), '', GETDATE(), 0
    );

    -- Row 4
    INSERT INTO CheckListDefinition (
        SequenceNo, [Checkpoint], NeedToCheck, Guid, CreatedBy, CreatedDate, ModifiedBy, ModifiedDate, Deleted
    ) VALUES (
        4, N'Occupation Code and FCI code', 
        N'- Occupation code is relevant to the actual occupation
- FCI code follow Decree 105', 
        NEWID(), 'quan.nh', GETDATE(), '', GETDATE(), 0
    );

    -- Row 5
    INSERT INTO CheckListDefinition (
        SequenceNo, [Checkpoint], NeedToCheck, Guid, CreatedBy, CreatedDate, ModifiedBy, ModifiedDate, Deleted
    ) VALUES (
        5, N'Risk grading', 
        N'- For some Special Occupation that TMIV has upgrade Risk grade (under Circular No. 46-UWW-2025), please check the referrence table table
- For other Occupation, please check Risk grading sheet', 
        NEWID(), 'quan.nh', GETDATE(), '', GETDATE(), 0
    );

    -- Row 6
    INSERT INTO CheckListDefinition (
        SequenceNo, [Checkpoint], NeedToCheck, Guid, CreatedBy, CreatedDate, ModifiedBy, ModifiedDate, Deleted
    ) VALUES (
        6, N'POI', N'NOT exceed 12 months', NEWID(), 'quan.nh', GETDATE(), '', GETDATE(), 0
    );

    -- Row 7
    INSERT INTO CheckListDefinition (
        SequenceNo, [Checkpoint], NeedToCheck, Guid, CreatedBy, CreatedDate, ModifiedBy, ModifiedDate, Deleted
    ) VALUES (
        7, N'TSI', N'TSI x 110% stays within Treaty capacity', NEWID(), 'quan.nh', GETDATE(), '', GETDATE(), 0
    );

    -- Row 8
    INSERT INTO CheckListDefinition (
        SequenceNo, [Checkpoint], NeedToCheck, Guid, CreatedBy, CreatedDate, ModifiedBy, ModifiedDate, Deleted
    ) VALUES (
        8, N'TSI', N'SI of stock <= 70% TSI', NEWID(), 'quan.nh', GETDATE(), '', GETDATE(), 0
    );

    -- Row 9
    INSERT INTO CheckListDefinition (
        SequenceNo, [Checkpoint], NeedToCheck, Guid, CreatedBy, CreatedDate, ModifiedBy, ModifiedDate, Deleted
    ) VALUES (
        9, N'Premium', 
        N'FCI Rate: Follow FCI tariff rate of Decree 105
+ In case SI>=VND 1,000bil: Tarrif rate x discount 25%
+ In case SI < VND 1,000 bil: Tariff rate with NO discount', 
        NEWID(), 'quan.nh', GETDATE(), '', GETDATE(), 0
    );

    -- Row 10
    INSERT INTO CheckListDefinition (
        SequenceNo, [Checkpoint], NeedToCheck, Guid, CreatedBy, CreatedDate, ModifiedBy, ModifiedDate, Deleted
    ) VALUES (
        10, N'Deductible', 
        N'Follow Decree 105 for Fire and Explosion
TSI (Million VND) | Deductible (Million VND)
------------------+-------------------------
Up to 2,000       | 4
Above 2,000 to 10,000   | 10
Above 10,000 to 50,000  | 20
Above 50,000 to 100,000 | 40
Above 100,000 to 200,000| 60
Above 200,000           | 100', 
        NEWID(), 'quan.nh', GETDATE(), '', GETDATE(), 0
    );

    -- Row 11
    INSERT INTO CheckListDefinition (
        SequenceNo, [Checkpoint], NeedToCheck, Guid, CreatedBy, CreatedDate, ModifiedBy, ModifiedDate, Deleted
    ) VALUES (
        11, N'T&Cs', 
        N'IAR additional clauses:
1. EF**278 - Money in Premise and in transit
2. EF**259 - Full Theft Clause
3. EF**257 - Fidelity Guarantee Extention Clause

BI additional clauses:
1. EFCLBI09/EFCLS13 - Denial of Access or Prevention of Access
2. EFCLR069 - Public Utilities/Failure of Public supply
3. EFCLS26/EFCLR067 - Named CBI
4. No Specific code, refer for any relevant clause - Unnamed CBI', 
        NEWID(), 'quan.nh', GETDATE(), '', GETDATE(), 0
    );

    COMMIT TRANSACTION;
    PRINT 'Transaction committed successfully. CheckListDefinition entries inserted! ✅';
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    PRINT 'Error occurred, transaction rolled back. ❌';
    THROW;
END CATCH
