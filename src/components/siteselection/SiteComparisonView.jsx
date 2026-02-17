import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CATEGORIES, MEETS_ICONS } from './criteriaDefinitions';

export default function SiteComparisonView({ sites, criteria }) {
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterGaps, setFilterGaps] = useState(false);

  // Build a map: criterionKey → siteId → criteria entry
  const criteriaMap = useMemo(() => {
    const map = {};
    criteria.forEach(c => {
      if (!map[c.criterionKey]) map[c.criterionKey] = {};
      map[c.criterionKey][c.siteId] = c;
    });
    return map;
  }, [criteria]);

  const filteredCategories = filterCategory === 'all' ? CATEGORIES : CATEGORIES.filter(c => c.id === filterCategory);

  return (
    <div>
      {/* Filters */}
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-56" style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#CADCFC' }}>
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <label className="flex items-center gap-2 cursor-pointer" style={{ color: '#94A3B8' }}>
          <input
            type="checkbox"
            checked={filterGaps}
            onChange={e => setFilterGaps(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm">Show only gaps (No or Partial)</span>
        </label>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        {filteredCategories.map(cat => {
          const catCriteria = filterGaps
            ? cat.criteria.filter(cr => sites.some(s => {
                const entry = criteriaMap[cr.key]?.[s.id];
                return entry?.meetsRequirement === 'No' || entry?.meetsRequirement === 'Partial';
              }))
            : cat.criteria;

          if (catCriteria.length === 0) return null;

          return (
            <Card key={cat.id} className="mb-4" style={{ background: 'rgba(15,23,42,0.6)', borderColor: 'rgba(202,220,252,0.1)' }}>
              <div className="px-4 py-3 font-semibold text-sm" style={{ color: '#00A896', borderBottom: '1px solid rgba(202,220,252,0.1)' }}>
                {cat.label}
              </div>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(202,220,252,0.1)' }}>
                      <th className="px-4 py-2 text-left text-xs" style={{ color: '#94A3B8', width: '25%' }}>Criterion</th>
                      <th className="px-4 py-2 text-left text-xs" style={{ color: '#94A3B8', width: '15%' }}>Requirement</th>
                      {sites.map(s => (
                        <th key={s.id} className="px-4 py-2 text-left text-xs" style={{ color: '#CADCFC' }}>{s.siteName}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {catCriteria.map(cr => (
                      <tr key={cr.key} style={{ borderTop: '1px solid rgba(202,220,252,0.05)' }}>
                        <td className="px-4 py-2 text-xs" style={{ color: '#CADCFC' }}>
                          <span style={{ color: '#64748B' }}>{cr.key} </span>{cr.label}
                        </td>
                        <td className="px-4 py-2 text-xs" style={{ color: '#64748B' }}>{cr.requirement}</td>
                        {sites.map(s => {
                          const entry = criteriaMap[cr.key]?.[s.id];
                          const meets = entry?.meetsRequirement || 'TBD';
                          return (
                            <td key={s.id} className="px-4 py-2 text-xs">
                              <div className="flex items-start gap-1">
                                <span>{MEETS_ICONS[meets]}</span>
                                <span style={{ color: '#94A3B8' }}>{entry?.response || '—'}</span>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}

                    {/* Category Summary Row */}
                    <tr style={{ borderTop: '2px solid rgba(202,220,252,0.15)', background: 'rgba(30,39,97,0.3)' }}>
                      <td className="px-4 py-2 text-xs font-semibold" style={{ color: '#CADCFC' }} colSpan={2}>Category Summary</td>
                      {sites.map(s => {
                        const siteCat = cat.criteria.map(cr => criteriaMap[cr.key]?.[s.id]);
                        const yes = siteCat.filter(e => e?.meetsRequirement === 'Yes').length;
                        const partial = siteCat.filter(e => e?.meetsRequirement === 'Partial').length;
                        const no = siteCat.filter(e => e?.meetsRequirement === 'No').length;
                        const scores = siteCat.filter(e => e?.score != null).map(e => e.score);
                        const avgScore = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : 'N/A';
                        return (
                          <td key={s.id} className="px-4 py-2 text-xs">
                            <div className="flex gap-2">
                              <span style={{ color: '#34D399' }}>✅{yes}</span>
                              <span style={{ color: '#FBBF24' }}>⚠️{partial}</span>
                              <span style={{ color: '#F87171' }}>❌{no}</span>
                              <span style={{ color: '#00A896' }}>Score: {avgScore}/10</span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}