import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Trash2, Plus } from 'lucide-react';
import HelpTooltip from '../HelpTooltip';
import { QUARTERS } from '../calcEngine';

const inputStyle = { background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' };
const labelStyle = { color: '#94A3B8' };
const COST_TYPES = ['Indirects','Engineering','Commissioning','Site Establishment','CSA','MEP','Clean Room','Fitout','Central Utilities','Construction Indirects','Utility Equipment','Manufacturing','Land','Capital Spares','Escalation','Contingency'];

export default function CapexTab({ capexItems, modelId, onRefresh }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ category: 'Buildings', subCategory: '', costType: 'CSA', quarter: 'Q4 2025', amountMEur: '' });

  const addMutation = useMutation({
    mutationFn: () => base44.entities.CapexPlan.create({ ...form, amountMEur: parseFloat(form.amountMEur) || 0, financeModelId: modelId }),
    onSuccess: () => { qc.invalidateQueries(['capexPlan', modelId]); setForm({ ...form, amountMEur: '' }); onRefresh?.(); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CapexPlan.delete(id),
    onSuccess: () => { qc.invalidateQueries(['capexPlan', modelId]); onRefresh?.(); }
  });

  // Group by category for display
  const byCategory = capexItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const totalCapex = capexItems.reduce((s, i) => s + (i.amountMEur ?? 0), 0);
  const buildingsTotal = capexItems.filter(i => i.category === 'Buildings').reduce((s, i) => s + (i.amountMEur ?? 0), 0);
  const equipmentTotal = capexItems.filter(i => i.category === 'Equipment').reduce((s, i) => s + (i.amountMEur ?? 0), 0);
  const landTotal = capexItems.filter(i => i.category === 'Land').reduce((s, i) => s + (i.amountMEur ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        {[['Total CAPEX', `€${totalCapex.toFixed(1)}M`, '#CADCFC'], ['Buildings', `€${buildingsTotal.toFixed(1)}M`, '#60A5FA'], ['Equipment', `€${equipmentTotal.toFixed(1)}M`, '#34D399'], ['Land', `€${landTotal.toFixed(1)}M`, '#FBBF24']].map(([label, val, color]) => (
          <Card key={label} style={{ background: 'rgba(30,39,97,0.4)', borderColor: 'rgba(202,220,252,0.1)' }}>
            <CardContent className="p-4 text-center">
              <div className="text-xl font-bold" style={{ color }}>{val}</div>
              <div className="text-xs mt-1" style={{ color: '#94A3B8' }}>{label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card style={{ background: 'rgba(30,39,97,0.4)', borderColor: 'rgba(202,220,252,0.1)' }}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle style={{ color: '#CADCFC' }}>Add CAPEX Item</CardTitle>
            <HelpTooltip title="CAPEX Plan">
              Log all capital expenditure by category and quarter.<br /><br />
              <strong>Categories:</strong><br />
              • <strong>Buildings</strong> (~€255M): CSA, MEP, Clean Room, Fitout, etc.<br />
              • <strong>Equipment</strong> (~€80M): Manufacturing lines, Capital Spares.<br />
              • <strong>Land</strong> (~€20M): Site acquisition. Note: land is NOT depreciated.<br /><br />
              <strong>Escalation</strong> adds 3% annual inflation on construction costs.<br />
              <strong>Contingency</strong> is typically 20% of base CAPEX.<br /><br />
              Total CAPEX target from R11 model: <strong>€382.3M</strong>. Depreciation starts at SOP (Q4 2028) over 10 years straight-line.
            </HelpTooltip>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-3">
            <div><Label style={labelStyle}>Category</Label>
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger style={inputStyle}><SelectValue /></SelectTrigger>
                <SelectContent>{['Buildings','Equipment','Land'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label style={labelStyle}>Sub-Category</Label><Input value={form.subCategory} onChange={e => setForm({ ...form, subCategory: e.target.value })} style={inputStyle} placeholder="e.g., MEP" /></div>
            <div><Label style={labelStyle}>Cost Type</Label>
              <Select value={form.costType} onValueChange={v => setForm({ ...form, costType: v })}>
                <SelectTrigger style={inputStyle}><SelectValue /></SelectTrigger>
                <SelectContent>{COST_TYPES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label style={labelStyle}>Quarter</Label>
              <Select value={form.quarter} onValueChange={v => setForm({ ...form, quarter: v })}>
                <SelectTrigger style={inputStyle}><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-48">{QUARTERS.map(q => <SelectItem key={q} value={q}>{q}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label style={labelStyle}>Amount (€M)</Label><Input type="number" value={form.amountMEur} onChange={e => setForm({ ...form, amountMEur: e.target.value })} style={inputStyle} placeholder="0.0" /></div>
          </div>
          <Button className="mt-3" onClick={() => addMutation.mutate()} style={{ background: 'rgba(0,168,150,0.3)', color: '#00A896', border: '1px solid #00A896' }}>
            <Plus className="w-4 h-4 mr-2" /> Add Item
          </Button>
        </CardContent>
      </Card>

      {Object.entries(byCategory).map(([cat, items]) => (
        <Card key={cat} style={{ background: 'rgba(30,39,97,0.4)', borderColor: 'rgba(202,220,252,0.1)' }}>
          <CardHeader className="pb-2"><CardTitle className="text-sm" style={{ color: '#CADCFC' }}>{cat} — €{items.reduce((s, i) => s + (i.amountMEur ?? 0), 0).toFixed(1)}M</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr style={{ color: '#94A3B8' }}><th className="text-left p-2">Sub-Category</th><th className="text-left p-2">Cost Type</th><th className="text-left p-2">Quarter</th><th className="text-right p-2">Amount (€M)</th><th className="p-2"></th></tr></thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id} style={{ borderTop: '1px solid rgba(202,220,252,0.05)' }}>
                      <td className="p-2" style={{ color: '#CADCFC' }}>{item.subCategory || '-'}</td>
                      <td className="p-2" style={{ color: '#CADCFC' }}>{item.costType}</td>
                      <td className="p-2" style={{ color: '#94A3B8' }}>{item.quarter}</td>
                      <td className="p-2 text-right" style={{ color: '#34D399' }}>€{(item.amountMEur ?? 0).toFixed(2)}M</td>
                      <td className="p-2"><Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(item.id)} style={{ color: '#EF4444' }}><Trash2 className="w-3 h-3" /></Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}