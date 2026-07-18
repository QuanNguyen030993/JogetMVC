using System;
using System.Collections.Generic;
using System.Linq.Expressions;
using System.Reflection;
using System.Text;

public static class ExpressionToSqlConverter<T>
{
    public static (string whereClause, Dictionary<string, object> parameters) ConvertToSqlWhere(Expression<Func<T, bool>> expression)
    {
        if (expression == null) return ("", new Dictionary<string, object>());

        var parameters = new Dictionary<string, object>();
        string whereClause = ProcessExpression(expression.Body, parameters);

        return (whereClause, parameters);
    }

    //private static string ProcessExpression(Expression expression, Dictionary<string, object> parameters)
    //{
    //    if (expression is BinaryExpression binaryExpression)
    //    {
    //        string left = ProcessExpression(binaryExpression.Left, parameters);
    //        string right = ProcessExpression(binaryExpression.Right, parameters);
    //        string op = GetSqlOperator(binaryExpression.NodeType);

    //        return $"{left} {op} {right}";
    //    }
    //    else if (expression is MemberExpression memberExpression)
    //    {
    //        if (memberExpression.Expression is ConstantExpression constantExpression)
    //        {
    //            return FormatValue(GetMemberValue(memberExpression), parameters);
    //        }
    //        return $"[{memberExpression.Member.Name}]";
    //    }
    //    else if (expression is ConstantExpression constantExpression)
    //    {
    //        return FormatValue(constantExpression.Value, parameters);
    //    }
    //    else if (expression is UnaryExpression unaryExpression)
    //    {
    //        return ProcessExpression(unaryExpression.Operand, parameters);
    //    }

    //    throw new NotSupportedException($"Unsupported expression type: {expression.GetType()}");
    //}
    private static string ProcessExpression(Expression expression, Dictionary<string, object> parameters)
    {
        if (expression is UnaryExpression unaryExpression)
        {
            // Trường hợp giá trị được đóng gói trong UnaryExpression
            return ProcessExpression(unaryExpression.Operand, parameters);
        }
        else if (expression is BinaryExpression binaryExpression)
        {
            string left = ProcessExpression(binaryExpression.Left, parameters);
            string right = ProcessExpression(binaryExpression.Right, parameters);
            string op = GetSqlOperator(binaryExpression.NodeType);

            return $"{left} {op} {right}";
        }
        else if (expression is MemberExpression memberExpression)
        {
            if (memberExpression.Expression is ConstantExpression || memberExpression.Expression is MemberExpression)
            {
                return FormatValue(GetMemberValue(memberExpression), parameters);
            }
            return $"[{memberExpression.Member.Name}]";
        }
        else if (expression is ConstantExpression constantExpression)
        {
            if (constantExpression?.Value.ToString() == "false")
                return FormatValue(0, parameters);
            if (constantExpression?.Value.ToString() == "true")
                return FormatValue(1, parameters);
            return FormatValue(constantExpression?.Value, parameters);
        }
        else if (expression is MethodCallExpression methodCallExpression)
        {
            if (methodCallExpression == null) return ""; 
            if (methodCallExpression.Method.Name == "ToString"
            && methodCallExpression.Object is MemberExpression memberExpr)
            {
                // Tên cột
                var columnName = memberExpr.Member.Name;

                // Giá trị bên phải nếu là so sánh
                if (methodCallExpression.Object is BinaryExpression binaryExpr)
                {
                    var right = binaryExpr.Right;
                    var value = GetValueFromExpression(right);

                    string paramName = $"@{columnName}";
                    parameters[paramName] = value;

                    return $"CONVERT(NVARCHAR(MAX), [{columnName}]) = {paramName}";
                }

                // Trường hợp chưa so sánh thì chỉ trả về CAST
                return $"CONVERT(NVARCHAR(MAX), [{columnName}])";
            }
            if (methodCallExpression.Method.Name == "Contains")
            {
                string columnSql = "";
                object value = null;

                // Case 1: x.Name.Contains("abc")
                if (methodCallExpression.Object is MemberExpression memberExprContains)
                {
                    columnSql = $"[{memberExprContains.Member.Name}]";
                }
                // Case 2: x.Name.ToString().Contains("abc")
                else if (methodCallExpression.Object is MethodCallExpression innerMethod
                         && innerMethod.Method.Name == "ToString"
                         && innerMethod.Object is MemberExpression innerMember)
                {
                    columnSql = $"CONVERT(NVARCHAR(MAX), [{innerMember.Member.Name}])";
                }

                // Lấy value
                if (methodCallExpression.Arguments.Count > 0)
                {
                    value = GetValueFromExpression(methodCallExpression.Arguments[0]);
                }

                string paramName = $"@p{parameters.Count}";
                parameters[paramName] = $"%{value}%";

                return $"{columnSql} LIKE {paramName}";
            }
        }
        throw new NotSupportedException($"Unsupported expression type: {expression.GetType()}");
    }

