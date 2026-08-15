/* ============ CyberForce PDF Export v13 (fast, high quality) ============ */
console.log('CyberForce pdf v13 loaded');
document.getElementById('btnPdf').addEventListener('click', async () => {
  const btn = document.getElementById('btnPdf');
  const sheets = document.querySelectorAll('#reportPreview .sheetpage');
  if (!sheets.length) { alert('Generate the preview first.'); return; }
  btn.disabled = true; btn.textContent = 'Generating...';
  try {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    const cid = window.CF_CASE_ID;
    let firstPage = true;

    for (const sh of sheets) {
      const dark = sh.classList.contains('black');
      const canvas = await html2canvas(sh, { scale: 3, backgroundColor: dark ? '#000000' : '#ffffff', useCORS: true, logging: false });
      const W = canvas.width, H = canvas.height;
      const ctx = canvas.getContext('2d');

      /* single-pass row scan (fast) */
      const buf = ctx.getImageData(0, 0, W, H).data;
      const bgR = buf[0], bgG = buf[1], bgB = buf[2];
      function rowScore(y){
        let s = 0, base = y * W * 4;
        for (let x = 0; x < W; x += 8) {
          const o = base + x * 4;
          if (Math.abs(buf[o]-bgR) + Math.abs(buf[o+1]-bgG) + Math.abs(buf[o+2]-bgB) > 90) s++;
        }
        return s;
      }
      function safeCut(from, to){
        let best = to, bs = Infinity;
        for (let y = from; y <= to; y += 3) { const s = rowScore(y); if (s < bs) { bs = s; best = y; } }
        return best;
      }

      const pxPerMm = W / 210;
      const pagePx = Math.floor(297 * pxPerMm);
      const cuts = [];
      let y = 0;
      while (y < H) {
        let end = Math.min(y + pagePx, H);
        if (end < H) end = safeCut(y + Math.floor(pagePx * 0.80), y + pagePx - 2);
        cuts.push([y, end]);
        y = end;
      }

      cuts.forEach((c) => {
        const h = c[1] - c[0];
        let dataUrl;
        if (cuts.length === 1) {
          dataUrl = canvas.toDataURL('image/jpeg', 0.95);          /* no slice needed */
        } else {
          const pc = document.createElement('canvas');
          pc.width = W; pc.height = h;
          pc.getContext('2d').drawImage(canvas, 0, c[0], W, h, 0, 0, W, h);
          dataUrl = pc.toDataURL('image/jpeg', 0.95);
        }
        if (!firstPage) pdf.addPage();
        firstPage = false;
        pdf.addImage(dataUrl, 'JPEG', 0, 0, 210, h / pxPerMm);
        pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8);
        pdf.setTextColor(dark ? 160 : 120);
        pdf.text('CyberForce Case Report System', 8, 293);
        pdf.text(cid, 105, 293, { align: 'center' });
      });
    }

    if (window.__CF_LAST_DATA) {
      if (window.saveReportMeta) saveReportMeta(window.__CF_LAST_DATA);
      if (window.CF_TRACK) CF_TRACK('export_pdf', window.__CF_LAST_DATA.crime.type);
    }
    pdf.save(cid + '-cyber-crime-report.pdf');
  } catch (e) { alert('PDF export failed: ' + e.message); }
  btn.disabled = false; btn.textContent = 'Download PDF';
});
