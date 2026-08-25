USE [WorkflowManagementv3]
GO

/****** Object:  StoredProcedure [dbo].[usp_Role_AddUser]    Script Date: 8/25/2026 6:45:16 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO


/*
    Cap hoac xoa role/menu cho mot user.

    Quy tac menu theo Users.department:
      - MKT, FO, TS, UW, LMKT, PM: Quotations, PolicyIssuances, SLA,
        DashBoard, MasterData va tat ca menu con.
      - IT: Tat ca menu dang hoat dong.

    Role hop le: Approver, Leader, Staff, HOD.

    Vi du:
      EXEC dbo.usp_Role_AddUser @RoleName = 'Staff', @UserName = 'hung.hm', @IsClear = 0;
      EXEC dbo.usp_Role_AddUser @UserName = 'hung.hm', @IsClear = 1;
*/
ALTER   PROCEDURE [dbo].[usp_Role_AddUser]
(
    @RoleName VARCHAR(100) = 'Staff',
    @UserName NVARCHAR(4000) = N'',
    @IsClear  INT = 0
)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @UserId     INT;
    DECLARE @RoleId     INT;
    DECLARE @Department NVARCHAR(100);

    --SELECT TOP (1)
    --    @UserId = U.Id,
    --    @Department = UPPER(LTRIM(RTRIM(CONVERT(NVARCHAR(100), U.[department]))))
    --FROM dbo.[Users] AS U
    --WHERE U.[username] = @UserName
    --ORDER BY U.Id;

	SELECT TOP (1)
		@UserId = U.Id,
		@Department =
		CASE
		WHEN UPPER(LTRIM(RTRIM(CONVERT(NVARCHAR(100), U.[department])))) LIKE '%UWRI%'
		THEN 'UW'
		ELSE UPPER(LTRIM(RTRIM(CONVERT(NVARCHAR(100), U.[department]))))
		END
		FROM dbo.[Users] AS U
		WHERE U.[username] = @UserName
		ORDER BY U.Id;

    IF @UserId IS NULL
        THROW 50001, N'UserName khong ton tai trong bang Users.', 1;

    IF @IsClear NOT IN (0, 1)
        THROW 50002, N'IsClear chi nhan gia tri 0 (cap quyen) hoac 1 (xoa quyen).', 1;

    --SET @RoleName = LTRIM(RTRIM(@RoleName));

    --IF @IsClear = 0 AND UPPER(@RoleName) NOT IN ('APPROVER', 'LEADER', 'STAFF', 'HOD')
    --    THROW 50006, N'RoleName chi ho tro Approver, Leader, Staff hoac HOD.', 1;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- IsClear = 1: xoa toan bo role/menu cua user, giong chuc nang store cu.
        IF @IsClear = 1
        BEGIN
            DELETE FROM dbo.UserRoles
            WHERE UserId = @UserId;

            COMMIT TRANSACTION;

    --        SELECT
    --            @UserId AS UserId,
    --            @UserName AS UserName,
    --            @Department AS Department,
    --            CAST(NULL AS INT) AS RoleId,
    --            Department AS RoleName,
    --            0 AS MenuCount,
    --            N'CLEARED' AS [Status]
				--FROM Employee
				--WHERE AccountName = @UserName
				
			    SET @RoleName = (SELECT TOP 1 Department FROM Employee
				WHERE AccountName = @UserName)

            RETURN;

        END;
		SET @RoleName = (SELECT TOP 1 Department FROM Employee
				WHERE AccountName = @UserName)
        SELECT TOP (1)
            @RoleId = R.Id
        FROM dbo.Roles AS R
        WHERE R.[RoleName] = @RoleName
        ORDER BY R.Id;

        IF @RoleId IS NULL
            THROW 50003, N'RoleName khong ton tai trong bang Roles.', 1;

        IF ISNULL(@Department, N'') NOT IN (N'MKT', N'FO', N'TS', N'UW', N'LMKT', N'PM', N'IT')
            THROW 50004, N'Department chua duoc ho tro. Cac nhom hop le: MKT, FO, TS, UW, LMKT, PM, IT.', 1;

        CREATE TABLE #AllowedMenus
        (
            MenuId INT NOT NULL PRIMARY KEY
        );

        IF @Department = N'IT'
        BEGIN
            INSERT INTO #AllowedMenus (MenuId)
            SELECT M.Id
            FROM dbo.Menu AS M
            WHERE ISNULL(M.Active, 0) = 1
              AND ISNULL(M.Deleted, 0) = 0;
        END;
        ELSE
        BEGIN
            IF
            (
                SELECT COUNT(*)
                FROM dbo.Menu AS RootMenu
                WHERE RootMenu.ParentId IS NULL
                  AND RootMenu.[Name] IN
                      ('Quotations', 'PolicyIssuances', 'SLA', 'DashBoard', 'MasterData')
                  AND ISNULL(RootMenu.Active, 0) = 1
                  AND ISNULL(RootMenu.Deleted, 0) = 0
            ) <> 5
                THROW 50005, N'Khong tim thay day du 5 nhom menu goc danh cho user khong phai IT.', 1;

            ;WITH MenuTree AS
            (
                SELECT M.Id
                FROM dbo.Menu AS M
                WHERE M.ParentId IS NULL
                  AND M.[Name] IN
                      ('Quotations', 'PolicyIssuances', 'SLA', 'DashBoard', 'MasterData')
                  AND ISNULL(M.Active, 0) = 1
                  AND ISNULL(M.Deleted, 0) = 0

                UNION ALL

                SELECT Child.Id
                FROM dbo.Menu AS Child
                INNER JOIN MenuTree AS ParentMenu
                    ON Child.ParentId = ParentMenu.Id
                WHERE ISNULL(Child.Active, 0) = 1
                  AND ISNULL(Child.Deleted, 0) = 0
            )
            INSERT INTO #AllowedMenus (MenuId)
            SELECT DISTINCT Id
            FROM MenuTree
            OPTION (MAXRECURSION 100);
        END;

        /*
            Dong bo lai quyen cua user de khong con menu cu khi user doi department
            hoac doi role. Viec xoa/insert nam trong cung transaction.
        */
        DELETE FROM dbo.UserRoles
        WHERE UserId = @UserId;

        INSERT INTO dbo.UserRoles (UserId, RoleId, MenuId)
        SELECT @UserId, @RoleId, AM.MenuId
        FROM #AllowedMenus AS AM;

        DECLARE @MenuCount INT = @@ROWCOUNT;

        COMMIT TRANSACTION;

        SELECT
            @UserId AS UserId,
            @UserName AS UserName,
            @Department AS Department,
            @RoleId AS RoleId,
            @RoleName AS RoleName,
            @MenuCount AS MenuCount,
            N'ASSIGNED' AS [Status];
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END
GO


