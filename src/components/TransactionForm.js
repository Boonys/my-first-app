const today = () => new Date().toISOString().slice(0, 10);

function createField(labelText, input) {
  const label = document.createElement('label');
  label.className = 'field';

  const caption = document.createElement('span');
  caption.className = 'field__label';
  caption.textContent = labelText;

  label.append(caption, input);

  return label;
}

export function createTransactionForm({ onSubmit }) {
  const form = document.createElement('form');
  form.className = 'form';
  form.noValidate = true;

  const nameInput = document.createElement('input');
  nameInput.className = 'field__input';
  nameInput.name = 'name';
  nameInput.type = 'text';
  nameInput.placeholder = 'Contoh: Gaji, Belanja bulanan';
  nameInput.maxLength = 60;
  nameInput.required = true;

  const amountInput = document.createElement('input');
  amountInput.className = 'field__input';
  amountInput.name = 'amount';
  amountInput.type = 'number';
  amountInput.min = '1';
  amountInput.step = 'any';
  amountInput.placeholder = '0';
  amountInput.required = true;

  const typeSelect = document.createElement('select');
  typeSelect.className = 'field__input';
  typeSelect.name = 'type';
  for (const [value, label] of [
    ['expense', 'Pengeluaran'],
    ['income', 'Pemasukan']
  ]) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    typeSelect.append(option);
  }

  const dateInput = document.createElement('input');
  dateInput.className = 'field__input';
  dateInput.name = 'date';
  dateInput.type = 'date';
  dateInput.value = today();
  dateInput.required = true;

  const error = document.createElement('p');
  error.className = 'form__error';
  error.setAttribute('role', 'alert');
  error.hidden = true;

  const submit = document.createElement('button');
  submit.className = 'button button--primary';
  submit.type = 'submit';
  submit.textContent = 'Tambah';

  form.append(
    createField('Nama transaksi', nameInput),
    createField('Jumlah', amountInput),
    createField('Jenis', typeSelect),
    createField('Tanggal', dateInput),
    error,
    submit
  );

  function showError(message) {
    error.textContent = message;
    error.hidden = false;
  }

  function reset() {
    form.reset();
    dateInput.value = today();
    error.hidden = true;
    nameInput.focus();
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    // The store owns validation, so it is also what reports the message.
    // Re-checking the rules here would only risk the two copies drifting.
    try {
      onSubmit({
        name: nameInput.value,
        amount: Number(amountInput.value),
        type: typeSelect.value,
        date: dateInput.value
      });
    } catch (error) {
      showError(error.message);
    }
  });

  return {
    element: form,
    reset,
    load(transaction) {
      nameInput.value = transaction.name;
      amountInput.value = transaction.amount;
      typeSelect.value = transaction.type;
      dateInput.value = transaction.date;
      submit.textContent = 'Simpan';
      form.classList.add('form--editing');
      nameInput.focus();
    },
    setMode(isEditing) {
      if (!isEditing) {
        submit.textContent = 'Tambah';
        form.classList.remove('form--editing');
      }
    }
  };
}
