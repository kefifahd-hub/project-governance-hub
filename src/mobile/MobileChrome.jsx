import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutGrid, CheckSquare, Plus, FileText, MoreHorizontal, HardHat, ShieldAlert, Wrench, BrainCircuit, Bot, ShieldCheck, Settings, Monitor } from 'lucide-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { createPageUrl } from '@/utils';
import { useSession } from '@/lib/SessionContext';
import { C } from './ui';

// Phone-only navigation: bottom bar + "Capture" and "More" sheets, plus the notice shown on
// tools that need a larger screen. Used by Layout when the viewport is phone-sized.

// Tools whose screens are grids/diagrams/models that don't work at phone width.
export const DESKTOP_ONLY_PAGES = [
  'FinanceModel', 'WBS', 'ScheduleSync', 'ScheduleDashboard', 'ScheduleMonitoring', 'SiteSelection',
  'WorkflowBuilder', 'ChangeWorkflow', 'RaciMatrix', 'FeasibilityStudy', 'GovernanceWizard', 'NPVCalculator',
];

export const FULL_VIEW_KEY = 'pmo_full_view';

const lastProject = () => { try { return sessionStorage.getItem('pmo_last_project_id'); } catch { return null; } };
const withProject = (path) => { const id = lastProject(); return id ? `${path}${path.includes('?') ? '&' : '?'}id=${id}` : path; };
const enterFullView = () => { try { sessionStorage.setItem(FULL_VIEW_KEY, '1'); } catch { /* storage blocked */ } };

function SheetLink({ to, icon: Icon, label, hint, onClick, color = C.accent, external }) {
  const inner = (
    <>
      <Icon className="w-5 h-5 shrink-0" style={{ color }} />
      <div className="min-w-0">
        <div className="text-base" style={{ color: C.text }}>{label}</div>
        {hint && <div className="text-xs" style={{ color: C.muted }}>{hint}</div>}
      </div>
    </>
  );
  const cls = 'flex items-center gap-3 px-3 py-3 rounded-xl';
  const style = { background: 'rgba(30,41,59,0.6)' };
  return external
    ? <a href={to} onClick={onClick} className={cls} style={style}>{inner}</a>
    : <Link to={to} onClick={onClick} className={cls} style={style}>{inner}</Link>;
}

export function MobileBottomNav() {
  const { can, isAdmin } = useSession();
  const location = useLocation();
  const [sheet, setSheet] = useState(null);
  const close = () => setSheet(null);
  const path = location.pathname;

  const tabs = [
    { key: 'home', label: 'Home', icon: LayoutGrid, to: '/m', active: path === '/m' || path === '/m/project' },
    { key: 'actions', label: 'Actions', icon: CheckSquare, to: withProject('/m/actions'), active: path === '/m/actions' },
    { key: 'capture', label: 'Capture', icon: Plus, onClick: () => setSheet('capture'), primary: true },
    { key: 'review', label: 'Reports', icon: FileText, to: withProject('/m/review'), active: path === '/m/review' },
    { key: 'more', label: 'More', icon: MoreHorizontal, onClick: () => setSheet('more'), active: !path.startsWith('/m') },
  ];

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50" style={{ background: 'rgba(15,23,42,0.98)', borderTop: `1px solid ${C.border}`, paddingBottom: 'var(--safe-area-bottom)' }}>
        <div className="flex items-end justify-around px-1 pt-1.5 pb-1.5">
          {tabs.map(({ key, label, icon: Icon, to, onClick, active, primary }) => {
            const body = primary ? (
              <span className="flex flex-col items-center gap-0.5">
                <span className="w-12 h-12 -mt-5 rounded-full flex items-center justify-center shadow-lg" style={{ background: C.accent, color: '#04201d' }}><Icon className="w-6 h-6" /></span>
                <span className="text-[10px] font-medium" style={{ color: C.muted }}>{label}</span>
              </span>
            ) : (
              <span className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg" style={{ color: active ? C.accent : C.muted, background: active ? C.accentSoft : 'transparent' }}>
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{label}</span>
              </span>
            );
            return to
              ? <Link key={key} to={to} aria-label={label}>{body}</Link>
              : <button key={key} type="button" aria-label={label} onClick={onClick}>{body}</button>;
          })}
        </div>
      </div>

      <Drawer open={!!sheet} onOpenChange={(o) => !o && close()}>
        <DrawerContent style={{ background: 'rgba(15,23,42,0.99)', borderColor: C.border, color: C.text }}>
          <div className="px-4 pb-8 space-y-2">
            <DrawerHeader className="px-0 text-left"><DrawerTitle style={{ color: C.text }}>{sheet === 'capture' ? 'Capture' : 'More'}</DrawerTitle></DrawerHeader>
            {sheet === 'capture' ? (
              <>
                {can('Reports') && <SheetLink to={withProject('/m/site-report')} icon={HardHat} label="Daily site report" hint="Weather, crews, equipment, events, photos" onClick={close} />}
                {can('QAQCDashboard') && <SheetLink to={withProject('/m/quality')} icon={ShieldAlert} label="Quality issue" hint="Log a non-conformity with photos" onClick={close} color={C.amber} />}
                {!can('Reports') && !can('QAQCDashboard') && <p className="text-sm py-4" style={{ color: C.muted }}>Your role can't capture reports or quality issues.</p>}
              </>
            ) : (
              <>
                {can('QAQCDashboard') && <SheetLink to={withProject('/m/quality')} icon={ShieldAlert} label="Quality issues" onClick={close} color={C.amber} />}
                <SheetLink to={createPageUrl(withProject('ProjectDashboard'))} icon={Wrench} label="All project tools" hint="Full desktop tools" onClick={() => { enterFullView(); close(); }} />
                <SheetLink to={createPageUrl('Brainiac')} icon={BrainCircuit} label="Brainiac" onClick={close} color="#a78bfa" />
                <SheetLink to={createPageUrl('PMOAgent')} icon={Bot} label="PMO Agent" onClick={close} color="#34d399" />
                {isAdmin && <SheetLink to={createPageUrl('UserAccess')} icon={ShieldCheck} label="Admin" hint="Users, domains, roles" onClick={() => { enterFullView(); close(); }} />}
                <SheetLink to={createPageUrl('Settings')} icon={Settings} label="Settings" onClick={close} color={C.muted} />
                <SheetLink to={createPageUrl('Home')} icon={Monitor} label="Desktop home" hint="The full home screen" onClick={() => { enterFullView(); close(); }} color={C.muted} />
              </>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}

/** Shown instead of a desktop-only tool on a phone, with a way through if they insist. */
export function DesktopOnlyNotice({ pageLabel, onContinue }) {
  const id = lastProject();
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-sm w-full rounded-2xl p-6 text-center space-y-3" style={{ background: C.card, border: `1px solid ${C.border}` }}>
        <Monitor className="w-8 h-8 mx-auto" style={{ color: C.accent }} />
        <h1 className="text-lg font-semibold" style={{ color: C.text }}>{pageLabel} works best on a larger screen</h1>
        <p className="text-sm" style={{ color: C.muted }}>Open it on a tablet or computer for the full tool. On your phone, the project snapshot shows the key numbers.</p>
        {id && <Link to={`/m/project?id=${id}`} className="block w-full py-3 rounded-xl font-semibold" style={{ background: C.accent, color: '#04201d' }}>Project snapshot</Link>}
        <button type="button" onClick={onContinue} className="block w-full py-3 rounded-xl text-sm" style={{ border: `1px solid ${C.border}`, color: C.muted }}>Open anyway</button>
      </div>
    </div>
  );
}
