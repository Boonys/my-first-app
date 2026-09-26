import test from 'node:test';
import assert from 'node:assert/strict';

import { createApp } from '../src/App.js';

function createFakeStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
    _data: data
  };
}

function setup(savedJson) {
  const backend = createFakeStorage(
    savedJson === undefined ? {} : { transactions: savedJson }
  );
  const storage = {
    load: () => (savedJson === undefined ? [] : JSON.parse(savedJson)),
    save: (t) => {
      backend.setItem('transactions', JSON.stringify(t));
      return true;
    },
    clear: () => {
      backend.removeItem('transactions');
      return true;
    },
    loadKey: (k, f) => f,
    saveKey: () => true
  };
  return { app: createApp({ storage }), backend };
}

test('starts empty when there is nothing saved', () => {
  const { app } = setup();

  assert.deepEqual(app.getState().transactions, []);
});

test('loads previously saved transactions on start', () => {
  const saved = [{ id: 't1', name: 'Groceries', amount: 150000, type: 'expense', date: '2026-01-05' }];
  const { app } = setup(JSON.stringify(saved));

  assert.deepEqual(app.getState().transactions, saved);
});

test('addTransaction appends the new transaction', () => {
  const { app } = setup();

  const added = app.addTransaction({
    name: 'Groceries',
    amount: 150000,
    type: 'expense',
    date: '2026-01-05'
  });

  const { transactions } = app.getState();
  assert.equal(transactions.length, 1);
  assert.equal(transactions[0].id, added.id);
});

test('addTransaction persists the new transaction', () => {
  const { app, backend } = setup();

  app.addTransaction({ name: 'Groceries', amount: 150000, type: 'expense', date: '2026-01-05' });

  const persisted = JSON.parse(backend._data.get('transactions'));
  assert.equal(persisted.length, 1);
  assert.equal(persisted[0].name, 'Groceries');
});

test('addTransaction rejects invalid input and leaves state untouched', () => {
  const { app } = setup();

  assert.throws(() => app.addTransaction({ name: '', amount: 10, type: 'expense', date: '2026-01-01' }));
  assert.deepEqual(app.getState().transactions, []);
});

test('editTransaction updates the matching transaction only', () => {
  const { app } = setup();
  const a = app.addTransaction({ name: 'A', amount: 1000, type: 'expense', date: '2026-01-01' });
  app.addTransaction({ name: 'B', amount: 2000, type: 'expense', date: '2026-01-02' });

  app.editTransaction(a.id, { amount: 1500 });

  const { transactions } = app.getState();
  assert.equal(transactions[0].amount, 1500);
  assert.equal(transactions[1].amount, 2000);
});

test('editTransaction persists the change', () => {
  const { app, backend } = setup();
  const a = app.addTransaction({ name: 'A', amount: 1000, type: 'expense', date: '2026-01-01' });

  app.editTransaction(a.id, { amount: 1500 });

  const persisted = JSON.parse(backend._data.get('transactions'));
  assert.equal(persisted[0].amount, 1500);
});

test('removeTransaction drops the matching transaction', () => {
  const { app } = setup();
  const a = app.addTransaction({ name: 'A', amount: 1000, type: 'expense', date: '2026-01-01' });
  app.addTransaction({ name: 'B', amount: 2000, type: 'expense', date: '2026-01-02' });

  app.removeTransaction(a.id);

  const { transactions } = app.getState();
  assert.equal(transactions.length, 1);
  assert.equal(transactions[0].name, 'B');
});

test('removeTransaction persists the removal', () => {
  const { app, backend } = setup();
  const a = app.addTransaction({ name: 'A', amount: 1000, type: 'expense', date: '2026-01-01' });

  app.removeTransaction(a.id);

  assert.deepEqual(JSON.parse(backend._data.get('transactions')), []);
});

test('setFilter changes the active filter', () => {
  const { app } = setup();

  app.setFilter('income');

  assert.equal(app.getState().filter, 'income');
});

test('setSearch changes the search term', () => {
  const { app } = setup();

  app.setSearch('coff');

  assert.equal(app.getState().search, 'coff');
});

test('setSort changes the sort key and direction', () => {
  const { app } = setup();

  app.setSort('amount', 'asc');

  assert.deepEqual(app.getState().sort, { key: 'amount', direction: 'asc' });
});

test('visibleTransactions applies the filter, the search and the sort', () => {
  const { app } = setup();
  app.addTransaction({ name: 'Coffee', amount: 25000, type: 'expense', date: '2026-01-03' });
  app.addTransaction({ name: 'Salary', amount: 5000000, type: 'income', date: '2026-01-01' });
  app.addTransaction({ name: 'Groceries', amount: 150000, type: 'expense', date: '2026-01-05' });

  app.setFilter('expense');
  app.setSort('amount', 'desc');
  const visible = app.visibleTransactions();

  assert.deepEqual(
    visible.map((t) => t.name),
    ['Groceries', 'Coffee']
  );
});

test('summary reflects the whole ledger, not the filtered view', () => {
  const { app } = setup();
  app.addTransaction({ name: 'Coffee', amount: 25000, type: 'expense', date: '2026-01-03' });
  app.addTransaction({ name: 'Salary', amount: 5000000, type: 'income', date: '2026-01-01' });

  app.setFilter('expense');

  assert.deepEqual(app.summary(), {
    income: 5000000,
    expense: 25000,
    balance: 4975000,
    count: 2
  });
});

test('notifies subscribers on every state change', () => {
  const { app } = setup();
  let calls = 0;
  app.subscribe(() => {
    calls += 1;
  });

  app.addTransaction({ name: 'A', amount: 1000, type: 'expense', date: '2026-01-01' });
  app.setFilter('income');

  assert.equal(calls, 2);
});

test('subscribe returns an unsubscribe function', () => {
  const { app } = setup();
  let calls = 0;
  const unsubscribe = app.subscribe(() => {
    calls += 1;
  });

  unsubscribe();
  app.setFilter('income');

  assert.equal(calls, 0);
});
