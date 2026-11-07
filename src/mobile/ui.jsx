import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useSession } from '@/lib/SessionContext';

// Shared building blocks for the phone screens (src/mobile/*). They follow the app's dark
// palette so the phone views feel like the same product as the desktop tools.

export const C = {
  text: '#CADCFC',
  muted: '#94A3B8',
  faint: '#64748B',
  accent: '#00A896',
  accentSoft: 'rgba(0,168,150,0.12)',
  card: 'rgba(30,41,59,0.8)',
  border: 'rgba(202,220,252,0.12)',
  green: '#10b981',
  amber: '#f59e0b',
  red: '#ef4444',
  blue: '#3b82f6',
};

export const RAG = { Green: C.green, Amber: C.amber, Red: C.red };

export const healthRag = (score) =>
  score == null ? null : score >= 70 ? 'Green' : score >= 50 ? 'Amber' : 'Red';

export const todayIso = () => new Date().toISOString().slice(0, 10);

export const fmtDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt)) return '—';
  const sameYear = dt.getFullYear() === new Date().getFullYear();
  return dt.toLocaleDateString(undefined, { day: 'numeric', month: 'short', ...(sameYear ? {} : { year: 'numeric' }) });
};

export const isOverdue = (item) =>
  !!item.dueDate && item.dueDate < todayIso() && !['Done', "Won't Do", 'Closed'].includes(item.status);

/** Project in focus for the phone screens: ?id=… if present, else the last one opened. */
export function useMobileProjectId() {
  const [params] = useSearchParams();
  const fromUrl = params.get('id');
  let last = null;
  try { last = sessionStorage.getItem('pmo_last_project_id'); } catch { /* storage blocked */ }
  return fromUrl || last || null;
}

export function useProject(projectId) {
  return useQuery({
    queryKey: ['m-project', projectId],
    enabled: !!projectId,
    queryFn: async () => (await base44.entities.Project.filter({ id: projectId }))[0] || null,
  });
}

/** All projects the user can see (org-scoped for non-admins). */
export function useProjects() {
  const { scopeFilter, domain } = useSession();
  return useQuery({
    queryKey: ['m-projects', domain?.id || 'all'],
    queryFn: () => base44.entities.Project.filter(scopeFilter({}), '-created_date', 500),
  });
}

