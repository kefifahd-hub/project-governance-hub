import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { parseISO, isWithinInterval } from 'date-fns';

function Section({ icon, title, children }) {
  return (
    <div className="p-5 rounded-xl space-y-3" style={{ background: 'rgba(30,39,97,0.4)', border: '1px solid rgba(202,220,252,0.1)' }}>
      <h3 className="font-semibold flex items-center gap-2" style={{ color: '#CADCFC' }}>{icon} {title}</h3>
      {children}
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div className="text-center p-3 rounded-lg" style={{ background: 'rgba(15,23,42,0.5)' }}>
      <div className="text-xl font-bold" style={{ color: color || '#CADCFC' }}>{value}</div>
      <div className="text-xs mt-0.5" style={{ color: '#64748b' }}>{label}</div>
    </div>
  );
}

function MiniTable({ headers, rows }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(202,220,252,0.1)' }}>
            {headers.map(h => <th key={h} className="text-left py-1.5 pr-3 font-medium" style={{ color: '#64748b' }}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid rgba(202,220,252,0.05)' }}>
              {row.map((cell, j) => <td key={j} className="py-1.5 pr-3" style={{ color: '#CADCFC' }}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function WeeklyAutoSections({ projectId, enabledSections, reportingPeriodStart, reportingPeriodEnd }) {
  const periodStart = parseISO(reportingPeriodStart);
  const periodEnd = parseISO(reportingPeriodEnd);
  const isInPeriod = (dateStr) => { try { return isWithinInterval(parseISO(dateStr), { start: periodStart, end: periodEnd }); } catch { return false; } };

  const { data: actionItems = [] } = useQuery({
    queryKey: ['actionItems', projectId],
    queryFn: () => base44.entities.ActionItem.filter({ projectId }),
    enabled: !!projectId && (enabledSections.includes('actions') || enabledSections.includes('lookahead')),
  });

  const { data: risks = [] } = useQuery({
    queryKey: ['risks', projectId],
    queryFn: () => base44.entities.Risk.filter({ projectId }),
    enabled: !!projectId && enabledSections.includes('risks'),
  });

  const { data: changeRequests = [] } = useQuery({
    queryKey: ['changeRequests', projectId],
    queryFn: () => base44.entities.ChangeRequest.filter({ projectId }),
    enabled: !!projectId && enabledSections.includes('changes'),
  });

  const { data: milestones = [] } = useQuery({
    queryKey: ['milestones', projectId],
    queryFn: () => base44.entities.Milestone.filter({ projectId }),
    enabled: !!projectId && (enabledSections.includes('schedule') || enabledSections.includes('lookahead')),
  });

  const { data: qualityGates = [] } = useQuery({
    queryKey: ['qualityGates', projectId],
    queryFn: () => base44.entities.QualityGate.filter({ projectId }),
    enabled: !!projectId && enabledSections.includes('quality'),
  });

  const { data: dsrs = [] } = useQuery({
    queryKey: ['dsrs', projectId],
    queryFn: () => base44.entities.DailySiteReport.filter({ projectId }),
    enabled: !!projectId && enabledSections.includes('site'),
  });

  const now = new Date();
  const in14Days = new Date(now.getTime() + 14 * 86400000);

  // Action stats
  const totalActions = actionItems.filter(a => !a.archived).length;
  const openActions = actionItems.filter(a => !a.archived && a.status === 'To Do').length;
  const inProgressActions = actionItems.filter(a => !a.archived && a.status === 'In Progress').length;
  const blockedActions = actionItems.filter(a => !a.archived && a.blocked).length;
  const doneActions = actionItems.filter(a => !a.archived && a.status === 'Done').length;
  const overdueActions = actionItems.filter(a => !a.archived && a.dueDate && new Date(a.dueDate) < now && a.status !== 'Done');
  const completedThisWeek = actionItems.filter(a => a.completedDate && isInPeriod(a.completedDate));
  const newThisWeek = actionItems.filter(a => isInPeriod(a.created_date));

  // Risk stats
  const activeRisks = risks.filter(r => r.status !== 'Closed');
  const criticalRisks = activeRisks.filter(r => r.riskLevel === 'Critical');
  const highRisks = activeRisks.filter(r => r.riskLevel === 'High');

  // CR stats
  const openCRs = changeRequests.filter(cr => !['Closed','Rejected','Withdrawn'].includes(cr.status));
  const approvedCRs = changeRequests.filter(cr => cr.status === 'Approved' || cr.status === 'Approved with Conditions');
  const pendingApproval = changeRequests.filter(cr => cr.status === 'Pending Approval');

  // DSR stats for the week
  const weekDSRs = dsrs.filter(d => isInPeriod(d.reportDate));
  const totalWorkers = weekDSRs.reduce((s, d) => s + (d.totalWorkers || 0), 0);
  const totalHours = weekDSRs.reduce((s, d) => s + (d.totalHours || 0), 0);
  const weatherDays = weekDSRs.filter(d => d.weatherImpactOnWork).length;

  // Upcoming milestones
  const upcomingMilestones = milestones.filter(m => m.dueDate && new Date(m.dueDate) >= now && new Date(m.dueDate) <= in14Days);

  return (
    <div className="space-y-5">
      {/* Schedule Status */}
      {enabledSections.includes('schedule') && (
        <Section icon="📅" title="Schedule Status">
          {milestones.length === 0 ? <p className="text-sm" style={{ color: '#64748b' }}>No milestone data available.</p> : (
            <MiniTable
              headers={['Phase', 'Status', 'Completion', 'Due Date']}
              rows={milestones.slice(0, 8).map(m => [m.phaseName, m.status, `${m.completionPercent || 0}%`, m.dueDate || '—'])}
            />
          )}
        </Section>
      )}

      {/* Action Tracker */}
      {enabledSections.includes('actions') && (
        <Section icon="📋" title="Action Tracker">
          <div className="grid grid-cols-5 gap-2 mb-3">
            <Stat label="Total" value={totalActions} />
            <Stat label="Open" value={openActions} color="#94a3b8" />
            <Stat label="In Progress" value={inProgressActions} color="#3b82f6" />
            <Stat label="Blocked" value={blockedActions} color="#ef4444" />
            <Stat label="Done" value={doneActions} color="#10b981" />
          </div>
          {overdueActions.length > 0 && (
            <div>
              <p className="text-xs font-medium mb-1" style={{ color: '#f59e0b' }}>⚠️ Overdue ({overdueActions.length})</p>
              <MiniTable
                headers={['Key', 'Title', 'Assignee', 'Days Late']}
                rows={overdueActions.slice(0, 5).map(a => [
                  a.itemKey || '—', a.title.slice(0, 40), a.assignee,
                  Math.ceil((now - new Date(a.dueDate)) / 86400000) + 'd'
                ])}
              />
            </div>
          )}
          {blockedActions > 0 && (
            <div className="mt-2">
              <p className="text-xs font-medium mb-1" style={{ color: '#ef4444' }}>🚫 Blocked</p>
              <MiniTable
                headers={['Key', 'Title', 'Reason']}
                rows={actionItems.filter(a => a.blocked).slice(0, 3).map(a => [a.itemKey || '—', a.title.slice(0, 35), (a.blockedReason || '').slice(0, 50)])}
              />
            </div>
          )}
        </Section>
      )}

      {/* Risk Status */}
      {enabledSections.includes('risks') && (
        <Section icon="⚠️" title="Risk Status">
          <div className="grid grid-cols-4 gap-2 mb-3">
            <Stat label="Active" value={activeRisks.length} />
            <Stat label="Critical" value={criticalRisks.length} color="#ef4444" />
            <Stat label="High" value={highRisks.length} color="#f59e0b" />
            <Stat label="Closed" value={risks.filter(r => r.status === 'Closed').length} color="#10b981" />
          </div>
          {criticalRisks.length > 0 && (
            <MiniTable
              headers={['ID', 'Description', 'Owner', 'Level']}
              rows={criticalRisks.slice(0, 5).map(r => [r.riskId || r.id?.slice(-4) || '—', (r.description || r.title || '').slice(0, 45), r.owner || r.riskOwner || '—', r.riskLevel || '—'])}
            />
          )}
        </Section>
      )}

      {/* Change Management */}
      {enabledSections.includes('changes') && (
        <Section icon="🔄" title="Change Management">
          <div className="grid grid-cols-4 gap-2 mb-3">
            <Stat label="Total CRs" value={changeRequests.length} />
            <Stat label="Open" value={openCRs.length} color="#3b82f6" />
            <Stat label="Approved" value={approvedCRs.length} color="#10b981" />
            <Stat label="Pending" value={pendingApproval.length} color="#f59e0b" />
          </div>
          {openCRs.length > 0 && (
            <MiniTable
              headers={['CR#', 'Title', 'Priority', 'Status']}
              rows={openCRs.slice(0, 6).map(cr => [cr.crNumber || '—', (cr.title || '').slice(0, 40), cr.priority || '—', cr.status || '—'])}
            />
          )}
        </Section>
      )}

      {/* Site Activity */}
      {enabledSections.includes('site') && (
        <Section icon="🏗️" title="Site Activity">
          <div className="grid grid-cols-4 gap-2">
            <Stat label="Reports Filed" value={weekDSRs.length} />
            <Stat label="Total Workers" value={totalWorkers} color="#3b82f6" />
            <Stat label="Total Hours" value={totalHours} color="#10b981" />
            <Stat label="Weather Days Lost" value={weatherDays} color={weatherDays > 0 ? '#ef4444' : '#10b981'} />
          </div>
          {weekDSRs.length === 0 && (
            <p className="text-xs mt-2" style={{ color: '#64748b' }}>No daily site reports filed for this week.</p>
          )}
        </Section>
      )}

      {/* Quality Gates */}
      {enabledSections.includes('quality') && (
        <Section icon="🚩" title="Quality Gates">
          {qualityGates.length === 0 ? <p className="text-sm" style={{ color: '#64748b' }}>No quality gate data.</p> : (
            <MiniTable
              headers={['Gate', 'Name', 'Status', 'Decision Date']}
              rows={qualityGates.sort((a,b) => a.gateNumber - b.gateNumber).map(g => [
                `QG${g.gateNumber}`, g.gateName,
                g.status === 'Passed' ? '✅ Passed' : g.status === 'Active' ? '🔴 Active' : g.status === 'Passed with Reserves' ? '⚠️ Reserves' : g.status,
                g.decisionDate || '—'
              ])}
            />
          )}
        </Section>
      )}

      {/* 2-Week Look-Ahead */}
      {enabledSections.includes('lookahead') && (
        <Section icon="🔭" title="2-Week Look-Ahead">
          <div className="space-y-3">
            {upcomingMilestones.length > 0 && (
              <div>
                <p className="text-xs font-medium mb-1" style={{ color: '#94a3b8' }}>Upcoming Milestones</p>
                <MiniTable
                  headers={['Phase', 'Due', 'Status']}
                  rows={upcomingMilestones.map(m => [m.phaseName, m.dueDate, m.status])}
                />
              </div>
            )}
            {pendingApproval.length > 0 && (
              <div>
                <p className="text-xs font-medium mb-1" style={{ color: '#f59e0b' }}>CRs Pending Approval</p>
                <MiniTable
                  headers={['CR#', 'Title', 'Priority']}
                  rows={pendingApproval.map(cr => [cr.crNumber, (cr.title || '').slice(0, 45), cr.priority])}
                />
              </div>
            )}
            {actionItems.filter(a => a.itemType === 'Decision' && a.status !== 'Done' && a.dueDate && new Date(a.dueDate) <= in14Days).length > 0 && (
              <div>
                <p className="text-xs font-medium mb-1" style={{ color: '#3b82f6' }}>Pending Decisions</p>
                <MiniTable
                  headers={['Key', 'Decision', 'Assignee', 'Due']}
                  rows={actionItems.filter(a => a.itemType === 'Decision' && a.status !== 'Done' && a.dueDate && new Date(a.dueDate) <= in14Days).map(a => [a.itemKey || '—', a.title.slice(0, 40), a.assignee, a.dueDate])}
                />
              </div>
            )}
          </div>
        </Section>
      )}
    </div>
  );
}