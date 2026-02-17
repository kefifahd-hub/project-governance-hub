import { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { CATEGORIES, MEETS_COLORS } from './criteriaDefinitions';

export default function SiteQuestionnaireView({ sites, criteria, activeSiteId, onSelectSite, assessmentId }) {
  const qc = useQueryClient();
  const [openCategories, setOpenCategories] = useState({ ownership: true });

  const activeSite = sites.find(s => s.id === activeSiteId);
  const siteCriteria = useMemo(() => {
    const map = {};
    criteria.filter(c => c.siteId === activeSiteId).forEach(c => { map[c.criterionKey] = c; });
    return map;
  }, [criteria, activeSiteId]);

  const totalCriteria = CATEGORIES.reduce((s, cat) => s + cat.criteria.length, 0);
  const completedCriteria = Object.values(siteCriteria).filter(c => c.meetsRequirement && c.meetsRequirement !== 'TBD').length;

  const upsertMutation = useMutation({
    mutationFn: async ({ key, field, value, category, label, requirement }) => {
      const existing = siteCriteria[key];
      if (existing) {
        return base44.entities.SiteCriteria.update(existing.id, { [field]: value });
      } else {
        return base44.entities.SiteCriteria.create({
          siteId: activeSiteId,
          criterionKey: key,
          criterionLabel: label,
          category,
          requirement,
          [field]: value,
          meetsRequirement: field === 'meetsRequirement' ? value : 'TBD',
        });
      }
    },
    onSuccess: () => qc.invalidateQueries(['siteCriteria', assessmentId]),
  });

  const addSiteMutation = useMutation({
    mutationFn: () => base44.entities.CandidateSite.create({
      assessmentId,
      siteName: `Site ${sites.length + 1}`,
      status: 'Active Candidate',
    }),
    onSuccess: () => qc.invalidateQueries(['candidateSites', assessmentId]),
  });

  const toggleCategory = (id) => setOpenCategories(prev => ({ ...prev, [id]: !prev[id] }));

  if (!activeSiteId) return (
    <div className="text-center py-16" style={{ color: '#94A3B8' }}>
      Add a site to get started
    </div>
  );

  return (
    <div>
      {/* Site Tabs */}
      <div className="flex items-center gap-2 flex-wrap mb-6">
        {sites.map(site => (
          <button
            key={site.id}
            onClick={() => onSelectSite(site.id)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: activeSiteId === site.id ? 'rgba(0,168,150,0.2)' : 'rgba(30,39,97,0.4)',
              color: activeSiteId === site.id ? '#00A896' : '#94A3B8',
              border: `1px solid ${activeSiteId === site.id ? '#00A896' : 'rgba(202,220,252,0.1)'}`,
            }}
          >
            {site.siteName}
            {site.status === 'Selected' && ' ✅'}
          </button>
        ))}
        {sites.length < 4 && (
          <Button variant="ghost" size="sm" onClick={() => addSiteMutation.mutate()} style={{ color: '#00A896' }}>
            <Plus className="w-4 h-4 mr-1" /> Add Site
          </Button>
        )}
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-1">
          <span style={{ color: '#94A3B8' }}>{completedCriteria} of {totalCriteria} criteria completed</span>
          <span style={{ color: '#00A896' }}>{Math.round(completedCriteria / totalCriteria * 100)}%</span>
        </div>
        <div className="h-2 rounded-full" style={{ background: 'rgba(30,39,97,0.5)' }}>
          <div className="h-2 rounded-full transition-all" style={{ width: `${completedCriteria / totalCriteria * 100}%`, background: 'linear-gradient(90deg, #028090, #00A896)' }} />
        </div>
      </div>

      {/* Category Accordions */}
      <div className="space-y-3">
        {CATEGORIES.map(cat => (
          <Card key={cat.id} style={{ background: 'rgba(15,23,42,0.6)', borderColor: 'rgba(202,220,252,0.1)' }}>
            <button className="w-full text-left p-4 flex items-center justify-between" onClick={() => toggleCategory(cat.id)}>
              <div className="flex items-center gap-3">
                {openCategories[cat.id] ? <ChevronDown className="w-4 h-4" style={{ color: '#94A3B8' }} /> : <ChevronRight className="w-4 h-4" style={{ color: '#94A3B8' }} />}
                <span className="font-semibold" style={{ color: '#CADCFC' }}>{cat.label}</span>
                <Badge style={{ background: 'rgba(30,39,97,0.5)', color: '#94A3B8', fontSize: '0.7rem' }}>
                  Weight: {cat.weight}%
                </Badge>
              </div>
              <span className="text-xs" style={{ color: '#94A3B8' }}>
                {cat.criteria.filter(cr => siteCriteria[cr.key]?.meetsRequirement && siteCriteria[cr.key]?.meetsRequirement !== 'TBD').length}/{cat.criteria.length} done
              </span>
            </button>

            {openCategories[cat.id] && (
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderTop: '1px solid rgba(202,220,252,0.1)' }}>
                        <th className="px-4 py-2 text-left text-xs" style={{ color: '#94A3B8', width: '30%' }}>Criterion</th>
                        <th className="px-4 py-2 text-left text-xs" style={{ color: '#94A3B8', width: '15%' }}>Requirement</th>
                        <th className="px-4 py-2 text-left text-xs" style={{ color: '#94A3B8', width: '20%' }}>Response</th>
                        <th className="px-4 py-2 text-left text-xs" style={{ color: '#94A3B8', width: '15%' }}>Meets Req?</th>
                        <th className="px-4 py-2 text-left text-xs" style={{ color: '#94A3B8', width: '8%' }}>Score (0-10)</th>
                        <th className="px-4 py-2 text-left text-xs" style={{ color: '#94A3B8', width: '12%' }}>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cat.criteria.map(cr => {
                        const entry = siteCriteria[cr.key] || {};
                        return (
                          <tr key={cr.key} style={{ borderTop: '1px solid rgba(202,220,252,0.05)' }}>
                            <td className="px-4 py-2" style={{ color: '#CADCFC' }}>
                              <span className="text-xs" style={{ color: '#64748B' }}>{cr.key} </span>{cr.label}
                            </td>
                            <td className="px-4 py-2 text-xs" style={{ color: '#64748B' }}>{cr.requirement}</td>
                            <td className="px-4 py-2">
                              <Input
                                value={entry.response || ''}
                                onChange={e => upsertMutation.mutate({ key: cr.key, field: 'response', value: e.target.value, category: cat.id, label: cr.label, requirement: cr.requirement })}
                                className="h-7 text-xs"
                                style={{ background: 'rgba(30,39,97,0.4)', borderColor: 'rgba(202,220,252,0.15)', color: '#F8FAFC' }}
                              />
                            </td>
                            <td className="px-4 py-2">
                              <Select
                                value={entry.meetsRequirement || 'TBD'}
                                onValueChange={v => upsertMutation.mutate({ key: cr.key, field: 'meetsRequirement', value: v, category: cat.id, label: cr.label, requirement: cr.requirement })}
                              >
                                <SelectTrigger className="h-7 text-xs" style={{ background: 'rgba(30,39,97,0.4)', borderColor: 'rgba(202,220,252,0.15)', color: MEETS_COLORS[entry.meetsRequirement] ? undefined : '#94A3B8' }}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {['Yes', 'Partial', 'No', 'N/A', 'TBD'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="px-4 py-2">
                              <Input
                                type="number" min="0" max="10"
                                value={entry.score ?? ''}
                                onChange={e => upsertMutation.mutate({ key: cr.key, field: 'score', value: parseFloat(e.target.value) || 0, category: cat.id, label: cr.label, requirement: cr.requirement })}
                                className="h-7 text-xs w-16"
                                style={{ background: 'rgba(30,39,97,0.4)', borderColor: 'rgba(202,220,252,0.15)', color: '#F8FAFC' }}
                              />
                            </td>
                            <td className="px-4 py-2">
                              <Input
                                value={entry.remarks || ''}
                                onChange={e => upsertMutation.mutate({ key: cr.key, field: 'remarks', value: e.target.value, category: cat.id, label: cr.label, requirement: cr.requirement })}
                                className="h-7 text-xs"
                                style={{ background: 'rgba(30,39,97,0.4)', borderColor: 'rgba(202,220,252,0.15)', color: '#F8FAFC' }}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}