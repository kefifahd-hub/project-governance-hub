import { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, TrendingUp, BarChart3, DollarSign, Settings, Layers, Calculator, Zap } from 'lucide-react';
import { createPageUrl } from '../utils';
import ModelSetupTab from '../components/financemodel/tabs/ModelSetupTab';
import CapexTab from '../components/financemodel/tabs/CapexTab';
import AssumptionsTab from '../components/financemodel/tabs/AssumptionsTab';
import PLOutputTab from '../components/financemodel/tabs/PLOutputTab';
import DCFOutputTab from '../components/financemodel/tabs/DCFOutputTab';
import CashFlowOutputTab from '../components/financemodel/tabs/CashFlowOutputTab';
import {
  calcCellProduction, calcBOMCost, aggregateCells,
  calcCapexAndDepreciation, calcLabourCost, calcUtilityCost,
  calcOverheadCost, calcOtherOpex, calcGrantAmortization,
  calcFinanceCosts, calcPL, calcCashFlow, calcBalanceSheet, calcDCF, QUARTERS
} from '../components/financemodel/calcEngine';

export default function FinanceModel() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('id');
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('setup');

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => { const r = await base44.entities.Project.filter({ id: projectId }); return r[0]; },
    enabled: !!projectId
  });

  const { data: financeModels = [] } = useQuery({
    queryKey: ['financeModels', projectId],
    queryFn: () => base44.entities.FinanceModel.filter({ projectId }),
    enabled: !!projectId
  });

  const model = financeModels[0];
  const modelId = model?.id;

  // All supporting data queries
  const { data: cells = [] } = useQuery({ queryKey: ['cellConfigs', modelId], queryFn: () => base44.entities.CellConfig.filter({ financeModelId: modelId }), enabled: !!modelId });
  const { data: revenueData = [] } = useQuery({ queryKey: ['revenueAssumptions', modelId], queryFn: () => base44.entities.RevenueAssumptions.filter({ financeModelId: modelId }), enabled: !!modelId });
  const { data: bomData = [] } = useQuery({ queryKey: ['bomAssumptions', modelId], queryFn: () => base44.entities.BOMAssumptions.filter({ financeModelId: modelId }), enabled: !!modelId });
  const { data: headcountData = [] } = useQuery({ queryKey: ['headcountPlan', modelId], queryFn: () => base44.entities.HeadcountPlan.filter({ financeModelId: modelId }), enabled: !!modelId });
  const { data: capexItems = [] } = useQuery({ queryKey: ['capexPlan', modelId], queryFn: () => base44.entities.CapexPlan.filter({ financeModelId: modelId }), enabled: !!modelId });
  const { data: grants = [] } = useQuery({ queryKey: ['grants', modelId], queryFn: () => base44.entities.GrantAssumptions.filter({ financeModelId: modelId }), enabled: !!modelId });
  const { data: overheads = [] } = useQuery({ queryKey: ['overheads', modelId], queryFn: () => base44.entities.OverheadAssumptions.filter({ financeModelId: modelId }), enabled: !!modelId });
  const { data: utilAssumptions } = useQuery({ queryKey: ['utilAssumptions', modelId], queryFn: async () => { const r = await base44.entities.UtilityAssumptions.filter({ financeModelId: modelId }); return r[0]; }, enabled: !!modelId });
  const { data: taxAssumptions } = useQuery({ queryKey: ['taxAssumptions', modelId], queryFn: async () => { const r = await base44.entities.TaxAssumptions.filter({ financeModelId: modelId }); return r[0]; }, enabled: !!modelId });
  const { data: wcAssumptions } = useQuery({ queryKey: ['wcAssumptions', modelId], queryFn: async () => { const r = await base44.entities.WorkingCapitalAssumptions.filter({ financeModelId: modelId }); return r[0]; }, enabled: !!modelId });
  const { data: dcfAssumptions } = useQuery({ queryKey: ['dcfAssumptions', modelId], queryFn: async () => { const r = await base44.entities.DCFAssumptions.filter({ financeModelId: modelId }); return r[0]; }, enabled: !!modelId });
  const { data: otherOpex } = useQuery({ queryKey: ['otherOpex', modelId], queryFn: async () => { const r = await base44.entities.OtherOpexAssumptions.filter({ financeModelId: modelId }); return r[0]; }, enabled: !!modelId });
  const { data: financingAssumptions } = useQuery({ queryKey: ['financingAssumptions', modelId], queryFn: async () => { const r = await base44.entities.FinancingAssumptions.filter({ financeModelId: modelId }); return r[0]; }, enabled: !!modelId });

  const onRefresh = () => qc.invalidateQueries(['financeModels', projectId]);

  // ─── Run full calculation engine ─────────────────────────────────────────
  const calcResults = useMemo(() => {
    if (!modelId || cells.length === 0) return null;

    // Cell production per cell
    const cellProductionArrays = cells.map(cell => {
      const revMap = revenueData.filter(r => r.cellNumber === cell.cellNumber).reduce((m, r) => { m[r.quarter] = r; return m; }, {});
      return calcCellProduction(cell, revMap);
    });

    // BOM cost per cell
    const bomCostArrays = cells.map((cell, ci) => {
      const bom = bomData.find(b => b.cellNumber === cell.cellNumber);
      if (!bom) return QUARTERS.map(q => ({ quarter: q, bomCostMEur: 0 }));
      return calcBOMCost(bom, cellProductionArrays[ci]);
    });

    const productionByQtr = aggregateCells(cellProductionArrays);
    const revenueByQtr = productionByQtr; // revenue is embedded in production
    const capexDepreciation = calcCapexAndDepreciation(capexItems);
    const labourCosts = calcLabourCost(headcountData);
    const utilityCosts = calcUtilityCost(utilAssumptions ?? {}, productionByQtr);
    const overheadCosts = calcOverheadCost(overheads, productionByQtr, revenueByQtr);
    const otherOpexCalc = calcOtherOpex(otherOpex, revenueByQtr);
    const grantAmort = calcGrantAmortization(grants);
    const financeCosts = calcFinanceCosts(financingAssumptions, productionByQtr, revenueByQtr);

    const plData = calcPL({
      cellProduction: cellProductionArrays,
      bomCosts: bomCostArrays,
      labourCosts, utilityCosts, overheadCosts,
      otherOpex: otherOpexCalc,
      capexData: capexDepreciation,
      grantAmort, financeCosts, taxAssumptions,
      productionByQtr, revenueByQtr
    });

    const cashFlowData = calcCashFlow(plData, capexDepreciation, financingAssumptions, grants, wcAssumptions);
    const balanceSheetData = calcBalanceSheet(plData, cashFlowData, capexDepreciation, financingAssumptions, grants);
    const dcfResult = calcDCF(cashFlowData, dcfAssumptions);

    return { plData, cashFlowData, balanceSheetData, dcfResult, capexDepreciation };
  }, [modelId, cells, revenueData, bomData, headcountData, capexItems, grants, overheads, utilAssumptions, taxAssumptions, wcAssumptions, dcfAssumptions, otherOpex, financingAssumptions]);

  const totalNPV = calcResults?.dcfResult?.totalNPV;

  const inputTabs = [
    { id: 'setup', label: 'Model Setup', icon: Settings },
    { id: 'capex', label: 'CAPEX', icon: Layers },
    { id: 'assumptions', label: 'Assumptions', icon: Calculator },
  ];
  const outputTabs = [
    { id: 'pl', label: 'P&L', icon: BarChart3 },
    { id: 'cashflow', label: 'Cash Flow', icon: TrendingUp },
    { id: 'dcf', label: 'DCF / NPV', icon: Zap },
  ];

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #1E2761 0%, #0F172A 100%)' }}>
      {/* Header */}
      <div style={{ background: 'rgba(15,23,42,0.95)', borderBottom: '1px solid rgba(202,220,252,0.1)' }}>
        <div className="max-w-full px-4 sm:px-6 py-4">
          <Button variant="ghost" onClick={() => navigate(createPageUrl(`ProjectDashboard?id=${projectId}`))} style={{ color: '#CADCFC' }}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <div className="flex items-center justify-between mt-2">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: '#CADCFC' }}>Finance Model</h1>
              <p className="text-sm" style={{ color: '#94A3B8' }}>{project?.projectName} — {model?.modelName || 'New Model'} {model?.version && <span style={{ color: '#00A896' }}>({model.version})</span>}</p>
            </div>
            <div className="flex items-center gap-3">
              {model && <Badge style={{ background: model.status === 'Approved' ? 'rgba(0,168,150,0.3)' : 'rgba(30,39,97,0.5)', color: model.status === 'Approved' ? '#00A896' : '#94A3B8', border: '1px solid rgba(202,220,252,0.2)' }}>{model.status}</Badge>}
              {totalNPV != null && (
                <div className="text-right">
                  <div className="text-xs" style={{ color: '#94A3B8' }}>Total NPV</div>
                  <div className="text-lg font-bold" style={{ color: totalNPV >= 0 ? '#34D399' : '#EF4444' }}>€{totalNPV.toFixed(1)}M</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-full px-4 sm:px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Tab navigation split: Inputs | Outputs */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs uppercase tracking-widest" style={{ color: '#94A3B8' }}>Inputs</span>
            </div>
            <TabsList style={{ background: 'rgba(30,39,97,0.5)', border: '1px solid rgba(202,220,252,0.1)' }}>
              {inputTabs.map(({ id, label, icon: Icon }) => (
                <TabsTrigger key={id} value={id} style={{ color: activeTab === id ? '#CADCFC' : '#94A3B8' }}>
                  <Icon className="w-4 h-4 mr-1" />{label}
                </TabsTrigger>
              ))}
            </TabsList>
            <div className="flex items-center gap-2 mt-4 mb-2">
              <span className="text-xs uppercase tracking-widest" style={{ color: '#94A3B8' }}>Outputs</span>
              <DollarSign className="w-3 h-3" style={{ color: '#94A3B8' }} />
            </div>
            <TabsList style={{ background: 'rgba(30,39,97,0.5)', border: '1px solid rgba(202,220,252,0.1)' }}>
              {outputTabs.map(({ id, label, icon: Icon }) => (
                <TabsTrigger key={id} value={id} style={{ color: activeTab === id ? '#CADCFC' : '#94A3B8' }}>
                  <Icon className="w-4 h-4 mr-1" />{label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="setup">
            <ModelSetupTab model={model} cells={cells} modelId={modelId} projectId={projectId} onRefresh={onRefresh} />
          </TabsContent>
          <TabsContent value="capex">
            <CapexTab capexItems={capexItems} modelId={modelId} onRefresh={onRefresh} />
          </TabsContent>
          <TabsContent value="assumptions">
            <AssumptionsTab modelId={modelId} utilAssumptions={utilAssumptions} taxAssumptions={taxAssumptions} wcAssumptions={wcAssumptions} dcfAssumptions={dcfAssumptions} otherOpex={otherOpex} financingAssumptions={financingAssumptions} grants={grants} overheads={overheads} onRefresh={onRefresh} />
          </TabsContent>
          <TabsContent value="pl">
            <PLOutputTab plData={calcResults?.plData} />
          </TabsContent>
          <TabsContent value="cashflow">
            <CashFlowOutputTab cashFlowData={calcResults?.cashFlowData} />
          </TabsContent>
          <TabsContent value="dcf">
            <DCFOutputTab dcfResult={calcResults?.dcfResult} cashFlowData={calcResults?.cashFlowData} dcfAssumptions={dcfAssumptions} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}