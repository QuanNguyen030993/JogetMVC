import { columnField, getPathValue } from '../core/GridEngine';
import type { GridColumn, GridValidationRule } from '../types/grid.types';

const empty = (value: unknown) => value === null || value === undefined || value === '';

const defaultMessage = (rule: GridValidationRule<unknown>, caption: string): string => {
  if (rule.type === 'required') return `${caption} is required.`;
  if (rule.type === 'email') return `${caption} must be a valid email.`;
  if (rule.type === 'numeric') return `${caption} must be numeric.`;
  if (rule.type === 'stringLength') return `${caption} has an invalid length.`;
  if (rule.type === 'range') return `${caption} is outside the allowed range.`;
  if (rule.type === 'pattern') return `${caption} has an invalid format.`;
  if (rule.type === 'compare') return `${caption} does not match.`;
  return `${caption} is invalid.`;
};

export const validateValue = async <T>(value: unknown, row: T, column: GridColumn<T>): Promise<string | undefined> => {
  for (const rule of column.validationRules ?? []) {
    let valid = true;
    if (rule.type === 'required') valid = !empty(value);
    else if (!empty(value) && rule.type === 'numeric') valid = Number.isFinite(Number(value));
    else if (!empty(value) && rule.type === 'email') valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value));
    else if (!empty(value) && rule.type === 'stringLength') {
      const length = String(value).length;
      valid = (rule.min === undefined || length >= rule.min) && (rule.max === undefined || length <= rule.max);
    } else if (!empty(value) && rule.type === 'range') {
      const numeric = Number(value);
      valid = (rule.min === undefined || numeric >= rule.min) && (rule.max === undefined || numeric <= rule.max);
    } else if (!empty(value) && rule.type === 'pattern') {
      valid = (rule.pattern instanceof RegExp ? rule.pattern : new RegExp(rule.pattern ?? '')).test(String(value));
    } else if (rule.type === 'compare') {
      const target = rule.comparisonTarget?.() ?? getPathValue(row, String(rule.compareField ?? ''));
      valid = Object.is(value, target) || String(value ?? '') === String(target ?? '');
    } else if (rule.type === 'custom' || rule.type === 'async') {
      const result = await rule.validationCallback?.({ value, row, column });
      if (typeof result === 'string') return result;
      valid = result !== false;
    }
    if (!valid) return rule.message ?? defaultMessage(rule as GridValidationRule<unknown>, column.caption ?? columnField(column));
  }
  return undefined;
};

export const validateRow = async <T>(row: T, columns: GridColumn<T>[]): Promise<Record<string, string>> => {
  const errors: Record<string, string> = {};
  await Promise.all(columns.map(async (column) => {
    const field = columnField(column);
    if (!field || column.allowEditing === false) return;
    const error = await validateValue(getPathValue(row, field), row, column);
    if (error) errors[field] = error;
  }));
  return errors;
};

export const coerceEditorValue = <T>(value: unknown, column: GridColumn<T>): unknown => {
  if (value === '') return value;
  if (column.dataType === 'number') {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : value;
  }
  if (column.dataType === 'boolean') return Boolean(value);
  return value;
};
