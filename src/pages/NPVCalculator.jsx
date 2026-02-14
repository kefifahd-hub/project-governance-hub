import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Calculator, Save } from 'lucide-react';
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
    annualOpexEurM: 150,
    annualRevenueEurM: 400,
    discountRatePercent: 8.0,
    projectDurationYears: 10
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
    const annualNetCashflow = formData.annualRevenueEurM - formData.annualOpexEurM;
    const discountRate = formData.discountRatePercent / 100;
    
    let npv = -formData.capexEurM;
    for (let year = 1; year <= formData.projectDurationYears; year++) {
      npv += annualNetCashflow / Math.pow(1 + discountRate, year);
    }

    const paybackPeriod = formData.capexEurM / annualNetCashflow;
    
    setResults({
      npvResultEurM: npv,
      annualNetCashflowEurM: annualNetCashflow,
      paybackPeriodYears: paybackPeriod,
      isViable: npv > 0
    });
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
        <div className="max-w-7xl mx-auto px-6 py-6">
          <Button variant="ghost" onClick={() => navigate(createPageUrl(`Home?id=${projectId}`))} className="mb-4" style={{ color: '#CADCFC' }}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold" style={{ color: '#CADCFC' }}>NPV Calculator</h1>
          <p className="mt-2" style={{ color: '#94A3B8' }}>{project.projectName}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
              <div>
                <Label style={{ color: '#94A3B8' }}>Annual Operating Costs (€M)</Label>
                <Input
                  type="number"
                  value={formData.annualOpexEurM}
                  onChange={(e) => setFormData({ ...formData, annualOpexEurM: parseFloat(e.target.value) })}
                  style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
                />
              </div>
              <div>
                <Label style={{ color: '#94A3B8' }}>Annual Revenue (€M)</Label>
                <Input
                  type="number"
                  value={formData.annualRevenueEurM}
                  onChange={(e) => setFormData({ ...formData, annualRevenueEurM: parseFloat(e.target.value) })}
                  style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
                />
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
              <div>
                <Label style={{ color: '#94A3B8' }}>Project Duration (Years)</Label>
                <Input
                  type="number"
                  value={formData.projectDurationYears}
                  onChange={(e) => setFormData({ ...formData, projectDurationYears: parseInt(e.target.value) })}
                  style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button onClick={calculateNPV} style={{ background: 'linear-gradient(135deg, #028090 0%, #00A896 100%)', color: '#F8FAFC' }}>
                  <Calculator className="w-4 h-4 mr-2" />
                  Calculate
                </Button>
                {results && (
                  <Button onClick={handleSave} variant="outline" style={{ borderColor: 'rgba(202, 220, 252, 0.3)', color: '#CADCFC' }}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Scenario
                  </Button>
                )}
              </div>
              <div className="p-4 rounded-lg" style={{ background: 'rgba(2, 128, 144, 0.1)', border: '1px solid rgba(2, 128, 144, 0.3)' }}>
                <p className="text-sm" style={{ color: '#CADCFC' }}>
                  💡 Adjust parameters to see real-time impact on NPV and payback period
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
                    <div className="text-6xl font-bold mb-4" style={{ 
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

                <div className="grid grid-cols-3 gap-4">
                  <Card style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.1)' }}>
                    <CardContent className="p-4">
                      <div className="text-xs mb-1" style={{ color: '#94A3B8', textTransform: 'uppercase' }}>Payback Period</div>
                      <div className="text-2xl font-bold" style={{ color: '#CADCFC' }}>{results.paybackPeriodYears.toFixed(1)} years</div>
                    </CardContent>
                  </Card>
                  <Card style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.1)' }}>
                    <CardContent className="p-4">
                      <div className="text-xs mb-1" style={{ color: '#94A3B8', textTransform: 'uppercase' }}>Total Investment</div>
                      <div className="text-2xl font-bold" style={{ color: '#CADCFC' }}>€{formData.capexEurM}M</div>
                    </CardContent>
                  </Card>
                  <Card style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.1)' }}>
                    <CardContent className="p-4">
                      <div className="text-xs mb-1" style={{ color: '#94A3B8', textTransform: 'uppercase' }}>Annual Net Cash Flow</div>
                      <div className="text-2xl font-bold" style={{ color: '#10B981' }}>€{results.annualNetCashflowEurM.toFixed(1)}M</div>
                    </CardContent>
                  </Card>
                </div>
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