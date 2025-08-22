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

        throw new NotSupportedException($"Unsupported expression type: {expression.GetType()}");
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