    private static object GetValueFromExpression(Expression expression)
    {
        switch (expression)
        {
            case ConstantExpression constExpr:
                return constExpr.Value;

            case MemberExpression memberExpr:
                var obj = GetValueFromExpression(memberExpr.Expression);
                var member = memberExpr.Member;
                if (member is PropertyInfo propInfo)
                    return propInfo.GetValue(obj);
                if (member is FieldInfo fieldInfo)
                    return fieldInfo.GetValue(obj);
                break;

            case UnaryExpression unaryExpr:
                return GetValueFromExpression(unaryExpr.Operand);

            case MethodCallExpression methodCallExpr:
                var lambda = Expression.Lambda(methodCallExpr);
                var compiled = lambda.Compile();
                return compiled.DynamicInvoke();
        }

        throw new NotSupportedException($"Unsupported expression type: {expression.GetType().Name}");
    }

    private static string GetSqlOperator(ExpressionType expressionType)
    {
        return expressionType switch
        {
            ExpressionType.Equal => "=",
            ExpressionType.NotEqual => "!=",
            ExpressionType.GreaterThan => ">",
            ExpressionType.GreaterThanOrEqual => ">=",
            ExpressionType.LessThan => "<",
            ExpressionType.LessThanOrEqual => "<=",
            ExpressionType.AndAlso => "AND",
            ExpressionType.OrElse => "OR",
            ExpressionType.Coalesce => "=",
            _ => throw new NotSupportedException($"Unsupported operator: {expressionType}")
        };
    }
    private static object GetMemberValue(MemberExpression memberExpression)
    {
        if (memberExpression.Expression is ConstantExpression constantExpression)
        {
            // Nếu là một hằng số
            var container = constantExpression.Value;
            var fieldInfo = memberExpression.Member as FieldInfo;
            return fieldInfo?.GetValue(container);
        }
        else if (memberExpression.Expression is MemberExpression parentMember)
        {
            // Nếu là một thuộc tính trong một đối tượng
            object instance = GetMemberValue(parentMember); // Đệ quy để lấy instance của object cha
            if (instance == null) return null;

            // Lấy giá trị thực tế của property hoặc field
            if (memberExpression.Member is PropertyInfo propertyInfo)
                return propertyInfo.GetValue(instance);
            else if (memberExpression.Member is FieldInfo fieldInfo)
                return fieldInfo.GetValue(instance);
        }
        throw new NotSupportedException("Unable to retrieve value from expression.");
    }
    private static string FormatValue(object value, Dictionary<string, object> parameters)
    {
        string paramName = $"@param{parameters.Count}";
        parameters[paramName] = value;
        return paramName;
    }
    //private static string FormatValue(object value)
    //{
    //    return value switch
    //    {
    //        string str => $"'{str}'",
    //        int or long or short or byte => value.ToString(),
    //        bool boolValue => boolValue ? "1" : "0",
    //        Guid guid => $"'{guid}'",
    //        DateTime dateTime => $"'{dateTime:yyyy-MM-dd HH:mm:ss}'",
    //        _ => throw new NotSupportedException($"Unsupported value type: {value.GetType()}")
    //    };
    //}
}

