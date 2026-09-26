import test from 'node:test';
import assert from 'node:assert/strict';

import { createStorage } from '../src/utils/storage.js';

function createFakeStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
    _data: data
  };
}

const TRANSACTIONS = [
  { id: 't1', name: 'Groceries', amount: 150000, type: 'expense', date: '2026-01-05' }
];

test('load returns an empty list when nothing has been saved yet', () => {
  const storage = createStorage(createFakeStorage());

  assert.deepEqual(storage.load(), []);
});

test('save then load round-trips the transactions', () => {
  const storage = createStorage(createFakeStorage());

  storage.save(TRANSACTIONS);

  assert.deepEqual(storage.load(), TRANSACTIONS);
});

test('save writes under the transactions key', () => {
  const backend = createFakeStorage();
  const storage = createStorage(backend);

  storage.save(TRANSACTIONS);

  assert.ok(backend._data.has('transactions'));
});

test('load keeps saved data isolated per key', () => {
  const backend = createFakeStorage();
  const storage = createStorage(backend);

  storage.save(TRANSACTIONS);
  storage.saveKey('ui.filter', 'income');

  assert.deepEqual(storage.load(), TRANSACTIONS);
  assert.equal(storage.loadKey('ui.filter'), 'income');
});

test('load returns an empty list when the stored value is not valid JSON', () => {
  const backend = createFakeStorage({ transactions: '{not json' });
  const storage = createStorage(backend);

  assert.deepEqual(storage.load(), []);
});

test('load returns an empty list when the stored value is valid JSON but not a list', () => {
  const backend = createFakeStorage({ transactions: '{"id":"t1"}' });
  const storage = createStorage(backend);

  assert.deepEqual(storage.load(), []);
});

test('load returns an empty list when the backend throws', () => {
  const broken = {
    getItem() {
      throw new Error('storage disabled');
    },
    setItem() {
      throw new Error('storage disabled');
    },
    removeItem() {
      throw new Error('storage disabled');
    }
  };
  const storage = createStorage(broken);

  assert.deepEqual(storage.load(), []);
});

test('save reports failure instead of throwing when the backend rejects', () => {
  const broken = {
    getItem: () => null,
    setItem() {
      throw new Error('quota exceeded');
    },
    removeItem() {}
  };
  const storage = createStorage(broken);

  assert.equal(storage.save(TRANSACTIONS), false);
});

test('save reports success when the backend accepts', () => {
  const storage = createStorage(createFakeStorage());

  assert.equal(storage.save(TRANSACTIONS), true);
});

test('clear removes the stored transactions', () => {
  const backend = createFakeStorage();
  const storage = createStorage(backend);

  storage.save(TRANSACTIONS);
  storage.clear();

  assert.deepEqual(storage.load(), []);
});
