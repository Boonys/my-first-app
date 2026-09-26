import {
  createTransaction,
  updateTransaction,
  filterTransactions,
  sortTransactions,
  summarize
} from './utils/transaction.js';

const VALID_FILTERS = ['all', 'income', 'expense'];
const SORT_KEYS = ['date', 'amount', 'name'];

const initialState = {
  transactions: [],
  filter: 'all',
  search: '',
  sort: { key: 'date', direction: 'desc' }
};

export function createApp({ storage }) {
  let state = { ...initialState, transactions: storage.load() };
  const subscribers = new Set();

  function getState() {
    return state;
  }

  function setState(patch) {
    state = { ...state, ...patch };
    subscribers.forEach((notify) => notify(state));
  }

  function persist() {
    return storage.save(state.transactions);
  }

  return {
    getState,

    subscribe(notify) {
      subscribers.add(notify);
      return () => subscribers.delete(notify);
    },

    addTransaction(input) {
      const transaction = createTransaction(input);
      setState({ transactions: [...state.transactions, transaction] });
      persist();
      return transaction;
    },

    editTransaction(id, changes) {
      setState({ transactions: updateTransaction(state.transactions, id, changes) });
      persist();
    },

    removeTransaction(id) {
      setState({
        transactions: state.transactions.filter((t) => t.id !== id)
      });
      persist();
    },

    setFilter(filter) {
      setState({ filter: VALID_FILTERS.includes(filter) ? filter : 'all' });
    },

    setSearch(search) {
      setState({ search: typeof search === 'string' ? search : '' });
    },

    setSort(key, direction = 'desc') {
      setState({
        sort: {
          key: SORT_KEYS.includes(key) ? key : 'date',
          direction: direction === 'asc' ? 'asc' : 'desc'
        }
      });
    },

    visibleTransactions() {
      const { transactions, filter, search, sort } = state;
      return sortTransactions(filterTransactions(transactions, filter, search), sort);
    },

    summary() {
      return summarize(state.transactions);
    },

    clearAll() {
      setState({ transactions: [] });
      storage.clear();
    }
  };
}
