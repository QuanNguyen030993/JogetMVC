import { describe, expect, it } from 'vitest';
import { GridArrayStore } from './ArrayStore';

describe('GridArrayStore', () => {
  it('supports load, lookup and CRUD operations', async () => {
    const store = new GridArrayStore([{ id: 1, name: 'One' }, { id: 2, name: 'Two' }]);
    expect(await store.load({ skip: 0, take: 1, sort: [] })).toEqual({ data: [{ id: 1, name: 'One' }], totalCount: 2 });
    await store.update(2, { name: 'Second' });
    expect(await store.byKey(2)).toEqual({ id: 2, name: 'Second' });
    await store.insert({ id: 3, name: 'Three' });
    await store.remove(1);
    expect((await store.load({ skip: 0, take: 10, sort: [] })).totalCount).toBe(2);
  });
});
