const DEFAULTS = {
  locale: 'id-ID',
  currency: 'IDR'
};

// Rupiah has no circulating subunit, so it is shown as whole units.
// Every other currency keeps the fraction digits ICU gives it.
const NO_FRACTION_CURRENCIES = new Set(['IDR']);

export function formatCurrency(amount, options = {}) {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) {
    throw new TypeError(`formatCurrency expects a finite number, got: ${amount}`);
  }

  const { locale, currency } = { ...DEFAULTS, ...options };

  const fractionDigits = NO_FRACTION_CURRENCIES.has(currency)
    ? { minimumFractionDigits: 0, maximumFractionDigits: 0 }
    : {};

  const formatted = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    ...fractionDigits,
    ...pickExplicitFractionDigits(options)
  }).format(amount);

  return formatted.replace(/\u00A0/g, ' ');
}

function pickExplicitFractionDigits(options) {
  const picked = {};
  for (const key of ['minimumFractionDigits', 'maximumFractionDigits']) {
    if (options[key] !== undefined) {
      picked[key] = options[key];
    }
  }
  return picked;
}
