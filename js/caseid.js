/* ============ Case ID + QR + Meta ============ */
window.CF_SITE_URL = 'https://cyberforcereport.netlify.app'; // apna live URL (bina aakhri /)

window.renderQR = function(box, d){
  if (!box || !window.QRCode) return;
  box.innerHTML = '';
  const url = window.CF_SITE_URL ? (window.CF_SITE_URL + '/verify.html?id=' + encodeURIComponent(d.caseId)) : ('CyberForce Case ' + d.caseId + ' | Generated ' + d.date);
  new QRCode(box, { text: url, width: 84, height: 84, correctLevel: QRCode.CorrectLevel.M });
  const c = document.createElement('div');
  c.style.fontSize = '10px'; c.style.marginTop = '4px';
  c.textContent = 'Scan: ' + d.caseId;
  box.appendChild(c);
};

window.saveReportMeta = function(d){
  try {
    const l = JSON.parse(localStorage.getItem('cf_reports') || '[]');
    l.unshift({ caseId: d.caseId, date: d.date, suspect: d.suspect.name, type: d.crime.type });
    localStorage.setItem('cf_reports', JSON.stringify(l));
  } catch(e){}
};
