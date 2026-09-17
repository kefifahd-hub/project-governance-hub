import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Filter, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import LessonDialog from '@/components/lessons/LessonDialog';

const CATEGORIES = ['Technical', 'Commercial', 'Schedule', 'Safety', 'Quality', 'Procurement', 'Stakeholder', 'HSE'];
const TYPES = ['Success', 'Improvement'];
const STATUSES = ['Open', 'Actioned', 'Closed'];

const sevColor = (s) => s === 'Open' ? 'bg-red-500/20 text-red-400' : s === 'Actioned' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400';

export default function LessonsLearned() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('id');
  const qc = useQueryClient();
  const [filters, setFilters] = useState({});
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => { const r = await base44.entities.Project.filter({ id: projectId }); return r[0]; },
    enabled: !!projectId,
  });

  const { data: lessons = [], isLoading } = useQuery({
    queryKey: ['lessons', projectId],
    queryFn: () => base44.entities.LessonLearned.filter({ projectId }, '-dateIdentified', 200),
    enabled: !!projectId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.LessonLearned.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lessons', projectId] }),
  });

  const filtered = lessons.filter(l => {
    if (search && !`${l.title} ${l.category} ${l.whatHappened}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (filters.category && l.category !== filters.category) return false;
    if (filters.lessonType && l.lessonType !== filters.lessonType) return false;
    if (filters.status && l.status !== filters.status) return false;
    return true;
  });

  const openNew = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (l) => { setEditing(l); setDialogOpen(true); };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg,#1E2761 0%,#0F172A 100%)' }}>
      <div style={{ background: 'rgba(15,23,42,0.95)', borderBottom: '1px solid rgba(202,220,252,0.1)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: '#CADCFC' }}>
              <BookOpen className="w-5 h-5" style={{ color: '#0ea5e9' }} /> Lessons Learned Register
            </h1>
            <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>{project?.projectName} · {lessons.length} lessons · {lessons.filter(l => l.status === 'Open').length} open</p>
          </div>
          <Button onClick={openNew} style={{ background: 'linear-gradient(135deg,#028090,#00A896)', color: '#F8FAFC' }}>
            <Plus className="w-4 h-4 mr-1" /> Add Lesson
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4 items-center">
          <Input placeholder="Search lessons…" value={search} onChange={e => setSearch(e.target.value)}
            className="h-9 w-full sm:w-64" style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.15)', color: '#F8FAFC' }} />
          <Filter className="w-4 h-4" style={{ color: '#64748b' }} />
          {[
            { key: 'category', label: 'All Categories', options: CATEGORIES },
            { key: 'lessonType', label: 'All Types', options: TYPES },
            { key: 'status', label: 'All Statuses', options: STATUSES },
          ].map(f => (
            <Select key={f.key} value={filters[f.key] || ''} onValueChange={v => setFilters({ ...filters, [f.key]: v === f.label ? '' : v })}>
              <SelectTrigger className="h-9 text-xs w-40" style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.15)', color: '#CADCFC' }}>
                <SelectValue placeholder={f.label} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={f.label}>{f.label}</SelectItem>
                {f.options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          ))}
          {Object.values(filters).some(v => v) && (
            <Button variant="ghost" size="sm" style={{ color: '#94A3B8' }} onClick={() => setFilters({})}>Clear</Button>
          )}
        </div>

        {isLoading ? (
          <p style={{ color: '#94A3B8' }}>Loading…</p>
        ) : filtered.length === 0 ? (
          <Card style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.1)' }}>
            <CardContent className="py-12 text-center">
              <p style={{ color: '#94A3B8' }}>No lessons recorded yet. Capture your first lesson to build organisational memory.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map(l => (
              <Card key={l.id} className="cursor-pointer hover:-translate-y-0.5 transition-transform"
                style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.1)' }}
                onClick={() => openEdit(l)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate" style={{ color: '#CADCFC' }}>{l.title}</h3>
                      <div className="text-xs mt-1 flex flex-wrap gap-1.5" style={{ color: '#64748b' }}>
                        {l.category && <span className="px-2 py-0.5 rounded" style={{ background: 'rgba(14,165,233,0.15)', color: '#0ea5e9' }}>{l.category}</span>}
                        {l.phase && <span>· {l.phase}</span>}
                        {l.lessonType && <span className="px-2 py-0.5 rounded" style={{ background: l.lessonType === 'Success' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: l.lessonType === 'Success' ? '#10b981' : '#f59e0b' }}>{l.lessonType}</span>}
                      </div>
                    </div>
                    <Badge className={sevColor(l.status)}>{l.status}</Badge>
                  </div>
                  {l.whatHappened && <p className="text-sm mb-1" style={{ color: '#94A3B8' }}><span style={{ color: '#64748b' }}>What happened: </span>{l.whatHappened}</p>}
                  {l.recommendation && <p className="text-sm" style={{ color: '#94A3B8' }}><span style={{ color: '#64748b' }}>Recommendation: </span>{l.recommendation}</p>}
                  <div className="text-xs mt-2 flex justify-between" style={{ color: '#475569' }}>
                    <span>{l.owner ? `Owner: ${l.owner}` : ''}</span>
                    <span>{l.dateIdentified ? new Date(l.dateIdentified).toLocaleDateString() : ''}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <LessonDialog open={dialogOpen} onClose={() => setDialogOpen(false)} projectId={projectId} lesson={editing}
        onDeleted={(id) => { if (window.confirm('Delete this lesson?')) deleteMutation.mutate(id); }} />
    </div>
  );
}