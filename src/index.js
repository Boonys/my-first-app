import { createApp } from './App.js';
import { createBrowserStorage } from './utils/storage.js';
import { createHeader } from './components/Header.js';
import { createSummaryCards, renderSummaryCards } from './components/SummaryCards.js';
import { createTransactionForm } from './components/TransactionForm.js';
import { createTransactionList } from './components/TransactionList.js';

const SORT_OPTIONS = {
  'date-desc': ['date', 'desc'],
  'date-asc': ['date', 'asc'],
  'amount-desc': ['amount', 'desc'],
  'amount-asc': ['amount', 'asc'],
  'name-asc': ['name', 'asc']
};

function mount() {
  const root = document.getElementById('app');
  const app = createApp({ storage: createBrowserStorage() });

  let editingId = null;

  const form = createTransactionForm({
    onSubmit(input) {
      if (editingId) {
        app.editTransaction(editingId, input);
        editingId = null;
        form.setMode(false);
        form.reset();
        return;
      }
      // Reset only after the store accepts, so a rejected entry keeps
      // whatever the user typed.
      app.addTransaction(input);
      form.reset();
    }
  });

  const list = createTransactionList({
    onEdit(id) {
      editingId = id;
      const transaction = app.getState().transactions.find((t) => t.id === id);
      if (transaction) {
        form.load(transaction);
        form.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    },
    onDelete(id) {
      if (editingId === id) {
        editingId = null;
        form.setMode(false);
        form.reset();
      }
      app.removeTransaction(id);
    },
    onFilter(value) {
      app.setFilter(value);
    },
    onSort({ search, sort }) {
      if (search !== undefined) {
        app.setSearch(search);
      }
      if (sort !== undefined) {
        const [key, direction] = SORT_OPTIONS[sort] ?? ['date', 'desc'];
        app.setSort(key, direction);
      }
    }
  });

  const summary = createSummaryCards();

  root.append(createHeader(), summary, form.element, list.element);

  app.subscribe(() => {
    renderSummaryCards(summary, app.summary());
    list.render({
      transactions: app.visibleTransactions(),
      filter: app.getState().filter
    });
  });

  renderSummaryCards(summary, app.summary());
  list.render({
    transactions: app.visibleTransactions(),
    filter: app.getState().filter
  });
}

mount();