public static class ExpressionToSqlConverterV2<T>
{
    public static (string whereClause, Dictionary<string, object> parameters) ConvertToSqlWhere(Expression<Func<T, bool>> expression)
    {
        if (expression == null) return ("", new Dictionary<string, object>());

        var parameters = new Dictionary<string, object>();
        string whereClause = ProcessExpression(expression.Body, parameters);

        return (whereClause, parameters);
    }

    private static string ProcessExpression(Expression expression, Dictionary<string, object> parameters)
    {
        if (expression == null) return "";

        if (expression is UnaryExpression unaryExpression)
        {
            if (unaryExpression.NodeType == ExpressionType.Not)
            {
                // SQL Server does not allow a bit column to be used as a
                // standalone predicate (for example: NOT ([Deleted])).
                // Translate a negated boolean member to an explicit bit
                // comparison instead.
                if (IsBooleanType(unaryExpression.Operand.Type)
                    && TryGetColumnSql(unaryExpression.Operand, out string booleanColumnSql))
                {
                    return $"({booleanColumnSql} = {FormatValue(0, parameters)})";
                }

                string operand = ProcessExpression(unaryExpression.Operand, parameters);
                return $"NOT ({operand})";
            }
            return ProcessExpression(unaryExpression.Operand, parameters);
        }

        if (expression is BinaryExpression binaryExpression)
        {
            // Coalesce operator (??)
            if (binaryExpression.NodeType == ExpressionType.Coalesce)
            {
                string left = ProcessExpression(binaryExpression.Left, parameters);
                string right = ProcessExpression(binaryExpression.Right, parameters);
                return $"ISNULL({left}, {right})";
            }

            // Null comparison check (== null, != null)
            bool leftIsNull = IsNullExpression(binaryExpression.Left);
            bool rightIsNull = IsNullExpression(binaryExpression.Right);

            if (leftIsNull || rightIsNull)
            {
                string op = binaryExpression.NodeType == ExpressionType.Equal ? "IS NULL" : "IS NOT NULL";
                Expression nonNullExpr = leftIsNull ? binaryExpression.Right : binaryExpression.Left;
                string nonNullSide = ProcessExpression(nonNullExpr, parameters);
                return $"({nonNullSide} {op})";
            }

            string leftSide = ProcessExpression(binaryExpression.Left, parameters);
            string rightSide = ProcessExpression(binaryExpression.Right, parameters);
            string opSign = GetSqlOperator(binaryExpression.NodeType);

            return $"({leftSide} {opSign} {rightSide})";
        }

        if (expression is MemberExpression memberExpression)
        {
            if (TryGetColumnName(memberExpression, out string colName, out string part))
            {
                string colSql = $"[{colName}]";
                if (part != null)
                {
                    switch (part)
                    {
                        case "Date": return $"CAST({colSql} AS DATE)";
                        case "Year": return $"YEAR({colSql})";
                        case "Month": return $"MONTH({colSql})";
                        case "Day": return $"DAY({colSql})";
                        case "Hour": return $"DATEPART(HOUR, {colSql})";
                        case "Minute": return $"DATEPART(MINUTE, {colSql})";
                        case "Second": return $"DATEPART(SECOND, {colSql})";
                    }
                }
                return colSql;
            }

            // Fallback: evaluate other member accesses as constants/variables from the outer scope
            return FormatValue(GetValueFromExpression(memberExpression), parameters);
        }

        if (expression is ConstantExpression constantExpression)
        {
            if (constantExpression.Value is bool boolVal)
            {
                return FormatValue(boolVal ? 1 : 0, parameters);
            }
            return FormatValue(constantExpression.Value, parameters);
        }

        if (expression is MethodCallExpression methodCallExpression)
        {
            if (methodCallExpression.Method.Name == "ToString" && methodCallExpression.Object is MemberExpression memberExpr)
            {
                if (TryGetColumnName(memberExpr, out string colName, out _))
                {
                    return $"CONVERT(NVARCHAR(MAX), [{colName}])";
                }
            }

            if (methodCallExpression.Method.Name == "Contains")
            {
                // Collection.Contains(x.Field) / Enumerable.Contains(collection, x.Field)
                // must become SQL IN, not string LIKE. dxTagBox values arrive as a
                // captured List<T>, so treating this as string.Contains attempts to
                // evaluate x.Field and causes PropertyInfo.GetValue(null).
                if (TryProcessCollectionContains(methodCallExpression, parameters, out string inClause))
                {
                    return inClause;
                }

                string columnSql = "";
                object value = null;

                // Case 1: x.Name.Contains("abc")
                if (methodCallExpression.Object is MemberExpression memberExprContains)
                {
                    if (TryGetColumnName(memberExprContains, out string colName, out _))
                    {
                        columnSql = $"[{colName}]";
                    }
                }
                // Case 2: x.Name.ToString().Contains("abc")
                else if (methodCallExpression.Object is MethodCallExpression innerMethod
                         && innerMethod.Method.Name == "ToString"
                         && innerMethod.Object is MemberExpression innerMember)
                {
                    if (TryGetColumnName(innerMember, out string colName, out _))
                    {
                        columnSql = $"CONVERT(NVARCHAR(MAX), [{colName}])";
                    }
                }

                if (methodCallExpression.Arguments.Count > 0)
                {
                    value = GetValueFromExpression(methodCallExpression.Arguments[0]);
                }

                string paramName = $"@p{parameters.Count}";
                parameters[paramName] = $"%{value}%";

                return $"{columnSql} LIKE {paramName}";
            }
        }

        throw new NotSupportedException($"Unsupported expression type in V2 converter: {expression.GetType()}");
    }

