import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDown, ChevronRight, Wrench, DollarSign, Calendar } from 'lucide-react';

const REMAINING_YEARS = 10;

function calcApprovalLevel(capex, opexAnnual, accelCost, criticalPath, scheduleDays) {
  const total = Math.abs(capex || 0) + Math.abs(opexAnnual || 0) * REMAINING_YEARS + Math.abs(accelCost || 0);
  let level = 1;
  if (total > 5000000) level = 5;
  else if (total > 1000000) level = 4;
  else if (total > 250000) level = 3;
  else if (total > 50000) level = 2;
  // Escalation
  if (criticalPath && scheduleDays > 30 && level < 2) level = 2;
  return { total, level };
}

const LEVEL_LABELS = {1:'Project Manager', 2:'Project Director', 3:'CFO', 4:'CEO', 5:'Board / Investor'};

export default function ImpactAssessmentPanel({ cr, impact, onSave }) {
  const [open, setOpen] = useState({ tech: true, finance: false, schedule: false });
  const [form, setForm] = useState({
    technicalReviewer: impact?.technicalReviewer || '',
    technicalReviewDate: impact?.technicalReviewDate || '',
    technicalAssessment: impact?.technicalAssessment || '',
    technicalFeasibility: impact?.technicalFeasibility || '',
    technicalRiskLevel: impact?.technicalRiskLevel || '',
    technicalConditions: impact?.technicalConditions || '',
    designReworkRequired: impact?.designReworkRequired || false,
    specificationImpact: impact?.specificationImpact || '',
    qualityImpact: impact?.qualityImpact || '',
    technicalRecommendation: impact?.technicalRecommendation || '',
    technicalSignOff: impact?.technicalSignOff || '',
    financeReviewer: impact?.financeReviewer || '',
    financeReviewDate: impact?.financeReviewDate || '',
    capexImpactUsd: impact?.capexImpactUsd ?? 0,
    opexImpactAnnualUsd: impact?.opexImpactAnnualUsd ?? 0,
    revenueImpactAnnualUsd: impact?.revenueImpactAnnualUsd ?? 0,
    contingencyDrawUsd: impact?.contingencyDrawUsd ?? 0,
    accelerationCostUsd: impact?.accelerationCostUsd ?? 0,
    costBreakdown: impact?.costBreakdown || '',
    fundingSource: impact?.fundingSource || '',
    financeRecommendation: impact?.financeRecommendation || '',
    financeSignOff: impact?.financeSignOff || '',
    scheduleReviewer: impact?.scheduleReviewer || '',
    scheduleReviewDate: impact?.scheduleReviewDate || '',
    scheduleImpactDays: impact?.scheduleImpactDays ?? 0,
    criticalPathAffected: impact?.criticalPathAffected || false,
    milestoneDateChanges: impact?.milestoneDateChanges || '',
    floatConsumedDays: impact?.floatConsumedDays ?? 0,
    accelerationPossible: impact?.accelerationPossible || false,
    scheduleDetail: impact?.scheduleDetail || '',
    scheduleRecommendation: impact?.scheduleRecommendation || '',
    scheduleSignOff: impact?.scheduleSignOff || '',
    crId: cr.id,
  });

  const { total, level } = calcApprovalLevel(form.capexImpactUsd, form.opexImpactAnnualUsd, form.accelerationCostUsd, form.criticalPathAffected, form.scheduleImpactDays);
  const fmtMoney = (v) => v >= 1000000 ? `$${(v/1000000).toFixed(2)}M` : v >= 1000 ? `$${(v/1000).toFixed(0)}K` : `$${v}`;

  const inputStyle = { background: 'rgba(15,23,42,0.7)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' };
  const labelStyle = { color: '#94A3B8' };
  const panelStyle = { background: 'rgba(30,39,97,0.3)', border: '1px solid rgba(202,220,252,0.1)' };

  const section = (key, icon, title, locked, children) => (
    <div className="rounded-xl overflow-hidden" style={panelStyle}>
      <button className="w-full flex items-center gap-3 px-5 py-4" onClick={() => setOpen({...open, [key]: !open[key]})}>
        <span style={{ color: '#00A896' }}>{icon}</span>
        <span className="font-semibold" style={{ color: '#CADCFC' }}>{title}</span>
        {locked && <span className="ml-2 text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(100,116,139,0.3)', color: '#64748B' }}>Locked</span>}
        <span className="ml-auto" style={{ color: '#64748B' }}>{open[key] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}</span>
      </button>
      {open[key] && !locked && <div className="px-5 pb-5 space-y-4">{children}</div>}
    </div>
  );

  const isTechLocked = !['In Technical Review','Technical Review Complete','In Finance Review','Finance Review Complete','In Schedule Review','Schedule Review Complete','Pending Approval','Approved','Approved with Conditions','Implemented','Closed'].includes(cr.status);
  const isFinanceLocked = !['In Finance Review','Finance Review Complete','In Schedule Review','Schedule Review Complete','Pending Approval','Approved','Approved with Conditions','Implemented','Closed'].includes(cr.status);
  const isScheduleLocked = !['In Schedule Review','Schedule Review Complete','Pending Approval','Approved','Approved with Conditions','Implemented','Closed'].includes(cr.status);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold" style={{ color: '#CADCFC' }}>Impact Assessment — {cr.crNumber || cr.title}</h3>
        <Button onClick={() => onSave(form)} style={{ background: 'linear-gradient(135deg, #028090 0%, #00A896 100%)', color: '#F8FAFC' }}>Save Assessment</Button>
      </div>

      {/* Technical */}
      {section('tech', <Wrench className="w-4 h-4" />, '🔧 Technical Review', isTechLocked,
        <>
          <div className="grid grid-cols-2 gap-4">
            <div><Label style={labelStyle}>Reviewer</Label><Input value={form.technicalReviewer} onChange={e=>setForm({...form,technicalReviewer:e.target.value})} style={inputStyle}/></div>
            <div><Label style={labelStyle}>Review Date</Label><Input type="date" value={form.technicalReviewDate} onChange={e=>setForm({...form,technicalReviewDate:e.target.value})} style={inputStyle}/></div>
          </div>
          <div><Label style={labelStyle}>Technical Assessment</Label><Textarea value={form.technicalAssessment} onChange={e=>setForm({...form,technicalAssessment:e.target.value})} rows={3} style={inputStyle}/></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label style={labelStyle}>Feasibility</Label>
              <Select value={form.technicalFeasibility} onValueChange={v=>setForm({...form,technicalFeasibility:v})}>
                <SelectTrigger style={inputStyle}><SelectValue placeholder="Select"/></SelectTrigger>
                <SelectContent>{['Feasible','Feasible with conditions','Not feasible','Needs further study'].map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label style={labelStyle}>Technical Risk</Label>
              <Select value={form.technicalRiskLevel} onValueChange={v=>setForm({...form,technicalRiskLevel:v})}>
                <SelectTrigger style={inputStyle}><SelectValue placeholder="Select"/></SelectTrigger>
                <SelectContent>{['No risk','Low','Medium','High','Critical'].map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div><Label style={labelStyle}>Quality Impact</Label>
            <Select value={form.qualityImpact} onValueChange={v=>setForm({...form,qualityImpact:v})}>
              <SelectTrigger style={inputStyle}><SelectValue placeholder="Select"/></SelectTrigger>
              <SelectContent>{['None','Minor (documentation)','Moderate (process change)','Major (requalification required)'].map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label style={labelStyle}>Conditions / Prerequisites</Label><Textarea value={form.technicalConditions} onChange={e=>setForm({...form,technicalConditions:e.target.value})} rows={2} style={inputStyle}/></div>
          <div><Label style={labelStyle}>Technical Recommendation *</Label>
            <Select value={form.technicalRecommendation} onValueChange={v=>setForm({...form,technicalRecommendation:v})}>
              <SelectTrigger style={inputStyle}><SelectValue placeholder="Select recommendation"/></SelectTrigger>
              <SelectContent>{['Proceed','Proceed with conditions','Do not proceed','Needs more study'].map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label style={labelStyle}>Sign-off (Name + Date)</Label><Input value={form.technicalSignOff} onChange={e=>setForm({...form,technicalSignOff:e.target.value})} placeholder="e.g. John Smith, 2025-01-15" style={inputStyle}/></div>
        </>
      )}

      {/* Finance */}
      {section('finance', <DollarSign className="w-4 h-4" />, '💰 Finance Review', isFinanceLocked,
        <>
          <div className="grid grid-cols-2 gap-4">
            <div><Label style={labelStyle}>Finance Reviewer</Label><Input value={form.financeReviewer} onChange={e=>setForm({...form,financeReviewer:e.target.value})} style={inputStyle}/></div>
            <div><Label style={labelStyle}>Review Date</Label><Input type="date" value={form.financeReviewDate} onChange={e=>setForm({...form,financeReviewDate:e.target.value})} style={inputStyle}/></div>
          </div>
          {/* Financial impact calculator */}
          <div className="rounded-lg p-4 space-y-3" style={{ background: 'rgba(0,168,150,0.05)', border: '1px solid rgba(0,168,150,0.15)' }}>
            <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#00A896' }}>Financial Impact Calculator</div>
            {[
              {label:'CAPEX Impact ($)', key:'capexImpactUsd'},
              {label:'OPEX Impact Annual ($)', key:'opexImpactAnnualUsd'},
              {label:'Revenue Impact Annual ($)', key:'revenueImpactAnnualUsd'},
              {label:'Contingency Draw ($)', key:'contingencyDrawUsd'},
              {label:'Acceleration Cost ($)', key:'accelerationCostUsd'},
            ].map(f => (
              <div key={f.key} className="flex items-center gap-3">
                <Label className="w-48 shrink-0 text-xs" style={labelStyle}>{f.label}</Label>
                <Input type="number" value={form[f.key]} onChange={e=>setForm({...form,[f.key]:parseFloat(e.target.value)||0})} style={inputStyle} className="flex-1"/>
              </div>
            ))}
            <div className="pt-2 border-t" style={{ borderColor: 'rgba(202,220,252,0.1)' }}>
              <div className="flex justify-between text-sm font-bold">
                <span style={{ color: '#CADCFC' }}>TOTAL FINANCIAL IMPACT:</span>
                <span style={{ color: '#F59E0B' }}>{fmtMoney(total)}</span>
              </div>
              <div className="mt-2 px-3 py-2 rounded text-xs font-semibold" style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.2)' }}>
                💰 APPROVAL LEVEL {level}: {LEVEL_LABELS[level]}
              </div>
            </div>
          </div>
          <div><Label style={labelStyle}>Cost Breakdown</Label><Textarea value={form.costBreakdown} onChange={e=>setForm({...form,costBreakdown:e.target.value})} rows={3} placeholder="Detailed line items..." style={inputStyle}/></div>
          <div><Label style={labelStyle}>Funding Source</Label>
            <Select value={form.fundingSource} onValueChange={v=>setForm({...form,fundingSource:v})}>
              <SelectTrigger style={inputStyle}><SelectValue placeholder="Select"/></SelectTrigger>
              <SelectContent>{['Existing Budget','Contingency','Additional Funding Required','Savings Offset','Client Funded'].map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label style={labelStyle}>Finance Recommendation *</Label>
            <Select value={form.financeRecommendation} onValueChange={v=>setForm({...form,financeRecommendation:v})}>
              <SelectTrigger style={inputStyle}><SelectValue placeholder="Select"/></SelectTrigger>
              <SelectContent>{['Acceptable','Acceptable with offsets','Not acceptable','Needs CEO review'].map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label style={labelStyle}>Sign-off (Name + Date)</Label><Input value={form.financeSignOff} onChange={e=>setForm({...form,financeSignOff:e.target.value})} placeholder="e.g. Jane Doe, 2025-01-20" style={inputStyle}/></div>
        </>
      )}

      {/* Schedule */}
      {section('schedule', <Calendar className="w-4 h-4" />, '📅 Schedule Review', isScheduleLocked,
        <>
          <div className="grid grid-cols-2 gap-4">
            <div><Label style={labelStyle}>Schedule Reviewer</Label><Input value={form.scheduleReviewer} onChange={e=>setForm({...form,scheduleReviewer:e.target.value})} style={inputStyle}/></div>
            <div><Label style={labelStyle}>Review Date</Label><Input type="date" value={form.scheduleReviewDate} onChange={e=>setForm({...form,scheduleReviewDate:e.target.value})} style={inputStyle}/></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label style={labelStyle}>Schedule Impact (working days)</Label><Input type="number" value={form.scheduleImpactDays} onChange={e=>setForm({...form,scheduleImpactDays:parseFloat(e.target.value)||0})} style={inputStyle}/></div>
            <div><Label style={labelStyle}>Float Consumed (days)</Label><Input type="number" value={form.floatConsumedDays} onChange={e=>setForm({...form,floatConsumedDays:parseFloat(e.target.value)||0})} style={inputStyle}/></div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.criticalPathAffected} onChange={e=>setForm({...form,criticalPathAffected:e.target.checked})} />
              <span className="text-sm" style={{ color: '#94A3B8' }}>Critical Path Affected</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.accelerationPossible} onChange={e=>setForm({...form,accelerationPossible:e.target.checked})} />
              <span className="text-sm" style={{ color: '#94A3B8' }}>Acceleration Possible</span>
            </label>
          </div>
          {form.criticalPathAffected && form.scheduleImpactDays > 30 && (
            <div className="text-xs px-3 py-2 rounded" style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}>
              ⚠️ Critical path impact {'>'}30 days — escalated to minimum Level 2 approval
            </div>
          )}
          <div><Label style={labelStyle}>Milestone Date Changes</Label><Textarea value={form.milestoneDateChanges} onChange={e=>setForm({...form,milestoneDateChanges:e.target.value})} rows={3} placeholder={'e.g. SOP: Dec 2027 → Feb 2028 (+2 months)'} style={inputStyle}/></div>
          <div><Label style={labelStyle}>Schedule Analysis Detail</Label><Textarea value={form.scheduleDetail} onChange={e=>setForm({...form,scheduleDetail:e.target.value})} rows={3} style={inputStyle}/></div>
          <div><Label style={labelStyle}>Schedule Recommendation *</Label>
            <Select value={form.scheduleRecommendation} onValueChange={v=>setForm({...form,scheduleRecommendation:v})}>
              <SelectTrigger style={inputStyle}><SelectValue placeholder="Select"/></SelectTrigger>
              <SelectContent>{['No schedule impact','Acceptable delay','Recoverable with cost','Critical delay — escalate','Acceleration opportunity'].map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label style={labelStyle}>Sign-off (Name + Date)</Label><Input value={form.scheduleSignOff} onChange={e=>setForm({...form,scheduleSignOff:e.target.value})} placeholder="e.g. Alex Brown, 2025-01-25" style={inputStyle}/></div>
        </>
      )}
    </div>
  );
}