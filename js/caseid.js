/* ============ Case ID + QR Verification + Report Meta ============ */
window.CF_SITE_URL = ''; // Hosting ke baad yahan apna URL daalna, jaise: 'https://cyberforcereport.netlify.app'

function verifyLink(d){
  const id = d.caseId || window.CF_CASE_ID;
  return window.CF_SITE_URL
    ? (window.CF_SITE_URL + '/verify.html?id=' + encodeURIComponent(id))
    : ('CyberForce Case ' + id + ' | Generated ' + d.date);
}

window.renderQR = function(box, d){
  if (!box || !window.QRCode) return;
  box.innerHTML = '';
  new QRCode(box, { text: verifyLink(d), width: 84, height: 84, correctLevel: QRCode.CorrectLevel.M });
  const cap = document.createElement('div');
  cap.style.fontSize = '10px';
  cap.style.marginTop = '4px';
  cap.textContent = 'Scan: ' + d.caseId;
  box.appendChild(cap);
};

/* My Reports / Verify pages (Phase 4) ke liye meta save */
window.saveReportMeta = function(d){
  try {
    const list = JSON.parse(localStorage.getItem('cf_reports') || '[]');
    list.unshift({ caseId: d.caseId, date: d.date, suspect: d.suspect.name, type: d.crime.type });
    localStorage.setItem('cf_reports', JSON.stringify(list));
  } catch(e){}
};