    private static bool IsBooleanType(Type type)
    {
        return type == typeof(bool) || Nullable.GetUnderlyingType(type) == typeof(bool);
    }

    private static bool TryProcessCollectionContains(
        MethodCallExpression methodCall,
        Dictionary<string, object> parameters,
        out string sql)
    {
        sql = "";
        Expression valuesExpression = null;
        Expression columnExpression = null;

        if (methodCall.Object != null
            && methodCall.Object.Type != typeof(string)
            && methodCall.Arguments.Count == 1)
        {
            valuesExpression = methodCall.Object;
            columnExpression = methodCall.Arguments[0];
        }
        else if (methodCall.Object == null
                 && methodCall.Arguments.Count == 2
                 && methodCall.Method.DeclaringType == typeof(Enumerable))
        {
            valuesExpression = methodCall.Arguments[0];
            columnExpression = methodCall.Arguments[1];
        }

        if (valuesExpression == null
            || !TryGetColumnSql(columnExpression, out string columnSql))
        {
            return false;
        }

        if (GetValueFromExpression(valuesExpression) is not System.Collections.IEnumerable values)
        {
            return false;
        }

        var parameterNames = new List<string>();
        foreach (var value in values)
        {
            string parameterName = $"@param{parameters.Count}";
            parameters[parameterName] = value;
            parameterNames.Add(parameterName);
        }

        sql = parameterNames.Count == 0
            ? "(1 = 0)"
            : $"{columnSql} IN ({string.Join(", ", parameterNames)})";
        return true;
    }

    private static bool TryGetColumnSql(Expression expression, out string columnSql)
    {
        columnSql = "";

        if (TryGetColumnName(expression, out string columnName, out _))
        {
            columnSql = $"[{columnName}]";
            return true;
        }

        if (expression is UnaryExpression unaryExpression
            && (unaryExpression.NodeType == ExpressionType.Convert
                || unaryExpression.NodeType == ExpressionType.ConvertChecked))
        {
            return TryGetColumnSql(unaryExpression.Operand, out columnSql);
        }

        if (expression is MethodCallExpression methodCall
            && methodCall.Object != null
            && methodCall.Arguments.Count == 0
            && (methodCall.Method.Name == "ToLower" || methodCall.Method.Name == "ToUpper")
            && TryGetColumnSql(methodCall.Object, out string innerColumnSql))
        {
            string sqlFunction = methodCall.Method.Name == "ToLower" ? "LOWER" : "UPPER";
            columnSql = $"{sqlFunction}({innerColumnSql})";
            return true;
        }

        return false;
    }

