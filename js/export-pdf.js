/* ============ CyberForce PDF Export v11 ============ */
console.log('CyberForce pdf v11 loaded');
document.getElementById('btnPdf').addEventListener('click', async () => {
  const btn = document.getElementById('btnPdf');
  const sheet = document.querySelector('#reportPreview .sheet');
  if (!sheet) { alert('Generate the preview first.'); return; }
  btn.disabled = true; btn.textContent = 'Generating...';
  try {
    const dark = sheet.classList.contains('black');
    const scale = (sheet.offsetWidth * 4 <= 6000) ? 4 : 3;
    const canvas = await html2canvas(sheet, { scale: scale, backgroundColor: dark ? '#000000' : '#ffffff', useCORS: true });
    const ctx = canvas.getContext('2d');
    const bgPx = ctx.getImageData(2, 2, 1, 1).data;
    function inkScore(y){ const data = ctx.getImageData(0, y, canvas.width, 1).data; let s = 0; for (let x = 0; x < canvas.width; x += 6) { const i = x * 4; if (Math.abs(data[i]-bgPx[0]) + Math.abs(data[i+1]-bgPx[1]) + Math.abs(data[i+2]-bgPx[2]) > 90) s++; } return s; }
    function safeCut(from, to){ let best = to, bs = Infinity; for (let y = from; y <= to; y += 3) { const s = inkScore(y); if (s < bs) { bs = s; best = y; } } return best; }
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
      pages.push(pc); y = end;
    }
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    const total = pages.length;
    const cid = window.CF_CASE_ID;
    pages.forEach((pc, i) => {
      if (i > 0) pdf.addPage();
      pdf.addImage(pc.toDataURL('image/png'), 'PNG', 0, 0, 210, pc.height / pxPerMm);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(dark ? 160 : 120);
      pdf.text('CyberForce Case Report System', 8, 293);
      pdf.text(cid, 105, 293, { align: 'center' });
      pdf.text('Page ' + (i + 1) + ' of ' + total, 202, 293, { align: 'right' });
    });
    if (window.__CF_LAST_DATA) { if (window.saveReportMeta) saveReportMeta(window.__CF_LAST_DATA); if (window.CF_TRACK) CF_TRACK('export_pdf', window.__CF_LAST_DATA.crime.type); }
    pdf.save(cid + '-evidence-report.pdf');
  } catch (e) { alert('PDF export failed: ' + e.message); }
  btn.disabled = false; btn.textContent = 'Download PDF';
});
