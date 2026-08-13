/* ============ PDF Export v2 — safe page cuts, no squeezed images ============ */
document.getElementById('btnPdf').addEventListener('click', async () => {
  const btn = document.getElementById('btnPdf');
  const sheet = document.querySelector('#reportPreview .sheet');
  if (!sheet) { alert('Generate the preview in Step 7 first.'); return; }
  btn.disabled = true; btn.textContent = 'Generating...';
  try {
    const dark = sheet.classList.contains('black');
    const canvas = await html2canvas(sheet, { scale: 3, backgroundColor: dark ? '#000000' : '#ffffff', useCORS: true });
    const ctx = canvas.getContext('2d');
    const bgPx = ctx.getImageData(2, 2, 1, 1).data;

    function inkScore(y){
      const data = ctx.getImageData(0, y, canvas.width, 1).data;
      let score = 0;
      for (let x = 0; x < canvas.width; x += 6) {
        const i = x * 4;
        const d = Math.abs(data[i] - bgPx[0]) + Math.abs(data[i + 1] - bgPx[1]) + Math.abs(data[i + 2] - bgPx[2]);
        if (d > 90) score++;
      }
      return score;
    }
    function safeCut(from, to){
      let best = to, bestScore = Infinity;
      for (let y = from; y <= to; y += 3) {
        const s = inkScore(y);
        if (s < bestScore) { bestScore = s; best = y; }
      }
      return best;
    }

    const pxPerMm = canvas.width / 210;
    const pagePx = Math.floor(297 * pxPerMm);
    const pages = [];
    let y = 0;
    while (y < canvas.height) {
      let end = Math.min(y + pagePx, canvas.height);
      if (end < canvas.height) end = safeCut(y + Math.floor(pagePx * 0.80), y + pagePx - 2);
      const pc = document.createElement('canvas');
      pc.width = canvas.width; pc.height = end - y;
      pc.getContext('2d').drawImage(canvas, 0, y, canvas.width, end - y, 0, 0, canvas.width, end - y);
      pages.push(pc);
      y = end;
    }

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    pages.forEach((pc, i) => {
      if (i > 0) pdf.addPage();
      pdf.addImage(pc.toDataURL('image/png'), 'PNG', 0, 0, 210, pc.height / pxPerMm);
    });
    if (window.saveReportMeta && window.__CF_LAST_DATA) saveReportMeta(window.__CF_LAST_DATA);
    if (window.CF_TRACK && window.__CF_LAST_DATA) CF_TRACK('export_pdf', window.__CF_LAST_DATA.crime.type);
    pdf.save(window.CF_CASE_ID + '-evidence-report.pdf');
  } catch (e) { alert('PDF export failed: ' + e.message); }
  btn.disabled = false; btn.textContent = 'Download PDF';
});
