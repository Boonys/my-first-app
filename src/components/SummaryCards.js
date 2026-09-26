import { formatCurrency } from '../utils/formatCurrency.js';

function createCard(label, value, variant) {
  const card = document.createElement('div');
  card.className = `summary-card summary-card--${variant}`;

  const cardLabel = document.createElement('span');
  cardLabel.className = 'summary-card__label';
  cardLabel.textContent = label;

  const cardValue = document.createElement('strong');
  cardValue.className = 'summary-card__value';
  cardValue.dataset.role = variant;
  cardValue.textContent = value;

  card.append(cardLabel, cardValue);

  return card;
}

export function createSummaryCards() {
  const section = document.createElement('section');
  section.className = 'summary';
  section.setAttribute('aria-label', 'Ringkasan');

  section.append(
    createCard('Saldo', formatCurrency(0), 'balance'),
    createCard('Pemasukan', formatCurrency(0), 'income'),
    createCard('Pengeluaran', formatCurrency(0), 'expense')
  );

  return section;
}

export function renderSummaryCards(section, totals) {
  const values = {
    balance: totals.balance,
    income: totals.income,
    expense: totals.expense
  };

  section.querySelectorAll('[data-role]').forEach((node) => {
    const amount = values[node.dataset.role];
    node.textContent = formatCurrency(amount);
    node.closest('.summary-card').classList.toggle(
      'summary-card--negative',
      amount < 0
    );
  });
}
