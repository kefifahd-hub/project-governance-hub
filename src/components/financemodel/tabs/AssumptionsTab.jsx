import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Save, Plus, Trash2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

const inputStyle = { background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' };
const labelStyle = { color: '#94A3B8', fontSize: '0.75rem' };

function Section({ title, children }) {
  return (
    <Card style={{ background: 'rgba(30,39,97,0.4)', borderColor: 'rgba(202,220,252,0.1)' }}>
      <CardHeader className="pb-2"><CardTitle className="text-sm" style={{ color: '#CADCFC' }}>{title}</CardTitle></CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function NumberField({ label, value, onChange, placeholder, suffix }) {
  return (
    <div>
      <Label style={labelStyle}>{label}{suffix ? ` (${suffix})` : ''}</Label>
      <Input type="number" step="any" value={value ?? ''} onChange={e => onChange(parseFloat(e.target.value) || 0)} style={inputStyle} placeholder={placeholder} />
    </div>
  );
}

export default function AssumptionsTab({ modelId, utilAssumptions, taxAssumptions, wcAssumptions, dcfAssumptions, otherOpex, financingAssumptions, grants, overheads, onRefresh }) {
  const qc = useQueryClient();
  const invalidate = () => { ['utilAssumptions','taxAssumptions','wcAssumptions','dcfAssumptions','otherOpex','financingAssumptions','grants','overheads'].forEach(k => qc.invalidateQueries([k, modelId])); onRefresh?.(); };

  const [utils, setUtils] = useState(utilAssumptions ?? { electricityGwhPerGwh: 18, electricityCostEurMwh: 111.2, gasGwhPerGwh: 15, gasCostEurMwh: 55, waterM3PerGwh: 200, waterCostEurM3: 1.15, waterFixedFeeEurMonth: 500, wastewaterM3PerGwh: 170, wastewaterCostEurM3: 1.35 });
  const [tax, setTax] = useState(taxAssumptions ?? { corporateTaxRatePct: 25, lossCarryForward: true });
  const [wc, setWc] = useState(wcAssumptions ?? { arPaymentTermsDays: 30, apPaymentTermsDays: 45, inventoryDays: 69 });
  const [dcf, setDcf] = useState(dcfAssumptions ?? { valuationYear: 2026, discountRatePct: 18, terminalGrowthRatePct: 1.5 });
  const [opex, setOpex] = useState(otherOpex ?? { outboundLogisticsPctRevenue: 1, royaltyPctRevenue: 3, warrantyPctRevenue: 2, rdPctRevenue: 0 });
  const [fin, setFin] = useState(financingAssumptions ?? { ltDebtTotalMEur: 150, ltInterestRatePct: 8, ltDrawdownPeriodQtrs: 15, ltRepaymentPeriodQtrs: 24, wcInterestRatePct: 8, wcPctFundedByDebt: 100, equityInjections: '[{"quarter":"Q1 2026","amount":1.5},{"quarter":"Q2 2026","amount":1.25},{"quarter":"Q3 2026","amount":25},{"quarter":"Q1 2027","amount":125}]' });
  const [newGrant, setNewGrant] = useState({ grantName: '', cashReceiptMEur: 150, receiptQuarter: 'Q1 2027', amortizationStartQuarter: 'Q4 2028', amortizationYears: 10 });
  const [newOverhead, setNewOverhead] = useState({ category: 'Operational', lineItem: '', costBasis: 'Per Quarter (fixed)', amount: 0 });

  const saveMutation = (entity, data, existingId) => base44.entities[entity][existingId ? 'update' : 'create'](existingId || { ...data, financeModelId: modelId }, existingId ? data : undefined);

  const saveUtils = useMutation({ mutationFn: () => utilAssumptions?.id ? base44.entities.UtilityAssumptions.update(utilAssumptions.id, utils) : base44.entities.UtilityAssumptions.create({ ...utils, financeModelId: modelId }), onSuccess: invalidate });
  const saveTax = useMutation({ mutationFn: () => taxAssumptions?.id ? base44.entities.TaxAssumptions.update(taxAssumptions.id, tax) : base44.entities.TaxAssumptions.create({ ...tax, financeModelId: modelId }), onSuccess: invalidate });
  const saveWc = useMutation({ mutationFn: () => wcAssumptions?.id ? base44.entities.WorkingCapitalAssumptions.update(wcAssumptions.id, wc) : base44.entities.WorkingCapitalAssumptions.create({ ...wc, financeModelId: modelId }), onSuccess: invalidate });
  const saveDcf = useMutation({ mutationFn: () => dcfAssumptions?.id ? base44.entities.DCFAssumptions.update(dcfAssumptions.id, dcf) : base44.entities.DCFAssumptions.create({ ...dcf, financeModelId: modelId }), onSuccess: invalidate });
  const saveOpex = useMutation({ mutationFn: () => otherOpex?.id ? base44.entities.OtherOpexAssumptions.update(otherOpex.id, opex) : base44.entities.OtherOpexAssumptions.create({ ...opex, financeModelId: modelId }), onSuccess: invalidate });
  const saveFin = useMutation({ mutationFn: () => financingAssumptions?.id ? base44.entities.FinancingAssumptions.update(financingAssumptions.id, fin) : base44.entities.FinancingAssumptions.create({ ...fin, financeModelId: modelId }), onSuccess: invalidate });
  const addGrant = useMutation({ mutationFn: () => base44.entities.GrantAssumptions.create({ ...newGrant, financeModelId: modelId }), onSuccess: invalidate });
  const deleteGrant = useMutation({ mutationFn: (id) => base44.entities.GrantAssumptions.delete(id), onSuccess: invalidate });
  const addOverhead = useMutation({ mutationFn: () => base44.entities.OverheadAssumptions.create({ ...newOverhead, financeModelId: modelId }), onSuccess: invalidate });
  const deleteOverhead = useMutation({ mutationFn: (id) => base44.entities.OverheadAssumptions.delete(id), onSuccess: invalidate });

  return (
    <div className="space-y-4">
      {/* Utilities */}
      <Section title="Utility Assumptions">
        <div className="grid grid-cols-3 gap-3">
          <NumberField label="Electricity (GWh/GWh)" value={utils.electricityGwhPerGwh} onChange={v => setUtils({ ...utils, electricityGwhPerGwh: v })} />
          <NumberField label="Electricity Cost" value={utils.electricityCostEurMwh} onChange={v => setUtils({ ...utils, electricityCostEurMwh: v })} suffix="€/MWh" />
          <NumberField label="Gas (GWh/GWh)" value={utils.gasGwhPerGwh} onChange={v => setUtils({ ...utils, gasGwhPerGwh: v })} />
          <NumberField label="Gas Cost" value={utils.gasCostEurMwh} onChange={v => setUtils({ ...utils, gasCostEurMwh: v })} suffix="€/MWh" />
          <NumberField label="Water (m³/GWh)" value={utils.waterM3PerGwh} onChange={v => setUtils({ ...utils, waterM3PerGwh: v })} />
          <NumberField label="Water Cost" value={utils.waterCostEurM3} onChange={v => setUtils({ ...utils, waterCostEurM3: v })} suffix="€/m³" />
        </div>
        <Button className="mt-3" onClick={() => saveUtils.mutate()} style={{ background: 'rgba(0,168,150,0.3)', color: '#00A896', border: '1px solid #00A896' }}><Save className="w-4 h-4 mr-2" /> Save</Button>
      </Section>

      {/* Overheads */}
      <Section title="Overhead Assumptions">
        <div className="space-y-2 mb-3">
          {overheads.map(oh => (
            <div key={oh.id} className="flex items-center justify-between p-2 rounded" style={{ background: 'rgba(30,39,97,0.3)' }}>
              <span style={{ color: '#CADCFC', fontSize: '0.875rem' }}>[{oh.category}] {oh.lineItem} — {oh.costBasis === 'Per Quarter (fixed)' ? `€${(oh.amount / 1e6).toFixed(2)}M/qtr` : `€${oh.amount}/GWh`}</span>
              <Button variant="ghost" size="icon" onClick={() => deleteOverhead.mutate(oh.id)} style={{ color: '#EF4444' }}><Trash2 className="w-3 h-3" /></Button>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-3">
          <div><Label style={labelStyle}>Category</Label>
            <Select value={newOverhead.category} onValueChange={v => setNewOverhead({ ...newOverhead, category: v })}>
              <SelectTrigger style={inputStyle}><SelectValue /></SelectTrigger>
              <SelectContent>{['Operational','G&A','Launch'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label style={labelStyle}>Line Item</Label><Input value={newOverhead.lineItem} onChange={e => setNewOverhead({ ...newOverhead, lineItem: e.target.value })} style={inputStyle} placeholder="e.g., Rent" /></div>
          <div><Label style={labelStyle}>Cost Basis</Label>
            <Select value={newOverhead.costBasis} onValueChange={v => setNewOverhead({ ...newOverhead, costBasis: v })}>
              <SelectTrigger style={inputStyle}><SelectValue /></SelectTrigger>
              <SelectContent>{['Per Quarter (fixed)','Per GWh (variable)','% Revenue'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label style={labelStyle}>Amount</Label><Input type="number" value={newOverhead.amount} onChange={e => setNewOverhead({ ...newOverhead, amount: parseFloat(e.target.value) })} style={inputStyle} /></div>
        </div>
        <Button className="mt-3" onClick={() => addOverhead.mutate()} style={{ background: 'rgba(0,168,150,0.3)', color: '#00A896', border: '1px solid #00A896' }}><Plus className="w-4 h-4 mr-2" /> Add Overhead</Button>
      </Section>

      {/* Other OPEX */}
      <Section title="Other OPEX (% of Revenue)">
        <div className="grid grid-cols-4 gap-3">
          <NumberField label="Outbound Logistics %" value={opex.outboundLogisticsPctRevenue} onChange={v => setOpex({ ...opex, outboundLogisticsPctRevenue: v })} />
          <NumberField label="Royalty %" value={opex.royaltyPctRevenue} onChange={v => setOpex({ ...opex, royaltyPctRevenue: v })} />
          <NumberField label="Warranty %" value={opex.warrantyPctRevenue} onChange={v => setOpex({ ...opex, warrantyPctRevenue: v })} />
          <NumberField label="R&D %" value={opex.rdPctRevenue} onChange={v => setOpex({ ...opex, rdPctRevenue: v })} />
        </div>
        <Button className="mt-3" onClick={() => saveOpex.mutate()} style={{ background: 'rgba(0,168,150,0.3)', color: '#00A896', border: '1px solid #00A896' }}><Save className="w-4 h-4 mr-2" /> Save</Button>
      </Section>

      {/* Financing */}
      <Section title="Financing Assumptions">
        <div className="grid grid-cols-3 gap-3">
          <NumberField label="LT Debt Total" value={fin.ltDebtTotalMEur} onChange={v => setFin({ ...fin, ltDebtTotalMEur: v })} suffix="€M" />
          <NumberField label="LT Interest Rate" value={fin.ltInterestRatePct} onChange={v => setFin({ ...fin, ltInterestRatePct: v })} suffix="%" />
          <NumberField label="LT Drawdown Period" value={fin.ltDrawdownPeriodQtrs} onChange={v => setFin({ ...fin, ltDrawdownPeriodQtrs: v })} suffix="qtrs" />
          <NumberField label="LT Repayment Period" value={fin.ltRepaymentPeriodQtrs} onChange={v => setFin({ ...fin, ltRepaymentPeriodQtrs: v })} suffix="qtrs" />
          <NumberField label="WC Interest Rate" value={fin.wcInterestRatePct} onChange={v => setFin({ ...fin, wcInterestRatePct: v })} suffix="%" />
          <NumberField label="WC % Funded by Debt" value={fin.wcPctFundedByDebt} onChange={v => setFin({ ...fin, wcPctFundedByDebt: v })} suffix="%" />
        </div>
        <div className="mt-3"><Label style={labelStyle}>Equity Injections (JSON: [{`{quarter, amount}`}])</Label><Textarea value={fin.equityInjections} onChange={e => setFin({ ...fin, equityInjections: e.target.value })} style={inputStyle} rows={2} /></div>
        <Button className="mt-3" onClick={() => saveFin.mutate()} style={{ background: 'rgba(0,168,150,0.3)', color: '#00A896', border: '1px solid #00A896' }}><Save className="w-4 h-4 mr-2" /> Save</Button>
      </Section>

      {/* Grants */}
      <Section title="Grant Assumptions (up to 3)">
        <div className="space-y-2 mb-3">
          {grants.map(g => (
            <div key={g.id} className="flex items-center justify-between p-2 rounded" style={{ background: 'rgba(30,39,97,0.3)' }}>
              <span style={{ color: '#CADCFC', fontSize: '0.875rem' }}>{g.grantName} — €{g.cashReceiptMEur}M received {g.receiptQuarter}, amortized from {g.amortizationStartQuarter} over {g.amortizationYears}y</span>
              <Button variant="ghost" size="icon" onClick={() => deleteGrant.mutate(g.id)} style={{ color: '#EF4444' }}><Trash2 className="w-3 h-3" /></Button>
            </div>
          ))}
        </div>
        {grants.length < 3 && (
          <div className="grid grid-cols-5 gap-3">
            <div><Label style={labelStyle}>Grant Name</Label><Input value={newGrant.grantName} onChange={e => setNewGrant({ ...newGrant, grantName: e.target.value })} style={inputStyle} placeholder="e.g., IPCEI Grant" /></div>
            <NumberField label="Amount (€M)" value={newGrant.cashReceiptMEur} onChange={v => setNewGrant({ ...newGrant, cashReceiptMEur: v })} />
            <div><Label style={labelStyle}>Receipt Quarter</Label><Input value={newGrant.receiptQuarter} onChange={e => setNewGrant({ ...newGrant, receiptQuarter: e.target.value })} style={inputStyle} /></div>
            <div><Label style={labelStyle}>Amort. Start</Label><Input value={newGrant.amortizationStartQuarter} onChange={e => setNewGrant({ ...newGrant, amortizationStartQuarter: e.target.value })} style={inputStyle} /></div>
            <NumberField label="Amort. Years" value={newGrant.amortizationYears} onChange={v => setNewGrant({ ...newGrant, amortizationYears: v })} />
          </div>
        )}
        {grants.length < 3 && <Button className="mt-3" onClick={() => addGrant.mutate()} style={{ background: 'rgba(0,168,150,0.3)', color: '#00A896', border: '1px solid #00A896' }}><Plus className="w-4 h-4 mr-2" /> Add Grant</Button>}
      </Section>

      {/* Tax */}
      <Section title="Tax Assumptions">
        <div className="grid grid-cols-2 gap-4 items-center">
          <NumberField label="Corporate Tax Rate %" value={tax.corporateTaxRatePct} onChange={v => setTax({ ...tax, corporateTaxRatePct: v })} />
          <div className="flex items-center gap-3 mt-4">
            <Switch checked={tax.lossCarryForward} onCheckedChange={v => setTax({ ...tax, lossCarryForward: v })} />
            <Label style={{ color: '#CADCFC' }}>Loss Carry-Forward</Label>
          </div>
        </div>
        <Button className="mt-3" onClick={() => saveTax.mutate()} style={{ background: 'rgba(0,168,150,0.3)', color: '#00A896', border: '1px solid #00A896' }}><Save className="w-4 h-4 mr-2" /> Save</Button>
      </Section>

      {/* Working Capital */}
      <Section title="Working Capital Assumptions">
        <div className="grid grid-cols-3 gap-3">
          <NumberField label="AR Payment Terms" value={wc.arPaymentTermsDays} onChange={v => setWc({ ...wc, arPaymentTermsDays: v })} suffix="days" />
          <NumberField label="AP Payment Terms" value={wc.apPaymentTermsDays} onChange={v => setWc({ ...wc, apPaymentTermsDays: v })} suffix="days" />
          <NumberField label="Inventory Days" value={wc.inventoryDays} onChange={v => setWc({ ...wc, inventoryDays: v })} suffix="days" />
        </div>
        <Button className="mt-3" onClick={() => saveWc.mutate()} style={{ background: 'rgba(0,168,150,0.3)', color: '#00A896', border: '1px solid #00A896' }}><Save className="w-4 h-4 mr-2" /> Save</Button>
      </Section>

      {/* DCF */}
      <Section title="DCF Assumptions">
        <div className="grid grid-cols-3 gap-3">
          <NumberField label="Valuation Year" value={dcf.valuationYear} onChange={v => setDcf({ ...dcf, valuationYear: v })} />
          <NumberField label="Discount Rate %" value={dcf.discountRatePct} onChange={v => setDcf({ ...dcf, discountRatePct: v })} />
          <NumberField label="Terminal Growth Rate %" value={dcf.terminalGrowthRatePct} onChange={v => setDcf({ ...dcf, terminalGrowthRatePct: v })} />
        </div>
        <Button className="mt-3" onClick={() => saveDcf.mutate()} style={{ background: 'rgba(0,168,150,0.3)', color: '#00A896', border: '1px solid #00A896' }}><Save className="w-4 h-4 mr-2" /> Save</Button>
      </Section>
    </div>
  );
}