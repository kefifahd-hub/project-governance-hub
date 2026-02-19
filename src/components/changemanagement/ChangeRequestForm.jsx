import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save } from 'lucide-react';

const SUB_CATEGORIES = {
  'Scope': ['Client scope addition','Scope reduction','Scope clarification'],
  'Design / Technical': ['Equipment specification','Process design','Layout change','Material change','Chemistry change'],
  'Cost / Budget': ['CAPEX increase','CAPEX decrease','OPEX change','Contingency draw','Value engineering'],
  'Schedule': ['Acceleration','Delay','Resequencing','Milestone change'],
  'Procurement': ['Supplier change','Price escalation','Lead time change','Specification change'],
  'Quality': ['Standard upgrade','Test requirement change','Yield target change'],
  'Regulatory / Compliance': ['Permit condition','Environmental requirement','Safety requirement'],
  'Other': ['Force majeure','Stakeholder request','Lessons learned'],
};

const MODULES = ['Finance Model','Master Schedule','Site Selection','Feasibility Study','Equipment','Building','Product'];

const STATUS_FLOW = {
  'Draft': ['Submitted', 'Withdrawn'],
  'Submitted': ['In Technical Review', 'Withdrawn'],
  'In Technical Review': ['Technical Review Complete', 'Rejected'],
  'Technical Review Complete': ['In Finance Review'],
  'In Finance Review': ['Finance Review Complete', 'Rejected'],
  'Finance Review Complete': ['In Schedule Review'],
  'In Schedule Review': ['Schedule Review Complete', 'Rejected'],
  'Schedule Review Complete': ['Pending Approval'],
  'Pending Approval': ['Approved', 'Approved with Conditions', 'Rejected', 'On Hold'],
  'Approved': ['Implementation In Progress'],
  'Approved with Conditions': ['Implementation In Progress'],
  'Implementation In Progress': ['Implemented'],
  'Implemented': ['Closed'],
  'On Hold': ['Submitted', 'Withdrawn'],
  'Rejected': ['Draft'],
};

const STATUS_COLORS = {
  'Draft': 'bg-gray-700 text-gray-300',
  'Approved': 'bg-green-900 text-green-300',
  'Rejected': 'bg-red-900 text-red-300',
  'Pending Approval': 'bg-yellow-900 text-yellow-300',
  'Closed': 'bg-green-950 text-green-400',
  'Implemented': 'bg-green-800 text-green-200',
};

