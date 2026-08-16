/* ============ CyberForce DOCX Export v14 ============ */
console.log('CyberForce docx v14 loaded');
document.getElementById('btnDoc').addEventListener('click', async () => {
  const d = window.__CF_LAST_DATA;
  if (!d) { alert('Generate the preview first.'); return; }
  const btn = document.getElementById('btnDoc');
  btn.disabled = true; btn.textContent = 'Generating...';
  try {
    const { Document, Packer, Paragraph, TextRun, ImageRun, HeadingLevel } = window.docx;
    const P = (text, o = {}) => new Paragraph({ children: [new TextRun({ text, bold: o.bold, size: o.size, color: o.color, italics: o.italics })], spacing: { after: o.after ?? 120 } });
    const H = t => new Paragraph({ text: t, heading: HeadingLevel.HEADING_2, spacing: { before: 220, after: 100 } });
    const row = (l, v) => v ? new Paragraph({ children: [new TextRun({ text: l + ': ', bold: true }), new TextRun({ text: v })], spacing: { after: 80 } }) : null;
    const add = (l, v) => { const r = row(l, v); if (r) children.push(r); };
    const bytes = dataUrl => { const bin = atob(dataUrl.split(',')[1]); const b = new Uint8Array(bin.length); for (let j = 0; j < bin.length; j++) b[j] = bin.charCodeAt(j); return b; };
    const imgPara = (dataUrl, w, h) => new Paragraph({ children: [new ImageRun({ type: 'png', data: bytes(dataUrl), transformation: { width: w, height: h } })], spacing: { after: 120 } });

    const children = [];
    children.push(new Paragraph({ children: [new TextRun({ text: 'CYBERFORCE EVIDENCE REPORT', bold: true, size: 32 })], spacing: { after: 120 } }));
    children.push(P('Official Case File — Confidential', { size: 18, color: '0b2447' }));
    children.push(P('Case File No: ' + d.caseId + '   |   Date of Report: ' + d.date, { size: 20 }));
    if (d.suspect.name) children.push(P('Complaint against: ' + d.suspect.name, { bold: true }));

    children.push(H('1. Suspect Information'));
    if (d.suspect.photo && d.suspect.photoW) {
      children.push(imgPara(d.suspect.photo, d.suspect.photoW, d.suspect.photoH));
      children.push(P('Suspect Photograph', { italics: true, size: 16 }));
    }
    add('Suspect / Accused Name', d.suspect.name); add('Primary Phone Number', d.suspect.phone);
    add('Alternative Number', d.suspect.alt); add('Payment Methods', d.suspect.pay);
    add('UPI ID', d.suspect.upi); add('Crypto Wallet Address', d.suspect.crypto);
    add('Instagram Username', d.suspect.insta); add('Telegram Username', d.suspect.tgUser);
    add('Telegram ID', d.suspect.tgId); add('Social Media Accounts', d.suspect.social);
    add('Other (Email / Website / App)', d.suspect.other);

    children.push(H('2. Crime Details'));
    add('Crime Type', d.crime.type); add('Platform Used', d.crime.platform);
    add('Date and Time of Incident', d.crime.date); add('Place of Incident', d.crime.place);
    add('Amount Lost', d.crime.amount);
    children.push(P('Indicative provisions: IT Act 2000 — S.66, 66C, 66D · IPC — S.420, 468, 471', { size: 16, color: '666666' }));

    children.push(H('3. Statement of Complainant'));
    children.push(P(d.desc || '—'));

    children.push(H('4. Officer Use'));
    children.push(row('Received By (Name / ID)', d.officer.received) || P('Received By (Name / ID): ____________________'));
    children.push(row('Station / Department / Unit', d.officer.station) || P('Station / Department / Unit: ____________________'));
    children.push(row('Case Status', d.officer.status) || P('Case Status: Open / Under Investigation / Closed'));
    if (d.officer.remarks) add('Officer Remarks', d.officer.remarks);
    children.push(P('Verification and Stamp: ____________________', { after: 80 }));

    children.push(H('5. Declaration & Signatures'));
    children.push(P('I hereby declare that the information furnished in this report is true to my knowledge. This report is prepared for submission before the Cyber Cell / concerned police authority.'));
    children.push(P('Complainant: ' + d.decl.name + (d.decl.contact ? ' · ' + d.decl.contact : '')));
    children.push(P('Signature: ____________________    Date: ____________________'));

    children.push(H('Annexure A — Evidence'));
    if (!d.evidence.length) children.push(P('No evidence attached.'));
    for (let i = 0; i < d.evidence.length; i++) {
      const e = d.evidence[i];
      children.push(new Paragraph({ children: [new TextRun({ text: 'Exhibit ' + String.fromCharCode(65 + i) + ' - SHA-256: ' + e.hash.slice(0, 16) + '...', bold: true, size: 18 })], spacing: { after: 60 } }));
      children.push(imgPara(e.dataUrl, e.w, e.h));
    }

    children.push(P('Case File No. ' + d.caseId + ' · CyberForce Case Report System · National Cyber Crime Helpline: 1930', { size: 16, color: '666666' }));

    const doc = new Document({ sections: [{ children }] });
    const blob = await Packer.toBlob(doc);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = window.CF_CASE_ID + '-cyberforce-evidence-report.docx';
    a.click();
    if (window.saveReportMeta) saveReportMeta(d);
    if (window.CF_TRACK) CF_TRACK('export_docx', d.crime.type);
  } catch (e) { alert('DOC export failed: ' + e.message); }
  btn.disabled = false; btn.textContent = 'Download DOC';
});