export function MobilePage({ title, subtitle, back, right, children }) {
  return (
    <div className="min-h-[calc(100vh-8rem)] pb-6" style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E2761 100%)' }}>
      <div className="px-4 pt-4 pb-3 flex items-start gap-2">
        {back && (
          <Link to={back} aria-label="Back" className="mt-0.5 -ml-1 p-1 rounded-lg" style={{ color: C.muted }}>
            <ChevronLeft className="w-6 h-6" />
          </Link>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold truncate" style={{ color: C.text }}>{title}</h1>
          {subtitle && <p className="text-sm truncate" style={{ color: C.muted }}>{subtitle}</p>}
        </div>
        {right}
      </div>
      <div className="px-4 space-y-4">{children}</div>
    </div>
  );
}

export function Card({ children, className = '', style, ...rest }) {
  return (
    <div className={`rounded-2xl p-4 ${className}`} style={{ background: C.card, border: `1px solid ${C.border}`, ...style }} {...rest}>
      {children}
    </div>
  );
}

export function LinkCard({ to, children, className = '' }) {
  return (
    <Link to={to} className={`block rounded-2xl p-4 active:scale-[0.99] transition-transform ${className}`} style={{ background: C.card, border: `1px solid ${C.border}` }}>
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">{children}</div>
        <ChevronRight className="w-5 h-5 shrink-0" style={{ color: C.faint }} />
      </div>
    </Link>
  );
}

export function SectionTitle({ children, action }) {
  return (
    <div className="flex items-center justify-between pt-2">
      <h2 className="text-xs font-semibold uppercase tracking-wide" style={{ color: C.muted }}>{children}</h2>
      {action}
    </div>
  );
}

export function RagDot({ rag, size = 10 }) {
  return <span className="inline-block rounded-full shrink-0" style={{ width: size, height: size, background: RAG[rag] || C.faint }} />;
}

export function Pill({ children, color = C.muted }) {
  return (
    <span className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap" style={{ color, background: `${color}22`, border: `1px solid ${color}44` }}>
      {children}
    </span>
  );
}

export function Stat({ label, value, color = C.text }) {
  return (
    <div className="rounded-xl p-3" style={{ background: 'rgba(15,23,42,0.6)', border: `1px solid ${C.border}` }}>
      <div className="text-lg font-semibold leading-tight" style={{ color }}>{value}</div>
      <div className="text-[11px] mt-0.5" style={{ color: C.muted }}>{label}</div>
    </div>
  );
}

export function Empty({ children }) {
  return <p className="text-sm text-center py-6" style={{ color: C.faint }}>{children}</p>;
}

export function Loading() {
  return (
    <div className="flex justify-center py-10">
      <div className="w-7 h-7 border-4 border-slate-600 border-t-teal-400 rounded-full animate-spin" />
    </div>
  );
}

/** Segmented control used for filters (Mine / Overdue / All, tabs, etc.). */
export function Segmented({ options, value, onChange }) {
  return (
    <div className="flex p-1 rounded-xl gap-1" style={{ background: 'rgba(15,23,42,0.6)', border: `1px solid ${C.border}` }}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className="flex-1 text-sm py-2 rounded-lg font-medium transition-colors"
            style={{ background: active ? C.accentSoft : 'transparent', color: active ? '#5eead4' : C.muted }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Native select styled for touch; picks the project the capture/review screens work on. */
export function ProjectSelect({ value, onChange }) {
  const { data: projects = [] } = useProjects();
  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl px-3 py-3 text-base"
      style={{ background: 'rgba(15,23,42,0.8)', border: `1px solid ${C.border}`, color: C.text }}
    >
      <option value="" disabled>Select a project…</option>
      {projects.map((p) => <option key={p.id} value={p.id}>{p.projectName}</option>)}
    </select>
  );
}

export const fieldStyle = { background: 'rgba(15,23,42,0.8)', border: `1px solid ${C.border}`, color: C.text };

/** Labelled form row. Use `group` for button groups/photo pickers: a <label> around several
 *  buttons would forward taps on the label text to the first button. */
export function Field({ label, children, group }) {
  const Tag = group ? 'div' : 'label';
  return (
    <Tag className="block" {...(group ? { role: 'group', 'aria-label': label } : {})}>
      <span className="block text-xs mb-1" style={{ color: C.muted }}>{label}</span>
      {children}
    </Tag>
  );
}

export function TextInput(props) {
  return <input {...props} className={`w-full rounded-xl px-3 py-3 text-base ${props.className || ''}`} style={{ ...fieldStyle, ...props.style }} />;
}

export function TextArea(props) {
  return <textarea rows={3} {...props} className={`w-full rounded-xl px-3 py-3 text-base ${props.className || ''}`} style={{ ...fieldStyle, ...props.style }} />;
}

export function Choice({ options, value, onChange, colors = {} }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = o === value;
        const col = colors[o] || C.accent;
        return (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            className="px-3 py-2 rounded-xl text-sm font-medium"
            style={{ background: active ? `${col}26` : 'rgba(15,23,42,0.6)', border: `1px solid ${active ? col : C.border}`, color: active ? col : C.muted }}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

export function PrimaryButton({ children, disabled, ...rest }) {
  return (
    <button
      type="button"
      disabled={disabled}
      {...rest}
      className="w-full py-3.5 rounded-xl text-base font-semibold disabled:opacity-50"
      style={{ background: C.accent, color: '#04201d' }}
    >
      {children}
    </button>
  );
}

/** Who "me" is for assignee matching: name and email, lower-cased. */
export function useMyNames() {
  const { user, platformUser } = useSession();
  return [platformUser?.full_name, user?.full_name, user?.email, platformUser?.email]
    .filter(Boolean)
    .map((s) => String(s).trim().toLowerCase());
}

export function myDisplayName(session) {
  return session.platformUser?.full_name || session.user?.full_name || session.user?.email || 'Unknown';
}
