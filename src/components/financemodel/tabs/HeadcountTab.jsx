import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Users, Info } from 'lucide-react';
import HelpTooltip from '../HelpTooltip';
import { QUARTERS } from '../calcEngine';

const inputStyle = { background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' };
const labelStyle = { color: '#94A3B8', fontSize: '0.75rem' };

const DEPARTMENTS = ['Manufacturing', 'Engineering', 'Quality', 'Logistics', 'G&A', 'Finance', 'HR', 'IT', 'Sales', 'R&D', 'Management'];

const EMPTY_FORM = {
  department: 'Manufacturing',
  roleTitle: '',
  headcountFte: 1,
  baseSalaryEurPa: 45000,
  shiftAllowancePct: 0,
  socialPensionPct: 23.6,
  annualWageInflationPct: 2.5,
  quarter: 'Q4 2028',
};

export default function HeadcountTab({ modelId, headcountData, onRefresh }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [filterDept, setFilterDept] = useState('All');

  const invalidate = () => { qc.invalidateQueries(['headcountPlan', modelId]); onRefresh?.(); };

  const addMutation = useMutation({
    mutationFn: () => base44.entities.HeadcountPlan.create({ ...form, financeModelId: modelId }),
    onSuccess: () => { invalidate(); setForm({ ...EMPTY_FORM }); }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.HeadcountPlan.update(id, data),
    onSuccess: invalidate
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.HeadcountPlan.delete(id),
    onSuccess: invalidate
  });

  const filtered = filterDept === 'All' ? headcountData : headcountData.filter(h => h.department === filterDept);
  const totalFte = filtered.reduce((s, h) => s + (h.headcountFte || 0), 0);
  const totalAnnualCostMEur = filtered.reduce((s, h) => {
    const base = (h.baseSalaryEurPa || 0) * (1 + (h.shiftAllowancePct || 0) / 100) * (1 + (h.socialPensionPct || 23.6) / 100) * (h.headcountFte || 0);
    return s + base / 1e6;
  }, 0);

  const depts = ['All', ...Array.from(new Set(headcountData.map(h => h.department).filter(Boolean)))];

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          ['Total Roles', headcountData.length, '#CADCFC'],
          ['Total FTE', Math.round(totalFte), '#60A5FA'],
          ['Annual Cost (visible)', `€${totalAnnualCostMEur.toFixed(1)}M`, '#34D399'],
        ].map(([label, val, color]) => (
          <Card key={label} style={{ background: 'rgba(30,39,97,0.4)', borderColor: 'rgba(202,220,252,0.1)' }}>
            <CardContent className="p-4 text-center">
              <div className="text-xl font-bold" style={{ color }}>{val}</div>
              <div className="text-xs mt-1" style={{ color: '#94A3B8' }}>{label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add form */}
      <Card style={{ background: 'rgba(30,39,97,0.4)', borderColor: 'rgba(202,220,252,0.1)' }}>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm" style={{ color: '#CADCFC' }}>Add Headcount Entry</CardTitle>
            <HelpTooltip title="Headcount Plan">
              Define staffing by role and quarter. The model calculates quarterly labour cost including:<br /><br />
              <strong>Base Salary</strong>: annual gross salary in €.<br />
              <strong>Shift Allowance</strong>: % premium for shift workers (e.g. 20%).<br />
              <strong>Social / Pension</strong>: employer social charges + pension (default 23.6% for France).<br />
              <strong>Wage Inflation</strong>: annual % increase in wages (default 2.5%).<br /><br />
              Cost = FTE × Salary × (1 + Shift%) × (1 + Social%) ÷ 4 quarters.
            </HelpTooltip>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label style={labelStyle}>Department</Label>
              <Select value={form.department} onValueChange={v => setForm({ ...form, department: v })}>
                <SelectTrigger style={inputStyle}><SelectValue /></SelectTrigger>
                <SelectContent>{DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label style={labelStyle}>Role / Job Title</Label>
              <Input value={form.roleTitle} onChange={e => setForm({ ...form, roleTitle: e.target.value })} style={inputStyle} placeholder="e.g., Cell Assembly Operator" />
            </div>
            <div>
              <Label style={labelStyle}>Start Quarter</Label>
              <Select value={form.quarter} onValueChange={v => setForm({ ...form, quarter: v })}>
                <SelectTrigger style={inputStyle}><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-48">{QUARTERS.map(q => <SelectItem key={q} value={q}>{q}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-5 gap-3">
            <div>
              <Label style={labelStyle}>FTE Count</Label>
              <Input type="number" step="1" value={form.headcountFte} onChange={e => setForm({ ...form, headcountFte: parseFloat(e.target.value) || 0 })} style={inputStyle} />
            </div>
            <div>
              <Label style={labelStyle}>Base Salary (€/yr)</Label>
              <Input type="number" step="500" value={form.baseSalaryEurPa} onChange={e => setForm({ ...form, baseSalaryEurPa: parseFloat(e.target.value) || 0 })} style={inputStyle} />
            </div>
            <div>
              <Label style={labelStyle}>Shift Allowance %</Label>
              <Input type="number" step="1" value={form.shiftAllowancePct} onChange={e => setForm({ ...form, shiftAllowancePct: parseFloat(e.target.value) || 0 })} style={inputStyle} />
            </div>
            <div>
              <Label style={labelStyle}>Social / Pension %</Label>
              <Input type="number" step="0.1" value={form.socialPensionPct} onChange={e => setForm({ ...form, socialPensionPct: parseFloat(e.target.value) || 0 })} style={inputStyle} />
            </div>
            <div>
              <Label style={labelStyle}>Wage Inflation %/yr</Label>
              <Input type="number" step="0.1" value={form.annualWageInflationPct} onChange={e => setForm({ ...form, annualWageInflationPct: parseFloat(e.target.value) || 0 })} style={inputStyle} />
            </div>
          </div>
          <Button onClick={() => addMutation.mutate()} disabled={!form.roleTitle} style={{ background: 'rgba(0,168,150,0.3)', color: '#00A896', border: '1px solid #00A896' }}>
            <Plus className="w-4 h-4 mr-2" /> Add Role
          </Button>
        </CardContent>
      </Card>

      {/* Filter + table */}
      {headcountData.length > 0 && (
        <Card style={{ background: 'rgba(30,39,97,0.4)', borderColor: 'rgba(202,220,252,0.1)' }}>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm" style={{ color: '#CADCFC' }}>{filtered.length} Roles</CardTitle>
            <Select value={filterDept} onValueChange={setFilterDept}>
              <SelectTrigger style={{ ...inputStyle, width: '160px' }}><SelectValue /></SelectTrigger>
              <SelectContent>{depts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ color: '#64748b', borderBottom: '1px solid rgba(202,220,252,0.08)' }}>
                    {['Dept', 'Role', 'Start', 'FTE', 'Salary €/yr', 'Shift%', 'Social%', 'Cost/yr €M', ''].map(h => (
                      <th key={h} className="px-3 py-2 text-left font-semibold uppercase tracking-wider" style={{ fontSize: '0.65rem', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row, i) => {
                    const annualCost = (row.headcountFte || 0) * (row.baseSalaryEurPa || 0) * (1 + (row.shiftAllowancePct || 0) / 100) * (1 + (row.socialPensionPct || 23.6) / 100) / 1e6;
                    return (
                      <tr key={row.id} style={{ background: i % 2 === 0 ? 'rgba(15,23,42,0.3)' : 'transparent', borderBottom: '1px solid rgba(202,220,252,0.04)' }}>
                        <td className="px-3 py-2" style={{ color: '#94A3B8' }}>{row.department}</td>
                        <td className="px-3 py-2 font-medium" style={{ color: '#CADCFC' }}>{row.roleTitle}</td>
                        <td className="px-3 py-2 font-mono" style={{ color: '#64748b' }}>{row.quarter}</td>
                        <td className="px-3 py-2 font-bold" style={{ color: '#60A5FA' }}>{row.headcountFte}</td>
                        <td className="px-3 py-2" style={{ color: '#CADCFC' }}>€{(row.baseSalaryEurPa || 0).toLocaleString()}</td>
                        <td className="px-3 py-2" style={{ color: '#94A3B8' }}>{row.shiftAllowancePct || 0}%</td>
                        <td className="px-3 py-2" style={{ color: '#94A3B8' }}>{row.socialPensionPct || 23.6}%</td>
                        <td className="px-3 py-2 font-medium" style={{ color: '#34D399' }}>€{annualCost.toFixed(2)}M</td>
                        <td className="px-3 py-2">
                          <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(row.id)} style={{ color: '#EF4444', height: '24px', width: '24px' }}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {headcountData.length === 0 && (
        <div className="flex flex-col items-center py-12 gap-2" style={{ color: '#64748b' }}>
          <Users className="w-8 h-8 opacity-40" />
          <p>No headcount entries yet. Add roles above.</p>
        </div>
      )}
    </div>
  );
}