import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Save, Plus, Trash2 } from 'lucide-react';
import HelpTooltip from '../HelpTooltip';

const inputStyle = { background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' };
const labelStyle = { color: '#94A3B8' };

export default function ModelSetupTab({ model, cells, modelId, projectId, onRefresh }) {
  const qc = useQueryClient();
  const [modelForm, setModelForm] = useState({
    modelName: model?.modelName ?? '',
    version: model?.version ?? 'v11',
    status: model?.status ?? 'Draft',
    currency: model?.currency ?? 'EUR',
    startQuarter: model?.startQuarter ?? 'Q4 2025',
    endYear: model?.endYear ?? 2040,
    notes: model?.notes ?? ''
  });

  const defaultCell = { cellNumber: 'Cell 1', cellName: '', chemistry: 'LMO', cellEnergyWh: 670, energyDensityWhKg: 176.8, ppm: 18, plannedOperatingHoursQtr: 1769.25, availability: 81, initialYield: 95.12, matureYield: 96, yieldMaturityYear: 2031, isActive: true };
  const [newCell, setNewCell] = useState(defaultCell);

  const saveMutation = useMutation({
    mutationFn: () => modelId ? base44.entities.FinanceModel.update(modelId, { ...modelForm, projectId }) : base44.entities.FinanceModel.create({ ...modelForm, projectId }),
    onSuccess: () => { qc.invalidateQueries(['financeModels']); onRefresh?.(); }
  });

  const addCellMutation = useMutation({
    mutationFn: () => base44.entities.CellConfig.create({ ...newCell, financeModelId: modelId }),
    onSuccess: () => { qc.invalidateQueries(['cellConfigs', modelId]); setNewCell(defaultCell); onRefresh?.(); }
  });

  const deleteCellMutation = useMutation({
    mutationFn: (id) => base44.entities.CellConfig.delete(id),
    onSuccess: () => { qc.invalidateQueries(['cellConfigs', modelId]); onRefresh?.(); }
  });

  return (
    <div className="space-y-6">
      <Card style={{ background: 'rgba(30, 39, 97, 0.4)', borderColor: 'rgba(202, 220, 252, 0.1)' }}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle style={{ color: '#CADCFC' }}>Finance Model Configuration</CardTitle>
            <HelpTooltip title="Finance Model Configuration">
              The master record for your financial model. Give it a descriptive name (e.g. "Verkor Base Case R11") and a version number. Use <strong>Start Quarter</strong> to set when the model begins (e.g. Q4 2025) and <strong>End Year</strong> for the horizon (e.g. 2040). The Status tracks approval: Draft → Under Review → Approved.
            </HelpTooltip>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label style={labelStyle}>Model Name</Label><Input value={modelForm.modelName} onChange={e => setModelForm({ ...modelForm, modelName: e.target.value })} style={inputStyle} placeholder="e.g., Verkor Base Case R11" /></div>
            <div><Label style={labelStyle}>Version</Label><Input value={modelForm.version} onChange={e => setModelForm({ ...modelForm, version: e.target.value })} style={inputStyle} placeholder="e.g., v11" /></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><Label style={labelStyle}>Status</Label>
              <Select value={modelForm.status} onValueChange={v => setModelForm({ ...modelForm, status: v })}>
                <SelectTrigger style={inputStyle}><SelectValue /></SelectTrigger>
                <SelectContent>{['Draft','Under Review','Approved','Superseded'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label style={labelStyle}>Currency</Label>
              <Select value={modelForm.currency} onValueChange={v => setModelForm({ ...modelForm, currency: v })}>
                <SelectTrigger style={inputStyle}><SelectValue /></SelectTrigger>
                <SelectContent>{['EUR','USD','GBP'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label style={labelStyle}>End Year</Label><Input type="number" value={modelForm.endYear} onChange={e => setModelForm({ ...modelForm, endYear: parseInt(e.target.value) })} style={inputStyle} /></div>
          </div>
          <div><Label style={labelStyle}>Version Notes</Label><Textarea value={modelForm.notes} onChange={e => setModelForm({ ...modelForm, notes: e.target.value })} style={inputStyle} rows={2} /></div>
          <Button onClick={() => saveMutation.mutate()} style={{ background: 'linear-gradient(135deg, #028090 0%, #00A896 100%)' }}>
            <Save className="w-4 h-4 mr-2" /> Save Model Settings
          </Button>
        </CardContent>
      </Card>

      {modelId && (
        <Card style={{ background: 'rgba(30, 39, 97, 0.4)', borderColor: 'rgba(202, 220, 252, 0.1)' }}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle style={{ color: '#CADCFC' }}>Cell Configurations (up to 3)</CardTitle>
              <HelpTooltip title="Cell Configurations">
                Define up to 3 battery cell chemistries to model in parallel (e.g. LMO, LMNO, NMC).<br /><br />
                <strong>PPM</strong> = parts per minute the line produces.<br />
                <strong>Availability</strong> = planned uptime % (e.g. 81%).<br />
                <strong>Planned Hours/Qtr</strong> = total scheduled operating hours per quarter (e.g. 1769.25 = 48 weeks × 7 days × 21 hrs / 4).<br />
                <strong>Initial Yield</strong> = % of cells passing quality at SOP.<br />
                <strong>Mature Yield</strong> = steady-state yield once line is ramped up.<br /><br />
                Capacity = PPM × 60 × Hours × Availability × Cell Energy (Wh) / 1,000,000,000 → GWh/quarter.
              </HelpTooltip>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {cells.map(cell => (
              <div key={cell.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'rgba(0,168,150,0.1)', border: '1px solid rgba(0,168,150,0.3)' }}>
                <div>
                  <span className="font-medium" style={{ color: '#CADCFC' }}>{cell.cellNumber}: {cell.cellName || cell.chemistry}</span>
                  <div className="flex gap-2 mt-1">
                    <Badge className="bg-blue-900 text-blue-200">{cell.chemistry}</Badge>
                    <Badge className="bg-gray-800 text-gray-300">{cell.cellEnergyWh} Wh</Badge>
                    <Badge className="bg-gray-800 text-gray-300">{cell.ppm} ppm</Badge>
                    <Badge className="bg-gray-800 text-gray-300">{cell.availability}% avail</Badge>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => deleteCellMutation.mutate(cell.id)} style={{ color: '#EF4444' }}><Trash2 className="w-4 h-4" /></Button>
              </div>
            ))}
            {cells.length < 3 && (
              <div className="space-y-3 pt-3" style={{ borderTop: '1px solid rgba(202,220,252,0.1)' }}>
                <p style={{ color: '#94A3B8', fontSize: '0.875rem' }}>Add Cell Configuration</p>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label style={labelStyle}>Cell Number</Label>
                    <Select value={newCell.cellNumber} onValueChange={v => setNewCell({ ...newCell, cellNumber: v })}>
                      <SelectTrigger style={inputStyle}><SelectValue /></SelectTrigger>
                      <SelectContent>{['Cell 1','Cell 2','Cell 3'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label style={labelStyle}>Cell Name</Label><Input value={newCell.cellName} onChange={e => setNewCell({ ...newCell, cellName: e.target.value })} style={inputStyle} placeholder="e.g., LMO (LMOLCSQ176A)" /></div>
                  <div><Label style={labelStyle}>Chemistry</Label>
                    <Select value={newCell.chemistry} onValueChange={v => setNewCell({ ...newCell, chemistry: v })}>
                      <SelectTrigger style={inputStyle}><SelectValue /></SelectTrigger>
                      <SelectContent>{['LMO','LMNO','NMC','LFP','NCA','Sodium-Ion','Solid-State'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {[['cellEnergyWh','Energy (Wh)'],['ppm','PPM'],['availability','Availability %'],['plannedOperatingHoursQtr','Hours/Qtr']].map(([k,l]) => (
                    <div key={k}><Label style={labelStyle}>{l}</Label><Input type="number" value={newCell[k]} onChange={e => setNewCell({ ...newCell, [k]: parseFloat(e.target.value) })} style={inputStyle} /></div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[['initialYield','Initial Yield %'],['matureYield','Mature Yield %'],['yieldMaturityYear','Maturity Year']].map(([k,l]) => (
                    <div key={k}><Label style={labelStyle}>{l}</Label><Input type="number" value={newCell[k]} onChange={e => setNewCell({ ...newCell, [k]: parseFloat(e.target.value) })} style={inputStyle} /></div>
                  ))}
                </div>
                <Button onClick={() => addCellMutation.mutate()} style={{ background: 'rgba(0,168,150,0.3)', color: '#00A896', border: '1px solid #00A896' }}>
                  <Plus className="w-4 h-4 mr-2" /> Add Cell
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}