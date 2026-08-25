USE [WorkflowManagementv2]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

/*
    Xoa mot record va cac record con dua tren Foreign Key that trong database.

    - Mac dinh chi preview, khong xoa du lieu.
    - Xoa tu bang con sau nhat ve bang goc trong cung mot transaction.
    - Ho tro FK nhieu cot.
    - Bo qua FK co ON DELETE SET NULL / SET DEFAULT vi cac record con do
      khong duoc xem la du lieu so huu boi record cha.
    - Chan chu trinh FK/self-reference de tranh lap vo han.

    Preview:
      EXEC dbo.usp_DeleteByForeignKey
          @RootSchema = N'dbo',
          @RootTable = N'PolicyIssuance',
          @RootKeyColumn = N'Id',
          @RootKeyValue = N'123',
          @Execute = 0;

    Xoa that:
      EXEC dbo.usp_DeleteByForeignKey
          @RootSchema = N'dbo',
          @RootTable = N'PolicyIssuance',
          @RootKeyColumn = N'Id',
          @RootKeyValue = N'123',
          @Execute = 1;
*/
IF OBJECT_ID(N'dbo.usp_DeleteByForeignKey', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.usp_DeleteByForeignKey AS BEGIN SET NOCOUNT ON; END');
GO

ALTER PROCEDURE dbo.usp_DeleteByForeignKey
(
    @RootSchema        SYSNAME = N'dbo',
    @RootTable         SYSNAME,
    @RootKeyColumn     SYSNAME = N'Id',
    @RootKeyValue      NVARCHAR(4000),
    @Execute           BIT = 0,
    @RequireForeignKey BIT = 1,
    @MaxDepth          INT = 20
)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NULLIF(LTRIM(RTRIM(@RootTable)), N'') IS NULL
        THROW 51001, N'RootTable khong duoc de trong.', 1;

    IF NULLIF(LTRIM(RTRIM(@RootKeyValue)), N'') IS NULL
        THROW 51002, N'RootKeyValue khong duoc de trong.', 1;

    IF @MaxDepth NOT BETWEEN 1 AND 30
        THROW 51003, N'MaxDepth phai nam trong khoang 1 den 30.', 1;

    DECLARE @RootObjectId INT = OBJECT_ID(QUOTENAME(@RootSchema) + N'.' + QUOTENAME(@RootTable), N'U');

    IF @RootObjectId IS NULL
        THROW 51004, N'Khong tim thay bang goc.', 1;

    IF NOT EXISTS
    (
        SELECT 1
        FROM sys.columns
        WHERE object_id = @RootObjectId
          AND [name] = @RootKeyColumn
    )
        THROW 51005, N'Khong tim thay cot khoa cua bang goc.', 1;

    DECLARE @RootQualifiedName NVARCHAR(517) =
        QUOTENAME(OBJECT_SCHEMA_NAME(@RootObjectId)) + N'.' + QUOTENAME(OBJECT_NAME(@RootObjectId));
    DECLARE @RootWhere NVARCHAR(MAX) =
        N'CONVERT(NVARCHAR(4000), p0.' + QUOTENAME(@RootKeyColumn) + N') = @KeyValue';
    DECLARE @Sql NVARCHAR(MAX);
    DECLARE @RootCount BIGINT;

    SET @Sql = N'SELECT @Count = COUNT_BIG(*) FROM ' + @RootQualifiedName
             + N' AS p0 WHERE ' + @RootWhere + N';';

    EXEC sys.sp_executesql
        @Sql,
        N'@KeyValue NVARCHAR(4000), @Count BIGINT OUTPUT',
        @KeyValue = @RootKeyValue,
        @Count = @RootCount OUTPUT;

    IF @RootCount = 0
        THROW 51006, N'Khong tim thay record goc can xoa.', 1;

    IF @RootCount > 1
        THROW 51007, N'Gia tri khoa goc khong duy nhat; store da dung de tranh xoa nham.', 1;

    CREATE TABLE #DeletePaths
    (
        PathId          INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        ObjectId        INT NOT NULL,
        DepthNo         INT NOT NULL,
        TargetAlias     SYSNAME NOT NULL,
        ForeignKeyName  SYSNAME NULL,
        ObjectPath      NVARCHAR(4000) NOT NULL,
        RelationPath    NVARCHAR(4000) NOT NULL,
        FromSql         NVARCHAR(MAX) NOT NULL
    );

    INSERT INTO #DeletePaths
    (
        ObjectId, DepthNo, TargetAlias, ForeignKeyName,
        ObjectPath, RelationPath, FromSql
    )
    VALUES
    (
        @RootObjectId,
        0,
        N'p0',
        NULL,
        N'|' + CONVERT(NVARCHAR(20), @RootObjectId) + N'|',
        @RootSchema + N'.' + @RootTable,
        @RootQualifiedName + N' AS p0'
    );

    DECLARE @Depth INT = 0;
    DECLARE @PathId INT;
    DECLARE @ParentObjectId INT;
    DECLARE @ParentAlias SYSNAME;
    DECLARE @ParentObjectPath NVARCHAR(4000);
    DECLARE @ParentRelationPath NVARCHAR(4000);
    DECLARE @ParentFromSql NVARCHAR(MAX);
    DECLARE @ForeignKeyObjectId INT;
    DECLARE @ForeignKeyName SYSNAME;
    DECLARE @ChildObjectId INT;
    DECLARE @ChildAlias SYSNAME;
    DECLARE @ChildQualifiedName NVARCHAR(517);
    DECLARE @JoinPredicate NVARCHAR(MAX);

    WHILE @Depth < @MaxDepth
    BEGIN
        DECLARE PathCursor CURSOR LOCAL FAST_FORWARD FOR
            SELECT PathId, ObjectId, TargetAlias, ObjectPath, RelationPath, FromSql
            FROM #DeletePaths
            WHERE DepthNo = @Depth
            ORDER BY PathId;

        OPEN PathCursor;
        FETCH NEXT FROM PathCursor INTO
            @PathId, @ParentObjectId, @ParentAlias,
            @ParentObjectPath, @ParentRelationPath, @ParentFromSql;

        WHILE @@FETCH_STATUS = 0
        BEGIN
            DECLARE ForeignKeyCursor CURSOR LOCAL FAST_FORWARD FOR
                SELECT FK.object_id, FK.[name], FK.parent_object_id
                FROM sys.foreign_keys AS FK
                WHERE FK.referenced_object_id = @ParentObjectId
                  AND FK.is_disabled = 0
                  AND FK.delete_referential_action IN (0, 1) -- NO_ACTION, CASCADE
                ORDER BY FK.object_id;

            OPEN ForeignKeyCursor;
            FETCH NEXT FROM ForeignKeyCursor INTO
                @ForeignKeyObjectId, @ForeignKeyName, @ChildObjectId;

            WHILE @@FETCH_STATUS = 0
            BEGIN
                -- Khong di lai mot table da co tren cung path: chan cycle/self-reference.
                IF CHARINDEX(N'|' + CONVERT(NVARCHAR(20), @ChildObjectId) + N'|', @ParentObjectPath) = 0
                BEGIN
                    SET @ChildAlias = N'p' + CONVERT(NVARCHAR(10), @Depth + 1);
                    SET @ChildQualifiedName =
                        QUOTENAME(OBJECT_SCHEMA_NAME(@ChildObjectId))
                        + N'.' + QUOTENAME(OBJECT_NAME(@ChildObjectId));

                    SELECT @JoinPredicate = STUFF
                    (
                        (
                            SELECT
                                N' AND ' + @ChildAlias + N'.' + QUOTENAME(ChildColumn.[name])
                                + N' = ' + @ParentAlias + N'.' + QUOTENAME(ParentColumn.[name])
                            FROM sys.foreign_key_columns AS FKC
                            INNER JOIN sys.columns AS ChildColumn
                                ON ChildColumn.object_id = FKC.parent_object_id
                               AND ChildColumn.column_id = FKC.parent_column_id
                            INNER JOIN sys.columns AS ParentColumn
                                ON ParentColumn.object_id = FKC.referenced_object_id
                               AND ParentColumn.column_id = FKC.referenced_column_id
                            WHERE FKC.constraint_object_id = @ForeignKeyObjectId
                            ORDER BY FKC.constraint_column_id
                            FOR XML PATH(N''), TYPE
                        ).value(N'.', N'NVARCHAR(MAX)'),
                        1,
                        5,
                        N''
                    );

                    INSERT INTO #DeletePaths
                    (
                        ObjectId, DepthNo, TargetAlias, ForeignKeyName,
                        ObjectPath, RelationPath, FromSql
                    )
                    VALUES
                    (
                        @ChildObjectId,
                        @Depth + 1,
                        @ChildAlias,
                        @ForeignKeyName,
                        @ParentObjectPath + CONVERT(NVARCHAR(20), @ChildObjectId) + N'|',
                        @ParentRelationPath + N' -> ' + OBJECT_SCHEMA_NAME(@ChildObjectId)
                            + N'.' + OBJECT_NAME(@ChildObjectId),
                        @ParentFromSql + N' INNER JOIN ' + @ChildQualifiedName + N' AS '
                            + @ChildAlias + N' ON ' + @JoinPredicate
                    );
                END;

                FETCH NEXT FROM ForeignKeyCursor INTO
                    @ForeignKeyObjectId, @ForeignKeyName, @ChildObjectId;
            END;

            CLOSE ForeignKeyCursor;
            DEALLOCATE ForeignKeyCursor;

            FETCH NEXT FROM PathCursor INTO
                @PathId, @ParentObjectId, @ParentAlias,
                @ParentObjectPath, @ParentRelationPath, @ParentFromSql;
        END;

        CLOSE PathCursor;
        DEALLOCATE PathCursor;

        IF NOT EXISTS (SELECT 1 FROM #DeletePaths WHERE DepthNo = @Depth + 1)
            BREAK;

        SET @Depth += 1;
    END;

    DECLARE @ForeignKeyPathCount INT =
        (SELECT COUNT(*) FROM #DeletePaths WHERE DepthNo > 0);

    CREATE TABLE #DeleteResult
    (
        DeleteOrder     INT NOT NULL,
        DepthNo         INT NOT NULL,
        TableName       NVARCHAR(517) NOT NULL,
        ForeignKeyName  SYSNAME NULL,
        RelationPath    NVARCHAR(4000) NOT NULL,
        AffectedRows    BIGINT NOT NULL,
        ExecutionMode   NVARCHAR(20) NOT NULL
    );

    DECLARE @CurrentPathId INT;
    DECLARE @CurrentObjectId INT;
    DECLARE @CurrentDepth INT;
    DECLARE @CurrentAlias SYSNAME;
    DECLARE @CurrentForeignKey SYSNAME;
    DECLARE @CurrentRelationPath NVARCHAR(4000);
    DECLARE @CurrentFromSql NVARCHAR(MAX);
    DECLARE @AffectedRows BIGINT;
    DECLARE @DeleteOrder INT = 0;

    IF @Execute = 0
    BEGIN
        DECLARE PreviewCursor CURSOR LOCAL FAST_FORWARD FOR
            SELECT PathId, ObjectId, DepthNo, TargetAlias, ForeignKeyName, RelationPath, FromSql
            FROM #DeletePaths
            ORDER BY DepthNo DESC, PathId DESC;

        OPEN PreviewCursor;
        FETCH NEXT FROM PreviewCursor INTO
            @CurrentPathId, @CurrentObjectId, @CurrentDepth, @CurrentAlias,
            @CurrentForeignKey, @CurrentRelationPath, @CurrentFromSql;

        WHILE @@FETCH_STATUS = 0
        BEGIN
            SET @AffectedRows = 0;
            SET @Sql = N'SELECT @Rows = COUNT_BIG(*) FROM ' + @CurrentFromSql
                     + N' WHERE ' + @RootWhere + N';';

            EXEC sys.sp_executesql
                @Sql,
                N'@KeyValue NVARCHAR(4000), @Rows BIGINT OUTPUT',
                @KeyValue = @RootKeyValue,
                @Rows = @AffectedRows OUTPUT;

            SET @DeleteOrder += 1;
            INSERT INTO #DeleteResult
            VALUES
            (
                @DeleteOrder,
                @CurrentDepth,
                QUOTENAME(OBJECT_SCHEMA_NAME(@CurrentObjectId)) + N'.'
                    + QUOTENAME(OBJECT_NAME(@CurrentObjectId)),
                @CurrentForeignKey,
                @CurrentRelationPath,
                @AffectedRows,
                N'PREVIEW'
            );

            FETCH NEXT FROM PreviewCursor INTO
                @CurrentPathId, @CurrentObjectId, @CurrentDepth, @CurrentAlias,
                @CurrentForeignKey, @CurrentRelationPath, @CurrentFromSql;
        END;

        CLOSE PreviewCursor;
        DEALLOCATE PreviewCursor;

        SELECT
            DeleteOrder, DepthNo, TableName, ForeignKeyName,
            RelationPath, AffectedRows, ExecutionMode,
            @ForeignKeyPathCount AS ForeignKeyPathCount
        FROM #DeleteResult
        ORDER BY DeleteOrder;

        RETURN;
    END;

    IF @RequireForeignKey = 1 AND @ForeignKeyPathCount = 0
        THROW 51008, N'Bang goc khong co Foreign Key con. Store tu choi xoa de tranh bo sot du lieu lien quan.', 1;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE DeleteCursor CURSOR LOCAL FAST_FORWARD FOR
            SELECT PathId, ObjectId, DepthNo, TargetAlias, ForeignKeyName, RelationPath, FromSql
            FROM #DeletePaths
            ORDER BY DepthNo DESC, PathId DESC;

        OPEN DeleteCursor;
        FETCH NEXT FROM DeleteCursor INTO
            @CurrentPathId, @CurrentObjectId, @CurrentDepth, @CurrentAlias,
            @CurrentForeignKey, @CurrentRelationPath, @CurrentFromSql;

        WHILE @@FETCH_STATUS = 0
        BEGIN
            SET @AffectedRows = 0;
            SET @Sql = N'DELETE ' + @CurrentAlias + N' FROM ' + @CurrentFromSql
                     + N' WHERE ' + @RootWhere
                     + N'; SET @Rows = @@ROWCOUNT;';

            EXEC sys.sp_executesql
                @Sql,
                N'@KeyValue NVARCHAR(4000), @Rows BIGINT OUTPUT',
                @KeyValue = @RootKeyValue,
                @Rows = @AffectedRows OUTPUT;

            SET @DeleteOrder += 1;
            INSERT INTO #DeleteResult
            VALUES
            (
                @DeleteOrder,
                @CurrentDepth,
                QUOTENAME(OBJECT_SCHEMA_NAME(@CurrentObjectId)) + N'.'
                    + QUOTENAME(OBJECT_NAME(@CurrentObjectId)),
                @CurrentForeignKey,
                @CurrentRelationPath,
                @AffectedRows,
                N'DELETED'
            );

            FETCH NEXT FROM DeleteCursor INTO
                @CurrentPathId, @CurrentObjectId, @CurrentDepth, @CurrentAlias,
                @CurrentForeignKey, @CurrentRelationPath, @CurrentFromSql;
        END;

        CLOSE DeleteCursor;
        DEALLOCATE DeleteCursor;

        COMMIT TRANSACTION;

        SELECT
            DeleteOrder, DepthNo, TableName, ForeignKeyName,
            RelationPath, AffectedRows, ExecutionMode,
            @ForeignKeyPathCount AS ForeignKeyPathCount
        FROM #DeleteResult
        ORDER BY DeleteOrder;
    END TRY
    BEGIN CATCH
        IF CURSOR_STATUS('local', 'DeleteCursor') >= 0
            CLOSE DeleteCursor;
        IF CURSOR_STATUS('local', 'DeleteCursor') > -3
            DEALLOCATE DeleteCursor;

        IF XACT_STATE() <> 0
            ROLLBACK TRANSACTION;

        THROW;
    END CATCH;
END
GO