export default function ChangeRequestForm({ cr, onSave, onBack, projectId }) {
  const isNew = !cr?.id;
  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    projectId,
    title: cr?.title || '',
    description: cr?.description || '',
    category: cr?.category || '',
    subCategory: cr?.subCategory || '',
    priority: cr?.priority || 'Medium',
    changeType: cr?.changeType || 'Modification',
    origin: cr?.origin || '',
    raisedBy: cr?.raisedBy || '',
    raisedDate: cr?.raisedDate || today,
    requiredByDate: cr?.requiredByDate || '',
    affectedModules: cr?.affectedModules || '',
    affectedWbs: cr?.affectedWbs || '',
    notes: cr?.notes || '',
    status: cr?.status || 'Draft',
  });

  const subCats = SUB_CATEGORIES[form.category] || [];
  const affectedArr = form.affectedModules ? form.affectedModules.split(',').map(s => s.trim()).filter(Boolean) : [];
  const toggleModule = (m) => {
    const arr = affectedArr.includes(m) ? affectedArr.filter(x => x !== m) : [...affectedArr, m];
    setForm({ ...form, affectedModules: arr.join(', ') });
  };

  const nextStatuses = STATUS_FLOW[form.status] || [];

  const statusColor = STATUS_COLORS[form.status] || 'bg-blue-900 text-blue-300';

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" onClick={onBack} style={{ color: '#94A3B8' }}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <h2 className="text-xl font-bold" style={{ color: '#CADCFC' }}>
          {isNew ? 'New Change Request' : cr?.crNumber || 'Change Request'}
        </h2>
        {!isNew && (
          <span className={`px-3 py-1 rounded text-xs font-semibold ${statusColor}`}>{form.status}</span>
        )}
      </div>

      <div className="space-y-6">
        {/* Basic info */}
        <div className="rounded-xl p-5 space-y-4" style={{ background: 'rgba(30,39,97,0.4)', border: '1px solid rgba(202,220,252,0.1)' }}>
          <h3 className="font-semibold text-sm uppercase tracking-wider" style={{ color: '#94A3B8' }}>Change Identification</h3>
          <div>
            <Label style={{ color: '#94A3B8' }}>Title *</Label>
            <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Short descriptive title" style={{ background: 'rgba(15,23,42,0.7)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label style={{ color: '#94A3B8' }}>Category *</Label>
              <Select value={form.category} onValueChange={v => setForm({...form, category: v, subCategory: ''})}>
                <SelectTrigger style={{ background: 'rgba(15,23,42,0.7)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }}><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {Object.keys(SUB_CATEGORIES).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label style={{ color: '#94A3B8' }}>Sub-category</Label>
              <Select value={form.subCategory} onValueChange={v => setForm({...form, subCategory: v})} disabled={!form.category}>
                <SelectTrigger style={{ background: 'rgba(15,23,42,0.7)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }}><SelectValue placeholder="Select sub-category" /></SelectTrigger>
                <SelectContent>
                  {subCats.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          {/* Priority */}
          <div>
            <Label style={{ color: '#94A3B8' }}>Priority *</Label>
            <div className="flex gap-2 mt-1 flex-wrap">
              {[{v:'Critical',e:'🔴'},{v:'High',e:'🟠'},{v:'Medium',e:'🟡'},{v:'Low',e:'🟢'}].map(({v,e}) => (
                <button key={v} onClick={() => setForm({...form, priority: v})}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{
                    background: form.priority === v ? 'rgba(0,168,150,0.3)' : 'rgba(30,39,97,0.5)',
                    border: form.priority === v ? '1px solid #00A896' : '1px solid rgba(202,220,252,0.15)',
                    color: form.priority === v ? '#00A896' : '#94A3B8',
                  }}>{e} {v}</button>
              ))}
            </div>
          </div>
          {/* Change type */}
          <div>
            <Label style={{ color: '#94A3B8' }}>Change Type *</Label>
            <div className="flex gap-2 mt-1 flex-wrap">
              {[{v:'Addition',e:'➕'},{v:'Modification',e:'✏️'},{v:'Deletion',e:'➖'},{v:'Substitution',e:'🔄'}].map(({v,e}) => (
                <button key={v} onClick={() => setForm({...form, changeType: v})}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{
                    background: form.changeType === v ? 'rgba(0,168,150,0.3)' : 'rgba(30,39,97,0.5)',
                    border: form.changeType === v ? '1px solid #00A896' : '1px solid rgba(202,220,252,0.15)',
                    color: form.changeType === v ? '#00A896' : '#94A3B8',
                  }}>{e} {v}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label style={{ color: '#94A3B8' }}>Origin</Label>
              <Select value={form.origin} onValueChange={v => setForm({...form, origin: v})}>
                <SelectTrigger style={{ background: 'rgba(15,23,42,0.7)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }}><SelectValue placeholder="Select origin" /></SelectTrigger>
                <SelectContent>
                  {['Client Request','Design Development','Site Condition','Regulatory Requirement','Value Engineering','Risk Mitigation','Supplier / Vendor','Internal Improvement','Force Majeure'].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label style={{ color: '#94A3B8' }}>Raised By *</Label>
              <Input value={form.raisedBy} onChange={e => setForm({...form, raisedBy: e.target.value})} style={{ background: 'rgba(15,23,42,0.7)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label style={{ color: '#94A3B8' }}>Raised Date</Label>
              <Input type="date" value={form.raisedDate} onChange={e => setForm({...form, raisedDate: e.target.value})} style={{ background: 'rgba(15,23,42,0.7)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }} />
            </div>
            <div>
              <Label style={{ color: '#94A3B8' }}>Required By Date</Label>
              <Input type="date" value={form.requiredByDate} onChange={e => setForm({...form, requiredByDate: e.target.value})} style={{ background: 'rgba(15,23,42,0.7)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }} />
            </div>
          </div>
          <div>
            <Label style={{ color: '#94A3B8' }}>Description</Label>
            <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={4} placeholder="Detailed description of the proposed change..." style={{ background: 'rgba(15,23,42,0.7)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }} />
          </div>
          <div>
            <Label style={{ color: '#94A3B8' }}>Affected Modules</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {MODULES.map(m => (
                <button key={m} onClick={() => toggleModule(m)}
                  className="px-3 py-1 rounded text-xs transition-all"
                  style={{
                    background: affectedArr.includes(m) ? 'rgba(0,168,150,0.25)' : 'rgba(30,39,97,0.5)',
                    border: affectedArr.includes(m) ? '1px solid #00A896' : '1px solid rgba(202,220,252,0.15)',
                    color: affectedArr.includes(m) ? '#00A896' : '#64748B',
                  }}>{m}</button>
              ))}
            </div>
          </div>
          <div>
            <Label style={{ color: '#94A3B8' }}>Affected WBS</Label>
            <Input value={form.affectedWbs} onChange={e => setForm({...form, affectedWbs: e.target.value})} placeholder="e.g. 4.2.3 Phase 2: CSA" style={{ background: 'rgba(15,23,42,0.7)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }} />
          </div>
          <div>
            <Label style={{ color: '#94A3B8' }}>Notes</Label>
            <Textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2} style={{ background: 'rgba(15,23,42,0.7)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }} />
          </div>
        </div>

        {/* Status transition */}
        {!isNew && nextStatuses.length > 0 && (
          <div className="rounded-xl p-5" style={{ background: 'rgba(0,168,150,0.08)', border: '1px solid rgba(0,168,150,0.2)' }}>
            <Label className="mb-2 block" style={{ color: '#00A896' }}>Move to Next Status</Label>
            <div className="flex flex-wrap gap-2">
              {nextStatuses.map(s => (
                <Button key={s} size="sm" onClick={() => setForm({...form, status: s})}
                  variant={form.status === s ? 'default' : 'outline'}
                  style={form.status === s
                    ? { background: '#028090', color: '#fff' }
                    : { borderColor: 'rgba(0,168,150,0.4)', color: '#00A896' }}>
                  {s}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button onClick={() => onSave(form)} style={{ background: 'linear-gradient(135deg, #028090 0%, #00A896 100%)', color: '#F8FAFC' }}>
            <Save className="w-4 h-4 mr-2" /> {isNew ? 'Create Change Request' : 'Save Changes'}
          </Button>
          <Button variant="outline" onClick={onBack} style={{ borderColor: 'rgba(202,220,252,0.3)', color: '#CADCFC' }}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}