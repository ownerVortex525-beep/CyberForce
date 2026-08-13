/* ============ Evidence Upload + SHA-256 Hashing (Final) ============ */
window.Evidence = { list: [] };

const dz = document.getElementById('dropzone');
const fi = document.getElementById('fileInput');
const grid = document.getElementById('exhibitGrid');

dz.addEventListener('click', () => fi.click());
['dragover','dragenter'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.add('over'); }));
['dragleave','drop'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.remove('over'); }));
dz.addEventListener('drop', e => handleFiles(e.dataTransfer.files));
fi.addEventListener('change', () => { handleFiles(fi.files); fi.value = ''; });

async function handleFiles(files){
  for (const f of files) {
    if (!f.type.startsWith('image/')) continue;
    const buf = await f.arrayBuffer();
    const hash = await sha256(buf);
    const dataUrl = await readDataURL(f);
    const size = await readSize(dataUrl);
    Evidence.list.push({ name: f.name, dataUrl, hash, w: size.w, h: size.h });
  }
  renderExhibits();
}

async function sha256(buf){
  try {
    const d = await crypto.subtle.digest('SHA-256', buf);
    return [...new Uint8Array(d)].map(b => b.toString(16).padStart(2, '0')).join('');
  } catch(e) { return 'hash-unavailable'; }
}

function readDataURL(f){
  return new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(f); });
}

function readSize(dataUrl){
  return new Promise(res => { const im = new Image(); im.onload = () => res({ w: im.naturalWidth, h: im.naturalHeight }); im.src = dataUrl; });
}

function renderExhibits(){
  grid.innerHTML = Evidence.list.map((e, i) => `
    <div class="exhibit">
      <img src="${e.dataUrl}" alt="Exhibit ${String.fromCharCode(65 + i)}">
      <div class="tag">Exhibit ${String.fromCharCode(65 + i)}</div>
      <div class="hash">${e.hash.slice(0, 18)}…</div>
      <button class="rm" data-i="${i}">Remove</button>
    </div>`).join('');
  grid.querySelectorAll('.rm').forEach(b => b.addEventListener('click', () => {
    Evidence.list.splice(+b.dataset.i, 1);
    renderExhibits();
  }));
}