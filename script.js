const PROXY_URL = 'https://bunny-proxy.onrender.com';
const PUBLIC_URL = 'https://lojasalvorada.b-cdn.net';
const PATHS = ['Fprodutos', 'VideosProdutos/Videos YT', 'VideosProdutos/Videos ML'];

let currentMatches = [];
let fileCache = {};

async function searchFiles() {
  const query = document.getElementById('searchInput').value.trim().toLowerCase();
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

  if (!query) {
    alert("Digite um termo para buscar.");
    loadingEl.classList.add('hidden');
    return;
  }

  for (const path of PATHS) {
    try {
      const files = fileCache[path] || await fetch(`${PROXY_URL}/list?path=${encodeURIComponent(path)}`).then(res => res.json());
      if (!fileCache[path]) fileCache[path] = files;

      const matches = files.filter(file => {
        const name = file.ObjectName.toLowerCase();
        const ext = '.' + name.split('.').pop();
        return name.includes(query) && (!fileType || ext === fileType);
      });

      matches.forEach(file => {
        const ext = file.ObjectName.split('.').pop().toLowerCase();
        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
        const isVideo = ['mp4', 'webm', 'mov'].includes(ext);
        const filePath = `${path}/${file.ObjectName}`;
        const fileUrl = `${PUBLIC_URL}/${encodeURIComponentPath(filePath)}`;

        const item = document.createElement('div');
        item.className = 'item';

        if (isImage) {
          item.innerHTML += `<img src="${fileUrl}" alt="${file.ObjectName}">`;
        } else if (isVideo) {
          item.innerHTML += `<video src="${fileUrl}" controls muted></video>`;
        } else {
          item.innerHTML += `<div>Arquivo: ${ext}</div>`;
        }

        item.innerHTML += `
          <div class="filename">${file.ObjectName}</div>
          <button onclick="downloadFile('${encodeURIComponent(filePath)}')">⬇️ Baixar</button>
        `;

        resultsEl.appendChild(item);
        currentMatches.push(filePath);
      });

    } catch (err) {
      console.error(err);
    }
  }

  loadingEl.classList.add('hidden');

  if (currentMatches.length === 0) {
    noResultsEl.classList.remove('hidden');
  } else {
    downloadAllBtn.classList.remove('hidden');
  }
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

function downloadAll() {
  currentMatches.forEach((path, i) => {
    setTimeout(() => downloadFile(encodeURIComponent(path)), i * 300);
  });
}

function toggleDarkMode() {
  const isDark = document.body.classList.toggle('dark');
  const btn = document.getElementById('darkModeToggle');
  btn.textContent = isDark ? '☀️ Modo Claro' : '🌙 Modo Escuro';
}

window.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('darkModeToggle');
  btn.textContent = document.body.classList.contains('dark') ? '☀️ Modo Claro' : '🌙 Modo Escuro';
});
