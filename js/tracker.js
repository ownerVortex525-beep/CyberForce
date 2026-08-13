/* ============ Anonymous Event Tracking (Privacy-First) ============ */
window.CF_SHEET_URL = 'https://script.google.com/macros/s/AKfycbyg4zBuPXuPDg52tLGWREFo_PYIirAHPnjdBR4hKDQWGkSMyRODzwHPrnBqZLjYNM8RaA/exec'; // Google Apps Script webhook URL yahan daalein

window.CF_TRACK = function(event, label){
  if (!window.CF_SHEET_URL) return;
  try {
    fetch(window.CF_SHEET_URL, {
      method: 'POST', mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ e: event, l: label || '', t: Date.now(), v: '1.0' })
    });
  } catch(e){}
};