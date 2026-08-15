/* ============ CyberForce PDF Export v12 (case-file pages) ============ */
console.log('CyberForce pdf v12 loaded');
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
      const scale = (sh.offsetWidth * 4 <= 6000) ? 4 : 3;
      const canvas = await html2canvas(sh, { scale: scale, backgroundColor: dark ? '#000000' : '#ffffff', useCORS: true });
      const ctx = canvas.getContext('2d');
      const bgPx = ctx.getImageData(2, 2, 1, 1).data;

      function inkScore(y){
        const data = ctx.getImageData(0, y, canvas.width, 1).data;
        let s = 0;
        for (let x = 0; x < canvas.width; x += 6) {
          const i = x * 4;
          if (Math.abs(data[i]-bgPx[0]) + Math.abs(data[i+1]-bgPx[1]) + Math.abs(data[i+2]-bgPx[2]) > 90) s++;
        }
        return s;
      }
      function safeCut(from, to){
        let best = to, bs = Infinity;
        for (let y = from; y <= to; y += 3) {
          const s = inkScore(y);
          if (s < bs) { bs = s; best = y; }
        }
        return best;
      }

      const pxPerMm = canvas.width / 210;
      const pagePx = Math.floor(297 * pxPerMm);
      const cuts = [];
      let y = 0;
      while (y < canvas.height) {
        let end = Math.min(y + pagePx, canvas.height);
        if (end < canvas.height) end = safeCut(y + Math.floor(pagePx * 0.80), y + pagePx - 2);
        cuts.push([y, end]);
        y = end;
      }

      cuts.forEach((c) => {
        const pc = document.createElement('canvas');
        pc.width = canvas.width;
        pc.height = c[1] - c[0];
        pc.getContext('2d').drawImage(canvas, 0, c[0], canvas.width, c[1] - c[0], 0, 0, canvas.width, c[1] - c[0]);
        if (!firstPage) pdf.addPage();
        firstPage = false;
        pdf.addImage(pc.toDataURL('image/png'), 'PNG', 0, 0, 210, (c[1] - c[0]) / pxPerMm);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor(dark ? 160 : 120);
        pdf.text('CyberForce Case Report System', 8, 293);
        pdf.text(cid, 105, 293, { align: 'center' });
      });
    }

    if (window.__CF_LAST_DATA) {
      if (window.saveReportMeta) saveReportMeta(window.__CF_LAST_DATA);
      if (window.CF_TRACK) CF_TRACK('export_pdf', window.__CF_LAST_DATA.crime.type);
    }
    pdf.save(cid + '-evidence-report.pdf');
  } catch (e) { alert('PDF export failed: ' + e.message); }
  btn.disabled = false; btn.textContent = 'Download PDF';
});
