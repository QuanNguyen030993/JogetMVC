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
            return FormatValue(constantExpression.Value, parameters);
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
