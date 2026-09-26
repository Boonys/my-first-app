# Dompetku — Personal Finance Tracker

Aplikasi pencatatan pemasukan dan pengeluaran harian, dibuat dengan **Vanilla JavaScript (ES Modules)** tanpa framework dan tanpa dependency. Data disimpan di `localStorage` sehingga tidak hilang saat browser di-refresh.

Dibangun dengan **TDD** — 70 test otomatis memakai built-in test runner Node.js (`node:test`), nol dependency.

## Konsep SE yang dipelajari

| Konsep | Di mana |
| --- | --- |
| Pencatatan Data (CRUD) | `src/App.js` — `addTransaction`, `editTransaction`, `removeTransaction`, `visibleTransactions` |
| Filter & Sorting | `src/utils/transaction.js` — `filterTransactions`, `sortTransactions` |
| Array Manipulation | `.filter()`, `.map()`, `.sort()`, `.reduce()` di `transaction.js` |
| Ringkasan / Agregasi | `summarize()` — total pemasukan, pengeluaran, saldo, jumlah data |
| State Management | `createApp()` — satu sumber kebenaran + pola subscribe/notify |
| Persistence Storage | `src/utils/storage.js` — `localStorage` di balik abstraksi yang bisa ditukar API |
| Modularitas & Reusability | `src/components/` — fungsi render murni, tanpa state |
| Validasi Input | Assertion di `transaction.js`, pesan error di `TransactionForm` |

## Menjalankan

```bash
npm test        # jalankan 70 test
npm start       # jalankan di http://localhost:3000
```

## Struktur

```
my-first-app/
├── public/
│   └── index.html          # View
├── src/
│   ├── assets/
│   │   └── styles.css
│   ├── components/
│   │   ├── Header.js
│   │   ├── SummaryCards.js
│   │   ├── TransactionForm.js
│   │   └── TransactionList.js
│   ├── utils/
│   │   ├── formatCurrency.js
│   │   ├── storage.js
│   │   └── transaction.js
│   ├── App.js              # State + orkestrasi CRUD
│   └── index.js            # Entry point / wiring
├── tests/
│   ├── helpers/
│   │   └── dom.js              # DOM stub khusus test
│   ├── app.test.js
│   ├── formatCurrency.test.js
│   ├── storage.test.js
│   ├── transaction.test.js
│   └── transactionForm.test.js
├── .gitignore
├── package.json
└── README.md
```

## Tahap Pengerjaan

### Step 1 — UI/UX Dasar
Form HTML untuk input nama transaksi, jumlah, jenis (Pemasukan/Pengeluaran), dan tanggal. Dihandle `TransactionForm.js` + `public/index.html`.

### Step 2 — Logika JS
Form terhubung ke store lewat `addEventListener('submit')`. Validasi jumlah dicek sebelum masuk ke array. State dikelola di `App.js`.

### Step 3 — Render UI
Isi array dirender ke daftar secara dinamis. `subscribe()`/`notify()` memicu render ulang setiap state berubah — tidak ada manipulasi DOM manual di index.html.

### Step 4 — Penyimpanan
`storage.js` memakai `localStorage.setItem()` / `getItem()`. Backend storage di-inject sebagai argumen (`createStorage(backend)`), jadi logika yang sama bisa diarahkan ke API someday tanpa mengubah pemanggilnya. Data rusak atau JSON invalid otomatis dianggap daftar kosong, bukan crash.

### Step 5 — Version Control
```bash
git init
git add .
git commit -m "feat: personal finance tracker with TDD"
gh repo create my-first-app --public --source=. --push
```

## Catatan Teknis

- **Rupiah tanpa desimal.** `Intl` memberi IDR 2 digit desimal secara default, padahal rupiah tidak punya subunit yang beredar. `formatCurrency` memaksa 0 desimal untuk IDR, dan membiarkan mata uang lain (USD, EUR) memakai digit alaminya.
- **Non-breaking space.** `Intl` menyisipkan `U+00A0` antara simbol dan angka. `formatCurrency` menggantinya dengan spasi biasa agar output stabil dan mudah diuji.
- **Validasi satu sumber.** Aturan validasi hanya ada di `utils/transaction.js` (store). Form tidak menyalin aturan itu; ia hanya menampilkan pesan error yang dilempar store. Kalau input ditolak, isian form tidak dihapus.
- **XSS aman.** Nama transaksi selalu ditulis lewat `textContent`, tidak pernah `innerHTML`.
- **Immutability.** `sortTransactions` dan `updateTransaction` mengembalikan array baru, tidak mengubah input.

## Testing

Test memakai `node:test` + `node:assert/strict` (bawaan Node, tanpa install). Pole `backend` storage di-inject sebagai fake, sehingga logika persistence bisa diuji tanpa browser.

```
tests 70
pass 70
fail 0
```
