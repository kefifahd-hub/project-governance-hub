import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ActionTrackerHeader from '../components/actiontracker/ActionTrackerHeader';
import BoardView from '../components/actiontracker/BoardView';
import ListView from '../components/actiontracker/ListView';
import MyTasksView from '../components/actiontracker/MyTasksView';
import DashboardView from '../components/actiontracker/DashboardView';
import ItemDetailPanel from '../components/actiontracker/ItemDetailPanel';
import NewItemDialog from '../components/actiontracker/NewItemDialog';
import { Button } from '@/components/ui/button';
import { Settings2, Plus } from 'lucide-react';
import { createPageUrl } from '../utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const DEFAULT_BUCKETS = [
  { bucketName: 'Product Development', bucketColor: '#8b5cf6', sortOrder: 1 },
  { bucketName: 'Process Engineering', bucketColor: '#3b82f6', sortOrder: 2 },
  { bucketName: 'Procurement', bucketColor: '#f97316', sortOrder: 3 },
  { bucketName: 'Building & Construction', bucketColor: '#10b981', sortOrder: 4 },
  { bucketName: 'MEP & Utilities', bucketColor: '#06b6d4', sortOrder: 5 },
  { bucketName: 'Commissioning', bucketColor: '#1e3a8a', sortOrder: 6 },
  { bucketName: 'Regulatory & Permits', bucketColor: '#ef4444', sortOrder: 7 },
  { bucketName: 'Commercial & Finance', bucketColor: '#eab308', sortOrder: 8 },
  { bucketName: 'Project Management', bucketColor: '#6b7280', sortOrder: 9 },
  { bucketName: 'Quality & Testing', bucketColor: '#ec4899', sortOrder: 10 },
];

const DEFAULT_PHASES = [
  { phaseName: 'Pre-Gate 0: Business Case Prep', startDate: '2025-06-09', endDate: '2026-01-14', phaseType: 'Gate Phase', status: 'Complete', goal: 'Prepare and validate business case for Gate 0 review' },
  { phaseName: 'Gate 0 → Gate 1: Site & Product Concept', startDate: '2026-01-15', endDate: '2026-02-05', phaseType: 'Gate Phase', status: 'Active', goal: 'Finalize site selection and product concept' },
  { phaseName: 'Gate 1 → Gate 2: Design Development', startDate: '2026-02-06', endDate: '2026-06-10', phaseType: 'Gate Phase', status: 'Planning', goal: 'Develop detailed design to design freeze' },
  { phaseName: 'Gate 2 → Gate 3: Procurement & Early Works', startDate: '2026-06-11', endDate: '2026-08-23', phaseType: 'Gate Phase', status: 'Planning', goal: 'Award main contracts and commence early works' },
  { phaseName: 'Gate 3 → Gate 4: Construction & Installation', startDate: '2026-08-24', endDate: '2027-05-03', phaseType: 'Gate Phase', status: 'Planning', goal: 'Complete building and equipment installation' },
  { phaseName: 'Gate 4 → Gate 5: Commissioning & Ramp Up', startDate: '2027-05-04', endDate: '2027-08-29', phaseType: 'Gate Phase', status: 'Planning', goal: 'Commission all systems and begin production ramp' },
  { phaseName: 'Gate 5 → Gate 6: Handover & SOP', startDate: '2027-08-30', endDate: '2027-12-06', phaseType: 'Gate Phase', status: 'Planning', goal: 'Achieve Start of Production and full handover' },
];