    private static bool TryGetColumnName(Expression expr, out string columnName, out string dateTimePart)
    {
        columnName = null;
        dateTimePart = null;

        if (expr is MemberExpression memberExpr)
        {
            // Case 1: x.Field
            if (memberExpr.Expression is ParameterExpression)
            {
                columnName = memberExpr.Member.Name;
                return true;
            }

            // Case 2: x.Field.Value (Nullable<T>)
            if (memberExpr.Member.Name == "Value" && memberExpr.Expression is MemberExpression inner)
            {
                if (inner.Expression is ParameterExpression)
                {
                    columnName = inner.Member.Name;
                    return true;
                }
            }

            // Case 3: x.Field.Year or x.Field.Value.Year
            string tempCol = null;
            string tempPart = memberExpr.Member.Name;
            if (TryGetColumnName(memberExpr.Expression, out tempCol, out _))
            {
                columnName = tempCol;
                dateTimePart = tempPart;
                return true;
            }
        }
        return false;
    }

    private static bool IsNullExpression(Expression expression)
    {
        if (expression is ConstantExpression constExpr && constExpr.Value == null)
        {
            return true;
        }

        if (expression is MemberExpression memberExpr)
        {
            try
            {
                var val = GetValueFromExpression(memberExpr);
                if (val == null) return true;
            }
            catch {}
        }

        return false;
    }

    private static object GetValueFromExpression(Expression expression)
    {
        if (expression == null) return null;

        switch (expression)
        {
            case ConstantExpression constExpr:
                return constExpr.Value;

            case MemberExpression memberExpr:
                var obj = GetValueFromExpression(memberExpr.Expression);
                var member = memberExpr.Member;
                if (member is PropertyInfo propInfo)
                {
                    var getter = propInfo.GetMethod;
                    if (getter?.IsStatic != true && obj == null)
                    {
                        throw new InvalidOperationException(
                            $"Cannot evaluate captured property '{propInfo.Name}' because its target is null.");
                    }
                    return propInfo.GetValue(obj);
                }
                if (member is FieldInfo fieldInfo)
                {
                    if (!fieldInfo.IsStatic && obj == null)
                    {
                        throw new InvalidOperationException(
                            $"Cannot evaluate captured field '{fieldInfo.Name}' because its target is null.");
                    }
                    return fieldInfo.GetValue(obj);
                }
                break;

            case UnaryExpression unaryExpr:
                return GetValueFromExpression(unaryExpr.Operand);

            case MethodCallExpression methodCallExpr:
                var lambda = Expression.Lambda(methodCallExpr);
                var compiled = lambda.Compile();
                return compiled.DynamicInvoke();
        }

        throw new NotSupportedException($"Unsupported expression type for value evaluation: {expression.GetType().Name}");
    }

    private static string GetSqlOperator(ExpressionType expressionType)
    {
        return expressionType switch
        {
            ExpressionType.Equal => "=",
            ExpressionType.NotEqual => "!=",
            ExpressionType.GreaterThan => ">",
            ExpressionType.GreaterThanOrEqual => ">=",
            ExpressionType.LessThan => "<",
            ExpressionType.LessThanOrEqual => "<=",
            ExpressionType.AndAlso => "AND",
            ExpressionType.OrElse => "OR",
            _ => throw new NotSupportedException($"Unsupported operator: {expressionType}")
        };
    }

    private static string FormatValue(object value, Dictionary<string, object> parameters)
    {
        string paramName = $"@param{parameters.Count}";
        parameters[paramName] = value;
        return paramName;
    }
}
