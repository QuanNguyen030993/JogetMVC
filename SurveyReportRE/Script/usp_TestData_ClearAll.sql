USE [WorkflowManagementv2]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

/*
    XOA SACH TOAN BO DATA TEST - KHONG CO DIEU KIEN WHERE.

    EXEC dbo.usp_TestData_ClearAll;

    Khong xoa cac bang cau hinh:
      WorkflowDefinition, StepsWorkflow, WorkflowInstanceNode,
      ActionWorkflow, TransitionWorkflow, NotificationTemplate, MailTemplate.
*/
IF OBJECT_ID(N'dbo.usp_TestData_ClearAll', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.usp_TestData_ClearAll AS BEGIN SET NOCOUNT ON; END');
GO

ALTER PROCEDURE dbo.usp_TestData_ClearAll
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        /* Workflow log database. */
        DELETE FROM WorkflowManagementLog.dbo.QuotationWorkflowHistory;
        DELETE FROM WorkflowManagementLog.dbo.QuotationCommentLog;
        DELETE FROM WorkflowManagementLog.dbo.WorkflowHistory;
        DELETE FROM WorkflowManagementLog.dbo.CommentLog;

        /* Workflow transaction data. */
        DELETE FROM dbo.MailQueue;
        DELETE FROM dbo.Notification;
        DELETE FROM dbo.InstanceWorkflow;

        /* Business forms. */
        DELETE FROM dbo.PolicyIssuance;
        DELETE FROM dbo.Quotation;

        COMMIT TRANSACTION;

        SELECT N'All test data was deleted successfully.' AS [Message];
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END
GO