export default function ActionTracker() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('id');
  const queryClient = useQueryClient();

  const [view, setView] = useState('board');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [selectedItem, setSelectedItem] = useState(null);
  const [newItemOpen, setNewItemOpen] = useState(false);
  const [newItemDefaults, setNewItemDefaults] = useState({});
  const [showSetup, setShowSetup] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => localStorage.getItem('pmo_current_user') || '');

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => { const r = await base44.entities.Project.filter({ id: projectId }); return r[0]; },
    enabled: !!projectId,
  });

  const { data: items = [] } = useQuery({
    queryKey: ['actionItems', projectId],
    queryFn: () => base44.entities.ActionItem.filter({ projectId, archived: false }, '-created_date', 200),
    enabled: !!projectId,
  });

  const { data: buckets = [], refetch: refetchBuckets } = useQuery({
    queryKey: ['actionBuckets', projectId],
    queryFn: () => base44.entities.ActionBucket.filter({ projectId }, 'sortOrder'),
    enabled: !!projectId,
  });

  const { data: phases = [], refetch: refetchPhases } = useQuery({
    queryKey: ['actionPhases', projectId],
    queryFn: () => base44.entities.ActionPhase.filter({ projectId }, 'startDate'),
    enabled: !!projectId,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ActionItem.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['actionItems', projectId] })
  });

  // Auto-setup buckets & phases if none exist
  useEffect(() => {
    if (projectId && buckets.length === 0 && phases.length === 0) {
      setShowSetup(true);
    }
  }, [projectId, buckets.length, phases.length]);

  const handleAutoSetup = async () => {
    await Promise.all([
      ...DEFAULT_BUCKETS.map(b => base44.entities.ActionBucket.create({ ...b, projectId })),
      ...DEFAULT_PHASES.map(p => base44.entities.ActionPhase.create({ ...p, projectId })),
    ]);
    await Promise.all([refetchBuckets(), refetchPhases()]);
    setShowSetup(false);
  };

  const handleSkipSetup = () => setShowSetup(false);

  // Generate next item key
  const nextKey = (() => {
    const prefix = project?.projectName?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'PR';
    const maxNum = items.reduce((max, item) => {
      const num = parseInt(item.itemKey?.split('-')[1] || '0');
      return isNaN(num) ? max : Math.max(max, num);
    }, 0);
    return `${prefix}-${String(maxNum + 1).padStart(3, '0')}`;
  })();

  // Filter items
  const filtered = items.filter(item => {
    if (search && !`${item.title} ${item.itemKey} ${item.description}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (filters.type && item.itemType !== filters.type) return false;
    if (filters.priority && item.priority !== filters.priority) return false;
    if (filters.status && item.status !== filters.status) return false;
    if (filters.bucket && item.bucket !== filters.bucket) return false;
    if (filters.phase && item.phase !== filters.phase) return false;
    return true;
  });

  const handleNewItem = (defaults = {}) => {
    setNewItemDefaults(defaults);
    setNewItemOpen(true);
  };

  const handleCurrentUserChange = (e) => {
    setCurrentUser(e.target.value);
    localStorage.setItem('pmo_current_user', e.target.value);
  };

  // Auto-redirect to last known project
  useEffect(() => {
    if (!projectId) {
      const lastId = sessionStorage.getItem('pmo_last_project_id');
      if (lastId) {
        window.location.href = createPageUrl(`ActionTracker?id=${lastId}`);
      }
    } else {
      sessionStorage.setItem('pmo_last_project_id', projectId);
    }
  }, [projectId]);

  if (!projectId) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#1E2761 0%,#0F172A 100%)' }}>
        <p style={{ color: '#94A3B8' }}>Select a project to view the Action Tracker.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(135deg,#1E2761 0%,#0F172A 100%)' }}>
      {/* Page header */}
      <div style={{ background: 'rgba(15,23,42,0.95)', borderBottom: '1px solid rgba(202,220,252,0.1)' }}>
        <div className="max-w-full px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#CADCFC' }}>Action Tracker</h1>
            <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>{project?.projectName} · {items.length} items</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              value={currentUser}
              onChange={handleCurrentUserChange}
              placeholder="Your name (for My Tasks)"
              className="text-xs px-3 py-1.5 rounded-lg border"
              style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.15)', color: '#CADCFC', width: 180 }}
            />
          </div>
        </div>
      </div>

      {/* Filters + view switcher */}
      <ActionTrackerHeader
        currentView={view}
        onViewChange={setView}
        search={search}
        onSearch={setSearch}
        filters={filters}
        onFilters={setFilters}
        buckets={buckets}
        phases={phases}
        onNewItem={() => handleNewItem({})}
      />

      {/* View content */}
      <div className="flex-1 overflow-auto">
        {view === 'board' && (
          <BoardView items={filtered} buckets={buckets} onItemClick={setSelectedItem} onNewItem={handleNewItem} />
        )}
        {view === 'list' && (
          <ListView items={filtered} onItemClick={setSelectedItem} onNewItem={handleNewItem} />
        )}
        {view === 'mytasks' && (
          <MyTasksView items={filtered} currentUser={currentUser} onItemClick={setSelectedItem} projectId={projectId} />
        )}
        {view === 'dashboard' && (
          <DashboardView items={filtered} buckets={buckets} phases={phases} />
        )}
      </div>

      {/* Detail panel */}
      {selectedItem && (
        <ItemDetailPanel
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onUpdate={(updated) => {
            updateMutation.mutate({ id: updated.id, data: updated });
            setSelectedItem(null);
          }}
          buckets={buckets}
          phases={phases}
        />
      )}

      {/* New item dialog */}
      <NewItemDialog
        open={newItemOpen}
        onClose={() => setNewItemOpen(false)}
        projectId={projectId}
        defaults={newItemDefaults}
        buckets={buckets}
        phases={phases}
        nextKey={nextKey}
      />

      {/* First-time setup dialog */}
      <Dialog open={showSetup} onOpenChange={() => {}}>
        <DialogContent style={{ background: 'rgba(10,15,40,0.99)', borderColor: 'rgba(202,220,252,0.1)' }} className="max-w-md">
          <DialogHeader>
            <DialogTitle style={{ color: '#CADCFC' }}>Set up Action Tracker</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm" style={{ color: '#94A3B8' }}>
              No buckets or phases have been created yet. Would you like to auto-create the standard project setup?
            </p>
            <div className="rounded-lg p-3 space-y-1 text-xs" style={{ background: 'rgba(30,39,97,0.4)', color: '#64748b' }}>
              <div className="font-semibold mb-1" style={{ color: '#94A3B8' }}>10 Buckets:</div>
              <div>Product Development, Process Engineering, Procurement, Building & Construction, MEP & Utilities, Commissioning, Regulatory & Permits, Commercial & Finance, Project Management, Quality & Testing</div>
              <div className="font-semibold mt-2 mb-1" style={{ color: '#94A3B8' }}>7 Gate Phases:</div>
              <div>Pre-Gate 0 through Gate 5 → Gate 6: Handover & SOP</div>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleAutoSetup} style={{ background: 'linear-gradient(135deg,#028090,#00A896)', color: '#F8FAFC' }}>
                Auto-Setup
              </Button>
              <Button variant="outline" onClick={handleSkipSetup} style={{ borderColor: 'rgba(202,220,252,0.2)', color: '#94A3B8' }}>
                Skip
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}