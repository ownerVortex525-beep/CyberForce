/* ============ PDF Export (Final v2 + Tracking) ============ */
document.getElementById('btnPdf').addEventListener('click', async () => {
  const btn = document.getElementById('btnPdf');
  const sheet = document.querySelector('#reportPreview .sheet');
  if (!sheet) { alert('Pehle Step 7 mein preview generate karein.'); return; }
  btn.disabled = true; btn.textContent = 'Generating…';
  try {
    const dark = sheet.classList.contains('dark');
    const canvas = await html2canvas(sheet, { scale: 2, backgroundColor: dark ? '#0b0f14' : '#ffffff', useCORS: true });
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageW = 210, pageH = 297;
    const imgW = pageW;
    const imgH = canvas.height * imgW / canvas.width;
    const img = canvas.toDataURL('image/png');

    let heightLeft = imgH, position = 0;
    pdf.addImage(img, 'PNG', 0, position, imgW, imgH);
    heightLeft -= pageH;
    while (heightLeft > 0) {
      pdf.addPage();
      position = heightLeft - imgH;
      pdf.addImage(img, 'PNG', 0, position, imgW, imgH);
      heightLeft -= pageH;
    }
    if (window.saveReportMeta && window.__CF_LAST_DATA) saveReportMeta(window.__CF_LAST_DATA);
    if (window.CF_TRACK && window.__CF_LAST_DATA) CF_TRACK('export_pdf', window.__CF_LAST_DATA.crime.type);
    pdf.save(window.CF_CASE_ID + '-evidence-report.pdf');
  } catch (e) { alert('PDF export failed: ' + e.message); }
  btn.disabled = false; btn.textContent = 'Download PDF';
});