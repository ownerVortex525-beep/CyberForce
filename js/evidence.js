/* ============ Evidence + Suspect Photo + Crop/Zoom Editor (v3) ============ */
window.Evidence = { list: [], photo: null };

const dz = document.getElementById('dropzone');
const fi = document.getElementById('fileInput');
const grid = document.getElementById('exhibitGrid');

dz.addEventListener('click', () => fi.click());
['dragover','dragenter'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.add('over'); }));
['dragleave','drop'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.remove('over'); }));
dz.addEventListener('drop', e => handleFiles(e.dataTransfer.files));
fi.addEventListener('change', () => { handleFiles(fi.files); fi.value = ''; });

/* ================= CROP + ZOOM EDITOR ================= */
function openEditor(srcUrl, frameW, frameH, onSave, onCancel){
  const ov = document.createElement('div');
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.88);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px';
  const box = document.createElement('div');
  box.style.cssText = 'background:#111;border:1px solid #333;border-radius:6px;padding:16px;max-width:92vw;text-align:center;color:#eee';
  box.innerHTML =
    '<div style="font-size:.75rem;letter-spacing:.12em;text-transform:uppercase;margin-bottom:10px">Crop & Zoom — image ko drag karke set karein</div>' +
    '<canvas id="cfEdCanvas" style="border:1px solid #444;background:#000;touch-action:none;max-width:80vw"></canvas>' +
    '<div style="margin:12px 0;display:flex;align-items:center;gap:10px;justify-content:center">' +
    '<span style="font-size:.72rem;letter-spacing:.1em">ZOOM</span>' +
    '<input id="cfEdZoom" type="range" min="100" max="300" value="100" style="width:180px"></div>' +
    '<div style="display:flex;gap:10px;justify-content:center">' +
    '<button id="cfEdSave" style="background:#1d4ed8;color:#fff;border:none;padding:10px 24px;cursor:pointer;font-weight:700;letter-spacing:.08em">SAVE</button>' +
    '<button id="cfEdCancel" style="background:transparent;color:#eee;border:1px solid #555;padding:10px 24px;cursor:pointer">CANCEL</button></div>';
  ov.appendChild(box);
  document.body.appendChild(ov);

  const canvas = box.querySelector('#cfEdCanvas');
  const ctx = canvas.getContext('2d');
  canvas.width = frameW; canvas.height = frameH;
  const zoomIn = box.querySelector('#cfEdZoom');
  const img = new Image();
  const st = { zoom: 1, x: 0, y: 0, base: 1, ready: false };

  img.onload = () => { st.base = Math.max(frameW / img.width, frameH / img.height); st.ready = true; draw(); };
  img.src = srcUrl;

  function clampPan(){
    const s = st.base * st.zoom;
    const maxX = Math.max(0, (img.width * s - frameW) / 2);
    const maxY = Math.max(0, (img.height * s - frameH) / 2);
    st.x = Math.min(maxX, Math.max(-maxX, st.x));
    st.y = Math.min(maxY, Math.max(-maxY, st.y));
  }
  function draw(){
    if (!st.ready) return;
    clampPan();
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, frameW, frameH);
    const s = st.base * st.zoom;
    const w = img.width * s, h = img.height * s;
    ctx.drawImage(img, (frameW - w) / 2 + st.x, (frameH - h) / 2 + st.y, w, h);
  }

  zoomIn.addEventListener('input', () => { st.zoom = zoomIn.value / 100; draw(); });

  let drag = null;
  canvas.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, ox: st.x, oy: st.y }; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', e => { if (!drag) return; st.x = drag.ox + (e.clientX - drag.x); st.y = drag.oy + (e.clientY - drag.y); draw(); });
  ['pointerup','pointercancel'].forEach(ev => canvas.addEventListener(ev, () => drag = null));

  box.querySelector('#cfEdSave').addEventListener('click', () => {
    const out = canvas.toDataURL('image/png');
    document.body.removeChild(ov);
    onSave(out, frameW, frameH);
  });
  box.querySelector('#cfEdCancel').addEventListener('click', () => { document.body.removeChild(ov); if (onCancel) onCancel(); });
}

/* ================= Helpers ================= */
function readDataURL(f){
  return new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(f); });
}
async function hashDataUrl(dataUrl){
  try {
    const bin = atob(dataUrl.split(',')[1]);
    const bytes = new Uint8Array(bin.length);
    for (let j = 0; j < bin.length; j++) bytes[j] = bin.charCodeAt(j);
    const d = await crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(d)].map(b => b.toString(16).padStart(2, '0')).join('');
  } catch(e) { return 'hash-unavailable'; }
}

/* ================= Evidence screenshots (with editor) ================= */
async function handleFiles(files){
  for (const f of files) {
    if (!f.type.startsWith('image/')) continue;
    if (f.size > 8 * 1024 * 1024) { alert('File must be under 8MB: ' + f.name); continue; }
    if (Evidence.list.length >= 12) { alert('Maximum 12 exhibits allowed.'); break; }
    const raw = await readDataURL(f);
    const edited = await new Promise(res => openEditor(raw, 330, 430, (url, w, h) => res({ url, w, h }), () => res(null)));
    if (!edited) continue;
    const hash = await hashDataUrl(edited.url);
    Evidence.list.push({ name: f.name, dataUrl: edited.url, hash, w: edited.w, h: edited.h });
    renderExhibits();
  }
}

/* ================= Suspect photo (with editor) ================= */
document.getElementById('sPhoto').addEventListener('change', async function(){
  const f = this.files[0];
  if (!f || !f.type.startsWith('image/')) return;
  if (f.size > 8 * 1024 * 1024) { alert('Photo must be under 8MB.'); this.value = ''; return; }
  const raw = await readDataURL(f);
  openEditor(raw, 240, 280, (url, w, h) => {
    Evidence.photo = { dataUrl: url, w, h };
    const pv = document.getElementById('photoPreview');
    pv.src = url;
    pv.style.display = 'block';
  }, () => {});
});

/* ================= Exhibit grid ================= */
function renderExhibits(){
  grid.innerHTML = Evidence.list.map((e, i) => `
    <div class="exhibit">
      <img src="${e.dataUrl}" alt="Exhibit ${String.fromCharCode(65 + i)}">
      <div class="tag">Exhibit ${String.fromCharCode(65 + i)}</div>
      <div class="hash">${e.hash.slice(0, 18)}...</div>
      <button class="rm" data-i="${i}">Remove</button>
    </div>`).join('');
  grid.querySelectorAll('.rm').forEach(b => b.addEventListener('click', () => {
    Evidence.list.splice(+b.dataset.i, 1);
    renderExhibits();
  }));
}
