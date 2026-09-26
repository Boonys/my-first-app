const TYPES = ['income', 'expense'];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function assertName(name) {
  if (typeof name !== 'string' || name.trim() === '') {
    throw new TypeError('Transaction name is required');
  }
}

function assertAmount(amount) {
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
    throw new TypeError('Transaction amount must be a positive number');
  }
}

function assertType(type) {
  if (!TYPES.includes(type)) {
    throw new TypeError(`Transaction type must be one of: ${TYPES.join(', ')}`);
  }
}

function assertDate(date) {
  if (typeof date !== 'string' || !ISO_DATE.test(date) || Number.isNaN(Date.parse(date))) {
    throw new TypeError('Transaction date must be an ISO date (YYYY-MM-DD)');
  }
}

function generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `t-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createTransaction(input) {
  const name = typeof input?.name === 'string' ? input.name.trim() : input?.name;

  assertName(name);
  assertAmount(input?.amount);
  assertType(input?.type);
  assertDate(input?.date);

  return {
    id: generateId(),
    name,
    amount: input.amount,
    type: input.type,
    date: input.date
  };
}

export function updateTransaction(transactions, id, changes) {
  const index = transactions.findIndex((t) => t.id === id);

  if (index === -1) {
    throw new Error(`Transaction not found: ${id}`);
  }

  const current = transactions[index];
  const merged = { ...current, ...changes };
  const name = typeof merged.name === 'string' ? merged.name.trim() : merged.name;

  assertName(name);
  assertAmount(merged.amount);
  assertType(merged.type);
  assertDate(merged.date);

  const next = [...transactions];
  next[index] = { ...merged, id: current.id, name };

  return next;
}

export function filterTransactions(transactions, filter = 'all', search = '') {
  const term = typeof search === 'string' ? search.trim().toLowerCase() : '';
  // An unrecognised filter falls back to "all" so stale or corrupt filter
  // values can never hide the user's data.
  const type = TYPES.includes(filter) ? filter : 'all';

  return transactions.filter((transaction) => {
    const matchesType = type === 'all' ? true : transaction.type === type;
    const matchesSearch =
      term === '' ? true : transaction.name.toLowerCase().includes(term);

    return matchesType && matchesSearch;
  });
}

export function sortTransactions(transactions, { key = 'date', direction = 'desc' } = {}) {
  const factor = direction === 'asc' ? 1 : -1;

  const compare = {
    date: (a, b) => a.date.localeCompare(b.date),
    amount: (a, b) => a.amount - b.amount,
    name: (a, b) => a.name.localeCompare(b.name)
  }[key] ?? ((a, b) => a.date.localeCompare(b.date));

  return [...transactions].sort((a, b) => compare(a, b) * factor);
}

export function summarize(transactions) {
  const totals = transactions.reduce(
    (acc, transaction) => {
      if (transaction.type === 'income') {
        acc.income += transaction.amount;
      } else {
        acc.expense += transaction.amount;
      }
      return acc;
    },
    { income: 0, expense: 0 }
  );

  return {
    ...totals,
    balance: totals.income - totals.expense,
    count: transactions.length
  };
}
