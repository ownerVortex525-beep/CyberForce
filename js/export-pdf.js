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
