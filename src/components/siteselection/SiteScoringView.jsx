import { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { CATEGORIES } from './criteriaDefinitions';

const SITE_COLORS = ['#00A896', '#FBBF24', '#F87171', '#A78BFA'];

export default function SiteScoringView({ sites, criteria, assessment, onRefresh }) {
  const qc = useQueryClient();
  const [weights, setWeights] = useState(() => {
    try {
      return JSON.parse(assessment?.categoryWeights || 'null') || CATEGORIES.reduce((a, c) => ({ ...a, [c.id]: c.weight }), {});
    } catch {
      return CATEGORIES.reduce((a, c) => ({ ...a, [c.id]: c.weight }), {});
    }
  });

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

  const saveMutation = useMutation({
    mutationFn: () => base44.entities.SiteAssessment.update(assessment.id, { categoryWeights: JSON.stringify(weights) }),
    onSuccess: () => onRefresh(),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ siteId, status }) => base44.entities.CandidateSite.update(siteId, { status }),
    onSuccess: () => qc.invalidateQueries(['candidateSites', assessment.id]),
  });

  // Compute scores per category per site
  const siteScores = useMemo(() => {
    return sites.map(site => {
      const catScores = {};
      CATEGORIES.forEach(cat => {
        const siteCritInCat = criteria.filter(c => c.siteId === site.id && c.category === cat.id && c.score != null);
        catScores[cat.id] = siteCritInCat.length
          ? siteCritInCat.reduce((s, c) => s + c.score, 0) / siteCritInCat.length
          : 0;
      });
      const totalScore = CATEGORIES.reduce((s, cat) => {
        return s + (catScores[cat.id] * (weights[cat.id] / 100));
      }, 0);
      return { site, catScores, totalScore };
    }).sort((a, b) => b.totalScore - a.totalScore);
  }, [sites, criteria, weights]);

  // Radar chart data
  const radarData = CATEGORIES.map(cat => {
    const entry = { category: cat.label.replace(/^\d+\.\s/, '') };
    sites.forEach((site, i) => {
      const ss = siteScores.find(s => s.site.id === site.id);
      entry[site.siteName] = ss?.catScores[cat.id]?.toFixed(1) ?? 0;
    });
    return entry;
  });

  // Knockout criteria (keys that must be 'Yes')
  const knockoutKeys = ['2.20', '2.13', '2.14'];
  const getKnockout = (siteId) => knockoutKeys.filter(k => {
    const entry = criteria.find(c => c.siteId === siteId && c.criterionKey === k);
    if (!entry || entry.meetsRequirement === 'TBD' || entry.meetsRequirement === 'N/A') return false;
    // 2.13 and 2.14 must be 'No' seismic/flood — flag if Yes
    if (k === '2.13' || k === '2.14') return entry.response?.toLowerCase() === 'yes';
    // 2.20 must be 'Yes'
    return entry.meetsRequirement !== 'Yes';
  });

  return (
    <div className="space-y-6">
      {/* Weight Configuration */}
      <Card style={{ background: 'rgba(15,23,42,0.6)', borderColor: 'rgba(202,220,252,0.1)' }}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle style={{ color: '#CADCFC' }}>Category Weights</CardTitle>
            <div className="flex items-center gap-3">
              <span className="text-sm" style={{ color: totalWeight === 100 ? '#34D399' : '#EF4444' }}>
                Total: {totalWeight}% {totalWeight !== 100 && '⚠️ Must equal 100%'}
              </span>
              <Button size="sm" onClick={() => saveMutation.mutate()} style={{ background: 'rgba(0,168,150,0.2)', color: '#00A896' }}>
                Save Weights
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CATEGORIES.map(cat => (
              <div key={cat.id}>
                <div className="flex justify-between text-sm mb-2">
                  <span style={{ color: '#94A3B8' }}>{cat.label}</span>
                  <span style={{ color: '#CADCFC', fontWeight: 'bold' }}>{weights[cat.id]}%</span>
                </div>
                <Slider
                  value={[weights[cat.id]]}
                  onValueChange={([v]) => setWeights(prev => ({ ...prev, [cat.id]: v }))}
                  min={0} max={30} step={1}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Scoring Results Table */}
      <Card style={{ background: 'rgba(15,23,42,0.6)', borderColor: 'rgba(202,220,252,0.1)' }}>
        <CardHeader>
          <CardTitle style={{ color: '#CADCFC' }}>Weighted Scoring Results</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(202,220,252,0.1)' }}>
                  <th className="px-4 py-3 text-left" style={{ color: '#94A3B8' }}>Category</th>
                  <th className="px-4 py-3 text-center" style={{ color: '#94A3B8' }}>Weight</th>
                  {siteScores.map(({ site }, i) => (
                    <th key={site.id} className="px-4 py-3 text-center" style={{ color: SITE_COLORS[i] }}>{site.siteName}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CATEGORIES.map(cat => (
                  <tr key={cat.id} style={{ borderTop: '1px solid rgba(202,220,252,0.05)' }}>
                    <td className="px-4 py-2" style={{ color: '#CADCFC' }}>{cat.label}</td>
                    <td className="px-4 py-2 text-center text-xs" style={{ color: '#94A3B8' }}>{weights[cat.id]}%</td>
                    {siteScores.map(({ site, catScores }, i) => (
                      <td key={site.id} className="px-4 py-2 text-center">
                        <span style={{ color: SITE_COLORS[i] }}>{catScores[cat.id]?.toFixed(1)}/10</span>
                      </td>
                    ))}
                  </tr>
                ))}
                {/* Total Row */}
                <tr style={{ borderTop: '2px solid rgba(202,220,252,0.2)', background: 'rgba(30,39,97,0.4)' }}>
                  <td className="px-4 py-3 font-bold" style={{ color: '#CADCFC' }}>TOTAL WEIGHTED SCORE</td>
                  <td className="px-4 py-3 text-center font-bold" style={{ color: '#94A3B8' }}>100%</td>
                  {siteScores.map(({ site, totalScore }, i) => {
                    const knockouts = getKnockout(site.id);
                    return (
                      <td key={site.id} className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-lg font-bold" style={{ color: knockouts.length > 0 ? '#EF4444' : SITE_COLORS[i] }}>
                            {(totalScore * 10).toFixed(1)}/100
                          </span>
                          {knockouts.length > 0 && <Badge style={{ background: 'rgba(239,68,68,0.2)', color: '#EF4444', fontSize: '0.6rem' }}>DISQUALIFIED</Badge>}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Radar Chart */}
      {sites.length > 0 && (
        <Card style={{ background: 'rgba(15,23,42,0.6)', borderColor: 'rgba(202,220,252,0.1)' }}>
          <CardHeader><CardTitle style={{ color: '#CADCFC' }}>Site Comparison Radar</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(202,220,252,0.1)" />
                <PolarAngleAxis dataKey="category" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                {sites.map((site, i) => (
                  <Radar key={site.id} name={site.siteName} dataKey={site.siteName}
                    stroke={SITE_COLORS[i]} fill={SITE_COLORS[i]} fillOpacity={0.15} />
                ))}
                <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(202,220,252,0.2)', color: '#CADCFC' }} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Ranking */}
      <Card style={{ background: 'rgba(15,23,42,0.6)', borderColor: 'rgba(202,220,252,0.1)' }}>
        <CardHeader><CardTitle style={{ color: '#CADCFC' }}>Site Ranking</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {siteScores.map(({ site, totalScore }, i) => {
            const knockouts = getKnockout(site.id);
            const disqualified = knockouts.length > 0;
            return (
              <div key={site.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'rgba(30,39,97,0.4)' }}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold" style={{ color: disqualified ? '#EF4444' : SITE_COLORS[i] }}>
                    #{i + 1}
                  </span>
                  <div>
                    <div className="font-semibold" style={{ color: '#CADCFC' }}>{site.siteName}</div>
                    <div className="text-xs" style={{ color: '#94A3B8' }}>{site.country} {site.region && `• ${site.region}`}</div>
                    {disqualified && <div className="text-xs" style={{ color: '#EF4444' }}>⚠️ Fails knockout criteria</div>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xl font-bold" style={{ color: disqualified ? '#EF4444' : '#34D399' }}>
                    {(totalScore * 10).toFixed(1)}/100
                  </span>
                  {!disqualified && i === 0 && (
                    <Button size="sm" onClick={() => updateStatusMutation.mutate({ siteId: site.id, status: 'Selected' })}
                      style={{ background: 'rgba(0,168,150,0.2)', color: '#00A896' }}>
                      Select Site
                    </Button>
                  )}
                  <Badge style={{
                    background: site.status === 'Selected' ? 'rgba(0,168,150,0.3)' : 'rgba(30,39,97,0.5)',
                    color: site.status === 'Selected' ? '#00A896' : '#94A3B8'
                  }}>{site.status}</Badge>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}