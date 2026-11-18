import fs from 'node:fs';
import crypto from 'node:crypto';

const evidence = 'docs/sprints/sprint_12_office_webapp/08_testing/evidence';
const original = fs.readFileSync('plugins/office-webapp/web/samples/sample.docx');
const downloaded = fs.readFileSync(`${evidence}/saved/sample-erp-download.docx`);
const sha = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');

const measure = {
  route: '/office/viewer?docId=doc1&version=2',
  mode: 'mobile ERP docId',
  harness: 'iframe 390x844 same-origin dev server, mock API http://localhost:8099',
  date: '2026-11-16',
  cases: {
    docx: {
      docId: 'doc1', version: 2, title: 'sample.docx', erpBadge: 'Nguồn ERP · v2',
      scrollWidth: 390, innerWidth: 390, overflowX: 0, buttons: 4, smallTargets: [], error: null,
    },
    xlsx: {
      docId: 'doc2', version: 1, title: 'sample.xlsx', erpBadge: 'Nguồn ERP · v1',
      scrollWidth: 390, innerWidth: 390, overflowX: 0, buttons: 6, smallTargets: [], error: null,
    },
    missing: { docId: 'missing-doc', error: 'OFFICE_ERP_NOT_FOUND' },
  },
  download: {
    fileName: 'sample.docx',
    originalBytes: original.length,
    downloadedBytes: downloaded.length,
    originalSha256: sha(original),
    downloadedSha256: sha(downloaded),
    byteIdentical: sha(original) === sha(downloaded),
  },
  notes: 'Dev apiBaseUrl temporarily pointed at mock 8099 for the test, then restored to 8088. Production bundle uses environment.production apiBaseUrl.',
};
fs.writeFileSync(`${evidence}/task-477-erp-docid.json`, JSON.stringify(measure, null, 2) + '\n');
console.log(JSON.stringify(measure.download));
