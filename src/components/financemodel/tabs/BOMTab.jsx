import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Save, Info } from 'lucide-react';
import HelpTooltip from '../HelpTooltip';

const inputStyle = { background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' };
const labelStyle = { color: '#94A3B8', fontSize: '0.75rem' };

const CELL_NUMBERS = ['Cell 1', 'Cell 2', 'Cell 3'];

const EMPTY_BOM = {
  totalBomEurKwh: 62,
  cathodeEurKwh: 28,
  anodeEurKwh: 8,
  electrolyteEurKwh: 5,
  separatorEurKwh: 3,
  canCasingEurKwh: 4,
  bmsEurKwh: 3,
  otherMaterialsEurKwh: 11,
  priceChangePctPerQtr: -0.5,
};

export default function BOMTab({ modelId, cells, bomData, onRefresh }) {
  const qc = useQueryClient();
  const [selectedCell, setSelectedCell] = useState('Cell 1');

  const activeCells = cells.length > 0 ? cells.map(c => c.cellNumber) : CELL_NUMBERS;
  const existing = bomData.find(b => b.cellNumber === selectedCell);

  const [form, setForm] = useState(existing ?? { ...EMPTY_BOM });

  const invalidate = () => { qc.invalidateQueries(['bomAssumptions', modelId]); onRefresh?.(); };

  const saveMutation = useMutation({
    mutationFn: () => existing?.id
      ? base44.entities.BOMAssumptions.update(existing.id, { ...form })
      : base44.entities.BOMAssumptions.create({ ...form, cellNumber: selectedCell, financeModelId: modelId }),
    onSuccess: invalidate
  });

  // Sync form when switching cells
  const handleCellSwitch = (cn) => {
    setSelectedCell(cn);
    const found = bomData.find(b => b.cellNumber === cn);
    setForm(found ?? { ...EMPTY_BOM });
  };

  const totalComponents = (form.cathodeEurKwh || 0) + (form.anodeEurKwh || 0) + (form.electrolyteEurKwh || 0) + (form.separatorEurKwh || 0) + (form.canCasingEurKwh || 0) + (form.bmsEurKwh || 0) + (form.otherMaterialsEurKwh || 0);
  const diff = (form.totalBomEurKwh || 0) - totalComponents;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <span style={{ color: '#94A3B8', fontSize: '0.875rem' }}>Select Cell:</span>
        {activeCells.map(cn => (
          <button
            key={cn}
            onClick={() => handleCellSwitch(cn)}
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

      <Card style={{ background: 'rgba(30,39,97,0.4)', borderColor: 'rgba(202,220,252,0.1)' }}>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm" style={{ color: '#CADCFC' }}>Bill of Materials — {selectedCell}</CardTitle>
            <HelpTooltip title="BOM Assumptions">
              The Bill of Materials defines the raw material cost per kWh of battery produced.<br /><br />
              <strong>Total BOM (€/kWh)</strong>: overall blended cost, e.g. €62/kWh.<br />
              Break it down by component for transparency. If components don't sum to total, an "Other" gap is noted.<br /><br />
              <strong>Price Change %/qtr</strong>: quarterly cost reduction (learning curve + supply chain improvement), e.g. -0.5% per quarter.
            </HelpTooltip>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label style={labelStyle}>Total BOM (€/kWh)</Label>
              <Input type="number" step="0.1" value={form.totalBomEurKwh ?? ''} onChange={e => setForm({ ...form, totalBomEurKwh: parseFloat(e.target.value) || 0 })} style={inputStyle} />
            </div>
            <div>
              <Label style={labelStyle}>Price Change per Quarter (%)</Label>
              <Input type="number" step="0.01" value={form.priceChangePctPerQtr ?? ''} onChange={e => setForm({ ...form, priceChangePctPerQtr: parseFloat(e.target.value) || 0 })} style={inputStyle} placeholder="e.g., -0.5" />
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(202,220,252,0.08)', paddingTop: '12px' }}>
            <p className="text-xs mb-3" style={{ color: '#94A3B8' }}>Component Breakdown (€/kWh)</p>
            <div className="grid grid-cols-4 gap-3">
              {[
                ['cathodeEurKwh', 'Cathode'],
                ['anodeEurKwh', 'Anode'],
                ['electrolyteEurKwh', 'Electrolyte'],
                ['separatorEurKwh', 'Separator'],
                ['canCasingEurKwh', 'Can / Casing'],
                ['bmsEurKwh', 'BMS / Electronics'],
                ['otherMaterialsEurKwh', 'Other Materials'],
              ].map(([key, label]) => (
                <div key={key}>
                  <Label style={labelStyle}>{label}</Label>
                  <Input
                    type="number" step="0.1"
                    value={form[key] ?? ''}
                    onChange={e => setForm({ ...form, [key]: parseFloat(e.target.value) || 0 })}
                    style={inputStyle}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Summary bar */}
          <div className="flex items-center gap-4 p-3 rounded-lg" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(202,220,252,0.08)' }}>
            <div>
              <div className="text-xs" style={{ color: '#64748b' }}>Components Sum</div>
              <div className="font-bold" style={{ color: '#CADCFC' }}>€{totalComponents.toFixed(1)}/kWh</div>
            </div>
            <div>
              <div className="text-xs" style={{ color: '#64748b' }}>Total BOM</div>
              <div className="font-bold" style={{ color: '#CADCFC' }}>€{(form.totalBomEurKwh || 0).toFixed(1)}/kWh</div>
            </div>
            <div>
              <div className="text-xs" style={{ color: '#64748b' }}>Unallocated</div>
              <div className="font-bold" style={{ color: Math.abs(diff) < 0.1 ? '#34D399' : '#f59e0b' }}>€{diff.toFixed(1)}/kWh</div>
            </div>
          </div>

          <Button onClick={() => saveMutation.mutate()} style={{ background: 'rgba(0,168,150,0.3)', color: '#00A896', border: '1px solid #00A896' }}>
            <Save className="w-4 h-4 mr-2" /> Save BOM
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}