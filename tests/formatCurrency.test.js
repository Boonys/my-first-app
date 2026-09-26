import test from 'node:test';
import assert from 'node:assert/strict';

import { formatCurrency } from '../src/utils/formatCurrency.js';

test('formats a positive amount with Indonesian thousand separators', () => {
  assert.equal(formatCurrency(1500), 'Rp 1.500');
});

test('formats zero without decimals', () => {
  assert.equal(formatCurrency(0), 'Rp 0');
});

test('formats a negative amount with a leading minus sign', () => {
  assert.equal(formatCurrency(-50000), '-Rp 50.000');
});

test('rounds rupiah to whole units because it has no circulating subunit', () => {
  assert.equal(formatCurrency(1234.5), 'Rp 1.235');
});

test('keeps the natural fraction digits of a currency that uses cents', () => {
  assert.equal(
    formatCurrency(1234.5, { locale: 'en-US', currency: 'USD' }),
    '$1,234.50'
  );
});

test('replaces the non-breaking space with a regular space', () => {
  assert.ok(!formatCurrency(1500).includes('\u00A0'));
});

test('honours a custom locale and currency', () => {
  assert.equal(
    formatCurrency(1500, { locale: 'en-US', currency: 'USD' }),
    '$1,500.00'
  );
});

test('throws a TypeError when the amount is not a finite number', () => {
  assert.throws(() => formatCurrency('1500'), TypeError);
  assert.throws(() => formatCurrency(NaN), TypeError);
  assert.throws(() => formatCurrency(Infinity), TypeError);
});
