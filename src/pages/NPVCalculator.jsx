import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Calculator, Save, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createPageUrl } from '../utils';

export default function NPVCalculator() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('id');
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    scenarioName: '',
    capexEurM: 2500,
    productionCapacityGWh: 40,
    rampUpYears: 3,
    batteryCellPriceEurKWh: 80,
    rawMaterialCostEurKWh: 45,
    energyCostEurKWh: 5,
    laborCostEurM: 50,
    maintenanceCostEurM: 30,
    discountRatePercent: 8.0,
    projectDurationYears: 20,
    taxRatePercent: 25
  });

  const [results, setResults] = useState(null);

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const result = await base44.entities.Project.filter({ id: projectId });
      return result[0];
    },
    enabled: !!projectId
  });

  const { data: scenarios = [] } = useQuery({
    queryKey: ['scenarios', projectId],
    queryFn: () => base44.entities.NPVScenario.filter({ projectId }),
    enabled: !!projectId
  });

  const saveScenarioMutation = useMutation({
    mutationFn: (data) => base44.entities.NPVScenario.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scenarios', projectId] });
    }
  });

  const calculateNPV = () => {
    const discountRate = formData.discountRatePercent / 100;
    const taxRate = formData.taxRatePercent / 100;
    
    let npv = -formData.capexEurM;
    let cashFlows = [];
    let cumulativeCashFlow = -formData.capexEurM;
    let paybackYear = null;
    
    for (let year = 1; year <= formData.projectDurationYears; year++) {
      // Ramp-up production capacity
      let capacityUtilization = year <= formData.rampUpYears 
        ? year / formData.rampUpYears 
        : 1.0;
      
      const productionGWh = formData.productionCapacityGWh * capacityUtilization;
      
      // Revenue calculation
      const revenueEurM = (productionGWh * 1000000 * formData.batteryCellPriceEurKWh) / 1000000;
      
      // Operating costs
      const rawMaterialEurM = (productionGWh * 1000000 * formData.rawMaterialCostEurKWh) / 1000000;
      const energyEurM = (productionGWh * 1000000 * formData.energyCostEurKWh) / 1000000;
      const laborEurM = formData.laborCostEurM;
      const maintenanceEurM = formData.maintenanceCostEurM * capacityUtilization;
      
      const totalOpexEurM = rawMaterialEurM + energyEurM + laborEurM + maintenanceEurM;
      
      // EBITDA
      const ebitdaEurM = revenueEurM - totalOpexEurM;
      
      // Depreciation (straight-line over project duration)
      const depreciationEurM = formData.capexEurM / formData.projectDurationYears;
      
      // EBIT
      const ebitEurM = ebitdaEurM - depreciationEurM;
      
      // Tax
      const taxEurM = Math.max(0, ebitEurM * taxRate);
      
      // Net Income
      const netIncomeEurM = ebitEurM - taxEurM;
      
      // Operating Cash Flow (Net Income + Depreciation)
      const cashFlowEurM = netIncomeEurM + depreciationEurM;
      
      // NPV calculation
      const discountedCashFlow = cashFlowEurM / Math.pow(1 + discountRate, year);
      npv += discountedCashFlow;
      
      // Track cumulative cash flow for payback
      cumulativeCashFlow += cashFlowEurM;
      if (paybackYear === null && cumulativeCashFlow > 0) {
        paybackYear = year;
      }
      
      cashFlows.push({
        year,
        revenue: revenueEurM,
        opex: totalOpexEurM,
        ebitda: ebitdaEurM,
        ebit: ebitEurM,
        tax: taxEurM,
        netIncome: netIncomeEurM,
        cashFlow: cashFlowEurM,
        cumulativeCashFlow: cumulativeCashFlow,
        discountedCashFlow: discountedCashFlow,
        capacityUtilization: capacityUtilization * 100
      });
    }
    
    const avgAnnualCashFlow = cashFlows.reduce((sum, cf) => sum + cf.cashFlow, 0) / formData.projectDurationYears;
    const irr = calculateIRR([...[-formData.capexEurM], ...cashFlows.map(cf => cf.cashFlow)]);
    
    setResults({
      npvResultEurM: npv,
      paybackPeriodYears: paybackYear || formData.projectDurationYears,
      avgAnnualCashFlowEurM: avgAnnualCashFlow,
      irrPercent: irr,
      isViable: npv > 0,
      cashFlows
    });
  };
  
  const calculateIRR = (cashFlows) => {
    const maxIterations = 100;
    const tolerance = 0.0001;
    let rate = 0.1;
    
    for (let i = 0; i < maxIterations; i++) {
      let npv = 0;
      let dnpv = 0;
      
      for (let j = 0; j < cashFlows.length; j++) {
        npv += cashFlows[j] / Math.pow(1 + rate, j);
        dnpv -= j * cashFlows[j] / Math.pow(1 + rate, j + 1);
      }
      
      if (Math.abs(npv) < tolerance) return rate * 100;
      rate = rate - npv / dnpv;
    }
    
    return rate * 100;
  };

  const handleSave = () => {
    if (!formData.scenarioName) {
      alert('Please enter a scenario name');
      return;
    }
    saveScenarioMutation.mutate({
      projectId,
      ...formData,
      ...results
    });
  };

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1E2761 0%, #0F172A 100%)' }}>
        <p style={{ color: '#94A3B8' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #1E2761 0%, #0F172A 100%)' }}>
      <div style={{ background: 'rgba(15, 23, 42, 0.95)', borderBottom: '1px solid rgba(202, 220, 252, 0.1)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <Button variant="ghost" onClick={() => navigate(createPageUrl(`Home?id=${projectId}`))} className="mb-4" style={{ color: '#CADCFC' }}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Back to Dashboard</span>
            <span className="sm:hidden">Back</span>
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: '#CADCFC' }}>NPV Calculator</h1>
          <p className="mt-2 text-sm sm:text-base" style={{ color: '#94A3B8' }}>{project.projectName}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Input Form */}
          <Card style={{ background: 'rgba(15, 23, 42, 0.95)', borderColor: 'rgba(202, 220, 252, 0.1)' }}>
            <CardHeader>
              <CardTitle style={{ color: '#CADCFC' }}>Investment Parameters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label style={{ color: '#94A3B8' }}>Scenario Name</Label>
                <Input
                  placeholder="e.g., Base Case, Optimistic"
                  value={formData.scenarioName}
                  onChange={(e) => setFormData({ ...formData, scenarioName: e.target.value })}
                  style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
                />
              </div>
              <div>
                <Label style={{ color: '#94A3B8' }}>Capital Expenditure (€M)</Label>
                <Input
                  type="number"
                  value={formData.capexEurM}
                  onChange={(e) => setFormData({ ...formData, capexEurM: parseFloat(e.target.value) })}
                  style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs sm:text-sm" style={{ color: '#94A3B8' }}>Production Capacity (GWh/year)</Label>
                  <Input
                    type="number"
                    value={formData.productionCapacityGWh}
                    onChange={(e) => setFormData({ ...formData, productionCapacityGWh: parseFloat(e.target.value) })}
                    style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
                  />
                </div>
                <div>
                  <Label className="text-xs sm:text-sm" style={{ color: '#94A3B8' }}>Ramp-Up Period (years)</Label>
                  <Input
                    type="number"
                    value={formData.rampUpYears}
                    onChange={(e) => setFormData({ ...formData, rampUpYears: parseInt(e.target.value) })}
                    style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
                  />
                </div>
              </div>
              <div>
                <Label style={{ color: '#94A3B8' }}>Battery Cell Price (€/kWh)</Label>
                <Input
                  type="number"
                  value={formData.batteryCellPriceEurKWh}
                  onChange={(e) => setFormData({ ...formData, batteryCellPriceEurKWh: parseFloat(e.target.value) })}
                  style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs sm:text-sm" style={{ color: '#94A3B8' }}>Raw Material Cost (€/kWh)</Label>
                  <Input
                    type="number"
                    value={formData.rawMaterialCostEurKWh}
                    onChange={(e) => setFormData({ ...formData, rawMaterialCostEurKWh: parseFloat(e.target.value) })}
                    style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
                  />
                </div>
                <div>
                  <Label className="text-xs sm:text-sm" style={{ color: '#94A3B8' }}>Energy Cost (€/kWh)</Label>
                  <Input
                    type="number"
                    value={formData.energyCostEurKWh}
                    onChange={(e) => setFormData({ ...formData, energyCostEurKWh: parseFloat(e.target.value) })}
                    style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs sm:text-sm" style={{ color: '#94A3B8' }}>Annual Labor Cost (€M)</Label>
                  <Input
                    type="number"
                    value={formData.laborCostEurM}
                    onChange={(e) => setFormData({ ...formData, laborCostEurM: parseFloat(e.target.value) })}
                    style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
                  />
                </div>
                <div>
                  <Label className="text-xs sm:text-sm" style={{ color: '#94A3B8' }}>Annual Maintenance (€M)</Label>
                  <Input
                    type="number"
                    value={formData.maintenanceCostEurM}
                    onChange={(e) => setFormData({ ...formData, maintenanceCostEurM: parseFloat(e.target.value) })}
                    style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
                  />
                </div>
              </div>
              <div>
                <Label style={{ color: '#94A3B8' }}>Discount Rate (%)</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={formData.discountRatePercent}
                  onChange={(e) => setFormData({ ...formData, discountRatePercent: parseFloat(e.target.value) })}
                  style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs sm:text-sm" style={{ color: '#94A3B8' }}>Project Duration (Years)</Label>
                  <Input
                    type="number"
                    value={formData.projectDurationYears}
                    onChange={(e) => setFormData({ ...formData, projectDurationYears: parseInt(e.target.value) })}
                    style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
                  />
                </div>
                <div>
                  <Label className="text-xs sm:text-sm" style={{ color: '#94A3B8' }}>Tax Rate (%)</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={formData.taxRatePercent}
                    onChange={(e) => setFormData({ ...formData, taxRatePercent: parseFloat(e.target.value) })}
                    style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button onClick={calculateNPV} className="w-full sm:w-auto" style={{ background: 'linear-gradient(135deg, #028090 0%, #00A896 100%)', color: '#F8FAFC' }}>
                  <Calculator className="w-4 h-4 mr-2" />
                  Calculate
                </Button>
                {results && (
                  <Button onClick={handleSave} variant="outline" className="w-full sm:w-auto" style={{ borderColor: 'rgba(202, 220, 252, 0.3)', color: '#CADCFC' }}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Scenario
                  </Button>
                )}
              </div>
              <div className="p-4 rounded-lg" style={{ background: 'rgba(2, 128, 144, 0.1)', border: '1px solid rgba(2, 128, 144, 0.3)' }}>
                <p className="text-sm font-semibold mb-2" style={{ color: '#CADCFC' }}>
                  💡 Battery Factory Financial Model
                </p>
                <p className="text-xs" style={{ color: '#94A3B8' }}>
                  Includes production ramp-up, depreciation, taxes, and detailed cash flow analysis
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="space-y-6">
            {results ? (
              <>
                <Card style={{ 
                  background: results.isViable 
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)'
                    : 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.1) 100%)',
                  border: `2px solid ${results.isViable ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                }}>
                  <CardContent className="p-8 text-center relative">
                    <div style={{ 
                      position: 'absolute', 
                      top: '-30px', 
                      right: '-30px', 
                      width: '150px', 
                      height: '150px',
                      background: results.isViable 
                        ? 'radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, transparent 70%)'
                        : 'radial-gradient(circle, rgba(239, 68, 68, 0.3) 0%, transparent 70%)',
                      borderRadius: '50%'
                    }} />
                    <div className="text-sm mb-2" style={{ color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Net Present Value
                    </div>
                    <div className="text-4xl sm:text-6xl font-bold mb-4" style={{ 
                      color: results.isViable ? '#10B981' : '#EF4444',
                      fontFamily: "'Courier New', monospace"
                    }}>
                      €{results.npvResultEurM.toFixed(1)}M
                    </div>
                    <div className="text-xl font-semibold" style={{ 
                      color: results.isViable ? '#10B981' : '#EF4444',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      {results.isViable ? '✓ Project Viable' : '✗ Negative Return'}
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Card style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.1)' }}>
                    <CardContent className="p-2 sm:p-3">
                      <div className="text-xs mb-1" style={{ color: '#94A3B8', textTransform: 'uppercase' }}>Payback</div>
                      <div className="text-lg sm:text-xl font-bold" style={{ color: '#CADCFC' }}>{results.paybackPeriodYears.toFixed(1)}y</div>
                    </CardContent>
                  </Card>
                  <Card style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.1)' }}>
                    <CardContent className="p-2 sm:p-3">
                      <div className="text-xs mb-1" style={{ color: '#94A3B8', textTransform: 'uppercase' }}>IRR</div>
                      <div className="text-lg sm:text-xl font-bold" style={{ color: results.irrPercent > formData.discountRatePercent ? '#10B981' : '#EF4444' }}>
                        {results.irrPercent.toFixed(1)}%
                      </div>
                    </CardContent>
                  </Card>
                  <Card style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.1)' }}>
                    <CardContent className="p-2 sm:p-3">
                      <div className="text-xs mb-1" style={{ color: '#94A3B8', textTransform: 'uppercase' }}>CAPEX</div>
                      <div className="text-lg sm:text-xl font-bold" style={{ color: '#CADCFC' }}>€{formData.capexEurM}M</div>
                    </CardContent>
                  </Card>
                  <Card style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.1)' }}>
                    <CardContent className="p-2 sm:p-3">
                      <div className="text-xs mb-1" style={{ color: '#94A3B8', textTransform: 'uppercase' }}>Avg CF</div>
                      <div className="text-lg sm:text-xl font-bold" style={{ color: '#10B981' }}>€{results.avgAnnualCashFlowEurM.toFixed(0)}M</div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Cash Flow Chart */}
                <Card style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.1)' }} className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-sm sm:text-base" style={{ color: '#CADCFC' }}>20-Year Cash Flow Projection</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-48 sm:h-64 overflow-x-auto">
                      <div className="flex gap-1 sm:gap-2 h-full items-end" style={{ minWidth: `${results.cashFlows.length * 32}px` }}>
                        {results.cashFlows.map((cf, idx) => {
                          const maxCashFlow = Math.max(...results.cashFlows.map(c => c.cashFlow));
                          const height = (cf.cashFlow / maxCashFlow) * 100;
                          return (
                            <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                              <div 
                                className="w-full rounded-t transition-all hover:opacity-80"
                                style={{ 
                                  height: `${Math.max(height, 5)}%`,
                                  background: cf.cashFlow > 0 ? 'linear-gradient(180deg, #10B981 0%, #059669 100%)' : '#EF4444',
                                  minWidth: '16px'
                                }}
                                title={`Year ${cf.year}: €${cf.cashFlow.toFixed(1)}M`}
                              />
                              <div className="text-[10px] sm:text-xs" style={{ color: '#94A3B8' }}>Y{cf.year}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.1)' }}>
                <CardContent className="p-12 text-center">
                  <p style={{ color: '#94A3B8' }}>Enter parameters and click Calculate to see results</p>
                </CardContent>
              </Card>
            )}

            {/* Saved Scenarios */}
            {scenarios.length > 0 && (
              <Card style={{ background: 'rgba(15, 23, 42, 0.95)', borderColor: 'rgba(202, 220, 252, 0.1)' }}>
                <CardHeader>
                  <CardTitle style={{ color: '#CADCFC' }}>Saved Scenarios</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {scenarios.map((scenario) => (
                      <div 
                        key={scenario.id} 
                        className="p-3 rounded-lg cursor-pointer hover:bg-opacity-80"
                        style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.1)', border: '1px solid' }}
                        onClick={() => setFormData({
                          scenarioName: scenario.scenarioName,
                          capexEurM: scenario.capexEurM,
                          annualOpexEurM: scenario.annualOpexEurM,
                          annualRevenueEurM: scenario.annualRevenueEurM,
                          discountRatePercent: scenario.discountRatePercent,
                          projectDurationYears: scenario.projectDurationYears
                        })}
                      >
                        <div className="flex items-center justify-between">
                          <span style={{ color: '#CADCFC' }}>{scenario.scenarioName}</span>
                          <span className={scenario.isViable ? 'text-green-500' : 'text-red-500'}>
                            €{scenario.npvResultEurM?.toFixed(1)}M
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}