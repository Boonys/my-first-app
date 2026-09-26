import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createTransaction,
  updateTransaction,
  filterTransactions,
  sortTransactions,
  summarize
} from '../src/utils/transaction.js';

const GROCERIES = {
  id: 't1',
  name: 'Groceries',
  amount: 150000,
  type: 'expense',
  date: '2026-01-05'
};
const SALARY = {
  id: 't2',
  name: 'Salary',
  amount: 5000000,
  type: 'income',
  date: '2026-01-01'
};
const COFFEE = {
  id: 't3',
  name: 'Coffee',
  amount: 25000,
  type: 'expense',
  date: '2026-01-03'
};

test('createTransaction builds a transaction with a generated id', () => {
  const result = createTransaction({
    name: 'Groceries',
    amount: 150000,
    type: 'expense',
    date: '2026-01-05'
  });

  assert.equal(result.name, 'Groceries');
  assert.equal(result.amount, 150000);
  assert.equal(result.type, 'expense');
  assert.equal(result.date, '2026-01-05');
  assert.ok(result.id);
});

test('createTransaction generates a different id every call', () => {
  const input = { name: 'A', amount: 100, type: 'expense', date: '2026-01-01' };
  assert.notEqual(createTransaction(input).id, createTransaction(input).id);
});

test('createTransaction trims whitespace from the name', () => {
  const result = createTransaction({
    name: '   Groceries   ',
    amount: 1000,
    type: 'expense',
    date: '2026-01-01'
  });

  assert.equal(result.name, 'Groceries');
});

test('createTransaction rejects a blank name', () => {
  assert.throws(
    () =>
      createTransaction({
        name: '   ',
        amount: 1000,
        type: 'expense',
        date: '2026-01-01'
      }),
    /name/i
  );
});

test('createTransaction rejects a non-positive amount', () => {
  assert.throws(
    () =>
      createTransaction({
        name: 'A',
        amount: 0,
        type: 'expense',
        date: '2026-01-01'
      }),
    /amount/i
  );

  assert.throws(
    () =>
      createTransaction({
        name: 'A',
        amount: -5,
        type: 'expense',
        date: '2026-01-01'
      }),
    /amount/i
  );
});

test('createTransaction rejects an unknown type', () => {
  assert.throws(
    () =>
      createTransaction({
        name: 'A',
        amount: 1000,
        type: 'transfer',
        date: '2026-01-01'
      }),
    /type/i
  );
});

test('createTransaction rejects a malformed date', () => {
  assert.throws(
    () =>
      createTransaction({
        name: 'A',
        amount: 1000,
        type: 'expense',
        date: '05-01-2026'
      }),
    /date/i
  );
});

test('updateTransaction replaces the given fields and keeps the id', () => {
  const result = updateTransaction([GROCERIES, SALARY], 't1', {
    amount: 175000
  });

  assert.equal(result.length, 2);
  assert.equal(result[0].id, 't1');
  assert.equal(result[0].amount, 175000);
  assert.equal(result[0].name, 'Groceries');
  assert.equal(result[0].date, '2026-01-05');
});

test('updateTransaction does not mutate the original array', () => {
  const original = [GROCERIES, SALARY];
  const snapshot = JSON.parse(JSON.stringify(original));

  updateTransaction(original, 't1', { amount: 175000 });

  assert.deepEqual(original, snapshot);
});

test('updateTransaction re-validates the merged result', () => {
  assert.throws(
    () => updateTransaction([GROCERIES], 't1', { amount: -1 }),
    /amount/i
  );
});

test('updateTransaction throws when the transaction does not exist', () => {
  assert.throws(
    () => updateTransaction([GROCERIES], 'ghost', { amount: 10 }),
    /not found/i
  );
});

test('filterTransactions returns every transaction for the all filter', () => {
  const all = [GROCERIES, SALARY, COFFEE];
  assert.deepEqual(filterTransactions(all, 'all'), all);
});

test('filterTransactions keeps only income transactions', () => {
  assert.deepEqual(filterTransactions([GROCERIES, SALARY, COFFEE], 'income'), [
    SALARY
  ]);
});

test('filterTransactions keeps only expense transactions', () => {
  assert.deepEqual(filterTransactions([GROCERIES, SALARY, COFFEE], 'expense'), [
    GROCERIES,
    COFFEE
  ]);
});

test('filterTransactions treats an unknown filter as all', () => {
  const all = [GROCERIES, SALARY];
  assert.deepEqual(filterTransactions(all, 'nonsense'), all);
});

test('filterTransactions also narrows by a search term', () => {
  const all = [GROCERIES, SALARY, COFFEE];
  assert.deepEqual(filterTransactions(all, 'all', 'coff'), [COFFEE]);
});

test('filterTransactions matches the search term case-insensitively', () => {
  assert.deepEqual(filterTransactions([GROCERIES], 'all', 'GROC'), [GROCERIES]);
});

test('filterTransactions returns an empty list when nothing matches', () => {
  assert.deepEqual(filterTransactions([GROCERIES], 'all', 'zzz'), []);
});

test('sortTransactions sorts by newest date first', () => {
  const result = sortTransactions([GROCERIES, SALARY, COFFEE], {
    key: 'date',
    direction: 'desc'
  });

  assert.deepEqual(
    result.map((t) => t.id),
    ['t1', 't3', 't2']
  );
});

test('sortTransactions sorts by oldest date first', () => {
  const result = sortTransactions([GROCERIES, SALARY, COFFEE], {
    key: 'date',
    direction: 'asc'
  });

  assert.deepEqual(
    result.map((t) => t.id),
    ['t2', 't3', 't1']
  );
});

test('sortTransactions sorts by amount from largest to smallest', () => {
  const result = sortTransactions([GROCERIES, SALARY, COFFEE], {
    key: 'amount',
    direction: 'desc'
  });

  assert.deepEqual(
    result.map((t) => t.id),
    ['t2', 't1', 't3']
  );
});

test('sortTransactions sorts by name alphabetically', () => {
  const result = sortTransactions([GROCERIES, SALARY, COFFEE], {
    key: 'name',
    direction: 'asc'
  });

  assert.deepEqual(
    result.map((t) => t.name),
    ['Coffee', 'Groceries', 'Salary']
  );
});

test('sortTransactions does not mutate the original array', () => {
  const original = [GROCERIES, SALARY, COFFEE];
  const snapshot = [...original];

  sortTransactions(original, { key: 'amount', direction: 'desc' });

  assert.deepEqual(original, snapshot);
});

test('summarize totals income, expenses and the resulting balance', () => {
  const result = summarize([GROCERIES, SALARY, COFFEE]);

  assert.equal(result.income, 5000000);
  assert.equal(result.expense, 175000);
  assert.equal(result.balance, 4825000);
});

test('summarize reports zeroes for an empty list', () => {
  assert.deepEqual(summarize([]), {
    income: 0,
    expense: 0,
    balance: 0,
    count: 0
  });
});

test('summarize reports a negative balance when spending exceeds income', () => {
  assert.equal(summarize([GROCERIES]).balance, -150000);
});

test('summarize counts the number of transactions', () => {
  assert.equal(summarize([GROCERIES, SALARY, COFFEE]).count, 3);
});
