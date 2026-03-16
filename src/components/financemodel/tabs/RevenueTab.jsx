import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Save, Plus, Trash2, Info } from 'lucide-react';
import { QUARTERS } from '../calcEngine';
import HelpTooltip from '../HelpTooltip';

const inputStyle = { background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' };
const labelStyle = { color: '#94A3B8', fontSize: '0.75rem' };

const CELL_NUMBERS = ['Cell 1', 'Cell 2', 'Cell 3'];

export default function RevenueTab({ modelId, cells, revenueData, onRefresh }) {
  const qc = useQueryClient();
  const [selectedCell, setSelectedCell] = useState('Cell 1');
  const [form, setForm] = useState({ quarter: 'Q4 2028', sellingPriceEurKwh: 0.09, priceChangePct: 0, rampPct: 20, yieldPct: 95 });

  const invalidate = () => { qc.invalidateQueries(['revenueAssumptions', modelId]); onRefresh?.(); };

  const addMutation = useMutation({
    mutationFn: () => base44.entities.RevenueAssumptions.create({ ...form, cellNumber: selectedCell, financeModelId: modelId }),
    onSuccess: () => { invalidate(); }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.RevenueAssumptions.update(id, data),
    onSuccess: invalidate
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.RevenueAssumptions.delete(id),
    onSuccess: invalidate
  });

  const cellRevData = revenueData.filter(r => r.cellNumber === selectedCell)
    .sort((a, b) => QUARTERS.indexOf(a.quarter) - QUARTERS.indexOf(b.quarter));

  const activeCells = cells.length > 0 ? cells.map(c => c.cellNumber) : CELL_NUMBERS;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <span style={{ color: '#94A3B8', fontSize: '0.875rem' }}>Select Cell:</span>
        {activeCells.map(cn => (
          <button
            key={cn}
            onClick={() => setSelectedCell(cn)}
            className="px-3 py-1 rounded-lg text-sm font-medium transition-all"
            style={{
              background: selectedCell === cn ? 'rgba(0,168,150,0.25)' : 'rgba(30,39,97,0.5)',
              color: selectedCell === cn ? '#00A896' : '#94A3B8',
              border: `1px solid ${selectedCell === cn ? '#00A896' : 'rgba(202,220,252,0.15)'}`
            }}
          >
            {cn}
          </button>
        ))}
      </div>

      {/* Add new entry */}
      <Card style={{ background: 'rgba(30,39,97,0.4)', borderColor: 'rgba(202,220,252,0.1)' }}>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm" style={{ color: '#CADCFC' }}>Add Revenue Entry — {selectedCell}</CardTitle>
            <HelpTooltip title="Revenue & Production Assumptions">
              Define selling price, ramp %, and yield per quarter for each cell.<br /><br />
              <strong>Ramp %</strong>: % of full capacity being produced. Starts low at SOP (e.g. 20%) and grows to 100%.<br />
              <strong>Selling Price (€/kWh)</strong>: e.g. 0.09 = 90 €/MWh.<br />
              <strong>Yield %</strong>: % of produced cells that pass quality. Matures over time.<br />
              <strong>Price Change %</strong>: quarter-over-quarter price movement (usually negative as battery prices fall).
            </HelpTooltip>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-3">
            <div>
              <Label style={labelStyle}>Quarter</Label>
              <Select value={form.quarter} onValueChange={v => setForm({ ...form, quarter: v })}>
                <SelectTrigger style={inputStyle}><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-48">{QUARTERS.map(q => <SelectItem key={q} value={q}>{q}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label style={labelStyle}>Selling Price (€/kWh)</Label>
              <Input type="number" step="0.001" value={form.sellingPriceEurKwh} onChange={e => setForm({ ...form, sellingPriceEurKwh: parseFloat(e.target.value) || 0 })} style={inputStyle} />
            </div>
            <div>
              <Label style={labelStyle}>Price Change %</Label>
              <Input type="number" step="0.1" value={form.priceChangePct} onChange={e => setForm({ ...form, priceChangePct: parseFloat(e.target.value) || 0 })} style={inputStyle} />
            </div>
            <div>
              <Label style={labelStyle}>Ramp %</Label>
              <Input type="number" step="1" value={form.rampPct} onChange={e => setForm({ ...form, rampPct: parseFloat(e.target.value) || 0 })} style={inputStyle} />
            </div>
            <div>
              <Label style={labelStyle}>Yield %</Label>
              <Input type="number" step="0.1" value={form.yieldPct} onChange={e => setForm({ ...form, yieldPct: parseFloat(e.target.value) || 0 })} style={inputStyle} />
            </div>
          </div>
          <Button className="mt-3" onClick={() => addMutation.mutate()} style={{ background: 'rgba(0,168,150,0.3)', color: '#00A896', border: '1px solid #00A896' }}>
            <Plus className="w-4 h-4 mr-2" /> Add Entry
          </Button>
        </CardContent>
      </Card>

      {/* Existing entries table */}
      {cellRevData.length > 0 && (
        <Card style={{ background: 'rgba(30,39,97,0.4)', borderColor: 'rgba(202,220,252,0.1)' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm" style={{ color: '#CADCFC' }}>{selectedCell} — {cellRevData.length} entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ color: '#64748b', borderBottom: '1px solid rgba(202,220,252,0.08)' }}>
                    {['Quarter', 'Price (€/kWh)', 'Price Chg %', 'Ramp %', 'Yield %', ''].map(h => (
                      <th key={h} className="px-3 py-2 text-left font-semibold uppercase tracking-wider" style={{ fontSize: '0.65rem' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cellRevData.map((row, i) => (
                    <tr key={row.id} style={{ background: i % 2 === 0 ? 'rgba(15,23,42,0.3)' : 'transparent', borderBottom: '1px solid rgba(202,220,252,0.04)' }}>
                      <td className="px-3 py-2 font-mono" style={{ color: '#CADCFC' }}>{row.quarter}</td>
                      <td className="px-3 py-2">
                        <Input
                          type="number" step="0.001" defaultValue={row.sellingPriceEurKwh}
                          onBlur={e => updateMutation.mutate({ id: row.id, data: { sellingPriceEurKwh: parseFloat(e.target.value) || 0 } })}
                          style={{ ...inputStyle, width: '80px', padding: '2px 6px', height: '26px', fontSize: '0.75rem' }}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          type="number" step="0.1" defaultValue={row.priceChangePct}
                          onBlur={e => updateMutation.mutate({ id: row.id, data: { priceChangePct: parseFloat(e.target.value) || 0 } })}
                          style={{ ...inputStyle, width: '70px', padding: '2px 6px', height: '26px', fontSize: '0.75rem' }}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          type="number" step="1" defaultValue={row.rampPct}
                          onBlur={e => updateMutation.mutate({ id: row.id, data: { rampPct: parseFloat(e.target.value) || 0 } })}
                          style={{ ...inputStyle, width: '70px', padding: '2px 6px', height: '26px', fontSize: '0.75rem' }}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          type="number" step="0.1" defaultValue={row.yieldPct}
                          onBlur={e => updateMutation.mutate({ id: row.id, data: { yieldPct: parseFloat(e.target.value) || 0 } })}
                          style={{ ...inputStyle, width: '70px', padding: '2px 6px', height: '26px', fontSize: '0.75rem' }}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(row.id)} style={{ color: '#EF4444', height: '24px', width: '24px' }}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs" style={{ color: '#64748b' }}>
              💡 Click any cell to edit inline. The model interpolates missing quarters from the nearest available entry.
            </p>
          </CardContent>
        </Card>
      )}

      {cellRevData.length === 0 && (
        <div className="flex flex-col items-center py-12 gap-2" style={{ color: '#64748b' }}>
          <Info className="w-8 h-8 opacity-40" />
          <p>No revenue entries for {selectedCell} yet. Add entries above starting from SOP (Q4 2028).</p>
        </div>
      )}
    </div>
  );
}