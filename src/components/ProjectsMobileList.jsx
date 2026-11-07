import { Briefcase, Plus } from 'lucide-react';
import MobileGroupedRow from '@/components/mobile/MobileGroupedRow';

export default function ProjectsMobileList({ projects = [], onOpen, onNew, currentProjectId, showDetails = true }) {
  return (
    <div className="ios-navigation space-y-5">
      <div className="ios-group">
        {projects.length === 0 && <p className="px-4 py-5 text-[15px] text-ios-muted">No projects yet</p>}
        {projects.map((project) => {
          const health = project.healthScore || 0;
          const healthClass = health >= 70 ? 'bg-ios-success' : health >= 40 ? 'bg-ios-warning' : 'bg-ios-danger';
          const meta = [project.currentPhase, project.clientName].filter(Boolean).join(' · ');
          return (
            <MobileGroupedRow
              key={project.id}
              title={project.projectName}
              subtitle={showDetails ? meta : undefined}
              current={currentProjectId === project.id}
              onClick={() => onOpen(project.id)}
              leading={<span className="ios-row-icon" aria-hidden="true">{showDetails ? <span className="text-[11px] font-semibold">{project.projectName?.slice(0, 2).toUpperCase() || 'PR'}</span> : <Briefcase className="h-[18px] w-[18px]" />}</span>}
              trailing={showDetails && <span className="flex shrink-0 items-center gap-1.5 text-[15px] tabular-nums text-ios-muted" aria-label={`Health score ${health} out of 100`}><span className={`h-[7px] w-[7px] rounded-full ${healthClass}`} aria-hidden="true" />{health}</span>}
            />
          );
        })}
      </div>
      <div className="ios-group text-ios-tint">
        <MobileGroupedRow title="New Project" chevron={false} onClick={onNew} leading={<span className="ios-row-icon"><Plus className="h-5 w-5" aria-hidden="true" /></span>} />
      </div>
    </div>
  );
}