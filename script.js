const PROXY_URL = 'https://bunny-proxy.onrender.com';
const PUBLIC_URL = 'https://lojasalvorada.b-cdn.net';
const PATHS = ['Fprodutos', 'VideosProdutos/Videos YT', 'VideosProdutos/Videos ML'];

let currentMatches = [];
let fileCache = {};
let isListView = false;

function saveDarkModePreference(isDark) {
  localStorage.setItem('darkMode', isDark ? 'true' : 'false');
}

function loadDarkModePreference() {
  return localStorage.getItem('darkMode') === 'true';
}

function setDarkMode(isDark) {
  document.body.classList.toggle('dark', isDark);
  document.getElementById('darkModeToggle').textContent = isDark ? '☀️' : '🌙';
  document.getElementById('logo').src = isDark
    ? 'https://lojasalvorada.b-cdn.net/Logos%20Loja/PNG/LOGO%20BRANCA%20COM%20ESCRITA.png'
    : 'https://lojasalvorada.b-cdn.net/Logos%20Loja/PNG/MARCA%20COLORIDA.png';
  saveDarkModePreference(isDark);
}

function toggleDarkMode() {
  const isDark = !document.body.classList.contains('dark');
  setDarkMode(isDark);
}

function toggleViewMode() {
  isListView = !isListView;
  document.getElementById('toggleViewMode').textContent = isListView
    ? '🖼️ Modo Galeria'
    : '📃 Modo Lista';
  if (currentMatches.length > 0) renderResults();
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR');
}

async function searchFiles() {
  const input = document.getElementById('searchInput').value.trim().toLowerCase();
  const terms = input.split(/[,\s]+/).filter(Boolean);
  const fileType = document.getElementById('fileTypeFilter').value;
  const resultsEl = document.getElementById('results');
  const loadingEl = document.getElementById('loading');
  const noResultsEl = document.getElementById('noResults');
  const downloadAllBtn = document.getElementById('downloadAllBtn');

  resultsEl.innerHTML = '';
  currentMatches = [];
  loadingEl.classList.remove('hidden');
  noResultsEl.classList.add('hidden');
  downloadAllBtn.classList.add('hidden');

  if (!terms.length) {
    alert("Digite um termo para buscar.");
    loadingEl.classList.add('hidden');
    return;
  }

  for (const path of PATHS) {
    try {
      const files =
        fileCache[path] ||
        (await fetch(`${PROXY_URL}/list?path=${encodeURIComponent(path)}`).then((res) =>
          res.json()
        ));

      if (!fileCache[path]) fileCache[path] = files;

      const matches = files.filter((file) => {
        const name = file.ObjectName.toLowerCase();
        const ext = '.' + name.split('.').pop();
        return terms.some((t) => name.includes(t)) && (!fileType || ext === fileType);
      });

      matches.forEach((file) => {
        currentMatches.push({
          path: `${path}/${file.ObjectName}`,
          name: file.ObjectName,
          size: file.Length,
          date: file.LastChanged
        });
      });
    } catch (err) {
      console.error(err);
    }
  }

  loadingEl.classList.add('hidden');

  if (currentMatches.length === 0) {
    noResultsEl.classList.remove('hidden');
  } else {
    renderResults();
    downloadAllBtn.classList.remove('hidden');
  }
}

function renderResults() {
  const resultsEl = document.getElementById('results');
  resultsEl.innerHTML = '';

  currentMatches.forEach((file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
    const isVideo = ['mp4', 'webm', 'mov'].includes(ext);
    const fileUrl = `${PUBLIC_URL}/${encodeURIComponentPath(file.path)}`;

    const item = document.createElement('div');
    item.className = 'item fade-in';
    if (isListView) item.classList.add('list-item');

    if (isImage) {
      item.innerHTML += `<img src="${fileUrl}" loading="lazy" alt="${file.name}" onclick="shareWhatsApp('${fileUrl}')">`;
    } else if (isVideo) {
      item.innerHTML += `<video src="${fileUrl}" controls muted preload="metadata"></video>`;
    } else {
      item.innerHTML += `<div class="file-icon">📄</div>`;
    }

    item.innerHTML += `
      <div class="filename">${file.name}</div>
      <div class="details">${formatBytes(file.size)} - ${formatDate(file.date)}</div>
      <div class="actions">
        <button onclick="downloadFile('${encodeURIComponent(file.path)}')">⬇️ Baixar</button>
        ${
          window.innerWidth < 768 && isImage
            ? `<button onclick="shareWhatsApp('${fileUrl}')">📤 Enviar</button>`
            : ''
        }
      </div>
    `;

    resultsEl.appendChild(item);
  });
}

function encodeURIComponentPath(path) {
  return path.split('/').map(encodeURIComponent).join('/');
}

function downloadFile(encodedPath) {
  const a = document.createElement('a');
  a.href = `${PROXY_URL}/download?path=${encodedPath}`;
  a.download = '';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

async function downloadAll() {
  const files = filteredFiles || []; // arquivos filtrados da última busca
  if (!files.length) return;

  // Criar e exibir barra de progresso
  const progressBar = document.createElement('progress');
  progressBar.max = files.length;
  progressBar.value = 0;
  document.getElementById('results').prepend(progressBar);

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    const link = document.createElement('a');
    link.href = `${proxyUrl}/download?path=${encodeURIComponent(file.path)}`;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    progressBar.value = i + 1;

    await new Promise(resolve => setTimeout(resolve, 750));
  }

  progressBar.remove();
}




function shareWhatsApp(url) {
  const msg = `Confira este arquivo: ${url}`;
  const waUrl = `https://wa.me/?text=${encodeURIComponent(msg)}`;
  window.open(waUrl, '_blank');
}

window.addEventListener('DOMContentLoaded', () => {
  setDarkMode(loadDarkModePreference());
  document.getElementById('darkModeToggle').addEventListener('click', toggleDarkMode);
  document.getElementById('toggleViewMode').addEventListener('click', toggleViewMode);
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    searchFiles();
  } else if (e.key === 'Escape') {
    document.getElementById('results').innerHTML = '';
    document.getElementById('downloadAllBtn').classList.add('hidden');
  } else if (e.ctrlKey && e.key.toLowerCase() === 'd') {
    e.preventDefault();
    toggleDarkMode();
  }
});
