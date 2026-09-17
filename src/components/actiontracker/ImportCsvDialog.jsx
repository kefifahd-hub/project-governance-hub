import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Upload, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

// Target ActionItem fields the importer can populate
const TARGET_FIELDS = [
  'title', 'itemKey', 'itemType', 'priority', 'status', 'assignee',
  'dueDate', 'bucket', 'phase', 'progressPct', 'blocked', 'description',
];

// Header aliases → target field
const HEADER_ALIASES = {
  title: ['title', 'action', 'task', 'item', 'subject', 'name'],
  assignee: ['owner', 'responsible', 'assigned to', 'assigned_to', 'assignee', 'who'],
  dueDate: ['due', 'deadline', 'target date', 'due date', 'target_date', 'targetdate'],
  bucket: ['category', 'workstream', 'area', 'discipline', 'bucket', 'workstream'],
  phase: ['stage', 'gate', 'phase', 'milestone'],
  itemKey: ['key', 'id', 'ref', 'reference', 'item key', 'itemkey', 'code'],
  progressPct: ['progress', '% complete', 'percent', 'percent complete', 'completion', 'progresspct'],
  description: ['notes', 'details', 'description', 'comment', 'remarks'],
  itemType: ['type', 'item type', 'itemtype', 'category type'],
  priority: ['priority', 'urgency', 'severity'],
  status: ['status', 'state'],
  blocked: ['blocked', 'blocker', 'on hold'],
};

const PRIORITY_MAP = {
  'critical': 'P1 - Critical', 'p1': 'P1 - Critical', 'urgent': 'P1 - Critical',
  'high': 'P2 - High', 'p2': 'P2 - High',
  'medium': 'P3 - Medium', 'p3': 'P3 - Medium', 'normal': 'P3 - Medium',
  'low': 'P4 - Low', 'p4': 'P4 - Low',
};
const TYPE_MAP = {
  'risk': 'Risk Action', 'punch': 'Punch List', 'punchlist': 'Punch List',
  'rfi': 'RFI', 'decision': 'Decision', 'issue': 'Issue',
  'deliverable': 'Deliverable', 'action': 'Action',
};
const DEFAULT_STATUS = {
  'Action': 'To Do', 'Issue': 'Open', 'Decision': 'Pending', 'RFI': 'Draft',
  'Punch List': 'Identified', 'Deliverable': 'Not Started', 'Risk Action': 'Planned',
};

// Parse a CSV string into rows (array of arrays), handling quoted fields and newlines
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(field); rows.push(row); row = []; field = '';
      } else field += c;
    }
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.some(c => c.trim() !== ''));
}

function normaliseDate(val) {
  if (!val) return '';
  const s = String(val).trim();
  // Excel serial number
  if (/^\d+(\.\d+)?$/.test(s) && parseFloat(s) > 59 && parseFloat(s) < 80000) {
    const serial = parseFloat(s);
    const epoch = new Date(Date.UTC(1899, 11, 30));
    const ms = serial * 86400000;
    const d = new Date(epoch.getTime() + ms);
    return d.toISOString().slice(0, 10);
  }
  // YYYY-MM-DD
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  // DD/MM/YYYY or DD-MM-YYYY
  m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  const d = new Date(s);
  if (!isNaN(d)) return d.toISOString().slice(0, 10);
  return '';
}

function normaliseProgress(val) {
  if (val == null || val === '') return 0;
  const s = String(val).trim();
  if (/%/.test(s)) { const n = parseFloat(s.replace('%', '')); return Math.min(100, Math.max(0, isNaN(n) ? 0 : Math.round(n))); }
  const n = parseFloat(s);
  if (isNaN(n)) return 0;
  return n <= 1 ? Math.round(n * 100) : Math.min(100, Math.round(n));
}

function normaliseBool(val) {
  if (!val) return false;
  const s = String(val).trim().toLowerCase();
  return ['yes', 'y', 'x', 'true', '1', 'blocked', 'on hold'].includes(s);
}

function autoMapHeaders(headers) {
  const mapping = {};
  headers.forEach(h => {
    const norm = h.trim().toLowerCase();
    const target = Object.keys(HEADER_ALIASES).find(k => HEADER_ALIASES[k].includes(norm));
    mapping[h] = target || '';
  });
  return mapping;
}

