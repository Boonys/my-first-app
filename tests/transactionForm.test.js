import test from 'node:test';
import assert from 'node:assert/strict';

import { installFakeDom } from './helpers/dom.js';
import { createApp } from '../src/App.js';

installFakeDom();
const { createTransactionForm } = await import(
  '../src/components/TransactionForm.js'
);

function memoryStorage() {
  return {
    load: () => [],
    save: () => true,
    clear: () => true,
    loadKey: (_key, fallback) => fallback,
    saveKey: () => true
  };
}

function build(onSubmit) {
  return createTransactionForm({ onSubmit });
}

// Drives the form against the real store so validation is not faked.
function buildWithApp() {
  const app = createApp({ storage: memoryStorage() });
  const form = build((input) => {
    if (form.editingId) {
      app.editTransaction(form.editingId, input);
      form.setMode(false);
      form.reset();
      return;
    }
    form.reset();
    app.addTransaction(input);
  });
  return { app, form };
}

function find(form, predicate) {
  return form.element.descendants().find(predicate);
}

function fieldNamed(form, name) {
  return find(form, (node) => node.name === name);
}

function errorOf(form) {
  return find(form, (node) => node.matches('form__error'));
}

function submitLabelOf(form) {
  return find(form, (node) => node.tagName === 'BUTTON' && node.type === 'submit')
    .textContent;
}

function fill(form, { name, amount, type = 'expense', date = '2026-01-01' }) {
  fieldNamed(form, 'name').value = name;
  fieldNamed(form, 'amount').value = amount;
  fieldNamed(form, 'type').value = type;
  fieldNamed(form, 'date').value = date;
}

test('submits the parsed input to the callback', () => {
  let received = null;
  const form = build((input) => {
    received = input;
  });

  fill(form, { name: 'Gaji', amount: '5000000', type: 'income' });
  form.element.dispatch('submit');

  assert.deepEqual(received, {
    name: 'Gaji',
    amount: 5000000,
    type: 'income',
    date: '2026-01-01'
  });
});

test('shows an error and stores nothing when the amount is not positive', () => {
  const { app, form } = buildWithApp();

  fill(form, { name: 'Gaji', amount: '-5' });
  form.element.dispatch('submit');

  assert.deepEqual(app.getState().transactions, []);
  assert.equal(errorOf(form).hidden, false);
  assert.match(errorOf(form).textContent, /amount/i);
});

test('surfaces the validation error instead of letting it escape the handler', () => {
  const { form } = buildWithApp();

  fill(form, { name: '   ', amount: '1000' });

  assert.doesNotThrow(() => form.element.dispatch('submit'));
  assert.equal(errorOf(form).hidden, false);
  assert.match(errorOf(form).textContent, /name is required/i);
});

test('treats a non-numeric amount as invalid', () => {
  const { app, form } = buildWithApp();

  fill(form, { name: 'Gaji', amount: 'abc' });
  form.element.dispatch('submit');

  assert.deepEqual(app.getState().transactions, []);
  assert.equal(errorOf(form).hidden, false);
});

test('a valid submission reaches the store', () => {
  const { app, form } = buildWithApp();

  fill(form, { name: 'Gaji', amount: '5000000', type: 'income' });
  form.element.dispatch('submit');

  const { transactions } = app.getState();
  assert.equal(transactions.length, 1);
  assert.equal(transactions[0].amount, 5000000);
  assert.equal(errorOf(form).hidden, true);
});

test('hides the error again after a successful submission resets the form', () => {
  const { form } = buildWithApp();

  fill(form, { name: 'Gaji', amount: '-1' });
  form.element.dispatch('submit');
  assert.equal(errorOf(form).hidden, false);

  form.reset();

  assert.equal(errorOf(form).hidden, true);
});

test('load fills the fields for editing and switches the button label', () => {
  const form = build(() => {});

  form.load({
    id: 't1',
    name: 'Groceries',
    amount: 150000,
    type: 'expense',
    date: '2026-01-05'
  });

  assert.equal(fieldNamed(form, 'name').value, 'Groceries');
  assert.equal(fieldNamed(form, 'amount').value, 150000);
  assert.equal(fieldNamed(form, 'type').value, 'expense');
  assert.equal(fieldNamed(form, 'date').value, '2026-01-05');
  assert.equal(submitLabelOf(form), 'Simpan');
});

test('setMode switches the button label back', () => {
  const form = build(() => {});
  form.load({ name: 'A', amount: 1, type: 'expense', date: '2026-01-01' });

  form.setMode(false);

  assert.equal(submitLabelOf(form), 'Tambah');
});

test('form exposes the element for mounting', () => {
  const form = build(() => {});

  assert.equal(form.element.tagName, 'FORM');
});
