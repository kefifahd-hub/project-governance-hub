import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, FileText, TrendingUp, Users, Calendar, Shield, Leaf, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { createPageUrl } from '../utils';

export default function FeasibilityStudy() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('id');
  const queryClient = useQueryClient();

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const result = await base44.entities.Project.filter({ id: projectId });
      return result[0];
    },
    enabled: !!projectId
  });

  const { data: studies = [] } = useQuery({
    queryKey: ['feasibilityStudies', projectId],
    queryFn: () => base44.entities.FeasibilityStudy.filter({ projectId }, '-created_date'),
    enabled: !!projectId
  });

  const [formData, setFormData] = useState({
    studyName: '',
    studyDate: new Date().toISOString().split('T')[0],
    executiveSummary: '',
    marketDemand: 'Medium',
    marketSize: '',
    competitivePosition: 'Moderate',
    technicalReadiness: 'Proven',
    infrastructureAvailability: 'Available',
    resourceAvailability: 'Identified',
    capexEurM: '',
    annualOpexEurM: '',
    annualRevenueEurM: '',
    discountRate: 8.0,
    projectLifeYears: 15,
    teamCapability: 'Adequate',
    partnershipStatus: 'In Discussion',
    scheduleRealism: 'Achievable',
    estimatedDurationMonths: '',
    regulatoryCompliance: 'Pending Approval',
    environmentalImpact: 'Medium',
    sustainabilityScore: 50,
    overallRiskLevel: 'Medium',
    keyRisks: '',
    recommendation: 'Further Study Required',
    conditionsRemarks: ''
  });

  const calculateFinancials = () => {
    const { capexEurM, annualOpexEurM, annualRevenueEurM, discountRate, projectLifeYears } = formData;
    
    if (!capexEurM || !annualOpexEurM || !annualRevenueEurM) return null;

    const discountRateDecimal = parseFloat(discountRate) / 100;
    const annualNetCashflow = parseFloat(annualRevenueEurM) - parseFloat(annualOpexEurM);
    
    let npv = -parseFloat(capexEurM);
    for (let year = 1; year <= parseInt(projectLifeYears); year++) {
      npv += annualNetCashflow / Math.pow(1 + discountRateDecimal, year);
    }

    const payback = annualNetCashflow > 0 ? parseFloat(capexEurM) / annualNetCashflow : 0;

    // Simple IRR calculation
    let irr = 0;
    for (let rate = 0; rate <= 0.5; rate += 0.001) {
      let testNPV = -parseFloat(capexEurM);
      for (let year = 1; year <= parseInt(projectLifeYears); year++) {
        testNPV += annualNetCashflow / Math.pow(1 + rate, year);
      }
      if (testNPV <= 0) {
        irr = rate * 100;
        break;
      }
    }

    return {
      npvEurM: npv,
      irrPercent: irr,
      paybackYears: payback
    };
  };

  const saveStudyMutation = useMutation({
    mutationFn: (data) => {
      const financials = calculateFinancials();
      return base44.entities.FeasibilityStudy.create({
        ...data,
        projectId,
        ...financials
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feasibilityStudies', projectId] });
      setFormData({
        studyName: '',
        studyDate: new Date().toISOString().split('T')[0],
        executiveSummary: '',
        marketDemand: 'Medium',
        marketSize: '',
        competitivePosition: 'Moderate',
        technicalReadiness: 'Proven',
        infrastructureAvailability: 'Available',
        resourceAvailability: 'Identified',
        capexEurM: '',
        annualOpexEurM: '',
        annualRevenueEurM: '',
        discountRate: 8.0,
        projectLifeYears: 15,
        teamCapability: 'Adequate',
        partnershipStatus: 'In Discussion',
        scheduleRealism: 'Achievable',
        estimatedDurationMonths: '',
        regulatoryCompliance: 'Pending Approval',
        environmentalImpact: 'Medium',
        sustainabilityScore: 50,
        overallRiskLevel: 'Medium',
        keyRisks: '',
        recommendation: 'Further Study Required',
        conditionsRemarks: ''
      });
    }
  });

  const getRecommendationColor = (rec) => {
    switch (rec) {
      case 'Proceed': return 'bg-green-500';
      case 'Proceed with Conditions': return 'bg-yellow-500';
      case 'Further Study Required': return 'bg-orange-500';
      case 'Do Not Proceed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const financials = calculateFinancials();

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
          <Button variant="ghost" onClick={() => navigate(createPageUrl(`ProjectDashboard?id=${projectId}`))} className="mb-4" style={{ color: '#CADCFC' }}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Back to Tools</span>
            <span className="sm:hidden">Back</span>
          </Button>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: '#CADCFC' }}>Feasibility Study</h1>
              <p className="mt-2 text-sm sm:text-base" style={{ color: '#94A3B8' }}>{project.projectName}</p>
            </div>
            <Button 
              onClick={() => saveStudyMutation.mutate(formData)}
              disabled={!formData.studyName}
              className="w-full sm:w-auto"
              style={{ background: 'linear-gradient(135deg, #028090 0%, #00A896 100%)', color: '#F8FAFC' }}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Study
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.1)' }}>
              <CardHeader>
                <CardTitle style={{ color: '#CADCFC' }}>New Feasibility Assessment</CardTitle>
                <CardDescription style={{ color: '#94A3B8' }}>Complete all sections for comprehensive analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid grid-cols-3 sm:grid-cols-6 mb-6">
                    <TabsTrigger value="basic">Basic</TabsTrigger>
                    <TabsTrigger value="market">Market</TabsTrigger>
                    <TabsTrigger value="technical">Technical</TabsTrigger>
                    <TabsTrigger value="financial">Financial</TabsTrigger>
                    <TabsTrigger value="execution">Execution</TabsTrigger>
                    <TabsTrigger value="compliance">Compliance</TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="space-y-4">
                    <div>
                      <Label style={{ color: '#94A3B8' }}>Study Name *</Label>
                      <Input
                        value={formData.studyName}
                        onChange={(e) => setFormData({ ...formData, studyName: e.target.value })}
                        placeholder="e.g., Q1 2026 Feasibility Assessment"
                        style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
                      />
                    </div>
                    <div>
                      <Label style={{ color: '#94A3B8' }}>Study Date</Label>
                      <Input
                        type="date"
                        value={formData.studyDate}
                        onChange={(e) => setFormData({ ...formData, studyDate: e.target.value })}
                        style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
                      />
                    </div>
                    <div>
                      <Label style={{ color: '#94A3B8' }}>Executive Summary</Label>
                      <Textarea
                        value={formData.executiveSummary}
                        onChange={(e) => setFormData({ ...formData, executiveSummary: e.target.value })}
                        rows={6}
                        placeholder="Brief overview of the project feasibility..."
                        style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="market" className="space-y-4">
                    <div>
                      <Label style={{ color: '#94A3B8' }}>Market Demand</Label>
                      <Select value={formData.marketDemand} onValueChange={(value) => setFormData({ ...formData, marketDemand: value })}>
                        <SelectTrigger style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="High">High</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="Low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label style={{ color: '#94A3B8' }}>Market Size Description</Label>
                      <Textarea
                        value={formData.marketSize}
                        onChange={(e) => setFormData({ ...formData, marketSize: e.target.value })}
                        rows={3}
                        placeholder="Describe the total addressable market..."
                        style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
                      />
                    </div>
                    <div>
                      <Label style={{ color: '#94A3B8' }}>Competitive Position</Label>
                      <Select value={formData.competitivePosition} onValueChange={(value) => setFormData({ ...formData, competitivePosition: value })}>
                        <SelectTrigger style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Strong">Strong</SelectItem>
                          <SelectItem value="Moderate">Moderate</SelectItem>
                          <SelectItem value="Weak">Weak</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TabsContent>

                  <TabsContent value="technical" className="space-y-4">
                    <div>
                      <Label style={{ color: '#94A3B8' }}>Technology Readiness</Label>
                      <Select value={formData.technicalReadiness} onValueChange={(value) => setFormData({ ...formData, technicalReadiness: value })}>
                        <SelectTrigger style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Proven">Proven</SelectItem>
                          <SelectItem value="Emerging">Emerging</SelectItem>
                          <SelectItem value="Experimental">Experimental</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label style={{ color: '#94A3B8' }}>Infrastructure Availability</Label>
                      <Select value={formData.infrastructureAvailability} onValueChange={(value) => setFormData({ ...formData, infrastructureAvailability: value })}>
                        <SelectTrigger style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Available">Available</SelectItem>
                          <SelectItem value="Partially Available">Partially Available</SelectItem>
                          <SelectItem value="Not Available">Not Available</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label style={{ color: '#94A3B8' }}>Resource Availability</Label>
                      <Select value={formData.resourceAvailability} onValueChange={(value) => setFormData({ ...formData, resourceAvailability: value })}>
                        <SelectTrigger style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Secured">Secured</SelectItem>
                          <SelectItem value="Identified">Identified</SelectItem>
                          <SelectItem value="Uncertain">Uncertain</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TabsContent>

                  <TabsContent value="financial" className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label style={{ color: '#94A3B8' }}>CAPEX (€M)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={formData.capexEurM}
                          onChange={(e) => setFormData({ ...formData, capexEurM: e.target.value })}
                          style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
                        />
                      </div>
                      <div>
                        <Label style={{ color: '#94A3B8' }}>Annual OPEX (€M)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={formData.annualOpexEurM}
                          onChange={(e) => setFormData({ ...formData, annualOpexEurM: e.target.value })}
                          style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
                        />
                      </div>
                      <div>
                        <Label style={{ color: '#94A3B8' }}>Annual Revenue (€M)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={formData.annualRevenueEurM}
                          onChange={(e) => setFormData({ ...formData, annualRevenueEurM: e.target.value })}
                          style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
                        />
                      </div>
                      <div>
                        <Label style={{ color: '#94A3B8' }}>Discount Rate (%)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={formData.discountRate}
                          onChange={(e) => setFormData({ ...formData, discountRate: e.target.value })}
                          style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
                        />
                      </div>
                      <div>
                        <Label style={{ color: '#94A3B8' }}>Project Life (years)</Label>
                        <Input
                          type="number"
                          value={formData.projectLifeYears}
                          onChange={(e) => setFormData({ ...formData, projectLifeYears: e.target.value })}
                          style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
                        />
                      </div>
                    </div>

                    {financials && (
                      <div className="mt-6 p-4 rounded-lg" style={{ background: 'rgba(0, 168, 150, 0.1)', border: '1px solid rgba(0, 168, 150, 0.3)' }}>
                        <h4 className="font-semibold mb-3" style={{ color: '#CADCFC' }}>Calculated Metrics</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <div className="text-xs mb-1" style={{ color: '#94A3B8' }}>NPV</div>
                            <div className="text-xl font-bold" style={{ color: financials.npvEurM >= 0 ? '#10B981' : '#EF4444' }}>
                              €{financials.npvEurM.toFixed(1)}M
                            </div>
                          </div>
                          <div>
                            <div className="text-xs mb-1" style={{ color: '#94A3B8' }}>IRR</div>
                            <div className="text-xl font-bold" style={{ color: '#CADCFC' }}>{financials.irrPercent.toFixed(1)}%</div>
                          </div>
                          <div>
                            <div className="text-xs mb-1" style={{ color: '#94A3B8' }}>Payback</div>
                            <div className="text-xl font-bold" style={{ color: '#CADCFC' }}>{financials.paybackYears.toFixed(1)} yrs</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="execution" className="space-y-4">
                    <div>
                      <Label style={{ color: '#94A3B8' }}>Team Capability</Label>
                      <Select value={formData.teamCapability} onValueChange={(value) => setFormData({ ...formData, teamCapability: value })}>
                        <SelectTrigger style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Strong">Strong</SelectItem>
                          <SelectItem value="Adequate">Adequate</SelectItem>
                          <SelectItem value="Weak">Weak</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label style={{ color: '#94A3B8' }}>Partnership Status</Label>
                      <Select value={formData.partnershipStatus} onValueChange={(value) => setFormData({ ...formData, partnershipStatus: value })}>
                        <SelectTrigger style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Secured">Secured</SelectItem>
                          <SelectItem value="In Discussion">In Discussion</SelectItem>
                          <SelectItem value="Not Identified">Not Identified</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label style={{ color: '#94A3B8' }}>Schedule Realism</Label>
                      <Select value={formData.scheduleRealism} onValueChange={(value) => setFormData({ ...formData, scheduleRealism: value })}>
                        <SelectTrigger style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Achievable">Achievable</SelectItem>
                          <SelectItem value="Challenging">Challenging</SelectItem>
                          <SelectItem value="Unrealistic">Unrealistic</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label style={{ color: '#94A3B8' }}>Estimated Duration (months)</Label>
                      <Input
                        type="number"
                        value={formData.estimatedDurationMonths}
                        onChange={(e) => setFormData({ ...formData, estimatedDurationMonths: e.target.value })}
                        style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
                      />
                    </div>
                    <div>
                      <Label style={{ color: '#94A3B8' }}>Overall Risk Level</Label>
                      <Select value={formData.overallRiskLevel} onValueChange={(value) => setFormData({ ...formData, overallRiskLevel: value })}>
                        <SelectTrigger style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Low">Low</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="High">High</SelectItem>
                          <SelectItem value="Critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label style={{ color: '#94A3B8' }}>Key Risks</Label>
                      <Textarea
                        value={formData.keyRisks}
                        onChange={(e) => setFormData({ ...formData, keyRisks: e.target.value })}
                        rows={3}
                        placeholder="List main risks..."
                        style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="compliance" className="space-y-4">
                    <div>
                      <Label style={{ color: '#94A3B8' }}>Regulatory Compliance</Label>
                      <Select value={formData.regulatoryCompliance} onValueChange={(value) => setFormData({ ...formData, regulatoryCompliance: value })}>
                        <SelectTrigger style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Compliant">Compliant</SelectItem>
                          <SelectItem value="Pending Approval">Pending Approval</SelectItem>
                          <SelectItem value="Non-Compliant">Non-Compliant</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label style={{ color: '#94A3B8' }}>Environmental Impact</Label>
                      <Select value={formData.environmentalImpact} onValueChange={(value) => setFormData({ ...formData, environmentalImpact: value })}>
                        <SelectTrigger style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Low">Low</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="High">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label style={{ color: '#94A3B8' }}>Sustainability Score (0-100)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.sustainabilityScore}
                        onChange={(e) => setFormData({ ...formData, sustainabilityScore: e.target.value })}
                        style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
                      />
                    </div>
                    <div>
                      <Label style={{ color: '#94A3B8' }}>Final Recommendation</Label>
                      <Select value={formData.recommendation} onValueChange={(value) => setFormData({ ...formData, recommendation: value })}>
                        <SelectTrigger style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Proceed">Proceed</SelectItem>
                          <SelectItem value="Proceed with Conditions">Proceed with Conditions</SelectItem>
                          <SelectItem value="Further Study Required">Further Study Required</SelectItem>
                          <SelectItem value="Do Not Proceed">Do Not Proceed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label style={{ color: '#94A3B8' }}>Conditions / Remarks</Label>
                      <Textarea
                        value={formData.conditionsRemarks}
                        onChange={(e) => setFormData({ ...formData, conditionsRemarks: e.target.value })}
                        rows={4}
                        placeholder="Any conditions or additional remarks..."
                        style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.2)', color: '#F8FAFC' }}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Saved Studies */}
          <div>
            <Card style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.1)' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2" style={{ color: '#CADCFC' }}>
                  <FileText className="w-5 h-5" />
                  Saved Studies
                </CardTitle>
              </CardHeader>
              <CardContent>
                {studies.length === 0 ? (
                  <p className="text-sm text-center py-8" style={{ color: '#94A3B8' }}>No studies yet</p>
                ) : (
                  <div className="space-y-3">
                    {studies.map((study) => (
                      <div
                        key={study.id}
                        className="p-3 rounded-lg border"
                        style={{ background: 'rgba(15, 23, 42, 0.5)', borderColor: 'rgba(202, 220, 252, 0.1)' }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="font-medium text-sm mb-1" style={{ color: '#CADCFC' }}>{study.studyName}</div>
                            <div className="text-xs" style={{ color: '#94A3B8' }}>{new Date(study.studyDate).toLocaleDateString()}</div>
                          </div>
                          <Badge className={getRecommendationColor(study.recommendation)}>
                            {study.recommendation === 'Proceed' ? <CheckCircle className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
                          </Badge>
                        </div>
                        {study.npvEurM && (
                          <div className="flex items-center gap-4 text-xs mt-2">
                            <div>
                              <span style={{ color: '#94A3B8' }}>NPV: </span>
                              <span className="font-semibold" style={{ color: study.npvEurM >= 0 ? '#10B981' : '#EF4444' }}>
                                €{study.npvEurM.toFixed(1)}M
                              </span>
                            </div>
                            <div>
                              <span style={{ color: '#94A3B8' }}>IRR: </span>
                              <span className="font-semibold" style={{ color: '#CADCFC' }}>{study.irrPercent?.toFixed(1)}%</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}