function normaliseRow(rowObj) {
  const out = { ...rowObj };
  if (out.priority) out.priority = PRIORITY_MAP[String(out.priority).trim().toLowerCase()] || 'P3 - Medium';
  if (out.itemType) {
    const t = String(out.itemType).trim().toLowerCase();
    out.itemType = TYPE_MAP[t] || 'Action';
  } else out.itemType = 'Action';
  if (out.dueDate) out.dueDate = normaliseDate(out.dueDate);
  if (out.progressPct != null) out.progressPct = normaliseProgress(out.progressPct);
  if (out.blocked != null) out.blocked = normaliseBool(out.blocked);
  if (!out.status || !String(out.status).trim()) out.status = DEFAULT_STATUS[out.itemType] || 'To Do';
  return out;
}

const inputStyle = { background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' };

export default function ImportCsvDialog({ open, onClose, projectId, buckets = [], phases = [], nextKey }) {
  const qc = useQueryClient();
  const [step, setStep] = useState(1); // 1=upload, 2=map, 3=preview, 4=result
  const [fileName, setFileName] = useState('');
  const [headers, setHeaders] = useState([]);
  const [rawRows, setRawRows] = useState([]);
  const [mapping, setMapping] = useState({});
  const [result, setResult] = useState(null);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef(null);

  const reset = () => {
    setStep(1); setFileName(''); setHeaders([]); setRawRows([]); setMapping({}); setResult(null); setImporting(false);
  };

  const handleFile = (file) => {
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const rows = parseCSV(text);
      if (rows.length === 0) return;
      const hdrs = rows[0];
      setHeaders(hdrs);
      setMapping(autoMapHeaders(hdrs));
      setRawRows(rows.slice(1));
      setStep(2);
    };
    reader.readAsText(file);
  };

  // Build mapped + normalised preview rows
  const previewRows = rawRows.slice(0, 50).map(r => {
    const obj = {};
    headers.forEach((h, i) => {
      const target = mapping[h];
      if (target) obj[target] = r[i];
    });
    return normaliseRow(obj);
  });

  const handleImport = async () => {
    setImporting(true);
    const errors = [];
    try {
      // Build full mapped + normalised records
      const records = rawRows.map((r, idx) => {
        const obj = {};
        headers.forEach((h, i) => {
          const target = mapping[h];
          if (target) obj[target] = r[i];
        });
        const norm = normaliseRow(obj);
        if (!norm.title || !String(norm.title).trim()) errors.push(`Row ${idx + 2}: missing title — skipped`);
        return norm;
      }).filter(r => r.title && String(r.title).trim());

      // Create missing buckets & phases
      const existingBucketNames = new Set(buckets.map(b => b.bucketName));
      const existingPhaseNames = new Set(phases.map(p => p.phaseName));
      const newBuckets = new Set();
      const newPhases = new Set();
      records.forEach(r => {
        if (r.bucket && !existingBucketNames.has(r.bucket)) newBuckets.add(r.bucket);
        if (r.phase && !existingPhaseNames.has(r.phase)) newPhases.add(r.phase);
      });

      let bucketColorIdx = buckets.length + 1;
      const bucketColors = ['#8b5cf6', '#3b82f6', '#f97316', '#10b981', '#06b6d4', '#1e3a8a', '#ef4444', '#eab308', '#6b7280', '#ec4899'];
      const createdBuckets = [];
      for (const name of newBuckets) {
        const b = await base44.entities.ActionBucket.create({ projectId, bucketName: name, bucketColor: bucketColors[bucketColorIdx++ % bucketColors.length], sortOrder: bucketColorIdx });
        createdBuckets.push(b);
        existingBucketNames.add(name);
      }
      const createdPhases = [];
      for (const name of newPhases) {
        const p = await base44.entities.ActionPhase.create({ projectId, phaseName: name, startDate: new Date().toISOString().slice(0, 10), endDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10), phaseType: 'Custom', status: 'Active' });
        createdPhases.push(p);
        existingPhaseNames.add(name);
      }

      // Generate keys for rows without one, continuing the project's XX-NNN sequence
      const prefix = nextKey?.split('-')[0] || 'PR';
      let keyNum = nextKey ? parseInt(nextKey.split('-')[1] || '0') : 1;
      const existingKeys = new Set();
      const finalRecords = records.map(r => {
        if (!r.itemKey) {
          let candidate;
          do { candidate = `${prefix}-${String(keyNum).padStart(3, '0')}`; keyNum++; } while (existingKeys.has(candidate));
          existingKeys.add(candidate);
          r.itemKey = candidate;
        } else {
          existingKeys.add(r.itemKey);
        }
        return { ...r, projectId, assignee: r.assignee || 'Unassigned' };
      });

      // bulkCreate
      const created = await base44.entities.ActionItem.bulkCreate(finalRecords);

      setResult({
        imported: created.length,
        bucketsCreated: createdBuckets.length,
        phasesCreated: createdPhases.length,
        errors,
      });
      qc.invalidateQueries({ queryKey: ['actionItems', projectId] });
      qc.invalidateQueries({ queryKey: ['actionBuckets', projectId] });
      qc.invalidateQueries({ queryKey: ['actionPhases', projectId] });
      setStep(4);
    } catch (err) {
      setResult({ imported: 0, bucketsCreated: 0, phasesCreated: 0, errors: [err.message] });
      setStep(4);
    }
    setImporting(false);
  };

  const close = () => { reset(); onClose(); };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) close(); }}>
      <DialogContent style={{ background: 'rgba(10,15,40,0.99)', borderColor: 'rgba(202,220,252,0.1)' }} className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle style={{ color: '#CADCFC' }}>Import Action Items from CSV</DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 text-xs mb-4">
          {['Upload', 'Map', 'Preview', 'Result'].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                style={{ background: step > i + 1 ? 'rgba(16,185,129,0.3)' : step === i + 1 ? 'rgba(0,168,150,0.3)' : 'rgba(30,39,97,0.5)', color: step >= i + 1 ? '#00A896' : '#64748b' }}>{i + 1}</span>
              <span style={{ color: step >= i + 1 ? '#CADCFC' : '#64748b' }}>{s}</span>
              {i < 3 && <span style={{ color: '#334155' }}>→</span>}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="text-center py-8">
            <div className="border-2 border-dashed rounded-xl p-10" style={{ borderColor: 'rgba(202,220,252,0.15)' }}>
              <Upload className="w-10 h-10 mx-auto mb-3" style={{ color: '#64748b' }} />
              <p className="text-sm mb-3" style={{ color: '#94A3B8' }}>Drop a CSV file or click to browse</p>
              <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={e => handleFile(e.target.files[0])} />
              <Button onClick={() => fileRef.current?.click()} style={{ background: 'linear-gradient(135deg,#028090,#00A896)', color: '#F8FAFC' }}>Choose CSV file</Button>
              <p className="text-xs mt-3" style={{ color: '#475569' }}>Accepts a plain Excel-exported CSV. First row must be column headers.</p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <p className="text-xs mb-3" style={{ color: '#94A3B8' }}>File: <span style={{ color: '#CADCFC' }}>{fileName}</span> · {rawRows.length} rows. Auto-mapped columns — adjust as needed.</p>
            <div className="rounded-lg overflow-hidden" style={{ border: '1px solid rgba(202,220,252,0.1)' }}>
              <div className="grid grid-cols-2 px-3 py-2 text-[10px] font-semibold" style={{ background: 'rgba(30,39,97,0.6)', color: '#64748b' }}>
                <span>CSV HEADER</span><span>→ ACTION ITEM FIELD</span>
              </div>
              {headers.map(h => (
                <div key={h} className="grid grid-cols-2 gap-2 px-3 py-1.5" style={{ borderTop: '1px solid rgba(202,220,252,0.06)' }}>
                  <span className="text-xs font-mono truncate" style={{ color: '#a5f3fc' }}>{h}</span>
                  <Select value={mapping[h] || ''} onValueChange={v => setMapping(m => ({ ...m, [h]: v }))}>
                    <SelectTrigger className="h-7 text-xs" style={inputStyle}><SelectValue placeholder="— ignore —" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>— ignore —</SelectItem>
                      {TARGET_FIELDS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            <div className="flex justify-between gap-3 pt-4">
              <Button variant="outline" onClick={reset} style={{ borderColor: 'rgba(202,220,252,0.2)', color: '#94A3B8' }}>Back</Button>
              <Button onClick={() => setStep(3)} disabled={!Object.values(mapping).some(v => v)} style={{ background: 'linear-gradient(135deg,#028090,#00A896)', color: '#F8FAFC' }}>Preview</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <p className="text-xs mb-3" style={{ color: '#94A3B8' }}>Preview of first {Math.min(50, rawRows.length)} mapped rows. Values are normalised (priority, type, dates, %, blocked).</p>
            <div className="overflow-x-auto rounded-lg max-h-[50vh] overflow-y-auto" style={{ border: '1px solid rgba(202,220,252,0.1)' }}>
              <table className="w-full text-xs">
                <thead style={{ background: 'rgba(15,23,42,0.8)', position: 'sticky', top: 0 }}>
                  <tr className="text-left" style={{ color: '#94A3B8' }}>
                    {['Key', 'Title', 'Type', 'Priority', 'Status', 'Assignee', 'Due', 'Bucket', 'Phase', '%'].map(t => <th key={t} className="px-2 py-1.5">{t}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((r, i) => (
                    <tr key={i} style={{ color: '#CADCFC', borderTop: '1px solid rgba(202,220,252,0.06)' }}>
                      <td className="px-2 py-1 font-mono">{r.itemKey || <span style={{ color: '#475569' }}>auto</span>}</td>
                      <td className="px-2 py-1 max-w-[200px] truncate">{r.title}</td>
                      <td className="px-2 py-1">{r.itemType}</td>
                      <td className="px-2 py-1">{r.priority}</td>
                      <td className="px-2 py-1">{r.status}</td>
                      <td className="px-2 py-1">{r.assignee || '—'}</td>
                      <td className="px-2 py-1">{r.dueDate || '—'}</td>
                      <td className="px-2 py-1">{r.bucket || '—'}</td>
                      <td className="px-2 py-1">{r.phase || '—'}</td>
                      <td className="px-2 py-1">{r.progressPct || 0}</td>
                    </tr>
                  ))}
                  {previewRows.length === 0 && <tr><td colSpan={10} className="px-2 py-6 text-center" style={{ color: '#64748b' }}>No rows to preview</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between gap-3 pt-4">
              <Button variant="outline" onClick={() => setStep(2)} style={{ borderColor: 'rgba(202,220,252,0.2)', color: '#94A3B8' }}>Back</Button>
              <Button onClick={handleImport} disabled={importing || previewRows.length === 0} style={{ background: 'linear-gradient(135deg,#028090,#00A896)', color: '#F8FAFC' }}>
                {importing ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Importing…</> : `Import ${rawRows.length} rows`}
              </Button>
            </div>
          </div>
        )}

        {step === 4 && result && (
          <div className="py-4">
            <div className="flex items-center gap-3 mb-4">
              {result.errors.length === 0 && result.imported > 0 ? (
                <CheckCircle2 className="w-8 h-8" style={{ color: '#10b981' }} />
              ) : (
                <AlertTriangle className="w-8 h-8" style={{ color: '#f59e0b' }} />
              )}
              <div>
                <div className="text-lg font-semibold" style={{ color: '#CADCFC' }}>Import complete</div>
                <div className="text-xs" style={{ color: '#94A3B8' }}>{result.imported} items imported · {result.bucketsCreated} buckets created · {result.phasesCreated} phases created</div>
              </div>
            </div>
            {result.errors.length > 0 && (
              <div className="rounded-lg p-3 max-h-40 overflow-y-auto text-xs" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
                {result.errors.map((e, i) => <div key={i}>• {e}</div>)}
              </div>
            )}
            <div className="flex justify-end pt-4">
              <Button onClick={close} style={{ background: 'linear-gradient(135deg,#028090,#00A896)', color: '#F8FAFC' }}>Done</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}