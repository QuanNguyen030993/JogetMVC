SET QUOTED_IDENTIFIER ON
SET ANSI_NULLS ON
GO

ALTER PROCEDURE dbo.usp_FormGridConfig
(	
    --EXEC usp_FormGridConfig
	 @TableName VARCHAR(100) = ''
	 , @TableId   INT = NULL
)
AS 
BEGIN 	

     SELECT 
         col.column_id AS Id,  
         STUFF(LOWER(LEFT(col.name, 1)) + SUBSTRING(col.name, 2, LEN(col.name)), 1, LEN(col.name), LOWER(LEFT(col.name, 1)) + SUBSTRING(col.name, 2, LEN(col.name))) AS DataField, 
         CASE 
             WHEN typ.name IN ('varchar', 'nvarchar', 'char', 'text', 'ntext') THEN 'string'
             WHEN typ.name IN ('int', 'bigint', 'smallint', 'tinyint', 'decimal', 'numeric', 'float', 'real', 'money') THEN 'number'
             WHEN typ.name IN ('bit') THEN 'boolean' 
             ELSE 'other' 
         END AS DataType,  
        CASE 
              WHEN typ.name IN ('varchar', 'nvarchar', 'char', 'text', 'ntext') THEN 'dxTextBox'
             WHEN typ.name IN ('int', 'bigint', 'smallint', 'tinyint', 'decimal', 'numeric', 'float', 'real', 'money') THEN 'dxNumberBox'
             WHEN typ.name IN ('bit') THEN 'dxCheckBox' 
             ELSE 'dxTextBox' 
         END AS FormDataType,  
         1 AS AllowGrouping,  
         1 AS AllowHeaderFiltering,  
         col.name AS Caption,
		 @TableId AS SysTableId,
		 1 AS [Order],
		 1 AS Visible
		 INTO #Tmp_NewTable
     FROM sys.columns col
     JOIN sys.types typ ON col.user_type_id = typ.user_type_id
     WHERE col.object_id = OBJECT_ID(@TableName) AND col.name NOT IN ('Id', 'CreatedBy', 'CreatedDate', 'ModifiedDate', 'ModifiedBy','Deleted','DeletedBy','DeletedDate')
	 INSERT INTO dbo.DataGridConfig
	 (
	     AllowGrouping,
	     AllowHeaderFiltering,
	     Caption,
	     DataField,
	     DataType,
	     SysTableId,
	     FormDataType,
	     [Order],
	     Visible
      )
	  SELECT AllowGrouping,
	     AllowHeaderFiltering,
	     Caption,
	     DataField,
	     DataType,
	     SysTableId,
	     FormDataType,
	     [Order],
	     Visible
		 FROM #Tmp_NewTable
		 WHERE NOT EXISTS (SELECT TOP 1 1 FROM dbo.DataGridConfig WHERE SysTableId = @TableId)
END  


GO
