/* ============ CyberForce Wizard v12 (Case-File Report) ============ */
console.log('CyberForce wizard v12 loaded');
let current = 1, startedTracked = false;
window.CF_CASE_ID = 'CF-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);

const FIELD_IDS = ['sName','sPhone','sAltPhone','sPayment','sUpi','sCrypto','sInsta','sTgUser','sTgId','sOther','sSocial','cType','cPlatform','cDate','cPlace','cAmount','dText','oReceived','oStation','oStatus','oRemarks','dName','dContact'];

const val = id => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const ml = s => esc(s).replace(/\n/g,'<br>');

/* ---- Theme: DARK default, change only on toggle ---- */
const themeBtn = document.getElementById('themeToggle');
function applyTheme(t){ document.body.dataset.theme = t; localStorage.setItem('cf_theme', t); themeBtn.textContent = (t === 'dark') ? 'Light Mode' : 'Dark Mode'; }
applyTheme(localStorage.getItem('cf_theme') || 'dark');
themeBtn.addEventListener('click', () => applyTheme(document.body.dataset.theme === 'dark' ? 'light' : 'dark'));

/* ---- Navigation ---- */
function showStep(n){
  current = n;
  document.querySelectorAll('.step-panel').forEach(p => p.classList.toggle('show', +p.dataset.step === n));
  document.querySelectorAll('.wizard-steps li').forEach(li => li.classList.toggle('active', +li.dataset.step === n));
  document.getElementById('btnBack').style.visibility = (n === 1) ? 'hidden' : 'visible';
  document.getElementById('btnNext').textContent = (n === 6) ? 'Preview and Export' : (n === 7 ? 'Finish' : 'Next Section');
  if (n === 7) renderPreview();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.getElementById('btnNext').addEventListener('click', () => {
  if (current === 1 && !startedTracked) { if (window.CF_TRACK) CF_TRACK('report_started'); startedTracked = true; }
  if (current === 6) {
    if (!val('dName') || !document.getElementById('declCheck').checked) {
      alert('Complete the declaration: Complainant Name and the truth checkbox are required.');
      return;
    }
    if (window.CF_TRACK) CF_TRACK('report_completed', val('cType'));
  }
  if (current === 7) {
    if (confirm('Start a new report? All data will be cleared.')) { localStorage.removeItem('cf_draft'); location.reload(); }
    return;
  }
  showStep(current + 1);
});

document.getElementById('btnBack').addEventListener('click', () => showStep(Math.max(1, current - 1)));

document.querySelectorAll('.wizard-steps li').forEach(li => li.addEventListener('click', () => {
  const t = +li.dataset.step;
  if (t <= current) showStep(t);
}));

/* ---- Auto-clear after export ---- */
['btnPdf','btnDoc'].forEach(id => document.getElementById(id).addEventListener('click', () => {
  setTimeout(() => { localStorage.removeItem('cf_draft'); if (confirm('Report downloaded. Clear all data and start a NEW report?')) location.reload(); }, 1200);
}));

/* ---- Word counter + draft autosave ---- */
document.getElementById('dText').addEventListener('input', () => { const t = val('dText'); document.getElementById('wordCount').textContent = (t ? t.split(/\s+/).length : 0) + ' words'; });
document.addEventListener('input', e => { if (e.target.matches('input,textarea,select')) saveDraft(); });

function saveDraft(){
  const o = {};
  FIELD_IDS.forEach(id => o[id] = val(id));
  o.declCheck = document.getElementById('declCheck').checked;
  try { localStorage.setItem('cf_draft', JSON.stringify(o)); } catch(e){}
}

function loadDraft(){
  try {
    const o = JSON.parse(localStorage.getItem('cf_draft') || '{}');
    FIELD_IDS.forEach(id => { const el = document.getElementById(id); if (el && o[id]) el.value = o[id]; });
    if (o.declCheck) document.getElementById('declCheck').checked = true;
    document.getElementById('dText').dispatchEvent(new Event('input'));
  } catch(e){}
}

/* ---- Data collection ---- */
function getFormData(){
  const ph = Evidence.photo;
  return {
    caseId: window.CF_CASE_ID,
    date: new Date().toLocaleString(),
    suspect: {
      photo: ph ? ph.dataUrl : '', photoW: ph ? ph.w : 0, photoH: ph ? ph.h : 0,
      name: val('sName'), phone: val('sPhone'), alt: val('sAltPhone'), pay: val('sPayment'),
      upi: val('sUpi'), crypto: val('sCrypto'), insta: val('sInsta'), tgUser: val('sTgUser'),
      tgId: val('sTgId'), social: val('sSocial'), other: val('sOther')
    },
    crime: { type: val('cType'), platform: val('cPlatform'), date: val('cDate') ? new Date(val('cDate')).toLocaleString() : '', place: val('cPlace'), amount: val('cAmount') },
    desc: val('dText'),
    evidence: Evidence.list,
    officer: { received: val('oReceived'), station: val('oStation'), status: val('oStatus'), remarks: val('oRemarks') },
    decl: { name: val('dName'), contact: val('dContact') }
  };
}

/* ---- Case-file table row ---- */
function trow(l, v, mono){ return v ? `<tr><td class="rl">${l}</td><td class="rv ${mono ? 'mono' : ''}">${ml(v)}</td></tr>` : ''; }

/* ---- Case-file builder: 3 pages ---- */
function buildReportHTML(d, black){
  const cls = black ? 'sheetpage black' : 'sheetpage';
  const foot = `${d.caseId} · CyberForce Case Report System · National Cyber Crime Helpline: 1930`;

  const ex = d.evidence.map((e, i) =>
    `<div class="ex2"><img src="${e.dataUrl}"><div class="excap">Exhibit ${String.fromCharCode(65 + i)} · SHA-256: ${e.hash.slice(0, 16)}...</div></div>`
  ).join('');

  const page1 = `
  <div class="${cls}">
    <div class="sp-head"><span class="sp-brand">CYBERFORCE</span><h1>Cyber Crime Evidence Report</h1><div class="sp-sub">Confidential — For Law-Enforcement Submission</div></div>
    <div class="sp-meta"><span>Case ID: <b>${d.caseId}</b></span><span>Generated: <b>${d.date}</b></span></div>
    ${d.suspect.name ? `<div class="sp-sec">Subject of Complaint</div><div class="descbox">Complaint against: <b>${esc(d.suspect.name)}</b></div>` : ''}
    <div class="sp-sec">Suspect Information</div>
    <div class="${d.suspect.photo ? 'suswrap' : ''}" style="padding-bottom:8px">
      ${d.suspect.photo ? `<div class="pbox"><img src="${d.suspect.photo}" alt="Suspect photograph"><div class="pcap">Suspect Photo</div></div>` : ''}
      <table class="ctable">
        ${trow('Suspect / Accused Name', d.suspect.name)}
        ${trow('Primary Phone Number', d.suspect.phone, 1)}
        ${trow('Alternative Number', d.suspect.alt, 1)}
        ${trow('Payment Methods', d.suspect.pay, 1)}
        ${trow('UPI ID', d.suspect.upi, 1)}
        ${trow('Crypto Wallet Address', d.suspect.crypto, 1)}
        ${trow('Instagram Username', d.suspect.insta)}
        ${trow('Telegram Username', d.suspect.tgUser)}
        ${trow('Telegram ID', d.suspect.tgId, 1)}
        ${trow('Social Media Accounts', d.suspect.social)}
        ${trow('Other (Email / Website / App)', d.suspect.other)}
      </table>
    </div>
    <div class="sp-sec">Crime Details</div>
    <table class="ctable">
      ${trow('Crime Type', d.crime.type)}
      ${trow('Platform Used', d.crime.platform)}
      ${trow('Date and Time of Incident', d.crime.date)}
      ${trow('Place of Incident', d.crime.place)}
      ${trow('Amount Lost', d.crime.amount)}
    </table>
    <div class="sp-foot">${foot}</div>
  </div>`;

  const page2 = `
  <div class="${cls}">
    <div class="sp-head"><span class="sp-brand">CYBERFORCE</span><h1>Statement & Declaration</h1><div class="sp-sub">Case ${d.caseId}</div></div>
    <div class="sp-sec">Description of Incident</div>
    <div class="descbox">${esc(d.desc) || '—'}</div>
    <div class="sp-sec">Officer Use</div>
    <table class="ctable">
      ${trow('Received By (Name / ID)', d.officer.received) || '<tr><td class="rl">Received By (Name / ID)</td><td class="rv">____________________</td></tr>'}
      ${trow('Station / Department / Unit', d.officer.station) || '<tr><td class="rl">Station / Department / Unit</td><td class="rv">____________________</td></tr>'}
      ${trow('Case Status', d.officer.status) || '<tr><td class="rl">Case Status</td><td class="rv">Open / Under Investigation / Closed</td></tr>'}
      ${trow('Officer Remarks', d.officer.remarks)}
    </table>
    <div class="stampbox">VERIFICATION AND STAMP</div>
    <div class="sp-sec">Declaration</div>
    <div class="descbox">I declare that the information provided in this report is true to my knowledge. This report is prepared for submission to the cyber cell / police.</div>
    <div class="sigblock">
      <span class="sline">Complainant: <b>${esc(d.decl.name)}</b>${d.decl.contact ? ' · ' + esc(d.decl.contact) : ''}</span>
      <span class="sline">Signature: <span class="line"></span></span>
      <span class="sline">Date: <span class="line"></span></span>
    </div>
    <div id="qrBox" style="margin:0 28px 14px"></div>
    <div class="sp-foot">${foot}</div>
  </div>`;

  const page3 = `
  <div class="${cls}">
    <div class="sp-head"><span class="sp-brand">CYBERFORCE</span><h1>Annexure A — Evidence</h1><div class="sp-sub">Case ${d.caseId}</div></div>
    <div style="padding:18px 28px 6px">
      ${ex || '<div class="descbox" style="margin:0">No evidence attached.</div>'}
      <div class="clear"></div>
    </div>
    <div class="sp-foot">${foot}</div>
  </div>`;

  return page1 + page2 + page3;
}

/* ---- Live preview ---- */
function renderPreview(){
  const black = document.querySelector('input[name="skin"]:checked').value === 'black';
  const d = getFormData();
  window.__CF_LAST_DATA = d;
  document.getElementById('caseIdView').textContent = d.caseId;
  document.getElementById('reportPreview').innerHTML = buildReportHTML(d, black);
  if (window.renderQR) window.renderQR(document.getElementById('qrBox'), d);
}
document.querySelectorAll('input[name="skin"]').forEach(r => r.addEventListener('change', renderPreview));

/* ---- Print ---- */
document.getElementById('btnPrint').addEventListener('click', () => { if (window.CF_TRACK) CF_TRACK('print'); window.print(); });

/* ---- Init ---- */
loadDraft();
showStep(1);
