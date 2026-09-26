export function createHeader() {
  const header = document.createElement('header');
  header.className = 'app-header';

  const title = document.createElement('h1');
  title.className = 'app-title';
  title.textContent = 'Dompetku';

  const subtitle = document.createElement('p');
  subtitle.className = 'app-subtitle';
  subtitle.textContent = 'Catat pemasukan dan pengeluaran harianmu';

  header.append(title, subtitle);

  return header;
}
