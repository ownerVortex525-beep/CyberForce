/* ============ CyberForce Wizard Logic (v5 — Complete) ============ */
let current = 1;
let startedTracked = false;
window.CF_CASE_ID = 'CF-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);

const FIELD_IDS = ['sName','sPhone','sAltPhone','sPayment','sUpi','sCrypto','sInsta','sTgUser','sTgId','sOther','sSocial','cType','cPlatform','cDate','cAmount','dText','oReceived','oStation','oStatus','oRemarks','dName','dContact'];

const val = id => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const ml = s => esc(s).replace(/\n/g,'<br>');

/* ---- Theme toggle (Dark / Light) ---- */
const themeBtn = document.getElementById('themeToggle');
function applyTheme(t){
  document.body.dataset.theme = t;
  localStorage.setItem('cf_theme', t);
  themeBtn.textContent = (t === 'dark') ? 'Light Mode' : 'Dark Mode';
}
applyTheme(localStorage.getItem('cf_theme') || 'light');
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
    if (confirm('Start a new report? The current draft will be cleared.')) {
      localStorage.removeItem('cf_draft');
      location.reload();
    }
    return;
  }
  showStep(current + 1);
});

document.getElementById('btnBack').addEventListener('click', () => showStep(Math.max(1, current - 1)));

document.querySelectorAll('.wizard-steps li').forEach(li => li.addEventListener('click', () => {
  const t = +li.dataset.step;
  if (t <= current) showStep(t);
}));

/* ---- Word counter + draft autosave ---- */
document.getElementById('dText').addEventListener('input', () => {
  const t = val('dText');
  document.getElementById('wordCount').textContent = (t ? t.split(/\s+/).length : 0) + ' words';
});

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
  return {
    caseId: window.CF_CASE_ID,
    date: new Date().toLocaleString(),
    suspect: {
      photo: (window.Evidence && Evidence.photo) ? Evidence.photo.dataUrl : '',
      name: val('sName'), phone: val('sPhone'), alt: val('sAltPhone'), pay: val('sPayment'),
      upi: val('sUpi'), crypto: val('sCrypto'), insta: val('sInsta'), tgUser: val('sTgUser'),
      tgId: val('sTgId'), social: val('sSocial'), other: val('sOther')
    },
    crime: { type: val('cType'), platform: val('cPlatform'), date: val('cDate') ? new Date(val('cDate')).toLocaleString() : '', amount: val('cAmount') },
    desc: val('dText'),
    evidence: (window.Evidence ? Evidence.list : []),
    officer: { received: val('oReceived'), station: val('oStation'), status: val('oStatus'), remarks: val('oRemarks') },
    decl: { name: val('dName'), contact: val('dContact') }
  };
}

/* ---- Report sheet builder ---- */
function row(label, value, mono){
  if (!value) return '';
  return `<div class="rrow"><span class="rl">${label}</span><span class="rv ${mono ? 'mono' : ''}">${ml(value)}</span></div>`;
}

function buildReportHTML(d, black){
  const ex = d.evidence.map((e, i) =>
    `<figure class="ex"><img src="${e.dataUrl}"><figcaption>Exhibit ${String.fromCharCode(65 + i)} - SHA-256: ${e.hash.slice(0, 16)}...</figcaption></figure>`
  ).join('');
  return `
  <div class="sheet ${black ? 'black' : ''}">
    <h1>Cyber Crime Evidence Report</h1>
    <div class="meta"><span>Case ID: <b>${d.caseId}</b></span><span>Generated: <b>${d.date}</b></span></div>
    ${d.suspect.name ? `<p class="subj">Complaint against: <b>${esc(d.suspect.name)}</b></p>` : ''}

    <h2>Suspect Information</h2>
    ${d.suspect.photo ? `<img class="photo" src="${d.suspect.photo}" alt="Suspect photograph">` : ''}
    ${row('Suspect / Accused Name', d.suspect.name)}
    ${row('Primary Phone Number', d.suspect.phone, 1)}
    ${row('Alternative Number', d.suspect.alt, 1)}
    ${row('Payment Methods', d.suspect.pay, 1)}
    ${row('UPI ID', d.suspect.upi, 1)}
    ${row('Crypto Wallet Address', d.suspect.crypto, 1)}
    ${row('Instagram Username', d.suspect.insta)}
    ${row('Telegram Username', d.suspect.tgUser)}
    ${row('Telegram ID', d.suspect.tgId, 1)}
    ${row('Social Media Accounts', d.suspect.social)}
    ${row('Other (Email / Website / App)', d.suspect.other)}

    <h2>Crime Details</h2>
    ${row('Crime Type', d.crime.type)}
    ${row('Platform Used', d.crime.platform)}
    ${row('Date and Time of Incident', d.crime.date)}
    ${row('Amount Lost', d.crime.amount)}

    <h2>Description</h2>
    <p class="desc">${esc(d.desc) || '—'}</p>

    <h2>Evidence</h2>
    ${ex ? `<div class="exgrid">${ex}</div>` : '<p class="desc">No evidence attached.</p>'}

    <h2>Officer Use</h2>
    ${row('Received By (Name / ID)', d.officer.received) || '<div class="rrow"><span class="rl">Received By (Name / ID)</span><span class="rv">____________________</span></div>'}
    ${row('Station / Department / Unit', d.officer.station) || '<div class="rrow"><span class="rl">Station / Department / Unit</span><span class="rv">____________________</span></div>'}
    ${row('Case Status', d.officer.status) || '<div class="rrow"><span class="rl">Case Status</span><span class="rv">Open / Under Investigation / Closed</span></div>'}
    ${row('Officer Remarks', d.officer.remarks)}
    <div class="stamp">VERIFICATION AND STAMP</div>

    <h2>Declaration</h2>
    <p class="desc">I declare that the information provided in this report is true to my knowledge. This report is prepared for submission to the cyber cell / police.</p>
    <div class="sig">
      <span>Complainant: <b>${esc(d.decl.name)}</b>${d.decl.contact ? ' - ' + esc(d.decl.contact) : ''}</span>
      <span>Signature: <span class="line"></span></span>
      <span>Date: <span class="line"></span></span>
    </div>

    <div id="qrBox" style="margin-top:10px"></div>
    <div class="foot">${d.caseId} - Generated by CyberForce Case Report System - Citizen-prepared evidence summary. Official action lies with police / cyber cell jurisdiction. National Cyber Crime Helpline: 1930</div>
  </div>`;
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
document.getElementById('btnPrint').addEventListener('click', () => {
  if (window.CF_TRACK) CF_TRACK('print');
  window.print();
});

/* ---- Init ---- */
loadDraft();
showStep(1);
