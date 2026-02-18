import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Plus, Link, ExternalLink, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { createPageUrl } from '../utils';
import QualityGateTimeline from '../components/feasibility/QualityGateTimeline';
import FeasibilityProgressDashboard from '../components/feasibility/FeasibilityProgressDashboard';

const REC_COLORS = {
  'Proceed': 'bg-green-600',
  'Proceed with Conditions': 'bg-yellow-600',
  'Further Study Required': 'bg-orange-600',
  'Do Not Proceed': 'bg-red-600',
};

const fmtM = (v) => v != null ? `€${Number(v).toFixed(1)}M` : '—';

export default function FeasibilityStudy() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('id');
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('tab1');
  const [selectedStudyId, setSelectedStudyId] = useState(null);

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => (await base44.entities.Project.filter({ id: projectId }))[0],
    enabled: !!projectId,
  });

  const { data: studies = [] } = useQuery({
    queryKey: ['feasibilityStudies', projectId],
    queryFn: () => base44.entities.FeasibilityStudy.filter({ projectId }, '-created_date'),
    enabled: !!projectId,
  });

  const selectedStudy = selectedStudyId ? studies.find(s => s.id === selectedStudyId) : studies[0];

  const { data: financeModels = [] } = useQuery({
    queryKey: ['financeModels', projectId],
    queryFn: () => base44.entities.FinanceModel.filter({ projectId }),
    enabled: !!projectId,
  });

  const { data: siteAssessments = [] } = useQuery({
    queryKey: ['siteAssessments', projectId],
    queryFn: () => base44.entities.SiteAssessment.filter({ projectId }),
    enabled: !!projectId,
  });

  const linkedFinanceModel = financeModels.find(m => m.id === selectedStudy?.linkedFinanceModelId) || financeModels[0];

  // Finance model outputs for linked mode
  const { data: capexPlan = [] } = useQuery({
    queryKey: ['capexPlan', linkedFinanceModel?.id],
    queryFn: () => base44.entities.CapexPlan.filter({ financeModelId: linkedFinanceModel.id }),
    enabled: !!linkedFinanceModel?.id,
  });

  const totalCapex = useMemo(() => capexPlan.reduce((s, r) => s + (r.amountMEur || 0), 0), [capexPlan]);

  // New study form
  const [newStudyForm, setNewStudyForm] = useState({
    studyName: '', studyDate: new Date().toISOString().split('T')[0],
    studyMaturity: 'Preliminary', studyOwner: '', studyVersion: 'Rev 0', executiveSummary: '',
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.FeasibilityStudy.create({ ...data, projectId }),
    onSuccess: (d) => {
      queryClient.invalidateQueries({ queryKey: ['feasibilityStudies', projectId] });
      setSelectedStudyId(d.id);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.FeasibilityStudy.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feasibilityStudies', projectId] }),
  });

  const saveTab = (tabKey, value) => {
    if (!selectedStudy) return;
    updateMutation.mutate({ id: selectedStudy.id, data: { [tabKey]: typeof value === 'string' ? value : JSON.stringify(value) } });
  };

  const linkFinanceModel = (fmId) => {
    if (!selectedStudy) return;
    updateMutation.mutate({ id: selectedStudy.id, data: { linkedFinanceModelId: fmId } });
  };

  if (!project) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1E2761 0%, #0F172A 100%)' }}>
      <p style={{ color: '#94A3B8' }}>Loading...</p>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #1E2761 0%, #0F172A 100%)' }}>
      {/* Quality Gate Timeline — sticky */}
      <div className="sticky top-14 z-40">
        <QualityGateTimeline projectId={projectId} />
      </div>

      {/* Header */}
      <div style={{ background: 'rgba(15, 23, 42, 0.95)', borderBottom: '1px solid rgba(202, 220, 252, 0.1)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <Button variant="ghost" onClick={() => navigate(createPageUrl(`Home?id=${projectId}`))} className="mb-3" style={{ color: '#CADCFC' }}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: '#CADCFC' }}>Feasibility Study</h1>
              <p className="text-sm" style={{ color: '#94A3B8' }}>{project.projectName}</p>
            </div>
            <div className="flex gap-2">
              {studies.length > 0 && (
                <Select value={selectedStudy?.id || ''} onValueChange={setSelectedStudyId}>
                  <SelectTrigger className="w-52" style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }}>
                    <SelectValue placeholder="Select study..." />
                  </SelectTrigger>
                  <SelectContent>
                    {studies.map(s => <SelectItem key={s.id} value={s.id}>{s.studyName}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              <Button onClick={() => createMutation.mutate(newStudyForm)} disabled={!newStudyForm.studyName}
                style={{ background: 'linear-gradient(135deg, #028090 0%, #00A896 100%)', color: '#F8FAFC' }}>
                <Plus className="w-4 h-4 mr-1" /> New Study
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* No study yet */}
        {studies.length === 0 && (
          <Card style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.1)' }} className="mb-6">
            <CardHeader><CardTitle style={{ color: '#CADCFC' }}>Create First Study</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label style={{ color: '#94A3B8' }}>Study Name *</Label>
                  <Input value={newStudyForm.studyName} onChange={e => setNewStudyForm({ ...newStudyForm, studyName: e.target.value })}
                    placeholder="e.g., Phase 1 Feasibility Assessment"
                    style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }} />
                </div>
                <div>
                  <Label style={{ color: '#94A3B8' }}>Study Owner</Label>
                  <Input value={newStudyForm.studyOwner} onChange={e => setNewStudyForm({ ...newStudyForm, studyOwner: e.target.value })}
                    style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }} />
                </div>
                <div>
                  <Label style={{ color: '#94A3B8' }}>Maturity Level</Label>
                  <Select value={newStudyForm.studyMaturity} onValueChange={v => setNewStudyForm({ ...newStudyForm, studyMaturity: v })}>
                    <SelectTrigger style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Preliminary">Preliminary (±30-50%)</SelectItem>
                      <SelectItem value="Detailed">Detailed (±15-25%)</SelectItem>
                      <SelectItem value="Executive">Executive (±10-15%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={() => createMutation.mutate(newStudyForm)} disabled={!newStudyForm.studyName}
                    className="w-full" style={{ background: 'linear-gradient(135deg, #028090 0%, #00A896 100%)', color: '#F8FAFC' }}>
                    Create Study
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {selectedStudy && (
          <>
            <FeasibilityProgressDashboard study={selectedStudy} activeTab={activeTab} onTabChange={setActiveTab} />

            {/* Finance Model Linkage Banner */}
            {linkedFinanceModel ? (
              <div className="flex items-center gap-3 mb-4 px-4 py-2 rounded-lg" style={{ background: 'rgba(0,168,150,0.1)', border: '1px solid rgba(0,168,150,0.3)' }}>
                <Link className="w-4 h-4" style={{ color: '#00A896' }} />
                <span className="text-sm" style={{ color: '#00A896' }}>
                  Financial data powered by Finance Model: <strong>{linkedFinanceModel.modelName}</strong>
                </span>
                <Button variant="ghost" size="sm" onClick={() => navigate(createPageUrl(`FinanceModel?id=${projectId}`))} style={{ color: '#00A896' }}>
                  Open Finance Model <ExternalLink className="w-3 h-3 ml-1" />
                </Button>
              </div>
            ) : financeModels.length > 0 ? (
              <div className="flex items-center gap-3 mb-4 px-4 py-2 rounded-lg" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}>
                <AlertTriangle className="w-4 h-4" style={{ color: '#F59E0B' }} />
                <span className="text-sm" style={{ color: '#F59E0B' }}>Finance Model available but not linked.</span>
                <Button size="sm" onClick={() => linkFinanceModel(financeModels[0].id)} style={{ background: 'rgba(245,158,11,0.2)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)' }}>
                  Link {financeModels[0].modelName}
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3 mb-4 px-4 py-2 rounded-lg" style={{ background: 'rgba(148,163,184,0.1)', border: '1px solid rgba(148,163,184,0.2)' }}>
                <span className="text-sm" style={{ color: '#94A3B8' }}>⚠️ Using simplified financial model. For detailed quarterly analysis:</span>
                <Button size="sm" onClick={() => navigate(createPageUrl(`FinanceModel?id=${projectId}`))} style={{ background: 'rgba(30,39,97,0.5)', color: '#CADCFC', border: '1px solid rgba(202,220,252,0.2)' }}>
                  Create Finance Model →
                </Button>
              </div>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="flex flex-wrap gap-1 mb-6 h-auto p-1" style={{ background: 'rgba(15,23,42,0.5)' }}>
                {['1','2','3','4','5','6','7','8','9','10','11'].map(n => (
                  <TabsTrigger key={n} value={`tab${n}`} className="text-xs px-2 py-1">{n}</TabsTrigger>
                ))}
              </TabsList>

              {/* Tab 1: Project Overview */}
              <TabsContent value="tab1">
                <StudyTab title="Project Overview" study={selectedStudy} tabKey="tab1Data" onSave={(v) => saveTab('tab1Data', v)}
                  fields={[
                    { key: 'studyName', label: 'Study Name *', type: 'text' },
                    { key: 'studyVersion', label: 'Version', type: 'text', placeholder: 'Rev 0' },
                    { key: 'studyOwner', label: 'Study Owner', type: 'text' },
                    { key: 'studyDate', label: 'Study Date', type: 'date' },
                    { key: 'studyMaturity', label: 'Maturity Level', type: 'select', options: ['Preliminary', 'Detailed', 'Executive'] },
                    { key: 'projectName', label: 'Project Name', type: 'text', defaultValue: project.projectName },
                    { key: 'clientName', label: 'Client / Customer', type: 'text', defaultValue: project.clientName },
                    { key: 'targetSOP', label: 'Target SOP Date', type: 'date' },
                    { key: 'executiveSummary', label: 'Executive Summary *', type: 'textarea', rows: 6 },
                    { key: 'productDescription', label: 'Product Description', type: 'textarea' },
                    { key: 'productUse', label: 'Product Use / Application', type: 'select', options: ['EV Automotive', 'ESS Grid', 'ESS Commercial', 'Consumer', 'Industrial', 'Defense', 'Other'] },
                    { key: 'volumeRequirement', label: 'Volume Requirement', type: 'text' },
                  ]}
                />
              </TabsContent>

              {/* Tab 2: Market Assessment */}
              <TabsContent value="tab2">
                <StudyTab title="Market Assessment" study={selectedStudy} tabKey="tab2Data" onSave={(v) => saveTab('tab2Data', v)}
                  fields={[
                    { key: 'marketDemand', label: 'Market Demand Level *', type: 'select', options: ['Very High', 'High', 'Medium', 'Low', 'Speculative'] },
                    { key: 'targetMarket', label: 'Target Market Segment', type: 'text' },
                    { key: 'marketSize', label: 'Market Size Description *', type: 'textarea' },
                    { key: 'marketGrowthRate', label: 'Annual Market Growth Rate (%)', type: 'number' },
                    { key: 'customerPipeline', label: 'Customer Pipeline Status', type: 'select', options: ['Binding Off-take', 'LOI', 'In Negotiation', 'Prospective', 'None'] },
                    { key: 'confirmedCustomers', label: 'Number of Confirmed Customers', type: 'number' },
                    { key: 'competitivePosition', label: 'Competitive Position *', type: 'select', options: ['Market Leader', 'Strong', 'Moderate', 'Weak', 'New Entrant'] },
                    { key: 'keyCompetitors', label: 'Key Competitors', type: 'textarea' },
                    { key: 'pricingPressure', label: 'Pricing Pressure', type: 'select', options: ['Increasing', 'Stable', 'Decreasing'] },
                    { key: 'marketEntryBarriers', label: 'Market Entry Barriers', type: 'select', options: ['High', 'Medium', 'Low'] },
                    { key: 'regulatoryTailwinds', label: 'Regulatory Tailwinds', type: 'textarea', placeholder: 'EU Battery Reg, IRA, local content etc.' },
                  ]}
                />
              </TabsContent>

              {/* Tab 3: Site & Location */}
              <TabsContent value="tab3">
                <SiteLocationTab projectId={projectId} study={selectedStudy} onSave={(v) => saveTab('tab3Data', v)} />
              </TabsContent>

              {/* Tab 4: Product & Capacity */}
              <TabsContent value="tab4">
                <StudyTab title="Product & Capacity Planning" study={selectedStudy} tabKey="tab4Data" onSave={(v) => saveTab('tab4Data', v)}
                  fields={[
                    { key: 'totalCapacityGwh', label: 'Total Plant Capacity (GWh/year) *', type: 'number' },
                    { key: 'productionLines', label: 'Number of Production Lines', type: 'number' },
                    { key: 'ppm', label: 'Parts Per Minute (PPM)', type: 'number' },
                    { key: 'operatingWeeks', label: 'Operating Weeks per Year', type: 'number' },
                    { key: 'operatingHours', label: 'Operating Hours per Day', type: 'number' },
                    { key: 'operatingModel', label: 'Operating Model', type: 'select', options: ['24/7 Continuous', '2-Shift', '3-Shift', 'Single Shift'] },
                    { key: 'targetAvailability', label: 'Target Availability (%)', type: 'number' },
                    { key: 'initialYield', label: 'Target Yield — Initial (%)', type: 'number' },
                    { key: 'matureYield', label: 'Target Yield — Mature (%)', type: 'number' },
                    { key: 'rampDuration', label: 'Ramp-up Duration (months)', type: 'number' },
                    { key: 'cellChemistry', label: 'Cell Chemistry', type: 'select', options: ['LMO', 'LMNO', 'NMC', 'LFP', 'NCA', 'Sodium-Ion', 'Solid-State'] },
                    { key: 'cellEnergy', label: 'Cell Energy (Wh)', type: 'number' },
                  ]}
                />
              </TabsContent>

              {/* Tab 5: Technical Assessment */}
              <TabsContent value="tab5">
                <StudyTab title="Technical Assessment" study={selectedStudy} tabKey="tab5Data" onSave={(v) => saveTab('tab5Data', v)}
                  fields={[
                    { key: 'trl', label: 'Technology Readiness Level (TRL) *', type: 'select', options: ['1','2','3','4','5','6','7','8','9'] },
                    { key: 'mrl', label: 'Manufacturing Readiness Level (MRL)', type: 'select', options: ['1','2','3','4','5','6','7','8','9','10'] },
                    { key: 'factoryLayoutStatus', label: 'Factory Layout Status', type: 'select', options: ['Not Started', 'Concept', 'Preliminary', 'Detailed', 'Frozen'] },
                    { key: 'totalGia', label: 'Total Plant GIA (m²)', type: 'number' },
                    { key: 'cleanroomReqs', label: 'Cleanroom / Dryroom Requirements', type: 'textarea' },
                    { key: 'designStatus', label: 'Basis of Design Status', type: 'select', options: ['Not Started', 'Draft', 'Under Review', 'Approved', 'Frozen'] },
                    { key: 'electricPower', label: 'Required Electric Power (kW)', type: 'number' },
                    { key: 'compressedAir', label: 'Compressed Air (m³/h)', type: 'number' },
                    { key: 'coolingWater', label: 'Cooling Water (m³/h)', type: 'number' },
                    { key: 'deionisedWater', label: 'DI Water (m³/h)', type: 'number' },
                    { key: 'wastewaterDischarge', label: 'Wastewater Discharge (L/min)', type: 'number' },
                    { key: 'nitrogen', label: 'Nitrogen (m³/h)', type: 'number' },
                  ]}
                />
              </TabsContent>

              {/* Tab 6: Financial Assessment */}
              <TabsContent value="tab6">
                <FinancialTab study={selectedStudy} linkedFinanceModel={linkedFinanceModel} totalCapex={totalCapex}
                  onSave={(v) => updateMutation.mutate({ id: selectedStudy.id, data: v })}
                  onNavigateToFinanceModel={() => navigate(createPageUrl(`FinanceModel?id=${projectId}`))} />
              </TabsContent>

              {/* Tab 7: Headcount & Labour */}
              <TabsContent value="tab7">
                <StudyTab title="Headcount & Labour" study={selectedStudy} tabKey="tab7Data" onSave={(v) => saveTab('tab7Data', v)}
                  fields={[
                    { key: 'directFte', label: 'Direct Production FTE', type: 'number' },
                    { key: 'semiDirectFte', label: 'Semi-Direct FTE', type: 'number' },
                    { key: 'indirectFte', label: 'Indirect Operational FTE', type: 'number' },
                    { key: 'gnaFte', label: 'G&A FTE', type: 'number' },
                    { key: 'totalLabourCostEurM', label: 'Total Labour Cost (€M/year)', type: 'number' },
                    { key: 'shiftAllowancePct', label: 'Shift Allowance (%)', type: 'number', placeholder: '20' },
                    { key: 'socialPensionPct', label: 'Social/Pension (%)', type: 'number', placeholder: '23.6' },
                    { key: 'wageInflationPct', label: 'Wage Inflation (% p.a.)', type: 'number', placeholder: '2.5' },
                    { key: 'workforceRisk', label: 'Workforce Availability Risk', type: 'select', options: ['Low', 'Medium', 'High', 'Critical'] },
                    { key: 'recruitmentStrategy', label: 'Recruitment Strategy', type: 'textarea' },
                    { key: 'hiringRisks', label: 'Key Hiring Risks', type: 'textarea' },
                  ]}
                />
              </TabsContent>

              {/* Tab 8: Execution Plan */}
              <TabsContent value="tab8">
                <StudyTab title="Execution Plan" study={selectedStudy} tabKey="tab8Data" onSave={(v) => saveTab('tab8Data', v)}
                  fields={[
                    { key: 'teamCapability', label: 'Team Capability *', type: 'select', options: ['Strong', 'Adequate', 'Developing', 'Insufficient'] },
                    { key: 'partnershipStatus', label: 'Partnership Status', type: 'select', options: ['Established', 'In Discussion', 'None'] },
                    { key: 'epcStrategy', label: 'EPC/EPCM Strategy', type: 'select', options: ['Full EPC', 'EPCM', 'Self-Managed', 'Hybrid'] },
                    { key: 'epcmCostPct', label: 'EPCM Cost (%)', type: 'number' },
                    { key: 'scheduleRealism', label: 'Schedule Realism *', type: 'select', options: ['Conservative', 'Achievable', 'Aggressive'] },
                    { key: 'scheduleConfidence', label: 'Schedule Confidence', type: 'select', options: ['High >80%', 'Medium 50-80%', 'Low <50%'] },
                    { key: 'estimatedDurationMonths', label: 'Estimated Duration (months)', type: 'number' },
                    { key: 'nominationDate', label: 'Nomination / Kick-off', type: 'date' },
                    { key: 'constructionStart', label: 'Construction Start', type: 'date' },
                    { key: 'sopDate', label: 'Start of Production (SOP)', type: 'date' },
                    { key: 'fullProductionDate', label: 'Full Production Rate Date', type: 'date' },
                  ]}
                />
              </TabsContent>

              {/* Tab 9: Risk Assessment */}
              <TabsContent value="tab9">
                <StudyTab title="Risk Assessment" study={selectedStudy} tabKey="tab9Data" onSave={(v) => saveTab('tab9Data', v)}
                  fields={[
                    { key: 'overallRiskLevel', label: 'Overall Risk Level *', type: 'select', options: ['Low', 'Medium', 'High', 'Critical'] },
                    { key: 'keyRisks', label: 'Key Risks *', type: 'textarea', rows: 4 },
                    { key: 'riskMitigation', label: 'Risk Mitigation Plan', type: 'textarea', rows: 4 },
                    { key: 'capexRisk', label: 'CAPEX Overrun Risk', type: 'select', options: ['Low', 'Medium', 'High'] },
                    { key: 'scheduleRisk', label: 'Schedule Risk', type: 'select', options: ['Low', 'Medium', 'High'] },
                    { key: 'revenueRisk', label: 'Revenue Risk', type: 'select', options: ['Low', 'Medium', 'High'] },
                    { key: 'regulatoryRisk', label: 'Regulatory/Permitting Risk', type: 'select', options: ['Low', 'Medium', 'High'] },
                    { key: 'criticalRiskCount', label: 'Critical Risks Count', type: 'number' },
                  ]}
                />
              </TabsContent>

              {/* Tab 10: Compliance */}
              <TabsContent value="tab10">
                <StudyTab title="Compliance & Sustainability" study={selectedStudy} tabKey="tab10Data" onSave={(v) => saveTab('tab10Data', v)}
                  fields={[
                    { key: 'regulatoryStatus', label: 'Regulatory Compliance Status *', type: 'select', options: ['Compliant', 'Pending Approval', 'Non-Compliant'] },
                    { key: 'permitsRequired', label: 'Key Permits Required', type: 'textarea' },
                    { key: 'permittingTimeline', label: 'Permitting Timeline (months)', type: 'number' },
                    { key: 'environmentalImpact', label: 'Environmental Impact Level', type: 'select', options: ['Low', 'Medium', 'High'] },
                    { key: 'eiaStatus', label: 'EIA Status', type: 'select', options: ['Not Required', 'Planned', 'In Progress', 'Complete', 'Approved'] },
                    { key: 'sustainabilityScore', label: 'Sustainability Score (0-100)', type: 'number' },
                    { key: 'carbonTarget', label: 'Carbon Footprint Target (tCO2e/year)', type: 'number' },
                    { key: 'renewableEnergyPct', label: 'Renewable Energy (%)', type: 'number' },
                    { key: 'euBatteryRegCompliance', label: 'EU Battery Reg Compliance', type: 'select', options: ['Compliant', 'In Progress', 'Not Started', 'N/A'] },
                    { key: 'batteryPassport', label: 'Battery Passport Readiness', type: 'select', options: ['Ready', 'In Progress', 'Not Started'] },
                    { key: 'circularEconomy', label: 'Circular Economy Plan', type: 'select', options: ['In Place', 'In Development', 'Not Started'] },
                    { key: 'communityImpact', label: 'Community Impact', type: 'select', options: ['Positive', 'Neutral', 'Negative', 'Under Review'] },
                  ]}
                />
              </TabsContent>

              {/* Tab 11: Go/No-Go Decision */}
              <TabsContent value="tab11">
                <GoNoGoTab study={selectedStudy} linkedFinanceModel={linkedFinanceModel}
                  onSave={(v) => updateMutation.mutate({ id: selectedStudy.id, data: v })} />
              </TabsContent>
            </Tabs>

            {/* Saved Studies List */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {studies.map(s => (
                <div key={s.id} onClick={() => setSelectedStudyId(s.id)}
                  className="p-3 rounded-lg border cursor-pointer"
                  style={{ background: s.id === selectedStudy?.id ? 'rgba(0,168,150,0.1)' : 'rgba(15,23,42,0.5)', borderColor: s.id === selectedStudy?.id ? 'rgba(0,168,150,0.4)' : 'rgba(202,220,252,0.1)' }}>
                  <div className="flex justify-between items-start">
                    <div className="font-medium text-sm" style={{ color: '#CADCFC' }}>{s.studyName}</div>
                    {s.recommendation && <span className={`text-xs px-1.5 py-0.5 rounded text-white ${REC_COLORS[s.recommendation]}`}>{s.recommendation?.split(' ')[0]}</span>}
                  </div>
                  <div className="text-xs mt-1" style={{ color: '#94A3B8' }}>{s.studyMaturity} · {s.studyDate}</div>
                  {s.npvEurM != null && <div className="text-xs mt-1" style={{ color: s.npvEurM >= 0 ? '#10B981' : '#EF4444' }}>NPV: {fmtM(s.npvEurM)}</div>}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Generic tab component
function StudyTab({ title, study, tabKey, onSave, fields }) {
  const existing = useMemo(() => {
    if (!study?.[tabKey]) return {};
    try { return JSON.parse(study[tabKey]); } catch { return {}; }
  }, [study, tabKey]);

  const [form, setForm] = useState(existing);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <Card style={{ background: 'rgba(30, 39, 97, 0.4)', borderColor: 'rgba(202, 220, 252, 0.1)' }}>
      <CardHeader>
        <CardTitle style={{ color: '#CADCFC' }}>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.map(f => (
            <div key={f.key} className={f.type === 'textarea' ? 'sm:col-span-2' : ''}>
              <Label style={{ color: '#94A3B8' }}>{f.label}</Label>
              {f.type === 'textarea' ? (
                <Textarea value={form[f.key] ?? f.defaultValue ?? ''} onChange={e => set(f.key, e.target.value)}
                  rows={f.rows || 3} placeholder={f.placeholder}
                  style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }} />
              ) : f.type === 'select' ? (
                <Select value={form[f.key] ?? f.defaultValue ?? ''} onValueChange={v => set(f.key, v)}>
                  <SelectTrigger style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {f.options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <Input type={f.type} value={form[f.key] ?? f.defaultValue ?? ''} onChange={e => set(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }} />
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={() => onSave(form)} style={{ background: 'linear-gradient(135deg, #028090 0%, #00A896 100%)', color: '#F8FAFC' }}>
            <Save className="w-4 h-4 mr-2" /> Save Section
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Site & Location tab
function SiteLocationTab({ projectId, study, onSave }) {
  const { data: sites = [] } = useQuery({
    queryKey: ['candidateSites', projectId],
    queryFn: async () => {
      const assessments = await base44.entities.SiteAssessment.filter({ projectId });
      if (!assessments.length) return [];
      const allSites = await Promise.all(assessments.map(a => base44.entities.CandidateSite.filter({ assessmentId: a.id })));
      return allSites.flat();
    },
    enabled: !!projectId,
  });

  const selectedSite = sites.find(s => s.status === 'Selected') || sites[0];

  const existing = useMemo(() => {
    if (!study?.tab3Data) return {};
    try { return JSON.parse(study.tab3Data); } catch { return {}; }
  }, [study]);

  const [form, setForm] = useState(existing);

  return (
    <Card style={{ background: 'rgba(30, 39, 97, 0.4)', borderColor: 'rgba(202, 220, 252, 0.1)' }}>
      <CardHeader><CardTitle style={{ color: '#CADCFC' }}>Site & Location Assessment</CardTitle></CardHeader>
      <CardContent>
        {selectedSite && (
          <div className="mb-4 px-3 py-2 rounded-lg text-sm" style={{ background: 'rgba(0,168,150,0.1)', border: '1px solid rgba(0,168,150,0.3)', color: '#00A896' }}>
            📍 Site data linked from Site Selection: <strong>{selectedSite.siteName}</strong>, {selectedSite.siteAddress}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><Label style={{ color: '#94A3B8' }}>Site Suitability Assessment</Label>
            <Select value={form.siteSuitability || ''} onValueChange={v => setForm({ ...form, siteSuitability: v })}>
              <SelectTrigger style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }}><SelectValue /></SelectTrigger>
              <SelectContent>{['Excellent', 'Good', 'Acceptable', 'Marginal', 'Unsuitable'].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label style={{ color: '#94A3B8' }}>Selected Site</Label>
            <Input value={form.siteName || selectedSite?.siteName || ''} onChange={e => setForm({ ...form, siteName: e.target.value })}
              style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }} />
          </div>
          <div className="sm:col-span-2"><Label style={{ color: '#94A3B8' }}>Site-Specific Risks</Label>
            <Textarea value={form.siteRisks || ''} onChange={e => setForm({ ...form, siteRisks: e.target.value })} rows={3}
              style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }} />
          </div>
          <div className="sm:col-span-2"><Label style={{ color: '#94A3B8' }}>Site-Specific Opportunities</Label>
            <Textarea value={form.siteOpportunities || ''} onChange={e => setForm({ ...form, siteOpportunities: e.target.value })} rows={3}
              style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }} />
          </div>
          <div className="sm:col-span-2"><Label style={{ color: '#94A3B8' }}>Alternative Sites Considered</Label>
            <Textarea value={form.alternativeSites || ''} onChange={e => setForm({ ...form, alternativeSites: e.target.value })} rows={2}
              style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }} />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={() => onSave(form)} style={{ background: 'linear-gradient(135deg, #028090 0%, #00A896 100%)', color: '#F8FAFC' }}>
            <Save className="w-4 h-4 mr-2" /> Save Section
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Financial Assessment tab
function FinancialTab({ study, linkedFinanceModel, totalCapex, onSave, onNavigateToFinanceModel }) {
  const [form, setForm] = useState({
    capexEurM: study?.capexEurM || '',
    annualOpexEurM: study?.annualOpexEurM || '',
    annualRevenueEurM: study?.annualRevenueEurM || '',
    discountRate: study?.discountRate || 8.0,
    projectLifeYears: study?.projectLifeYears || 15,
    grantEurM: '',
  });

  const calcFinancials = () => {
    const { capexEurM, annualOpexEurM, annualRevenueEurM, discountRate, projectLifeYears } = form;
    if (!capexEurM || !annualOpexEurM || !annualRevenueEurM) return null;
    const r = parseFloat(discountRate) / 100;
    const ncf = (parseFloat(annualRevenueEurM) - parseFloat(annualOpexEurM)) * 0.75;
    let npv = -parseFloat(capexEurM);
    for (let t = 1; t <= parseInt(projectLifeYears); t++) npv += ncf / Math.pow(1 + r, t);
    const payback = ncf > 0 ? parseFloat(capexEurM) / ncf : null;
    let irr = 0;
    for (let rate = 0.001; rate <= 0.5; rate += 0.001) {
      let t = -parseFloat(capexEurM);
      for (let y = 1; y <= parseInt(projectLifeYears); y++) t += ncf / Math.pow(1 + rate, y);
      if (t <= 0) { irr = rate * 100; break; }
    }
    return { npv, irr, payback };
  };

  const handleSave = () => {
    const f = calcFinancials();
    onSave({ capexEurM: parseFloat(form.capexEurM) || null, annualOpexEurM: parseFloat(form.annualOpexEurM) || null, annualRevenueEurM: parseFloat(form.annualRevenueEurM) || null, discountRate: parseFloat(form.discountRate), projectLifeYears: parseInt(form.projectLifeYears), npvEurM: f?.npv || null, irrPercent: f?.irr || null, paybackYears: f?.payback || null });
  };

  const f = calcFinancials();

  return (
    <Card style={{ background: 'rgba(30, 39, 97, 0.4)', borderColor: 'rgba(202, 220, 252, 0.1)' }}>
      <CardHeader><CardTitle style={{ color: '#CADCFC' }}>Financial Assessment</CardTitle></CardHeader>
      <CardContent>
        {linkedFinanceModel ? (
          <div className="space-y-4">
            <div className="px-3 py-2 rounded-lg text-sm" style={{ background: 'rgba(0,168,150,0.1)', border: '1px solid rgba(0,168,150,0.3)', color: '#00A896' }}>
              🔗 Financial data powered by Finance Model: <strong>{linkedFinanceModel.modelName}</strong>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                ['Total CAPEX', fmtM(totalCapex), '#60A5FA'],
                ['NPV', fmtM(study?.npvEurM), study?.npvEurM >= 0 ? '#10B981' : '#EF4444'],
                ['Payback', study?.paybackYears ? `${study.paybackYears.toFixed(1)} yrs` : '—', '#CADCFC'],
                ['IRR', study?.irrPercent ? `${study.irrPercent.toFixed(1)}%` : '—', '#A78BFA'],
              ].map(([label, val, color]) => (
                <div key={label} className="p-3 rounded text-center" style={{ background: 'rgba(15,23,42,0.5)' }}>
                  <div className="text-lg font-bold" style={{ color }}>{val}</div>
                  <div className="text-xs" style={{ color: '#94A3B8' }}>{label}</div>
                </div>
              ))}
            </div>
            <Button onClick={onNavigateToFinanceModel} style={{ background: 'rgba(30,39,97,0.5)', color: '#CADCFC', border: '1px solid rgba(202,220,252,0.2)' }}>
              Open Full Finance Model →
            </Button>
          </div>
        ) : (
          <div>
            <div className="mb-4 text-xs px-3 py-2 rounded" style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)' }}>
              ⚠️ Simplified pre-feasibility NPV (does not account for debt structure, working capital, or terminal value).
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { key: 'capexEurM', label: 'Total CAPEX (€M) *' },
                { key: 'annualOpexEurM', label: 'Annual OPEX (€M) *' },
                { key: 'annualRevenueEurM', label: 'Annual Revenue (€M) *' },
                { key: 'grantEurM', label: 'Grant Amount (€M)' },
                { key: 'discountRate', label: 'Discount Rate (%)' },
                { key: 'projectLifeYears', label: 'Project Life (years)' },
              ].map(field => (
                <div key={field.key}>
                  <Label style={{ color: '#94A3B8' }}>{field.label}</Label>
                  <Input type="number" value={form[field.key]} onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                    style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }} />
                </div>
              ))}
            </div>
            {f && (
              <div className="mt-4 grid grid-cols-3 gap-4 p-4 rounded-lg" style={{ background: f.npv >= 0 ? 'rgba(0,168,150,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${f.npv >= 0 ? 'rgba(0,168,150,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
                <div className="text-center"><div className="text-xl font-bold" style={{ color: f.npv >= 0 ? '#10B981' : '#EF4444' }}>€{f.npv.toFixed(1)}M</div><div className="text-xs" style={{ color: '#94A3B8' }}>NPV</div></div>
                <div className="text-center"><div className="text-xl font-bold" style={{ color: '#CADCFC' }}>{f.irr.toFixed(1)}%</div><div className="text-xs" style={{ color: '#94A3B8' }}>IRR</div></div>
                <div className="text-center"><div className="text-xl font-bold" style={{ color: '#CADCFC' }}>{f.payback ? `${f.payback.toFixed(1)} yrs` : 'N/A'}</div><div className="text-xs" style={{ color: '#94A3B8' }}>Payback</div></div>
              </div>
            )}
            <div className="mt-4 flex justify-end">
              <Button onClick={handleSave} style={{ background: 'linear-gradient(135deg, #028090 0%, #00A896 100%)', color: '#F8FAFC' }}>
                <Save className="w-4 h-4 mr-2" /> Save Financial Data
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Go / No-Go Decision tab
function GoNoGoTab({ study, linkedFinanceModel, onSave }) {
  const [form, setForm] = useState({
    recommendation: study?.recommendation || 'Further Study Required',
    confidenceLevel: '',
    keyConditions: '',
    nextSteps: '',
    decisionDate: '',
    decisionAuthority: '',
    approvedBy: '',
  });

  const recColor = { 'Proceed': '#10B981', 'Proceed with Conditions': '#F59E0B', 'Further Study Required': '#F97316', 'Do Not Proceed': '#EF4444' };

  const handleSave = () => onSave({ recommendation: form.recommendation, conditionsRemarks: form.keyConditions, approvalStatus: 'Under Review', tab11Data: JSON.stringify(form) });

  return (
    <Card style={{ background: 'rgba(30, 39, 97, 0.4)', borderColor: 'rgba(202, 220, 252, 0.1)' }}>
      <CardHeader><CardTitle style={{ color: '#CADCFC' }}>Go / No-Go Decision</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label style={{ color: '#94A3B8' }}>Overall Recommendation *</Label>
            <Select value={form.recommendation} onValueChange={v => setForm({ ...form, recommendation: v })}>
              <SelectTrigger style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }}><SelectValue /></SelectTrigger>
              <SelectContent>
                {['Proceed', 'Proceed with Conditions', 'Further Study Required', 'Do Not Proceed'].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Recommendation Banner */}
          <div className="p-6 rounded-xl text-center" style={{ background: `${recColor[form.recommendation]}20`, border: `2px solid ${recColor[form.recommendation]}` }}>
            <div className="text-3xl font-bold" style={{ color: recColor[form.recommendation] }}>{form.recommendation}</div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label style={{ color: '#94A3B8' }}>Confidence Level</Label>
              <Select value={form.confidenceLevel} onValueChange={v => setForm({ ...form, confidenceLevel: v })}>
                <SelectTrigger style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }}><SelectValue /></SelectTrigger>
                <SelectContent>{['High', 'Medium', 'Low'].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label style={{ color: '#94A3B8' }}>Decision Date</Label>
              <Input type="date" value={form.decisionDate} onChange={e => setForm({ ...form, decisionDate: e.target.value })} style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }} />
            </div>
            <div>
              <Label style={{ color: '#94A3B8' }}>Decision Authority</Label>
              <Input value={form.decisionAuthority} onChange={e => setForm({ ...form, decisionAuthority: e.target.value })} style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }} />
            </div>
            <div>
              <Label style={{ color: '#94A3B8' }}>Approved By</Label>
              <Input value={form.approvedBy} onChange={e => setForm({ ...form, approvedBy: e.target.value })} style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }} />
            </div>
          </div>
          <div>
            <Label style={{ color: '#94A3B8' }}>Key Conditions</Label>
            <Textarea value={form.keyConditions} onChange={e => setForm({ ...form, keyConditions: e.target.value })} rows={3} style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }} />
          </div>
          <div>
            <Label style={{ color: '#94A3B8' }}>Next Steps</Label>
            <Textarea value={form.nextSteps} onChange={e => setForm({ ...form, nextSteps: e.target.value })} rows={3} style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }} />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSave} style={{ background: 'linear-gradient(135deg, #028090 0%, #00A896 100%)', color: '#F8FAFC' }}>
              <Save className="w-4 h-4 mr-2" /> Save Decision
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}