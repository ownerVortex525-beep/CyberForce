/* ============ CyberForce Evidence v10 (High-Res) ============ */
window.Evidence = { list: [], photo: null };
console.log('CyberForce evidence v10 loaded');

const dz = document.getElementById('dropzone');
const fi = document.getElementById('fileInput');
const grid = document.getElementById('exhibitGrid');

dz.addEventListener('click', () => fi.click());
['dragover','dragenter'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.add('over'); }));
['dragleave','drop'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.remove('over'); }));
dz.addEventListener('drop', e => handleFiles(e.dataTransfer.files));
fi.addEventListener('change', () => { handleFiles(fi.files); fi.value = ''; });

function readDataURL(f){ return new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(f); }); }
function readSize(dataUrl){ return new Promise(res => { const im = new Image(); im.onload = () => res({ w: im.naturalWidth, h: im.naturalHeight }); im.src = dataUrl; }); }
function fitSize(w, h, maxW, maxH){
  const s = Math.min(maxW / (w || 1), maxH / (h || 1), 1);
  return { w: Math.max(60, Math.round((w || 1) * s)), h: Math.max(60, Math.round((h || 1) * s)) };
}
function dataUrlBytes(dataUrl){ const bin = atob(dataUrl.split(',')[1]); const b = new Uint8Array(bin.length); for (let j = 0; j < bin.length; j++) b[j] = bin.charCodeAt(j); return b; }
async function hashDataUrl(dataUrl){
  try { const d = await crypto.subtle.digest('SHA-256', dataUrlBytes(dataUrl)); return [...new Uint8Array(d)].map(b => b.toString(16).padStart(2,'0')).join(''); }
  catch(e) { return 'hash-unavailable'; }
}

/* ---- HIGH-RES crop + zoom editor (4x internal resolution) ---- */
function openEditor(srcUrl, onSave, onCancel){
  const probe = new Image();
  probe.onload = () => {
    const landscape = probe.width > probe.height;
    const frameW = landscape ? 1440 : 1120;   /* high-res internal */
    const frameH = landscape ? 1080 : 1440;

    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.9);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px';
    const box = document.createElement('div');
    box.style.cssText = 'background:#111;border:1px solid #333;border-radius:6px;padding:16px;max-width:92vw;text-align:center;color:#eee';
    box.innerHTML =
      '<div style="font-size:.75rem;letter-spacing:.12em;text-transform:uppercase;margin-bottom:10px">Crop & Zoom — drag image to adjust</div>' +
      '<canvas id="cfEdCanvas" style="border:1px solid #444;background:#000;touch-action:none;max-width:80vw;max-height:60vh"></canvas>' +
      '<div style="margin:12px 0;display:flex;align-items:center;gap:10px;justify-content:center"><span style="font-size:.72rem">ZOOM</span><input id="cfEdZoom" type="range" min="100" max="300" value="100" style="width:180px"></div>' +
      '<div style="display:flex;gap:10px;justify-content:center"><button id="cfEdSave" style="background:#1d4ed8;color:#fff;border:none;padding:10px 24px;cursor:pointer;font-weight:700">SAVE</button><button id="cfEdCancel" style="background:transparent;color:#eee;border:1px solid #555;padding:10px 24px;cursor:pointer">CANCEL</button></div>';
    ov.appendChild(box);
    document.body.appendChild(ov);

    const canvas = box.querySelector('#cfEdCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = frameW; canvas.height = frameH;
    const zoomIn = box.querySelector('#cfEdZoom');
    const img = probe;
    const st = { zoom: 1, x: 0, y: 0, base: Math.max(frameW / img.width, frameH / img.height) };

    function clampPan(){
      const s = st.base * st.zoom;
      const maxX = Math.max(0, (img.width * s - frameW) / 2);
      const maxY = Math.max(0, (img.height * s - frameH) / 2);
      st.x = Math.min(maxX, Math.max(-maxX, st.x));
      st.y = Math.min(maxY, Math.max(-maxY, st.y));
    }
    function draw(){
      clampPan();
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, frameW, frameH);
      const s = st.base * st.zoom;
      const w = img.width * s, h = img.height * s;
      ctx.drawImage(img, (frameW - w) / 2 + st.x, (frameH - h) / 2 + st.y, w, h);
    }
    draw();
    zoomIn.addEventListener('input', () => { st.zoom = zoomIn.value / 100; draw(); });
    let drag = null;
    canvas.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, ox: st.x, oy: st.y }; canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener('pointermove', e => { if (!drag) return; st.x = drag.ox + (e.clientX - drag.x); st.y = drag.oy + (e.clientY - drag.y); draw(); });
    ['pointerup','pointercancel'].forEach(ev => canvas.addEventListener(ev, () => drag = null));
    box.querySelector('#cfEdSave').addEventListener('click', () => { const out = canvas.toDataURL('image/png'); document.body.removeChild(ov); onSave(out); });
    box.querySelector('#cfEdCancel').addEventListener('click', () => { document.body.removeChild(ov); if (onCancel) onCancel(); });
  };
  probe.src = srcUrl;
}

/* ---- evidence: high-res save, small display ---- */
async function handleFiles(files){
  for (const f of files) {
    if (!f.type.startsWith('image/')) continue;
    if (f.size > 8 * 1024 * 1024) { alert('File must be under 8MB: ' + f.name); continue; }
    if (Evidence.list.length >= 12) { alert('Maximum 12 exhibits allowed.'); break; }
    const raw = await readDataURL(f);
    const edited = await new Promise(res => openEditor(raw, url => res(url), () => res(null)));
    if (!edited) continue;
    const size = await readSize(edited);
    const disp = fitSize(size.w, size.h, 240, 320);   /* display size only */
    const hash = await hashDataUrl(edited);
    Evidence.list.push({ name: f.name, dataUrl: edited, hash, w: disp.w, h: disp.h });
    renderExhibits();
  }
}

/* ---- suspect photo: high-res save, small display ---- */
document.getElementById('sPhoto').addEventListener('change', async function(){
  const f = this.files[0];
  if (!f || !f.type.startsWith('image/')) return;
  if (f.size > 8 * 1024 * 1024) { alert('Photo must be under 8MB.'); this.value = ''; return; }
  const raw = await readDataURL(f);
  openEditor(raw, async (url) => {
    const size = await readSize(url);
    const disp = fitSize(size.w, size.h, 150, 180);
    Evidence.photo = { dataUrl: url, w: disp.w, h: disp.h };
    const pv = document.getElementById('photoPreview');
    pv.src = url; pv.style.display = 'block';
  }, () => {});
});

function renderExhibits(){
  grid.innerHTML = Evidence.list.map((e, i) => `
    <div class="exhibit">
      <img src="${e.dataUrl}" alt="Exhibit ${String.fromCharCode(65 + i)}" style="width:100%;height:auto">
      <div class="tag">Exhibit ${String.fromCharCode(65 + i)}</div>
      <div class="hash">${e.hash.slice(0, 18)}...</div>
      <button class="rm" data-i="${i}">Remove</button>
    </div>`).join('');
  grid.querySelectorAll('.rm').forEach(b => b.addEventListener('click', () => { Evidence.list.splice(+b.dataset.i, 1); renderExhibits(); }));
}
