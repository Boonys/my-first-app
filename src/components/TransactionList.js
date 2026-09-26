import { formatCurrency } from '../utils/formatCurrency.js';

const FILTERS = [
  ['all', 'Semua'],
  ['income', 'Pemasukan'],
  ['expense', 'Pengeluaran']
];

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  month: 'short',
  year: 'numeric'
});

function formatDate(value) {
  return dateFormatter.format(new Date(`${value}T00:00:00`));
}

function createRow(transaction, { onEdit, onDelete }) {
  const row = document.createElement('li');
  row.className = `item item--${transaction.type}`;

  const main = document.createElement('div');
  main.className = 'item__main';

  const name = document.createElement('span');
  name.className = 'item__name';
  name.textContent = transaction.name;

  const meta = document.createElement('span');
  meta.className = 'item__meta';
  meta.textContent = `${transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran'} • ${formatDate(transaction.date)}`;

  main.append(name, meta);

  const amount = document.createElement('span');
  amount.className = 'item__amount';
  amount.textContent = `${transaction.type === 'income' ? '+' : '-'} ${formatCurrency(transaction.amount)}`;

  const actions = document.createElement('div');
  actions.className = 'item__actions';

  const edit = document.createElement('button');
  edit.type = 'button';
  edit.className = 'button button--ghost';
  edit.textContent = 'Edit';
  edit.addEventListener('click', () => onEdit(transaction.id));

  const remove = document.createElement('button');
  remove.type = 'button';
  remove.className = 'button button--danger';
  remove.textContent = 'Hapus';
  remove.addEventListener('click', () => onDelete(transaction.id));

  actions.append(edit, remove);
  row.append(main, amount, actions);

  return row;
}

function createEmptyState() {
  const empty = document.createElement('li');
  empty.className = 'empty';
  empty.textContent = 'Belum ada transaksi. Tambahkan yang pertama di atas.';
  return empty;
}

export function createTransactionList({ onEdit, onDelete, onFilter, onSort }) {
  const section = document.createElement('section');
  section.className = 'list';
  section.setAttribute('aria-label', 'Daftar transaksi');

  const controls = document.createElement('div');
  controls.className = 'list__controls';

  const tabs = document.createElement('div');
  tabs.className = 'tabs';
  tabs.setAttribute('role', 'tablist');

  const tabButtons = new Map();
  for (const [value, label] of FILTERS) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tab';
    button.dataset.filter = value;
    button.textContent = label;
    button.addEventListener('click', () => onFilter(value));
    tabButtons.set(value, button);
    tabs.append(button);
  }

  const search = document.createElement('input');
  search.className = 'search';
  search.type = 'search';
  search.placeholder = 'Cari nama transaksi...';
  search.setAttribute('aria-label', 'Cari transaksi');
  search.addEventListener('input', () => onSort({ search: search.value }));

  const sort = document.createElement('select');
  sort.className = 'select';
  sort.setAttribute('aria-label', 'Urutkan');
  for (const [value, label] of [
    ['date-desc', 'Terbaru'],
    ['date-asc', 'Terlama'],
    ['amount-desc', 'Jumlah terbesar'],
    ['amount-asc', 'Jumlah terkecil'],
    ['name-asc', 'Nama A-Z']
  ]) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    sort.append(option);
  }
  sort.addEventListener('change', () => onSort({ sort: sort.value }));

  controls.append(tabs, search, sort);

  const items = document.createElement('ul');
  items.className = 'list__items';

  section.append(controls, items);

  return {
    element: section,

    render({ transactions, filter }) {
      tabButtons.forEach((button, value) => {
        const isActive = value === filter;
        button.classList.toggle('tab--active', isActive);
        button.setAttribute('aria-selected', String(isActive));
      });

      items.replaceChildren();

      if (transactions.length === 0) {
        items.append(createEmptyState());
        return;
      }

      const fragment = document.createDocumentFragment();
      for (const transaction of transactions) {
        fragment.append(createRow(transaction, { onEdit, onDelete }));
      }
      items.append(fragment);
    }
  };
}
