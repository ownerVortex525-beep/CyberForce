/* ============ Anonymous Tracking ============ */
window.CF_SHEET_URL = ''; // Apps Script URL (optional)
window.CF_TRACK = function(event, label){
  if (!window.CF_SHEET_URL) return;
  try {
    fetch(window.CF_SHEET_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ e: event, l: label || '', t: Date.now(), v: '1.0' }) });
  } catch(e){}
};
