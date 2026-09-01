import { describe, expect, it } from 'vitest';
import { coerceEditorValue, validateRow, validateValue } from './validation';

type User = { name: string; age: number; email: string };
const user: User = { name: '', age: 17, email: 'invalid' };

describe('editing validation', () => {
  it('validates built-in rules for a row', async () => {
    const errors = await validateRow(user, [
      { field: 'name', caption: 'Name', validationRules: [{ type: 'required' }] },
      { field: 'age', caption: 'Age', validationRules: [{ type: 'range', min: 18, max: 100 }] },
      { field: 'email', caption: 'Email', validationRules: [{ type: 'email' }] },
    ]);
    expect(Object.keys(errors)).toEqual(['name', 'age', 'email']);
  });

  it('supports asynchronous and custom validation messages', async () => {
    const message = await validateValue('taken', user, {
      field: 'name',
      caption: 'Name',
      validationRules: [{ type: 'async', validationCallback: async () => 'Name already exists' }],
    });
    expect(message).toBe('Name already exists');
  });

  it('coerces number and boolean editor values', () => {
    expect(coerceEditorValue('42', { field: 'age', dataType: 'number' })).toBe(42);
    expect(coerceEditorValue(true, { field: 'active', dataType: 'boolean' })).toBe(true);
  });
});
